# Pauta de evaluación

## Alcance

Se evalúa la implementación de `pruebaSudoku(M)` en `CC3001_otoño_2023_tarea3.py` para resolver tableros de Sudoku 9x9 usando backtracking. La función debe recibir una matriz NumPy con ceros como casillas vacías y modificar esa misma matriz hasta dejarla igual a la solución esperada. La verificación pública considera los archivos `data/sudoku1.txt` a `data/sudoku7.txt` y `data/solsudoku1.txt` a `data/solsudoku7.txt`.

## Criterios

### P1 - Resolución correcta de los casos de prueba públicos

- Origen del puntaje: propuesto
- Puntaje máximo: 2.0
- Requisito evaluado: `pruebaSudoku(M)` completa correctamente los tableros entregados.
- Evidencia esperada: ejecución del programa base con los 7 casos públicos y comparación mediante `np.array_equal(A, B)`.
- Puntaje completo: los 7 casos públicos pasan sin errores de aserción.
- Puntaje parcial: propuesto, asignar proporcionalmente según la cantidad de casos públicos resueltos correctamente.
- Puntaje cero: ningún caso público queda igual a su solución esperada.

### P2 - Implementación mediante backtracking

- Origen del puntaje: propuesto
- Puntaje máximo: 1.5
- Requisito evaluado: la solución usa la estrategia requerida de prueba y error recursiva: probar valores posibles en celdas vacías, continuar recursivamente y retroceder si una elección no conduce a solución.
- Evidencia esperada: inspección del código de `pruebaSudoku` y funciones auxiliares.
- Puntaje completo: implementa backtracking funcional con retroceso explícito sobre celdas con `0`.
- Puntaje parcial: propuesto, para implementaciones que intentan búsqueda con retroceso pero tienen errores menores o incompletitud.
- Puntaje cero: no usa backtracking o reemplaza la tarea por una solución codificada para los casos dados.

### P3 - Validación de restricciones del Sudoku

- Origen del puntaje: propuesto
- Puntaje máximo: 1.5
- Requisito evaluado: al probar valores, respeta las reglas de Sudoku: no repetir dígitos del 1 al 9 en cada fila, columna y caja 3x3.
- Evidencia esperada: comportamiento observable en los tests e inspección de funciones auxiliares de validación.
- Puntaje completo: verifica correctamente filas, columnas y cajas 3x3 para todos los intentos.
- Puntaje parcial: propuesto, si valida solo algunas restricciones o presenta errores acotados.
- Puntaje cero: no valida las restricciones del Sudoku.

### P4 - Modificación de la matriz recibida

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0
- Requisito evaluado: `pruebaSudoku(M)` debe completar la misma matriz recibida como argumento.
- Evidencia esperada: luego de llamar `pruebaSudoku(A)`, la matriz `A` debe contener la solución esperada.
- Puntaje completo: modifica `M` in-place y deja la solución en la matriz original.
- Puntaje parcial: propuesto, si calcula una solución pero no siempre la copia correctamente a `M`.
- Puntaje cero: retorna otra matriz o valor sin modificar correctamente la matriz recibida.

### P5 - Uso permitido de NumPy y estructura compatible con el código base

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0
- Requisito evaluado: la solución usa arrays de NumPy y respeta que los únicos métodos de objetos tipo array permitidos son `array`, `zeros`, `ones`, `copy` y slices `[start:end]`.
- Evidencia esperada: inspección del código entregado.
- Puntaje completo: usa NumPy de forma compatible con las restricciones indicadas y mantiene la interfaz `def pruebaSudoku(M):`.
- Puntaje parcial: propuesto, si hay usos menores no permitidos que no reemplazan la lógica principal.
- Puntaje cero: no usa arrays NumPy o depende principalmente de métodos de array no permitidos.

## Descuentos, topes y reglas especiales - si corresponde

No corresponde.

## Escala final

- Puntaje máximo original total: no especificado en los materiales.
- Puntaje máximo propuesto total: 7.0
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales: se debe implementar `pruebaSudoku(M)`, resolver Sudoku 9x9, usar backtracking, modificar la matriz recibida, respetar restricciones de filas/columnas/cajas 3x3, usar NumPy con métodos permitidos y pasar los 7 tests públicos.
- Puntajes propuestos: todos los puntajes de criterios son propuestos porque el material no entrega una pauta numérica original.
- Ambigüedades no resueltas: el material no especifica puntajes, descuentos ni topes por incumplir restricciones de NumPy o por soluciones no generales.
- Requisitos no verificables completamente con el material: la corrección sobre un “tablero arbitrario” solo puede aproximarse con casos adicionales no provistos; la verificación pública cubre 7 tableros específicos.
