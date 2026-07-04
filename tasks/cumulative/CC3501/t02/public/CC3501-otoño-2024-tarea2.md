CC3501 - Tarea 2 - Otoño 2024

En esta tarea usted le dará vida al pinball que creó en la tarea 1. La evaluación de este
programa considera tres aspectos: 1) apariencia del pinball; 2) simulación física; 3)
iluminación.

Base
Usted debe agregar una pelota metálica a su pinball, a la usanza de los pinball reales.
Puede usar un modelo 3D de una esfera para hacerlo. Respecto a la tarea 1, esta tarea
asume que usted tiene elementos en el tablero con los cuales la pelota va a interactuar.

Apariencia (1.5 puntos)
Usted tiene que darle color o textura a sus objetos.

●  Usted tendrá 0.5 puntos si todos los objetos tienen un color diferente.
●  Usted tendrá 1 punto si además del color, el tablero tiene textura.
●  Usted tendrá 1.5 puntos si, además de color, el tablero y sus objetos utilizan texturas
(no los decorativos, sino los que son parte del tablero y con los que interactúa la
bola).

Simulación Física (2.5 puntos)
Usted utilizará la biblioteca pymunk para modelar el comportamiento de una bola de acero
en el tablero. Al presionar la barra de espacio, una pelota saldrá lanzada desde un costado
de su tablero, y debido a la fuerza de gravedad, tenderá a caer en el tablero, donde usted
podrá golpearla con las paletas o flippers para seguir jugando. Si la pelota llega hasta el
fondo del tablero, el juego ha terminado (GAME OVER).

●  Usted tendrá los 2.5 puntos si hay una simulación física que sea visible en la

aplicación y que funcione adecuadamente al menos durante 15 segundos mientras
la pelota esté en el tablero y se pueda golpear con los flippers e interactuar con los
objetos.

●  Si la pelota se sale del tablero, no tendrá puntaje.
●  Si la pelota interactúa solo con los flippers pero no con los otros objetos del tablero,

tendrá 1.5 puntos.

Nota: pymunk es un motor de simulación en 2D. Esto quiere decir que, si bien usted grafica
el mundo en 3D, la simulación se realiza en un plano donde se desplaza la pelota. Puede
ver su documentación y ejemplos en http://www.pymunk.org/en/latest/examples.html De
hecho, tiene un ejemplo de flipper (pero no le diga al profe...).

Iluminación (2 puntos)
Usted implementará el modelo de iluminación de Phong. Para ello, debe considerar al
menos una fuente de luz que puede ser direccional, puntual o tipo spotlight.

●  Usted tendrá un 0.5 puntos si implementa la luz indicadas.
●  Usted tendrá 1 punto si además los objetos tienen propiedades materiales

diferentes, puesto que, por ejemplo, la bola es metálica, por lo que se espera que
presente reflejos especulares.

●  Usted tendrá 1.5 puntos si agrega una fuente de luz adicional en alguna parte del
tablero (sugerencia: la pelota, al chocar con algún objeto, hace que este “emita”
luz).

●  Usted tendrá los 2 puntos si agrega una segunda fuente de luz direccional, puntual
o tipo spotlight, pero cuya configuración (posición y color) sea distinta a la de la
primera fuente (por ej., piense en luces de colores en distintos lugares del salón).

¿Cómo hacer la tarea?

1.  Agregue a su grafo de escena un objeto que represente a la pelota. En los assets del

curso hay un archivo sphere.off que podría serle útil.
Implemente lo pedido en Apariencia.

2.
3.  Implemente los primeros dos aspectos de Iluminación: la luz del escenario y las

propiedades de material. Así ya tendrá un 4.

4.  Implemente la simulación física. Para ello, deberá construir un mundo en 2D en

Pymunk. Este mundo tendrá una gravedad distinta a la típica, puesto que, si bien la
pelota caerá en ese mundo, no lo hará en caída libre, ya que el tablero real está
inclinado.

a.  Primero preócupese de que la bola se pueda mover dentro del tablero, sin

chocar con los otros objetos. Su primer objetivo es tener un mundo con una
pelota que se mueve dentro de los límites del tablero. Para ello, al presionar la
tecla de espacio, la pelota comenzará a caer desde una posición arbitraria en
el tablero.

b.  Utilice un CollisionHandler (gestor de colisiones) de pymunk para detectar

cuando la pelota choca con la parte de abajo del tablero, y así poder detectar
que el juego ha terminado. En ese caso, se puede presionar la tecla espacio
de nuevo para lanzar otra pelota.

c.  Agregue a su mundo 2D las siluetas de los flippers vistas desde arriba. No

tienen que ser sus siluetas exactas, pueden ser aproximaciones. Una manera
de hacerlo es utilizar la función projected de trimesh:
https://trimesh.org/trimesh.path.polygons.html#trimesh.path.polygons.projec
ted

d.  Decida qué hacer con los flippers: puede descartar la implementación de
movimiento de la tarea 1, y crear un nuevo comportamiento en pymunk,
donde usted manualmente especifique la rotación de cada paleta o bien les
puede aplicar una fuerza (recuerde agregar una restricción para que tenga
un límite de movimiento); también puede mantener su implementación y

tener un objeto al que no le afectan las fuerzas, y al que usted le actualiza su
rotación manualmente en función de su propio código.

e.  Con lo anterior, los flippers debiesen poder interactuar bien con la pelota.
Ahora agregue la interacción con los otros objetos. A diferencia de cada
flipper, esos objetos están fijos y no rotan ni se desplazan debido a las
interacciones (a menos que usted decida lo contrario).

f.  Utilice un CollisionHandler para detectar cuando la pelota choca con un

objeto y lo prenda. La iluminación dura una fracción de segundo.

5.

Implemente lo restante para tener nota 7.

Ejecución
Suba los archivos tarea2.py, vertex_program.glsl y fragment_program.glsl a U-Cursos
dentro de un archivo tarea2.zip. Su proyecto se ejecutará de la siguiente manera en la
carpeta raíz del repositorio del curso:

$ conda activate grafica
$ unzip tarea2.zip
$ python tarea2.py

Si el programa se cae o la ventana no despliega un flipper, la nota es 1. No habrá
excepciones.

Fecha de entrega
7 de junio de 2024, 23:59 Hrs. No entregue en el último minuto, pues debido a motivos de
carga es posible que U-Cursos no logre subir la tarea a tiempo.
No habrá plazo adicional, ni para subir tareas que no se alcanzaron a subir al sistema

ni para dar el fin de semana.


