import { describe, test } from "bun:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { Effect, Layer, Schema } from "effect"
import type { AgentConfig } from "../src/domain/Agent.js"
import { FileSystemError } from "../src/domain/Errors.js"
import type { Run, RunStatus } from "../src/domain/Run.js"
import { makeEmptySession } from "../src/domain/Session.js"
import { TaskIdSchema, type ResolvedTask } from "../src/domain/Task.js"
import { runTaskStage } from "../src/programs/runTaskStage.js"
import type { DockerRunResult } from "../src/services/DockerService.js"
import {
  AgentInvocationService,
  type AgentInvocationOptions,
} from "../src/services/AgentInvocationService.js"
import {
  EvidenceService,
  type EvidenceService as EvidenceServiceShape,
} from "../src/services/EvidenceService.js"
import {
  FileSystemService,
  FileSystemServiceLive,
} from "../src/services/FileSystemService.js"
import { RunStoreService } from "../src/services/RunStoreService.js"
import {
  SessionService,
  type SessionService as SessionServiceShape,
} from "../src/services/SessionService.js"

interface HarnessOptions {
  readonly solverResult?: DockerRunResult
  readonly failAfterEvidence?: boolean
  readonly failSession?: boolean
  readonly sessionTerminalError?: string
}

const agentConfig: AgentConfig = {
  id: "pi-test",
  type: "pi",
  model: "test-model",
  provider: "test-provider",
  thinking: "minimal",
  timeoutMinutes: 1,
  dockerImage: "test-image",
  envAllowlist: [],
}

const makeTask = (root: string): ResolvedTask => {
  const taskDir = path.join(root, "task")
  const publicAbsPath = path.join(taskDir, "public")
  const originalAbsPath = path.join(taskDir, "original")
  const gradingAbsPath = path.join(taskDir, "grading")
  mkdirSync(publicAbsPath, { recursive: true })
  mkdirSync(originalAbsPath, { recursive: true })
  mkdirSync(gradingAbsPath, { recursive: true })
  writeFileSync(path.join(publicAbsPath, "assignment.md"), "Implementa la tarea.")
  return {
    id: Schema.decodeUnknownSync(TaskIdSchema)("course/task"),
    source: { _tag: "Standalone" },
    title: "Task",
    description: "Task",
    evaluation: "manual",
    notes: { languageSpecified: true, starterProvided: true },
    publicDir: "public",
    originalDir: "original",
    gradingDir: "grading",
    maxMinutes: 1,
    taskDir,
    publicAbsPath,
    originalAbsPath,
    gradingAbsPath,
  }
}

const makeHarness = (options: HarnessOptions = {}) => {
  const root = mkdtempSync(path.join(os.tmpdir(), "run-lifecycle-"))
  const statuses: RunStatus[] = []
  let reviewCreations = 0
  let savedRun: Run | null = null

  const runStoreLayer = Layer.effect(
    RunStoreService,
    Effect.gen(function*() {
      const fs = yield* FileSystemService
      return {
        saveRun: (run: Run, runDir: string) =>
          Effect.gen(function*() {
            statuses.push(run.status)
            savedRun = run
            yield* fs.writeJson(path.join(runDir, "run.json"), run)
          }),
        loadRun: (runDir: string) => fs.readJson<Run>(path.join(runDir, "run.json")),
        listRunDirs: () => Effect.succeed([]),
      }
    }),
  ).pipe(Layer.provide(FileSystemServiceLive))

  const evidenceLayer = Layer.effect(
    EvidenceService,
    Effect.gen(function*() {
      const fs = yield* FileSystemService
      const service: EvidenceServiceShape = {
        preserveAgentPromptAddon: (_source, agentConfigPath, evidencePath, metadata) =>
          Effect.gen(function*() {
            yield* fs.writeFile(path.join(agentConfigPath, metadata.addonFile), "addon")
            yield* fs.writeFile(path.join(evidencePath, "agent-prompt.md"), "addon")
            return { ...metadata, addonSha256: "addon-hash" }
          }),
        collectBeforeEvidence: () => Effect.succeed({
          inputHash: "input-hash",
          evidence: { treeBefore: "tree.before.txt" },
        }),
        collectAfterEvidence: (workspacePath, _evidencePath, outputPath) =>
          Effect.gen(function*() {
            yield* fs.copyDir(workspacePath, outputPath)
            if (options.failAfterEvidence === true) {
              return yield* Effect.fail(new FileSystemError({
                path: outputPath,
                reason: "post Evidence failed",
              }))
            }
            return {
              outputHash: "output-hash",
              evidence: { treeAfter: "tree.after.txt" },
            }
          }),
        createReviewFiles: (reviewPath) =>
          Effect.gen(function*() {
            reviewCreations += 1
            yield* fs.writeFile(path.join(reviewPath, "review.md"), "# Review\n")
            yield* fs.writeJson(path.join(reviewPath, "score.json"), {})
          }),
      }
      return service
    }),
  ).pipe(Layer.provide(FileSystemServiceLive))

  const sessionLayer = Layer.effect(
    SessionService,
    Effect.gen(function*() {
      const fs = yield* FileSystemService
      const withTerminalError = (
        session: ReturnType<typeof makeEmptySession>,
      ): ReturnType<typeof makeEmptySession> =>
        options.sessionTerminalError === undefined
          ? session
          : {
              ...session,
              turns: [
                ...session.turns,
                {
                  index: session.turns.length,
                  role: "assistant",
                  error: { message: options.sessionTerminalError },
                },
              ],
              retries: [
                ...session.retries,
                {
                  attempt: 3,
                  success: false,
                  finalError: options.sessionTerminalError,
                },
              ],
              metrics: {
                ...session.metrics,
                totalTurns: session.metrics.totalTurns + 1,
                totalErrors: session.metrics.totalErrors + 1,
                totalRetries: session.metrics.totalRetries + 1,
              },
            }
      const service: SessionServiceShape = {
        createAndSave: (run, _evidenceDir, sessionDir, prompt) =>
          Effect.gen(function*() {
            if (options.failSession === true) {
              return yield* Effect.fail(new FileSystemError({
                path: sessionDir,
                reason: "Session failed",
              }))
            }
            const session = makeEmptySession(
              run.agent.adapter,
              run.agent.model ?? "unknown",
              run.runId,
              run.taskId,
              run.agentId,
              prompt,
              run.startedAt,
              run.finishedAt,
            )
            const savedSession = withTerminalError(session)
            yield* fs.writeJson(path.join(sessionDir, "session.compact.json"), savedSession)
            yield* fs.writeFile(path.join(sessionDir, "session.html"), "<!doctype html>\n")
            yield* fs.writeJson(path.join(sessionDir, "metrics.json"), savedSession.metrics)
            return savedSession
          }),
        createAndSaveFromFile: (metadata, _rawEventsPath, sessionDir) =>
          Effect.gen(function*() {
            if (options.failSession === true) {
              return yield* Effect.fail(new FileSystemError({
                path: sessionDir,
                reason: "Session failed",
              }))
            }
            const session = makeEmptySession(
              metadata.adapter,
              metadata.model,
              metadata.runId,
              metadata.taskId,
              metadata.agentId,
              metadata.prompt,
              metadata.startedAt,
              metadata.finishedAt,
            )
            const savedSession = withTerminalError(session)
            yield* fs.writeJson(path.join(sessionDir, "session.compact.json"), savedSession)
            yield* fs.writeFile(path.join(sessionDir, "session.html"), "<!doctype html>\n")
            yield* fs.writeJson(path.join(sessionDir, "metrics.json"), savedSession.metrics)
            return { session: savedSession, htmlGenerated: true, compactBytes: 0, htmlBytes: 0 }
          }),
      }
      return service
    }),
  ).pipe(Layer.provide(FileSystemServiceLive))

  const invocationLayer = Layer.succeed(AgentInvocationService, {
    invoke: <E, R>(invocation: AgentInvocationOptions<E, R>) =>
      Effect.gen(function*() {
        const preparation = {
          agentId: agentConfig.id,
          adapter: agentConfig.type,
          model: agentConfig.model,
          image: agentConfig.dockerImage,
          environmentId: null,
          agentConfigJson: "{}",
          command: ["pi"],
          persistedCommand: "pi",
          timeoutMs: 60_000,
        }
        if (invocation.beforeExecute !== undefined) {
          yield* invocation.beforeExecute(preparation)
        }
        const workspace = invocation.mounts.find(
          (mount) => mount.containerPath === "/workspace",
        )
        if (workspace !== undefined) {
          writeFileSync(path.join(workspace.hostPath, "solution.txt"), "solver output")
        }
        const result = options.solverResult ?? {
          exitCode: 0,
          stdout: "{\"type\":\"message_end\",\"message\":{\"role\":\"assistant\",\"usage\":{\"input\":1,\"output\":1}}}\n",
          stderr: "",
          timedOut: false,
        }
        mkdirSync(path.dirname(invocation.capture.eventsPath), { recursive: true })
        writeFileSync(invocation.capture.eventsPath, result.stdout)
        mkdirSync(path.dirname(invocation.capture.stderrPath), { recursive: true })
        writeFileSync(invocation.capture.stderrPath, result.stderr)
        return {
          ...result,
          eventsPath: invocation.capture.eventsPath,
          stderrPath: invocation.capture.stderrPath,
          agentConfigJson: preparation.agentConfigJson,
          agentId: preparation.agentId,
          adapter: preparation.adapter,
          model: preparation.model,
          image: preparation.image,
          environmentId: preparation.environmentId,
          command: preparation.command,
          persistedCommand: preparation.persistedCommand,
        }
      }),
  })

  const layer = Layer.mergeAll(
    FileSystemServiceLive,
    runStoreLayer,
    evidenceLayer,
    sessionLayer,
    invocationLayer,
  )

  const executeRun = (sequence = 1) =>
    runTaskStage({
      task: makeTask(root),
      agentId: agentConfig.id,
      sequence,
      prompt: "Resuelve la tarea.",
      runParentDir: path.join(root, "runs"),
      input: { _tag: "TaskPublic" },
      context: { _tag: "Standalone" },
      executionEnvironment: {
        _tag: "AgentDefault",
        environmentId: null,
        agentConfig,
      },
    }).pipe(Effect.provide(layer))

  return {
    root,
    statuses,
    execute: executeRun(),
    executeRun,
    reviewCreations: () => reviewCreations,
    savedRun: () => savedRun,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  }
}

const capture = <A, E>(effect: Effect.Effect<A, E>) =>
  effect.pipe(
    Effect.map((value) => ({ _tag: "Success" as const, value })),
    Effect.catch((error) => Effect.succeed({ _tag: "Failure" as const, error })),
  )

describe("Run lifecycle", () => {
  test("completes with one terminal state and one Manual Review", async () => {
    const harness = makeHarness()
    try {
      const outcome = await Effect.runPromise(capture(harness.execute))
      assert.equal(outcome._tag, "Success")
      if (outcome._tag !== "Success") return
      assert.equal(outcome.value.status, "completed")
      assert.ok(outcome.value.finishedAt)
      assert.equal(existsSync(path.join(outcome.value.paths.evidence, "agent.stdout.log")), false)
      assert.equal(existsSync(path.join(outcome.value.paths.evidence, "agent.events.jsonl")), false)
      assert.equal(existsSync(path.join(outcome.value.paths.agentHome)), false)
      assert.equal(existsSync(path.join(outcome.value.paths.session, "session.compact.json")), true)
      assert.equal(existsSync(path.join(outcome.value.paths.session, "session.html")), true)
      assert.equal(harness.reviewCreations(), 1)
      assert.deepEqual(
        harness.statuses.filter((status) => status === "completed" || status === "failed"),
        ["completed"],
      )
    } finally {
      harness.cleanup()
    }
  })

  test("reserves distinct Run IDs under concurrent starts", async () => {
    const harness = makeHarness()
    try {
      const outcome = await Effect.runPromise(
        Effect.all([harness.executeRun(), harness.executeRun()], {
          concurrency: 2,
        }),
      )
      const runIds = outcome.map((run) => run.runId).sort()
      assert.deepEqual(runIds, [
        `${runIds[0]?.slice(0, 10)}_0001_${agentConfig.id}`,
        `${runIds[0]?.slice(0, 10)}_0002_${agentConfig.id}`,
      ])
      assert.notEqual(outcome[0]?.paths.input, outcome[1]?.paths.input)
    } finally {
      harness.cleanup()
    }
  })

  test("timeout and non-zero exit preserve Output and finish failed", async () => {
    for (const solverResult of [
      { exitCode: null, stdout: "", stderr: "timeout", timedOut: true },
      { exitCode: 2, stdout: "", stderr: "bad exit", timedOut: false },
    ] satisfies ReadonlyArray<DockerRunResult>) {
      const harness = makeHarness({ solverResult })
      try {
        const outcome = await Effect.runPromise(capture(harness.execute))
        assert.equal(outcome._tag, "Failure")
        const run = harness.savedRun()
        assert.ok(run)
        if (run === null) return
        assert.equal(run.status, "failed")
        assert.ok(run.finishedAt)
        assert.equal(readFileSync(path.join(run.paths.output, "solution.txt"), "utf8"), "solver output")
        assert.equal(harness.reviewCreations(), 1)
        assert.deepEqual(
          harness.statuses.filter((status) => status === "completed" || status === "failed"),
          ["failed"],
        )
      } finally {
        harness.cleanup()
      }
    }
  })

  test("post Evidence failure preserves Output and prevents completion", async () => {
    const harness = makeHarness({ failAfterEvidence: true })
    try {
      const outcome = await Effect.runPromise(capture(harness.execute))
      assert.equal(outcome._tag, "Failure")
      const run = harness.savedRun()
      assert.ok(run)
      if (run === null) return
      assert.equal(run.status, "failed")
      assert.equal(readFileSync(path.join(run.paths.output, "solution.txt"), "utf8"), "solver output")
      assert.equal(harness.reviewCreations(), 1)
    } finally {
      harness.cleanup()
    }
  })

  test("Session failure is terminal and never writes completed", async () => {
    const harness = makeHarness({ failSession: true })
    try {
      const outcome = await Effect.runPromise(capture(harness.execute))
      assert.equal(outcome._tag, "Failure")
      assert.equal(harness.reviewCreations(), 1)
      assert.deepEqual(
        harness.statuses.filter((status) => status === "completed" || status === "failed"),
        ["failed"],
      )
    } finally {
      harness.cleanup()
    }
  })

  test("terminal provider error in compact session fails the Run", async () => {
    const harness = makeHarness({ sessionTerminalError: "Connection error." })
    try {
      const outcome = await Effect.runPromise(capture(harness.execute))
      assert.equal(outcome._tag, "Failure")
      const run = harness.savedRun()
      assert.ok(run)
      if (run === null) return
      assert.equal(run.status, "failed")
      assert.match(run.error ?? "", /Connection error/)
      assert.equal(harness.reviewCreations(), 1)
      assert.deepEqual(
        harness.statuses.filter((status) => status === "completed" || status === "failed"),
        ["failed"],
      )
    } finally {
      harness.cleanup()
    }
  })
})
