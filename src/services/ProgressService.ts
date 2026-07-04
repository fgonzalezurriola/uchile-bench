import { Context, Effect, Layer, Schema } from "effect"
import path from "node:path"
import { FileSystemError } from "../domain/Errors.js"
import { FileSystemService } from "./FileSystemService.js"

/** Persisted batch progress over benchmark target IDs. */
export interface ProgressData {
  readonly completed: ReadonlyArray<string>
  readonly current: string | null
}

const ProgressDataSchema = Schema.Struct({
  completed: Schema.Array(Schema.String),
  current: Schema.NullOr(Schema.String),
})

const defaultProgress = (): ProgressData => ({
  completed: [],
  current: null,
})

/** Persistence operations for resumable batch execution. */
export class ProgressService extends Context.Service<
  ProgressService,
  {
    readonly load: () => Effect.Effect<ProgressData>
    readonly save: (
      data: ProgressData,
    ) => Effect.Effect<void, FileSystemError>
    readonly markCompleted: (
      targetId: string,
    ) => Effect.Effect<void, FileSystemError>
    readonly markCurrent: (
      targetId: string,
    ) => Effect.Effect<void, FileSystemError>
    readonly clearCurrent: () => Effect.Effect<void, FileSystemError>
    readonly reset: () => Effect.Effect<void, FileSystemError>
    readonly getNextTarget: (
      targetIds: ReadonlyArray<string>,
    ) => Effect.Effect<string | null>
  }
>()("ProgressService") {}

/** Live progress service backed by `progress.json`. */
export const ProgressServiceLive = Layer.effect(
  ProgressService,
  Effect.gen(function*() {
    const fs = yield* FileSystemService
    const progressPath = path.resolve("progress.json")

    const load = Effect.fnUntraced(function*() {
      const exists = yield* fs.exists(progressPath)
      if (!exists) return defaultProgress()

      const raw = yield* fs
        .readJson<unknown>(progressPath)
        .pipe(Effect.catch(() => Effect.succeed(null)))
      if (raw === null) return defaultProgress()

      return yield* Schema.decodeUnknownEffect(ProgressDataSchema)(raw).pipe(
        Effect.catch(() => Effect.succeed(defaultProgress())),
      )
    })

    const save = (data: ProgressData) => fs.writeJson(progressPath, data)

    const markCompleted = Effect.fnUntraced(function*(targetId: string) {
      const data = yield* load()
      if (data.completed.includes(targetId)) return
      yield* save({
        completed: [...data.completed, targetId].sort(),
        current: data.current === targetId ? null : data.current,
      })
    })

    const markCurrent = Effect.fnUntraced(function*(targetId: string) {
      const data = yield* load()
      yield* save({ ...data, current: targetId })
    })

    const clearCurrent = Effect.fnUntraced(function*() {
      const data = yield* load()
      yield* save({ ...data, current: null })
    })

    const reset = () => save(defaultProgress())

    const getNextTarget = Effect.fnUntraced(function*(
      targetIds: ReadonlyArray<string>,
    ) {
      const data = yield* load()
      return targetIds.find((targetId) => !data.completed.includes(targetId)) ?? null
    })

    return {
      load,
      save,
      markCompleted,
      markCurrent,
      clearCurrent,
      reset,
      getNextTarget,
    }
  }),
)
