# Pauta de evaluación

## Alcance

Se evalúa la implementación de la función `codigo` de la clase `Arbol` para generar una lista de instrucciones elementales que evalúen la fórmula representada por el árbol ya construido. Las fórmulas consideradas contienen variables de una letra, números de un dígito, operadores `+`, `-`, `*`, `/`, paréntesis y no incluyen espacios ni menos unario.

También se evalúa que se agreguen tres ejemplos adicionales a los casos de prueba entregados. No se evalúa la implementación del parser ni la visualización con `dibujar`, salvo que cambios del estudiante afecten el funcionamiento requerido de `codigo`.

## Criterios

### P1 - Implementación de `Arbol.codigo`

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0
- Requisito evaluado: la función `codigo` está implementada en la clase `Arbol` y retorna una lista de Python con el código generado.
- Evidencia esperada: archivo fuente con `Arbol.codigo`; ejecución de `probar(formula)`.
- Puntaje completo: `codigo` reemplaza la lista provisoria y retorna una lista, sin imprimir directamente las instrucciones como mecanismo principal.
- Puntaje parcial: propuesto; hasta 0.5 si la función genera instrucciones pero no respeta completamente la interfaz esperada.
- Puntaje cero: mantiene la implementación provisoria o no existe una implementación funcional de `codigo`.

### P2 - Recorrido correcto del árbol de fórmula

- Origen del puntaje: propuesto
- Puntaje máximo: 1.5
- Requisito evaluado: el árbol se recorre para generar instrucciones que respeten la estructura sintáctica de la fórmula ya parseada.
- Evidencia esperada: resultados para fórmulas como `a+1`, `(a+b)*(c-d)`, `(2-p*q)*(1/n+1/(p+q))` y fórmulas anidadas.
- Puntaje completo: genera primero el código de los subárboles necesarios y luego la instrucción correspondiente al nodo operador, respetando paréntesis, precedencia y asociatividad ya codificadas en el árbol.
- Puntaje parcial: propuesto; hasta 1.0 si funciona para expresiones simples pero falla en anidamientos o combinaciones de operadores; hasta 0.5 si solo funciona para un patrón específico.
- Puntaje cero: no usa correctamente la estructura del árbol o genera código incompatible con la fórmula.

### P3 - Formato de instrucciones elementales

- Origen del puntaje: propuesto
- Puntaje máximo: 1.3
- Requisito evaluado: cada instrucción generada tiene la forma `ti=x op y`.
- Evidencia esperada: lista de strings producida por `codigo`.
- Puntaje completo: todas las instrucciones usan un temporal `ti` a la izquierda, un operador permitido y operandos que son variables, números o temporales previamente generados.
- Puntaje parcial: propuesto; hasta 0.8 si el orden lógico es correcto pero el formato de strings tiene errores menores; hasta 0.5 si usa un formato distinto pero interpretable.
- Puntaje cero: las instrucciones no corresponden al formato elemental pedido.

### P4 - Manejo de variables temporales

- Origen del puntaje: propuesto
- Puntaje máximo: 1.2
- Requisito evaluado: las variables temporales se crean como `t1`, `t2`, etc., a medida que se necesitan, y la última contiene el resultado final de la fórmula cuando hay operaciones.
- Evidencia esperada: salidas para fórmulas con múltiples operaciones.
- Puntaje completo: numera temporales de forma consistente desde `t1`, reutiliza correctamente los temporales generados como operandos y deja el resultado final en el último temporal creado.
- Puntaje parcial: propuesto; hasta 0.8 si el resultado lógico es correcto pero la numeración no es completamente consistente; hasta 0.5 si hay errores en el uso de temporales en expresiones complejas.
- Puntaje cero: no usa temporales o los usa de manera que no permiten evaluar la fórmula.

### P5 - Cobertura de operadores y casos permitidos

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0
- Requisito evaluado: la solución funciona para los operadores `+`, `-`, `*`, `/`, variables de una letra, dígitos y fórmulas anidadas permitidas por el enunciado.
- Evidencia esperada: ejecución de los ejemplos entregados, incluyendo `((((a+b)+c)+d)+e)`, `(a+(b+(c+(d+e))))` y `a`.
- Puntaje completo: maneja todos los operadores y operandos permitidos; trata adecuadamente el caso de una fórmula formada por una sola variable o número.
- Puntaje parcial: propuesto; hasta 0.7 si omite un operador; hasta 0.5 si falla en fórmulas anidadas pero funciona en expresiones simples.
- Puntaje cero: solo funciona para casos triviales o no cubre la gramática básica indicada.

### P6 - Ejemplos adicionales solicitados

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0
- Requisito evaluado: además de las fórmulas dadas, se agregan tres ejemplos adicionales.
- Evidencia esperada: código, notebook o sección de pruebas donde se ejecuten al menos tres fórmulas adicionales.
- Puntaje completo: incluye tres ejemplos adicionales válidos dentro de la gramática de la tarea y muestra su generación de código.
- Puntaje parcial: propuesto; 0.7 si incluye dos ejemplos adicionales; 0.4 si incluye uno; hasta 0.5 si los ejemplos existen pero alguno no pertenece al lenguaje permitido.
- Puntaje cero: no agrega ejemplos adicionales.

## Descuentos, topes y reglas especiales - si corresponde

- El material opcional sobre reciclar temporales no es obligatorio y no influye en la nota. Si una entrega intenta implementarlo, solo debe considerarse en la medida en que no rompa los requisitos obligatorios de generación de código.
- No se identifican descuentos, topes de nota ni notas directas adicionales en los materiales.

## Escala final

- Puntaje máximo original por sección o total: no especificado en los materiales.
- Puntaje máximo total propuesto: 7.0
- Ponderación entre secciones: no corresponde.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Extraído de los materiales: se debe implementar `Arbol.codigo`; debe retornar una lista de instrucciones; las instrucciones son de la forma `ti=x op y`; los temporales se nombran `t1`, `t2`, etc.; la última temporal almacena el valor final cuando hay operaciones; se deben agregar tres ejemplos adicionales; la parte de reciclar temporales es opcional y no influye en la nota.
- Propuesto para revisión: distribución de 7.0 puntos entre seis criterios, junto con reglas de puntaje parcial.
- Ambigüedad no resuelta: para una fórmula sin operadores, como `a`, el enunciado no especifica literalmente si `codigo` debe retornar una lista vacía u otra representación; debe aceptarse cualquier comportamiento coherente con la interfaz y con la ausencia de instrucciones binarias necesarias.
- Requisitos no verificables solo con el material: no hay pauta oficial de puntajes ni pruebas unitarias oficiales entregadas.
