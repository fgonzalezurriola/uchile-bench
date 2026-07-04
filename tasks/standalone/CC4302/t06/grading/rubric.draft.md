# Pauta de evaluación

## Alcance

Se evalúa la implementación de la Tarea 6 de CC4302 en `postulacion.c`, específicamente las funciones:

- `iniciarPostulaciones`
- `destruirPostulaciones`
- `postularTrabajo`
- `cerrarPostulacion`

La solución debe mantener la funcionalidad descrita para el sistema concurrente de postulaciones a trabajos, evitar *data races* y *deadlocks*, usar spin-locks como mecanismo de sincronización, y pasar los comandos de prueba obligatorios indicados en el material. No se evalúa hambruna, pues el enunciado indica explícitamente que no es necesario preocuparse de ella.

## Criterios

### P1 - Integración de la entrega y compilación

- Origen del puntaje: propuesto
- Puntaje máximo: 0.6 puntos propuestos
- Requisito evaluado: la solución queda implementada en `postulacion.c`, respeta las firmas públicas de `postulacion.h`, usa el valor original de `N` definido en `postulacion.h` y compila con el sistema de `make` provisto.
- Evidencia esperada: compilación exitosa mediante los comandos de prueba del material.
- Puntaje completo: compila sin errores, no modifica interfaces públicas incompatiblemente y mantiene `N` como en el archivo original.
- Puntaje parcial: propuesto; errores menores que no impiden compilar ni ejecutar las pruebas obligatorias.
- Puntaje cero: no compila, cambia la API requerida o impide ejecutar las pruebas.

### P2 - Inicialización y destrucción de postulaciones

- Origen del puntaje: propuesto
- Puntaje máximo: 0.8 puntos propuestos
- Requisito evaluado: `iniciarPostulaciones` inicializa correctamente las estructuras globales para una nueva ronda y `destruirPostulaciones` libera los recursos necesarios.
- Evidencia esperada: uso correcto de `priQueue`, `postulacionTrabajos`, spin-locks u otras variables globales auxiliares; ejecución repetida de las pruebas sin fallas de memoria.
- Puntaje completo: inicializa todos los trabajos como disponibles, crea las estructuras necesarias, permite volver a iniciar el proceso y libera correctamente los recursos.
- Puntaje parcial: propuesto; inicialización o liberación incompleta pero sin fallas graves en todos los escenarios.
- Puntaje cero: no inicializa estructuras esenciales, deja datos inconsistentes entre rondas o provoca fallas al destruir.

### P3 - Funcionalidad de `postularTrabajo`

- Origen del puntaje: propuesto
- Puntaje máximo: 1.1 puntos propuestos
- Requisito evaluado: cada estudiante postula solo a trabajos preferidos y abiertos, queda esperando hasta obtener un trabajo, y recibe a lo más un trabajo.
- Evidencia esperada: comportamiento observado en `make run`, `make run-g` y pruebas donde los estudiantes postulan antes o después del cierre de trabajos.
- Puntaje completo: registra correctamente postulaciones según `preferencias` y `rank`, no postula a trabajos cerrados, deja `trabajo_id` inicialmente en `-1` y retorna solo cuando el estudiante fue asignado.
- Puntaje parcial: propuesto; cumple algunos casos simples, pero falla en intercalaciones concurrentes o en preferencias parciales.
- Puntaje cero: retorna antes de la asignación, ignora preferencias/rankings o permite que un estudiante obtenga más de un trabajo.

### P4 - Funcionalidad de `cerrarPostulacion`

- Origen del puntaje: propuesto
- Puntaje máximo: 1.2 puntos propuestos
- Requisito evaluado: `cerrarPostulacion(i)` cierra el trabajo `i`, espera hasta que exista un postulante válido, asigna el trabajo a un estudiante disponible y retorna su id.
- Evidencia esperada: pruebas donde los trabajos se cierran antes o después de recibir postulaciones, y pruebas de prioridad/ranking.
- Puntaje completo: no retorna antes de asignar, respeta el orden por ranking de la cola de prioridad, actualiza `postulacionTrabajos[i]` y `est->trabajo_id`, y evita asignar estudiantes ya contratados.
- Puntaje parcial: propuesto; asigna correctamente en casos simples pero falla con rankings, cierres simultáneos o eliminación de postulaciones obsoletas.
- Puntaje cero: cierra trabajos sin postulantes, retorna ids incorrectos o deja trabajos asignados inconsistentemente.

### P5 - Sincronización concurrente y primitivas permitidas

- Origen del puntaje: propuesto
- Puntaje máximo: 1.5 puntos propuestos
- Requisito evaluado: la implementación evita *data races* y *deadlocks* usando spin-locks, sin usar mutex/condiciones, semáforos ni mensajes como herramientas de sincronización.
- Evidencia esperada: revisión de código y ejecución con spin-locks reales con *busy-waiting* y con spin-locks funcionalmente equivalentes basados en mutex/condiciones.
- Puntaje completo: protege correctamente estructuras compartidas, no produce *deadlocks*, funciona con múltiples estudiantes y trabajos concurrentes, y usa solamente spin-locks para sincronización.
- Puntaje parcial: propuesto; sincronización incompleta que pasa algunos escenarios pero tiene carreras potenciales, bloqueos posibles o uso dudoso de primitivas.
- Puntaje cero: presenta *data races* evidentes, *deadlocks*, espera circular permanente o usa primitivas prohibidas como mecanismo de sincronización.

### P6 - Pruebas obligatorias y manejo de memoria

- Origen del puntaje: propuesto
- Puntaje máximo: 0.8 puntos propuestos
- Requisito evaluado: cumplimiento de los comandos obligatorios indicados para aprobar la tarea.
- Evidencia esperada:
  - `make run-san` felicita y no reporta incidentes de memoria.
  - `make run` felicita por aprobar el modo de ejecución.
  - `make run-g` felicita.
- Puntaje completo: los tres comandos obligatorios terminan exitosamente y sin incidentes de memoria.
- Puntaje parcial: propuesto; algunos comandos pasan, pero otros fallan por errores funcionales, concurrencia o memoria.
- Puntaje cero: no pasa ninguno de los comandos obligatorios o presenta errores graves de memoria.

## Descuentos, topes y reglas especiales - si corresponde

- Uso obligatorio de spin-locks: el enunciado indica que no se pueden usar mutex/condiciones, semáforos ni mensajes como herramientas de sincronización. No se especifica descuento numérico ni tope de nota; debe considerarse como incumplimiento de requisito explícito.
- Requisitos para aprobar: el README indica que `make run-san`, `make run` y `make run-g` deben felicitar al estudiante; `make run-san` además no debe reportar incidentes de memoria. No se especifica conversión numérica directa.
- `make run-thr` es opcional y no obligatorio en esta tarea; no debe exigirse como requisito de aprobación.
- No corresponde evaluar hambruna, porque el enunciado indica explícitamente que no es necesario preocuparse de ella.

## Escala final

- Puntaje máximo original por sección o total: no especificado en los materiales.
- Puntaje máximo total propuesto para esta pauta: 6.0 puntos.
- Ponderación entre secciones: no corresponde.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales: funciones a implementar, uso obligatorio de spin-locks, prohibición de otras primitivas de sincronización, necesidad de evitar *data races* y *deadlocks*, comandos obligatorios de prueba y carácter opcional de `make run-thr`.
- Puntajes propuestos: todos los puntajes de los criterios P1 a P6, porque el material no entrega una distribución numérica original.
- Ambigüedades no resueltas: no se especifica un tope o nota directa para soluciones que no pasen alguno de los comandos obligatorios o que usen primitivas prohibidas.
- Requisitos no verificables solo con el material: ausencia total de *data races* en intercalaciones no cubiertas por las pruebas públicas; puede requerir pruebas adicionales o revisión manual.
