import type { ScoredJudgeVerdict } from "../schemas/JudgeVerdictJson.js"

const escapeCell = (value: string): string =>
  value.replaceAll("|", "\\|").replaceAll("\n", " ")

export const renderJudgeReview = (
  verdict: ScoredJudgeVerdict,
): string => {
  const lines: string[] = [
    `# AI review: ${verdict.runId}`,
    "",
    verdict.summary,
    "",
    "## Score",
    "",
    `- Raw points: ${verdict.rawPoints} / ${verdict.rawMaximumPoints}`,
    `- Weighted completion: ${(verdict.weightedCompletion * 100).toFixed(1)}%`,
    `- Base grade: ${verdict.baseGrade.toFixed(1)} / 7.0`,
    `- Final grade: ${verdict.grade.toFixed(1)} / 7.0`,
    `- Confidence: ${verdict.confidence}`,
    `- Rubric hash: \`${verdict.rubricHash}\``,
    "",
    "## Criteria",
    "",
    "| Criterion | Score | Weight | Justification |",
    "|---|---:|---:|---|",
  ]

  for (const criterion of verdict.criteria) {
    lines.push(
      `| ${escapeCell(criterion.title)} | ${criterion.awardedPoints} / ${criterion.maximumPoints} | ${(criterion.weight * 100).toFixed(1)}% | ${escapeCell(criterion.justification)} |`,
    )
  }

  lines.push("", "## Grade adjustments", "")
  if (verdict.gradeAdjustments.length === 0) lines.push("None.")
  for (const adjustment of verdict.gradeAdjustments) {
    lines.push(
      `- **${adjustment.ruleId}:** ${adjustment.triggered ? "triggered" : "not triggered"}; ${adjustment.operation} ${adjustment.value.toFixed(1)}. ${adjustment.justification}`,
    )
  }

  lines.push("", "## Evidence and criterion deductions", "")
  for (const criterion of verdict.criteria) {
    lines.push(`### ${criterion.criterionId}`, "")
    if (criterion.evidence.length === 0) lines.push("No evidence recorded.", "")
    for (const evidence of criterion.evidence) {
      const location = evidence.lines === null
        ? evidence.path
        : `${evidence.path}:${evidence.lines}`
      lines.push(`- \`${location}\`: ${evidence.description}`)
    }
    for (const deduction of criterion.deductions) {
      lines.push(
        `- Deduction ${deduction.points}: ${deduction.reason} (root cause \`${deduction.rootCauseId}\`)`,
      )
    }
    lines.push("")
  }

  lines.push("## Commands", "")
  if (verdict.commands.length === 0) lines.push("No commands recorded.")
  for (const command of verdict.commands) {
    lines.push(
      `- \`${command.command}\` — exit ${command.exitCode ?? "unknown"}: ${command.summary}`,
    )
  }

  lines.push("", "## Inherited observations", "")
  if (verdict.inheritedObservations.length === 0) lines.push("None.")
  for (const observation of verdict.inheritedObservations) {
    lines.push(
      `- **${observation.id}:** ${observation.description} Effect on current assignment: ${observation.effectOnCurrentAssignment}`,
    )
  }

  lines.push("", "## Human review", "")
  if (verdict.humanReviewItems.length === 0) lines.push("None.")
  for (const item of verdict.humanReviewItems) lines.push(`- ${item}`)

  lines.push("", "## Critical errors", "")
  if (verdict.criticalErrors.length === 0) lines.push("None.")
  for (const error of verdict.criticalErrors) lines.push(`- ${error}`)

  return `${lines.join("\n")}\n`
}
