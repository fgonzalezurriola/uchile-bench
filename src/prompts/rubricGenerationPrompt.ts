import type { ResolvedTask } from "../domain/Task.js"

const scopeInstruction = (task: ResolvedTask): string =>
  task.source._tag === "Standalone"
    ? "Esta es una tarea independiente."
    : `Esta es la etapa ${task.source.stageKey} de la secuencia ${task.source.sequenceId}. Evalúa únicamente los requisitos de esta etapa; el trabajo heredado es contexto de implementación y no materia evaluable.`

export const rubricGenerationPrompt = (
  task: ResolvedTask,
  assignmentContext: string,
): string => `Crea una pauta de evaluación en Markdown para la tarea universitaria de programación ${task.id}.

${scopeInstruction(task)}

Analiza todo el material proporcionado. El enunciado puede estar distribuido entre Markdown, README, código, comentarios, strings, datos u otros archivos. No resuelvas la tarea ni agregues requisitos ausentes.

Preserva literalmente las escalas originales cuando existan: puntajes máximos, ponderaciones de secciones, condiciones para obtener puntaje, topes, notas directas y descuentos. No conviertas una pauta de 4, 6, 10, 60 u otro máximo a 100 puntos. Si el material no distribuye puntajes, propón una distribución razonable y marca cada valor propuesto como tal para revisión humana.

La nota del benchmark estará entre 1.0 y 7.0 y tendrá un decimal. No evalúes ninguna entrega ni calcules una nota concreta.

Devuelve únicamente Markdown, sin bloque de código exterior, usando esta estructura:

# Pauta de evaluación

## Alcance

Describe qué entrega y qué requisitos de la tarea actual se evalúan. Indica el alcance especial de la etapa si corresponde.

## Secciones y ponderación - si corresponde

Incluye esta sección solo cuando la pauta original separe componentes con ponderaciones propias, por ejemplo código e informe. Para cada sección declara un identificador estable, su ponderación y su puntaje máximo original.

## Criterios

Para cada criterio usa un encabezado de nivel 3 con un identificador estable, por ejemplo:

### P1 - Nombre del criterio

- Origen del puntaje: enunciado | material de evaluación | propuesto
- Puntaje máximo: valor original
- Sección: identificador de sección, si corresponde
- Requisito evaluado: descripción verificable
- Evidencia esperada: archivos, pruebas, comandos o comportamiento observable
- Puntaje completo: condiciones para obtener el máximo
- Puntaje parcial: reglas o niveles intermedios respaldados por el material; si deben proponerse, indícalo
- Puntaje cero: condiciones para obtener cero

Los puntajes máximos deben ser coherentes con la pauta original o con la propuesta declarada. Usa tantos criterios como sean necesarios; no inventes criterios de estilo, robustez o documentación salvo que estén respaldados por el material.

## Descuentos, topes y reglas especiales - si corresponde

Incluye únicamente descuentos, topes de nota, notas directas, condiciones de elegibilidad o reglas especiales respaldadas por los materiales. Explica la condición, el efecto y la evidencia necesaria. Excluye penalizaciones administrativas ajenas a la solución, como atrasos o pasos de entrega en una plataforma. Si no existen reglas de este tipo, escribe: “No corresponde”.

## Escala final

Declara:

- Puntaje máximo original por sección o total
- Ponderación entre secciones, si corresponde
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas

## Supuestos y decisiones para revisión humana

Distingue claramente:

- información extraída de los materiales;
- puntajes o niveles propuestos;
- ambigüedades no resueltas;
- requisitos que no pueden verificarse con el material o ambiente disponible.

MATERIAL DE LA TAREA ACTUAL
============================
${assignmentContext}`
