import { Effect, Schema } from "effect"
import { JudgeVerdictValidationError } from "./Errors.js"
import {
  JudgeVerdictJsonSchema,
  type JudgeVerdictJson,
  type ScoredJudgeVerdict,
} from "../schemas/JudgeVerdictJson.js"

const fail = (path: string, reason: string) =>
  Effect.fail(new JudgeVerdictValidationError({ path, reason }))

const roundGrade = (value: number): number => Math.round(value * 10) / 10
const hasOneDecimal = (value: number): boolean =>
  Math.abs(value * 10 - Math.round(value * 10)) < 1e-9

export const calculateGrade = (points: number, maxPoints = 1): number => {
  const completion = maxPoints <= 0 ? 0 : points / maxPoints
  const raw = 1 + 6 * completion
  return roundGrade(Math.min(7, Math.max(1, raw)))
}

export const decodeJudgeVerdict = Effect.fnUntraced(function*(
  raw: unknown,
  path: string,
) {
  return yield* Schema.decodeUnknownEffect(JudgeVerdictJsonSchema)(raw).pipe(
    Effect.mapError(
      (cause) =>
        new JudgeVerdictValidationError({
          path,
          reason: String(cause),
          cause,
        }),
    ),
  )
})

export const validateJudgeVerdict = Effect.fnUntraced(function*(
  verdict: JudgeVerdictJson,
  expected: {
    readonly taskId: string
    readonly runId: string
    readonly rubricHash: string
  },
  path: string,
) {
  if (verdict.version !== 2) {
    return yield* fail(path, `Unsupported verdict version: ${verdict.version}`)
  }
  if (verdict.taskId !== expected.taskId) {
    return yield* fail(path, `Expected taskId ${expected.taskId}`)
  }
  if (verdict.runId !== expected.runId) {
    return yield* fail(path, `Expected runId ${expected.runId}`)
  }
  if (verdict.rubricHash !== expected.rubricHash) {
    return yield* fail(path, "Verdict rubricHash does not match approved rubric")
  }
  if (verdict.criteria.length === 0) {
    return yield* fail(path, "At least one criterion assessment is required")
  }

  const criterionIds = new Set<string>()
  const deductedRootCauses = new Set<string>()
  let rawPoints = 0
  let rawMaximumPoints = 0
  let totalWeight = 0
  let weightedCompletion = 0

  for (const criterion of verdict.criteria) {
    if (criterionIds.has(criterion.criterionId)) {
      return yield* fail(path, `Duplicate criterion: ${criterion.criterionId}`)
    }
    criterionIds.add(criterion.criterionId)
    if (criterion.awardedPoints > criterion.maximumPoints) {
      return yield* fail(
        path,
        `Criterion ${criterion.criterionId} received ${criterion.awardedPoints}/${criterion.maximumPoints}`,
      )
    }
    if (criterion.weight > 1) {
      return yield* fail(path, `Criterion ${criterion.criterionId} weight exceeds 1`)
    }

    rawPoints += criterion.awardedPoints
    rawMaximumPoints += criterion.maximumPoints
    totalWeight += criterion.weight
    weightedCompletion +=
      criterion.weight * (criterion.awardedPoints / criterion.maximumPoints)

    let deductionTotal = 0
    for (const deduction of criterion.deductions) {
      if (deduction.origin !== "current-stage") {
        return yield* fail(
          path,
          `Deduction ${deduction.id} is ${deduction.origin}; inherited or unattributed defects cannot reduce the current assignment grade`,
        )
      }
      if (deductedRootCauses.has(deduction.rootCauseId)) {
        return yield* fail(
          path,
          `Root cause ${deduction.rootCauseId} was deducted more than once`,
        )
      }
      deductedRootCauses.add(deduction.rootCauseId)
      deductionTotal += deduction.points
    }
    if (deductionTotal > criterion.maximumPoints) {
      return yield* fail(
        path,
        `Deductions exceed criterion ${criterion.criterionId} maximum`,
      )
    }
  }

  if (Math.abs(totalWeight - 1) > 1e-6) {
    return yield* fail(path, `Criterion weights sum to ${totalWeight}; expected 1`)
  }

  const adjustmentIds = new Set<string>()
  const triggeredOverrides = verdict.gradeAdjustments.filter(
    (adjustment) => adjustment.triggered && adjustment.operation === "override",
  )
  if (triggeredOverrides.length > 1) {
    return yield* fail(path, "At most one grade override may be triggered")
  }

  for (const adjustment of verdict.gradeAdjustments) {
    if (adjustmentIds.has(adjustment.ruleId)) {
      return yield* fail(path, `Duplicate grade adjustment: ${adjustment.ruleId}`)
    }
    adjustmentIds.add(adjustment.ruleId)
    if (
      (adjustment.operation === "cap" || adjustment.operation === "override") &&
      (adjustment.value < 1 || adjustment.value > 7)
    ) {
      return yield* fail(
        path,
        `Grade adjustment ${adjustment.ruleId} must be within 1.0-7.0`,
      )
    }
    if (adjustment.operation === "subtract" && adjustment.value > 6) {
      return yield* fail(
        path,
        `Grade adjustment ${adjustment.ruleId} subtraction exceeds the grade range`,
      )
    }
    if (!hasOneDecimal(adjustment.value)) {
      return yield* fail(
        path,
        `Grade adjustment ${adjustment.ruleId} must use at most one decimal`,
      )
    }
  }

  const baseGrade = calculateGrade(weightedCompletion)
  const triggered = verdict.gradeAdjustments.filter(
    (adjustment) => adjustment.triggered,
  )
  const override = triggered.find(
    (adjustment) => adjustment.operation === "override",
  )
  const subtractions = triggered
    .filter((adjustment) => adjustment.operation === "subtract")
    .reduce((sum, adjustment) => sum + adjustment.value, 0)
  const caps = triggered
    .filter((adjustment) => adjustment.operation === "cap")
    .map((adjustment) => adjustment.value)

  const adjusted = baseGrade - subtractions
  const capped = caps.length === 0 ? adjusted : Math.min(adjusted, ...caps)
  const finalValue = override === undefined ? capped : override.value
  const grade = roundGrade(Math.min(7, Math.max(1, finalValue)))

  const scored: ScoredJudgeVerdict = {
    ...verdict,
    rawPoints,
    rawMaximumPoints,
    weightedCompletion,
    baseGrade,
    grade,
  }
  return scored
})
