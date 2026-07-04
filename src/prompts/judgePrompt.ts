import type { ResolvedTask } from "../domain/Task.js"

export const judgePrompt = (
  task: ResolvedTask,
  runId: string,
  rubricHash: string,
): string => {
  const stageRule = task.source._tag === "CumulativeStage"
    ? "Esta es una etapa acumulativa. Usa /baseline y /evidence/diff.patch únicamente para atribuir observaciones. Los requisitos anteriores no se vuelven a evaluar. Registra defectos heredados en inheritedObservations y no reduzcas por ellos el puntaje de la etapa actual."
    : "Esta es una tarea independiente. /baseline contiene el estado inicial de la tarea."

  return `Evalúa la entrega ubicada en /submission usando la pauta aprobada /grading/rubric.md y los materiales actuales disponibles en /assignment.

Usa /workspace para comandos que creen artefactos de compilación o prueba. ${stageRule}

La pauta puede conservar cualquier escala original y puede dividir la evaluación en secciones ponderadas. Para cada criterio informa awardedPoints y maximumPoints usando la escala original de la pauta. Informa además weight como la contribución efectiva del criterio al resultado total, entre 0 y 1. Los pesos de todos los criterios deben sumar exactamente 1. Si existe una sola bolsa de puntos, weight es maximumPoints dividido por el máximo total. Si hay secciones ponderadas, multiplica la ponderación de la sección por la proporción del criterio dentro de esa sección.

Incluye en criteria solo criterios con puntaje positivo verificable: maximumPoints debe ser mayor que 0 y weight debe ser mayor que 0. Si la pauta menciona requisitos de elegibilidad, requisitos administrativos, evidencia externa, o condiciones "sin puntaje propio especificado", no los conviertas en criterios con maximumPoints 0; represéntalos como gradeAdjustments cuando sean reglas directas de nota, o como humanReviewItems cuando requieran revisión humana.

awardedPoints ya debe incorporar descuentos de puntaje internos al criterio. Usa deductions para explicar esos descuentos, una sola vez por causa raíz, pero no vuelvas a restarlos en otra parte. Los defectos heredados no pueden aparecer como deductions.

Cada rootCauseId en deductions debe aparecer como máximo una vez en todo el verdict. Si una misma causa raíz afecta varios criterios, descuéntala solo en el criterio más directamente relacionado y menciona el impacto secundario en la justificación, sin crear otra deduction con el mismo rootCauseId.

Incluye en gradeAdjustments todas las reglas explícitas de la pauta que operen directamente sobre la nota final, estén activadas o no:
- operation "subtract" para descuentos de nota;
- operation "cap" para topes de nota;
- operation "override" para una nota directa.
Usa valores en escala 1.0–7.0 con un decimal como máximo. El host calculará la nota base, aplicará ajustes y redondeará; no incluyas una nota final en tu salida.

Escribe únicamente /judge-output/verdict.json con JSON válido y esta estructura:

{
  "version": 2,
  "taskId": ${JSON.stringify(task.id)},
  "runId": ${JSON.stringify(runId)},
  "rubricHash": ${JSON.stringify(rubricHash)},
  "criteria": [
    {
      "criterionId": "identificador estable tomado de la pauta",
      "title": "nombre del criterio",
      "awardedPoints": 0,
      "maximumPoints": 1,
      "weight": 1,
      "evidence": [
        {
          "path": "ruta inspeccionada",
          "lines": "10-20 o null",
          "description": "hecho observable"
        }
      ],
      "deductions": [
        {
          "id": "identificador del descuento",
          "rootCauseId": "causa-raiz-estable",
          "origin": "current-stage",
          "points": 0.5,
          "reason": "motivo",
          "evidence": []
        }
      ],
      "justification": "justificación del puntaje"
    }
  ],
  "gradeAdjustments": [
    {
      "ruleId": "identificador estable de la regla",
      "operation": "subtract",
      "value": 0.5,
      "triggered": false,
      "evidence": [],
      "justification": "decisión sobre la regla"
    }
  ],
  "commands": [
    {
      "command": "comando ejecutado",
      "exitCode": 0,
      "summary": "resultado relevante"
    }
  ],
  "inheritedObservations": [],
  "criticalErrors": [],
  "humanReviewItems": [],
  "confidence": "high",
  "summary": "resumen de la evaluación"
}

confidence debe ser high, medium o low. lines debe ser string o null. criticalErrors debe ser un arreglo de strings, no de objetos. humanReviewItems debe ser un arreglo de strings, no de objetos. Si necesitas evidencia estructurada, ponla en evidence dentro de criteria, deductions o gradeAdjustments. Evalúa todos los criterios puntuados y todas las reglas explícitas de la pauta. No escribas ningún otro archivo.`
}
