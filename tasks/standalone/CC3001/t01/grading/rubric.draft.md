# Pauta de evaluación

## Alcance

Se evalúa la entrega independiente de la Tarea 1 de CC3001, “Pilas de arena abelianas”. La entrega esperada consiste en un archivo `.py` con las funciones `arena(N)` y `arena2(N)`, y un documento Markdown con explicaciones, ejecuciones, comparaciones, tabla, gráfico y discusión solicitados.

La tarea evalúa la simulación de pilas de arena abelianas desde una configuración inicial con `N` granos en la celda central, la estabilización del tablero, la visualización del resultado, el conteo de aplicaciones de la regla, una versión optimizada de la regla y la comparación empírica entre ambas versiones.

## Criterios

### P1 - Simulación correcta en `arena(N)`

- Origen del puntaje: propuesto
- Puntaje máximo: 1.4
- Requisito evaluado: implementar `arena(N)` aplicando la regla original: si una celda tiene 4 o más granos, se le quitan 4 y se reparte 1 grano a cada vecino cardinal, repitiendo hasta que no queden celdas con 4 o más granos.
- Evidencia esperada: código en el archivo `.py`; comportamiento observable al ejecutar `arena(N)`.
- Puntaje completo: la función parte con todas las celdas vacías salvo la celda central con `N` granos, aplica correctamente la regla de 4 en 4, conserva la dinámica descrita y termina con todas las celdas con menos de 4 granos.
- Puntaje parcial: propuesto según grado de cumplimiento; por ejemplo, errores menores de implementación que no alteren sustancialmente la estabilización reciben más puntaje que errores que alteren la regla de distribución o la condición de término.
- Puntaje cero: no implementa `arena(N)`, no simula la regla descrita o no alcanza una configuración estabilizada.

### P2 - Tamaño del tablero y manejo de bordes

- Origen del puntaje: propuesto
- Puntaje máximo: 0.8
- Requisito evaluado: calcular y usar un tablero suficientemente grande para asegurar que ningún grano se salga por los bordes, considerando la máxima área que pueden cubrir `N` granos.
- Evidencia esperada: código que dimensiona el tablero; explicación en el documento Markdown.
- Puntaje completo: el tablero se dimensiona de forma justificada a partir de `N`, evita pérdidas de granos por los bordes y la explicación describe cómo se calculó el tamaño necesario.
- Puntaje parcial: propuesto; se otorga si el tablero funciona para algunos casos pero la justificación es incompleta, o si la explicación es correcta pero la implementación no la respeta completamente.
- Puntaje cero: usa un tamaño fijo sin justificación suficiente, permite pérdida de granos por los bordes o no explica el cálculo solicitado.

### P3 - Salida, visualización y ejecuciones de la Parte 1

- Origen del puntaje: propuesto
- Puntaje máximo: 0.8
- Requisito evaluado: `arena(N)` debe contar e imprimir el número total de aplicaciones de la regla, visualizar el tablero final y ejecutarse para `N=128` y para el mayor `N=4096`.
- Evidencia esperada: impresión del conteo; visualización con Matplotlib u otro mecanismo equivalente; registro en el documento Markdown de las ejecuciones solicitadas.
- Puntaje completo: imprime correctamente el número total de aplicaciones de la regla original, muestra el tablero estabilizado con colores y documenta las ejecuciones para `N=128` y para un valor grande de `N`.
- Puntaje parcial: propuesto; se otorga si falta una de las ejecuciones, si la visualización es incompleta o si el conteo se reporta parcialmente.
- Puntaje cero: no imprime el conteo, no visualiza el tablero final y no registra las ejecuciones solicitadas.

### P4 - Simulación optimizada en `arena2(N)`

- Origen del puntaje: propuesto
- Puntaje máximo: 1.3
- Requisito evaluado: implementar `arena2(N)` usando la regla modificada: si una celda tiene 4 o más granos, se le quita de una sola vez el mayor múltiplo de 4 posible y se reparte equitativamente entre los cuatro vecinos cardinales.
- Evidencia esperada: código en el archivo `.py`; comportamiento observable al ejecutar `arena2(N)`.
- Puntaje completo: la función aplica correctamente la regla optimizada, distribuye a cada vecino la cuarta parte del múltiplo retirado y estabiliza el tablero hasta que todas las celdas tengan menos de 4 granos.
- Puntaje parcial: propuesto; se otorga si la intención de optimización está presente pero hay errores menores en el cálculo del múltiplo, la distribución o la condición de término.
- Puntaje cero: no implementa `arena2(N)`, reutiliza la regla original sin optimización o no respeta la distribución descrita.

### P5 - Salida, visualización y ejecuciones de la Parte 2

- Origen del puntaje: propuesto
- Puntaje máximo: 0.7
- Requisito evaluado: ejecutar `arena2(N)` para `N=128` y para el mayor `N` alcanzado en tiempo razonable, reportando el número de aplicaciones de la regla y visualizando el resultado.
- Evidencia esperada: impresión del conteo; visualización del tablero final; registro de ejecuciones en el documento Markdown.
- Puntaje completo: `arena2(N)` reporta el número de aplicaciones de la regla optimizada, visualiza el tablero final y documenta las ejecuciones solicitadas.
- Puntaje parcial: propuesto; se otorga si falta una ejecución, si el conteo no es claro o si la visualización está incompleta.
- Puntaje cero: no hay evidencia de ejecución de `arena2(N)` o no se reportan los resultados solicitados.

### P6 - Comparación mediante tabla y gráfico

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0
- Requisito evaluado: comparar, mediante una tabla y un gráfico, el número de aplicaciones de la regla en la Parte 1 y en la Parte 2 para distintos valores de `N` calculados.
- Evidencia esperada: tabla en el documento Markdown; gráfico comparativo; datos de conteo para ambas funciones y varios valores de `N`.
- Puntaje completo: presenta una tabla y un gráfico claros que comparan los conteos de `arena` y `arena2` para múltiples valores de `N`.
- Puntaje parcial: propuesto; se otorga si solo hay tabla o solo gráfico, si hay pocos valores de `N`, o si la comparación está incompleta pero es interpretable.
- Puntaje cero: no presenta comparación cuantitativa entre ambas partes.

### P7 - Discusión de la optimización y de posibles mejoras

- Origen del puntaje: propuesto
- Puntaje máximo: 0.6
- Requisito evaluado: discutir si valió la pena la optimización de la Parte 2 y proponer, sin implementar, otras posibles optimizaciones.
- Evidencia esperada: texto en el documento Markdown.
- Puntaje completo: la discusión usa los resultados obtenidos para evaluar la optimización y menciona otras optimizaciones posibles sin implementarlas.
- Puntaje parcial: propuesto; se otorga si la discusión es superficial, no se apoya claramente en los resultados o solo aborda una de las dos solicitudes.
- Puntaje cero: no incluye discusión sobre la optimización ni sobre posibles mejoras.

### P8 - Producto entregado y organización mínima

- Origen del puntaje: propuesto
- Puntaje máximo: 0.4
- Requisito evaluado: entregar un documento Markdown y un archivo `.py` con las respuestas y funciones solicitadas.
- Evidencia esperada: archivo `.py` con `arena(N)` y `arena2(N)`; documento Markdown con explicaciones, resultados y análisis.
- Puntaje completo: ambos archivos están presentes y contienen los elementos pedidos en el enunciado.
- Puntaje parcial: propuesto; se otorga si los archivos existen pero están incompletos o parte de las respuestas está en un formato distinto pero verificable.
- Puntaje cero: falta el archivo `.py`, falta el documento Markdown o la entrega no permite verificar la tarea.

## Descuentos, topes y reglas especiales - si corresponde

No corresponde.

## Escala final

- Puntaje máximo original por sección o total: no especificado en los materiales.
- Puntaje máximo total propuesto para revisión humana: 7.0
- Ponderación entre secciones, si corresponde: no corresponde.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales:
  - Se deben implementar `arena(N)` y `arena2(N)`.
  - `arena(N)` usa la regla original de quitar 4 granos y repartir 1 a cada vecino cardinal.
  - `arena2(N)` usa la regla optimizada de quitar el mayor múltiplo de 4 posible y repartirlo equitativamente.
  - Ambas partes deben ejecutarse para `N=128` y para el N mayor, `N=4096`.
  - Se debe imprimir el número de aplicaciones de la regla y visualizar el tablero resultante.
  - Se debe explicar el cálculo del tamaño del tablero.
  - Se debe comparar con tabla y gráfico el número de aplicaciones de la regla en ambas versiones.
  - Se debe discutir si la optimización valió la pena y mencionar otras posibles optimizaciones sin implementarlas.
  - El producto esperado es un documento Markdown y un documento `.py`.

- Puntajes o niveles propuestos:
  - Todos los puntajes máximos de los criterios P1 a P8 son propuestos, porque los materiales no entregan una pauta ni ponderaciones originales.
  - Las reglas de puntaje parcial también son propuestas para revisión humana.

- Ambigüedades no resueltas:
  - No especifica cuántos valores distintos de `N` deben usarse en la comparación.
  - No define un formato obligatorio para la tabla, el gráfico ni las visualizaciones.
  - No especifica si el conteo en `arena2(N)` debe interpretarse como número de aplicaciones de la regla optimizada o como número equivalente de derrumbes unitarios; la pauta asume aplicaciones de la regla optimizada.
