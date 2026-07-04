# Pauta de evaluación

## Alcance

Se evalúa la entrega de la Tarea 3 de CC4101, implementada principalmente en `T3.rkt`, junto con tests significativos en el archivo de tests indicado por el material. La tarea cubre:

- Ejercicio 1: typechecking e interpretación de un lenguaje con números, booleanos, condicionales, identificadores y funciones de primera clase de un argumento.
- Ejercicio 2: parsing, reducción y pattern matching para un lenguaje con números, suma, variables, `nil`, `cons`, listas y `match`.

También se evalúan las exigencias generales del enunciado:

- Toda función debe tener firma, breve descripción coloquial en `T3.rkt` y tests significativos.
- Todo datatype definido por el usuario mediante `deftype` debe tener breve descripción coloquial y gramática BNF.
- Si una función o datatype no cumple esas reglas, será ignorado.

## Secciones y ponderación - si corresponde

| Sección | Descripción | Ponderación | Puntaje máximo original |
|---|---:|---:|---:|
| E1 | Typechecking y funciones de primera clase | 30 Pt de 60 Pt | 30 Pt |
| E2 | Pattern matching | 30 Pt de 60 Pt | 30 Pt |

## Criterios

### E1A - `parse-type`

- Origen del puntaje: enunciado
- Puntaje máximo: 2 Pt
- Sección: E1
- Requisito evaluado: implementar `parse-type :: <s-type> -> Type`, recursiva, para tipos `Number`, `Boolean` y flechas `(-> <s-type> <s-type>)`.
- Evidencia esperada: función `parse-type` en `T3.rkt`; tests que cubran los ejemplos del enunciado.
- Puntaje completo: retorna `(numT)`, `(boolT)` y `(arrowT ...)` correctamente, incluyendo tipos flecha anidados; rechaza tipos inválidos con error como `parse-type: invalid type String`.
- Puntaje parcial: propuesto para revisión humana: hasta 0.8 Pt por tipos base; hasta 0.8 Pt por tipos flecha recursivos; hasta 0.4 Pt por manejo de tipos inválidos.
- Puntaje cero: no implementa `parse-type`, no retorna valores del datatype `Type`, o la función queda ignorada por incumplir las reglas generales.

### E1B - Extensión de gramática y datatype `Expr` para funciones

- Origen del puntaje: enunciado
- Puntaje máximo: 4 Pt
- Sección: E1
- Requisito evaluado: extender la gramática BNF y el datatype `Expr` para soportar definición y aplicación de funciones de primera clase de un argumento, con tipo explícito del argumento.
- Evidencia esperada: BNF actualizada en `T3.rkt`; `deftype Expr` extendido; constructores compatibles con los ejemplos `(fun 'x (numT) ...)` y `(app ... ...)`.
- Puntaje completo: la sintaxis abstracta permite representar funciones con identificador, tipo de argumento y cuerpo, y aplicaciones de función a argumento.
- Puntaje parcial: propuesto para revisión humana: hasta 1 Pt por BNF coherente; hasta 1.5 Pt por representación abstracta de funciones; hasta 1.5 Pt por representación abstracta de aplicaciones.
- Puntaje cero: no extiende `Expr`, no permite representar funciones o aplicaciones, o el datatype queda ignorado por incumplir las reglas generales.

### E1C - `parse`

- Origen del puntaje: enunciado
- Puntaje máximo: 7 Pt
- Sección: E1
- Requisito evaluado: implementar `parse :: <s-expr> -> Expr`, transformando programas en sintaxis concreta a sintaxis abstracta.
- Evidencia esperada: función `parse` en `T3.rkt`; tests para números, booleanos, símbolos, `+`, `*`, `<`, `if`, `fun` y aplicación.
- Puntaje completo: parsea correctamente todo el lenguaje base y las extensiones de funciones/aplicaciones, usando `parse-type` para los tipos anotados.
- Puntaje parcial: propuesto para revisión humana: hasta 1.5 Pt por constantes e identificadores; hasta 2 Pt por operaciones aritméticas, comparación y condicional; hasta 2 Pt por funciones con tipo explícito; hasta 1.5 Pt por aplicaciones.
- Puntaje cero: no implementa `parse`, produce estructuras que no pertenecen a `Expr`, o la función queda ignorada por incumplir las reglas generales.

### E1D - `check-type`

- Origen del puntaje: enunciado
- Puntaje máximo: 7 Pt
- Sección: E1
- Requisito evaluado: implementar `check-type :: Expr TypeEnv -> Type` según las reglas de typechecking dadas.
- Evidencia esperada: función `check-type` en `T3.rkt`; uso de `TypeEnv`; tests para casos bien tipados y errores indicados.
- Puntaje completo: infiere/verifica correctamente tipos de números, booleanos, identificadores, suma, multiplicación, menor que, condicionales, funciones y aplicaciones; arroja errores con mensajes como los ejemplos del enunciado.
- Puntaje parcial: propuesto para revisión humana: hasta 1 Pt por constantes e identificadores; hasta 2 Pt por operaciones `+`, `*`, `<`; hasta 1.5 Pt por `if`; hasta 1.5 Pt por funciones; hasta 1 Pt por aplicación y errores de aplicación.
- Puntaje cero: no implementa `check-type`, acepta programas mal tipados esenciales, no retorna valores `Type`, o la función queda ignorada por incumplir las reglas generales.

### E1E - `interp`

- Origen del puntaje: enunciado
- Puntaje máximo: 7 Pt
- Sección: E1
- Requisito evaluado: implementar `interp :: Expr Env -> Value`, evaluando expresiones bien tipadas a valores del lenguaje.
- Evidencia esperada: función `interp` en `T3.rkt`; uso de `Env`; tests sobre evaluación de expresiones bien tipadas.
- Puntaje completo: evalúa números, booleanos, identificadores, operaciones, comparación, condicionales, funciones como closures y aplicaciones con ambiente correcto.
- Puntaje parcial: propuesto para revisión humana: hasta 3 Pt por lenguaje base; hasta 2 Pt por closures; hasta 2 Pt por aplicación y manejo correcto del ambiente.
- Puntaje cero: no implementa `interp`, no produce valores `Value`, no respeta ambientes, o la función queda ignorada por incumplir las reglas generales.

### E1F - `run`

- Origen del puntaje: enunciado
- Puntaje máximo: 3 Pt
- Sección: E1
- Requisito evaluado: implementar `run :: <s-expr> -> Value`, reduciendo programas en sintaxis concreta a valores si y solo si están bien tipados.
- Evidencia esperada: función `run` en `T3.rkt`; tests que verifiquen parsing, chequeo de tipos previo e interpretación.
- Puntaje completo: compone parsing, typechecking e interpretación en el orden correcto; no interpreta programas mal tipados.
- Puntaje parcial: propuesto para revisión humana: hasta 1 Pt por usar `parse`; hasta 1 Pt por ejecutar `check-type` antes de interpretar; hasta 1 Pt por retornar el resultado de `interp` en programas bien tipados.
- Puntaje cero: no implementa `run`, omite el chequeo de tipos, o la función queda ignorada por incumplir las reglas generales.

### E2A - `parser` para `Prog` y listas

- Origen del puntaje: enunciado
- Puntaje máximo: 6 Pt
- Sección: E2
- Requisito evaluado: implementar `parser :: <s-prog> -> Prog` para números, variables, suma, `nil`, `cons` y azúcar sintáctico `list`.
- Evidencia esperada: función `parser` en `T3.rkt`; tests para los ejemplos `(nil)`, `(cons 1 2)` y `(list 1 2 3)`.
- Puntaje completo: parsea correctamente el lenguaje base y expande listas a combinaciones de `conz` y `nil`.
- Puntaje parcial: propuesto para revisión humana: hasta 1 Pt por números y variables; hasta 1 Pt por suma; hasta 1 Pt por `nil`; hasta 1.5 Pt por `cons`; hasta 1.5 Pt por azúcar `list`.
- Puntaje cero: no implementa `parser`, no retorna valores `Prog`, o la función queda ignorada por incumplir las reglas generales.

### E2B - `parse-pattern`

- Origen del puntaje: enunciado
- Puntaje máximo: 4 Pt
- Sección: E2
- Requisito evaluado: implementar `parse-pattern :: <s-prog> -> Pattern` para números, variables, `nil`, `cons` y `list`.
- Evidencia esperada: función `parse-pattern` en `T3.rkt`; tests para los ejemplos del enunciado.
- Puntaje completo: transforma patrones concretos en `numP`, `varP`, `nilP` y `conzP`, incluyendo expansión de listas.
- Puntaje parcial: propuesto para revisión humana: hasta 1 Pt por números; hasta 1 Pt por variables; hasta 1 Pt por `nil`; hasta 1 Pt por `cons` y `list`.
- Puntaje cero: no implementa `parse-pattern`, no retorna valores `Pattern`, o la función queda ignorada por incumplir las reglas generales.

### E2C - `generate-substs`

- Origen del puntaje: enunciado
- Puntaje máximo: 6 Pt
- Sección: E2
- Requisito evaluado: implementar `generate-substs :: Pattern PValue -> (Result String (Listof (Symbol * PValue)))`, retornando sustituciones o error explícito.
- Evidencia esperada: función en `T3.rkt`; tests para números, variables, `nil`, `conz`, éxitos y fallas con mensajes indicados.
- Puntaje completo: detecta calce correcto de patrones numéricos, variables, `nil` y constructores `cons`; combina sustituciones; retorna `(success ...)` o `(failure "...")` sin lanzar excepción.
- Puntaje parcial: propuesto para revisión humana: hasta 1 Pt por patrones numéricos; hasta 1 Pt por variables; hasta 1 Pt por `nil`; hasta 2 Pt por `conzP`; hasta 1 Pt por mensajes de error y uso correcto de `Result`.
- Puntaje cero: no implementa la función, lanza excepciones en vez de retornar `failure`, no retorna valores `Result`, o la función queda ignorada por incumplir las reglas generales.

### E2D - `reduce`

- Origen del puntaje: enunciado
- Puntaje máximo: 6 Pt
- Sección: E2
- Requisito evaluado: implementar `reduce :: Prog (Listof (Symbol * PValue)) -> PValue`.
- Evidencia esperada: función `reduce` en `T3.rkt`; tests para números, suma, variables, `nil` y `conz`.
- Puntaje completo: reduce programas a `PValue`, usando el ambiente de sustituciones para variables y respetando que `nil` y `conz` son valores cuando sus componentes son valores.
- Puntaje parcial: propuesto para revisión humana: hasta 1 Pt por números; hasta 1.5 Pt por suma mediante valores numéricos; hasta 1 Pt por variables; hasta 1 Pt por `nil`; hasta 1.5 Pt por `conz`.
- Puntaje cero: no implementa `reduce`, no retorna `PValue`, no usa sustituciones para variables, o la función queda ignorada por incumplir las reglas generales.

### E2E - Extensión con `match`

- Origen del puntaje: enunciado
- Puntaje máximo: 6 Pt
- Sección: E2
- Requisito evaluado: extender la BNF, el datatype `Prog`, `parser` y `reduce` para soportar expresiones `match`.
- Evidencia esperada: BNF y `Prog` extendidos en `T3.rkt`; parser para casos `[pat expr]`; reducción de `match`; tests para los ejemplos del enunciado.
- Puntaje completo: parsea `match` con al menos un caso, rechaza `match` sin casos con `SyntaxError: match expression must have at least one case`, evalúa el primer patrón que calza usando `generate-substs`, y falla con `MatchError: expression does not match any pattern` si ninguno calza.
- Puntaje parcial: propuesto para revisión humana: hasta 1 Pt por BNF/datatype; hasta 1.5 Pt por parsing de `match`; hasta 1 Pt por error sintáctico sin casos; hasta 2 Pt por reducción con selección de caso y sustituciones; hasta 0.5 Pt por error cuando no hay calce.
- Puntaje cero: no soporta `match`, no modifica las estructuras necesarias, o los componentes quedan ignorados por incumplir las reglas generales.

### E2F - Pregunta conceptual sobre `generate-substs`

- Origen del puntaje: enunciado
- Puntaje máximo: 2 Pt
- Sección: E2
- Requisito evaluado: responder por qué es útil que `generate-substs` retorne un mensaje de error en vez de arrojar una excepción.
- Evidencia esperada: respuesta escrita en la sección correspondiente de `T3.rkt`.
- Puntaje completo: explica que retornar `failure` permite manejo explícito de errores, continuar el proceso de pattern matching y distinguir éxito/falla sin abortar la ejecución.
- Puntaje parcial: propuesto para revisión humana: hasta 1 Pt por mencionar manejo explícito de errores; hasta 1 Pt por relacionarlo con pattern matching o continuidad de evaluación.
- Puntaje cero: no responde, o la respuesta no se relaciona con `Result`, errores explícitos o pattern matching.

## Descuentos, topes y reglas especiales - si corresponde

- Regla explícita de funciones: toda función debe tener firma, breve descripción coloquial en `T3.rkt` y tests significativos. Si no cumple, la función será ignorada. Efecto: los criterios que dependan de esa función reciben 0 en la parte no verificable.
- Regla explícita de datatypes: todo datatype definido por el usuario mediante `deftype` debe tener breve descripción coloquial y gramática BNF. Si no cumple, el datatype será ignorado. Efecto: los criterios que dependan de ese datatype reciben 0 en la parte no verificable.
- No se especifican otros descuentos, topes de nota o notas directas en el material entregado.

## Escala final

- Puntaje máximo original por sección:
  - E1: 30 Pt
  - E2: 30 Pt
- Puntaje máximo original total: 60 Pt
- Ponderación entre secciones: E1 30/60 y E2 30/60
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales:
  - Los puntajes originales son 30 Pt para Ejercicio 1 y 30 Pt para Ejercicio 2.
  - Cada subparte tiene puntaje explícito en el enunciado.
  - La regla de ignorar funciones/datatypes sin firma, descripción, tests o BNF está explícita.
  - La nota del benchmark debe estar entre 1.0 y 7.0 con un decimal.
- Puntajes o niveles propuestos:
  - Todas las distribuciones internas de puntaje parcial dentro de cada subparte son propuestas para revisión humana; el enunciado solo fija el máximo de cada subparte.
- Ambigüedades no resueltas:
  - El enunciado menciona tests en `test.rkt`, pero el material público incluye `T3_tests.rkt`.
  - En Ejercicio 2C, un ejemplo de sustitución usa `(numV 3)`, aunque el datatype `PValue` define `(numerical n)`.
  - En `T3.rkt` aparece el comentario `generate-subst`, mientras que el enunciado pide `generate-substs`.
- Requisitos no verificables con el material disponible:
  - No se entrega una pauta de tests oficial ni una distribución interna de casos de prueba.
  - No se especifican penalizaciones administrativas ni condiciones de entrega externas a la solución.
