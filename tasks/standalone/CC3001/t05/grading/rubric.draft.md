# Pauta de evaluación

## Alcance

Se evalúa la implementación de la tarea CC3001 Otoño 2023 Tarea 5 sobre árboles binarios de búsqueda posicionales. La entrega debe completar las clases `Arbol`, `Nodoi` y `Nodoe`, y los métodos `insert`, `search` y `find`, sin implementar `delete`.

La implementación debe mantener contadores de tamaño de subárbol en cada nodo, permitir búsqueda por llave y encontrar el k-ésimo menor elemento según recorrido inorden. También se considera la ejecución de los casos de prueba indicados en el enunciado.

## Criterios

### P1 - Estructura de nodos y árbol

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0 propuesto
- Requisito evaluado: implementación correcta de las clases `Nodoi`, `Nodoe` y `Arbol` con los campos requeridos.
- Evidencia esperada: archivo `.py` con las clases y atributos `izq`, `info`, `contador`, `der`, `rep` en nodos internos; `contador`, `rep` en nodos externos; raíz inicial como nodo externo con contador `0`.
- Puntaje completo: las clases conservan la estructura indicada y permiten representar correctamente árboles vacíos e internos.
- Puntaje parcial: propuesto; otorgar crédito si la estructura existe pero presenta errores menores en representación visual `rep` o inicialización.
- Puntaje cero: las clases no permiten construir un árbol utilizable para las operaciones solicitadas.

### P2 - Inserción en ABB posicional

- Origen del puntaje: propuesto
- Puntaje máximo: 2.0 propuesto
- Requisito evaluado: `insert(x)` debe insertar llaves respetando la propiedad de árbol binario de búsqueda y actualizar los contadores necesarios.
- Evidencia esperada: ejecución de inserciones sucesivas como `40, 25, 32, 90, 62, 55, 70`; inspección del árbol y de los contadores.
- Puntaje completo: inserta correctamente en árbol vacío y no vacío, mantiene el orden ABB y actualiza todos los contadores de subárbol afectados.
- Puntaje parcial: propuesto; otorgar crédito si inserta respetando el orden pero falla parcialmente en contadores, o si actualiza contadores solo en algunos casos.
- Puntaje cero: `insert` no agrega elementos o rompe la estructura básica de ABB.

### P3 - Búsqueda por llave

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0 propuesto
- Requisito evaluado: `search(x)` debe retornar un puntero al nodo interno que contiene `x`, o `None` si la llave no está.
- Evidencia esperada: pruebas como `search(62)` retorna un nodo no nulo y `search(10)` retorna `None`.
- Puntaje completo: busca correctamente en árboles vacíos y no vacíos, siguiendo la propiedad ABB.
- Puntaje parcial: propuesto; otorgar crédito si encuentra algunos elementos pero falla en casos de ausencia, extremos o subárboles.
- Puntaje cero: siempre retorna `None`, un valor incorrecto o no realiza búsqueda funcional.

### P4 - Operación `find(k)`

- Origen del puntaje: propuesto
- Puntaje máximo: 2.0 propuesto
- Requisito evaluado: `find(k)` debe retornar el nodo interno correspondiente al k-ésimo elemento en recorrido inorden, para `k` en `[1..n]`, y `None` si está fuera de rango.
- Evidencia esperada: uso de los contadores de hijos izquierdos; prueba indicada `find(5)` debe corresponder a la llave `62` en el árbol construido, y `find(8)` debe estar fuera de rango.
- Puntaje completo: usa correctamente los contadores, distingue los casos izquierda/raíz/derecha, ajusta `k` al descender al subárbol derecho y maneja rangos inválidos.
- Puntaje parcial: propuesto; otorgar crédito si funciona para algunos valores de `k` pero falla en bordes, en el ajuste al subárbol derecho o en árboles vacíos.
- Puntaje cero: `find` no está implementado, no usa el orden inorden o retorna resultados incompatibles con el ABB posicional.

### P5 - Casos de prueba y producto esperado

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0 propuesto
- Requisito evaluado: entrega de un documento Markdown y un archivo `.py`, y ejecución de los casos de prueba indicados.
- Evidencia esperada: archivo `.py` funcional; documento Markdown con las respuestas; salida observable para `test_search(a,62)`, `test_search(a,10)`, `test_find(a,5)` y `test_find(a,8)`.
- Puntaje completo: la entrega incluye ambos archivos solicitados y permite ejecutar los casos de prueba del enunciado.
- Puntaje parcial: propuesto; otorgar crédito si la entrega es ejecutable pero falta evidencia parcial del documento o de alguna prueba.
- Puntaje cero: no hay archivo ejecutable de solución o no se puede probar la implementación solicitada.

## Descuentos, topes y reglas especiales - si corresponde

No corresponde.

## Escala final

- Puntaje máximo original por sección o total: no especificado en el material; total propuesto 7.0 puntos.
- Ponderación entre secciones: no corresponde.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales: se deben implementar `Arbol`, `Nodoi`, `Nodoe`, `insert`, `search` y `find`; no se pide `delete`; `find(k)` retorna el k-ésimo nodo interno en inorden o `None` si está fuera de rango; `insert` debe actualizar contadores.
- Puntajes propuestos: todos los puntajes de criterios son propuestos, porque el material no incluye una pauta ni distribución original.
- Ambigüedades no resueltas: el enunciado no especifica tratamiento de llaves duplicadas.
- Requisitos no verificables completamente con el material: la visualización con `aed_utilities` puede depender del ambiente; no se propone penalización específica por ausencia de esa biblioteca.
