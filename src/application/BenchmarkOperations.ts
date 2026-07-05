import { Clock, DateTime, Effect, Option, Schema } from "effect"
import path from "node:path"
import {
  compareTargetIdsByTask,
  type BenchmarkTarget,
} from "../domain/BenchmarkTarget.js"
import { EvidenceFile, SessionFile, TransientSessionFile } from "../domain/Evidence.js"
import {
  matchesExperimentPrefix,
  resolveExperimentAgent,
} from "../domain/Experiment.js"
import { RunNotFoundError, SessionRawUnavailableError } from "../domain/Errors.js"
import type { Run } from "../domain/Run.js"
import { sessionTerminalError, type AgentSession } from "../domain/Session.js"
import type { CumulativeRunRecord } from "../domain/TargetRun.js"
import { approveRubric } from "../programs/approveRubric.js"
import { createReview } from "../programs/createReview.js"
import { doctor } from "../programs/doctor.js"
import { generateRubric } from "../programs/generateRubric.js"
import { judgeRun } from "../programs/judgeRun.js"
import { listRuns as loadRuns } from "../programs/listRuns.js"
import { parseRunConcurrency, runAll } from "../programs/runAll.js"
import { resumeCumulativeRun, runTarget } from "../programs/runTarget.js"
import { AgentRegistryService } from "../services/AgentRegistryService.js"
import { BenchmarkCatalogService } from "../services/BenchmarkCatalogService.js"
import { DockerService } from "../services/DockerService.js"
import { EnvironmentRegistryService } from "../services/EnvironmentRegistryService.js"
import { FileSystemService } from "../services/FileSystemService.js"
import { ProgressService } from "../services/ProgressService.js"
import { RunStoreService } from "../services/RunStoreService.js"
import { SessionService } from "../services/SessionService.js"

const JudgeReviewMetadataSchema = Schema.Struct({
  status: Schema.String,
  grade: Schema.optional(Schema.Number),
  confidence: Schema.optional(Schema.String),
})

export interface AiReviewSummary {
  readonly agentId: string
  readonly reviewId: string
  readonly reviewPath: string
  readonly status: string
  readonly grade?: number
  readonly confidence?: string
}

export interface RunInspection {
  readonly runDir: string
  readonly run: Run
  readonly manualReviewExists: boolean
  readonly aiReviews: ReadonlyArray<AiReviewSummary>
  readonly session: {
    readonly compactJsonExists: boolean
    readonly htmlExists: boolean
    readonly metricsExists: boolean
  }
}

export type RebuildSessionResult =
  | {
      readonly status: "rebuilt"
      readonly runDir: string
      readonly session: AgentSession
      readonly htmlGenerated: boolean
    }
  | {
      readonly status: "already-published"
      readonly runDir: string
      readonly rawAvailable: false
      readonly compactJsonPath: string
      readonly metricsPath: string
      readonly htmlPath: string | null
    }

export interface ProgressItem {
  readonly target: BenchmarkTarget
  readonly completed: boolean
  readonly current: boolean
}

export interface ProgressView {
  readonly items: ReadonlyArray<ProgressItem>
  readonly completedCount: number
  readonly totalCount: number
}

export type ExperimentRunResult = Awaited<ReturnType<typeof runAll>>

export interface ExperimentJudgeItem {
  readonly taskId: string
  readonly runId: string
  readonly runDir: string
  readonly status: "completed" | "failed" | "skipped"
  readonly reviewPath: string | null
  readonly grade?: number
  readonly confidence?: string
  readonly error: string | null
}

export interface ExperimentStatusItem {
  readonly taskId: string
  readonly runId: string
  readonly runDir: string
  readonly agentId: string
  readonly status: Run["status"]
  readonly durationSeconds: number | null
  readonly totalTokens: number | null
  readonly costUsd: number | null
  readonly aiReviews: ReadonlyArray<AiReviewSummary>
}

export interface ExperimentStatus {
  readonly solverAgentId: string
  readonly prefix?: string
  readonly runs: ReadonlyArray<ExperimentStatusItem>
}

export const listBenchmarkTargets = Effect.fnUntraced(function*() {
  const catalog = yield* BenchmarkCatalogService
  return yield* catalog.listTargets()
})

export const listAgents = Effect.fnUntraced(function*() {
  const agents = yield* AgentRegistryService
  return yield* agents.listAvailabilities()
})

export const listExecutionEnvironments = Effect.fnUntraced(function*() {
  const environments = yield* EnvironmentRegistryService
  const ids = yield* environments.listEnvironmentIds()
  const configs = []
  for (const id of ids) {
    configs.push(yield* environments.getEnvironmentConfig(id))
  }
  return configs
})

export const listRuns = Effect.fnUntraced(function*(
  runsRoot: string,
  taskId?: string,
) {
  return yield* loadRuns(runsRoot, taskId)
})

export const locateRun = Effect.fnUntraced(function*(
  runId: string,
  runsRoot: string,
  taskId?: string,
) {
  const runStore = yield* RunStoreService
  const runDirs = yield* runStore.listRunDirs(runsRoot)
  const candidates = runDirs
    .filter((directory) => path.basename(directory) === runId)
    .sort()
  for (const candidate of candidates) {
    if (taskId === undefined) return candidate
    const run = yield* runStore
      .loadRun(candidate)
      .pipe(Effect.catch(() => Effect.succeed(null)))
    if (run?.taskId === taskId) return candidate
  }
  return null
})

export const getAiReviews = Effect.fnUntraced(function*(runDir: string) {
  const fs = yield* FileSystemService
  const aiRoot = path.join(runDir, "06-review", "ai")
  const agents = yield* fs.listDir(aiRoot)
  const reviews: AiReviewSummary[] = []
  for (const agentId of agents) {
    const agentRoot = path.join(aiRoot, agentId)
    const reviewIds = yield* fs.listDir(agentRoot)
    for (const reviewId of reviewIds) {
      const reviewPath = path.join(agentRoot, reviewId)
      const metadataPath = path.join(reviewPath, "judge-run.json")
      if (!(yield* fs.exists(metadataPath))) {
        reviews.push({ agentId, reviewId, reviewPath, status: "unknown" })
        continue
      }
      const raw = yield* fs
        .readJson<unknown>(metadataPath)
        .pipe(Effect.catch(() => Effect.succeed(null)))
      const decoded = Schema.decodeUnknownOption(JudgeReviewMetadataSchema)(raw)
      if (Option.isNone(decoded)) {
        reviews.push({
          agentId,
          reviewId,
          reviewPath,
          status: "invalid-metadata",
        })
        continue
      }
      reviews.push({
        agentId,
        reviewId,
        reviewPath,
        status: decoded.value.status,
        ...(decoded.value.grade === undefined ? {} : { grade: decoded.value.grade }),
        ...(decoded.value.confidence === undefined
          ? {}
          : { confidence: decoded.value.confidence }),
      })
    }
  }
  return reviews.sort((left, right) =>
    `${left.agentId}/${left.reviewId}`.localeCompare(`${right.agentId}/${right.reviewId}`),
  )
})

export const inspectRun = Effect.fnUntraced(function*(
  runId: string,
  runsRoot: string,
  taskId?: string,
) {
  const fs = yield* FileSystemService
  const runStore = yield* RunStoreService
  const runDir = yield* locateRun(runId, runsRoot, taskId)
  if (runDir === null) {
    return yield* Effect.fail(new RunNotFoundError({ runId }))
  }
  const run = yield* runStore.loadRun(runDir)
  return {
    runDir,
    run,
    manualReviewExists: yield* fs.exists(path.join(run.paths.review, "score.json")),
    aiReviews: yield* getAiReviews(runDir),
    session: {
      compactJsonExists: yield* fs.exists(path.join(run.paths.session, "session.compact.json")),
      htmlExists: yield* fs.exists(path.join(run.paths.session, "session.html")),
      metricsExists: yield* fs.exists(path.join(run.paths.session, "metrics.json")),
    },
  } satisfies RunInspection
})

export const getProgress = Effect.fnUntraced(function*() {
  const catalog = yield* BenchmarkCatalogService
  const progress = yield* ProgressService
  const data = yield* progress.load()
  const targets = yield* catalog.listTargets()
  const items = targets.map((target) => ({
    target,
    completed: data.completed.includes(target.id),
    current: data.current === target.id,
  }))
  return {
    items,
    completedCount: items.filter((item) => item.completed).length,
    totalCount: items.length,
  } satisfies ProgressView
})

export const runDoctor = doctor
export const startBenchmarkTarget = runTarget
export const resumeCumulativeTargetRun = resumeCumulativeRun
export const startAllBenchmarkTargets = runAll

const progressSegment = (value: string): string =>
  value.replace(/[^A-Za-z0-9._-]+/g, "_")

const EXPERIMENT_STALE_MARGIN_MS = 5 * 60 * 1000

const isTerminalRunStatus = (status: Run["status"]): boolean =>
  status === "completed" || status === "failed" || status === "cancelled"

const currentIso = Effect.fnUntraced(function*() {
  const now = yield* Clock.currentTimeMillis
  return DateTime.formatIso(DateTime.makeUnsafe(now))
})

const recoverInterruptedExperimentRun = Effect.fnUntraced(function*(
  run: Run,
  runDir: string,
  staleAfterMs: number,
) {
  if (isTerminalRunStatus(run.status) || run.startedAt === null) return false

  const startedAt = Date.parse(run.startedAt)
  if (!Number.isFinite(startedAt)) return false

  const now = yield* Clock.currentTimeMillis
  if (now - startedAt < staleAfterMs) return false

  const runStore = yield* RunStoreService
  yield* runStore.saveRun({
    ...run,
    status: "failed",
    finishedAt: yield* currentIso(),
    durationSeconds: Math.max(0, Math.round((now - startedAt) / 1000)),
    error:
      "Recovered stale interrupted run. The orchestrator process exited before the run reached a terminal state.",
  }, runDir)
  return true
})

const isUsableCompletedRun = Effect.fnUntraced(function*(run: Run) {
  if (run.status !== "completed") return false
  const fs = yield* FileSystemService
  const sessionPath = path.join(
    run.paths.session,
    SessionFile.SESSION_COMPACT_JSON,
  )
  const session = yield* fs
    .readJson<AgentSession>(sessionPath)
    .pipe(Effect.catch(() => Effect.succeed(null)))
  if (session === null) return false
  return sessionTerminalError(session) === null
})

const isCompletedCumulativeRunRecord = (
  value: unknown,
  agentId: string,
  prefix: string | undefined,
): value is CumulativeRunRecord => {
  if (typeof value !== "object" || value === null) return false
  const record = value as {
    readonly targetId?: unknown
    readonly agentId?: unknown
    readonly status?: unknown
    readonly stages?: unknown
  }
  return typeof record.targetId === "string" &&
    record.agentId === agentId &&
    record.status === "completed" &&
    Array.isArray(record.stages) &&
    record.stages.every((stage) =>
      typeof stage === "object" &&
      stage !== null &&
      (stage as { readonly status?: unknown }).status === "completed"
    ) &&
    matchesExperimentPrefix(record.targetId, prefix)
}

const collectCompletedCumulativeTargetIds = Effect.fnUntraced(function*(
  runsRoot: string,
  agentId: string,
  prefix: string | undefined,
) {
  const fs = yield* FileSystemService
  const files = yield* fs.walkDir(path.join(runsRoot, "cumulative")).pipe(
    Effect.catch(() => Effect.succeed([] as ReadonlyArray<string>)),
  )
  const completed: string[] = []
  for (const file of files) {
    if (path.basename(file) !== "sequence-run.json") continue
    const record = yield* fs.readJson<unknown>(file).pipe(
      Effect.catch(() => Effect.succeed(null)),
    )
    if (isCompletedCumulativeRunRecord(record, agentId, prefix)) {
      completed.push(record.targetId)
    }
  }
  return completed
})

const isStandaloneRunDir = (runDir: string): boolean =>
  runDir.split(path.sep).includes("standalone")

export const runExperiment = Effect.fnUntraced(function*(
  agentAliasOrId: string,
  options: {
    readonly runs: number
    readonly prefix?: string
    readonly concurrency?: string | number
    readonly reset?: boolean
    readonly timeoutMs?: number
  },
  runsRoot: string,
) {
  const runStore = yield* RunStoreService
  const agentId = resolveExperimentAgent(agentAliasOrId)
  const concurrency = options.concurrency === undefined
    ? undefined
    : parseRunConcurrency(String(options.concurrency))
  const staleAfterMs = (options.timeoutMs ?? 60 * 60 * 1000) +
    EXPERIMENT_STALE_MARGIN_MS
  const progressScope = progressSegment(options.prefix ?? "all")
  const completedTargetIds = new Set<string>()
  if (options.reset !== true) {
    for (const targetId of yield* collectCompletedCumulativeTargetIds(
      runsRoot,
      agentId,
      options.prefix,
    )) {
      completedTargetIds.add(targetId)
    }
    const runDirs = yield* runStore.listRunDirs(runsRoot)
    for (const runDir of runDirs) {
      const run = yield* runStore.loadRun(runDir).pipe(
        Effect.catch(() => Effect.succeed(null)),
      )
      if (
        run !== null &&
        run.agentId === agentId &&
        matchesExperimentPrefix(run.taskId, options.prefix)
      ) {
        const recovered = yield* recoverInterruptedExperimentRun(
          run,
          runDir,
          staleAfterMs,
        )
        if (recovered) {
          yield* Effect.logWarning(
            `Marked stale interrupted run as failed: ${run.taskId} (${run.runId})`,
          )
          continue
        }
      }
      if (
        run !== null &&
        isStandaloneRunDir(runDir) &&
        run.agentId === agentId &&
        (yield* isUsableCompletedRun(run)) &&
        matchesExperimentPrefix(run.taskId, options.prefix)
      ) {
        completedTargetIds.add(run.taskId)
      }
    }
  }
  return yield* runAll({
    agentId,
    runs: options.runs,
    reset: options.reset ?? false,
    ...(options.prefix === undefined ? {} : { prefix: options.prefix }),
    ...(concurrency === undefined ? {} : { concurrency }),
    ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
    completedTargetIds: [...completedTargetIds].sort(),
    progressPath: path.join(
      runsRoot,
      "progress",
      "experiments",
      progressSegment(agentId),
      `${progressScope}.json`,
    ),
  }, runsRoot)
})

export const createManualReview = Effect.fnUntraced(function*(
  runId: string,
  runsRoot: string,
  taskId?: string,
) {
  const runDir = yield* locateRun(runId, runsRoot, taskId)
  if (runDir === null) return yield* Effect.fail(new RunNotFoundError({ runId }))
  return yield* createReview(runDir)
})

export const generateRubricDraft = generateRubric
export const approveRubricDraft = approveRubric

export const judgeLocatedRun = Effect.fnUntraced(function*(
  runId: string,
  runsRoot: string,
  agentId: string,
  force: boolean,
  taskId?: string,
) {
  const runDir = yield* locateRun(runId, runsRoot, taskId)
  if (runDir === null) return yield* Effect.fail(new RunNotFoundError({ runId }))
  return yield* judgeRun({ runDir, agentId, force })
})

const hasCompletedAiReviewForAgent = Effect.fnUntraced(function*(
  runDir: string,
  judgeAgentId: string,
) {
  const reviews = yield* getAiReviews(runDir)
  return reviews.some((review) =>
    review.agentId === judgeAgentId && review.status === "completed"
  )
})

const summarizeJudgeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

export const judgeExperiment = Effect.fnUntraced(function*(
  solverAliasOrId: string,
  options: {
    readonly judgeAliasOrId: string
    readonly prefix?: string
    readonly concurrency?: string | number
    readonly force?: boolean
  },
  runsRoot: string,
) {
  const runStore = yield* RunStoreService
  const solverAgentId = resolveExperimentAgent(solverAliasOrId)
  const judgeAgentId = resolveExperimentAgent(options.judgeAliasOrId)
  const concurrency = options.concurrency === undefined
    ? parseRunConcurrency(process.env.BENCH_RUN_CONCURRENCY)
    : parseRunConcurrency(String(options.concurrency))
  const runDirs = yield* runStore.listRunDirs(runsRoot)
  const candidates: Array<{ readonly runDir: string; readonly run: Run }> = []

  for (const runDir of runDirs) {
    const run = yield* runStore.loadRun(runDir).pipe(
      Effect.catch(() => Effect.succeed(null)),
    )
    if (
      run !== null &&
      run.agentId === solverAgentId &&
      run.status === "completed" &&
      matchesExperimentPrefix(run.taskId, options.prefix)
    ) {
      candidates.push({ runDir, run })
    }
  }

  yield* Effect.logInfo(
    `Starting judge batch with ${candidates.length} completed runs for ${solverAgentId}`,
  )
  yield* Effect.logInfo(`Judge agent: ${judgeAgentId}`)
  yield* Effect.logInfo(`Judge concurrency: ${concurrency}`)

  return yield* Effect.forEach(candidates, ({ runDir, run }) =>
    Effect.gen(function*() {
      if (
        options.force !== true &&
        (yield* hasCompletedAiReviewForAgent(runDir, judgeAgentId))
      ) {
        yield* Effect.logInfo(
          `Skipping ${run.taskId} (${run.runId}); completed AI review already exists`,
        )
        return {
          taskId: run.taskId,
          runId: run.runId,
          runDir,
          status: "skipped",
          reviewPath: null,
          error: "AI review already exists for this judge; pass --force to replace/add another",
        } satisfies ExperimentJudgeItem
      }

      yield* Effect.logInfo(`Judging target: ${run.taskId} (${run.runId})`)
      const result = yield* judgeRun({
        runDir,
        agentId: judgeAgentId,
        force: options.force ?? false,
      }).pipe(
        Effect.map((value) => ({ _tag: "Success" as const, value })),
        Effect.catch((error) =>
          Effect.succeed({
            _tag: "Failure" as const,
            error: summarizeJudgeError(error),
          }),
        ),
      )

      if (result._tag === "Failure") {
        yield* Effect.logWarning(
          `Judge failed for ${run.taskId} (${run.runId}): ${result.error}`,
        )
        return {
          taskId: run.taskId,
          runId: run.runId,
          runDir,
          status: "failed",
          reviewPath: null,
          error: result.error,
        } satisfies ExperimentJudgeItem
      }

      yield* Effect.logInfo(
        `Completed judge for ${run.taskId} (${run.runId}): ${result.value.verdict.grade.toFixed(1)}`,
      )
      return {
        taskId: run.taskId,
        runId: run.runId,
        runDir,
        status: "completed",
        reviewPath: result.value.reviewPath,
        grade: result.value.verdict.grade,
        confidence: result.value.verdict.confidence,
        error: null,
      } satisfies ExperimentJudgeItem
    }),
    { concurrency },
  )
})

export const getExperimentStatus = Effect.fnUntraced(function*(
  solverAliasOrId: string,
  options: { readonly prefix?: string },
  runsRoot: string,
) {
  const runStore = yield* RunStoreService
  const solverAgentId = resolveExperimentAgent(solverAliasOrId)
  const runDirs = yield* runStore.listRunDirs(runsRoot)
  const items: ExperimentStatusItem[] = []

  for (const runDir of runDirs) {
    const run = yield* runStore.loadRun(runDir).pipe(
      Effect.catch(() => Effect.succeed(null)),
    )
    if (
      run !== null &&
      run.agentId === solverAgentId &&
      matchesExperimentPrefix(run.taskId, options.prefix)
    ) {
      items.push({
        taskId: run.taskId,
        runId: run.runId,
        runDir,
        agentId: run.agentId,
        status: run.status,
        durationSeconds: run.durationSeconds,
        totalTokens: run.metrics.totalTokens,
        costUsd: run.metrics.costUsd,
        aiReviews: yield* getAiReviews(runDir),
      })
    }
  }

  return {
    solverAgentId,
    ...(options.prefix === undefined ? {} : { prefix: options.prefix }),
    runs: items.sort((left, right) =>
      compareTargetIdsByTask(left.taskId, right.taskId) ||
      left.runId.localeCompare(right.runId, "en"),
    ),
  } satisfies ExperimentStatus
})

export const buildDockerImages = Effect.fnUntraced(function*(options: {
  readonly agentId?: string
  readonly environmentId?: string
}) {
  const docker = yield* DockerService
  const agents = yield* AgentRegistryService
  const environments = yield* EnvironmentRegistryService
  if (options.environmentId !== undefined) {
    const config = yield* environments.getEnvironmentConfig(options.environmentId)
    const result = yield* docker.buildImage(config.dockerfile, config.dockerImage).pipe(
      Effect.as(`✓ ${config.id}: ${config.dockerImage}`),
      Effect.catch((error) => Effect.succeed(`✗ ${config.id}: ${error.reason}`)),
    )
    return [result]
  }
  const agentIds = options.agentId === undefined
    ? yield* agents.listAgentIds()
    : [options.agentId]
  const output: string[] = []
  for (const agentId of agentIds) {
    const config = yield* agents.getAgentConfig(agentId).pipe(
      Effect.catch(() => Effect.succeed(null)),
    )
    if (config === null) {
      output.push(`✗ ${agentId}: config not found`)
      continue
    }
    const dockerfile = config.dockerfile ?? `docker/${config.type}.Dockerfile`
    output.push(yield* docker.buildImage(dockerfile, config.dockerImage).pipe(
      Effect.as(`✓ ${agentId}: ${config.dockerImage}`),
      Effect.catch((error) => Effect.succeed(`✗ ${agentId}: ${error.reason}`)),
    ))
  }
  return output
})

export const rebuildSession = Effect.fnUntraced(function*(
  runId: string,
  runsRoot: string,
  taskId?: string,
) {
  const fs = yield* FileSystemService
  const runStore = yield* RunStoreService
  const sessions = yield* SessionService
  const runDir = yield* locateRun(runId, runsRoot, taskId)
  if (runDir === null) return yield* Effect.fail(new RunNotFoundError({ runId }))
  const run = yield* runStore.loadRun(runDir)
  const compactJsonPath = path.join(run.paths.session, SessionFile.SESSION_COMPACT_JSON)
  const metricsPath = path.join(run.paths.session, SessionFile.METRICS_JSON)
  const htmlPath = path.join(run.paths.session, SessionFile.SESSION_HTML)
  const rawCandidates = [
    path.join(run.paths.evidence, EvidenceFile.AGENT_EVENTS),
    path.join(
      run.paths.evidence,
      TransientSessionFile.DIRECTORY,
      TransientSessionFile.EVENTS_JSONL,
    ),
    path.join(run.paths.evidence, EvidenceFile.AGENT_STDOUT),
    path.join(run.paths.evidence, "stdout.jsonl"),
  ]
  let rawEventsPath: string | null = null
  for (const candidate of rawCandidates) {
    if (yield* fs.exists(candidate)) {
      rawEventsPath = candidate
      break
    }
  }

  if (rawEventsPath === null) {
    const compactJsonExists = yield* fs.exists(compactJsonPath)
    const metricsExists = yield* fs.exists(metricsPath)
    if (compactJsonExists && metricsExists) {
      return {
        status: "already-published",
        runDir,
        rawAvailable: false,
        compactJsonPath,
        metricsPath,
        htmlPath: (yield* fs.exists(htmlPath)) ? htmlPath : null,
      } satisfies RebuildSessionResult
    }
    return yield* Effect.fail(new SessionRawUnavailableError({
      runId,
      evidencePath: run.paths.evidence,
      sessionPath: run.paths.session,
    }))
  }

  const prompt = yield* fs
    .readFile(path.join(run.paths.evidence, EvidenceFile.PROMPT))
    .pipe(Effect.catch(() => Effect.succeed("")))
  const published = yield* sessions.createAndSaveFromFile(
    {
      adapter: run.agent.adapter,
      model: run.agent.model ?? "unknown",
      runId: run.runId,
      taskId: run.taskId,
      agentId: run.agentId,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      prompt,
      eventSource: path.relative(run.paths.evidence, rawEventsPath),
    },
    rawEventsPath,
    run.paths.session,
  )
  const session = published.session
  yield* runStore.saveRun({
    ...run,
    metrics: {
      ...run.metrics,
      totalTurns: session.metrics.totalTurns,
      totalToolCalls: session.metrics.totalToolCalls,
      totalTokens: session.metrics.usage.totalTokens,
      inputTokens: session.metrics.usage.inputTokens,
      outputTokens: session.metrics.usage.outputTokens,
      reasoningTokens: session.metrics.usage.reasoningTokens ?? null,
      costUsd: session.metrics.usage.costUsd ?? null,
      totalThinkingChars: session.metrics.totalThinkingChars,
    },
  }, runDir)
  return {
    status: "rebuilt",
    runDir,
    session,
    htmlGenerated: published.htmlGenerated,
  } satisfies RebuildSessionResult
})
