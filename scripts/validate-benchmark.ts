import path from "node:path"
import { Data, Effect, Layer } from "effect"
import type { ResolvedTask } from "../src/domain/Task.js"
import {
  BenchmarkCatalogService,
  BenchmarkCatalogServiceLive,
} from "../src/services/BenchmarkCatalogService.js"
import {
  EnvironmentRegistryService,
  EnvironmentRegistryServiceLive,
} from "../src/services/EnvironmentRegistryService.js"
import {
  FileSystemService,
  FileSystemServiceLive,
} from "../src/services/FileSystemService.js"

class BenchmarkValidationError extends Data.TaggedError(
  "BenchmarkValidationError",
)<{
  readonly reason: string
}> {
  override get message() {
    return `Benchmark validation failed: ${this.reason}`
  }
}

const fail = (reason: string) =>
  Effect.fail(new BenchmarkValidationError({ reason }))

const isMarkdown = (filePath: string): boolean => {
  const extension = path.extname(filePath).toLowerCase()
  return extension === ".md" || extension === ".markdown"
}

const validateTask = Effect.fnUntraced(function*(task: ResolvedTask) {
  const fs = yield* FileSystemService
  const environments = yield* EnvironmentRegistryService

  if (task.environmentId === undefined) {
    return yield* fail(`${task.id}: no execution environment is configured`)
  }

  const environment = yield* environments
    .getEnvironmentConfig(task.environmentId)
    .pipe(
      Effect.mapError(() =>
        new BenchmarkValidationError({
          reason: `${task.id}: unknown execution environment ${task.environmentId}`,
        }),
      ),
    )
  if (environment.id !== task.environmentId) {
    return yield* fail(
      `${task.id}: environment filename and id disagree for ${task.environmentId}`,
    )
  }

  const publicFiles = yield* fs.walkDir(task.publicAbsPath)

  if (publicFiles.length === 0) {
    return yield* fail(`${task.id}: public/ must contain at least one file`)
  }

  const markdownFiles = publicFiles.filter(isMarkdown)
  if (markdownFiles.length === 0) {
    return yield* fail(
      `${task.id}: public/ must contain a Markdown assignment statement`,
    )
  }

  let hasNonEmptyAssignment = false
  for (const markdownPath of markdownFiles) {
    const content = yield* fs.readFile(markdownPath)
    if (content.trim().length > 0) {
      hasNonEmptyAssignment = true
      break
    }
  }

  if (!hasNonEmptyAssignment) {
    return yield* fail(
      `${task.id}: every Markdown file in public/ is empty`,
    )
  }

  return {
    publicFiles: publicFiles.length,
    markdownFiles: markdownFiles.length,
  }
})

const program = Effect.gen(function*() {
  const catalog = yield* BenchmarkCatalogService
  const targets = yield* catalog.listTargets()

  if (targets.length === 0) {
    return yield* fail("No benchmark targets were found")
  }

  let standaloneTasks = 0
  let cumulativeSequences = 0
  let cumulativeStages = 0
  let publicFiles = 0
  let markdownAssignments = 0

  for (const target of targets) {
    if (target._tag === "StandaloneTask") {
      if (target.task.source._tag !== "Standalone") {
        return yield* fail(
          `${target.id}: standalone target has inconsistent task source`,
        )
      }

      const result = yield* validateTask(target.task)
      standaloneTasks += 1
      publicFiles += result.publicFiles
      markdownAssignments += result.markdownFiles
      continue
    }

    cumulativeSequences += 1
    const sequenceEnvironmentId = target.stages[0]?.task.environmentId
    for (const [offset, stage] of target.stages.entries()) {
      if (stage.task.environmentId !== sequenceEnvironmentId) {
        return yield* fail(
          `${target.id}: cumulative stages must share one execution environment`,
        )
      }
      const expectedIndex = offset + 1
      if (stage.index !== expectedIndex) {
        return yield* fail(
          `${target.id}/${stage.key}: stage index ${stage.index} does not match sequence position ${expectedIndex}`,
        )
      }

      const source = stage.task.source
      if (
        source._tag !== "CumulativeStage" ||
        source.sequenceId !== target.id ||
        source.stageKey !== stage.key ||
        source.stageIndex !== stage.index
      ) {
        return yield* fail(
          `${target.id}/${stage.key}: cumulative stage metadata does not match directory order`,
        )
      }

      const result = yield* validateTask(stage.task)
      cumulativeStages += 1
      publicFiles += result.publicFiles
      markdownAssignments += result.markdownFiles
    }
  }

  console.log(
    [
      `Validated ${targets.length} benchmark targets.`,
      `Standalone tasks: ${standaloneTasks}.`,
      `Cumulative sequences: ${cumulativeSequences}.`,
      `Cumulative stages: ${cumulativeStages}.`,
      `Public files: ${publicFiles}.`,
      `Markdown assignment files: ${markdownAssignments}.`,
    ].join(" "),
  )
})

const CatalogLayer = BenchmarkCatalogServiceLive.pipe(
  Layer.provide(FileSystemServiceLive),
)
const EnvironmentLayer = EnvironmentRegistryServiceLive.pipe(
  Layer.provide(FileSystemServiceLive),
)
const ValidationLayer = Layer.merge(
  FileSystemServiceLive,
  Layer.merge(CatalogLayer, EnvironmentLayer),
)

Effect.runPromise(program.pipe(Effect.provide(ValidationLayer))).catch(
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  },
)
