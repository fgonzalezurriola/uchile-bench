# Pauta de evaluación

## Alcance

Se evalúa la entrega de la Tarea 1 de CC4101, implementada en Racket con `#lang play`, principalmente en `T1.rkt`, y acompañada por tests según lo indicado en el enunciado.

La tarea evalúa:

- definición del datatype recursivo `Prop`;
- funciones sobre proposiciones booleanas;
- generación y evaluación de ambientes;
- conversión de proposiciones a forma normal disyuntiva;
- definición y uso de `fold-prop`.

Regla global extraída del enunciado: toda función debe tener firma, breve descripción coloquial en `T1.rkt` y un conjunto significativo de tests en `test.rkt`; todo datatype definido con `deftype` debe tener descripción coloquial y gramática BNF. Si una función o datatype no cumple estas reglas, será ignorado.

## Secciones y ponderación - si corresponde

| Sección | Identificador | Puntaje máximo original | Ponderación |
|---|---:|---:|---:|
| Ejercicio 1 | E1 | 29 Pt | 29/60 |
| Ejercicio 2 | E2 | 12 Pt | 12/60 |
| Ejercicio 3 | E3 | 19 Pt | 19/60 |

## Criterios

### E1A - Definición del datatype `Prop`

- Origen del puntaje: enunciado
- Puntaje máximo: 4 Pt
- Sección: E1
- Requisito evaluado: definir el tipo de datos recursivo `Prop` con constructores para variables, conjunción, disyunción y negación.
- Evidencia esperada: definición en `T1.rkt` usando `deftype`, descripción coloquial y gramática BNF.
- Puntaje completo: `Prop` representa correctamente nombres `String`, `andp`, `orp` y `notp`, y está acompañado por descripción y BNF.
- Puntaje parcial: según grado de completitud de la definición; propuesto para revisión humana: descontar por constructores faltantes o tipos de campos incorrectos.
- Puntaje cero: no se define `Prop`, no es recursivo, no permite representar las formas exigidas, o debe ser ignorado por incumplir descripción/BNF.

### E1B - Función `occurrences`

- Origen del puntaje: enunciado
- Puntaje máximo: 5 Pt
- Sección: E1
- Requisito evaluado: definir `occurrences :: Prop String -> Number` usando recursión explícita.
- Evidencia esperada: implementación en `T1.rkt`, firma, descripción, tests y comportamiento observable con variables, conjunciones, disyunciones y negaciones.
- Puntaje completo: retorna correctamente la cantidad de apariciones de una variable en cualquier proposición.
- Puntaje parcial: según cobertura de casos de `Prop` y uso correcto de recursión explícita; niveles específicos propuestos para revisión humana.
- Puntaje cero: función ausente, no retorna conteos correctos, no recorre recursivamente la proposición, o debe ser ignorada por incumplir firma/descripción/tests.

### E1C - Función `vars`

- Origen del puntaje: enunciado
- Puntaje máximo: 5 Pt
- Sección: E1
- Requisito evaluado: definir `vars :: Prop -> (Listof String)` usando recursión explícita.
- Evidencia esperada: implementación en `T1.rkt`, firma, descripción, tests y salida sin duplicados.
- Puntaje completo: retorna todos los nombres de variables que aparecen en la proposición, sin duplicados.
- Puntaje parcial: según cobertura de casos y manejo de duplicados; niveles específicos propuestos para revisión humana.
- Puntaje cero: función ausente, omite variables, incluye duplicados de forma incorrecta, no usa recursión explícita, o debe ser ignorada por incumplir firma/descripción/tests.

### E1D - Función `all-environments`

- Origen del puntaje: enunciado
- Puntaje máximo: 5 Pt
- Sección: E1
- Requisito evaluado: definir recursivamente `all-environments :: (Listof String) -> (Listof (Listof (Pair String Boolean)))`.
- Evidencia esperada: implementación en `T1.rkt`, firma, descripción, tests y generación de todos los ambientes posibles para una lista sin duplicados.
- Puntaje completo: genera exactamente todas las combinaciones de valores booleanos para las variables dadas, incluyendo el caso de lista vacía.
- Puntaje parcial: según manejo del caso base, combinación de valores `#t`/`#f` y estructura de pares esperada; niveles específicos propuestos para revisión humana.
- Puntaje cero: función ausente, no genera ambientes válidos, no cubre todos los casos, o debe ser ignorada por incumplir firma/descripción/tests.

### E1E - Función `eval`

- Origen del puntaje: enunciado
- Puntaje máximo: 5 Pt
- Sección: E1
- Requisito evaluado: definir `eval :: Prop (Listof (Pair String Boolean)) -> Boolean` usando recursión explícita.
- Evidencia esperada: implementación en `T1.rkt`, firma, descripción, tests y evaluación correcta según un ambiente sin variables repetidas.
- Puntaje completo: evalúa correctamente variables, conjunciones, disyunciones y negaciones; si una variable no aparece en el ambiente, lanza el error especificado: `eval: variable a is not defined in environment`.
- Puntaje parcial: según cobertura de constructores, búsqueda correcta en el ambiente y manejo del error; niveles específicos propuestos para revisión humana.
- Puntaje cero: función ausente, evaluación incorrecta, no maneja variables no definidas como se especifica, no usa recursión explícita, o debe ser ignorada por incumplir firma/descripción/tests.

### E1F - Función `tautology?`

- Origen del puntaje: enunciado
- Puntaje máximo: 5 Pt
- Sección: E1
- Requisito evaluado: definir recursivamente `tautology? :: Prop -> Boolean`.
- Evidencia esperada: implementación en `T1.rkt`, firma, descripción, tests y uso observable de evaluación sobre ambientes posibles.
- Puntaje completo: retorna `#t` si la proposición es verdadera para todo ambiente de evaluación y `#f` en caso contrario.
- Puntaje parcial: según generación/uso correcto de variables y ambientes, y evaluación universal; niveles específicos propuestos para revisión humana.
- Puntaje cero: función ausente, clasifica incorrectamente tautologías o contradicciones, o debe ser ignorada por incumplir firma/descripción/tests.

### E2A - Función `simplify-negations`

- Origen del puntaje: enunciado
- Puntaje máximo: 3 Pt
- Sección: E2
- Requisito evaluado: definir `simplify-negations :: Prop -> Prop` usando recursión explícita.
- Evidencia esperada: implementación en `T1.rkt`, firma, descripción, tests y aplicación de doble negación y leyes de De Morgan.
- Puntaje completo: recorre la estructura una sola vez y aplica correctamente las transformaciones disponibles en ese recorrido.
- Puntaje parcial: según aplicación correcta de cada transformación y respeto del recorrido único; niveles específicos propuestos para revisión humana.
- Puntaje cero: función ausente, no transforma negaciones según lo indicado, aplica iteraciones extra no solicitadas, no usa recursión explícita, o debe ser ignorada por incumplir firma/descripción/tests.

### E2B - Función `distribute-and`

- Origen del puntaje: enunciado
- Puntaje máximo: 3 Pt
- Sección: E2
- Requisito evaluado: definir `distribute-and :: Prop -> Prop` usando recursión explícita.
- Evidencia esperada: implementación en `T1.rkt`, firma, descripción, tests y aplicación de distributividad de `andp` sobre `orp`.
- Puntaje completo: recorre la estructura una sola vez y aplica correctamente ambas reglas de distributividad cuando corresponden.
- Puntaje parcial: según aplicación correcta de una o ambas reglas y respeto del recorrido único; niveles específicos propuestos para revisión humana.
- Puntaje cero: función ausente, no distribuye correctamente, aplica iteraciones extra no solicitadas, no usa recursión explícita, o debe ser ignorada por incumplir firma/descripción/tests.

### E2C - Función `apply-until`

- Origen del puntaje: enunciado
- Puntaje máximo: 3 Pt
- Sección: E2
- Requisito evaluado: definir recursivamente `apply-until :: (a -> a) (a a -> Boolean) -> a -> a`.
- Evidencia esperada: implementación en `T1.rkt`, firma, descripción, tests y comportamiento como función de orden superior.
- Puntaje completo: retorna una nueva función que aplica `f` repetidamente hasta que el predicado sobre los dos últimos resultados retorna `#t`.
- Puntaje parcial: según manejo correcto de la función retornada, comparación entre valores consecutivos y caso de término; niveles específicos propuestos para revisión humana.
- Puntaje cero: función ausente, no retorna una función, no aplica repetidamente `f`, no usa el predicado como se especifica, o debe ser ignorada por incumplir firma/descripción/tests.

### E2D - Función `DNF`

- Origen del puntaje: enunciado
- Puntaje máximo: 3 Pt
- Sección: E2
- Requisito evaluado: definir `DNF :: Prop -> Prop`.
- Evidencia esperada: implementación en `T1.rkt`, firma, descripción, tests y resultado en forma normal disyuntiva.
- Puntaje completo: aplica primero `simplify-negations` tantas veces como sea necesario y luego `distribute-and` tantas veces como sea necesario, hasta alcanzar la forma normal disyuntiva.
- Puntaje parcial: según orden correcto de fases, repetición hasta punto fijo y uso de igualdad como `equal?` si corresponde; niveles específicos propuestos para revisión humana.
- Puntaje cero: función ausente, no aplica ambas fases, las aplica en orden incorrecto, no itera hasta que no haya cambios, o debe ser ignorada por incumplir firma/descripción/tests.

### E3A - Función `fold-prop`

- Origen del puntaje: enunciado
- Puntaje máximo: 4 Pt
- Sección: E3
- Requisito evaluado: definir `fold-prop :: (String -> a) (a a -> a) (a a -> a) (a -> a) -> Prop -> a`.
- Evidencia esperada: implementación en `T1.rkt`, firma, descripción, tests y captura del esquema de recursión asociado a `Prop`.
- Puntaje completo: abstrae correctamente los cuatro casos del datatype `Prop` y permite procesar proposiciones sin repetir recursión estructural.
- Puntaje parcial: según cobertura correcta de los casos `varp`, `andp`, `orp` y `notp`; niveles específicos propuestos para revisión humana.
- Puntaje cero: función ausente, no corresponde a un fold sobre `Prop`, omite casos del datatype, o debe ser ignorada por incumplir firma/descripción/tests.

### E3B - Redefiniciones usando `fold-prop`

- Origen del puntaje: enunciado
- Puntaje máximo: 15 Pt
- Sección: E3
- Requisito evaluado: redefinir `occurrences`, `vars`, `eval`, `simplify-negations` y `distribute-and` usando `fold-prop` en vez de recursión explícita.
- Evidencia esperada: implementaciones en `T1.rkt` para `occurrences-2`, `vars-2`, `eval-2`, `simplify-negations-2` y `distribute-and-2`, con firma, descripción, tests y uso de `fold-prop`.
- Puntaje completo: las cinco funciones redefinidas tienen el mismo comportamiento especificado para sus versiones originales y usan `fold-prop`; si requieren funciones auxiliares como argumentos de `fold-prop`, estas se definen con funciones anónimas.
- Puntaje parcial: propuesto para revisión humana: distribuir 3 Pt por cada redefinición correcta; dentro de cada una, considerar comportamiento correcto, uso efectivo de `fold-prop` y ausencia de recursión explícita.
- Puntaje cero: no se entregan redefiniciones, no usan `fold-prop`, mantienen recursión explícita como mecanismo principal, o deben ser ignoradas por incumplir firma/descripción/tests.

## Descuentos, topes y reglas especiales - si corresponde

- Regla de funciones: toda función debe incluir firma, breve descripción coloquial en `T1.rkt` y un conjunto significativo de tests en `test.rkt`. Si no cumple, será ignorada. Efecto: el criterio asociado a esa función no debe recibir puntaje por comportamiento aunque la implementación exista.
- Regla de datatypes: todo datatype definido por el usuario mediante `deftype` debe incluir breve descripción coloquial y gramática BNF. Si no cumple, será ignorado. Efecto: el criterio asociado al datatype `Prop` no debe recibir puntaje.
- Variables no definidas en `eval`: debe lanzarse el error con el formato especificado, por ejemplo `eval: variable a is not defined in environment`.

## Escala final

- Puntaje máximo original total: 60 Pt
  - E1: 29 Pt
  - E2: 12 Pt
  - E3: 19 Pt
- Ponderación entre secciones: proporcional al puntaje original de cada ejercicio sobre 60 Pt.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales: puntajes por ejercicio y subparte, firmas esperadas, obligación de usar recursión explícita en las partes indicadas, obligación de usar `fold-prop` en E3B y regla de ignorar funciones/datatypes sin documentación/tests requeridos.
- Puntajes o niveles propuestos: los niveles de puntaje parcial no están detallados en el material; se proponen para revisión humana. En E3B se propone distribuir 15 Pt como 3 Pt por cada una de las cinco redefiniciones.
- Ambigüedad no resuelta: el enunciado exige tests en `test.rkt`, mientras el material entregado incluye `T1_tests.rkt`. Debe confirmarse qué archivo de tests será aceptado.
- Requisitos no verificables solo desde el material: qué se considera exactamente un “conjunto significativo de tests” no está cuantificado; requiere juicio del evaluador.
