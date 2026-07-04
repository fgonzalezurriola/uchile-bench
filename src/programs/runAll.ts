import { Effect, Ref, Semaphore } from "effect"
import path from "node:path"
import type { TargetRunResult } from "../domain/TargetRun.js"
import { isTargetRunSuccessful } from "../domain/TargetRun.js"
import { AgentRegistryService } from "../services/AgentRegistryService.js"
import { BenchmarkCatalogService } from "../services/BenchmarkCatalogService.js"
import { FileSystemService } from "../services/FileSystemService.js"
import { type ProgressData, ProgressService } from "../services/ProgressService.js"
import { runResolvedTarget } from "./runTarget.js"
import { targetLogStyle } from "./targetLogStyle.js"

/** Options for resumable execution of every selected benchmark target. */
export interface RunAllOptions {
  readonly agentId: string
  readonly runs: number
  readonly prompt?: string
  readonly environmentId?: string
  readonly prefix?: string
  readonly reset?: boolean
  readonly concurrency?: number
  readonly timeoutMs?: number
  readonly progressPath?: string
  readonly completedTargetIds?: ReadonlyArray<string>
}

export const DEFAULT_RUN_CONCURRENCY = 1
export const RUN_CONCURRENCY_ENV = "BENCH_RUN_CONCURRENCY"

/** Result of one target in a batch execution. */
export type BatchTargetResult =
  | {
      readonly _tag: "Completed"
      readonly targetId: string
      readonly result: TargetRunResult
    }
  | {
      readonly _tag: "Failed"
      readonly targetId: string
      readonly error: string
      readonly result: TargetRunResult | null
    }

const messageFor = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const matchesPrefix = (targetId: string, prefix: string): boolean => {
  const normalized = prefix.replace(/^\/+|\/+$/g, "")
  return targetId === normalized || targetId.startsWith(`${normalized}/`)
}

export const parseRunConcurrency = (value: string | undefined): number => {
  if (value === undefined || value.trim() === "") return DEFAULT_RUN_CONCURRENCY
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_RUN_CONCURRENCY
  return parsed
}

const isBatchTargetResult = (
  result: BatchTargetResult | null,
): result is BatchTargetResult => result !== null

const defaultProgress = (): ProgressData => ({
  completed: [],
  current: null,
})

const isProgressData = (value: unknown): value is ProgressData => {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as { completed?: unknown; current?: unknown }
  return Array.isArray(candidate.completed) &&
    candidate.completed.every((item) => typeof item === "string") &&
    (candidate.current === null || typeof candidate.current === "string")
}

/** Execute all incomplete catalog targets in deterministic catalog order. */
export const runAll = Effect.fnUntraced(function*(
  options: RunAllOptions,
  runsRoot: string,
) {
  const catalog = yield* BenchmarkCatalogService
  const agentRegistry = yield* AgentRegistryService
  const progress = yield* ProgressService
  const fs = yield* FileSystemService

  const scopedProgressPath = options.progressPath === undefined
    ? undefined
    : path.resolve(options.progressPath)
  const loadProgress = Effect.fnUntraced(function*() {
    if (scopedProgressPath === undefined) return yield* progress.load()
    if (!(yield* fs.exists(scopedProgressPath))) return defaultProgress()
    const raw = yield* fs
      .readJson<unknown>(scopedProgressPath)
      .pipe(Effect.catch(() => Effect.succeed(null)))
    return isProgressData(raw) ? raw : defaultProgress()
  })
  const saveProgress = (data: ProgressData) =>
    scopedProgressPath === undefined
      ? progress.save(data)
      : fs.writeJson(scopedProgressPath, data)
  const resetProgress = () => saveProgress(defaultProgress())
  const markCompleted = Effect.fnUntraced(function*(targetId: string) {
    const data = yield* loadProgress()
    if (data.completed.includes(targetId)) return
    yield* saveProgress({
      completed: [...data.completed, targetId].sort(),
      current: data.current === targetId ? null : data.current,
    })
  })
  const clearCurrent = Effect.fnUntraced(function*() {
    const data = yield* loadProgress()
    yield* saveProgress({ ...data, current: null })
  })

  yield* agentRegistry.getAgentConfig(options.agentId)

  if (options.reset) {
    yield* resetProgress()
    yield* Effect.logInfo("Progress reset")
  }

  const discovered = yield* catalog.listTargets()
  const prefix = options.prefix
  const targets = prefix
    ? discovered.filter((target) => matchesPrefix(target.id, prefix))
    : discovered

  if (targets.length === 0) {
    yield* Effect.logInfo(
      options.prefix
        ? `No benchmark targets found for prefix: ${options.prefix}`
        : "No benchmark targets found.",
    )
    return [] as ReadonlyArray<BatchTargetResult>
  }

  const targetIds = targets.map((target) => target.id)
  const progressState = yield* loadProgress()
  const completed = [
    ...new Set(options.completedTargetIds ?? progressState.completed),
  ].sort()
  const completedRef = yield* Ref.make<ReadonlyArray<string>>(completed)
  const progressLock = yield* Semaphore.make(1)
  const effectiveProgressState = { ...progressState, completed }
  const nextTarget =
    targetIds.find((targetId) =>
      !effectiveProgressState.completed.includes(targetId)
    ) ??
      null
  if (nextTarget === null) {
    yield* saveProgress({ completed, current: null })
    yield* Effect.logInfo("All selected benchmark targets are complete.")
    return [] as ReadonlyArray<BatchTargetResult>
  }

  yield* Effect.logInfo(
    `Starting batch with ${targets.length} targets from ${nextTarget}`,
  )
  const concurrency = options.concurrency === undefined
    ? parseRunConcurrency(process.env[RUN_CONCURRENCY_ENV])
    : parseRunConcurrency(String(options.concurrency))
  yield* Effect.logInfo(`Batch concurrency: ${concurrency}`)

  const initialState = effectiveProgressState
  const pendingTargets = targets.filter(
    (target) => !initialState.completed.includes(target.id),
  )

  for (const target of targets) {
    if (initialState.completed.includes(target.id)) {
      yield* Effect.logInfo(
        targetLogStyle(target.id, `Skipping ${target.id} (already completed)`),
      )
    }
  }

  const results = yield* Effect.forEach(pendingTargets, (target) =>
    Effect.gen(function*() {
      yield* Effect.logInfo(
        targetLogStyle(target.id, `Running target: ${target.id}`),
      )

      const outcome = yield* runResolvedTarget(
        target,
        {
          agentId: options.agentId,
          runs: options.runs,
          ...(options.prompt === undefined ? {} : { prompt: options.prompt }),
          ...(options.environmentId === undefined
            ? {}
            : { environmentId: options.environmentId }),
          ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
        },
        runsRoot,
      ).pipe(
        Effect.map((result) => ({ _tag: "Result" as const, result })),
        Effect.catch((error) =>
          Effect.succeed({
            _tag: "Error" as const,
            error: messageFor(error),
          }),
        ),
      )

      if (outcome._tag === "Error") {
        yield* Effect.logWarning(
          targetLogStyle(target.id, `Target ${target.id} failed: ${outcome.error}`),
        )
        return {
          _tag: "Failed",
          targetId: target.id,
          error: outcome.error,
          result: null,
        } satisfies BatchTargetResult
      }

      if (!isTargetRunSuccessful(outcome.result)) {
        yield* Effect.logWarning(
          targetLogStyle(target.id, `Target ${target.id} contains failed executions.`),
        )
        return {
          _tag: "Failed",
          targetId: target.id,
          error: "One or more requested executions failed.",
          result: outcome.result,
        } satisfies BatchTargetResult
      }

      yield* Effect.logInfo(
        targetLogStyle(target.id, `Completed target: ${target.id}`),
      )
      yield* progressLock.withPermit(Effect.gen(function*() {
        const nextCompleted = yield* Ref.modify(completedRef, (current) => {
          if (current.includes(target.id)) return [current, current]
          const next = [...current, target.id].sort()
          return [next, next]
        })
        yield* saveProgress({ completed: nextCompleted, current: null })
      }))
      return {
        _tag: "Completed",
        targetId: target.id,
        result: outcome.result,
      } satisfies BatchTargetResult
    }),
    { concurrency },
  )

  for (const result of results) {
    if (result?._tag === "Completed") yield* markCompleted(result.targetId)
  }
  yield* clearCurrent()
  yield* Effect.logInfo("Batch finished")
  return results.filter(isBatchTargetResult)
})
