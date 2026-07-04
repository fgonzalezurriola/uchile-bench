# Pauta de evaluación

## Alcance

Se evalúa la implementación de `disco.c` para la tarea CC4302/t02, que debe definir las funciones declaradas en `disco.h`:

- `void discoInit(void);`
- `void discoDestroy(void);`
- `char *dama(char *nom);`
- `char *varon(char *nom);`

La solución debe coordinar múltiples threads que representan damas y varones en una discoteca, emparejándolos según las reglas del enunciado, sin busy-waiting, usando la metodología de sincronización indicada y pasando los modos de prueba provistos.

## Criterios

### P1 - Integración con la interfaz requerida

- Origen del puntaje: propuesto
- Puntaje máximo: 0.6 propuesto
- Requisito evaluado: la entrega implementa correctamente las funciones requeridas en `disco.c`, usando los encabezados de `disco.h`, y puede compilarse con el sistema de compilación provisto.
- Evidencia esperada: archivo `disco.c`; compilación mediante `make`; llamadas desde `test-disco.c`.
- Puntaje completo: las cuatro funciones existen con las firmas correctas, enlazan correctamente con los tests y no requieren modificar `disco.h` ni `test-disco.c`.
- Puntaje parcial: propuesto: asignar proporcionalmente si algunas funciones o firmas están correctas pero la integración es incompleta.
- Puntaje cero: no compila, faltan funciones obligatorias o se cambia la interfaz requerida.

### P2 - Semántica básica de emparejamiento

- Origen del puntaje: propuesto
- Puntaje máximo: 1.4 propuesto
- Requisito evaluado: `dama` y `varon` deben retornar el nombre de la pareja de baile del sexo opuesto.
- Evidencia esperada: comportamiento observable en `make run`, especialmente los casos simples de `test-disco.c`.
- Puntaje completo: si una persona invoca `dama` o `varon` y hay una persona del sexo opuesto esperando, ambas se emparejan, intercambian nombres y ambas funciones retornan el nombre correcto de su pareja.
- Puntaje parcial: propuesto: otorgar crédito parcial si el intercambio de nombres funciona solo en algunos órdenes de llegada o casos simples.
- Puntaje cero: las funciones retornan nombres incorrectos, retornan `NULL` indebidamente o no logran formar parejas válidas.

### P3 - Espera bloqueante cuando no hay pareja disponible

- Origen del puntaje: propuesto
- Puntaje máximo: 0.9 propuesto
- Requisito evaluado: si al invocar `dama` o `varon` no hay personas del sexo opuesto en espera, la invocación debe esperar.
- Evidencia esperada: tests donde una dama o varón llega antes que su pareja; ausencia de retorno prematuro.
- Puntaje completo: la persona queda bloqueada hasta que llegue una persona compatible del sexo opuesto.
- Puntaje parcial: propuesto: asignar crédito si la espera funciona para algunos casos pero falla bajo concurrencia o en un sexo.
- Puntaje cero: la función retorna antes de que exista pareja o falla por deadlock en escenarios básicos.

### P4 - Orden de llegada entre personas del mismo sexo

- Origen del puntaje: propuesto
- Puntaje máximo: 1.2 propuesto
- Requisito evaluado: las personas del mismo sexo deben conseguir pareja por orden de llegada; cuando hay varias personas del sexo opuesto esperando, se elige la que lleva más tiempo esperando.
- Evidencia esperada: `testOrden` en `test-disco.c`; salida de `make run` o modo equivalente.
- Puntaje completo: respeta FIFO lógico para damas entre sí y varones entre sí en todos los casos evaluados.
- Puntaje parcial: propuesto: asignar crédito si respeta el orden solo para uno de los sexos o solo en escenarios no concurrentes.
- Puntaje cero: empareja fuera de orden de llegada de manera sistemática.

### P5 - Restricciones de sincronización obligatorias

- Origen del puntaje: propuesto
- Puntaje máximo: 1.2 propuesto
- Requisito evaluado: la solución debe usar obligatoriamente un solo mutex y una sola condición de pthreads; no puede usar múltiples condiciones ni otras herramientas de sincronización como semáforos; no puede usar busy-waiting.
- Evidencia esperada: revisión de `disco.c`; ejecución sin consumo activo indebido mientras threads esperan.
- Puntaje completo: usa exactamente la metodología indicada: un mutex, una condición de pthreads, espera bloqueante y sin mecanismos prohibidos.
- Puntaje parcial: propuesto: asignar crédito si la solución evita busy-waiting pero incumple parcialmente la restricción de cantidad de primitivas, o viceversa.
- Puntaje cero: usa busy-waiting, semáforos u otras primitivas prohibidas, o depende de múltiples condiciones para resolver el problema.

### P6 - Uso de distribuidores de números y ausencia de colas FIFO explícitas

- Origen del puntaje: propuesto
- Puntaje máximo: 0.8 propuesto
- Requisito evaluado: debe usarse un distribuidor de números para damas y otro para varones, como en el problema de lectores/escritores visto en cátedra; no se pueden usar colas FIFO para almacenar damas o varones en espera.
- Evidencia esperada: revisión de las variables globales y lógica de turnos en `disco.c`.
- Puntaje completo: implementa el orden de atención mediante tickets/displays para ambos sexos y no usa colas FIFO de personas en espera.
- Puntaje parcial: propuesto: asignar crédito si usa tickets solo para un sexo o si el mecanismo mantiene parcialmente el orden sin cumplir completamente la metodología.
- Puntaje cero: usa colas FIFO prohibidas o no implementa distribuidores de números.

### P7 - Consistencia concurrente y ausencia de estados inválidos

- Origen del puntaje: propuesto
- Puntaje máximo: 0.9 propuesto
- Requisito evaluado: en ningún momento puede ocurrir que haya simultáneamente varones y damas en espera; las parejas deben ser consistentes bajo concurrencia.
- Evidencia esperada: `testRobustez` en `test-disco.c`; ejecución repetida de `make run` o modos equivalentes.
- Puntaje completo: no produce parejas inconsistentes, no pierde threads, no empareja una persona con múltiples parejas y no deja esperando simultáneamente a personas de ambos sexos.
- Puntaje parcial: propuesto: asignar crédito si funciona en casos simples pero falla ocasionalmente bajo carga concurrente.
- Puntaje cero: presenta inconsistencias frecuentes, deadlocks, pérdida de señales o emparejamientos dobles.

### P8 - Inicialización, destrucción y manejo de recursos

- Origen del puntaje: propuesto
- Puntaje máximo: 0.7 propuesto
- Requisito evaluado: `discoInit` debe inicializar las variables globales necesarias y `discoDestroy` debe liberar los recursos solicitados; si no se necesitan, deben existir igualmente.
- Evidencia esperada: revisión de `disco.c`; ejecución con sanitizers o herramientas de memoria indicadas en los materiales.
- Puntaje completo: inicializa correctamente mutex, condición y estado global; destruye o libera los recursos correspondientes; no reporta problemas de memoria.
- Puntaje parcial: propuesto: asignar crédito si la inicialización funciona pero la destrucción es incompleta, o si hay problemas menores de recursos que no afectan la ejecución básica.
- Puntaje cero: no inicializa recursos necesarios, omite funciones obligatorias o causa errores de memoria graves.

### P9 - Modos de prueba requeridos

- Origen del puntaje: propuesto
- Puntaje máximo: 0.3 propuesto
- Requisito evaluado: los comandos de prueba indicados deben felicitar por aprobar y no reportar incidentes relevantes.
- Evidencia esperada: salida de `make run`, `make run-g`, `make run-san` y, según el material aplicable, `make run-thr` o `make run-mem`.
- Puntaje completo: todos los modos requeridos completan exitosamente y reportan aprobación, sin dataraces ni problemas de memoria.
- Puntaje parcial: propuesto: asignar crédito si algunos modos aprueban y otros fallan.
- Puntaje cero: no aprueba los modos básicos de ejecución.

## Descuentos, topes y reglas especiales - si corresponde

- Condición de aprobación explícita: los materiales indican como requerimientos para aprobar que los modos de ejecución mediante `make` feliciten por aprobar.
- Efecto: condición de elegibilidad para aprobación de la tarea; no se especifica un puntaje numérico original asociado.
- Evidencia necesaria: salidas de los comandos requeridos.
- Ambigüedad: el enunciado menciona `make run-san` para memoria y `make run-thr` para dataraces; el README menciona `make run-san` para dataraces y `make run-mem` para memoria.

## Escala final

- Puntaje máximo original por sección o total: no especificado en los materiales.
- Puntaje máximo total propuesto: 7.0 puntos.
- Ponderación entre secciones: no corresponde.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales:
  - La entrega debe implementar `disco.c`.
  - Las funciones requeridas son `discoInit`, `discoDestroy`, `dama` y `varon`.
  - No se permite busy-waiting.
  - Se debe usar un solo mutex y una sola condición de pthreads.
  - No se permiten múltiples condiciones ni otras herramientas de sincronización como semáforos.
  - Se deben usar distribuidores de números para damas y varones.
  - No se pueden usar colas FIFO para almacenar personas en espera.
  - Las personas del mismo sexo deben ser atendidas por orden de llegada.
  - Los tests provistos verifican casos simples, orden de llegada, robustez, memoria y/o dataraces.

- Puntajes o niveles propuestos:
  - Todos los puntajes de criterios son propuestos, porque no existe una pauta numérica original.
  - El total propuesto es 7.0 puntos para alinearse con la escala final solicitada.

- Ambigüedades no resueltas:
  - El enunciado menciona Debian 12, mientras que el README menciona Debian 11.
  - Hay diferencia entre `make run-thr` y `make run-mem`, y entre el significado asignado a `make run-san`.
  - No se entregó una pauta original con distribución de puntajes.

- Requisitos no completamente verificables solo con el material disponible:
  - La ausencia total de busy-waiting requiere revisión de código además de ejecución.
  - El cumplimiento estricto de “un solo mutex y una sola condición” requiere inspección de `disco.c`.
  - La inexistencia de dataraces o errores de memoria depende de los comandos y herramientas disponibles en el ambiente de evaluación.
