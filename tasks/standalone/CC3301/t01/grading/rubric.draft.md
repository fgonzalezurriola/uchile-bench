# Pauta de evaluación

## Alcance

Se evalúa la implementación de la función:

`uint64_t elimHex(uint64_t x, int h);`

La solución debe estar en `elim.c` y debe eliminar de `x`, interpretado como 16 cifras hexadecimales de 4 bits, todas las apariciones de la cifra hexadecimal `h`, compactando las cifras restantes hacia la derecha. La entrega esperada es `elim.zip`, generado con `make zip`.

La tarea exige que la solución compile y apruebe los modos `make run`, `make run-g` y `make run-san`, que no use los operadores prohibidos `*`, `/` ni `%`, que evite desplazamientos indefinidos y que no sea 80% más lenta que la solución de referencia.

## Criterios

### P1 - Implementación e interfaz de `elimHex`

- Origen del puntaje: propuesto
- Puntaje máximo: 0.5 puntos propuestos
- Requisito evaluado: implementar en `elim.c` la función `elimHex` con el encabezado especificado y compatible con `elim.h`.
- Evidencia esperada: archivo `elim.c`; compilación mediante `make run`, `make run-g` o `make run-san`.
- Puntaje completo: `elim.c` existe, define exactamente una implementación usable de `elimHex(uint64_t x, int h)` y compila con los archivos entregados.
- Puntaje parcial: propuesto: otorgar parte del puntaje si la función existe pero hay problemas menores de integración corregibles sin cambiar la lógica principal.
- Puntaje cero: no existe `elim.c`, no se define `elimHex`, la firma es incompatible o la tarea no compila.

### P2 - Corrección funcional de la eliminación hexadecimal

- Origen del puntaje: propuesto
- Puntaje máximo: 3.0 puntos propuestos
- Requisito evaluado: la función debe eliminar todas las apariciones de la cifra `h` en las 16 cifras hexadecimales de `x`, conservando el orden relativo de las restantes.
- Evidencia esperada: aprobación de las pruebas de `test-elim.c`, incluyendo casos unitarios, casos de una cifra en distintas posiciones y pruebas aleatorias comparadas con `elimHexSlow`.
- Puntaje completo: todos los casos de prueba entregados son aprobados y los resultados coinciden con la referencia para valores de `h` entre `0x0` y `0xf`.
- Puntaje parcial: propuesto: asignar proporcionalmente según cobertura correcta observable, por ejemplo si funciona para casos sin eliminación, eliminación de una aparición, múltiples apariciones, eliminación de ceros y posiciones de borde, pero falla en algunos subconjuntos.
- Puntaje cero: resultados incorrectos en casos básicos, no compacta correctamente las cifras restantes o falla sistemáticamente las pruebas funcionales.

### P3 - Restricción de operadores prohibidos

- Origen del puntaje: enunciado
- Puntaje máximo: 1.0 punto propuesto
- Requisito evaluado: la solución no puede usar operadores de multiplicación, división o módulo: `*`, `/`, `%`.
- Evidencia esperada: inspección de `elim.c`.
- Puntaje completo: no se usan `*`, `/` ni `%` en la implementación de la función solicitada.
- Puntaje parcial: propuesto: no corresponde salvo decisión humana; la restricción está formulada como prohibición.
- Puntaje cero: la implementación usa cualquiera de los operadores prohibidos `*`, `/` o `%`.

### P4 - Ejecución con `make run-g` y `make run-san`

- Origen del puntaje: propuesto
- Puntaje máximo: 0.75 puntos propuestos
- Requisito evaluado: `make run-g` debe felicitar al estudiante; `make run-san` debe felicitarlo y no reportar problemas, incluyendo desplazamientos indefinidos.
- Evidencia esperada: salida de `make run-g`, `make run-san` y/o `resultados.txt` generado por `make zip`.
- Puntaje completo: ambos comandos terminan exitosamente, muestran el mensaje de felicitación y `make run-san` no reporta errores de sanitizer.
- Puntaje parcial: propuesto: otorgar parte si solo uno de los dos modos aprueba.
- Puntaje cero: ambos modos fallan, no ejecutan o `make run-san` reporta comportamiento indefinido.

### P5 - Eficiencia en `make run`

- Origen del puntaje: enunciado
- Puntaje máximo: 1.0 punto propuesto
- Requisito evaluado: `make run` debe felicitar por aprobar este modo de ejecución y la solución no debe ser 80% más lenta que la solución de referencia.
- Evidencia esperada: salida de `make run` y/o `resultados.txt`, incluyendo benchmark contra la referencia.
- Puntaje completo: `make run` aprueba, la salida felicita al estudiante y el sobrecosto reportado no supera la tolerancia de 80%.
- Puntaje parcial: propuesto: no corresponde si el benchmark oficial rechaza la ejecución por superar la tolerancia; cualquier asignación parcial queda a revisión humana.
- Puntaje cero: `make run` falla, el checksum es incorrecto o la solución supera el sobrecosto tolerado de 80% tras los intentos considerados por el programa de prueba.

### P6 - Producto esperado

- Origen del puntaje: propuesto
- Puntaje máximo: 0.75 puntos propuestos
- Requisito evaluado: generar `elim.zip` mediante `make zip`, incluyendo `elim.c` y `resultados.txt` con la salida de `make run`, `make run-g` y `make run-san`.
- Evidencia esperada: archivo `elim.zip` y su contenido.
- Puntaje completo: `elim.zip` existe, fue generado por `make zip` y contiene los archivos esperados.
- Puntaje parcial: propuesto: otorgar parte si la solución está disponible pero el empaquetado o `resultados.txt` está incompleto.
- Puntaje cero: no se entrega el producto esperado o no contiene la implementación evaluable.

## Descuentos, topes y reglas especiales - si corresponde

- Descuento por estilo de indentación: el enunciado indica literalmente que “se descontará medio punto por no usar el estilo de indentación de Kernighan”.  
  - Efecto: descuento de 0.5 puntos sobre el puntaje obtenido.
  - Evidencia necesaria: inspección de formato e indentación en `elim.c`.

- Requisito de aprobación de modos de ejecución: el material indica como requerimientos para aprobar que `make run`, `make run-g` y `make run-san` feliciten al estudiante, y que `make run-san` no reporte problemas.  
  - Efecto: condición de elegibilidad para aprobar la tarea, según revisión humana.
  - Evidencia necesaria: salida de los comandos o `resultados.txt`.

- Restricción de eficiencia: la prueba `make run` será rechazada si la función es 80% más lenta que la solución de referencia.  
  - Efecto: rechazo del modo `make run` si supera la tolerancia.
  - Evidencia necesaria: benchmark mostrado por `make run`.

## Escala final

- Puntaje máximo total: 7.0 puntos propuestos
- Ponderación entre secciones: no corresponde
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales:
  - La función requerida es `uint64_t elimHex(uint64_t x, int h)`.
  - La implementación debe estar en `elim.c`.
  - No se pueden usar los operadores `*`, `/` ni `%`.
  - `make run`, `make run-g` y `make run-san` deben aprobar.
  - `make run-san` no debe reportar problemas como desplazamientos indefinidos.
  - La solución no debe ser 80% más lenta que la referencia.
  - Existe un descuento explícito de medio punto por no usar indentación estilo Kernighan.
  - El producto esperado es `elim.zip` generado por `make zip`.

- Puntajes o niveles propuestos:
  - La distribución de 7.0 puntos entre criterios P1 a P6 es propuesta, porque el material no entrega una pauta de puntajes detallada.
  - Los niveles de puntaje parcial también son propuestos.

- Ambigüedades no resueltas:
  - El material no especifica cómo combinar los requerimientos de aprobación con la nota final.
  - No se define una escala original de puntaje total distinta del descuento explícito de medio punto.
  - No se entrega una regla exacta para puntuar soluciones parcialmente correctas.

- Requisitos que no pueden verificarse solo con el material:
  - Si `elim.zip` fue efectivamente generado por `make zip` y no armado manualmente.
  - Condiciones externas de benchmark, como modo alto rendimiento del computador o carga de CPU durante la ejecución.
