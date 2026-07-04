# AI Task Bench

Benchmark reproducible para evaluar agentes de programación en tareas universitarias reales usando solamente el material entregado al estudiante.

## Language

Benchmark Target: Unidad ejecutable de nivel superior. Es una Standalone Task o una Cumulative Sequence.

Target Catalog: Servicio que descubre y valida Benchmark Targets desde `tasks/`. La ruta define identidad y semántica.

Task: Un enunciado con `task.json` y sus carpetas `public/`, `original/` y `grading/`.

Standalone Task: Benchmark Target que comienza desde su propio Public Material.

Cumulative Sequence: Benchmark Target compuesto por Cumulative Stages ordenadas alfabéticamente por nombre de directorio.

Cumulative Stage: Task dentro de una Cumulative Sequence. Las etapas posteriores parten desde el Output anterior más su Public Material.

Stage Scope: Una Cumulative Stage se evalúa únicamente contra el enunciado de esa etapa. El código anterior es contexto de implementación, no materia evaluable.

Task Manifest: `task.json`. Contiene metadata; la ruta del catálogo define el ID.

Execution Environment: Imagen y herramientas de curso usadas para ejecutar un Solver. El curso define un entorno predeterminado y una Task puede declarar un override explícito.

Environment Profile: Configuración reproducible de un Execution Environment: imagen, Dockerfile, CPU, memoria, PIDs, red, variables y argumentos de contenedor.

Legacy Sequence Manifest: `sequence.json`. No forma parte del catálogo actual.

Public Material: Archivos entregados al Solver: requisitos en Markdown, README, notebooks exportados, código o comentarios, además de starter code, assets, datos y otros archivos del estudiante.

Original Material: Material preservado para humanos, como el PDF original o una solución oficial. No se entrega al Solver.

Grading Material: Pautas, tests privados y referencias de corrección. No se entrega al Solver.

Assignment Statement: Requisitos de la Task actual. Define el alcance de evaluación.

Solver: Agente que intenta resolver una Task usando solamente Public Material.

Agent Adapter: Módulo que transforma configuración y prompt en una invocación aislada del agente.

Run: Ejecución aislada de un Solver contra una Task. Cada Run crea un contenedor nuevo y descartable desde su Execution Environment.

Sequence Run: Orquestación de los Runs de una Cumulative Sequence.

Input: Estado inicial inmutable de un Run, almacenado en `00-input/`.

Baseline: Input usado para atribuir cambios de una etapa cumulative.

Workspace: Copia editable del Input donde trabaja el Solver.

Output: Resultado capturado al terminar un Run.

Stage Delta: Diferencia entre Input y Output. Sirve para atribución, no para definir alcance de evaluación.

Evidence: Artefactos auditables de ejecución y procedencia de un Run.

Raw Event Stream: JSONL de eventos streaming emitido por Pi durante una invocación. Es transitorio y se elimina después de publicar correctamente la sesión compacta.

Publishable Session: Representación compacta y apta para UI de una invocación, retenida como `session.compact.json`, `session.html` cuando cabe bajo el límite configurado y `metrics.json`.

Review: Evaluación humana o de IA asociada a un Run.

Manual Review: Flujo humano basado en `review.md` y `score.json`.

AI Judge: Agente separado que evalúa un Run completado.

Rubric Draft: `grading/rubric.draft.md`, pauta generada o editada durante la curación y todavía no aprobada.

Approved Rubric: `grading/rubric.md`, pauta humana validada y reutilizada para Runs comparables de una Task.

Rubric Approval: Registro que vincula Approved Rubric con su hash y versión aprobada.

Criterion: Requisito puntuado en la escala original de la Task y con una ponderación efectiva en la evaluación.

Grade Adjustment: Regla explícita que descuenta nota, limita la nota o fija una nota directa independientemente del puntaje base.

Deduction: Descuento de puntaje dentro de un Criterion, atribuido a una causa raíz y respaldado por evidencia.

Root Cause: Defecto subyacente que puede producir varias observaciones. Por defecto se descuenta una vez.

Inherited Defect: Defecto ya presente en el Baseline. No descuenta salvo que el enunciado actual exija corregirlo.

Base Grade: Nota 1.0–7.0 calculada por el host desde la proporción ponderada de logro de los Criteria.

Final Grade: Base Grade después de aplicar Grade Adjustments, acotada a 1.0–7.0 y redondeada a un decimal.

## Catálogo experimental de agentes

Las condiciones experimentales son normativas. Cada resultado debe atribuirse al agent ID completo, a Pi como harness, al provider, al modelo exacto y al nivel de thinking solicitado. Las capacidades siguientes provienen del catálogo local de Pi `0.80.2` y quedan vinculadas a esa versión.

| Agent ID | Harness | Provider | Modelo exacto | Thinking | Mapeo o presupuesto | Imágenes |
| --- | --- | --- | --- | --- | --- | --- |
| `pi-zen-deepseek-v4-flash-free-xhigh` | Pi | `opencode` | `opencode/deepseek-v4-flash-free` | `xhigh` | Provider `max` | No |
| `pi-zen-mimo-v2.5-free-high` | Pi | `opencode` | `opencode/mimo-v2.5-free` | `high` | Sin mapeo especial documentado | No |
| `pi-minimax-m3-high-api` | Pi | `minimax` | `MiniMax-M3` | `high` | Sin mapeo especial documentado | Sí |
| `pi-openai-gpt-5.4-mini-medium-subscription` | Pi | `openai-codex` | `gpt-5.4-mini` | `medium` | Sin mapeo especial documentado | Sí |
| `pi-openai-gpt-5.4-medium-subscription` | Pi | `openai-codex` | `gpt-5.4` | `medium` | Sin mapeo especial documentado | Sí |
| `pi-openai-gpt-5.5-medium-subscription` | Pi | `openai-codex` | `gpt-5.5` | `medium` | Sin mapeo especial documentado | Sí |
| `pi-openai-gpt-5.5-high-subscription` | Pi | `openai-codex` | `gpt-5.5` | `high` | Uso predeterminado para generación de pautas y AI Judge | Sí |

DeepSeek `xhigh` se mapea a provider `max`. Una actualización de Pi puede cambiar capacidades, context windows, límites de salida, mappings de reasoning, presupuestos de thinking o schemas de eventos. Cambiar la versión de Pi cambia la condición experimental y exige verificar nuevamente el catálogo.

### Política multimodal

`read` entrega imágenes al modelo como attachments. La allowlist `read,bash,edit,write` no desactiva visión y no existe una quinta tool de imágenes. Cuando un modelo no declara soporte de imágenes, Pi omite el attachment.

Los targets multimodales deben distinguirse de los targets puramente textuales. Las comparaciones entre modelos con y sin soporte de imágenes deben informar esa diferencia o usar material textual equivalente.

### Política de prompts

Pi conserva su system prompt base y recibe un addon versionado en español según el propósito de la invocación: solver, generación de pauta o judge. El addon no reemplaza el prompt base. Su archivo exacto, propósito y SHA-256 deben quedar preservados en la evidencia o en el directorio aislado de la invocación.

El prompt de usuario distingue Standalone Tasks de Cumulative Stages. La primera etapa cumulative se presenta como la base inicial de la secuencia; solo las etapas posteriores indican que `/workspace` contiene trabajo heredado. En todos los casos, la etapa actual se evalúa únicamente contra su propio enunciado.

## Relationships

- El Target Catalog descubre Standalone Tasks y Cumulative Sequences.
- Una Cumulative Sequence contiene Cumulative Stages ordenadas.
- Cada Task contiene Public, Original y Grading Material.
- Cada Task resuelve un Execution Environment desde su override, el default del curso o un override explícito del CLI.
- Un Run consume Input y produce Output más Evidence.
- Una etapa posterior recibe el Output anterior más su Public Material.
- El código se acumula, pero Stage Scope no se acumula.
- Un AI Judge evalúa un Run contra un Approved Rubric de la misma Task y produce un verdict estructurado.

## Invariants

- El Solver recibe solamente Public Material.
- Cada Run usa un contenedor nuevo, que se elimina al finalizar.
- El Environment ID efectivo queda registrado en la procedencia del Run.
- Los IDs derivan de las rutas del catálogo.
- El orden cumulative deriva del orden alfabético de los directorios de etapa.
- Agregar tareas no requiere editar registros en código.
- Cada Cumulative Stage se evalúa solo contra su enunciado.
- Inherited Defects no generan descuentos por requisitos anteriores.
- Los pesos efectivos de los Criteria de un verdict suman 1.
- El host calcula la nota y aplica Grade Adjustments declarados por el AI Judge desde el Approved Rubric.
- Raw Event Streams y agent homes no forman parte de un Run publicable; solo se retienen temporalmente cuando falla la compactación.
- Manual Review y AI Judge permanecen separados.

## Flagged ambiguities

- Task puede significar Benchmark Target o Cumulative Stage. En diseño y código, usar Benchmark Target para la unidad superior.
- Cumulative significa acumulación de código, no acumulación de criterios.
- Final state es evidencia para requisitos actuales, no una reevaluación de etapas anteriores.
- Los puntajes originales pueden sumar 4, 6, 10, 60 u otro máximo; no se normalizan a 100 dentro del Approved Rubric.
- Original significa material preservado para humanos, no necesariamente solución oficial.
- Public significa visible para el Solver, no publicado en internet.
