import { Effect } from "effect"
import type { Run } from "../domain/Run.js"
import { RunStoreService } from "../services/RunStoreService.js"

/** List individual stage runs recursively, optionally filtered by task ID. */
export const listRuns = Effect.fnUntraced(function*(
  runsRoot: string,
  taskId?: string,
) {
  const runStore = yield* RunStoreService
  const runDirs = yield* runStore.listRunDirs(runsRoot)
  const runs: Run[] = []

  for (const directory of runDirs) {
    const run = yield* runStore
      .loadRun(directory)
      .pipe(Effect.catch(() => Effect.succeed(null)))
    if (run === null) continue
    if (taskId !== undefined && run.taskId !== taskId) continue
    runs.push(run)
  }

  runs.sort((left, right) => right.runId.localeCompare(left.runId))
  return runs as ReadonlyArray<Run>
})
