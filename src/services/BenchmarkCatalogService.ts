import { Context, Effect, Layer, Schema } from "effect"
import path from "node:path"
import {
  BenchmarkTargetIdSchema,
  type BenchmarkTarget,
  type BenchmarkTargetId,
  type CumulativeSequence,
  type CumulativeStage,
  type StandaloneTask,
} from "../domain/BenchmarkTarget.js"
import {
  BenchmarkLayoutError,
  BenchmarkManifestError,
  BenchmarkTargetNotFoundError,
  FileSystemError,
  TaskNotFoundError,
} from "../domain/Errors.js"
import {
  TaskIdSchema,
  type ResolvedTask,
  type TaskId,
  type TaskSource,
} from "../domain/Task.js"
import { CourseEnvironmentConfigSchema } from "../schemas/CourseEnvironmentConfig.js"
import { TaskJsonSchema } from "../schemas/TaskJson.js"
import { FileSystemService } from "./FileSystemService.js"

/** Errors produced while discovering or resolving benchmark targets. */
export type BenchmarkCatalogError =
  | FileSystemError
  | BenchmarkManifestError
  | BenchmarkLayoutError

/** Catalog operations over standalone tasks and cumulative sequences. */
export class BenchmarkCatalogService extends Context.Service<
  BenchmarkCatalogService,
  {
    readonly listTargets: () => Effect.Effect<
      ReadonlyArray<BenchmarkTarget>,
      BenchmarkCatalogError
    >
    readonly getTarget: (
      targetId: string,
    ) => Effect.Effect<
      BenchmarkTarget,
      BenchmarkCatalogError | BenchmarkTargetNotFoundError
    >
    readonly getTask: (
      taskId: string,
    ) => Effect.Effect<
      ResolvedTask,
      BenchmarkCatalogError | TaskNotFoundError
    >
  }
>()("BenchmarkCatalogService") {}

const normalizeCatalogPath = (value: string): string =>
  value.split(path.sep).join("/")

const compareCatalogNames = (left: string, right: string): number =>
  left.localeCompare(right, "en")

const isPaddedTaskKey = (value: string): boolean =>
  !/^t\d+$/.test(value) || /^t\d{2,}$/.test(value)

const isWithinDirectory = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate)
  return (
    relative.length === 0 ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  )
}

const decodeTargetId = (
  value: string,
  sourcePath: string,
): Effect.Effect<BenchmarkTargetId, BenchmarkLayoutError> =>
  Schema.decodeUnknownEffect(BenchmarkTargetIdSchema)(value).pipe(
    Effect.mapError(
      (cause) =>
        new BenchmarkLayoutError({
          path: sourcePath,
          reason: `Invalid target identifier ${JSON.stringify(value)}: ${String(cause)}`,
        }),
    ),
  )

const decodeTaskId = (
  value: string,
  sourcePath: string,
): Effect.Effect<TaskId, BenchmarkLayoutError> =>
  Schema.decodeUnknownEffect(TaskIdSchema)(value).pipe(
    Effect.mapError(
      (cause) =>
        new BenchmarkLayoutError({
          path: sourcePath,
          reason: `Invalid task identifier ${JSON.stringify(value)}: ${String(cause)}`,
        }),
    ),
  )

const makeCatalog = Effect.fnUntraced(function*(tasksRoot: string) {
  const fs = yield* FileSystemService
  const standaloneRoot = path.resolve(tasksRoot, "standalone")
  const cumulativeRoot = path.resolve(tasksRoot, "cumulative")
  const courseEnvironmentsPath = path.resolve(tasksRoot, "environments.json")
  const hasCourseEnvironments = yield* fs.exists(courseEnvironmentsPath)
  const courseEnvironmentEntries = hasCourseEnvironments
    ? yield* fs.readJson<unknown>(courseEnvironmentsPath).pipe(
        Effect.flatMap(
          Schema.decodeUnknownEffect(CourseEnvironmentConfigSchema),
        ),
        Effect.mapError(
          (cause) =>
            new BenchmarkManifestError({
              path: courseEnvironmentsPath,
              reason: String(cause),
              cause,
            }),
        ),
      )
    : []
  const courseEnvironments = new Map<string, string>()
  for (const entry of courseEnvironmentEntries) {
    if (courseEnvironments.has(entry.courseId)) {
      return yield* Effect.fail(
        new BenchmarkManifestError({
          path: courseEnvironmentsPath,
          reason: `Duplicate course environment: ${entry.courseId}`,
        }),
      )
    }
    courseEnvironments.set(entry.courseId, entry.environmentId)
  }

  const findManifestDirectories: (
    root: string,
    manifestName: string,
  ) => Effect.Effect<ReadonlyArray<string>, FileSystemError> =
    Effect.fnUntraced(function*(root, manifestName) {
      const exists = yield* fs.exists(root)
      if (!exists) return []

      const manifestPath = path.join(root, manifestName)
      const hasManifest = yield* fs.exists(manifestPath)
      if (hasManifest) return [root]

      const entries = yield* fs.listDirEntries(root)
      const directories: string[] = []
      for (const entry of entries) {
        if (entry.kind !== "directory") continue
        const nested = yield* findManifestDirectories(
          path.join(root, entry.name),
          manifestName,
        )
        directories.push(...nested)
      }
      return directories
    })

  const listChildDirectories = Effect.fnUntraced(function*(root: string) {
    const exists = yield* fs.exists(root)
    if (!exists) return []

    const entries = yield* fs.listDirEntries(root)
    return entries
      .filter((entry) => entry.kind === "directory")
      .map((entry) => path.join(root, entry.name))
      .sort((left, right) =>
        compareCatalogNames(path.basename(left), path.basename(right)),
      )
  })

  const decodeTaskManifest = Effect.fnUntraced(function*(manifestPath: string) {
    const raw = yield* fs.readJson<unknown>(manifestPath)
    return yield* Schema.decodeUnknownEffect(TaskJsonSchema)(raw).pipe(
      Effect.mapError(
        (cause) =>
          new BenchmarkManifestError({
            path: manifestPath,
            reason: String(cause),
            cause,
          }),
      ),
    )
  })

  const requireDirectory = Effect.fnUntraced(function*(directoryPath: string) {
    yield* fs.listDirEntries(directoryPath).pipe(
      Effect.mapError(
        () =>
          new BenchmarkLayoutError({
            path: directoryPath,
            reason: "Required directory is missing or is not a directory.",
          }),
      ),
    )
  })

  const loadTask: (
    taskDir: string,
    taskIdValue: string,
    source: TaskSource,
  ) => Effect.Effect<ResolvedTask, BenchmarkCatalogError> =
    Effect.fnUntraced(function*(taskDir, taskIdValue, source) {
      const manifestPath = path.join(taskDir, "task.json")
      const manifest = yield* decodeTaskManifest(manifestPath)
      const id = yield* decodeTaskId(taskIdValue, taskDir)
      const publicDir = manifest.publicDir ?? "public"
      const originalDir = manifest.originalDir ?? "original"
      const gradingDir = manifest.gradingDir ?? "grading"
      const courseId = taskIdValue.split("/")[0] ?? taskIdValue
      const environmentId =
        manifest.environmentId ?? courseEnvironments.get(courseId)
      const publicAbsPath = path.resolve(taskDir, publicDir)
      const originalAbsPath = path.resolve(taskDir, originalDir)
      const gradingAbsPath = path.resolve(taskDir, gradingDir)
      const contentDirectories = [
        publicAbsPath,
        originalAbsPath,
        gradingAbsPath,
      ]

      for (const directoryPath of contentDirectories) {
        if (!isWithinDirectory(tasksRoot, directoryPath)) {
          return yield* Effect.fail(
            new BenchmarkLayoutError({
              path: manifestPath,
              reason: `Task content directory escapes tasks root: ${directoryPath}`,
            }),
          )
        }
      }
      if (new Set(contentDirectories).size !== contentDirectories.length) {
        return yield* Effect.fail(
          new BenchmarkLayoutError({
            path: manifestPath,
            reason:
              "publicDir, originalDir, and gradingDir must resolve to distinct directories.",
          }),
        )
      }

      yield* requireDirectory(publicAbsPath)
      yield* requireDirectory(originalAbsPath)
      yield* requireDirectory(gradingAbsPath)

      return {
        ...manifest,
        ...(environmentId === undefined ? {} : { environmentId }),
        id,
        source,
        publicDir,
        originalDir,
        gradingDir,
        maxMinutes: manifest.maxMinutes ?? 180,
        taskDir: path.resolve(taskDir),
        publicAbsPath,
        originalAbsPath,
        gradingAbsPath,
      }
    })

  const loadStandaloneTarget: (
    taskDir: string,
  ) => Effect.Effect<StandaloneTask, BenchmarkCatalogError> =
    Effect.fnUntraced(function*(taskDir) {
      const relativePath = normalizeCatalogPath(
        path.relative(standaloneRoot, taskDir),
      )
      const id = yield* decodeTargetId(relativePath, taskDir)
      const task = yield* loadTask(taskDir, relativePath, { _tag: "Standalone" })
      return {
        _tag: "StandaloneTask",
        id,
        title: task.title,
        description: task.description,
        task,
      }
    })

  const loadCumulativeTarget: (
    sequenceDir: string,
  ) => Effect.Effect<CumulativeSequence, BenchmarkCatalogError> =
    Effect.fnUntraced(function*(sequenceDir) {
      const relativePath = normalizeCatalogPath(
        path.relative(cumulativeRoot, sequenceDir),
      )
      const id = yield* decodeTargetId(relativePath, sequenceDir)
      const candidateDirectories = yield* listChildDirectories(sequenceDir)
      const stageDirectories: string[] = []

      for (const taskDir of candidateDirectories) {
        const key = path.basename(taskDir)
        if (!isPaddedTaskKey(key)) continue
        const hasTaskManifest = yield* fs.exists(path.join(taskDir, "task.json"))
        if (hasTaskManifest) stageDirectories.push(taskDir)
      }

      stageDirectories.sort((left, right) =>
        compareCatalogNames(path.basename(left), path.basename(right)),
      )

      const stages: CumulativeStage[] = []
      for (const [offset, taskDir] of stageDirectories.entries()) {
        const key = path.basename(taskDir)
        const task = yield* loadTask(taskDir, `${id}/${key}`, {
          _tag: "CumulativeStage",
          sequenceId: id,
          stageKey: key,
          stageIndex: offset + 1,
        })
        stages.push({ key, index: offset + 1, task })
      }

      const first = stages[0]
      if (first === undefined) {
        return yield* Effect.fail(
          new BenchmarkLayoutError({
            path: sequenceDir,
            reason:
              "A cumulative sequence must contain at least one task directory.",
          }),
        )
      }

      return {
        _tag: "CumulativeSequence",
        id,
        title: id,
        description: `Cumulative sequence with ${stages.length} stages.`,
        sequenceDir: path.resolve(sequenceDir),
        stages: [first, ...stages.slice(1)],
      }
    })

  const listTargets: () => Effect.Effect<
    ReadonlyArray<BenchmarkTarget>,
    BenchmarkCatalogError
  > = Effect.fnUntraced(function*() {
    const standaloneDirectories = (
      yield* findManifestDirectories(standaloneRoot, "task.json")
    ).filter((taskDir) => isPaddedTaskKey(path.basename(taskDir)))
    const cumulativeDirectories = yield* listChildDirectories(cumulativeRoot)
    const targets: BenchmarkTarget[] = []

    for (const taskDir of standaloneDirectories) {
      targets.push(yield* loadStandaloneTarget(taskDir))
    }
    for (const sequenceDir of cumulativeDirectories) {
      targets.push(yield* loadCumulativeTarget(sequenceDir))
    }

    targets.sort((left, right) => compareCatalogNames(left.id, right.id))
    for (let index = 1; index < targets.length; index++) {
      const previous = targets[index - 1]
      const current = targets[index]
      if (
        previous !== undefined &&
        current !== undefined &&
        previous.id === current.id
      ) {
        return yield* Effect.fail(
          new BenchmarkLayoutError({
            path: tasksRoot,
            reason: `Duplicate benchmark target identifier: ${current.id}`,
          }),
        )
      }
    }

    return targets
  })

  const getTarget = Effect.fnUntraced(function*(targetId: string) {
    const targets = yield* listTargets()
    const target = targets.find((candidate) => candidate.id === targetId)
    if (target === undefined) {
      return yield* Effect.fail(new BenchmarkTargetNotFoundError({ targetId }))
    }
    return target
  })

  const getTask = Effect.fnUntraced(function*(taskId: string) {
    const targets = yield* listTargets()
    for (const target of targets) {
      if (target._tag === "StandaloneTask") {
        if (target.task.id === taskId) return target.task
        continue
      }
      const stage = target.stages.find((candidate) => candidate.task.id === taskId)
      if (stage !== undefined) return stage.task
    }
    return yield* Effect.fail(new TaskNotFoundError({ taskId }))
  })

  return { listTargets, getTarget, getTask }
})

/** Build a catalog layer for a specific tasks root. Primarily used by tests. */
export const BenchmarkCatalogServiceLayer = (tasksRoot: string) =>
  Layer.effect(BenchmarkCatalogService, makeCatalog(path.resolve(tasksRoot)))

/** Catalog layer backed by the repository's hardcoded task roots. */
export const BenchmarkCatalogServiceLive = BenchmarkCatalogServiceLayer(
  path.resolve("tasks"),
)
