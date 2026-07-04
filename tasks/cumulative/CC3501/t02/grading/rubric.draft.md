# Pauta de evaluación

## Alcance

Se evalúa únicamente la etapa **CC3501/t02**: dar vida al pinball mediante una pelota metálica, apariencia con colores/texturas, simulación física con `pymunk` e iluminación con modelo de Phong. El trabajo heredado de la tarea 1 solo es contexto de implementación; no se evalúa como tarea 1, salvo que los elementos necesarios para t02 deban estar presentes y visibles para verificar interacción, flippers y tablero.

La entrega esperada se ejecuta con:

- `python tarea2.py`
- archivos relevantes: `tarea2.py`, `vertex_program.glsl`, `fragment_program.glsl`

## Secciones y ponderación - si corresponde

| Sección | Identificador | Puntaje máximo original | Ponderación |
|---|---:|---:|---:|
| Apariencia | AP | 1.5 puntos | 1.5 / 6.0 |
| Simulación física | SF | 2.5 puntos | 2.5 / 6.0 |
| Iluminación | IL | 2.0 puntos | 2.0 / 6.0 |

## Criterios

### P1 - Apariencia de objetos y tablero

- Origen del puntaje: enunciado
- Puntaje máximo: 1.5 puntos
- Sección: AP
- Requisito evaluado: los objetos del pinball deben tener color o textura; para el máximo, el tablero y los objetos que interactúan con la bola deben usar texturas.
- Evidencia esperada: ejecución de `tarea2.py` y observación visual del tablero, pelota y objetos interactivos.
- Puntaje completo: 1.5 puntos si, además de color, el tablero y sus objetos usan texturas; no se exige textura en objetos decorativos que no son parte del tablero ni interactúan con la bola.
- Puntaje parcial:
  - 1.0 punto si todos los objetos tienen color diferente y además el tablero tiene textura.
  - 0.5 puntos si todos los objetos tienen un color diferente.
- Puntaje cero: no se observan colores/texturas suficientes para cumplir el nivel de 0.5 puntos.

### P2 - Simulación física de la pelota

- Origen del puntaje: enunciado, con desglose auxiliar propuesto para casos intermedios no especificados
- Puntaje máximo: 2.5 puntos
- Sección: SF
- Requisito evaluado: uso de `pymunk` para modelar una pelota de acero que se lanza con la barra espaciadora, cae por efecto de gravedad/inclinación, permanece en el tablero, puede ser golpeada por los flippers, interactúa con objetos y permite detectar GAME OVER al llegar al fondo.
- Evidencia esperada: ejecución de `tarea2.py`; observación de la pelota durante al menos 15 segundos; interacción con flippers y objetos; revisión de uso de `pymunk` si es necesario.
- Puntaje completo: 2.5 puntos si hay una simulación física visible que funciona adecuadamente al menos durante 15 segundos mientras la pelota está en el tablero, se puede golpear con los flippers e interactúa con los objetos.
- Puntaje parcial:
  - 1.5 puntos si la pelota interactúa solo con los flippers pero no con los otros objetos del tablero.
  - Propuesto para revisión humana: en otros casos intermedios que no activen una regla de cero, asignar hasta 1.5 puntos por lanzamiento/movimiento visible, permanencia en tablero, interacción con flippers y detección de GAME OVER; asignar hasta 1.0 punto adicional por interacción correcta con otros objetos.
- Puntaje cero: si la pelota se sale del tablero, no obtiene puntaje en simulación física; también corresponde cero si no hay simulación física visible de la pelota.

### P3 - Iluminación con modelo de Phong

- Origen del puntaje: enunciado
- Puntaje máximo: 2.0 puntos
- Sección: IL
- Requisito evaluado: implementación del modelo de iluminación de Phong con al menos una fuente de luz direccional, puntual o tipo spotlight, materiales diferenciados y luces adicionales según corresponda.
- Evidencia esperada: ejecución de `tarea2.py`; observación de efectos de iluminación; revisión de `vertex_program.glsl` y `fragment_program.glsl` si es necesario.
- Puntaje completo: 2.0 puntos si se agrega una segunda fuente de luz direccional, puntual o tipo spotlight, con configuración de posición y color distinta a la primera fuente.
- Puntaje parcial:
  - 1.5 puntos si se agrega una fuente de luz adicional en alguna parte del tablero.
  - 1.0 punto si, además de la luz indicada, los objetos tienen propiedades materiales diferentes, por ejemplo una bola metálica con reflejos especulares.
  - 0.5 puntos si se implementa la luz indicada.
- Puntaje cero: no hay implementación observable del modelo de iluminación de Phong con una fuente de luz válida.

## Descuentos, topes y reglas especiales - si corresponde

- Si el programa se cae al ejecutar `python tarea2.py`, la nota es 1.0. No habrá excepciones.
- Si la ventana no despliega un flipper, la nota es 1.0. No habrá excepciones.
- Si la pelota se sale del tablero, el criterio de simulación física obtiene 0 puntos.
- No se incluyen penalizaciones administrativas de fecha, plataforma o formato de subida.

## Escala final

- Puntaje máximo original total: 6.0 puntos
- Puntaje máximo original por sección:
  - AP: 1.5 puntos
  - SF: 2.5 puntos
  - IL: 2.0 puntos
- Ponderación entre secciones: proporcional a sus puntajes máximos originales
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas

## Supuestos y decisiones para revisión humana

- Extraído del enunciado: las tres secciones evaluadas son Apariencia, Simulación Física e Iluminación, con máximos de 1.5, 2.5 y 2.0 puntos respectivamente.
- Extraído del enunciado: la suma de puntajes originales es 6.0 puntos.
- Extraído del enunciado: caída del programa o ausencia de flipper visible implica nota 1.0.
- Propuesto: conversión lineal desde 6.0 puntos a nota benchmark 1.0–7.0, con un decimal.
- Propuesto: desglose auxiliar para casos intermedios de simulación física no detallados explícitamente.
- Ambigüedad: el enunciado no especifica puntajes parciales para fallas individuales como ausencia de GAME OVER, lanzamiento no lateral o simulación parcialmente sincronizada con el modelo 3D.
