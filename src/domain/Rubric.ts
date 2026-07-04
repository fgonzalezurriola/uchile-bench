import { Effect } from "effect"
import { RubricValidationError } from "./Errors.js"
import type { ResolvedTask } from "./Task.js"

const requiredSections = [
  "# Pauta de evaluación",
  "## Alcance",
  "## Criterios",
  "## Descuentos, topes y reglas especiales",
  "## Escala final",
  "## Supuestos y decisiones para revisión humana",
] as const

const fail = (path: string, reason: string) =>
  Effect.fail(new RubricValidationError({ path, reason }))

export const validateRubric = Effect.fnUntraced(function*(
  rubric: string,
  path: string,
) {
  const normalized = `${rubric.trim()}\n`
  if (normalized.length <= 1) {
    return yield* fail(path, "Rubric Markdown is empty")
  }

  for (const section of requiredSections) {
    if (!normalized.includes(section)) {
      return yield* fail(path, `Missing required rubric section: ${section}`)
    }
  }

  if (!/^###\s+\S+/m.test(normalized)) {
    return yield* fail(path, "At least one criterion heading is required")
  }
  if (!/Puntaje máximo:/i.test(normalized)) {
    return yield* fail(path, "At least one criterion maximum score is required")
  }
  if (!normalized.includes("1.0") || !normalized.includes("7.0")) {
    return yield* fail(path, "The benchmark grade range must be 1.0 to 7.0")
  }
  if (!/un decimal/i.test(normalized)) {
    return yield* fail(path, "The rubric must declare one-decimal grade rounding")
  }

  return normalized
})

export const validateRubricForTask = Effect.fnUntraced(function*(
  rubric: string,
  task: ResolvedTask,
  path: string,
) {
  const validated = yield* validateRubric(rubric, path)
  const taskMarker = /<!--\s*benchmark-task-id:\s*([^\s]+)\s*-->/i.exec(validated)
  if (taskMarker?.[1] !== undefined && taskMarker[1] !== task.id) {
    return yield* fail(
      path,
      `Rubric belongs to Task ${taskMarker[1]}, not ${task.id}`,
    )
  }

  if (task.source._tag === "CumulativeStage") {
    const scope = /## Alcance\s+([\s\S]*?)(?=\n## |$)/i.exec(validated)?.[1] ?? ""
    if (
      !scope.toLowerCase().includes("etapa") &&
      !scope.includes(task.source.stageKey)
    ) {
      return yield* fail(
        path,
        `Cumulative Stage rubric must declare the scope of ${task.source.stageKey}`,
      )
    }
  }

  return validated
})
