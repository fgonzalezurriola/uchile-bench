import { Clock, DateTime, Effect } from "effect"
import path from "node:path"
import type {
  BenchmarkTarget,
  CumulativeSequence,
  StandaloneTask,
} from "../domain/BenchmarkTarget.js"
import type { ResolvedExecutionEnvironment } from "../domain/Environment.js"
import { BenchmarkConfigError, TaskStageRunError } from "../domain/Errors.js"
import type { Run } from "../domain/Run.js"
import { parseRunCount, type RunCount } from "../domain/RunCount.js"
import type {
  CumulativeRunRecord,
  CumulativeStageRunRecord,
  StandaloneRunAttempt,
  TargetRunResult,
} from "../domain/TargetRun.js"
import {
  STANDALONE_BENCHMARK_PROMPT,
  cumulativeBenchmarkPrompt,
} from "../prompts/benchmarkPrompt.js"
import { AgentRegistryService } from "../services/AgentRegistryService.js"
import { BenchmarkCatalogService } from "../services/BenchmarkCatalogService.js"
import { ExecutionEnvironmentService } from "../services/ExecutionEnvironmentService.js"
import { FileSystemService } from "../services/FileSystemService.js"
import { RunStoreService } from "../services/RunStoreService.js"
import {
  describeRunInput,
  type RunInput,
  type RunInputSource,
} from "./prepareRun.js"
import { runTaskStage } from "./runTaskStage.js"
import { targetLogStyle } from "./targetLogStyle.js"

/** Options shared by standalone and cumulative target execution. */
export interface RunTargetOptions {
  readonly targetId: string
  readonly agentId: string
  readonly runs: number
  readonly prompt?: string
  readonly environmentId?: string
  readonly timeoutMs?: number
}

/** Options for an already resolved benchmark target. */
export interface RunResolvedTargetOptions {
  readonly agentId: string
  readonly runs: number
  readonly prompt?: string
  readonly environmentId?: string
  readonly timeoutMs?: number
}

export interface ResumeCumulativeRunOptions {
  readonly targetId: string
  readonly sequenceRunId: string
  readonly fromStageKey: string
  readonly agentId?: string
  readonly prompt?: string
  readonly environmentId?: string
  readonly timeoutMs?: number
}

interface ValidatedRunTargetOptions
  extends Omit<RunResolvedTargetOptions, "runs" | "environmentId"> {
  readonly runs: RunCount
  readonly executionEnvironment: ResolvedExecutionEnvironment
  readonly timeoutMs?: number
}

type StageFailure = {
  readonly _tag: "Failed"
  readonly error: string
  readonly runId: string | null
  readonly runDir: string | null
  readonly outputPath: string | null
}

type StageOutcome =
  | { readonly _tag: "Completed"; readonly run: Run }
  | StageFailure

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const stageFailure = (error: unknown): StageFailure =>
  error instanceof TaskStageRunError
    ? {
        _tag: "Failed",
        error: error.message,
        runId: error.runId,
        runDir: error.runDir,
        outputPath: error.outputPath,
      }
    : {
        _tag: "Failed",
        error: errorMessage(error),
        runId: null,
        runDir: null,
        outputPath: null,
      }

const currentIso = Effect.fnUntraced(function*() {
  const now = yield* Clock.currentTimeMillis
  return DateTime.formatIso(DateTime.makeUnsafe(now))
})

const datePart = (iso: string): string => iso.slice(0, 10)

const saveCumulativeRecord = (
  fs: FileSystemService,
  sequenceRoot: string,
  record: CumulativeRunRecord,
) => fs.writeJson(path.join(sequenceRoot, "sequence-run.json"), record)

const loadCumulativeRecord = (
  fs: FileSystemService,
  sequenceRoot: string,
) => fs.readJson<CumulativeRunRecord>(path.join(sequenceRoot, "sequence-run.json"))

const loadRunTimeoutMs = Effect.fnUntraced(function*(
  fs: FileSystemService,
  runDir: string,
) {
  const invocation = yield* fs.readJson<{ readonly timeoutMs?: unknown }>(
    path.join(runDir, "03-agent-config", "invocation.json"),
  )
  if (
    typeof invocation.timeoutMs === "number" &&
    Number.isInteger(invocation.timeoutMs) &&
    invocation.timeoutMs > 0
  ) {
    return invocation.timeoutMs
  }
  return yield* Effect.fail(
    new BenchmarkConfigError({
      reason: `Invalid invocation timeout in ${runDir}`,
    }),
  )
})

const generateSequenceRun = Effect.fnUntraced(function*(
  target: CumulativeSequence,
  agentId: string,
  sequence: number,
  runsRoot: string,
) {
  const fs = yield* FileSystemService
  const startedAt = yield* currentIso()
  const parentDir = path.resolve(runsRoot, "cumulative", target.id)
  let nextSequence = sequence

  while (true) {
    const sequenceRunId = `${datePart(startedAt)}_${String(nextSequence).padStart(4, "0")}_${agentId}`
    const sequenceRoot = path.resolve(parentDir, sequenceRunId)
    const exists = yield* fs.exists(sequenceRoot)
    if (!exists) {
      return { sequenceRunId, sequenceRoot, startedAt }
    }
    nextSequence += 1
  }
})

const runStandaloneTarget = Effect.fnUntraced(function*(
  target: StandaloneTask,
  options: ValidatedRunTargetOptions,
  runsRoot: string,
) {
  const prompt = options.prompt ?? STANDALONE_BENCHMARK_PROMPT
  const runParentDir = path.resolve(runsRoot, "standalone", target.id)
  const attempts: StandaloneRunAttempt[] = []

  for (let sequence = 1; sequence <= options.runs; sequence++) {
    const outcome = yield* runTaskStage({
      task: target.task,
      agentId: options.agentId,
      sequence,
      prompt,
      runParentDir,
      input: { _tag: "TaskPublic" },
      context: { _tag: "Standalone" },
      executionEnvironment: options.executionEnvironment,
      ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
    }).pipe(
      Effect.map(
        (run): StandaloneRunAttempt => ({
          _tag: "Completed",
          sequence,
          run,
        }),
      ),
      Effect.catch((error) => {
        const failure = stageFailure(error)
        return Effect.succeed<StandaloneRunAttempt>({
          _tag: "Failed",
          sequence,
          runId: failure.runId,
          runDir: failure.runDir,
          error: failure.error,
        })
      }),
    )
    attempts.push(outcome)
  }

  return {
    _tag: "Standalone",
    targetId: target.id,
    attempts,
  } satisfies TargetRunResult
})

const runRemainingCumulativeStages = Effect.fnUntraced(function*(
  target: CumulativeSequence,
  options: ValidatedRunTargetOptions,
  sequenceRoot: string,
  record: CumulativeRunRecord,
  startIndex: number,
  previousRun: Run | null,
) {
  const fs = yield* FileSystemService
  const stages: CumulativeStageRunRecord[] = [...record.stages]
  let currentRecord: CumulativeRunRecord = {
    ...record,
    status: "running",
    finishedAt: null,
    stages,
  }
  yield* saveCumulativeRecord(fs, sequenceRoot, currentRecord)

  let latestRun = previousRun
  let failed = false

  const remainingStages = target.stages.slice(startIndex)
  for (const [remainingIndex, stage] of remainingStages.entries()) {
    const stageLabel = `${target.id}/${stage.key}`
    yield* Effect.logInfo(
      targetLogStyle(
        target.id,
        `Running cumulative stage: ${stageLabel} (${stage.index}/${target.stages.length})`,
      ),
    )
    const input: RunInput = latestRun
      ? { _tag: "PreviousStageOutput", previousRun: latestRun }
      : { _tag: "TaskPublic" }
    const inputSource: RunInputSource = describeRunInput(stage.task, input)
    const runParentDir = path.resolve(
      sequenceRoot,
      "stages",
      stage.key,
    )

    const prompt =
      options.prompt ?? cumulativeBenchmarkPrompt(stage.key, stage.index)
    const outcome: StageOutcome = yield* runTaskStage({
      task: stage.task,
      agentId: options.agentId,
      sequence: stage.index,
      prompt,
      runParentDir,
      input,
      context: {
        _tag: "CumulativeStage",
        sequenceId: target.id,
        stageKey: stage.key,
        stageIndex: stage.index,
      },
      executionEnvironment: options.executionEnvironment,
      ...(options.timeoutMs === undefined
        ? {}
        : { timeoutMs: options.timeoutMs }),
    }).pipe(
      Effect.map((run) => ({ _tag: "Completed" as const, run })),
      Effect.catch((error) => Effect.succeed(stageFailure(error))),
    )

    if (outcome._tag === "Failed") {
      yield* Effect.logWarning(
        targetLogStyle(
          target.id,
          `Cumulative stage failed: ${stageLabel}: ${outcome.error}`,
        ),
      )
      stages.push({
        index: stage.index,
        stageKey: stage.key,
        taskId: stage.task.id,
        status: "failed",
        runId: outcome.runId,
        runDir: outcome.runDir,
        outputPath: outcome.outputPath,
        inputSource,
        error: outcome.error,
      })

      for (const skipped of remainingStages.slice(remainingIndex + 1)) {
        yield* Effect.logWarning(
          targetLogStyle(
            target.id,
            `Skipping cumulative stage: ${target.id}/${skipped.key} (previous stage failed)`,
          ),
        )
        stages.push({
          index: skipped.index,
          stageKey: skipped.key,
          taskId: skipped.task.id,
          status: "skipped",
          runId: null,
          runDir: null,
          outputPath: null,
          inputSource: null,
          error: "Skipped because a previous cumulative stage failed.",
        })
      }

      currentRecord = {
        ...currentRecord,
        status: "failed",
        finishedAt: yield* currentIso(),
        stages: [...stages],
      }
      yield* saveCumulativeRecord(fs, sequenceRoot, currentRecord)
      failed = true
      break
    }

    latestRun = outcome.run
    yield* Effect.logInfo(
      targetLogStyle(
        target.id,
        `Completed cumulative stage: ${stageLabel} (${outcome.run.runId})`,
      ),
    )
    stages.push({
      index: stage.index,
      stageKey: stage.key,
      taskId: stage.task.id,
      status: "completed",
      runId: outcome.run.runId,
      runDir: path.dirname(outcome.run.paths.input),
      outputPath: outcome.run.paths.output,
      inputSource,
      error: null,
    })
    currentRecord = { ...currentRecord, stages: [...stages] }
    yield* saveCumulativeRecord(fs, sequenceRoot, currentRecord)
  }

  if (!failed) {
    currentRecord = {
      ...currentRecord,
      status: "completed",
      finishedAt: yield* currentIso(),
      stages: [...stages],
    }
    yield* saveCumulativeRecord(fs, sequenceRoot, currentRecord)
    yield* Effect.logInfo(
      targetLogStyle(
        target.id,
        `Completed cumulative run: ${target.id} (${currentRecord.sequenceRunId})`,
      ),
    )
  }

  return currentRecord
})

const runCumulativeSequence = Effect.fnUntraced(function*(
  target: CumulativeSequence,
  options: ValidatedRunTargetOptions,
  runsRoot: string,
) {
  const fs = yield* FileSystemService
  const records: CumulativeRunRecord[] = []

  for (let sequence = 1; sequence <= options.runs; sequence++) {
    const identity = yield* generateSequenceRun(
      target,
      options.agentId,
      sequence,
      runsRoot,
    )
    yield* fs.mkdirRecursive(identity.sequenceRoot)
    yield* Effect.logInfo(
      targetLogStyle(
        target.id,
        `Starting cumulative run: ${target.id} (${identity.sequenceRunId})`,
      ),
    )

    const stages: CumulativeStageRunRecord[] = []
    let record: CumulativeRunRecord = {
      sequenceRunId: identity.sequenceRunId,
      targetId: target.id,
      agentId: options.agentId,
      environmentId: options.executionEnvironment.environmentId,
      status: "running",
      startedAt: identity.startedAt,
      finishedAt: null,
      stages,
    }
    yield* saveCumulativeRecord(fs, identity.sequenceRoot, record)

    record = yield* runRemainingCumulativeStages(
      target,
      options,
      identity.sequenceRoot,
      record,
      0,
      null,
    )
    records.push(record)
  }

  return {
    _tag: "Cumulative",
    targetId: target.id,
    runs: records,
  } satisfies TargetRunResult
})

const resolveValidatedOptions = Effect.fnUntraced(function*(
  target: BenchmarkTarget,
  options: RunResolvedTargetOptions,
) {
  const runs = yield* parseRunCount(options.runs)
  const agentRegistry = yield* AgentRegistryService
  const executionEnvironments = yield* ExecutionEnvironmentService
  const baseAgentConfig = yield* agentRegistry.getAgentConfig(options.agentId)
  const taskEnvironmentId = target._tag === "StandaloneTask"
    ? target.task.environmentId
    : target.stages[0]?.task.environmentId
  const executionEnvironment = yield* executionEnvironments.resolve({
    baseAgentConfig,
    ...(options.environmentId === undefined
      ? {}
      : { explicitEnvironmentId: options.environmentId }),
    ...(taskEnvironmentId === undefined ? {} : { taskEnvironmentId }),
  })
  return {
    agentId: options.agentId,
    runs,
    executionEnvironment,
    ...(options.prompt === undefined ? {} : { prompt: options.prompt }),
    ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
  } satisfies ValidatedRunTargetOptions
})

/** Execute an already parsed benchmark target. */
export const runResolvedTarget = Effect.fnUntraced(function*(
  target: BenchmarkTarget,
  options: RunResolvedTargetOptions,
  runsRoot: string,
) {
  const validatedOptions = yield* resolveValidatedOptions(target, options)

  if (target._tag === "StandaloneTask") {
    return yield* runStandaloneTarget(target, validatedOptions, runsRoot)
  }
  return yield* runCumulativeSequence(target, validatedOptions, runsRoot)
})

/** Resolve a benchmark target from the catalog and execute it. */
export const runTarget = Effect.fnUntraced(function*(
  options: RunTargetOptions,
  runsRoot: string,
) {
  const catalog = yield* BenchmarkCatalogService
  const target = yield* catalog.getTarget(options.targetId)
  return yield* runResolvedTarget(target, options, runsRoot)
})

/** Resume an existing cumulative sequence run from a selected stage. */
export const resumeCumulativeRun = Effect.fnUntraced(function*(
  options: ResumeCumulativeRunOptions,
  runsRoot: string,
) {
  const catalog = yield* BenchmarkCatalogService
  const fs = yield* FileSystemService
  const runStore = yield* RunStoreService
  const target = yield* catalog.getTarget(options.targetId)
  if (target._tag !== "CumulativeSequence") {
    return yield* Effect.fail(
      new BenchmarkConfigError({
        reason: `Cannot resume non-cumulative target: ${options.targetId}`,
      }),
    )
  }

  const startIndex = target.stages.findIndex((stage) =>
    stage.key === options.fromStageKey
  )
  if (startIndex < 0) {
    return yield* Effect.fail(
      new BenchmarkConfigError({
        reason: `Stage not found in ${options.targetId}: ${options.fromStageKey}`,
      }),
    )
  }

  const sequenceRoot = path.resolve(
    runsRoot,
    "cumulative",
    target.id,
    options.sequenceRunId,
  )
  const existingRecord = yield* loadCumulativeRecord(fs, sequenceRoot)
  const agentId = options.agentId ?? existingRecord.agentId
  if (existingRecord.targetId !== target.id) {
    return yield* Effect.fail(
      new BenchmarkConfigError({
        reason:
          `Sequence run ${options.sequenceRunId} belongs to ${existingRecord.targetId}, not ${target.id}`,
      }),
    )
  }
  if (existingRecord.agentId !== agentId) {
    return yield* Effect.fail(
      new BenchmarkConfigError({
        reason:
          `Sequence run ${options.sequenceRunId} belongs to agent ${existingRecord.agentId}, not ${agentId}`,
      }),
    )
  }

  const completedBefore = existingRecord.stages.slice(0, startIndex)
  const expectedBefore = target.stages.slice(0, startIndex)
  for (const [index, expected] of expectedBefore.entries()) {
    const actual = completedBefore[index]
    if (
      actual === undefined ||
      actual.stageKey !== expected.key ||
      actual.status !== "completed" ||
      actual.runDir === null
    ) {
      return yield* Effect.fail(
        new BenchmarkConfigError({
          reason:
            `Cannot resume ${options.sequenceRunId} from ${options.fromStageKey}: previous stage ${expected.key} is not completed`,
        }),
      )
    }
  }

  const previousStage = completedBefore.at(-1)
  if (previousStage?.runDir === null) {
    return yield* Effect.fail(
      new BenchmarkConfigError({
        reason:
          `Cannot resume ${options.sequenceRunId} from ${options.fromStageKey}: previous stage ${previousStage.stageKey} has no runDir`,
      }),
    )
  }
  const previousRun = previousStage === undefined
    ? null
    : yield* runStore.loadRun(previousStage.runDir)
  const inheritedTimeoutMs = previousStage === undefined
    ? undefined
    : yield* loadRunTimeoutMs(fs, previousStage.runDir)

  const resumedRecord: CumulativeRunRecord = {
    ...existingRecord,
    status: "running",
    finishedAt: null,
    stages: completedBefore,
  }
  const validatedOptions = yield* resolveValidatedOptions(target, {
    agentId,
    runs: 1,
    ...(options.prompt === undefined ? {} : { prompt: options.prompt }),
    ...(options.environmentId === undefined
      ? {}
      : { environmentId: options.environmentId }),
    ...(options.timeoutMs === undefined
      ? inheritedTimeoutMs === undefined
        ? {}
        : { timeoutMs: inheritedTimeoutMs }
      : { timeoutMs: options.timeoutMs }),
  })

  const record = yield* runRemainingCumulativeStages(
    target,
    validatedOptions,
    sequenceRoot,
    resumedRecord,
    startIndex,
    previousRun,
  )

  return {
    _tag: "Cumulative",
    targetId: target.id,
    runs: [record],
  } satisfies TargetRunResult
})
