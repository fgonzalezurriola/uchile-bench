# Pauta de evaluación

## Alcance

Se evalúa la entrega de la Tarea 1 de CC4102, consistente en código en C o C++ e informe en Markdown para implementar Mergesort externo y Quicksort externo, trabajar con arreglos binarios en disco mediante bloques, ejecutar experimentos comparativos y analizar tiempo de ejecución y accesos a disco.

La tarea exige:
- Implementar desde cero Mergesort externo y Quicksort externo, sin librerías externas para los algoritmos.
- Leer y escribir archivos binarios en bloques de tamaño `B = 4096` bytes.
- Usar memoria principal limitada para la experimentación final, con `M = 4 MiB`.
- Obtener la aridad `a` mediante búsqueda binaria para Mergesort externo sobre un arreglo de tamaño `16M`, con `a ∈ [2, b]`, donde `b` es la cantidad de enteros de 64 bits que caben en un bloque.
- Usar esa misma `a` como cantidad de subarreglos en Quicksort externo.
- Generar 5 secuencias para cada tamaño `N ∈ {4M, 8M, 12M, 16M}`.
- Comparar ambos algoritmos según tiempo de ejecución y cantidad de accesos a disco.
- Entregar código ejecutable e informe explicativo con resultados, análisis y conclusiones.

## Secciones y ponderación - si corresponde

| Sección | Identificador | Ponderación | Puntaje máximo original |
|---|---:|---:|---:|
| Código | COD | No especificada explícitamente en el material | 6.0 pts |
| Informe | INF | No especificada explícitamente en el material | 6.0 pts |

## Criterios

### COD-README - README

- Origen del puntaje: enunciado
- Puntaje máximo: 0.3 pts
- Sección: COD
- Requisito evaluado: existe un archivo README con instrucciones para ejecutar la totalidad del código.
- Evidencia esperada: archivo README que indique comandos, dependencias o librerías adicionales necesarias y pasos para ejecutar construcción y experimentos.
- Puntaje completo: el README permite que una persona ejecute todo el código solo leyendo sus instrucciones.
- Puntaje parcial: no especificado en el material; se propone asignar proporcionalmente según completitud, claridad y cobertura de instalación, compilación y ejecución.
- Puntaje cero: no existe README o no contiene instrucciones útiles para ejecutar el código.

### COD-FIRMAS - Descripción de estructuras y funciones

- Origen del puntaje: enunciado
- Puntaje máximo: 0.2 pts
- Sección: COD
- Requisito evaluado: cada estructura de datos y función tiene una descripción de lo que hace y de sus parámetros de entrada y salida.
- Evidencia esperada: comentarios, documentación o firmas documentadas en el código.
- Puntaje completo: todas las estructuras y funciones relevantes están descritas con propósito, entradas y salidas.
- Puntaje parcial: no especificado en el material; se propone asignar proporcionalmente según cobertura y precisión de las descripciones.
- Puntaje cero: no hay descripciones de estructuras ni funciones.

### COD-DISCO - Uso de disco

- Origen del puntaje: enunciado
- Puntaje máximo: 1.0 pts
- Sección: COD
- Requisito evaluado: el uso de disco es correcto.
- Evidencia esperada: código que guarde arreglos en archivos binarios `.bin`, realice lecturas y escrituras por bloques de tamaño `B`, use buffers de tamaño `B` y permita interpretar bloques binarios como arreglos de enteros de 64 bits en memoria principal.
- Puntaje completo: todas las lecturas y escrituras de datos se realizan por bloque, los archivos se guardan en binario y existe interpretación correcta del binario en memoria principal.
- Puntaje parcial: no especificado en el material; se propone asignar proporcionalmente según cumplimiento de lectura/escritura por bloques, formato binario e interpretación correcta.
- Puntaje cero: no se trabaja en disco correctamente, no se usan archivos binarios o se realizan lecturas/escrituras incompatibles con el requisito de bloques.

### COD-MERGESORT - Implementación de Mergesort externo

- Origen del puntaje: enunciado
- Puntaje máximo: 1.5 pts
- Sección: COD
- Requisito evaluado: implementación propia de Mergesort externo basada en cátedra y apunte del curso.
- Evidencia esperada: código fuente del algoritmo, ejecución que ordene correctamente archivos binarios en memoria secundaria y uso de la aridad definida experimentalmente.
- Puntaje completo: Mergesort externo está implementado desde cero, ordena correctamente y se ajusta al trabajo en disco exigido.
- Puntaje parcial: no especificado en el material; se propone asignar proporcionalmente según correctitud, completitud del algoritmo externo y cumplimiento del modelo de disco.
- Puntaje cero: no hay implementación de Mergesort externo, usa una librería externa para el algoritmo o no ordena correctamente.

### COD-QUICKSORT - Implementación de Quicksort externo

- Origen del puntaje: enunciado
- Puntaje máximo: 1.5 pts
- Sección: COD
- Requisito evaluado: implementación propia de Quicksort externo basada en la descripción del enunciado.
- Evidencia esperada: código que seleccione pivotes desde un bloque aleatorio, particione en `a` subarreglos, ordene recursivamente y concatene subarreglos ordenados.
- Puntaje completo: Quicksort externo está implementado desde cero, ordena correctamente y sigue el esquema descrito en el enunciado.
- Puntaje parcial: no especificado en el material; se propone asignar proporcionalmente según correctitud, manejo de pivotes, particionamiento, recursión y cumplimiento del modelo de disco.
- Puntaje cero: no hay implementación de Quicksort externo, usa una librería externa para el algoritmo o no ordena correctamente.

### COD-EXPERIMENTO - Creación de arreglos de tamaño N

- Origen del puntaje: enunciado
- Puntaje máximo: 0.5 pts
- Sección: COD
- Requisito evaluado: creación de los arreglos usados en la experimentación.
- Evidencia esperada: código que genere 5 secuencias de enteros de 64 bits para cada `N ∈ {4M, 8M, 12M, 16M}`, las inserte desordenadamente y las guarde en binario en disco.
- Puntaje completo: se generan correctamente todos los arreglos requeridos para todos los tamaños y repeticiones.
- Puntaje parcial: no especificado en el material; se propone asignar proporcionalmente según cantidad de tamaños, repeticiones y formato correcto generados.
- Puntaje cero: no se generan arreglos experimentales o no corresponden a los tamaños requeridos.

### COD-RESULTADOS - Obtención de resultados

- Origen del puntaje: enunciado
- Puntaje máximo: 0.5 pts
- Sección: COD
- Requisito evaluado: la forma de obtener `a`, tiempos de ejecución y accesos a disco es correcta.
- Evidencia esperada: código o scripts que realicen búsqueda binaria de `a ∈ [2, b]` para Mergesort externo sobre un arreglo de tamaño `16M`, ejecuten ambos algoritmos sobre los arreglos requeridos y registren tiempos y accesos a disco.
- Puntaje completo: se obtiene correctamente la aridad `a`, se mide tiempo de ejecución y se contabilizan accesos a disco para ambos algoritmos y parámetros requeridos.
- Puntaje parcial: no especificado en el material; se propone asignar proporcionalmente según correctitud de la búsqueda de `a`, medición de tiempos y conteo de accesos.
- Puntaje cero: no se obtiene `a`, no se registran tiempos ni accesos, o el procedimiento no corresponde al solicitado.

### COD-MAIN - Ejecución de construcción y experimentos

- Origen del puntaje: enunciado
- Puntaje máximo: 0.5 pts
- Sección: COD
- Requisito evaluado: existe un archivo o función `main` que permite ejecutar la construcción y los experimentos.
- Evidencia esperada: archivo fuente con `main` o punto de entrada equivalente en C/C++.
- Puntaje completo: el punto de entrada permite ejecutar la generación de datos, algoritmos y experimentos requeridos.
- Puntaje parcial: no especificado en el material; se propone asignar proporcionalmente según cobertura de construcción, ejecución de algoritmos y experimentación.
- Puntaje cero: no existe punto de entrada ejecutable o no permite ejecutar la tarea.

### INF-INTRO - Introducción

- Origen del puntaje: enunciado
- Puntaje máximo: 0.8 pts
- Sección: INF
- Requisito evaluado: el informe contiene una introducción con presentación del tema, resumen del contenido e hipótesis.
- Evidencia esperada: sección de introducción en Markdown.
- Puntaje completo: presenta el tema en estudio, resume lo que se dirá en el informe y plantea una hipótesis.
- Puntaje parcial: no especificado en el material; se propone asignar proporcionalmente según presencia y calidad de esos tres elementos.
- Puntaje cero: no hay introducción o no aborda los elementos solicitados.

### INF-DESARROLLO - Desarrollo

- Origen del puntaje: enunciado
- Puntaje máximo: 0.8 pts
- Sección: INF
- Requisito evaluado: presentación de algoritmos, estructuras de datos, funcionamiento y justificación, enfocada en las implementaciones propias.
- Evidencia esperada: sección de desarrollo en Markdown.
- Puntaje completo: explica los algoritmos, estructuras de datos, cómo funcionan, por qué se usan y cómo fueron implementados por el equipo.
- Puntaje parcial: no especificado en el material; se propone asignar proporcionalmente según completitud y relación con las implementaciones reales.
- Puntaje cero: no hay desarrollo o no explica las implementaciones.

### INF-RESULTADOS - Resultados

- Origen del puntaje: enunciado
- Puntaje máximo: 2.4 pts
- Sección: INF
- Requisito evaluado: presentación de datos experimentales, configuración, gráficos/tablas y valores usados.
- Evidencia esperada: sección de resultados con datos, tablas o gráficos en Markdown.
- Puntaje completo: especifica datos usados, cantidad de repeticiones, inputs, tamaños, sistema operativo, tamaños de cachés y RAM; muestra gráficos/tablas; menciona observaciones directas de los gráficos/tablas; muestra valores y parámetros usados.
- Puntaje parcial: no especificado en el material; se propone asignar proporcionalmente según presencia de datos experimentales, configuración de hardware/software, gráficos/tablas y parámetros.
- Puntaje cero: no se presentan resultados experimentales verificables.

### INF-ANALISIS - Análisis

- Origen del puntaje: enunciado
- Puntaje máximo: 1.2 pts
- Sección: INF
- Requisito evaluado: comentario, conclusión e inferencias a partir de los resultados.
- Evidencia esperada: sección de análisis en Markdown.
- Puntaje completo: comenta y concluye los resultados, haciendo inferencias fundadas en los datos obtenidos.
- Puntaje parcial: no especificado en el material; se propone asignar proporcionalmente según profundidad y respaldo en resultados.
- Puntaje cero: no hay análisis o no se relaciona con los resultados.

### INF-CONCLUSION - Conclusión

- Origen del puntaje: enunciado
- Puntaje máximo: 0.8 pts
- Sección: INF
- Requisito evaluado: recapitulación, conclusión sobre resultados, evaluación de hipótesis y mejoras futuras.
- Evidencia esperada: sección de conclusión en Markdown.
- Puntaje completo: recapitula lo realizado, concluye respecto de los resultados, indica si la hipótesis se cumplió o no y por qué, y menciona mejoras futuras, faltantes, aspectos no resueltos y posibles extensiones.
- Puntaje parcial: no especificado en el material; se propone asignar proporcionalmente según presencia de los elementos solicitados.
- Puntaje cero: no hay conclusión o no aborda los elementos requeridos.

## Descuentos, topes y reglas especiales - si corresponde

- Condición: uso de librerías externas para implementar los algoritmos de Mergesort externo o Quicksort externo.
  - Efecto: no se acepta para la implementación de los algoritmos; afecta los criterios COD-MERGESORT y/o COD-QUICKSORT según corresponda.
  - Evidencia necesaria: dependencias, llamadas a librerías o código que delegue el algoritmo de ordenamiento externo.

- Condición: lecturas o escrituras de disco de tamaño distinto a `B`.
  - Efecto: el enunciado indica que es incorrecto; afecta el criterio COD-DISCO y puede afectar los algoritmos si dependen de ese uso.
  - Evidencia necesaria: revisión de llamadas de lectura/escritura y manejo de buffers.

- Condición: aspectos del informe presentes en una sección equivocada o ausentes de la sección señalada.
  - Efecto: el enunciado indica que la falta de algún aspecto o su presencia en una sección equivocada hará que no se obtenga la totalidad del puntaje correspondiente.
  - Evidencia necesaria: revisión de la estructura y contenido del informe.

## Escala final

- Puntaje máximo original por sección:
  - Código: 6.0 pts
  - Informe: 6.0 pts
- Puntaje máximo original total: 12.0 pts, si se suman ambas secciones.
- Ponderación entre secciones: no especificada explícitamente; al sumar los puntajes originales, Código e Informe aportan 6.0 pts cada uno.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales:
  - Lenguaje requerido: C o C++.
  - Código e informe son entregables obligatorios.
  - Los puntajes de criterios de código suman 6.0 pts.
  - Los puntajes de criterios de informe suman 6.0 pts.
  - `M = 4 MiB`, `B = 4096` bytes y los datos son enteros de 64 bits.
  - Se requieren 5 secuencias por cada tamaño `N ∈ {4M, 8M, 12M, 16M}`.
  - Se debe comparar Mergesort externo y Quicksort externo en tiempo de ejecución y accesos a disco.
  - El informe debe estar en Markdown.

- Puntajes o niveles propuestos:
  - Las reglas de puntaje parcial no están detalladas en el material; se propuso asignación proporcional dentro de cada criterio según el cumplimiento observable.
  - La interpretación de puntaje máximo total como 12.0 pts proviene de sumar las secciones Código e Informe, aunque el material no declara explícitamente un total final.

- Ambigüedades no resueltas:
  - No se especifica una ponderación explícita entre Código e Informe más allá de sus puntajes internos.
  - No se detalla el método exacto para contar accesos a disco.
  - No se especifica el formato exacto de salida de resultados ni de los gráficos/tablas.
  - No se define una pauta de corrección fina para implementaciones parcialmente correctas.

- Requisitos que no pueden verificarse solo con el material:
  - Si los experimentos fueron ejecutados efectivamente bajo memoria principal limitada, salvo que la entrega incluya evidencia reproducible.
  - Tamaños de caché y RAM usados en la experimentación, salvo que el informe los declare.
  - Correctitud completa del conteo de accesos a disco sin inspección del código y trazas de ejecución.
