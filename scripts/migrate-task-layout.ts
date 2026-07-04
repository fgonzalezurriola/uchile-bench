import { Data, Effect, Schema } from "effect"
import {
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  rmdirSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { TaskJsonSchema } from "../src/schemas/TaskJson.js"

class TaskLayoutMigrationError extends Data.TaggedError(
  "TaskLayoutMigrationError",
)<{
  readonly path: string
  readonly reason: string
  readonly cause?: unknown
}> {
  override get message() {
    return `Task layout migration failed at ${this.path}: ${this.reason}`
  }
}

interface TaskMove {
  readonly source: string
  readonly destination: string
  readonly legacyCatalogPath: string
}

const root = process.cwd()
const tasksRoot = path.resolve(root, "tasks")
const dryRun = process.argv.includes("--dry-run")

const paddedTaskKey = (index: number): string => `t${String(index).padStart(2, "0")}`

const moves: ReadonlyArray<TaskMove> = [
  ...[1, 2, 3, 4, 5, 6].map(
    (index): TaskMove => ({
      source: path.join(tasksRoot, "CC3001", `t${index}`),
      destination: path.join(
        tasksRoot,
        "standalone",
        "CC3001",
        paddedTaskKey(index),
      ),
      legacyCatalogPath: path.join(
        tasksRoot,
        "standalone",
        "CC3001",
        `t${index}`,
      ),
    }),
  ),
  ...[1, 2, 3].map(
    (index): TaskMove => ({
      source: path.join(tasksRoot, "CC3501", `t${index}`),
      destination: path.join(
        tasksRoot,
        "cumulative",
        "CC3501",
        paddedTaskKey(index),
      ),
      legacyCatalogPath: path.join(
        tasksRoot,
        "cumulative",
        "CC3501",
        "stages",
        `t${index}`,
      ),
    }),
  ),
]

const fail = (targetPath: string, reason: string, cause?: unknown) =>
  new TaskLayoutMigrationError({ path: targetPath, reason, cause })

const moveDirectory = (source: string, destination: string) =>
  Effect.try({
    try: () => {
      if (!existsSync(source)) {
        if (existsSync(destination)) {
          console.log(`already moved ${source} -> ${destination}`)
          return
        }
        throw new Error("Neither source nor destination exists")
      }
      if (existsSync(destination)) {
        throw new Error("Destination already exists; refusing to merge")
      }
      if (!dryRun) renameSync(source, destination)
      console.log(`${dryRun ? "would move" : "moved"} ${source} -> ${destination}`)
    },
    catch: (cause) => fail(source, `Cannot move directory to ${destination}`, cause),
  })

const rewriteManifest = Effect.fnUntraced(function*(manifestPath: string) {
  const raw = yield* Effect.try({
    try: () => JSON.parse(readFileSync(manifestPath, "utf8")) as unknown,
    catch: (cause) => fail(manifestPath, "Cannot read task manifest", cause),
  })
  const manifest = yield* Schema.decodeUnknownEffect(TaskJsonSchema)(raw).pipe(
    Effect.mapError((cause) => fail(manifestPath, "Invalid task manifest", cause)),
  )
  const cleanManifest = {
    title: manifest.title,
    description: manifest.description,
    evaluation: manifest.evaluation,
    ...(manifest.maxMinutes === undefined
      ? {}
      : { maxMinutes: manifest.maxMinutes }),
    notes: manifest.notes,
  }

  yield* Effect.try({
    try: () => {
      if (!dryRun) {
        writeFileSync(
          manifestPath,
          `${JSON.stringify(cleanManifest, null, 2)}\n`,
          "utf8",
        )
      }
      console.log(`${dryRun ? "would rewrite" : "rewrote"} ${manifestPath}`)
    },
    catch: (cause) => fail(manifestPath, "Cannot rewrite task manifest", cause),
  })
})

const removePath = (targetPath: string) =>
  Effect.try({
    try: () => {
      if (!existsSync(targetPath)) return
      if (!dryRun) rmSync(targetPath, { recursive: true, force: true })
      console.log(`${dryRun ? "would remove" : "removed"} ${targetPath}`)
    },
    catch: (cause) => fail(targetPath, "Cannot remove obsolete path", cause),
  })

const removeIfEmpty = (directory: string) =>
  Effect.try({
    try: () => {
      if (!existsSync(directory) || readdirSync(directory).length > 0) return
      if (!dryRun) rmdirSync(directory)
      console.log(`${dryRun ? "would remove" : "removed"} ${directory}`)
    },
    catch: (cause) => fail(directory, "Cannot remove empty directory", cause),
  })

const migrateTask = Effect.fnUntraced(function*(move: TaskMove) {
  for (const directoryName of ["public", "original", "grading"]) {
    yield* moveDirectory(
      path.join(move.source, directoryName),
      path.join(move.destination, directoryName),
    )
  }

  yield* rewriteManifest(path.join(move.destination, "task.json"))
  yield* removePath(path.join(move.source, "task.json"))
  yield* removePath(move.legacyCatalogPath)
  yield* removeIfEmpty(move.source)
})

const program = Effect.gen(function*() {
  for (const move of moves) yield* migrateTask(move)

  yield* removePath(path.join(tasksRoot, "cumulative", "CC3501", "sequence.json"))
  yield* removeIfEmpty(path.join(tasksRoot, "cumulative", "CC3501", "stages"))
  yield* removeIfEmpty(path.join(tasksRoot, "CC3001"))
  yield* removeIfEmpty(path.join(tasksRoot, "CC3501"))

  console.log(
    dryRun
      ? "Dry run complete; no files changed."
      : "Task layout migration complete.",
  )
})

Effect.runPromise(program).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
