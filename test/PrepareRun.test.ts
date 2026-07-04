import { afterEach, describe, test } from "bun:test"
import assert from "node:assert/strict"
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { Effect, Schema } from "effect"
import type { AgentConfig } from "../src/domain/Agent.js"
import { makeRun, type RunPaths } from "../src/domain/Run.js"
import { TaskIdSchema, type ResolvedTask } from "../src/domain/Task.js"
import { prepareRun } from "../src/programs/prepareRun.js"
import { FileSystemServiceLive } from "../src/services/FileSystemService.js"

const temporaryDirectories: string[] = []

const makeTemporaryDirectory = (): string => {
  const directory = mkdtempSync(path.join(tmpdir(), "ai-task-bench-run-"))
  temporaryDirectories.push(directory)
  return directory
}

const writeText = (filePath: string, content: string): void => {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, content, "utf8")
}

const makePaths = (runDirectory: string): RunPaths => ({
  input: path.join(runDirectory, "00-input"),
  workspace: path.join(runDirectory, "01-workspace"),
  agentHome: path.join(runDirectory, "02-agent-home"),
  agentConfig: path.join(runDirectory, "03-agent-config"),
  output: path.join(runDirectory, "04-output"),
  evidence: path.join(runDirectory, "05-evidence"),
  review: path.join(runDirectory, "06-review"),
  session: path.join(runDirectory, "07-session"),
})

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe("prepareRun", () => {
  test("uses previous output as the base and overlays the current stage public files", async () => {
    const root = makeTemporaryDirectory()
    const taskDirectory = path.join(root, "task")
    const publicDirectory = path.join(taskDirectory, "public")
    const originalDirectory = path.join(taskDirectory, "original")
    const gradingDirectory = path.join(taskDirectory, "grading")
    mkdirSync(originalDirectory, { recursive: true })
    mkdirSync(gradingDirectory, { recursive: true })

    writeText(path.join(publicDirectory, "INSTRUCTIONS.md"), "stage two\n")
    writeText(path.join(publicDirectory, "new-file.txt"), "new\n")

    const previousDirectory = path.join(root, "previous")
    const previousPaths = makePaths(previousDirectory)
    writeText(path.join(previousPaths.output, "INSTRUCTIONS.md"), "stage one\n")
    writeText(path.join(previousPaths.output, "solution.txt"), "preserved\n")
    const previousRun = makeRun(
      "previous-run",
      "course/stage-one",
      "test-agent",
      previousPaths,
    )

    const taskId = await Effect.runPromise(
      Schema.decodeUnknownEffect(TaskIdSchema)("course/stage-two"),
    )
    const task: ResolvedTask = {
      id: taskId,
      source: {
        _tag: "CumulativeStage",
        sequenceId: "course",
        stageKey: "stage-two",
        stageIndex: 2,
      },
      title: "Stage two",
      description: "Overlay fixture",
      evaluation: "manual",
      notes: {
        languageSpecified: true,
        starterProvided: true,
      },
      publicDir: "public",
      originalDir: "original",
      gradingDir: "grading",
      maxMinutes: 30,
      taskDir: taskDirectory,
      publicAbsPath: publicDirectory,
      originalAbsPath: originalDirectory,
      gradingAbsPath: gradingDirectory,
    }
    const agentConfig: AgentConfig = {
      id: "test-agent",
      type: "pi",
      model: "test-model",
      timeoutMinutes: 30,
      dockerImage: "test-image",
      envAllowlist: [],
    }

    const result = await Effect.runPromise(
      prepareRun(
        task,
        agentConfig,
        "new-run",
        path.join(root, "runs"),
        { _tag: "PreviousStageOutput", previousRun },
      ).pipe(Effect.provide(FileSystemServiceLive)),
    )

    assert.equal(
      readFileSync(path.join(result.paths.input, "solution.txt"), "utf8"),
      "preserved\n",
    )
    assert.equal(
      readFileSync(path.join(result.paths.input, "INSTRUCTIONS.md"), "utf8"),
      "stage two\n",
    )
    assert.equal(
      readFileSync(path.join(result.paths.workspace, "new-file.txt"), "utf8"),
      "new\n",
    )
  })
})
