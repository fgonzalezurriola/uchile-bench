import { Clock, DateTime, Effect, Option } from "effect"
import path from "node:path"
import {
  SOLVER_PURPOSE,
  type AgentRuntimeOptions,
} from "../adapters/AgentAdapter.js"
import {
  AgentExecutionError,
  BenchmarkConfigError,
  TaskStageRunError,
} from "../domain/Errors.js"
import type { ResolvedExecutionEnvironment } from "../domain/Environment.js"
import type { TaskExecutionContext } from "../domain/EvaluationContext.js"
import { EvidenceFile, TransientSessionFile } from "../domain/Evidence.js"
import type {
  Run,
  RunEvidence,
  RunHashes,
  RunMetrics,
  RunStatus,
} from "../domain/Run.js"
import { sessionTerminalError } from "../domain/Session.js"
import type { ResolvedTask } from "../domain/Task.js"
import { AgentInvocationService } from "../services/AgentInvocationService.js"
import { FileSystemService } from "../services/FileSystemService.js"
import { RunStoreService } from "../services/RunStoreService.js"
import { SessionService } from "../services/SessionService.js"
import { collectAfterEvidence, collectBeforeEvidence } from "./collectEvidence.js"
import { createReview } from "./createReview.js"
import { prepareRun, type RunInput } from "./prepareRun.js"

/** Options required to execute one standalone Task or Cumulative Stage. */
export interface RunTaskStageOptions {
  readonly task: ResolvedTask
  readonly agentId: string
  readonly sequence: number
  readonly prompt: string
  readonly runParentDir: string
  readonly input: RunInput
  readonly context: TaskExecutionContext
  readonly executionEnvironment: ResolvedExecutionEnvironment
  readonly timeoutMs?: number
}

interface RunPatch {
  readonly startedAt?: string | null
  readonly finishedAt?: string | null
  readonly durationSeconds?: number | null
  readonly hashes?: Partial<RunHashes>
  readonly evidence?: Partial<RunEvidence>
  readonly agent?: Run["agent"]
  readonly metrics?: Partial<RunMetrics>
  readonly error?: string | null
}

const solverRuntime: AgentRuntimeOptions = {
  purpose: SOLVER_PURPOSE,
}

const currentIso = Effect.fnUntraced(function*() {
  const now = yield* Clock.currentTimeMillis
  return DateTime.formatIso(DateTime.makeUnsafe(now))
})

const datePart = (epochMillis: number): string =>
  DateTime.formatIso(DateTime.makeUnsafe(epochMillis)).slice(0, 10)

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const isValidTransition = (from: RunStatus, to: RunStatus): boolean => {
  if (to === "failed") return from !== "completed" && from !== "cancelled"

  switch (from) {
    case "pending":
      return to === "preparing"
    case "preparing":
      return to === "copying-input"
    case "copying-input":
      return to === "collecting-before-evidence"
    case "collecting-before-evidence":
      return to === "running-agent"
    case "running-agent":
      return to === "collecting-after-evidence"
    case "collecting-after-evidence":
      return to === "exporting-output"
    case "exporting-output":
      return to === "creating-review"
    case "creating-review":
      return to === "completed"
    case "completed":
    case "failed":
    case "cancelled":
      return false
  }
}

const mergeRun = (run: Run, patch: RunPatch, status = run.status): Run => ({
  ...run,
  ...patch,
  status,
  hashes: { ...run.hashes, ...patch.hashes },
  evidence: { ...run.evidence, ...patch.evidence },
  metrics: { ...run.metrics, ...patch.metrics },
})

const reserveRunIdentity = Effect.fnUntraced(function*(
  runParentDir: string,
  agentId: string,
  initialSequence: number,
) {
  const fs = yield* FileSystemService
  const now = yield* Clock.currentTimeMillis
  const date = datePart(now)
  let sequence = initialSequence
  yield* fs.mkdirRecursive(runParentDir)

  while (true) {
    const runId = `${date}_${String(sequence).padStart(4, "0")}_${agentId}`
    const runDir = `${runParentDir}/${runId}`
    const exists = yield* fs.exists(runDir)
    if (!exists) {
      const reserved = yield* fs.mkdir(runDir).pipe(
        Effect.as(true),
        Effect.catch((error) =>
          fs.exists(runDir).pipe(
            Effect.flatMap((existsAfterFailure) =>
              existsAfterFailure ? Effect.succeed(false) : Effect.fail(error)
            ),
          )
        ),
      )
      if (reserved) return { runId, runDir }
    }
    sequence += 1
  }
})

/**
 * Own the complete lifecycle of one Task within a Run. All mandatory
 * artifacts, Manual Review initialization, and the sole terminal transition
 * are coordinated here.
 */
export const runTaskStage = Effect.fnUntraced(function*(
  options: RunTaskStageOptions,
) {
  const runStore = yield* RunStoreService
  const fs = yield* FileSystemService
  const invocation = yield* AgentInvocationService
  const sessions = yield* SessionService
  const agentConfig = options.executionEnvironment.agentConfig

  const identity = yield* reserveRunIdentity(
    options.runParentDir,
    options.agentId,
    options.sequence,
  )
  const prepared = yield* prepareRun(
    options.task,
    agentConfig,
    identity.runId,
    options.runParentDir,
    options.input,
    options.executionEnvironment.environmentId,
  )
  const runDir = prepared.runDir
  let currentRun = prepared.run

  const persistPatch = Effect.fnUntraced(function*(patch: RunPatch) {
    currentRun = mergeRun(currentRun, patch)
    yield* runStore.saveRun(currentRun, runDir)
  })

  const transition = Effect.fnUntraced(function*(
    status: RunStatus,
    patch: RunPatch = {},
  ) {
    if (!isValidTransition(currentRun.status, status)) {
      return yield* Effect.fail(
        new BenchmarkConfigError({
          reason: `Invalid Run transition: ${currentRun.status} -> ${status}`,
        }),
      )
    }
    currentRun = mergeRun(currentRun, patch, status)
    yield* runStore.saveRun(currentRun, runDir)
  })

  const executeLifecycle = Effect.gen(function*() {
    yield* transition("preparing")
    yield* transition("copying-input")

    const transientSessionDir = path.join(
      currentRun.paths.evidence,
      TransientSessionFile.DIRECTORY,
    )
    const transientEventsPath = path.join(
      transientSessionDir,
      TransientSessionFile.EVENTS_JSONL,
    )
    const agentStderrPath = `${currentRun.paths.evidence}/${EvidenceFile.AGENT_STDERR}`
    const result = yield* invocation.invoke({
      agent: {
        _tag: "ResolvedExecutionEnvironment",
        executionEnvironment: options.executionEnvironment,
      },
      prompt: options.prompt,
      mounts: [
        {
          hostPath: path.resolve(currentRun.paths.workspace),
          containerPath: "/workspace",
        },
        ...(options.context._tag === "CumulativeStage"
          ? [
              {
                hostPath: path.resolve(currentRun.paths.input),
                containerPath: "/baseline",
                readOnly: true,
              },
            ]
          : []),
      ],
      workDir: "/workspace",
      agentHomePath: currentRun.paths.agentHome,
      agentConfigPath: currentRun.paths.agentConfig,
      provenancePath: currentRun.paths.evidence,
      capture: {
        eventsPath: transientEventsPath,
        stderrPath: agentStderrPath,
      },
      runtime: solverRuntime,
      ...(options.timeoutMs === undefined
        ? {}
        : { container: { timeoutMs: options.timeoutMs } }),
      beforeExecute: (preparedInvocation) =>
        Effect.gen(function*() {
          yield* transition("collecting-before-evidence")
          const before = yield* collectBeforeEvidence(
            currentRun,
            options.prompt,
            preparedInvocation.agentConfigJson,
          )
          yield* persistPatch({
            hashes: { inputHash: before.inputHash },
            evidence: before.evidence,
          })
          yield* transition("running-agent", {
            startedAt: yield* currentIso(),
            agent: {
              adapter: preparedInvocation.adapter,
              model: preparedInvocation.model,
              command: preparedInvocation.persistedCommand,
            },
          })
        }),
    })
    yield* persistPatch({
      evidence: {
        stdoutLog: null,
        stderrLog: EvidenceFile.AGENT_STDERR,
        eventsJsonl: null,
      },
    })

    const solverFailureReason = result.timedOut
      ? "Solver timed out"
      : result.exitCode !== null && result.exitCode !== 0
        ? `Solver exited with code ${result.exitCode}: ${result.stderr.slice(0, 500)}`
        : null

    yield* transition("collecting-after-evidence")
    const after = yield* collectAfterEvidence(currentRun)
    yield* persistPatch({
      hashes: { outputHash: after.outputHash },
      evidence: after.evidence,
    })

    yield* transition("exporting-output")
    const sessionFinishedAt = yield* currentIso()
    const publishedSession = yield* sessions.createAndSaveFromFile(
      {
        adapter: result.adapter,
        model: result.model,
        runId: currentRun.runId,
        taskId: currentRun.taskId,
        agentId: currentRun.agentId,
        startedAt: currentRun.startedAt,
        finishedAt: sessionFinishedAt,
        prompt: options.prompt,
        eventSource: "Pi --mode json (transient)",
      },
      transientEventsPath,
      currentRun.paths.session,
    ).pipe(
      Effect.tapError((error) =>
        Effect.gen(function*() {
          yield* fs.writeJson(
            path.join(transientSessionDir, TransientSessionFile.COMPACTION_ERROR),
            {
              version: 1,
              sourcePath: transientEventsPath,
              sessionPath: currentRun.paths.session,
              error: errorMessage(error),
            },
          ).pipe(Effect.ignore)
          yield* persistPatch({
            evidence: {
              eventsJsonl: `${TransientSessionFile.DIRECTORY}/${TransientSessionFile.EVENTS_JSONL}`,
            },
          }).pipe(Effect.ignore)
        }),
      ),
    )
    const session = publishedSession.session
    yield* fs.removePath(transientSessionDir)
    yield* fs.removePath(currentRun.paths.agentHome)
    yield* persistPatch({
      metrics: {
        totalTurns: session.metrics.totalTurns,
        totalToolCalls: session.metrics.totalToolCalls,
        totalTokens: session.metrics.usage.totalTokens,
        inputTokens: session.metrics.usage.inputTokens,
        outputTokens: session.metrics.usage.outputTokens,
        reasoningTokens: session.metrics.usage.reasoningTokens ?? null,
        costUsd: session.metrics.usage.costUsd ?? null,
        totalThinkingChars: session.metrics.totalThinkingChars,
      },
    })

    return {
      solverFailureReason:
        solverFailureReason ?? sessionTerminalError(session),
    }
  })

  const lifecycleOutcome = yield* executeLifecycle.pipe(
    Effect.map((value) => ({ _tag: "Success" as const, value })),
    Effect.catch((error) =>
      Effect.succeed({ _tag: "Failure" as const, error }),
    ),
  )

  if (lifecycleOutcome._tag === "Success") {
    yield* transition("creating-review")
  }

  const reviewOutcome = yield* createReview(runDir).pipe(
    Effect.map(() => ({ _tag: "Success" as const })),
    Effect.catch((error) =>
      Effect.succeed({ _tag: "Failure" as const, error }),
    ),
  )

  let terminalCause: unknown = null
  let terminalReason: string | null = null
  if (lifecycleOutcome._tag === "Failure") {
    terminalCause = lifecycleOutcome.error
    terminalReason = errorMessage(lifecycleOutcome.error)
  } else if (lifecycleOutcome.value.solverFailureReason !== null) {
    const solverFailureReason = lifecycleOutcome.value.solverFailureReason
    terminalReason = solverFailureReason
    terminalCause = new AgentExecutionError({
      agentId: currentRun.agentId,
      runId: currentRun.runId,
      reason: solverFailureReason,
    })
  }

  if (reviewOutcome._tag === "Failure") {
    const reviewReason = errorMessage(reviewOutcome.error)
    terminalReason = terminalReason === null
      ? `Manual Review initialization failed: ${reviewReason}`
      : `${terminalReason}; Manual Review initialization failed: ${reviewReason}`
    terminalCause ??= reviewOutcome.error
  }

  const finishedAtMillis = yield* Clock.currentTimeMillis
  const finishedAt = DateTime.formatIso(DateTime.makeUnsafe(finishedAtMillis))
  const durationSeconds = currentRun.startedAt === null
    ? null
    : Option.match(DateTime.make(currentRun.startedAt), {
        onNone: () => null,
        onSome: (startedAt) =>
          (finishedAtMillis - DateTime.toEpochMillis(startedAt)) / 1000,
      })

  if (terminalReason === null) {
    yield* transition("completed", {
      finishedAt,
      durationSeconds,
      error: null,
    })
    return currentRun
  }

  yield* transition("failed", {
    finishedAt,
    durationSeconds,
    error: terminalReason,
  })
  return yield* Effect.fail(
    new TaskStageRunError({
      runId: currentRun.runId,
      runDir,
      outputPath: currentRun.paths.output,
      reason: terminalReason,
      cause: terminalCause,
    }),
  )
})
