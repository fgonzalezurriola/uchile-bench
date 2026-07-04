# Pauta de evaluación

## Alcance

Se evalúa una solución independiente para CC4302/t03 consistente en implementar en `rwlock.c` un controlador de lectores/escritores con entradas alternadas, usando la interfaz declarada en `rwlock.h`:

- `makeRWLock`
- `destroyRWLock`
- `enterRead`
- `exitRead`
- `enterWrite`
- `exitWrite`

La solución debe cumplir la política de aceptación de lectores y escritores descrita en el enunciado, usar mutex y múltiples variables de condición, no usar semáforos, aplicar el patrón request eficientemente con `pthread_cond_signal`, y usar dos colas FIFO del tipo `Queue` provisto en `pss.h`/`pss.c`.

También se evalúa que la solución compile y pase los comandos de prueba indicados: `make run`, `make run-g`, `make run-san` y `make run-thr`.

## Criterios

### P1 - Interfaz, integración y ciclo de vida del controlador

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0 propuesto
- Requisito evaluado: implementación correcta en `rwlock.c` de las funciones requeridas por `rwlock.h`, creación y destrucción del controlador, e independencia entre múltiples instancias de `RWLock`.
- Evidencia esperada: archivo `rwlock.c`; compilación mediante `make`; comportamiento observable en pruebas con uno o más `RWLock`.
- Puntaje completo: la solución compila sin modificar la interfaz pública, implementa todas las funciones requeridas, inicializa y libera correctamente los recursos del controlador, y permite usar locks distintos de manera independiente.
- Puntaje parcial: propuesto; otorgar proporcionalmente si existen omisiones menores en destrucción de recursos o integración, siempre que la interfaz principal compile y funcione parcialmente.
- Puntaje cero: no compila, falta `rwlock.c`, faltan funciones obligatorias, o la implementación no respeta la interfaz de `rwlock.h`.

### P2 - Exclusión mutua y concurrencia básica de lectores/escritores

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0 propuesto
- Requisito evaluado: permitir múltiples lectores simultáneos, impedir escritores simultáneos, e impedir que un escritor trabaje mientras haya lectores.
- Evidencia esperada: ejecución de `test-rwlock.c`, especialmente casos de un lector, un escritor, lectores en paralelo, escritores secuenciales y verificación interna de exclusión mutua.
- Puntaje completo: los lectores pueden entrar en paralelo cuando corresponde; los escritores son exclusivos; nunca hay lector y escritor trabajando al mismo tiempo.
- Puntaje parcial: propuesto; otorgar proporcionalmente si se cumplen algunos casos básicos pero falla alguna situación concurrente específica.
- Puntaje cero: permite violaciones de exclusión mutua o bloquea sistemáticamente lectores/escritores en casos básicos.

### P3 - Reglas de ingreso inmediato y espera en `enterRead` / `enterWrite`

- Origen del puntaje: propuesto
- Puntaje máximo: 1.3 propuesto
- Requisito evaluado: cumplimiento de las reglas I y II del enunciado:
  - un escritor entra de inmediato si no hay lectores ni escritor trabajando; de lo contrario queda pendiente;
  - un lector entra de inmediato si no hay escritor trabajando ni escritores pendientes; de lo contrario queda pendiente.
- Evidencia esperada: comportamiento observable en pruebas donde lectores llegan antes/después de escritores pendientes.
- Puntaje completo: `enterWrite` y `enterRead` aceptan o bloquean exactamente según las condiciones indicadas, incluyendo el caso en que un lector llega después de un escritor pendiente.
- Puntaje parcial: propuesto; otorgar proporcionalmente si una de las dos reglas está correctamente implementada y la otra presenta fallas acotadas.
- Puntaje cero: no distingue correctamente entre lectores/escritores activos y pendientes, o permite que lectores adelanten indebidamente a escritores pendientes.

### P4 - Reglas de salida, alternancia y orden FIFO

- Origen del puntaje: propuesto
- Puntaje máximo: 1.5 propuesto
- Requisito evaluado: cumplimiento de las reglas III y IV del enunciado:
  - al salir un escritor, si hay lectores pendientes, ingresan todos los lectores pendientes;
  - si no hay lectores pendientes pero sí escritores pendientes, entra el escritor que lleva más tiempo esperando;
  - al salir el último lector, si hay escritores pendientes, entra el escritor que lleva más tiempo esperando;
  - lectores y escritores ingresan alternadamente salvo cuando solo queda una categoría pendiente.
- Evidencia esperada: pruebas de orden de llegada, “entradas alternadas”, escritor que espera al último lector y uso de colas FIFO.
- Puntaje completo: la implementación respeta la alternancia requerida, despierta todos los lectores pendientes cuando corresponde, y respeta FIFO entre escritores pendientes y entre lectores pendientes según las colas.
- Puntaje parcial: propuesto; otorgar proporcionalmente si cumple alternancia en casos simples pero falla en orden FIFO, en despertar todos los lectores pendientes, o en escenarios con múltiples escritores.
- Puntaje cero: no implementa la política alternada o produce hambruna evidente para alguna categoría.

### P5 - Uso obligatorio de mecanismos de sincronización

- Origen del puntaje: propuesto
- Puntaje máximo: 1.2 propuesto
- Requisito evaluado: resolver la tarea usando un mutex y múltiples condiciones; no usar semáforos; usar múltiples condiciones para la espera en `enterRead` y `enterWrite`; evitar `pthread_cond_broadcast` en `exitRead` y `exitWrite`; usar `pthread_cond_signal`; usar dos colas FIFO `Queue`, una para lectores y otra para escritores.
- Evidencia esperada: inspección de `rwlock.c`.
- Puntaje completo: la solución usa mutex, múltiples variables de condición, dos colas FIFO `Queue` de `pss.h`/`pss.c`, señales individuales con `pthread_cond_signal`, y no usa semáforos ni `pthread_cond_broadcast` en las funciones prohibidas.
- Puntaje parcial: propuesto; otorgar proporcionalmente si la sincronización funciona parcialmente pero incumple alguna restricción técnica explícita.
- Puntaje cero: usa semáforos como mecanismo principal, no usa mutex/condiciones, o ignora las colas FIFO requeridas.

### P6 - Pruebas oficiales, sanitizers y ausencia de errores reportados

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0 propuesto
- Requisito evaluado: aprobación de los comandos exigidos en el material.
- Evidencia esperada:
  - `make run` felicita por aprobar;
  - `make run-g` felicita;
  - `make run-san` felicita y no reporta incidentes de manejo de memoria;
  - `make run-thr` felicita y no reporta dataraces.
- Puntaje completo: los cuatro comandos indicados pasan en el ambiente requerido y reportan las felicitaciones/ausencia de incidentes esperadas.
- Puntaje parcial: propuesto; otorgar proporcionalmente por cada comando aprobado, considerando además si los fallos corresponden a errores de memoria o dataraces.
- Puntaje cero: la solución no compila o no pasa ninguno de los comandos exigidos.

## Descuentos, topes y reglas especiales - si corresponde

- Condición de aprobación explícita: el material indica como “requerimientos para aprobar” que `make run`, `make run-g`, `make run-san` y `make run-thr` deben felicitar; además, `make run-san` no debe reportar problemas de memoria y `make run-thr` no debe reportar dataraces.
  - Efecto: si alguno no se cumple, la entrega no satisface los requerimientos explícitos de aprobación. El material no especifica un descuento numérico ni un tope de nota asociado.
  - Evidencia necesaria: salida de los comandos o `resultados.txt` generado por `make zip`.

- Restricción explícita de implementación: no se pueden usar semáforos.
  - Efecto: incumplimiento de un requisito técnico obligatorio. El material no especifica descuento numérico ni nota directa.
  - Evidencia necesaria: inspección de `rwlock.c`.

- Restricción explícita de eficiencia del patrón request: se debe evitar `pthread_cond_broadcast` para despertar threads que esperan en `exitRead` y `exitWrite`; se debe usar `pthread_cond_signal`.
  - Efecto: incumplimiento de un requisito técnico obligatorio. El material no especifica descuento numérico ni nota directa.
  - Evidencia necesaria: inspección de `rwlock.c`.

## Escala final

- Puntaje máximo original por sección o total: no especificado en los materiales.
- Puntaje máximo total propuesto para revisión humana: 7.0 puntos.
- Ponderación entre secciones: no corresponde; el material no separa componentes con ponderaciones propias.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales:
  - La solución debe implementarse en `rwlock.c`.
  - La interfaz evaluable está declarada en `rwlock.h`.
  - Se exige la política de lectores/escritores con entradas alternadas y prevención de hambruna.
  - Se exige usar mutex, múltiples condiciones, `pthread_cond_signal`, dos colas FIFO `Queue`, y no usar semáforos.
  - Se exige aprobar `make run`, `make run-g`, `make run-san` y `make run-thr`.

- Puntajes o niveles propuestos:
  - Todos los puntajes de criterios son propuestos, porque el material no entrega una pauta numérica.
  - La distribución propuesta suma 7.0 puntos para facilitar conversión lineal a nota de benchmark entre 1.0 y 7.0.

- Ambigüedades no resueltas:
  - El enunciado menciona `destroyRWCtl(RWLock *rwl)`, pero `rwlock.h`, `README.md` y `test-rwlock.c` usan `destroyRWLock(RWLock *rwl)`. Para efectos evaluables se asume la interfaz de `rwlock.h`.
  - El material menciona Debian 12 en el enunciado y Debian 11 de 64 bits en el README. No se propone penalización por esta diferencia.

- Requisitos que no pueden verificarse solo con el material:
  - El desempeño exacto depende del ambiente de ejecución y de la carga del sistema, especialmente para pruebas de orden de llegada.
  - La generación de `rwlock.zip` mediante `make zip` sirve como evidencia, pero no se entrega una pauta numérica específica para ese archivo.
