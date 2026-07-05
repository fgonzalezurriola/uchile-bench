import { describe, test } from "bun:test"
import assert from "node:assert/strict"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import os from "node:os"
import path from "node:path"
import { Effect, Layer, Schema } from "effect"
import {
  getExperimentStatus,
  getProgress,
  inspectRun,
  listBenchmarkTargets,
  rebuildSession,
  runDoctor,
  runExperiment,
} from "../src/application/BenchmarkOperations.js"
import { BenchmarkTargetIdSchema } from "../src/domain/BenchmarkTarget.js"
import { makeRun } from "../src/domain/Run.js"
import { TaskIdSchema, type ResolvedTask } from "../src/domain/Task.js"
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
  HostDiscoveryService,
  type HostDiscoveryService as HostDiscoveryShape,
} from "../src/services/HostDiscoveryService.js"
import {
  ProgressService,
  type ProgressService as ProgressShape,
} from "../src/services/ProgressService.js"
import {
  RunStoreServiceLive,
} from "../src/services/RunStoreService.js"
import { SessionServiceLive } from "../src/services/SessionService.js"

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

const makeLayer = (root: string) => {
  const task = makeTask(root)
  const target = {
    _tag: "StandaloneTask" as const,
    id: Schema.decodeUnknownSync(BenchmarkTargetIdSchema)("course/task"),
    title: "Task",
    description: "Description",
    task,
  }
  const catalog: BenchmarkCatalogShape = {
    listTargets: () => Effect.succeed([target]),
    getTarget: () => Effect.succeed(target),
    getTask: () => Effect.succeed(task),
  }
  const progress: ProgressShape = {
    load: () => Effect.succeed({ completed: [target.id], current: target.id }),
    save: () => Effect.void,
    markCompleted: () => Effect.void,
    markCurrent: () => Effect.void,
    clearCurrent: () => Effect.void,
    reset: () => Effect.void,
    getNextTarget: () => Effect.succeed(null),
  }
  const agents: AgentRegistryShape = {
    listAgentIds: () => Effect.succeed(["agent"]),
    getAgentConfig: (agentId) =>
      Effect.succeed({
        id: agentId,
        type: "pi",
        model: "model",
        provider: "provider",
        thinking: "high",
        timeoutMinutes: 60,
        dockerImage: "image",
        envAllowlist: [],
      }),
    checkAvailability: () => Effect.succeed({ agentId: "agent", available: true }),
    listAvailabilities: () =>
      Effect.succeed([{ agentId: "agent", available: true }]),
  }
  const host: HostDiscoveryShape = {
    checkDocker: () => Effect.succeed({ name: "Docker", available: true }),
    checkPi: () => Effect.succeed({ name: "Pi", available: true }),
    checkBun: () => Effect.succeed({ name: "Bun", available: true }),
    checkAll: () =>
      Effect.succeed([{ name: "Docker", available: true }]),
  }
  const base = FileSystemServiceLive
  const runStore = RunStoreServiceLive.pipe(Layer.provide(base))
  const sessions = SessionServiceLive.pipe(Layer.provide(base))
  return {
    target,
    layer: Layer.mergeAll(
      base,
      runStore,
      sessions,
      Layer.succeed(BenchmarkCatalogService, catalog),
      Layer.succeed(ProgressService, progress),
      Layer.succeed(AgentRegistryService, agents),
      Layer.succeed(HostDiscoveryService, host),
    ),
  }
}

const writeRunFixture = (root: string) => {
  const runDir = path.join(root, "runs", "course", "task", "run-1")
  const paths = {
    input: path.join(runDir, "00-input"),
    workspace: path.join(runDir, "01-workspace"),
    agentHome: path.join(runDir, "02-agent-home"),
    agentConfig: path.join(runDir, "03-agent-config"),
    output: path.join(runDir, "04-output"),
    evidence: path.join(runDir, "05-evidence"),
    review: path.join(runDir, "06-review"),
    session: path.join(runDir, "07-session"),
  }
  for (const directory of Object.values(paths)) mkdirSync(directory, { recursive: true })
  const run = {
    ...makeRun("run-1", "course/task", "agent", paths),
    status: "completed" as const,
    finishedAt: "2026-06-27T00:00:00.000Z",
    agent: { adapter: "pi", model: "test-model", command: null },
  }
  writeFileSync(path.join(runDir, "run.json"), JSON.stringify(run))
  writeFileSync(path.join(paths.review, "score.json"), "{}")
  writeFileSync(path.join(paths.session, "session.compact.json"), "{}")
  writeFileSync(path.join(paths.session, "metrics.json"), "{}")
  const aiReview = path.join(paths.review, "ai", "judge", "review-1")
  mkdirSync(aiReview, { recursive: true })
  writeFileSync(path.join(aiReview, "judge-run.json"), JSON.stringify({
    status: "completed",
    grade: 6.5,
    confidence: "high",
  }))
  return { runDir, run, paths }
}

describe("Benchmark application operations", () => {
  test("returns structured Target and Progress data for CLI and TUI", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "operations-"))
    try {
      const harness = makeLayer(root)
      const targets = await Effect.runPromise(
        listBenchmarkTargets().pipe(Effect.provide(harness.layer)),
      )
      const progress = await Effect.runPromise(
        getProgress().pipe(Effect.provide(harness.layer)),
      )
      assert.equal(targets[0]?.id, harness.target.id)
      assert.equal(progress.items[0]?.target.id, harness.target.id)
      assert.equal(progress.completedCount, 1)
      assert.equal(progress.items[0]?.current, true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("inspects a Run and aggregates AI Reviews without console rendering", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "operations-"))
    try {
      const fixture = writeRunFixture(root)
      const harness = makeLayer(root)
      const inspection = await Effect.runPromise(
        inspectRun("run-1", path.join(root, "runs")).pipe(
          Effect.provide(harness.layer),
        ),
      )
      assert.equal(inspection.runDir, fixture.runDir)
      assert.equal(inspection.run.runId, fixture.run.runId)
      assert.equal(inspection.manualReviewExists, true)
      assert.equal(inspection.session.compactJsonExists, true)
      assert.deepEqual(inspection.aiReviews.map((review) => ({
        agentId: review.agentId,
        status: review.status,
        grade: review.grade,
      })), [{ agentId: "judge", status: "completed", grade: 6.5 }])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("rebuilds retained session artifacts when a raw event stream exists", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "operations-"))
    try {
      const fixture = writeRunFixture(root)
      rmSync(path.join(fixture.paths.session, "session.compact.json"), { force: true })
      rmSync(path.join(fixture.paths.session, "metrics.json"), { force: true })
      writeFileSync(path.join(fixture.paths.evidence, "prompt.txt"), "Solve the task")
      writeFileSync(path.join(fixture.paths.evidence, "agent.events.jsonl"), `${JSON.stringify({
        type: "message_end",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "completed" }],
          usage: { input: 4, output: 2, totalTokens: 6 },
        },
      })}\n`)
      const harness = makeLayer(root)
      const result = await Effect.runPromise(
        rebuildSession("run-1", path.join(root, "runs")).pipe(
          Effect.provide(harness.layer),
        ),
      )

      assert.equal(result.status, "rebuilt")
      if (result.status !== "rebuilt") assert.fail("expected rebuilt session")
      assert.equal(result.session.metrics.totalTurns, 1)
      assert.equal(result.session.metrics.usage.totalTokens, 6)
      assert.equal(existsSync(path.join(fixture.paths.session, "session.compact.json")), true)
      assert.equal(existsSync(path.join(fixture.paths.session, "metrics.json")), true)
      assert.equal(existsSync(path.join(fixture.paths.session, "session.html")), true)
      const compact = JSON.parse(
        readFileSync(path.join(fixture.paths.session, "session.compact.json"), "utf8"),
      ) as { readonly prompt: string; readonly metrics: { readonly totalTurns: number } }
      assert.equal(compact.prompt, "Solve the task")
      assert.equal(compact.metrics.totalTurns, 1)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("reports an already published session when its raw stream is unavailable", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "operations-"))
    try {
      const fixture = writeRunFixture(root)
      const harness = makeLayer(root)
      const result = await Effect.runPromise(
        rebuildSession("run-1", path.join(root, "runs")).pipe(
          Effect.provide(harness.layer),
        ),
      )

      assert.equal(result.status, "already-published")
      if (result.status !== "already-published") {
        assert.fail("expected already-published session")
      }
      assert.equal(result.rawAvailable, false)
      assert.equal(result.compactJsonPath, path.join(
        fixture.paths.session,
        "session.compact.json",
      ))
      assert.equal(result.metricsPath, path.join(fixture.paths.session, "metrics.json"))
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("fails precisely when neither raw nor a complete published session exists", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "operations-"))
    try {
      const fixture = writeRunFixture(root)
      rmSync(path.join(fixture.paths.session, "session.compact.json"), { force: true })
      rmSync(path.join(fixture.paths.session, "metrics.json"), { force: true })
      const harness = makeLayer(root)
      const outcome = await Effect.runPromise(
        rebuildSession("run-1", path.join(root, "runs")).pipe(
          Effect.provide(harness.layer),
          Effect.flip,
        ),
      )

      assert.equal(outcome._tag, "SessionRawUnavailableError")
      assert.equal(outcome.runId, "run-1")
      assert.match(outcome.message, /transient raw Pi log is unavailable/)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("returns a tagged RunNotFoundError", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "operations-"))
    try {
      const harness = makeLayer(root)
      const outcome = await Effect.runPromise(
        inspectRun("missing", path.join(root, "runs")).pipe(
          Effect.provide(harness.layer),
          Effect.flip,
        ),
      )
      assert.equal(outcome._tag, "RunNotFoundError")
      assert.equal(outcome.runId, "missing")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("returns Doctor data without presentation concerns", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "operations-"))
    try {
      const harness = makeLayer(root)
      const result = await Effect.runPromise(
        runDoctor().pipe(Effect.provide(harness.layer)),
      )
      assert.equal(result.hostChecks[0]?.name, "Docker")
      assert.equal(result.agentAvailabilities[0]?.agentId, "agent")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("experiment run infers completed cumulative targets from sequence records", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "operations-"))
    try {
      const stageTask = {
        ...makeTask(root),
        id: Schema.decodeUnknownSync(TaskIdSchema)("CC3501/t01"),
        source: {
          _tag: "CumulativeStage" as const,
          sequenceId: "CC3501",
          stageKey: "t01",
          stageIndex: 1,
        },
      }
      const target = {
        _tag: "CumulativeSequence" as const,
        id: Schema.decodeUnknownSync(BenchmarkTargetIdSchema)("CC3501"),
        title: "CC3501",
        description: "Cumulative sequence",
        sequenceDir: path.join(root, "tasks", "cumulative", "CC3501"),
        stages: [{ key: "t01", index: 1, task: stageTask }] as const,
      }
      const catalog: BenchmarkCatalogShape = {
        listTargets: () => Effect.succeed([target]),
        getTarget: () => Effect.succeed(target),
        getTask: () => Effect.succeed(stageTask),
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
      const agents: AgentRegistryShape = {
        listAgentIds: () => Effect.succeed(["pi-minimax-m3-high-api"]),
        getAgentConfig: (agentId) =>
          Effect.succeed({
            id: agentId,
            type: "pi",
            model: "MiniMax-M3",
            provider: "minimax",
            thinking: "high",
            timeoutMinutes: 60,
            dockerImage: "image",
            envAllowlist: [],
          }),
        checkAvailability: () =>
          Effect.succeed({
            agentId: "pi-minimax-m3-high-api",
            available: true,
          }),
        listAvailabilities: () =>
          Effect.succeed([{
            agentId: "pi-minimax-m3-high-api",
            available: true,
          }]),
      }
      const runsRoot = path.join(root, "runs")
      const sequenceRoot = path.join(
        runsRoot,
        "cumulative",
        "CC3501",
        "sequence-1",
      )
      mkdirSync(sequenceRoot, { recursive: true })
      writeFileSync(
        path.join(sequenceRoot, "sequence-run.json"),
        JSON.stringify({
          sequenceRunId: "sequence-1",
          targetId: "CC3501",
          agentId: "pi-minimax-m3-high-api",
          environmentId: "cc3501",
          status: "completed",
          startedAt: "2026-07-01T00:00:00.000Z",
          finishedAt: "2026-07-01T00:01:00.000Z",
          stages: [{
            index: 1,
            stageKey: "t01",
            taskId: "CC3501/t01",
            status: "completed",
            runId: "run-1",
            runDir: "/tmp/run-1",
            outputPath: "/tmp/run-1/04-output",
            inputSource: { _tag: "TaskPublic" },
            error: null,
          }],
        }),
      )
      const base = FileSystemServiceLive
      const layer = Layer.mergeAll(
        base,
        RunStoreServiceLive.pipe(Layer.provide(base)),
        Layer.succeed(BenchmarkCatalogService, catalog),
        Layer.succeed(ProgressService, progress),
        Layer.succeed(AgentRegistryService, agents),
      )

      const result = await Effect.runPromise(
        runExperiment("minimax", {
          runs: 1,
          prefix: "CC3501",
          concurrency: 1,
        }, runsRoot).pipe(Effect.provide(layer)),
      )

      assert.deepEqual(result, [])
      assert.deepEqual(JSON.parse(readFileSync(path.join(
        runsRoot,
        "progress",
        "experiments",
        "pi-minimax-m3-high-api",
        "CC3501.json",
      ), "utf8")), {
        completed: ["CC3501"],
        current: null,
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("experiment status orders runs by course identifier and then task key", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "operations-"))
    try {
      const harness = makeLayer(root)
      const runsRoot = path.join(root, "runs")
      const runFixtures = [
        {
          runId: "run-t02",
          taskId: "CC4302/t02",
          startedAt: "2026-07-05T00:00:00.000Z",
        },
        {
          runId: "run-t01-b",
          taskId: "CC4302/t01",
          startedAt: "2026-07-05T00:01:00.000Z",
        },
        {
          runId: "run-t01-a",
          taskId: "CC3301/t01",
          startedAt: "2026-07-05T00:02:00.000Z",
        },
      ]

      for (const fixture of runFixtures) {
        const runDir = path.join(runsRoot, ...fixture.taskId.split("/"), fixture.runId)
        const paths = {
          input: path.join(runDir, "00-input"),
          workspace: path.join(runDir, "01-workspace"),
          agentHome: path.join(runDir, "02-agent-home"),
          agentConfig: path.join(runDir, "03-agent-config"),
          output: path.join(runDir, "04-output"),
          evidence: path.join(runDir, "05-evidence"),
          review: path.join(runDir, "06-review"),
          session: path.join(runDir, "07-session"),
        }
        for (const directory of Object.values(paths)) {
          mkdirSync(directory, { recursive: true })
        }
        writeFileSync(path.join(runDir, "run.json"), JSON.stringify({
          ...makeRun(fixture.runId, fixture.taskId, "agent", paths),
          status: "completed",
          startedAt: fixture.startedAt,
          finishedAt: fixture.startedAt,
          agent: { adapter: "pi", model: "test-model", command: null },
        }))
      }

      const status = await Effect.runPromise(
        getExperimentStatus("agent", {}, runsRoot).pipe(
          Effect.provide(harness.layer),
        ),
      )

      assert.deepEqual(
        status.runs.map((item) => [item.taskId, item.runId]),
        [
          ["CC3301/t01", "run-t01-a"],
          ["CC4302/t01", "run-t01-b"],
          ["CC4302/t02", "run-t02"],
        ],
      )
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
