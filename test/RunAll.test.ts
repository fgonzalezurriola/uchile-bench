import { describe, test } from "bun:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { Effect, Layer, Schema } from "effect"
import { BenchmarkTargetIdSchema } from "../src/domain/BenchmarkTarget.js"
import type { ResolvedTask } from "../src/domain/Task.js"
import { TaskIdSchema } from "../src/domain/Task.js"
import {
  DEFAULT_RUN_CONCURRENCY,
  parseRunConcurrency,
  runAll,
} from "../src/programs/runAll.js"
import {
  AgentRegistryService,
  type AgentRegistryService as AgentRegistryShape,
} from "../src/services/AgentRegistryService.js"
import {
  BenchmarkCatalogService,
  type BenchmarkCatalogService as BenchmarkCatalogShape,
} from "../src/services/BenchmarkCatalogService.js"
import { FileSystemServiceLive } from "../src/services/FileSystemService.js"
import {
  ProgressService,
  type ProgressService as ProgressShape,
} from "../src/services/ProgressService.js"

const makeTask = (root: string): ResolvedTask => ({
  id: Schema.decodeUnknownSync(TaskIdSchema)("course/task"),
  source: { _tag: "Standalone" },
  title: "Task",
  description: "Description",
  evaluation: "manual",
  notes: { languageSpecified: true, starterProvided: true },
  publicDir: "public",
  originalDir: "original",
  gradingDir: "grading",
  maxMinutes: 30,
  taskDir: path.join(root, "task"),
  publicAbsPath: path.join(root, "task", "public"),
  originalAbsPath: path.join(root, "task", "original"),
  gradingAbsPath: path.join(root, "task", "grading"),
})

describe("runAll", () => {
  test("parses batch concurrency from the environment", () => {
    assert.equal(parseRunConcurrency(undefined), DEFAULT_RUN_CONCURRENCY)
    assert.equal(parseRunConcurrency(""), DEFAULT_RUN_CONCURRENCY)
    assert.equal(parseRunConcurrency("6"), 6)
    assert.equal(parseRunConcurrency("0"), DEFAULT_RUN_CONCURRENCY)
    assert.equal(parseRunConcurrency("-1"), DEFAULT_RUN_CONCURRENCY)
    assert.equal(parseRunConcurrency("1.5"), DEFAULT_RUN_CONCURRENCY)
    assert.equal(parseRunConcurrency("many"), DEFAULT_RUN_CONCURRENCY)
  })

  test("persists discovered completed targets when no batch work remains", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "run-all-complete-"))
    try {
      const targetId = Schema.decodeUnknownSync(BenchmarkTargetIdSchema)("course/task")
      const task = makeTask(root)
      const target = {
        _tag: "StandaloneTask" as const,
        id: targetId,
        title: "Task",
        description: "Description",
        task,
      }
      const catalog: BenchmarkCatalogShape = {
        listTargets: () => Effect.succeed([target]),
        getTarget: () => Effect.succeed(target),
        getTask: () => Effect.succeed(task),
      }
      const agents: AgentRegistryShape = {
        listAgentIds: () => Effect.succeed(["agent"]),
        getAgentConfig: () =>
          Effect.succeed({
            id: "agent",
            type: "pi",
            model: "model",
            provider: "provider",
            thinking: "high",
            timeoutMinutes: 60,
            dockerImage: "image",
            envAllowlist: [],
          }),
        checkAvailability: () =>
          Effect.succeed({ agentId: "agent", available: true }),
        listAvailabilities: () =>
          Effect.succeed([{ agentId: "agent", available: true }]),
      }
      const progress: ProgressShape = {
        load: () => Effect.succeed({ completed: [], current: null }),
        save: () => Effect.void,
        markCompleted: () => Effect.void,
        markCurrent: () => Effect.void,
        clearCurrent: () => Effect.void,
        reset: () => Effect.void,
        getNextTarget: () => Effect.succeed(null),
      }
      const progressPath = path.join(root, "progress.json")
      const layer = Layer.mergeAll(
        FileSystemServiceLive,
        Layer.succeed(BenchmarkCatalogService, catalog),
        Layer.succeed(AgentRegistryService, agents),
        Layer.succeed(ProgressService, progress),
      )

      const result = await Effect.runPromise(
        runAll({
          agentId: "agent",
          runs: 1,
          completedTargetIds: [targetId],
          progressPath,
        }, path.join(root, "runs")).pipe(Effect.provide(layer)),
      )

      assert.deepEqual(result, [])
      assert.deepEqual(JSON.parse(readFileSync(progressPath, "utf8")), {
        completed: [targetId],
        current: null,
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
