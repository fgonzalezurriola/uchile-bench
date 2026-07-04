/** Instrucción mínima para tareas independientes. */
export const STANDALONE_BENCHMARK_PROMPT = `Estás en un directorio que contiene una tarea de programación. Lee los archivos disponibles y resuelve la tarea de la forma más completa posible.

Puedes crear, editar o eliminar archivos dentro de este directorio. Si el enunciado no especifica un lenguaje, framework o estructura de proyecto, elige una alternativa pragmática.

Al terminar, deja instrucciones claras para ejecutar o revisar tu solución.

No hagas preguntas de seguimiento. Adopta supuestos razonables y documéntalos.`

/**
 * Instrucción para una etapa de una secuencia acumulativa.
 * El baseline es evidencia y contexto, no un segundo workspace editable.
 */
export const cumulativeBenchmarkPrompt = (
  stageKey: string,
  stageIndex: number,
): string => {
  const stageContext = stageIndex === 1
    ? "Esta es la primera etapa de la secuencia. /workspace contiene únicamente los materiales entregados para esta etapa. Implementa una base completa y mantenible que pueda extenderse en etapas posteriores."
    : "El directorio /workspace ya contiene el trabajo realizado en etapas anteriores junto con los archivos entregados para la etapa actual. Extiende la implementación existente; no reinicies el proyecto ni reemplaces trabajo correcto sin necesidad."

  return `Estás trabajando en la etapa ${stageKey} (etapa ${stageIndex}) de una tarea de programación acumulativa.

${stageContext}

El estado exacto recibido al comienzo de esta etapa está disponible en modo de solo lectura en /baseline. Puedes inspeccionarlo o ejecutar:

  diff -ruN /baseline /workspace

Implementa únicamente los requisitos descritos en los archivos de la etapa actual. Las etapas anteriores proporcionan contexto de implementación, pero no constituyen requisitos nuevos para esta etapa.

Puedes crear, editar o eliminar archivos dentro de /workspace. No modifiques /baseline.

Al terminar, deja instrucciones claras para ejecutar o revisar tu solución. No hagas preguntas de seguimiento. Adopta supuestos razonables y documéntalos.`
}

/** Nombre anterior conservado para callers existentes. */
export const DEFAULT_BENCHMARK_PROMPT = STANDALONE_BENCHMARK_PROMPT
