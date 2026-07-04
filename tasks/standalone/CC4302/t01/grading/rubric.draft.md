# Pauta de evaluación

## Alcance

Se evalúa una solución independiente de la Tarea 1 de CC4302. La entrega debe implementar en `sat.c` la función:

- `int recuento(int n, BoolFun f, int p);`

La función debe contar cuántas de las `2^n` combinaciones booleanas hacen verdadera a `f`, paralelizando el recorrido para usar `2^p` threads según el parámetro `p`. La solución debe funcionar con los archivos entregados (`sat.h`, `test-sat.c`, `Makefile`) bajo Debian 12 y aprobar los comandos indicados: `make run`, `make run-g`, `make run-san`, `make run-thr` y `make zip`.

## Criterios

### P1 - Interfaz, ubicación y compilación

- Origen del puntaje: propuesto; requisito extraído del enunciado, README y `sat.h`
- Puntaje máximo: 0.8 puntos propuestos
- Requisito evaluado: la solución está en `sat.c`, implementa `recuento` con la firma requerida y compila con los archivos entregados.
- Evidencia esperada: archivo `sat.c`; compilación mediante los targets del `Makefile`.
- Puntaje completo: `sat.c` existe, define correctamente `recuento(int n, BoolFun f, int p)` compatible con `sat.h`, y los comandos de compilación requeridos se ejecutan sin errores.
- Puntaje parcial: propuesto; otorgar parte del puntaje si la firma o ubicación son correctas pero hay fallas de compilación en algunos modos.
- Puntaje cero: no existe `sat.c`, no se implementa `recuento`, la firma es incompatible o la solución no compila.

### P2 - Correctitud del recuento booleano

- Origen del puntaje: propuesto; requisito extraído del enunciado y `test-sat.c`
- Puntaje máximo: 1.6 puntos propuestos
- Requisito evaluado: `recuento` retorna el número correcto de asignaciones para las cuales `f(x)` es verdadera.
- Evidencia esperada: comportamiento observable en `make run`, especialmente las comparaciones contra la versión secuencial para `f4` y `f_big`.
- Puntaje completo: el recuento coincide con la versión secuencial para todos los casos probados, incluyendo distintos valores de `p`.
- Puntaje parcial: propuesto; otorgar parte del puntaje si el recuento es correcto solo para casos pequeños, solo para ejecución secuencial, o falla en algunos valores de `p`.
- Puntaje cero: retorna conteos incorrectos de forma sistemática o no evalúa todas las combinaciones requeridas.

### P3 - Uso correcto de `2^p` threads

- Origen del puntaje: propuesto; requisito extraído del enunciado y verificado en `test-sat.c`
- Puntaje máximo: 1.3 puntos propuestos
- Requisito evaluado: la paralelización debe usar `2^p` threads, generando trabajo paralelo mientras `i < p` y resolviendo secuencialmente cuando `i >= p`.
- Evidencia esperada: `make run`; verificación de `test-sat.c` con `tcnt` y `tlim = 1 << p` para `p = 0..4`.
- Puntaje completo: se usan exactamente los threads especificados para cada valor de `p`, sin usar más ni menos, y la estructura recursiva respeta el corte secuencial indicado.
- Puntaje parcial: propuesto; otorgar parte del puntaje si hay paralelización pero el número de threads no coincide siempre con `2^p`.
- Puntaje cero: la solución es completamente secuencial para `p > 0`, ignora `p`, o crea una cantidad incorrecta de threads que hace fallar el test.

### P4 - Ausencia de dataraces y manejo correcto de memoria

- Origen del puntaje: propuesto; requisito extraído del enunciado, README y targets `run-san`/`run-thr`
- Puntaje máximo: 1.3 puntos propuestos
- Requisito evaluado: la solución no debe tener dataraces ni errores de memoria; el contador no debe ser una variable global compartida y cada thread debe trabajar con una copia independiente del arreglo `x`.
- Evidencia esperada: `make run-san` felicita y no reporta incidentes de memoria; `make run-thr` felicita y no reporta dataraces; inspección de `sat.c`.
- Puntaje completo: no hay dataraces, no hay errores de memoria, no se comparte estado mutable problemático entre threads, y no se usan mutex ni condiciones en la solución.
- Puntaje parcial: propuesto; otorgar parte del puntaje si solo una de las dos propiedades principales se cumple, por ejemplo memoria correcta pero dataraces, o ausencia de dataraces pero errores de memoria.
- Puntaje cero: `make run-san` o `make run-thr` fallan gravemente, existen dataraces sobre el contador o sobre `x`, o la solución depende de sincronización prohibida con mutex/condiciones.

### P5 - Speed up mínimo requerido

- Origen del puntaje: propuesto; requisito extraído del enunciado, README y `test-sat.c`
- Puntaje máximo: 1.2 puntos propuestos
- Requisito evaluado: `make run` debe reportar un speed up de al menos `1.5`.
- Evidencia esperada: salida de `make run`; en `test-sat.c`, `TOLERANCIA` es `1.5` cuando se compila con optimización.
- Puntaje completo: `make run` felicita la solución y el factor de mejora reportado es al menos `1.5`.
- Puntaje parcial: propuesto; otorgar parte del puntaje si hay mejora medible pero menor que `1.5`, siempre que el recuento sea correcto.
- Puntaje cero: no hay mejora, la ejecución paralela es más lenta sin justificación aceptada por el test, o `make run` falla por speed up insuficiente.

### P6 - Modos de prueba y generación de evidencia

- Origen del puntaje: propuesto; requisito extraído del enunciado y README
- Puntaje máximo: 0.8 puntos propuestos
- Requisito evaluado: la solución debe aprobar `make run-g` y permitir generar el archivo de entrega mediante `make zip`.
- Evidencia esperada: salida de `make run-g`; archivo `sat.zip` generado por `make zip`, conteniendo `sat.c` y `resultados.txt` con la salida de `make run`, `make run-g`, `make run-thr` y `make run-san`.
- Puntaje completo: `make run-g` felicita la solución y `make zip` genera correctamente `sat.zip` con los archivos indicados.
- Puntaje parcial: propuesto; otorgar parte del puntaje si `make run-g` pasa pero la generación de evidencia está incompleta, o si el zip se genera pero falta parte de `resultados.txt`.
- Puntaje cero: `make run-g` falla y no se puede generar la evidencia requerida.

## Descuentos, topes y reglas especiales - si corresponde

- Descuento por indentación: el enunciado indica literalmente que “se descontarán 5 décimas si su solución no usa la indentación de Kernighan”.
  - Condición: `sat.c` no sigue la indentación de Kernighan.
  - Efecto: descuento de 5 décimas sobre la nota final.
  - Evidencia necesaria: inspección del código fuente `sat.c`.

## Escala final

- Puntaje máximo original por sección o total: no especificado en los materiales.
- Puntaje máximo total propuesto para esta pauta: 7.0 puntos.
- Ponderación entre secciones: no corresponde; la pauta original no separa componentes con ponderaciones propias.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales:
  - La función a implementar es `recuento` en `sat.c`, con firma declarada en `sat.h`.
  - La solución debe usar `2^p` threads.
  - `make run` debe felicitar y reportar speed up de al menos `1.5`.
  - `make run-san` no debe reportar errores de memoria.
  - `make run-thr` no debe reportar dataraces.
  - `make run-g` debe felicitar.
  - `make zip` debe generar `sat.zip` con `sat.c` y `resultados.txt`.
  - Existe un descuento explícito de 5 décimas por no usar indentación de Kernighan.

- Puntajes o niveles propuestos:
  - Todos los puntajes por criterio son propuestos, porque los materiales no entregan una distribución numérica de puntajes.
  - Los niveles de puntaje parcial también son propuestos para revisión humana.

- Ambigüedades no resueltas:
  - El README menciona “programar ahí la función buscar”, pero `sat.h`, el enunciado y `test-sat.c` exigen `recuento`.
  - El enunciado muestra “2p threads”; `test-sat.c` usa `1 << p`, por lo que se interpreta como `2^p`.
  - “Indentación de Kernighan” no viene definida formalmente en los materiales.

- Requisitos que pueden depender del ambiente:
  - El speed up puede verse afectado por hardware, carga del sistema, número de cores y configuración de rendimiento, tal como advierten el enunciado y el README.
