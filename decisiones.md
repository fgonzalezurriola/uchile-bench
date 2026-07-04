1. La tarea 6 de CC3301 Programación de Software de Sistemas trata de usar un programa con GUI para circuitos eléctricos, por lo que queda fuera.
2. Tareas 5 y 6 CC4302 Sistemas operativos son "acumulativas" las reescribí para que el agente pueda hacer la sexta sin necesidad del resultado de la quinta.
3. La tarea 7 de CC4303 Redes (Simulando routers BGP con Einar) queda fuera porque requiere usar Einar, un OS/simulador de redes que los agentes no pueden operar.
4. Tareas 4 y 5 CC4303 Redes son "acumulativas" las reescribí para que el agente pueda hacer la quinta sin necesidad del resultado de la cuarta.
5. CC5205 Minería de datos fue descartado completo del benchmark por la fricción del formato y dependencias como archivos de datos, necesarios para la realización de los laboratorios.
6. CC3002 Fue descartado por que tendría que reescribir cada enunciado para transformar las entregas parciales en tareas completas, y en general, hacer muchas excepciones para este ramo en el código.
7. CC4302/t07 Fue descartado porque requiere instalar un driver, mientras que el benchmark solo tiene acceso a un contenedor y no a una máquina virtual.
8. CC4302/t06: se agregó instrucción de que solo repitiera una vez `make zip` para validar su código, debido a que minimax estaba loopeando en multiples ejecuciones de make commands de forma paranoica para asegurarse de que no habían data races, haciendo costosa y muy larga la ejecución.
9. CC4303-redes-ip y CC4303-transport quedan fuera del benchmark porque el testeo de esas tareas en particular toma varias horas y está siendo muy engorroso hacer que el modelo cree la solución, se asegure de que su tarea está bien y luego que el modelo corrector se asegure de que lo que hizo el otro está bien.

## Estado efectivo de la integración

- CC3001 t01-t06: standalone.
- CC3301 t01-t05, t07 y t08: standalone; t06 excluida.
- CC3501 t01-t03: cumulative.
- CC4101 t01-t03, CC4102 t01-t02, CC4302 t01-t06 y CC4303 t01-t02: standalone.
- CC4303-redes-ip y CC4303-transport quedan archivadas fuera del catálogo activo.
- CC4302 t07 queda fuera del catálogo.
- CC4303 t07 queda fuera del catálogo.
- `original/` conserva todos los archivos originales; `public/` copia todo salvo PDF y TXT. Los PDF se convierten a Markdown con MarkItDown y los TXT se copian con extensión `.md`, para revisión manual previa a los runs.

## Flujo en pseudocódigo (partes manuales y comandos que ocurren)

```text
preparar dataset
  para cada ramo candidato
    revisar todas las tareas disponibles antes de integrarlo
    descartar tareas que dependan de GUI, VM, drivers, simuladores externos, datos pesados o corrección demasiado lenta
    decidir si las tareas entran como standalone o como cumulative sequence
    si una tarea acumulativa puede separarse sin cambiar su objetivo, reescribir el Public Material para que sea autocontenida
    registrar en este archivo cada exclusión, reescritura o excepción experimental

  para cada Task aceptada
    crear tasks/standalone/<ramo>/<tarea>/ o tasks/cumulative/<secuencia>/<stage>/
    guardar el material fuente intacto en original/
    copiar a public/ solo el material visible para el Solver
    crear grading/ para pautas, tests privados y material de corrección
    convertir PDF a Markdown con MarkItDown cuando el Solver necesite leer el enunciado
    copiar TXT como .md cuando corresponda revisión manual
    limpiar referencias a U-Cursos, entrega manual, plazos y archivos que no estarán disponibles
    hacer explícito el producto esperado sin agregar requisitos nuevos
    crear task.json sin IDs manuales
    si la Task necesita un entorno distinto al default del ramo, declarar environmentId en task.json

  revisar aislamiento
    verificar que public/ permite resolver la Assignment Statement
    verificar que original/ no queda referenciado desde public/
    verificar que grading/ no queda visible al Solver
    verificar que no hay credenciales, rutas locales, resultados previos ni instrucciones host-only

configurar Execution Environments
  para cada ramo activo
    elegir una imagen por ramo cuando las dependencias son homogéneas
    crear o actualizar docker/<environment>.Dockerfile
    crear o actualizar environments/<environment>.json con imagen, límites, red, variables y flags
    registrar el default del ramo en tasks/environments.json
    usar override por Task solo para excepciones reales

  validar configuración
    bun run bench doctor
    bun run validate:benchmark
    bun run bench list-targets
    bun run bench list-environments

  construir imágenes
    para cada Execution Environment activo
      bun run bench docker-build --environment <environmentId>
    para cada agente usado en el experimento, si aplica construir imagen local del agente
      bun run bench docker-build --agent <agentId>

preparar Approved Rubrics
  para cada Task activa
    bun run bench rubric-generate <taskId>
    revisar manualmente grading/rubric.draft.md contra Public Material y Grading Material
    corregir criterios inventados, pesos, topes, descuentos y reglas de nota
    bun run bench rubric-approve <taskId>

correr benchmark
  elegir agent ID completo, número de repeticiones, commit, fecha, Pi version y Execution Environment efectivo
  para un Target puntual
    bun run bench run <targetId> --agent <agentId> --runs <n>

  para un batch por prefijo
    bun run bench run --agent <agentId> --runs <n> --prefix <courseId> --concurrency <n>

  para el flujo reportable por alias experimental
    bun run bench experiment run <agentAlias> --runs <n> --concurrency <n> --reset

  si una Cumulative Sequence falla a mitad de camino y la causa es operacional
    bun run bench resume-cumulative <targetId> <sequenceRunId> --from <stageKey>

evaluar Runs
  para cada Run completado
    confirmar que run.json.status es completed
    confirmar que existe Approved Rubric para run.taskId
    bun run bench judge <runId> --task <taskId> --agent <judgeAgentId>
    revisar el AI Review generado en 06-review/ai/<judgeAgentId>/<judgeId>/
    confirmar que verdict.json valida schema, rubricHash y aritmética host
    confirmar que score.json tiene score no nulo antes de tratar el resultado como evaluado

  para evaluar un experimento completo
    bun run bench experiment judge <agentAlias> --judge <judgeAgentId> --concurrency <n>
    bun run bench experiment status <agentAlias>

publicar resultados
  conservar por Run
    00-input/
    04-output/
    05-evidence/
    06-review/ con Manual Review o AI Review publicables
    run.json con agent ID, Environment ID efectivo, comando y estados

  conservar por Task
    public/
    grading/rubric.md
    grading/rubric.approval.json

  conservar por experimento
    commit exacto
    estado git relevante
    versión de Pi
    prompt addons y hashes
    agent JSON
    Execution Environment Profiles
    image tags o digests
    tabla de target, agent ID, run ID, estado, review y Final Grade

  remover o no publicar
    credenciales
    Agent Homes transitorios
    caches
    Raw Event Streams purgados después de generar Publishable Session
    cualquier Original Material o Grading Material no autorizado para publicación
```
