# Pauta de evaluación

## Alcance

Se evalúa la entrega de la Tarea 1 de CC3501, etapa t01: un programa `tarea1.py` que despliega un flipper/pinball 3D, junto con `vertex_program.glsl`, `fragment_program.glsl` y los archivos auxiliares o modelos necesarios si corresponde.

La evaluación considera únicamente los requisitos de esta etapa:

- diseño 3D del flipper;
- dos vistas con sus proyecciones;
- interactividad de las paletas/flippers con teclado.

No se evalúa la incorporación de una bola, ya que el enunciado indica explícitamente que no es necesaria en esta tarea y será parte de la siguiente.

## Secciones y ponderación - si corresponde

| Sección | Identificador | Ponderación | Puntaje máximo original |
|---|---:|---:|---:|
| Diseño | D | 50% | 3 puntos |
| Vistas y proyecciones | VP | 25% | 1.5 puntos |
| Interactividad | I | 25% | 1.5 puntos |

## Criterios

### D1 - Tablero 3D

- Origen del puntaje: enunciado
- Puntaje máximo: 0.5 puntos
- Sección: D
- Requisito evaluado: el flipper debe incluir un tablero sobre el que se disponen los demás elementos.
- Evidencia esperada: ejecución de `python tarea1.py` y visualización del tablero en la ventana.
- Puntaje completo: se observa un tablero modelado como objeto 3D.
- Puntaje parcial: no se especifican niveles intermedios.
- Puntaje cero: no hay tablero visible, o el tablero no es 3D.

### D2 - Dos flippers 3D

- Origen del puntaje: enunciado
- Puntaje máximo: 1.0 punto, 0.5 puntos por cada flipper
- Sección: D
- Requisito evaluado: el diseño debe incluir dos flippers o paletas que se activan mediante input y que golpearán a la pelota en etapas posteriores.
- Evidencia esperada: ejecución de `python tarea1.py` y visualización de dos paletas/flippers.
- Puntaje completo: se observan dos flippers modelados como objetos 3D.
- Puntaje parcial: 0.5 puntos por cada flipper 3D presente.
- Puntaje cero: no hay flippers visibles, o ninguno es 3D.

### D3 - Bordes 3D

- Origen del puntaje: enunciado
- Puntaje máximo: 0.5 puntos
- Sección: D
- Requisito evaluado: el diseño debe incluir bordes que limitan por dónde se podrá mover la pelota.
- Evidencia esperada: ejecución de `python tarea1.py` y visualización de bordes en el tablero.
- Puntaje completo: se observan bordes modelados como objetos 3D.
- Puntaje parcial: no se especifican niveles intermedios.
- Puntaje cero: no hay bordes visibles, o los bordes no son 3D.

### D4 - Elementos extra 3D de interacción

- Origen del puntaje: enunciado
- Puntaje máximo: 0.5 puntos, 0.25 puntos por cada elemento
- Sección: D
- Requisito evaluado: el diseño debe incluir por lo menos 2 elementos con los que interactúa la pelota, por ejemplo elementos para chocar, rebotar, quedar atrapada o atravesar.
- Evidencia esperada: ejecución de `python tarea1.py` y visualización de elementos extra no decorativos.
- Puntaje completo: se observan al menos 2 elementos extra de interacción modelados como objetos 3D.
- Puntaje parcial: 0.25 puntos por cada elemento extra de interacción 3D válido.
- Puntaje cero: no hay elementos extra de interacción válidos, o no son 3D.

### D5 - Elementos decorativos 3D

- Origen del puntaje: enunciado
- Puntaje máximo: 0.5 puntos, 0.25 puntos por cada elemento
- Sección: D
- Requisito evaluado: el diseño debe incluir por lo menos 2 elementos decorativos visibles que no sean parte de la interacción con la pelota.
- Evidencia esperada: ejecución de `python tarea1.py` y visualización de elementos decorativos.
- Puntaje completo: se observan al menos 2 elementos decorativos visibles modelados como objetos 3D.
- Puntaje parcial: 0.25 puntos por cada elemento decorativo 3D válido.
- Puntaje cero: no hay elementos decorativos válidos, o no son 3D.

### VP1 - Dos vistas y proyecciones

- Origen del puntaje: enunciado
- Puntaje máximo: 1.5 puntos
- Sección: VP
- Requisito evaluado: el programa debe implementar dos vistas distintas: vista superior con proyección ortográfica y vista “de jugador(a)” con proyección en perspectiva. En ambas vistas debe procurarse que el tablero completo sea visible. El programa debe cambiar de vista al presionar la tecla C.
- Evidencia esperada: ejecución de `python tarea1.py`, observación de ambas vistas y prueba de cambio mediante la tecla C.
- Puntaje completo: existen dos vistas distintas; la vista superior usa proyección ortográfica; la vista de jugador(a) usa proyección en perspectiva; el tablero completo es visible en ambas; la tecla C cambia entre vistas.
- Puntaje parcial: propuesto para revisión humana: hasta 0.5 por implementar dos vistas distinguibles; hasta 0.4 por usar correctamente proyección ortográfica en la vista superior; hasta 0.4 por usar correctamente proyección en perspectiva en la vista de jugador(a); hasta 0.2 por cambiar de vista con la tecla C y mantener el tablero completo visible en ambas.
- Puntaje cero: no se implementan vistas/proyecciones evaluables o no se puede observar el cambio de vista.

### I1 - Interactividad de flippers con A y D

- Origen del puntaje: enunciado
- Puntaje máximo: 1.5 puntos
- Sección: I
- Requisito evaluado: el usuario debe poder interactuar con los flippers mediante las teclas A y D. Al presionar A, el flipper izquierdo se levanta; al presionar D, el flipper derecho se levanta. La duración y amplitud del movimiento quedan a criterio del estudiante.
- Evidencia esperada: ejecución de `python tarea1.py` y prueba de las teclas A y D.
- Puntaje completo: la tecla A activa el movimiento del flipper izquierdo y la tecla D activa el movimiento del flipper derecho, con movimiento visible y coherente de levantamiento.
- Puntaje parcial: propuesto para revisión humana: hasta 0.75 puntos por funcionamiento correcto del flipper izquierdo con A; hasta 0.75 puntos por funcionamiento correcto del flipper derecho con D.
- Puntaje cero: las teclas A y D no producen movimiento evaluable en los flippers.

## Descuentos, topes y reglas especiales - si corresponde

- Si el programa se cae o la ventana no despliega un flipper, la nota es 1.
- El puntaje de Diseño solo cuenta si los objetos son 3D.
- La nota máxima de Diseño es 3 puntos, incluso si la entrega contiene más elementos que los pedidos.
- Los elementos no decorativos deben ser de autoría del estudiante. Pueden hacerse en código, Blender u otro software similar.
- Los elementos decorativos pueden ser modelos 3D descargados de la red.

## Escala final

- Puntaje máximo original total: 6 puntos
- Puntaje máximo original por sección:
  - Diseño: 3 puntos
  - Vistas y proyecciones: 1.5 puntos
  - Interactividad: 1.5 puntos
- Ponderación entre secciones:
  - Diseño: 50%
  - Vistas y proyecciones: 25%
  - Interactividad: 25%
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas

## Supuestos y decisiones para revisión humana

- Extraído de los materiales: los puntajes máximos de las secciones son 3, 1.5 y 1.5 puntos.
- Extraído de los materiales: el desglose de Diseño es 0.5 por tablero, 0.5 por cada flipper, 0.5 por bordes, 0.25 por cada elemento extra y 0.25 por cada elemento decorativo.
- Propuesto para revisión humana: la distribución parcial interna de Vistas y proyecciones, porque el enunciado solo entrega el máximo de 1.5 puntos.
- Propuesto para revisión humana: la distribución parcial interna de Interactividad, porque el enunciado solo entrega el máximo de 1.5 puntos.
- Ambigüedad no resuelta: el enunciado menciona que un flipper mínimo funcional “tiene un 4” y que enfocarse en diseño visual también “puede tener nota 4”, pero no entrega una regla de conversión explícita ni condiciones exactas adicionales para aplicar esa nota.
- Requisito no evaluado como criterio independiente: no se exige bola en esta etapa; solo se indica considerar que se añadirá en una tarea posterior.
