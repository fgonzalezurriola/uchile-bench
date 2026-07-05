import { afterEach, describe, test } from "bun:test"
import assert from "node:assert/strict"
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { Effect, Layer } from "effect"
import {
  BenchmarkCatalogService,
  BenchmarkCatalogServiceLayer,
} from "../src/services/BenchmarkCatalogService.js"
import { FileSystemServiceLive } from "../src/services/FileSystemService.js"

const temporaryDirectories: string[] = []

const makeTemporaryTasksRoot = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "ai-task-bench-catalog-"))
  temporaryDirectories.push(root)
  return path.join(root, "tasks")
}

const writeJson = (filePath: string, value: unknown): void => {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

const createTask = (
  taskDirectory: string,
  title: string,
  description = "Benchmark fixture",
): void => {
  for (const directory of ["public", "original", "grading"]) {
    mkdirSync(path.join(taskDirectory, directory), { recursive: true })
  }
  writeJson(path.join(taskDirectory, "task.json"), {
    title,
    description,
    evaluation: "manual",
    notes: {
      languageSpecified: true,
      starterProvided: false,
    },
  })
}

const catalogLayer = (tasksRoot: string) =>
  BenchmarkCatalogServiceLayer(tasksRoot).pipe(
    Layer.provide(FileSystemServiceLive),
  )

const listTargets = (tasksRoot: string) =>
  Effect.gen(function*() {
    const catalog = yield* BenchmarkCatalogService
    return yield* catalog.listTargets()
  }).pipe(Effect.provide(catalogLayer(tasksRoot)))

const getTask = (tasksRoot: string, taskId: string) =>
  Effect.gen(function*() {
    const catalog = yield* BenchmarkCatalogService
    return yield* catalog.getTask(taskId)
  }).pipe(Effect.provide(catalogLayer(tasksRoot)))

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe("BenchmarkCatalogService", () => {
  test("discovers standalone tasks and alphabetically ordered cumulative stages", async () => {
    const tasksRoot = makeTemporaryTasksRoot()
    createTask(
      path.join(tasksRoot, "standalone", "CC3001", "t01"),
      "Standalone",
    )

    const sequenceDirectory = path.join(tasksRoot, "cumulative", "CC3501")
    createTask(path.join(sequenceDirectory, "t02"), "Second")
    createTask(path.join(sequenceDirectory, "t01"), "First")

    const targets = await Effect.runPromise(listTargets(tasksRoot))

    assert.deepEqual(
      targets.map((target) => [target.id, target._tag]),
      [
        ["CC3001/t01", "StandaloneTask"],
        ["CC3501", "CumulativeSequence"],
      ],
    )

    const cumulative = targets[1]
    assert.equal(cumulative?._tag, "CumulativeSequence")
    if (cumulative?._tag !== "CumulativeSequence") {
      assert.fail("Expected cumulative sequence")
    }
    assert.deepEqual(
      cumulative.stages.map((stage) => [stage.index, stage.key, stage.task.id]),
      [
        [1, "t01", "CC3501/t01"],
        [2, "t02", "CC3501/t02"],
      ],
    )

    const secondStage = await Effect.runPromise(
      getTask(tasksRoot, "CC3501/t02"),
    )
    assert.deepEqual(secondStage.source, {
      _tag: "CumulativeStage",
      sequenceId: "CC3501",
      stageKey: "t02",
      stageIndex: 2,
    })
  })

  test("inherits the course execution environment", async () => {
    const tasksRoot = makeTemporaryTasksRoot()
    writeJson(path.join(tasksRoot, "environments.json"), [
      {
        courseId: "CC3001",
        environmentId: "cc3001",
      },
    ])
    createTask(
      path.join(tasksRoot, "standalone", "CC3001", "t01"),
      "Standalone",
    )

    const task = await Effect.runPromise(
      getTask(tasksRoot, "CC3001/t01"),
    )

    assert.equal(task.environmentId, "cc3001")
  })

  test("ignores unpadded task directory names", async () => {
    const tasksRoot = makeTemporaryTasksRoot()
    createTask(
      path.join(tasksRoot, "standalone", "CC3001", "t1"),
      "Legacy standalone",
    )
    createTask(
      path.join(tasksRoot, "standalone", "CC3001", "t01"),
      "Padded standalone",
    )

    const sequenceDirectory = path.join(tasksRoot, "cumulative", "CC3501")
    createTask(path.join(sequenceDirectory, "t1"), "Legacy stage")
    createTask(path.join(sequenceDirectory, "t01"), "Padded stage")

    const targets = await Effect.runPromise(listTargets(tasksRoot))

    assert.deepEqual(
      targets.map((target) => target.id),
      ["CC3001/t01", "CC3501"],
    )
    const cumulative = targets[1]
    assert.equal(cumulative?._tag, "CumulativeSequence")
    if (cumulative?._tag !== "CumulativeSequence") {
      assert.fail("Expected cumulative sequence")
    }
    assert.deepEqual(
      cumulative.stages.map((stage) => stage.key),
      ["t01"],
    )
  })

  test("orders benchmark targets by course identifier and then task key", async () => {
    const tasksRoot = makeTemporaryTasksRoot()
    createTask(path.join(tasksRoot, "standalone", "CC3001", "t02"), "Second task")
    createTask(path.join(tasksRoot, "standalone", "CC4001", "t01"), "First task")

    const sequenceDirectory = path.join(tasksRoot, "cumulative", "CC3501")
    createTask(path.join(sequenceDirectory, "t01"), "Sequence first stage")

    const targets = await Effect.runPromise(listTargets(tasksRoot))

    assert.deepEqual(
      targets.map((target) => target.id),
      ["CC3001/t02", "CC3501", "CC4001/t01"],
    )
  })

  test("rejects task content directories outside the tasks root", async () => {
    const tasksRoot = makeTemporaryTasksRoot()
    const taskDirectory = path.join(tasksRoot, "standalone", "unsafe")
    mkdirSync(path.join(taskDirectory, "original"), { recursive: true })
    mkdirSync(path.join(taskDirectory, "grading"), { recursive: true })
    writeJson(path.join(taskDirectory, "task.json"), {
      title: "Unsafe",
      description: "Escaping content directory fixture",
      publicDir: "../../../../outside",
      evaluation: "manual",
      notes: {
        languageSpecified: true,
        starterProvided: false,
      },
    })

    const error = await Effect.runPromise(
      listTargets(tasksRoot).pipe(Effect.flip),
    )
    assert.equal(error._tag, "BenchmarkLayoutError")
  })

  test("rejects a cumulative directory without task stages", async () => {
    const tasksRoot = makeTemporaryTasksRoot()
    mkdirSync(path.join(tasksRoot, "cumulative", "empty"), { recursive: true })

    const error = await Effect.runPromise(
      listTargets(tasksRoot).pipe(Effect.flip),
    )
    assert.equal(error._tag, "BenchmarkLayoutError")
  })
})
