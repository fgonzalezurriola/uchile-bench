# Pauta de evaluación

## Alcance

Se evalúa la implementación de la Tarea 5 de CC4302 en `subasta.c`: definición del tipo `struct subasta` y de las funciones `nNuevaSubasta`, `nOfrecer`, `nAdjudicar` y `nDestruirSubasta`.

La solución debe implementar una subasta multi-threaded con `n` unidades, oferentes concurrentes, adjudicación de las mejores ofertas, soporte de timeout en `nOfrecer`, posibilidad de realizar nuevas ofertas tras fallar, y uso de primitivas nativas internas de nThreads. La solución debe pasar los comandos de prueba indicados: `make run`, `make run-g` y `make run-san`.

## Criterios

### P1 - API, integración y ciclo de vida de la subasta

- Origen del puntaje: propuesto
- Puntaje máximo: 0.8
- Requisito evaluado: implementar en `subasta.c` las funciones y la estructura solicitadas, respetando las firmas de `subasta.h`, inicializando una subasta con `n` unidades y liberando sus recursos.
- Evidencia esperada: `subasta.c`, compilación exitosa, ejecución de pruebas con múltiples subastas y `make run-san`.
- Puntaje completo: compila sin modificar la interfaz pública; `nNuevaSubasta` inicializa correctamente el estado de cada subasta; `nDestruirSubasta` libera los recursos usados; múltiples subastas independientes pueden coexistir.
- Puntaje parcial: propuesto: hasta 0.5 si la interfaz compila y la inicialización funciona, pero hay problemas menores de liberación o aislamiento entre subastas; hasta 0.3 si las funciones existen pero el estado de la subasta es incompleto.
- Puntaje cero: no compila, cambia las firmas requeridas, omite funciones obligatorias o no mantiene estado útil de la subasta.

### P2 - Semántica de adjudicación sin timeout

- Origen del puntaje: propuesto
- Puntaje máximo: 1.4
- Requisito evaluado: comportamiento compatible con T4 cuando `timeout = -1`, considerando espera infinita.
- Evidencia esperada: pruebas `test1`, `test2`, `test3` y suite de compatibilidad sin timeouts mediante `make run`.
- Puntaje completo: mantiene como ganadoras las mejores `n` ofertas activas; los oferentes superados por `n` ofertas mayores retornan `FALSE`; al cerrar con `nAdjudicar`, los ganadores retornan `TRUE`; el monto recaudado corresponde a la suma de ofertas ganadoras; `punid` recibe las unidades no vendidas cuando hay menos oferentes que unidades.
- Puntaje parcial: propuesto: hasta 1.0 si adjudica correctamente casos simples pero falla en casos con menos oferentes que unidades o con varios oferentes desplazados; hasta 0.6 si calcula parcialmente ganadores o recaudación; hasta 0.3 si solo maneja un oferente o una unidad.
- Puntaje cero: no implementa una política coherente de ganadores/perdedores o `nAdjudicar` no cierra/desbloquea correctamente la subasta.

### P3 - Espera, desplazamiento y reofertas de oferentes

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0
- Requisito evaluado: `nOfrecer` debe bloquear al oferente hasta cierre, desplazamiento por ofertas mayores o timeout; un nthread puede realizar una nueva oferta tras recibir `FALSE`.
- Evidencia esperada: ejemplo descrito en el enunciado, pruebas donde un oferente desplazado retorna antes del cierre y puede volver a ofrecer.
- Puntaje completo: los oferentes quedan suspendidos mientras siguen siendo candidatos; al ingresar una oferta suficientemente alta se libera al peor oferente desplazado con `FALSE`; las reofertas posteriores participan normalmente; no quedan oferentes bloqueados indebidamente.
- Puntaje parcial: propuesto: hasta 0.7 si maneja desplazamientos pero no todos los órdenes concurrentes; hasta 0.4 si solo decide ganadores al cierre y no libera oportunamente a desplazados; hasta 0.2 si permite reofertas solo en casos limitados.
- Puntaje cero: `nOfrecer` no espera correctamente, no retorna a perdedores desplazados o produce deadlock en escenarios de reoferta.

### P4 - Soporte de timeouts de T5

- Origen del puntaje: propuesto
- Puntaje máximo: 1.3
- Requisito evaluado: implementar `timeout` en `nOfrecer`, incluyendo timeout finito, timeout infinito con `-1` y eliminación correcta de ofertas vencidas.
- Evidencia esperada: `test_timeouts1`, suites con timeout largo y suite con `-1`, observación de retornos `FALSE` por timeout.
- Puntaje completo: si vence el timeout, el nthread retorna `FALSE`; una oferta vencida deja de participar en la adjudicación; si la subasta se cierra o la oferta es desplazada antes del timeout, se cancela correctamente la espera temporizada; `timeout = -1` mantiene espera infinita; el oferente puede realizar una nueva oferta después de fallar.
- Puntaje parcial: propuesto: hasta 0.9 si los timeouts funcionan en casos simples pero quedan ofertas vencidas o temporizadores sin cancelar en casos concurrentes; hasta 0.6 si distingue `-1` de timeout finito pero falla en adjudicación posterior; hasta 0.3 si retorna por timeout sin integrar correctamente con la subasta.
- Puntaje cero: ignora el parámetro `timeout`, trata `-1` incorrectamente o deja threads bloqueados al vencer el timeout.

### P5 - Uso de primitivas nativas de nThreads y restricciones de sincronización

- Origen del puntaje: propuesto
- Puntaje máximo: 1.2
- Requisito evaluado: programar usando primitivas nativas internas de nThreads, como `START_CRITICAL`, `setReady`, `suspend`, `schedule`, etc., sin usar herramientas de sincronización preexistentes.
- Evidencia esperada: inspección de `subasta.c`; ausencia de semáforos, mutex, condiciones o mensajes; ejecución bajo `make run-g`.
- Puntaje completo: toda la sincronización se implementa con secciones críticas y operaciones del scheduler de nThreads; los estados de espera son consistentes; no se usan semáforos, mutex, condiciones ni mensajes; no se reemplaza la suspensión por espera activa.
- Puntaje parcial: propuesto: hasta 0.8 si usa primitivas nativas pero con manejo incompleto de estados o temporizadores; hasta 0.5 si mezcla parcialmente mecanismos permitidos con diseño frágil; hasta 0.3 si la lógica depende de comportamiento accidental del scheduler.
- Puntaje cero: usa semáforos, mutex, condiciones, mensajes u otra sincronización prohibida, o no usa las primitivas nativas requeridas para bloquear/desbloquear nthreads.

### P6 - Pruebas oficiales, concurrencia y sanidad de memoria

- Origen del puntaje: propuesto
- Puntaje máximo: 1.3
- Requisito evaluado: cumplir los requisitos de prueba indicados en el README.
- Evidencia esperada: salidas de `make run`, `make run-g` y `make run-san`, incluyendo felicitación y ausencia de incidentes de memoria en modo sanitizado.
- Puntaje completo: `make run` felicita por aprobar; `make run-g` felicita; `make run-san` felicita y no reporta incidentes de memoria; las pruebas de robustez con muchas subastas paralelas terminan sin deadlocks, abortos ni threads pendientes.
- Puntaje parcial: propuesto: hasta 0.9 si `make run` pasa pero hay fallas en `make run-g` o `make run-san`; hasta 0.6 si pasan casos funcionales básicos pero fallan pruebas de robustez; hasta 0.3 si solo compila y pasa una fracción menor de las pruebas.
- Puntaje cero: no compila, aborta en las pruebas principales, presenta deadlocks sistemáticos o reporta errores graves de memoria.

## Descuentos, topes y reglas especiales - si corresponde

- Requisito de aprobación indicado en el README: `make run-san` debe felicitar y no reportar incidentes de memoria; `make run` debe felicitar; `make run-g` debe felicitar. Efecto: condición explícita para aprobar la tarea; se evalúa principalmente en P6. No se entrega un descuento numérico original.
- Restricción explícita del enunciado: no se pueden usar semáforos, mutex, condiciones ni mensajes preexistentes a nThreads. Efecto: la solución incumple un requisito central y obtiene cero en P5; no se especifica un tope numérico adicional.
- La solución debe quedar en `subasta.c`. Efecto: forma parte del alcance y de P1; no se especifica descuento administrativo adicional.

## Escala final

- Puntaje máximo original por sección o total: no especificado en los materiales.
- Puntaje máximo total propuesto: 7.0
- Ponderación entre secciones: no corresponde.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales: funciones requeridas, archivo `subasta.c`, comportamiento de `nNuevaSubasta`, `nOfrecer`, `nAdjudicar`, `nDestruirSubasta`, prohibición de primitivas de sincronización preexistentes, soporte de timeout en T5 y comandos de prueba exigidos.
- Puntajes propuestos: todos los puntajes de criterios y niveles parciales son propuestos, porque los materiales no entregan una pauta numérica original.
- Ambigüedad no resuelta: el enunciado no especifica criterio de desempate para ofertas iguales; no debe penalizarse salvo que las pruebas oficiales lo definan.
- Ambigüedad no resuelta: el material no define explícitamente el comportamiento de llamadas a `nOfrecer` después de cerrar la subasta ni múltiples llamadas a `nAdjudicar`.
- Ambigüedad no resuelta: la unidad exacta de `timeout` se infiere de las pruebas como milisegundos, pero el enunciado público solo lo describe como tiempo de espera.
- Requisito no verificable solo con inspección: la corrección completa bajo todos los entrelazamientos concurrentes requiere ejecutar las pruebas oficiales y revisar posibles pruebas ocultas.
