import { describe, test } from "bun:test"
import assert from "node:assert/strict"
import { Effect } from "effect"
import { calculateGrade, validateJudgeVerdict } from "../src/domain/JudgeVerdict.js"
import { validateRubric } from "../src/domain/Rubric.js"
import type { JudgeVerdictJson } from "../src/schemas/JudgeVerdictJson.js"

const rubric = `# Pauta de evaluación

## Alcance
Evalúa la tarea actual.

## Criterios

### P1 — Implementación
- Puntaje máximo: 4.0

## Descuentos, topes y reglas especiales — si corresponde
No corresponde.

## Escala final
- Nota mínima: 1.0
- Nota máxima: 7.0
- Redondeo: un decimal

## Supuestos y decisiones para revisión humana
No hay supuestos.
`

const verdict: JudgeVerdictJson = {
  version: 2,
  taskId: "CC3501/t2",
  runId: "run-1",
  rubricHash: "hash-1",
  criteria: [{
    criterionId: "implementation",
    title: "Implementation",
    awardedPoints: 3,
    maximumPoints: 4,
    weight: 1,
    evidence: [],
    deductions: [],
    justification: "Mostly complete.",
  }],
  gradeAdjustments: [],
  commands: [],
  inheritedObservations: [],
  criticalErrors: [],
  humanReviewItems: [],
  confidence: "high",
  summary: "Mostly complete.",
}

const expected = {
  taskId: "CC3501/t2",
  runId: "run-1",
  rubricHash: "hash-1",
} as const

describe("grading validation", () => {
  test("accepts the Markdown rubric structure", async () => {
    const validated = await Effect.runPromise(validateRubric(rubric, "rubric.md"))
    assert.equal(validated, rubric)
  })

  test("maps completion to the 1.0 to 7.0 scale", () => {
    assert.equal(calculateGrade(0, 1), 1)
    assert.equal(calculateGrade(0.5, 1), 4)
    assert.equal(calculateGrade(1, 1), 7)
  })

  test("calculates grade from weighted completion", async () => {
    const scored = await Effect.runPromise(
      validateJudgeVerdict(verdict, expected, "verdict.json"),
    )
    assert.equal(scored.weightedCompletion, 0.75)
    assert.equal(scored.grade, 5.5)
  })

  test("supports independently weighted sections", async () => {
    const sectioned: JudgeVerdictJson = {
      ...verdict,
      criteria: [
        {
          ...verdict.criteria[0]!,
          criterionId: "code",
          title: "Code",
          awardedPoints: 6,
          maximumPoints: 6,
          weight: 0.5,
        },
        {
          ...verdict.criteria[0]!,
          criterionId: "report",
          title: "Report",
          awardedPoints: 3,
          maximumPoints: 6,
          weight: 0.5,
        },
      ],
    }
    const scored = await Effect.runPromise(
      validateJudgeVerdict(sectioned, expected, "verdict.json"),
    )
    assert.equal(scored.weightedCompletion, 0.75)
    assert.equal(scored.grade, 5.5)
  })

  test("applies grade deductions and caps", async () => {
    const adjusted: JudgeVerdictJson = {
      ...verdict,
      criteria: [{ ...verdict.criteria[0]!, awardedPoints: 4 }],
      gradeAdjustments: [
        {
          ruleId: "style",
          operation: "subtract",
          value: 0.5,
          triggered: true,
          evidence: [],
          justification: "Required style was not used.",
        },
        {
          ruleId: "execution-cap",
          operation: "cap",
          value: 5,
          triggered: true,
          evidence: [],
          justification: "A required execution mode fails.",
        },
      ],
    }
    const scored = await Effect.runPromise(
      validateJudgeVerdict(adjusted, expected, "verdict.json"),
    )
    assert.equal(scored.baseGrade, 7)
    assert.equal(scored.grade, 5)
  })

  test("applies a direct grade override", async () => {
    const adjusted: JudgeVerdictJson = {
      ...verdict,
      gradeAdjustments: [{
        ruleId: "crash",
        operation: "override",
        value: 1,
        triggered: true,
        evidence: [],
        justification: "The program crashes.",
      }],
    }
    const scored = await Effect.runPromise(
      validateJudgeVerdict(adjusted, expected, "verdict.json"),
    )
    assert.equal(scored.grade, 1)
  })

  test("rejects inherited deductions", async () => {
    const invalid: JudgeVerdictJson = {
      ...verdict,
      criteria: [{
        ...verdict.criteria[0]!,
        deductions: [{
          id: "old-defect",
          rootCauseId: "old-defect",
          origin: "inherited",
          points: 1,
          reason: "The defect existed before this stage.",
          evidence: [],
        }],
      }],
    }
    await assert.rejects(
      Effect.runPromise(validateJudgeVerdict(invalid, expected, "verdict.json")),
    )
  })

  test("rejects criterion weights that do not sum to one", async () => {
    const invalid: JudgeVerdictJson = {
      ...verdict,
      criteria: [{ ...verdict.criteria[0]!, weight: 0.9 }],
    }
    await assert.rejects(
      Effect.runPromise(validateJudgeVerdict(invalid, expected, "verdict.json")),
    )
  })

  test("rejects grade adjustments with more than one decimal", async () => {
    const invalid: JudgeVerdictJson = {
      ...verdict,
      gradeAdjustments: [{
        ruleId: "invalid-cap",
        operation: "cap",
        value: 4.25,
        triggered: true,
        evidence: [],
        justification: "Invalid precision.",
      }],
    }
    await assert.rejects(
      Effect.runPromise(validateJudgeVerdict(invalid, expected, "verdict.json")),
    )
  })
})
