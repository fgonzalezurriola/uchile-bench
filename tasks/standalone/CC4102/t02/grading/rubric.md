# Pauta de evaluación

## Alcance

Se evalúa una entrega independiente de la Tarea 2 de CC4102, cuyo objetivo es implementar y experimentar con cuatro variaciones del algoritmo de Kruskal:

- Con optimización de `find` y arreglo de aristas ordenado.
- Con optimización de `find` y heap clásico.
- Sin optimización de `find` y arreglo de aristas ordenado.
- Sin optimización de `find` y heap clásico.

La entrega debe incluir código en C o C++ y un informe en Markdown. El código debe implementar las estructuras, Union-Find, Kruskal, generación de datos, medición de tiempos y ejecución de experimentos. El informe debe explicar el experimento, los algoritmos, resultados, análisis y conclusiones.

## Secciones y ponderación - si corresponde

- **COD - Código**
  - Ponderación: propuesta 50% para revisión humana, porque el enunciado entrega 6.0 pts para código y 6.0 pts para informe, pero no explicita ponderación final.
  - Puntaje máximo original: 6.0 pts.

- **INF - Informe**
  - Ponderación: propuesta 50% para revisión humana, porque el enunciado entrega 6.0 pts para código y 6.0 pts para informe, pero no explicita ponderación final.
  - Puntaje máximo original: 6.0 pts.

## Criterios

### C1 - README de ejecución

- Origen del puntaje: enunciado
- Puntaje máximo: 0.3 pts
- Sección: COD
- Requisito evaluado: existencia de un archivo README con instrucciones para ejecutar la totalidad del código, incluyendo librerías adicionales que deban instalarse.
- Evidencia esperada: archivo README y posibilidad de seguir sus instrucciones para compilar/ejecutar.
- Puntaje completo: el README permite que cualquier persona ejecute todo el código solo leyendo las instrucciones.
- Puntaje parcial: propuesto para revisión humana según completitud y claridad de las instrucciones.
- Puntaje cero: no hay README o no entrega instrucciones útiles de ejecución.

### C2 - Firmas y descripciones

- Origen del puntaje: enunciado
- Puntaje máximo: 0.2 pts
- Sección: COD
- Requisito evaluado: cada estructura de datos y función tiene una descripción de lo que hace y de sus parámetros de entrada y salida.
- Evidencia esperada: comentarios, documentación o firmas documentadas en el código.
- Puntaje completo: todas las estructuras y funciones relevantes están descritas con entradas y salidas.
- Puntaje parcial: propuesto para revisión humana si la documentación está incompleta.
- Puntaje cero: no se describen estructuras ni funciones.

### C3 - Estructuras de datos con punteros

- Origen del puntaje: enunciado
- Puntaje máximo: 0.5 pts
- Sección: COD
- Requisito evaluado: nodos y aristas usan el sistema de punteros explicado en el enunciado.
- Evidencia esperada: implementación de nodos como elementos referenciables y aristas como pares de punteros a nodos.
- Puntaje completo: nodos y aristas siguen la representación solicitada.
- Puntaje parcial: propuesto para revisión humana si la representación usa punteros parcialmente o no sigue completamente la metodología.
- Puntaje cero: no se implementan las estructuras solicitadas o no usan el sistema de punteros indicado.

### C4 - Implementación de Union-Find

- Origen del puntaje: enunciado
- Puntaje máximo: 1.5 pts
- Sección: COD
- Requisito evaluado: implementación propia de la interfaz Union-Find basada en las metodologías del enunciado y el apunte del curso.
- Evidencia esperada: código de `find`, `union` y manejo de conjuntos de nodos.
- Puntaje completo: Union-Find es creado por el estudiante, mantiene raíces, permite encontrar representantes y une árboles dejando la raíz del árbol más pequeño como hijo de la raíz del árbol más grande.
- Puntaje parcial: propuesto para revisión humana según completitud de `find`, `union`, manejo de tamaños y consistencia con la metodología.
- Puntaje cero: no hay implementación de Union-Find propia o no es funcional.

### C5 - Kruskal sin optimización de find

- Origen del puntaje: enunciado
- Puntaje máximo: 1.0 pts
- Sección: COD
- Requisito evaluado: implementación propia de Kruskal sin optimización de `find`, basada en las metodologías explicadas.
- Evidencia esperada: función o módulo de Kruskal sin compresión de caminos, con descarte de aristas que forman ciclo e incorporación de aristas válidas hasta construir el árbol.
- Puntaje completo: la versión sin optimización funciona correctamente con arreglo ordenado y heap clásico según lo requerido.
- Puntaje parcial: propuesto para revisión humana según completitud de las variantes y corrección del algoritmo.
- Puntaje cero: no se implementa Kruskal sin optimización o no es funcional.
- Nota: la interfaz Union-Find no aporta puntaje a este apartado, según el enunciado.

### C6 - Optimización de Kruskal mediante find optimizado

- Origen del puntaje: enunciado
- Puntaje máximo: 1.0 pts
- Sección: COD
- Requisito evaluado: implementación propia de la optimización de `find`, asociada netamente a la optimización.
- Evidencia esperada: versión de `find` con compresión de caminos y uso en las variantes optimizadas de Kruskal.
- Puntaje completo: la optimización hace que los nodos visitados durante `find` apunten directamente a la raíz y se usa en las variantes correspondientes.
- Puntaje parcial: propuesto para revisión humana si la optimización está incompleta o solo se aplica en parte.
- Puntaje cero: no se implementa la optimización de `find`.

### C7 - Generación del experimento

- Origen del puntaje: enunciado
- Puntaje máximo: 0.5 pts
- Sección: COD
- Requisito evaluado: creación de secuencias de puntos y aristas con pesos.
- Evidencia esperada: código que genera 5 secuencias de N puntos para N ∈ {2^5, 2^6, …, 2^12}, calcula las N(N−1)/2 aristas posibles y sus pesos como distancia euclidiana cuadrada.
- Puntaje completo: se generan los datos requeridos con puntos reales de 64 bits en [0, 1] y pesos correctos.
- Puntaje parcial: propuesto para revisión humana si faltan algunos tamaños, repeticiones, aristas o detalles de cálculo.
- Puntaje cero: no se genera el experimento solicitado.

### C8 - Obtención de resultados de tiempo

- Origen del puntaje: enunciado
- Puntaje máximo: 0.5 pts
- Sección: COD
- Requisito evaluado: forma correcta de obtener resultados de tiempos de ejecución.
- Evidencia esperada: medición de tiempos para las cuatro variantes, considerando también el tiempo de creación de la estructura de extracción de aristas.
- Puntaje completo: los tiempos se obtienen correctamente para todos los experimentos requeridos.
- Puntaje parcial: propuesto para revisión humana si se miden tiempos incompletos o con omisiones menores.
- Puntaje cero: no se obtienen tiempos de ejecución o la medición no corresponde al algoritmo solicitado.

### C9 - Main ejecutable

- Origen del puntaje: enunciado
- Puntaje máximo: 0.5 pts
- Sección: COD
- Requisito evaluado: existencia de un archivo o función `main` que permita ejecutar la construcción y experimentos.
- Evidencia esperada: código principal compilable/ejecutable.
- Puntaje completo: `main` permite ejecutar la construcción de datos y todos los experimentos.
- Puntaje parcial: propuesto para revisión humana si ejecuta solo parte del flujo.
- Puntaje cero: no existe punto de entrada ejecutable.

### I1 - Introducción del informe

- Origen del puntaje: enunciado
- Puntaje máximo: 0.8 pts
- Sección: INF
- Requisito evaluado: presentación del tema en estudio, resumen de lo que se dirá en el informe y presentación de una hipótesis.
- Evidencia esperada: sección de introducción en el informe Markdown.
- Puntaje completo: incluye tema, resumen e hipótesis en la sección correspondiente.
- Puntaje parcial: propuesto para revisión humana si falta alguno de los elementos.
- Puntaje cero: no hay introducción o no contiene elementos evaluables.

### I2 - Desarrollo del informe

- Origen del puntaje: enunciado
- Puntaje máximo: 0.8 pts
- Sección: INF
- Requisito evaluado: presentación de algoritmos, estructuras de datos, funcionamiento y justificación, explicando las implementaciones propias.
- Evidencia esperada: sección de desarrollo en el informe Markdown.
- Puntaje completo: explica claramente algoritmos, estructuras y funcionamiento de las implementaciones propias.
- Puntaje parcial: propuesto para revisión humana según completitud de la explicación.
- Puntaje cero: no hay desarrollo o no explica las implementaciones.

### I3 - Resultados del informe

- Origen del puntaje: enunciado
- Puntaje máximo: 2.4 pts
- Sección: INF
- Requisito evaluado: especificación de datos experimentales, número de tests, inputs, tamaños, sistema operativo, tamaños de cachés y RAM, gráficos/tablas, valores y parámetros usados.
- Evidencia esperada: sección de resultados en el informe Markdown con gráficos o tablas y descripción de resultados observables.
- Puntaje completo: incluye todos los elementos solicitados y muestra promedios de tiempos para los tamaños de entrada y variantes requeridas.
- Puntaje parcial: propuesto para revisión humana si faltan datos, parámetros, información del sistema, gráficos/tablas o claridad en los resultados.
- Puntaje cero: no hay resultados experimentales reportados.

### I4 - Análisis del informe

- Origen del puntaje: enunciado
- Puntaje máximo: 1.2 pts
- Sección: INF
- Requisito evaluado: comentario, conclusión e inferencias a partir de los resultados.
- Evidencia esperada: sección de análisis en el informe Markdown.
- Puntaje completo: analiza los resultados y realiza inferencias sustentadas en ellos.
- Puntaje parcial: propuesto para revisión humana si el análisis es superficial o incompleto.
- Puntaje cero: no hay análisis de resultados.

### I5 - Conclusión del informe

- Origen del puntaje: enunciado
- Puntaje máximo: 0.8 pts
- Sección: INF
- Requisito evaluado: recapitulación de lo realizado, conclusión respecto de resultados, evaluación de la hipótesis, razones, posibles mejoras, faltantes, aspectos no resueltos y extensiones futuras.
- Evidencia esperada: sección de conclusión en el informe Markdown.
- Puntaje completo: incluye todos los elementos solicitados en la sección correspondiente.
- Puntaje parcial: propuesto para revisión humana si falta alguno de los elementos.
- Puntaje cero: no hay conclusión evaluable.

## Descuentos, topes y reglas especiales - si corresponde

- El código debe estar escrito en C o C++. El enunciado lo indica como lenguaje obligatorio, pero no asigna un puntaje específico ni explicita un descuento o tope.
- En el informe, todo lo mencionado debe estar en las secciones señaladas. La falta de algún aspecto o la presencia de algún aspecto en una sección equivocada implica no obtener la totalidad del puntaje correspondiente.
- Para el tiempo total del algoritmo, se debe considerar el tiempo de creación de la estructura de extracción de aristas.
- No se identifican otros descuentos, topes de nota, notas directas o condiciones especiales explícitas.

## Escala final

- Puntaje máximo original por sección:
  - Código: 6.0 pts.
  - Informe: 6.0 pts.
- Ponderación entre secciones: propuesta 50% Código y 50% Informe para revisión humana; el enunciado no explicita ponderación final.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales:
  - La tarea exige código en C o C++.
  - La entrega incluye código e informe.
  - El código suma 6.0 pts según los ítems del enunciado.
  - El informe suma 6.0 pts según los ítems del enunciado.
  - Deben implementarse cuatro variantes de Kruskal combinando optimización de `find` y estructura de extracción.
  - El informe debe estar en Markdown.
- Puntajes o niveles propuestos:
  - La ponderación 50% Código y 50% Informe es propuesta para revisión humana, porque no se explicita una ponderación final.
  - Las reglas de puntaje parcial son propuestas para revisión humana cuando el enunciado solo especifica el puntaje máximo.
- Ambigüedades no resueltas:
  - El enunciado no indica si la nota final se calcula sobre 12.0 pts totales o con ponderaciones separadas entre código e informe.
  - No se explicita un descuento o tope por usar un lenguaje distinto de C/C++.
- Requisitos que no pueden verificarse solo con el material:
  - Que las implementaciones hayan sido creadas efectivamente por los estudiantes.
  - La validez exacta de los tiempos experimentales sin ejecutar el código en un ambiente controlado.
