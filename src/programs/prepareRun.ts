import { Effect } from "effect"
import path from "node:path"
import type { AgentConfig } from "../domain/Agent.js"
import type { Run, RunPaths } from "../domain/Run.js"
import { makeRun } from "../domain/Run.js"
import type { ResolvedTask } from "../domain/Task.js"
import { FileSystemService } from "../services/FileSystemService.js"

/** Input used to initialize an individual task-stage run. */
export type RunInput =
  | {
      readonly _tag: "TaskPublic"
    }
  | {
      readonly _tag: "PreviousStageOutput"
      readonly previousRun: Run
    }

/** Serializable provenance recorded beside each run. */
export type RunInputSource =
  | {
      readonly type: "task-public"
      readonly taskId: string
    }
  | {
      readonly type: "previous-stage-output"
      readonly taskId: string
      readonly previousTaskId: string
      readonly previousRunId: string
      readonly previousOutputPath: string
    }

/** Convert an in-memory run input into persisted provenance. */
export const describeRunInput = (
  task: ResolvedTask,
  input: RunInput,
): RunInputSource =>
  input._tag === "TaskPublic"
    ? {
        type: "task-public",
        taskId: task.id,
      }
    : {
        type: "previous-stage-output",
        taskId: task.id,
        previousTaskId: input.previousRun.taskId,
        previousRunId: input.previousRun.runId,
        previousOutputPath: input.previousRun.paths.output,
      }

/**
 * Create a run directory and immutable input snapshot for one task stage.
 */
export const prepareRun = Effect.fnUntraced(function*(
  task: ResolvedTask,
  agentConfig: AgentConfig,
  runId: string,
  runParentDir: string,
  input: RunInput,
  environmentId: string | null = null,
) {
  const fs = yield* FileSystemService
  const runDir = path.resolve(runParentDir, runId)
  const paths: RunPaths = {
    input: `${runDir}/00-input`,
    workspace: `${runDir}/01-workspace`,
    agentHome: `${runDir}/02-agent-home`,
    agentConfig: `${runDir}/03-agent-config`,
    output: `${runDir}/04-output`,
    evidence: `${runDir}/05-evidence`,
    review: `${runDir}/06-review`,
    session: `${runDir}/07-session`,
  }

  yield* fs.mkdirRecursive(runParentDir)
  yield* fs.mkdirRecursive(runDir)
  yield* fs.mkdirRecursive(paths.input)
  yield* fs.mkdirRecursive(paths.workspace)
  yield* fs.mkdirRecursive(paths.agentHome)
  yield* fs.mkdirRecursive(paths.agentConfig)
  yield* fs.mkdirRecursive(paths.output)
  yield* fs.mkdirRecursive(paths.evidence)
  yield* fs.mkdirRecursive(paths.review)
  yield* fs.mkdirRecursive(paths.session)

  if (input._tag === "TaskPublic") {
    yield* fs.copyDir(task.publicAbsPath, paths.input)
  } else {
    yield* fs.copyDir(input.previousRun.paths.output, paths.input)
    yield* fs.copyDir(task.publicAbsPath, paths.input)
  }

  yield* fs.copyDir(paths.input, paths.workspace)

  const run = makeRun(
    runId,
    task.id,
    agentConfig.id,
    paths,
    environmentId,
  )
  yield* fs.writeJson(`${runDir}/run.json`, run)
  yield* fs.writeJson(
    `${runDir}/input-source.json`,
    describeRunInput(task, input),
  )

  return { run, runDir, paths }
})
