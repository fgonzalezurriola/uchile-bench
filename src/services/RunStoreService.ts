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

const runPathsFor = (runDir: string) => ({
  input: path.join(runDir, "00-input"),
  workspace: path.join(runDir, "01-workspace"),
  agentHome: path.join(runDir, "02-agent-home"),
  agentConfig: path.join(runDir, "03-agent-config"),
  output: path.join(runDir, "04-output"),
  evidence: path.join(runDir, "05-evidence"),
  review: path.join(runDir, "06-review"),
  session: path.join(runDir, "07-session"),
})

const persistedRunPaths = {
  input: "00-input",
  workspace: "01-workspace",
  agentHome: "02-agent-home",
  agentConfig: "03-agent-config",
  output: "04-output",
  evidence: "05-evidence",
  review: "06-review",
  session: "07-session",
}

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
      yield* fs.writeJson(`${runDir}/run.json`, {
        ...run,
        paths: persistedRunPaths,
      })
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
        paths: runPathsFor(runDir),
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
