/** @deprecated Approved rubrics are Markdown; use JudgeVerdictJson for structured grading output. */
import { Schema } from "effect"

const NonEmptyString = Schema.String.check(Schema.isMinLength(1))
const PositiveNumber = Schema.Number.check(Schema.isGreaterThan(0))

export const RubricScopeSchema = Schema.Union([
  Schema.Struct({
    _tag: Schema.Literals(["Standalone"]),
  }),
  Schema.Struct({
    _tag: Schema.Literals(["CurrentAssignmentOnly"]),
    sequenceId: NonEmptyString,
    stageKey: NonEmptyString,
    stageIndex: PositiveNumber,
    inheritedCodePolicy: Schema.Literals(["context-not-graded"]),
  }),
])

export const RubricGradeRuleSchema = Schema.Struct({
  id: NonEmptyString,
  description: NonEmptyString,
  condition: NonEmptyString,
  maximumGrade: PositiveNumber,
  evidence: Schema.Array(NonEmptyString),
})

export const RubricDeductionSchema = Schema.Struct({
  id: NonEmptyString,
  description: NonEmptyString,
  points: PositiveNumber,
  repetition: Schema.Literals(["once-per-root-cause", "per-occurrence"]),
})

export const RubricCriterionSchema = Schema.Struct({
  id: NonEmptyString,
  title: NonEmptyString,
  description: NonEmptyString,
  maxPoints: PositiveNumber,
  critical: Schema.Boolean,
  evidenceScope: Schema.Literals([
    "stage-delta",
    "final-state",
    "delta-and-final-state",
  ]),
  evidence: Schema.Array(NonEmptyString),
  scoring: Schema.Struct({
    full: NonEmptyString,
    partial: NonEmptyString,
    zero: NonEmptyString,
  }),
  deductions: Schema.Array(RubricDeductionSchema),
})

export const RubricJsonSchema = Schema.Struct({
  version: Schema.Number,
  taskId: NonEmptyString,
  scope: RubricScopeSchema,
  maxPoints: Schema.Number,
  minGrade: Schema.Number,
  maxGrade: Schema.Number,
  gradeRules: Schema.Array(RubricGradeRuleSchema),
  repeatedErrorPolicy: Schema.Struct({
    source: Schema.Literals(["assignment", "default"]),
    mode: Schema.Literals([
      "once-per-root-cause",
      "per-occurrence",
      "custom",
    ]),
    explanation: NonEmptyString,
  }),
  criteria: Schema.Array(RubricCriterionSchema),
})

export type RubricScope = Schema.Schema.Type<typeof RubricScopeSchema>
export type RubricGradeRule = Schema.Schema.Type<typeof RubricGradeRuleSchema>
export type RubricDeduction = Schema.Schema.Type<typeof RubricDeductionSchema>
export type RubricCriterion = Schema.Schema.Type<typeof RubricCriterionSchema>
export type RubricJson = Schema.Schema.Type<typeof RubricJsonSchema>
