# Pauta de evaluación

## Alcance

Se evalúa la tarea CC3301/t05: modificar `sort-c-im.c` y `sort-rv-im.s` para que la función `sort(char *a[], int n)` ordene arreglos de strings ignorando diferencias entre mayúsculas y minúsculas. La entrega esperada es `im.zip`, generado con `make zip`, que incluye `sort-c-im.c`, `sort-rv-im.s` y `resultados.txt`.

En `sort-c-im.c` no hay restricciones de programación. En `sort-rv-im.s` solo puede modificarse la zona delimitada que compara elementos consecutivos, la comparación no puede invocar otras funciones, debe dejar el resultado en `t1` y continuar en la etiqueta indicada por el código original.

## Criterios

### P1 - Comparación y ordenamiento en C ignorando mayúsculas/minúsculas

- Origen del puntaje: propuesto
- Puntaje máximo: 1.5 puntos propuestos
- Requisito evaluado: `sort-c-im.c` debe ordenar strings ignorando diferencias entre mayúsculas y minúsculas.
- Evidencia esperada: archivo `sort-c-im.c`; ejecución de `make sort-c-im.run`.
- Puntaje completo: `make sort-c-im.run` compila, ejecuta y termina con el mensaje `Felicitaciones: ...`; la comparación trata letras mayúsculas y minúsculas equivalentes para efectos de ordenamiento.
- Puntaje parcial: propuesto para revisión humana:
  - hasta 1.0 si compila y resuelve correctamente varios casos simples de comparación ignorando mayúsculas/minúsculas, pero falla casos del test completo;
  - hasta 0.5 si compila, pero la comparación aún es principalmente lexicográfica sensible a mayúsculas/minúsculas o falla casos básicos.
- Puntaje cero: no compila, no ejecuta, no implementa una comparación usable, o no modifica `sort-c-im.c` de forma relevante.

### P2 - Ordenamiento en assembler Risc-V ignorando mayúsculas/minúsculas

- Origen del puntaje: propuesto
- Puntaje máximo: 2.5 puntos propuestos
- Requisito evaluado: `sort-rv-im.s` debe implementar el ordenamiento solicitado en assembler Risc-V, ignorando diferencias entre mayúsculas y minúsculas.
- Evidencia esperada: archivo `sort-rv-im.s`; ejecución de `make sort-rv-im.run`.
- Puntaje completo: `make sort-rv-im.run` compila, ejecuta y termina con el mensaje `Felicitaciones: ...`; el arreglo queda ordenado como en los tests entregados.
- Puntaje parcial: propuesto para revisión humana:
  - hasta 1.8 si la versión assembler ordena correctamente la mayoría de los casos, pero falla algunos casos de mayúsculas/minúsculas o strings largos;
  - hasta 1.0 si compila y ejecuta, pero solo conserva parcialmente el comportamiento de ordenamiento;
  - hasta 0.5 si compila, pero la comparación no cumple sustancialmente el criterio ignorando mayúsculas/minúsculas.
- Puntaje cero: no compila, no ejecuta, entra en ciclo infinito, corrompe el arreglo, o no implementa la comparación solicitada.

### P3 - Restricciones de modificación en `sort-rv-im.s`

- Origen del puntaje: propuesto
- Puntaje máximo: 1.5 puntos propuestos
- Requisito evaluado: respetar las restricciones explícitas para la versión assembler.
- Evidencia esperada: comparación entre `sort-rv-im.s` entregado y el archivo base; revisión del código assembler.
- Puntaje completo: solo se modifica la parte delimitada que compara elementos consecutivos; no se modifica el resto de la función; la comparación no invoca otras funciones; el resultado queda en `t1` con la semántica esperada para decidir el intercambio.
- Puntaje parcial: propuesto para revisión humana:
  - hasta 1.0 si la solución no llama funciones y conserva el flujo general, pero realiza cambios menores fuera de la zona delimitada;
  - hasta 0.5 si respeta parcialmente la estructura, pero altera registros, flujo o zonas no autorizadas de forma riesgosa.
- Puntaje cero: modifica partes no permitidas de manera sustancial, invoca funciones para comparar strings, o no deja el resultado de comparación utilizable en `t1`.

### P4 - Producto esperado

- Origen del puntaje: propuesto
- Puntaje máximo: 0.5 puntos propuestos
- Requisito evaluado: generar la entrega solicitada.
- Evidencia esperada: archivo `im.zip` generado con `make zip`.
- Puntaje completo: `im.zip` contiene `sort-c-im.c`, `sort-rv-im.s` y `resultados.txt`, según lo indicado en el material.
- Puntaje parcial: propuesto para revisión humana:
  - hasta 0.3 si la entrega contiene los fuentes principales, pero falta `resultados.txt` o el zip no fue generado exactamente con el procedimiento esperado.
- Puntaje cero: no se entrega `im.zip` o faltan archivos fuente esenciales.

## Descuentos, topes y reglas especiales - si corresponde

- Regla de rechazo explícita: el README indica que `make sort-c-im.run` y `make sort-rv-im.run` deben terminar con el mensaje `Felicitaciones: ...`; de otra forma, la tarea será rechazada.
  - Condición: cualquiera de esas ejecuciones no compila, falla, no termina, o no muestra el mensaje requerido.
  - Efecto: tarea rechazada, según el material.
  - Evidencia necesaria: salida de los comandos `make sort-c-im.run` y `make sort-rv-im.run`.

No se especifican descuentos numéricos, topes de nota ni penalizaciones adicionales en los materiales.

## Escala final

- Puntaje máximo original total: no especificado en los materiales.
- Puntaje máximo propuesto total: 6.0 puntos propuestos.
- Ponderación entre secciones: no corresponde.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales:
  - se deben modificar `sort-c-im.c` y `sort-rv-im.s`;
  - el ordenamiento debe ignorar diferencias entre mayúsculas y minúsculas;
  - `sort-rv-im.s` solo puede modificarse en la zona delimitada de comparación;
  - en assembler no se pueden invocar otras funciones para comparar;
  - las ejecuciones `make sort-c-im.run` y `make sort-rv-im.run` deben terminar con `Felicitaciones: ...`;
  - la entrega esperada es `im.zip` con `sort-c-im.c`, `sort-rv-im.s` y `resultados.txt`.

- Puntajes o niveles propuestos:
  - todos los puntajes de criterios son propuestos, porque el material no entrega una distribución numérica original;
  - el total propuesto es 6.0 puntos para mapear linealmente a nota 1.0–7.0.

- Ambigüedades no resueltas:
  - el material no define puntajes por archivo ni por test;
  - “tarea será rechazada” no viene acompañado de una nota numérica específica;
  - no se especifica comportamiento para alfabetos, acentos o locales fuera de los caracteres usados en los tests entregados.

- Requisitos no verificables completamente con el material disponible:
  - no se incluyó el archivo base `sort-rv-im.s`, por lo que la verificación exacta de la zona delimitada requiere comparar contra el material original de la tarea.
