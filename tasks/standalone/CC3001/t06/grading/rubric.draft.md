# Pauta de evaluación

## Alcance

Se evalúa la Tarea 6 de CC3001: implementar y comparar Quicksort original con pivote en el primer elemento y la variante Quicksort con mediana de tres. La entrega debe incluir la implementación de `quicksort3`, `qsort3` y `particionMedianaDe3`, el manejo de casos de borde de tamaño 0, 1 y 2, y un experimento que mida tiempos promedio y número promedio de comparaciones en partición para ambas versiones sobre arreglos aleatorios, con tabla y gráfico de resultados.

## Criterios

### P1 - Partición con mediana de tres

- Origen del puntaje: propuesto
- Puntaje máximo: 1.5 puntos propuestos
- Requisito evaluado: implementar `particionMedianaDe3(a, i, j)` escogiendo el pivote como la mediana entre el primer, el del medio y el último elemento del segmento.
- Evidencia esperada: código de `particionMedianaDe3` y ejecución observable de `quicksort3` sobre arreglos aleatorios.
- Puntaje completo: reordena los tres elementos dejando el mínimo en `a[i]`, la mediana en `a[i+1]` y el máximo en `a[j]`; particiona el segmento `a[i+2], ..., a[j-1]` usando `a[i+1]` como pivote; mueve el pivote al centro; retorna correctamente su posición.
- Puntaje parcial: hasta 1.0 punto propuesto si elige correctamente la mediana pero la partición o posición final del pivote tiene errores menores; hasta 0.6 puntos propuestos si particiona pero no respeta completamente la disposición exigida de mínimo, mediana y máximo; hasta 0.3 puntos propuestos si solo hay un intento reconocible de selección de pivote.
- Puntaje cero: no implementa la función o no realiza una partición basada en mediana de tres.

### P2 - Quicksort con mediana de tres y casos de borde

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0 punto propuesto
- Requisito evaluado: implementar `quicksort3` y `qsort3` aplicando recursión solo a segmentos de tamaño mayor o igual a 3 y tratando los casos de tamaño 0, 1 y 2.
- Evidencia esperada: código de `quicksort3`/`qsort3`; salida de verificación como `chequea_orden`; comportamiento correcto en arreglos vacíos, unitarios, de dos elementos y aleatorios.
- Puntaje completo: la variante ordena correctamente arreglos de distintos tamaños, maneja explícitamente los casos 0, 1 y 2, y aplica la recursión de acuerdo con el enunciado.
- Puntaje parcial: hasta 0.7 puntos propuestos si ordena arreglos grandes pero falla en algún caso de borde; hasta 0.4 puntos propuestos si la recursión está planteada pero la ordenación es incompleta o inestable en casos frecuentes.
- Puntaje cero: `quicksort3`/`qsort3` no están implementadas o no ordenan correctamente.

### P3 - Comparación con Quicksort original

- Origen del puntaje: propuesto
- Puntaje máximo: 0.6 puntos propuestos
- Requisito evaluado: conservar o usar una versión de Quicksort original cuyo pivote sea el primer elemento del subarreglo, para compararla con la variante de mediana de tres.
- Evidencia esperada: código de `quicksort`, `qsort` y `particion`, eventualmente instrumentado para contar comparaciones, y resultados experimentales para ambas versiones.
- Puntaje completo: la versión original mantiene el esquema de partición con pivote en `a[i]` y se usa efectivamente como base de comparación.
- Puntaje parcial: hasta 0.4 puntos propuestos si la versión original está presente pero la comparación experimental es incompleta; hasta 0.2 puntos propuestos si hay una implementación modificada que dificulta compararla con lo pedido.
- Puntaje cero: no se incluye ni se usa una versión de Quicksort original comparable.

### P4 - Conteo de comparaciones

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0 punto propuesto
- Requisito evaluado: contar el número promedio de comparaciones realizadas dentro de la función de partición para ambas versiones.
- Evidencia esperada: variables, contadores o mecanismo equivalente en el código; tabla con comparaciones promedio por método y por valor de `n`.
- Puntaje completo: cuenta solo las comparaciones realizadas dentro del `for` de partición, para ambas versiones, reinicia correctamente los contadores en cada corrida y reporta promedios.
- Puntaje parcial: hasta 0.7 puntos propuestos si cuenta comparaciones para ambas versiones pero incluye o excluye algunas operaciones de forma inconsistente; hasta 0.4 puntos propuestos si solo cuenta para una versión; hasta 0.2 puntos propuestos si hay contadores pero no se usan para resultados promedio.
- Puntaje cero: no cuenta comparaciones.

### P5 - Diseño experimental y medición de tiempos

- Origen del puntaje: propuesto
- Puntaje máximo: 1.2 puntos propuestos
- Requisito evaluado: medir el tiempo promedio que ambas versiones demoran en ordenar arreglos aleatorios.
- Evidencia esperada: código experimental con `np.random.random(n)`, copias del arreglo original, medición de tiempo con `time.clock_gettime_ns(0)` o mecanismo equivalente, y resultados promedio.
- Puntaje completo: para cada `n`, ejecuta 15 repeticiones, genera arreglos aleatorios, entrega a ambos algoritmos copias del mismo arreglo desordenado, mide tiempos para cada versión y calcula promedios.
- Puntaje parcial: hasta 0.9 puntos propuestos si mide tiempos y promedia, pero con menos repeticiones o con una lista incompleta de tamaños; hasta 0.6 puntos propuestos si no garantiza que ambos métodos ordenen copias del mismo arreglo; hasta 0.3 puntos propuestos si solo realiza mediciones aisladas sin promedio.
- Puntaje cero: no realiza medición de tiempos.

### P6 - Tabla de resultados

- Origen del puntaje: propuesto
- Puntaje máximo: 0.7 puntos propuestos
- Requisito evaluado: completar una tabla comparativa con tiempos promedio y comparaciones promedio para ambas versiones.
- Evidencia esperada: tabla en el documento, salida generada por el programa o archivo de resultados.
- Puntaje completo: presenta, para cada tamaño `n` considerado, tiempos promedio y comparaciones promedio de Quicksort original y Quicksort con mediana de tres.
- Puntaje parcial: hasta 0.5 puntos propuestos si la tabla contiene ambas versiones pero omite alguna métrica o algunos tamaños; hasta 0.3 puntos propuestos si los resultados están impresos pero no organizados como tabla.
- Puntaje cero: no presenta tabla ni resultados equivalentes.

### P7 - Gráfico de resultados

- Origen del puntaje: propuesto
- Puntaje máximo: 0.6 puntos propuestos
- Requisito evaluado: graficar los resultados experimentales de la comparación.
- Evidencia esperada: gráfico incluido al final del documento o archivo de imagen generado.
- Puntaje completo: incluye un gráfico claro de los resultados que permite comparar ambas versiones en tiempo y/o comparaciones.
- Puntaje parcial: hasta 0.4 puntos propuestos si el gráfico compara solo una métrica; hasta 0.2 puntos propuestos si el gráfico es difícil de interpretar pero corresponde a los datos del experimento.
- Puntaje cero: no incluye gráfico.

### P8 - Ejecución y verificación básica

- Origen del puntaje: propuesto
- Puntaje máximo: 0.4 puntos propuestos
- Requisito evaluado: que el código de la tarea se pueda ejecutar y permita verificar que los arreglos quedan ordenados.
- Evidencia esperada: ejecución sin errores del archivo o notebook; uso de `chequea_orden` o verificación equivalente.
- Puntaje completo: el programa se ejecuta sin errores y muestra verificaciones de ordenamiento para ambas versiones.
- Puntaje parcial: hasta 0.2 puntos propuestos si el código principal falla parcialmente pero las funciones principales pueden probarse manualmente.
- Puntaje cero: el código no se ejecuta o impide verificar la solución.

## Descuentos, topes y reglas especiales - si corresponde

No corresponde.

## Escala final

- Puntaje máximo original por sección o total: no especificado en los materiales.
- Puntaje máximo total propuesto: 7.0 puntos.
- Ponderación entre secciones: no corresponde.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales: la tarea exige implementar Quicksort con mediana de tres, comparar contra Quicksort original, medir tiempos y comparaciones promedio, ejecutar 15 repeticiones por tamaño de arreglo, usar arreglos generados con `np.random.random(n)`, usar copias del mismo arreglo para ambos métodos, presentar tabla y gráfico.
- Puntajes propuestos: todos los puntajes de los criterios P1 a P8 son propuestos, porque el material no entrega una pauta ni distribución numérica.
- Ambigüedad no resuelta: el texto menciona los tamaños `n = 100, 500, 1000, 5000, 10000, 20000, 40000`, pero el bloque de código y el archivo base usan `ns = [100, 1000, 5000, 10000, 15000, 20000, 40000]`.
- Ambigüedad no resuelta: el texto menciona `time.gettime_ns(0)`, pero el ejemplo usa `time.clock_gettime_ns(0)`.
- Requisitos dependientes del formato de entrega: la tabla y el gráfico solo pueden verificarse si la entrega incluye documento, notebook, salida guardada o archivos de resultados además del código.
