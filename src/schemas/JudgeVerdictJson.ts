import { Schema } from "effect"

const NonEmptyString = Schema.String.check(Schema.isMinLength(1))
const NonNegativeNumber = Schema.Number.check(Schema.isGreaterThanOrEqualTo(0))
const PositiveNumber = Schema.Number.check(Schema.isGreaterThan(0))

export const JudgeEvidenceSchema = Schema.Struct({
  path: NonEmptyString,
  lines: Schema.NullOr(NonEmptyString),
  description: NonEmptyString,
})

export const JudgeGradeAdjustmentSchema = Schema.Struct({
  ruleId: NonEmptyString,
  operation: Schema.Literals(["subtract", "cap", "override"]),
  value: PositiveNumber,
  triggered: Schema.Boolean,
  evidence: Schema.Array(JudgeEvidenceSchema),
  justification: NonEmptyString,
})

export const JudgeDeductionSchema = Schema.Struct({
  id: NonEmptyString,
  rootCauseId: NonEmptyString,
  origin: Schema.Literals(["current-stage", "inherited", "unknown"]),
  points: PositiveNumber,
  reason: NonEmptyString,
  evidence: Schema.Array(JudgeEvidenceSchema),
})

export const CriterionVerdictSchema = Schema.Struct({
  criterionId: NonEmptyString,
  title: NonEmptyString,
  awardedPoints: NonNegativeNumber,
  maximumPoints: PositiveNumber,
  weight: PositiveNumber,
  evidence: Schema.Array(JudgeEvidenceSchema),
  deductions: Schema.Array(JudgeDeductionSchema),
  justification: NonEmptyString,
})

export const InheritedObservationSchema = Schema.Struct({
  id: NonEmptyString,
  description: NonEmptyString,
  evidence: Schema.Array(JudgeEvidenceSchema),
  effectOnCurrentAssignment: NonEmptyString,
})

export const JudgeCommandSchema = Schema.Struct({
  command: NonEmptyString,
  exitCode: Schema.NullOr(Schema.Number),
  summary: NonEmptyString,
})

export const JudgeVerdictJsonSchema = Schema.Struct({
  version: Schema.Number,
  taskId: NonEmptyString,
  runId: NonEmptyString,
  rubricHash: NonEmptyString,
  gradeAdjustments: Schema.Array(JudgeGradeAdjustmentSchema),
  criteria: Schema.Array(CriterionVerdictSchema),
  commands: Schema.Array(JudgeCommandSchema),
  inheritedObservations: Schema.Array(InheritedObservationSchema),
  criticalErrors: Schema.Array(NonEmptyString),
  humanReviewItems: Schema.Array(NonEmptyString),
  confidence: Schema.Literals(["high", "medium", "low"]),
  summary: NonEmptyString,
})

export type JudgeEvidence = Schema.Schema.Type<typeof JudgeEvidenceSchema>
export type JudgeGradeAdjustment = Schema.Schema.Type<
  typeof JudgeGradeAdjustmentSchema
>
export type JudgeDeduction = Schema.Schema.Type<typeof JudgeDeductionSchema>
export type CriterionVerdict = Schema.Schema.Type<typeof CriterionVerdictSchema>
export type JudgeVerdictJson = Schema.Schema.Type<typeof JudgeVerdictJsonSchema>

export interface ScoredJudgeVerdict extends JudgeVerdictJson {
  readonly rawPoints: number
  readonly rawMaximumPoints: number
  readonly weightedCompletion: number
  readonly baseGrade: number
  readonly grade: number
}
