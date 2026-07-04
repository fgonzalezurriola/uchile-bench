import { Schema } from "effect"
import type { TaskManifest, TaskNotes } from "../schemas/TaskJson.js"

/** Stable identifier derived from a task's directory path. */
export const TaskIdSchema = Schema.String.check(Schema.isMinLength(1)).pipe(
  Schema.brand("TaskId"),
)

/** Stable identifier derived from a task's directory path. */
export type TaskId = Schema.Schema.Type<typeof TaskIdSchema>

/** Re-exported task metadata type. */
export type Task = TaskManifest

/** Re-exported task notes type. */
export type { TaskNotes }

/** Describes where a task participates in the benchmark catalog. */
export type TaskSource =
  | {
      readonly _tag: "Standalone"
    }
  | {
      readonly _tag: "CumulativeStage"
      readonly sequenceId: string
      readonly stageKey: string
      readonly stageIndex: number
    }

/**
 * Parsed task manifest with identity and absolute paths resolved by the
 * benchmark catalog.
 */
export interface ResolvedTask
  extends Omit<
    TaskManifest,
    "publicDir" | "originalDir" | "gradingDir" | "maxMinutes"
  > {
  readonly id: TaskId
  readonly source: TaskSource
  readonly publicDir: string
  readonly originalDir: string
  readonly gradingDir: string
  readonly maxMinutes: number
  readonly taskDir: string
  readonly publicAbsPath: string
  readonly originalAbsPath: string
  readonly gradingAbsPath: string
}
