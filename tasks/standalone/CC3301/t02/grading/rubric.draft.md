# Pauta de evaluación

## Alcance

Evalúa la entrega de la Tarea 2 de CC3301: un archivo `aislar.c` que implementa las funciones declaradas en `aislar.h`:

- `int aislar_palabras(char *str);`
- `char *palabras(char *str);`

La evaluación considera correctitud funcional, cumplimiento de restricciones explícitas de implementación, uso de memoria, ausencia de errores detectables por sanitizadores y eficiencia comparada con la solución de referencia. El producto esperado es `aislar.zip` generado con `make zip`, que contiene `aislar.c` y `resultados.txt`.

## Criterios

### P1 - Correctitud de `aislar_palabras`

- Origen del puntaje: propuesto
- Puntaje máximo: 1.5 puntos propuestos
- Requisito evaluado: `aislar_palabras` debe transformar el string recibido dejando solo palabras formadas por caracteres alfabéticos, separadas por un único espacio, en el mismo string, y retornar el número de palabras encontradas.
- Evidencia esperada: ejecución de `make run`, `make run-g` y/o pruebas unitarias de `test-aislar.c` sobre casos como strings vacíos, espacios, solo letras, solo símbolos o dígitos, y combinaciones como `"a123bc4def56g7"`.
- Puntaje completo: produce exactamente los strings esperados y retorna los conteos correctos para los casos evaluados.
- Puntaje parcial: propuesto, según proporción de casos correctos y gravedad de errores en separación, eliminación de caracteres no alfabéticos o conteo.
- Puntaje cero: no implementa la función, no compila, modifica el string de forma inválida, o falla sistemáticamente los casos básicos.

### P2 - Correctitud de `palabras`

- Origen del puntaje: propuesto
- Puntaje máximo: 1.5 puntos propuestos
- Requisito evaluado: `palabras` debe retornar un nuevo string construido a partir de `str`, dejando solo palabras formadas por caracteres alfabéticos, separadas por espacios, sin modificar el string recibido.
- Evidencia esperada: ejecución de `make run`, `make run-g` y/o pruebas unitarias de `test-aislar.c`, incluyendo casos vacíos, espacios, letras, símbolos, dígitos y expresiones mixtas.
- Puntaje completo: retorna exactamente el string esperado, no modifica el parámetro de entrada y entrega memoria válida liberable con `free`.
- Puntaje parcial: propuesto, según proporción de casos correctos y gravedad de errores en copia, filtrado, separación o preservación del parámetro original.
- Puntaje cero: no implementa la función, no compila, retorna punteros inválidos, modifica el string original, o falla sistemáticamente los casos básicos.

### P3 - Restricciones de implementación de `aislar_palabras`

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0 punto propuesto
- Requisito evaluado: en `aislar_palabras` no se debe usar el operador de subindicación `[]`, ni su equivalente `*(p+i)`. Se debe usar aritmética de punteros. Por eficiencia, no se debe usar `malloc` ni declarar arreglos para pedir memoria adicional.
- Evidencia esperada: revisión del código fuente `aislar.c`.
- Puntaje completo: cumple todas las restricciones indicadas para `aislar_palabras`.
- Puntaje parcial: propuesto, si hay incumplimientos menores o localizados que no cambian sustancialmente el enfoque, sujeto a revisión humana.
- Puntaje cero: usa indexación o memoria auxiliar prohibida de manera central en la solución.

### P4 - Restricciones de implementación y memoria de `palabras`

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0 punto propuesto
- Requisito evaluado: `palabras` no debe usar `[]` ni `*(p+i)`, debe recorrer el string con aritmética de punteros, debe usar `malloc` para el resultado, debe pedir exactamente la cantidad de bytes necesaria y debe liberar la memoria auxiliar usada.
- Evidencia esperada: revisión de `aislar.c`, ejecución de `make run-san`, y benchmark de memoria descrito en `test-aislar.c`.
- Puntaje completo: cumple las restricciones, reserva exactamente la memoria necesaria para el resultado, no filtra memoria auxiliar y retorna memoria válida.
- Puntaje parcial: propuesto, si la función es mayormente correcta pero presenta incumplimientos acotados de implementación o manejo de memoria.
- Puntaje cero: no usa memoria dinámica para el resultado, reserva memoria insuficiente o excesiva de forma incompatible con el test, filtra memoria auxiliar, o retorna memoria inválida.

### P5 - Sanitizadores, depuración y ausencia de errores de ejecución

- Origen del puntaje: propuesto
- Puntaje máximo: 0.8 puntos propuestos
- Requisito evaluado: `make run-san` debe felicitar y no reportar problemas, por ejemplo goteras de memoria o desplazamientos indefinidos. `make run-g` debe felicitar.
- Evidencia esperada: salida de `make run-san`, `make run-g` y `resultados.txt`.
- Puntaje completo: ambos comandos finalizan correctamente, felicitan la ejecución y no reportan errores.
- Puntaje parcial: propuesto, si solo uno de los modos pasa o si hay advertencias menores que no impiden la ejecución, sujeto a revisión humana.
- Puntaje cero: hay errores de memoria, comportamiento indefinido, fallas bajo depuración, abortos o segmentation faults.

### P6 - Eficiencia respecto de la solución de referencia

- Origen del puntaje: propuesto
- Puntaje máximo: 0.2 puntos propuestos
- Requisito evaluado: `make run` debe felicitar por aprobar el modo de ejecución, y la solución no debe ser más de 80% más lenta que la solución de referencia.
- Evidencia esperada: salida de `make run` y benchmark incluido en `test-aislar.c`, para `aislar_palabras` y `palabras`.
- Puntaje completo: la solución aprueba el benchmark dentro de la tolerancia explícita de 80% sobre la referencia.
- Puntaje parcial: propuesto, no se recomienda puntaje parcial si el benchmark oficial rechaza la ejecución; cualquier excepción requiere revisión humana por condiciones de máquina.
- Puntaje cero: después de los intentos del test, excede en más del 80% la versión de referencia o no completa el benchmark.

## Descuentos, topes y reglas especiales - si corresponde

- Requisito para aprobar: el material indica explícitamente que `make run`, `make run-g` y `make run-san` son requerimientos para aprobar la tarea.
- Eficiencia: `make run` rechaza la prueba si la función solicitada es 80% más lenta que la solución de referencia. En `test-aislar.c`, la tolerancia definida es `TOLERANCIA 80`.
- Sanitizadores: `make run-san` debe felicitar y no reportar problemas como goteras de memoria o desplazamientos indefinidos.
- Memoria en `palabras`: debe pedirse exactamente la cantidad de bytes necesaria para el resultado; pedir más memoria puede hacer fallar el test de uso de memoria.
- Ambiente de prueba indicado: Debian 11 de 64 bits nativo o virtualizado; WSL 1 queda excluido y WSL 2 está permitido.
- Producto esperado: `aislar.zip` generado mediante `make zip`.

## Escala final

- Puntaje máximo original total: no especificado en los materiales.
- Puntaje máximo total propuesto: 6.0 puntos propuestos.
- Ponderación entre secciones: no corresponde.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales: funciones requeridas, comportamiento esperado, restricciones de uso de punteros, restricciones de memoria, comandos de prueba, tolerancia de eficiencia de 80%, producto `aislar.zip` y ambiente recomendado.
- Puntajes propuestos: todos los puntajes de criterios son propuestos, porque el material no entrega una distribución numérica original.
- Ambigüedad no resuelta: el material define condiciones para “aprobar”, pero no especifica una escala de puntaje ni una nota directa para fallas específicas.
- Requisitos no verificables solo con el enunciado: cumplimiento exacto de memoria y ausencia de comportamiento indefinido requieren ejecutar los tests y sanitizadores en un ambiente compatible.
