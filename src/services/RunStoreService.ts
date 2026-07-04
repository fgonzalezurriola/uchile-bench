import { Context, Effect, Layer, Schema } from "effect"
import path from "node:path"
import type { Run, RunMetrics } from "../domain/Run.js"
import { FileSystemError } from "../domain/Errors.js"
import { RunJsonSchema } from "../schemas/RunJson.js"
import { FileSystemService } from "./FileSystemService.js"

const emptyMetrics = (): RunMetrics => ({
  totalTurns: null,
  totalToolCalls: null,
  totalTokens: null,
  inputTokens: null,
  outputTokens: null,
  reasoningTokens: null,
  costUsd: null,
  totalThinkingChars: null,
})

/** Persistence and legacy normalization for individual `run.json` records. */
export class RunStoreService extends Context.Service<
  RunStoreService,
  {
    readonly saveRun: (
      run: Run,
      runDir: string,
    ) => Effect.Effect<void, FileSystemError>
    readonly loadRun: (
      runDir: string,
    ) => Effect.Effect<Run, FileSystemError>
    readonly listRunDirs: (
      runsDir: string,
    ) => Effect.Effect<ReadonlyArray<string>>
  }
>()("RunStoreService") {}

/** Live run store backed by the repository filesystem. */
export const RunStoreServiceLive = Layer.effect(
  RunStoreService,
  Effect.gen(function*() {
    const fs = yield* FileSystemService

    const saveRun = Effect.fnUntraced(function*(run: Run, runDir: string) {
      yield* fs.mkdirRecursive(runDir)
      yield* fs.writeJson(`${runDir}/run.json`, run)
    })

    const loadRun = Effect.fnUntraced(function*(runDir: string) {
      const manifestPath = `${runDir}/run.json`
      const raw = yield* fs.readJson<unknown>(manifestPath)
      const decoded = yield* Schema.decodeUnknownEffect(RunJsonSchema)(raw).pipe(
        Effect.mapError(
          (cause) =>
            new FileSystemError({
              path: manifestPath,
              reason: `Invalid run.json: ${String(cause)}`,
              cause,
            }),
        ),
      )

      return {
        ...decoded,
        environmentId: decoded.environmentId ?? null,
        paths: {
          ...decoded.paths,
          session: decoded.paths.session ?? `${runDir}/07-session`,
        },
        metrics: decoded.metrics ?? emptyMetrics(),
        error:
          decoded.error === null || typeof decoded.error === "string"
            ? decoded.error
            : decoded.error.message,
      } satisfies Run
    })

    const listRunDirs = Effect.fnUntraced(function*(runsDir: string) {
      const files = yield* fs.walkDir(runsDir)
      return files
        .filter((file) => path.basename(file) === "run.json")
        .filter((file) => !path.relative(runsDir, file).split(path.sep).includes("archive"))
        .map((file) => path.dirname(file))
        .sort()
    })

    return { saveRun, loadRun, listRunDirs }
  }),
)
