import { Schema } from "effect"
import type { ResolvedTask } from "./Task.js"

/** Stable identifier derived from a target's path below its catalog root. */
export const BenchmarkTargetIdSchema = Schema.String.check(
  Schema.isMinLength(1),
).pipe(Schema.brand("BenchmarkTargetId"))

/** Stable identifier derived from a target's catalog path. */
export type BenchmarkTargetId = Schema.Schema.Type<
  typeof BenchmarkTargetIdSchema
>

/** A task executed from its own public input. */
export interface StandaloneTask {
  readonly _tag: "StandaloneTask"
  readonly id: BenchmarkTargetId
  readonly title: string
  readonly description: string
  readonly task: ResolvedTask
}

/** A stage within a cumulative benchmark sequence. */
export interface CumulativeStage {
  readonly key: string
  readonly index: number
  readonly task: ResolvedTask
}

/** A sequence whose stages build on the output of the preceding stage. */
export interface CumulativeSequence {
  readonly _tag: "CumulativeSequence"
  readonly id: BenchmarkTargetId
  readonly title: string
  readonly description: string
  readonly sequenceDir: string
  readonly stages: readonly [CumulativeStage, ...Array<CumulativeStage>]
}

/** A runnable benchmark catalog entry. */
export type BenchmarkTarget = StandaloneTask | CumulativeSequence

/** Return the user-facing kind of a benchmark target. */
export const targetKind = (
  target: BenchmarkTarget,
): "standalone" | "cumulative" =>
  target._tag === "StandaloneTask" ? "standalone" : "cumulative"

const compareTargetParts = (left: string, right: string): number =>
  left.localeCompare(right, "en")

export const targetCourseKeyFromId = (targetId: string): string => {
  const [courseKey] = targetId.split("/")
  return courseKey ?? targetId
}

export const targetTaskKeyFromId = (targetId: string): string => {
  const parts = targetId.split("/")
  return parts[parts.length - 1] ?? targetId
}

export const compareTargetIdsByTask = (left: string, right: string): number => {
  const leftCourseKey = targetCourseKeyFromId(left)
  const rightCourseKey = targetCourseKeyFromId(right)
  const byCourseKey = compareTargetParts(leftCourseKey, rightCourseKey)
  if (byCourseKey !== 0) return byCourseKey
  const leftTaskKey = targetTaskKeyFromId(left)
  const rightTaskKey = targetTaskKeyFromId(right)
  const byTaskKey = compareTargetParts(leftTaskKey, rightTaskKey)
  if (byTaskKey !== 0) return byTaskKey
  return compareTargetParts(left, right)
}
