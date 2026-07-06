# AI Task Bench

[Página Web](https://uchile-bench.pages.dev/)

Este repositorio pone a prueba que tantas tareas del DCC Uchile puede un agente de IA, y versiones más ligeras, pueden realizar. Minimax M3, Deepseek V4 Flash y GPT 5.4 mini son puestos a prueba para luego ser evaluados por GPT 5.5 medium.

La regla central es simple: el solver ve `public/` y nada más. `original/`, `grading/`, ejecuciones anteriores, credenciales y configuración del host no son parte del mundo del solver.

## Resultados Actuales

Snapshot local generado desde `runs/` el 2026-07-06. Las notas son del AI Judge `gpt-5.5-medium`; el costo de DeepSeek V4 Flash se calcula a partir del precio público pues por opencode es gratis.

| Solver | Runs completas | Reviews GPT-5.5 medium | Nota media | Mediana | >= 6.0 | 7.0 | Costo observado | Tokens | Nota |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| MiniMax M3 (high-reasoning) | 28/28 | 28/28 | 6.95 | 7.0 | 28/28 | 22/28 | $19.80 | 128,061,137 | corrida completa |
| DeepSeek V4 Flash (max-reasoning) | 28/28 | 28/28 | 6.65 | 6.8 | 25/28 | 12/28 | $0.42 | 48,339,553 | corrida completa |
| GPT 5.4 mini (medium-reasoning) | 28/28 | 28/28 | 6.28 | 7.0 | 24/28 | 15/28 | $3.55 | 13,747,426 | corrida completa |



## Posibles Mejoras

Primero, por la cantidad limitada de recursos solo se hizo una run por modelo, hay outliers claros como los dos 1.0 que sacó GPT 5.4 mini en CC3501 porque no quizo ejecutar el código y ver que tenía un error de sintaxis, por alguna razón. Otra limitación es la cantidad de modelos y cantidad de tareas probadas. 

Eres libre de abrir un PR y aportar con código o inferencia.

## Qué Hay Aquí

El catálogo vive bajo `tasks/`.

- `tasks/standalone/<ramo>/<tarea>/task.json` describe una tarea independiente.
- `tasks/cumulative/<secuencia>/<etapa>/task.json` describe una etapa acumulativa.
- `public/` contiene el material entregado al solver.
- `original/` conserva el material fuente para auditoría humana.
- `grading/` contiene rúbricas, aprobaciones y material de evaluación que el solver no recibe.

Los entornos viven fuera de las tareas:

- `tasks/environments.json` decide el entorno predeterminado por ramo.
- `environments/*.json` define imagen, Dockerfile, límites y red.
- `docker/*.Dockerfile` fija las herramientas que el agente tendrá dentro del contenedor.

Los agentes se declaran en `agents/*.json`. El solver por defecto sigue siendo `pi-minimax-m3-high-api`; la generación de rúbricas y el AI Judge usan por defecto `pi-openai-gpt-5.5-high-subscription`.

## Requisitos Técnicos

El benchmark asume una máquina Linux con Docker. Las versiones exactas del host deben registrarse antes de publicar resultados; estas son las versiones con las que se está trabajando ahora:

- Bun `1.3.14`.
- Docker CLI `29.6.1`, con daemon activo.
- Node `24.13.1` en el host; las imágenes Docker usan `node:22` como base.
- Pi Coding Agent `0.80.2`, instalado dentro de las imágenes Docker.
- Dependencias JavaScript instaladas con `bun install --frozen-lockfile`.
- Acceso de red al provider elegido.
- Cuenta ChatGPT Plus/Pro con Codex para perfiles `openai-codex`.
- `MINIMAX_API_KEY` para el perfil `pi-minimax-m3-high-api`.

La instalación reproducible empieza con el lockfile, no con una resolución nueva de dependencias:

```bash
bun install --frozen-lockfile
```

Luego confirma que las herramientas esperadas existen:

```bash
bun --version
docker --version
bun run bench doctor
```

Antes de una corrida reportable, registra el estado exacto:

```bash
git rev-parse HEAD
git status --short
bun --version
docker --version
docker image inspect ai-task-bench-pi:latest --format '{{.Id}}'
```

El último valor importa porque un tag como `latest` puede moverse. Para un paper, reporte o release, conserva el image ID o digest efectivo junto con los run IDs.

## Configuración Local

Instala dependencias:

```bash
bun install --frozen-lockfile
```

Crea el archivo local de variables:

```bash
cp .env.example .env
```

Si vas a evaluar MiniMax M3, agrega la clave en `.env`:

```bash
MINIMAX_API_KEY=...
```

No hace falta para perfiles `openai-codex`, que usan la sesión aislada de Pi descrita abajo. Completa solo lo necesario. No guardes tokens reales en perfiles de agente, evidencia, runs publicados ni commits.

Para usar perfiles `openai-codex`, guarda la sesión de Pi fuera del repositorio:

```bash
mkdir -p "$HOME/.ai-task-bench/pi-openai-codex"
PI_CODING_AGENT_DIR="$HOME/.ai-task-bench/pi-openai-codex" \
  bun "$(command -v pi)"
```

Dentro de Pi, ejecuta `/login`, elige `ChatGPT Plus/Pro (Codex)`, completa el login y sal. El benchmark monta esa carpeta solo para agentes `openai-codex`.

## Instalación Verificable

Primero valida el repositorio sin invocar modelos:

```bash
bun run check
bun run bench list-targets
bun run bench list-agents
bun run bench list-environments
bun run bench doctor
```

Luego construye las imágenes. Construir imágenes no ejecuta inferencia.

```bash
bun run bench docker-build --agent pi-openai-gpt-5.4-mini-medium-subscription
bun run bench docker-build --environment cc3001
bun run bench docker-build --environment cc3301
bun run bench docker-build --environment cc3501
bun run bench docker-build --environment cc4101
bun run bench docker-build --environment cc4102
bun run bench docker-build --environment cc4302
bun run bench docker-build --environment cc4303
```

Si Docker no responde, no sigas con runs. Un run sin entorno certificado no es una observación comparable.

## Corridas

Una corrida de humo sirve para probar el mecanismo:

```bash
bun run bench run CC3001/t01 \
  --agent pi-openai-gpt-5.4-mini-medium-subscription \
  --runs 1
```

Una comparación reportable debe pasar el agente explícitamente y usar repeticiones independientes:

```bash
bun run bench run CC3001/t01 \
  --agent pi-openai-gpt-5.4-mini-medium-subscription \
  --runs 3
```

No compares resultados que cambian de commit, material público, entorno Docker, prompt addon, cantidad de runs, rúbrica, modelo, provider, versión de Pi o modalidad del target sin declararlo.

## Rúbricas y Juez

Las rúbricas son parte de la curación del benchmark, no de cada run del solver.

```bash
bun run bench rubric-generate CC3001/t01
```

Ese comando genera `grading/rubric.draft.md`. Una persona lo revisa, corrige y luego lo aprueba:

```bash
bun run bench rubric-approve CC3001/t01
```

El AI Judge solo evalúa runs completados y exige una rúbrica aprobada:

```bash
bun run bench judge <runId> --task CC3001/t01
```

El juez escribe un `verdict.json` estructurado. El host valida el schema, verifica el hash de la rúbrica y calcula la nota final.

## Flujo De Preparación

Este es el flujo real del dataset. No todo es comando; varias partes son deliberadamente manuales porque ahí se decide qué constituye una tarea limpia.

Antes del detalle, el mapa corto es este:

```text
preparación manual
  elegir tareas
  subir material original
  construir public/ limpio
  definir task.json
  configurar entorno por ramo
  generar y aprobar rúbricas
  validar catálogo e imágenes

benchmark
  construir imágenes
  correr solver N veces por target y agente
  conservar input, output, evidencia y sesión compacta
  correr AI Judge sobre cada run completado
  revisar resultados y preparar paquete publicable
```

```text
preparar benchmark
  elegir ramos y tareas
    descartar tareas que requieren GUI, VM, drivers, simuladores externos o datos no publicables
    decidir si cada tarea es standalone o parte de una cumulative sequence
    anotar exclusiones y reescrituras en decisiones.md

  subir enunciados
    crear tasks/standalone/<ramo>/<tarea>/ o tasks/cumulative/<secuencia>/<etapa>/
    guardar fuente intacta en original/
    copiar material visible al estudiante en public/
    crear grading/ aunque todavía esté vacío
    crear task.json sin IDs manuales

  modificar enunciados
    convertir PDF/TXT a Markdown revisable
    remover referencias a U-Cursos, entrega manual o archivos que no estarán disponibles
    hacer explícitos los productos esperados
      código
      informe en Markdown
      tests o comandos de verificación
    no agregar requisitos que no estaban en el material original

  revisar material público
    confirmar que public/ basta para resolver
    confirmar que original/ y grading/ no filtran al solver
    confirmar que no hay credenciales, rutas locales ni resultados previos

  configurar entorno
    revisar los seis enunciados de un ramo antes de elegir herramientas
    crear docker/<ramo>.Dockerfile con solo lo necesario
    crear environments/<ramo>.json con CPU, memoria, PIDs, red y flags
    registrar el default en tasks/environments.json
    usar overrides por tarea solo si hay una excepción real

  validar catálogo
    bun run validate:benchmark
    bun run bench list-targets
    bun run bench list-environments

  certificar imágenes
    levantar Docker
    construir imagen del agente
    construir imagen de cada entorno
    hacer smoke tests por ramo
      imports básicos
      compiladores o runtimes
      herramientas de red
      OpenGL/Xvfb cuando corresponda

  generar rúbricas
    por cada tarea
      bun run bench rubric-generate <taskId>
      revisar grading/rubric.draft.md
      corregir pesos, topes, descuentos y criterios inventados
      bun run bench rubric-approve <taskId>

  correr solvers
    elegir agente explícito
    elegir número de repeticiones
    registrar commit, estado git, imagen Docker y fecha
    bun run bench run <targetId> --agent <agentId> --runs <n>

  evaluar
    por cada run completado
      bun run bench judge <runId> --task <taskId>
      revisar verdict.json y review.md
      comparar contra rúbrica aprobada

  publicar
    conservar runs/ publicables
    conservar rúbricas aprobadas y aprobaciones
    conservar agent JSON, prompt addons, commit, versiones e image digests
    borrar credenciales, homes transitorios, caches y raw logs no publicables
```

## Referencia Técnica De Comandos

Todos los comandos viven bajo `bun run bench <subcomando>`. Las rutas y los IDs se resuelven relativos al catálogo y a `runs/`. Esta sección complementa el flujo de arriba con la forma exacta de invocar cada pieza.

### Listado, inspección y diagnóstico

```bash
bun run bench list-targets
bun run bench list-agents
bun run bench list-environments
bun run bench list-runs --task CC3001/t01
bun run bench inspect-run <runId> --task CC3001/t01
bun run bench progress
bun run bench doctor
```

`list-runs` e `inspect-run` aceptan `--task <taskId>` para acotar la búsqueda cuando un `runId` no basta. `inspect-run` muestra estado, Execution Environment efectivo, agente y procedencia del run. `doctor` valida binarios, Docker y disponibilidad de cada agente.

### Runs del solver

Corrida de humo sobre un target puntual:

```bash
bun run bench run CC3001/t01 \
  --agent pi-openai-gpt-5.4-mini-medium-subscription \
  --runs 1
```

Corrida reportable con repeticiones independientes:

```bash
bun run bench run CC3001/t01 \
  --agent pi-openai-gpt-5.4-mini-medium-subscription \
  --runs 3
```

Sin `targetId`, ejecuta todos los targets incompletos del catálogo. El flag `--prefix` acota el batch a un ramo o subárbol:

```bash
bun run bench run \
  --agent pi-openai-gpt-5.4-mini-medium-subscription \
  --runs 3 \
  --prefix CC3001
```

Flags principales de `run`:

- `--agent <agentId>`: agente a invocar. Default `pi-minimax-m3-high-api`.
- `--environment <environmentId>`: override del Execution Environment; si se omite, usa el default del ramo declarado en `tasks/environments.json`.
- `--runs <n>`: cantidad de repeticiones independientes. Default `1`.
- `--prompt <texto>`: prompt de usuario alternativo al addon versionado.
- `--reset`: limpia progreso antes de una corrida batch.
- `--prefix <prefijo>`: filtra targets por prefijo del catálogo.

Para revisar o reconstruir la sesión de un run ya existente:

```bash
bun run bench session <runId> --task CC3001/t01
bun run bench review <runId> --task CC3001/t01
```

`session` reconstruye `session.compact.json` desde la evidencia disponible; falla con `SessionRawUnavailableError` si el raw ya fue purgado. `review` inicializa un directorio de revisión humana con `review.md` y `score.json`.

### Rúbricas

```bash
bun run bench rubric-generate CC3001/t01
bun run bench rubric-generate CC3001/t01 --agent pi-openai-gpt-5.5-high-subscription
bun run bench rubric-approve CC3001/t01
bun run bench rubric-approve CC3001/t01 --force
```

- `rubric-generate` produce `grading/rubric.draft.md` usando el agente configurado; default `pi-openai-gpt-5.5-high-subscription`.
- `rubric-approve` sella la versión revisada por una persona y registra su hash. `--force` reemplaza una rúbrica previamente aprobada.

Una rúbrica aprobada es prerequisito para que el AI Judge pueda evaluar runs de esa Task. El host verifica el hash antes de aceptar el verdict.

### AI Judge

```bash
bun run bench judge <runId> --task CC3001/t01
bun run bench judge <runId> --task CC3001/t01 --agent pi-openai-gpt-5.5-high-subscription
bun run bench judge <runId> --task CC3001/t01 --force
```

El juez exige run completado y rúbrica aprobada. Flags:

- `--task <taskId>`: localiza el run cuando el `runId` no es único en `runs/`.
- `--agent <agentId>`: modelo juez; default `pi-openai-gpt-5.5-high-subscription`.
- `--force`: permite una segunda revisión del mismo agente sobre el mismo run.

El output es un `verdict.json` estructurado. El host valida el schema, contrasta contra el hash de la rúbrica aprobada y traduce el puntaje a Base Grade y Final Grade aplicando los Grade Adjustments declarados por el juez.

### Builds y TUI

```bash
bun run bench docker-build --agent pi-openai-gpt-5.4-mini-medium-subscription
bun run bench docker-build --environment cc3001
bun run bench tui
```

`docker-build` construye la imagen de un agente o de un Execution Environment; construir no ejecuta inferencia. `tui` abre la interfaz de terminal del benchmark.

## Qué No Debe Cambiar En Silencio

Un resultado deja de ser comparable si cambia cualquiera de estas piezas:

- el commit del benchmark;
- el material en `public/`;
- el `Environment Profile`;
- la imagen Docker efectiva;
- el agent ID;
- el provider, modelo o thinking;
- el prompt addon;
- la rúbrica aprobada;
- el número de repeticiones;
- la versión de Pi.

Si cambia, no es necesariamente malo. Solo es otra condición experimental pues los LLM no son deterministas.

## Comandos De Experimento

Estos comandos empaquetan el flujo habitual de corrida, evaluación y revisión de cobertura sin tener que recordar los agent IDs completos.

Los alias disponibles actualmente son:

- `minimax` -> `pi-minimax-m3-high-api`
- `deepseek` -> `pi-zen-deepseek-v4-flash-free-xhigh`
- `mimo` -> `pi-zen-mimo-v2.5-free-high`
- `gpt-5.5-low` -> `pi-openai-gpt-5.5-low-subscription`
- `gpt-5.5-medium` -> `pi-openai-gpt-5.5-medium-subscription`
- `gpt-5.5-high` -> `pi-openai-gpt-5.5-high-subscription`
- `gpt-5.4-medium` -> `pi-openai-gpt-5.4-medium-subscription`
- `gpt-5.4-mini-medium` -> `pi-openai-gpt-5.4-mini-medium-subscription`

Para correr MiniMax sobre un subconjunto:

```bash
bun run bench experiment run minimax \
  --prefix CC3001 \
  --concurrency 6 \
  --runs 1 \
  --timeout-minutes 30 \
  --reset
```

Ejecuta el benchmark como tu usuario normal. Si Docker todavía exige root, configura acceso al daemon para tu usuario antes de experimentar; mezclar runs con y sin `sudo` ensucia ownership en `runs/`. El harness normaliza artefactos cuando detecta `sudo`, pero el flujo reproducible sigue siendo no usarlo.

`experiment run` usa progreso aislado por agente y prefijo bajo `runs/progress/experiments/`. Un `--reset` de `CC3301` no toca el progreso de `CC3001`, ni el de otro agente. Para los perfiles `openai-codex`, las credenciales se copian al Agent Home de cada run antes de lanzar Docker; no se monta el directorio de autenticación compartido en vivo.

El timeout default viene del agente. Si una tarea está pegando contra el límite, usa `--timeout-minutes <n>` en vez de editar el JSON del agente:

```bash
bun run bench experiment run minimax \
  --prefix CC3301 \
  --concurrency 2 \
  --runs 1 \
  --timeout-minutes 45 \
  --reset
```

Para `gpt-5.5-*` como solver, parte con `--concurrency 1`. Sube a `2` solo después de una corrida limpia; el cuello de botella no es CPU sino sesión, cuota y estabilidad del proveedor.

Para juzgar las runs completadas de ese experimento:

```bash
bun run bench experiment judge minimax \
  --judge gpt-5.5-low \
  --prefix CC3001 \
  --concurrency 1
```

Para ver cobertura, costos y revisiones ya generadas:

```bash
bun run bench experiment status minimax --prefix CC3001
```

`experiment judge` solo evalúa runs completadas del agente indicado. Si ya existe una revisión del mismo juez, la salta; usa `--force` si quieres generar otra revisión. La concurrencia también se puede dejar en `.env` con `BENCH_RUN_CONCURRENCY`, pero el flag `--concurrency` deja la corrida explícita en el historial de terminal.

### Comandos Reportables Actuales

Para regenerar un resumen en terminal:

```bash
bun run results
```

Para ver una tabla corta de notas por target en terminal:

```bash
bun run grades
```

Los resultados comparables actuales usan una repetición por Benchmark Target y `gpt-5.5-medium` mediante suscripción como AI Judge. Estos comandos son intencionalmente explícitos aunque repitan el patrón anterior. Por default hay un timeout de 120 minutos.

Para rehacer el benchmark puedes usar la flag --reset o mover los resultados de runs/ (gitignored) a otra carpeta. Se recomienda concurrency 1 pues algunas tareas son pesadas en el lado de CPU y pueden alterar el pensamiento del LLM a reintentar indefinidamente los tests de CC3001-CC4301 para lograr la nota máxima.

```bash
bun run bench experiment run minimax --runs 1 --concurrency 1
```

```bash
bun run bench experiment judge minimax --judge pi-openai-gpt-5.5-medium-subscription --concurrency 1
```

```bash
bun run bench experiment status minimax
```

```bash
bun run bench experiment run deepseek --runs 1 --concurrency 1
```

```bash
bun run bench experiment judge deepseek --judge pi-openai-gpt-5.5-medium-subscription --concurrency 1
```

```bash
bun run bench experiment status deepseek
```

```bash
bun run bench experiment run gpt-5.4-mini-medium --runs 1 --concurrency 1
```

```bash
bun run bench experiment judge gpt-5.4-mini-medium --judge pi-openai-gpt-5.5-medium-subscription --concurrency 1
```

```bash
bun run bench experiment status gpt-5.4-mini-medium
```
