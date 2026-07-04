# Pauta de evaluación

## Alcance

Se evalúa la entrega de la Tarea 2 de CC4101 sobre parsing e intérpretes en `T2.rkt` y sus tests. La tarea incluye:

- Ejercicio 1: definición de AST para polinomios, parser de sintaxis concreta y reducción de polinomios con ambiente.
- Ejercicio 2: extensión del lenguaje `Expr`, parser, operaciones sobre valores complejos, sustitución e intérprete.

Se consideran además las reglas globales del enunciado: toda función debe tener firma, breve descripción coloquial y tests significativos; todo datatype definido con `deftype` debe tener descripción coloquial y gramática BNF.

## Secciones y ponderación - si corresponde

| Sección | Descripción | Ponderación | Puntaje máximo original |
|---|---:|---:|---:|
| E1 | Ejercicio 1: lenguaje de polinomios | 22/60 | 22 Pt |
| E2 | Ejercicio 2: lenguaje con complejos | 38/60 | 38 Pt |

## Criterios

### E1-A - Tipo de datos recursivo `Poly`

- Origen del puntaje: enunciado
- Puntaje máximo: 6 Pt
- Sección: E1
- Requisito evaluado: definición del datatype recursivo `Poly` que genera AST para la gramática dada: `poly`, `id`, `add`, `mul`, `if0`, `with`.
- Evidencia esperada: definición en `T2.rkt`, descripción coloquial y BNF asociada.
- Puntaje completo: `Poly` representa correctamente todos los constructores, sus campos y la estructura recursiva indicada.
- Puntaje parcial: propuesto para revisión humana: asignar proporcionalmente según constructores correctos, tipos/campos adecuados y recursión correcta.
- Puntaje cero: no se define `Poly`, no corresponde a la gramática, o el datatype debe ser ignorado por incumplir las reglas globales.

### E1-B - Sintaxis concreta y función `parse`

- Origen del puntaje: enunciado
- Puntaje máximo: 6 Pt
- Sección: E1
- Requisito evaluado: definición de sintaxis concreta y función `parse :: <s-poly> -> Poly`.
- Evidencia esperada: BNF o descripción de sintaxis concreta en `T2.rkt`, implementación de `parse` y tests en archivo de tests.
- Puntaje completo: `parse` produce los AST esperados para números, símbolos, listas de coeficientes, suma, producto, `if0` y `with`, siguiendo los ejemplos del enunciado.
- Puntaje parcial: propuesto para revisión humana: asignar proporcionalmente según soporte correcto de cada forma sintáctica y normalización de polinomios como en los ejemplos.
- Puntaje cero: `parse` no está implementada, no retorna valores `Poly`, o debe ser ignorada por incumplir las reglas globales.

### E1-C - Función `reduce`

- Origen del puntaje: enunciado
- Puntaje máximo: 10 Pt
- Sección: E1
- Requisito evaluado: implementación de `reduce :: Poly Env -> Poly`, que reduce cualquier expresión del lenguaje a un polinomio puro.
- Evidencia esperada: implementación en `T2.rkt`, uso de `Env`, `empty-env`, `extend-env` y `env-lookup`, y tests.
- Puntaje completo: reduce correctamente polinomios, identificadores definidos, suma, producto, `if0` y `with`; normaliza polinomios según los ejemplos; ante identificadores libres lanza error con mensaje equivalente a `reduce: variable x is not defined`.
- Puntaje parcial: propuesto para revisión humana: asignar proporcionalmente según manejo correcto de cada constructor y del ambiente.
- Puntaje cero: `reduce` no está implementada, no retorna polinomios puros, o debe ser ignorada por incumplir las reglas globales.

### E2-A - Extensión de `Expr` y su BNF

- Origen del puntaje: enunciado
- Puntaje máximo: 6 Pt
- Sección: E2
- Requisito evaluado: extender `Expr` y su gramática BNF con números reales, números imaginarios y una forma de `with` con varias definiciones locales.
- Evidencia esperada: definición actualizada de `Expr` en `T2.rkt`, descripción coloquial y BNF.
- Puntaje completo: `Expr` incluye las formas necesarias para reales, imaginarios, identificadores, suma, resta, `if0` y `with` con lista de definiciones, compatible con los ejemplos.
- Puntaje parcial: propuesto para revisión humana: asignar proporcionalmente según incorporación correcta de reales/imaginarios, `with` múltiple y BNF.
- Puntaje cero: no se extiende `Expr`, la extensión es incompatible con los ejemplos, o el datatype debe ser ignorado por incumplir las reglas globales.

### E2-B - Función `parser`

- Origen del puntaje: enunciado
- Puntaje máximo: 6 Pt
- Sección: E2
- Requisito evaluado: implementación de `parser :: <s-expr> -> Expr`.
- Evidencia esperada: implementación en `T2.rkt` y tests.
- Puntaje completo: parsea correctamente reales, imaginarios, suma, resta, `if0`, identificadores y `with` con una o más definiciones; para `(with [] 1)` lanza excepción con mensaje `parser: *with* expects at least one definition`.
- Puntaje parcial: propuesto para revisión humana: asignar proporcionalmente según formas sintácticas soportadas y manejo correcto del error exigido.
- Puntaje cero: `parser` no está implementada, no retorna `Expr`, o debe ser ignorada por incumplir las reglas globales.

### E2-C - Conversión y operaciones sobre `CValue`

- Origen del puntaje: enunciado
- Puntaje máximo: 6 Pt
- Sección: E2
- Requisito evaluado: implementación de `from-CValue`, `cmplx+`, `cmplx-` y `cmplx0?`.
- Evidencia esperada: implementaciones en `T2.rkt` y tests.
- Puntaje completo: `from-CValue` convierte correctamente valores complejos a expresiones; `cmplx+` suma partes real e imaginaria; `cmplx-` resta partes real e imaginaria; `cmplx0?` retorna `#t` exactamente para el complejo cero.
- Puntaje parcial: propuesto para revisión humana: asignar proporcionalmente entre las cuatro funciones según corrección observable.
- Puntaje cero: las funciones no están implementadas, no operan sobre `CValue`, o deben ser ignoradas por incumplir las reglas globales.

### E2-D - Función `subst`

- Origen del puntaje: enunciado
- Puntaje máximo: 10 Pt
- Sección: E2
- Requisito evaluado: implementación de `subst :: Expr Symbol Expr -> Expr` considerando sustitución bajo `with` con múltiples definiciones, alcance secuencial y shadowing.
- Evidencia esperada: implementación en `T2.rkt` y tests que cubran los ejemplos con y sin shadowing.
- Puntaje completo: sustituye correctamente en expresiones, en listas de definiciones de `with`, respeta que definiciones posteriores pueden usar identificadores anteriores y evita sustituir variables oscurecidas.
- Puntaje parcial: propuesto para revisión humana: asignar proporcionalmente según manejo correcto de formas básicas, listas de definiciones y shadowing.
- Puntaje cero: `subst` no está implementada, captura variables incorrectamente, ignora el shadowing, o debe ser ignorada por incumplir las reglas globales.

### E2-E - Función `interp`

- Origen del puntaje: enunciado
- Puntaje máximo: 10 Pt
- Sección: E2
- Requisito evaluado: implementación de `interp :: Expr -> CValue`.
- Evidencia esperada: implementación en `T2.rkt` y tests.
- Puntaje completo: interpreta correctamente reales, imaginarios, suma, resta, `if0`, identificadores y `with`; reduce a valores `CValue`; ante variables libres lanza error con mensaje `Free occurrence of a variable`.
- Puntaje parcial: propuesto para revisión humana: asignar proporcionalmente según manejo correcto de cada forma del lenguaje y del error exigido.
- Puntaje cero: `interp` no está implementada, no retorna `CValue`, no detecta variables libres, o debe ser ignorada por incumplir las reglas globales.

## Descuentos, topes y reglas especiales - si corresponde

- Regla global de funciones: toda función debe estar acompañada por firma, breve descripción coloquial en `T2.rkt` y un conjunto significativo de tests. Si no cumple, será ignorada.
- Regla global de datatypes: todo datatype definido con `deftype` debe estar acompañado por breve descripción coloquial y gramática BNF. Si no cumple, será ignorado.
- Evidencia necesaria: comentarios/documentación en `T2.rkt` y tests en el archivo de tests entregado.
- No se especifican otros descuentos, topes de nota ni notas directas en los materiales.

## Escala final

- Puntaje máximo original total: 60 Pt
- Puntaje máximo original por sección:
  - E1: 22 Pt
  - E2: 38 Pt
- Ponderación entre secciones: E1 = 22/60, E2 = 38/60
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales: puntajes por ejercicio y subparte, firmas esperadas, constructores indicados, mensajes de error exigidos y regla de ignorar funciones/datatypes sin documentación/tests.
- Puntajes o niveles propuestos: la distribución interna de puntaje parcial dentro de cada subparte no está especificada; debe revisarse humanamente.
- Ambigüedad no resuelta: el enunciado menciona tests en `test.rkt`, mientras el material entregado incluye `T2_tests.rkt`.
- Ambigüedad no resuelta: la sintaxis concreta de suma/producto de polinomios muestra elipsis en comentarios, pero los ejemplos usan formas binarias.
- Requisitos no verificables solo con el material: qué se considera exactamente un “conjunto significativo de tests”.
