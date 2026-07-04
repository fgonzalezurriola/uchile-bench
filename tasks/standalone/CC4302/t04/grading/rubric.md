# Pauta de evaluación

## Alcance

Se evalúa la tarea CC4302/t04: implementación en `subasta.c` del tipo `struct subasta` y de las funciones públicas declaradas en `subasta.h`:

- `nSubasta nNuevaSubasta(int unidades)`
- `int nOfrecer(nSubasta s, double precio)`
- `double nAdjudicar(nSubasta s, int *punidades)`
- `void nDestruirSubasta(nSubasta s)`

El alcance corresponde a T4: ofertas con espera indefinida, equivalente a `timeout = -1`. No se evalúa la funcionalidad de timeout finito ni la posibilidad de que un nthread realice una nueva oferta por timeout, indicada para T5.

La solución debe usar primitivas nativas de bajo nivel de nThreads, tales como `START_CRITICAL`, `setReady`, `suspend`, `schedule`, etc., y no debe usar herramientas de sincronización preexistentes a nThreads como semáforos, mutex, condiciones o mensajes.

## Criterios

### P1 - Integración de interfaz y ciclo de vida de la subasta

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0 propuesto
- Requisito evaluado: la solución implementa correctamente el TDA `subasta` en `subasta.c`, respeta las firmas de `subasta.h`, inicializa una subasta con `n` unidades y libera los recursos usados.
- Evidencia esperada: archivo `subasta.c`; compilación exitosa; ejecución de `make run`, `make run-g`, `make run-thr` y `make run-san`.
- Puntaje completo: define una estructura interna suficiente; `nNuevaSubasta` inicializa una subasta válida con la cantidad de unidades indicada; `nDestruirSubasta` libera los recursos propios sin dejar estructuras pendientes; no modifica la interfaz pública.
- Puntaje parcial: propuesto: asignar proporcionalmente si la interfaz compila pero hay errores menores de inicialización o liberación que no impiden todos los casos funcionales.
- Puntaje cero: no compila, cambia firmas públicas requeridas, no implementa el tipo `subasta`, o las funciones principales quedan vacías/inutilizables.

### P2 - Manejo de ofertas y selección de posibles ganadores

- Origen del puntaje: propuesto
- Puntaje máximo: 2.0 propuesto
- Requisito evaluado: `nOfrecer` registra ofertas concurrentes por un item y mantiene como posibles adjudicatarios a las mejores ofertas disponibles según la cantidad de unidades.
- Evidencia esperada: comportamiento observado en `test-subasta.c`, especialmente `test1` y `test2`; salidas de `make run` y `make run-g`.
- Puntaje completo: cada oferente queda esperando mientras su oferta sigue dentro de las mejores `n`; cuando existen `n` ofertas de precio mayor, la oferta desplazada retorna `FALSE`; las mejores ofertas permanecen pendientes hasta el cierre; no se adjudican unidades antes de `nAdjudicar`.
- Puntaje parcial: propuesto: otorgar crédito parcial si acepta ofertas y distingue ganadores/perdedores en casos simples, pero falla en reemplazos sucesivos, concurrencia o en casos con más oferentes que unidades.
- Puntaje cero: `nOfrecer` retorna siempre un valor fijo, no bloquea cuando corresponde, no registra ofertas, o no distingue ofertas ganadoras de perdedoras.

### P3 - Cierre de la subasta y adjudicación

- Origen del puntaje: propuesto
- Puntaje máximo: 1.5 propuesto
- Requisito evaluado: `nAdjudicar` cierra la subasta, calcula la recaudación total, informa unidades no vendidas y despierta a los oferentes con el resultado correcto.
- Evidencia esperada: casos de `test-subasta.c`: recaudación 7 con 2 unidades, recaudación 18 con 3 unidades, recaudación 5 y 3 unidades sin vender con 5 unidades disponibles.
- Puntaje completo: al cerrar, retorna la suma de las ofertas adjudicadas; escribe en `*punidades` las unidades no vendidas cuando hay menos ganadores que unidades; hace retornar `TRUE` a adjudicatarios y `FALSE` a perdedores; no deja oferentes bloqueados tras el cierre.
- Puntaje parcial: propuesto: otorgar crédito parcial si cierra y despierta threads, pero calcula incorrectamente recaudación, unidades no vendidas o resultados individuales en algunos casos.
- Puntaje cero: no implementa cierre, no despierta oferentes, retorna montos/unidades arbitrarios, o produce deadlock al adjudicar.

### P4 - Sincronización con nThreads y restricciones de implementación

- Origen del puntaje: propuesto
- Puntaje máximo: 1.5 propuesto
- Requisito evaluado: la solución sincroniza correctamente múltiples oferentes y subastas paralelas usando primitivas nativas de bajo nivel de nThreads, sin usar semáforos, mutex, condiciones ni mensajes preexistentes.
- Evidencia esperada: revisión de `subasta.c`; ausencia de llamadas a `nSem`, `nMutex`, `nCond`, monitores o mensajes; ejecución correcta de los tests de robustez y paralelismo.
- Puntaje completo: protege secciones críticas con `START_CRITICAL`/`END_CRITICAL`; usa adecuadamente colas, `suspend`, `setReady` y `schedule`; no presenta carreras lógicas ni deadlocks; soporta múltiples subastas en paralelo.
- Puntaje parcial: propuesto: otorgar crédito parcial si usa primitivas permitidas pero presenta fallas ocasionales de interbloqueo, despertar incorrecto o manejo incompleto de concurrencia.
- Puntaje cero: usa primitivas prohibidas de sincronización, depende de espera activa injustificada, produce deadlocks sistemáticos o no es seguro ante concurrencia.

### P5 - Cumplimiento de comandos de prueba y análisis dinámico

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0 propuesto
- Requisito evaluado: la solución pasa los comandos de prueba exigidos por el material público.
- Evidencia esperada:
  - `make run` felicita por aprobar el modo de ejecución.
  - `make run-g` felicita.
  - `make run-thr` felicita y no reporta dataraces.
  - `make run-san` felicita y no reporta incidentes de memoria.
- Puntaje completo: los cuatro comandos terminan correctamente y muestran los mensajes de aprobación esperados, sin errores de memoria ni dataraces reportados.
- Puntaje parcial: propuesto: otorgar crédito proporcional según la cantidad de comandos aprobados y la gravedad de los incidentes observados.
- Puntaje cero: no se puede ejecutar la batería de pruebas, falla la compilación, o los comandos terminan con errores críticos generalizados.

## Descuentos, topes y reglas especiales - si corresponde

- Requisito de aprobación explícito: el README indica que, para aprobar la tarea, `make run-san`, `make run-thr`, `make run` y `make run-g` deben felicitar al estudiante; además `make run-san` no debe reportar incidentes de memoria y `make run-thr` no debe reportar dataraces. No se especifica un descuento numérico ni un tope de nota asociado.
- Restricción de sincronización: el enunciado prohíbe usar herramientas de sincronización preexistentes a nThreads, específicamente semáforos, mutex, condiciones o mensajes. El material no especifica un descuento numérico; debe considerarse incumplimiento del requisito de implementación.
- Advertencia de ASan: el mensaje `WARNING: ASan doesn't fully support makecontext/swapcontext functions and may produce false positives in some cases!` se declara explícitamente como no problemático y no debe penalizarse por sí solo.
- Generación de `subasta.zip` con `make zip` es una instrucción de entrega y empaquetado; no se considera criterio técnico adicional de la solución.

## Escala final

- Puntaje máximo original total: no especificado en los materiales.
- Puntaje máximo propuesto total: 7.0
- Ponderación entre secciones: no corresponde.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales:
  - La solución se implementa en `subasta.c`.
  - T4 considera espera indefinida, equivalente a `timeout = -1`.
  - T5, timeout finito y nueva oferta por timeout quedan fuera del alcance de esta tarea.
  - Las funciones deben implementarse usando primitivas nativas de bajo nivel de nThreads.
  - No se pueden usar semáforos, mutex, condiciones ni mensajes.
  - Los comandos exigidos son `make run`, `make run-g`, `make run-thr` y `make run-san`.
- Puntajes o niveles propuestos:
  - Todos los puntajes de criterios y reglas de puntaje parcial son propuestos, porque el material no entrega una distribución numérica original.
- Ambigüedades no resueltas:
  - El material no define explícitamente cómo resolver empates de precio entre ofertas.
  - No se especifica una nota directa, descuento o tope concreto por fallar uno de los comandos exigidos.
- Requisitos no verificables completamente con el material disponible:
  - La ausencia total de errores en tests ocultos.
  - La reproducibilidad exacta en ambientes distintos a Debian 11 de 64 bits o bajo carga alta de CPU.
  - La intención de evaluación manual ante usos indirectos o encubiertos de primitivas prohibidas.
