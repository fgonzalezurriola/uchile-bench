# Pauta de evaluación

## Alcance

Se evalúa la entrega de la Tarea 3 de CC4303: implementación de sockets orientados a conexión usando sockets UDP y Stop & Wait. La entrega debe incluir una clase `SocketTCP`, un cliente y un servidor que permitan enviar íntegramente un archivo desde cliente a servidor, dividiendo datos en segmentos de hasta 16 bytes de carga útil, usando headers con información TCP simplificada, manejo de pérdidas, timeouts, ACKs, handshake, cierre de conexión e informe en Markdown.

## Secciones y ponderación - si corresponde

- **COD - Código**
  - Ponderación: 4.5 pts
  - Puntaje máximo original: 4.5 pts

- **INF - Informe**
  - Ponderación: 1.5 pts
  - Puntaje máximo original: 1.5 pts

## Criterios

### C1 - Handshake

- Origen del puntaje: enunciado
- Puntaje máximo: 1.0 pts
- Sección: COD
- Requisito evaluado: implementación correcta del 3-way handshake en `SocketTCP.connect(address)` y `SocketTCP.accept()`, usando sockets UDP, headers con flags `SYN`, `ACK` y número de secuencia, y manejo de pérdidas mediante Stop & Wait.
- Evidencia esperada: clase `SocketTCP`; funciones `bind(address)`, `connect(address)` y `accept()`; pruebas cliente-servidor donde el cliente establece conexión con un servidor escuchando; funcionamiento bajo pérdida inducida.
- Puntaje completo: el handshake funciona correctamente, crea un socket de conexión distinto al socket que llama a `accept()`, mantiene direcciones y números de secuencia necesarios, y tolera pérdidas, incluyendo el caso borde de pérdida del último ACK.
- Puntaje parcial: propuesto para revisión humana:
  - hasta 0.4 pts si el handshake básico sin pérdidas funciona;
  - hasta 0.3 pts adicionales si `accept()` retorna correctamente un nuevo objeto `SocketTCP` asociado a una nueva dirección y conserva estado de secuencia;
  - hasta 0.3 pts adicionales si el handshake maneja pérdidas con timeouts y retransmisiones, incluyendo el último ACK perdido.
- Puntaje cero: no se puede establecer conexión entre cliente y servidor usando la interfaz solicitada, o las funciones principales de handshake no existen.

### C2 - Cierre de conexión

- Origen del puntaje: enunciado
- Puntaje máximo: 1.0 pts
- Sección: COD
- Requisito evaluado: implementación del cierre de conexión con `close()` y `recv_close()` siguiendo la secuencia vista para Host A y Host B, liberando recursos y tolerando pérdidas.
- Evidencia esperada: funciones `close()` y `recv_close()` en `SocketTCP`; pruebas donde, tras enviar datos, ambos extremos cierran la conexión; funcionamiento bajo pérdida inducida.
- Puntaje completo: el cierre funciona correctamente; `close()` reenvía `FIN` ante timeout hasta 3 timeouts, asume cierre de contraparte al tercer timeout, y si recibe `FIN` y `ACK` reenvía el último `ACK` tres veces esperando un timeout entre envíos; `recv_close()` espera hasta 3 timeouts por el último ACK y luego cierra.
- Puntaje parcial: propuesto para revisión humana:
  - hasta 0.4 pts si el cierre funciona sin pérdidas;
  - hasta 0.3 pts adicionales si `close()` maneja timeouts y retransmisiones según lo pedido;
  - hasta 0.3 pts adicionales si `recv_close()` maneja correctamente la pérdida del último ACK y libera recursos.
- Puntaje cero: no existe cierre implementado, el programa queda bloqueado indefinidamente en condiciones normales, o no libera la conexión de forma observable.

### C3 - `send` y `recv` con Stop & Wait

- Origen del puntaje: enunciado
- Puntaje máximo: 2.5 pts
- Sección: COD
- Requisito evaluado: implementación correcta de `send(message)` y `recv(buff_size)` usando Stop & Wait, ACKs, timeouts, retransmisiones y segmentación de datos.
- Evidencia esperada: clase `SocketTCP`; funciones estáticas `parse_segment` y `create_segment`; envío de archivos de más de 16 bytes; pruebas `send`/`recv` indicadas en el material; pruebas con pérdida inducida; recepción íntegra del archivo por salida estándar del servidor.
- Puntaje completo: `send` divide el mensaje en segmentos de carga útil máxima 16 bytes, envía primero el largo `message_length`, encapsula cada parte con headers TCP simplificados, usa el último número de secuencia almacenado, espera ACKs y retransmite ante timeout; `recv` interpreta el largo inicial, confirma con ACKs, retorna a lo más `buff_size` bytes, permite múltiples llamadas cuando `message_length > buff_size`, no pierde datos sobrantes, y la transmisión es íntegra incluso con pérdidas.
- Puntaje parcial: propuesto para revisión humana:
  - hasta 0.4 pts por construcción y parseo correcto de segmentos con headers que incluyan `ACK`, `SYN`, `FIN` y `seq`;
  - hasta 0.5 pts por segmentación correcta en cargas de máximo 16 bytes y envío inicial de `message_length`;
  - hasta 0.6 pts por funcionamiento correcto de `send`/`recv` sin pérdidas, incluyendo los casos de prueba de largos 16, 19 y recepción partida;
  - hasta 0.6 pts por manejo de pérdidas mediante Stop & Wait, ACKs, timeouts y retransmisiones;
  - hasta 0.4 pts por manejo correcto de `buff_size < message_length`, múltiples llamadas a `recv`, y preservación de datos sobrantes.
- Puntaje cero: `send` y `recv` no están implementadas o no permiten transmitir datos íntegros entre cliente y servidor usando `SocketTCP`.

### C4 - Cliente y servidor de entrega

- Origen del puntaje: propuesto
- Puntaje máximo: 0 pts, criterio verificable dentro de C1, C2 y C3
- Sección: COD
- Requisito evaluado: existencia de un cliente y un servidor que usen objetos `SocketTCP`; el cliente debe poder ejecutarse como `python3 cliente.py localhost 8000 < archivo.txt` y enviar el archivo al servidor.
- Evidencia esperada: archivos de cliente y servidor; ejecución con redirección de entrada estándar; servidor imprime el contenido recibido en salida estándar.
- Puntaje completo: requisito cumplido como parte de los criterios C1, C2 y C3.
- Puntaje parcial: no corresponde puntaje independiente; su incumplimiento puede impedir evidenciar los criterios funcionales.
- Puntaje cero: no corresponde puntaje independiente.

### I1 - Diagramas solicitados

- Origen del puntaje: propuesto
- Puntaje máximo: 0.6 pts, distribución propuesta dentro de los 1.5 pts originales del informe
- Sección: INF
- Requisito evaluado: inclusión de los diagramas pedidos en el enunciado.
- Evidencia esperada: informe en Markdown con diagrama del 3-way handshake y diagrama del caso borde donde se pierde el último ACK del handshake.
- Puntaje completo: el informe incluye ambos diagramas y los relaciona con las funciones `connect` y `accept`, además de explicar la solución adoptada para el último ACK perdido.
- Puntaje parcial: propuesto para revisión humana:
  - 0.3 pts por el diagrama del 3-way handshake;
  - 0.3 pts por el diagrama del caso borde de pérdida del último ACK y su solución.
- Puntaje cero: no se incluyen los diagramas solicitados.

### I2 - Pruebas, pérdidas y modo debug

- Origen del puntaje: propuesto
- Puntaje máximo: 0.4 pts, distribución propuesta dentro de los 1.5 pts originales del informe
- Sección: INF
- Requisito evaluado: documentación de pruebas realizadas, manejo de pérdidas y modo debug.
- Evidencia esperada: informe en Markdown que describa pruebas con archivos de más de 16 bytes, pruebas de `recv(buff_size)` con `buff_size < message_length`, uso de `netem` o pérdidas simuladas a mano, e indicación del modo debug.
- Puntaje completo: el informe explica cómo se probaron transmisión íntegra, pérdidas, cierre y comportamiento de `recv`; si se usaron pérdidas a mano, indica cómo se configuraron y que pueden ocurrir en ambas direcciones; describe el modo debug usado para observar el manejo de pérdidas.
- Puntaje parcial: propuesto para revisión humana:
  - hasta 0.2 pts por describir pruebas funcionales de envío/recepción y `recv(buff_size)`;
  - hasta 0.2 pts por describir pérdidas inducidas, modo debug y, si aplica, simulación manual.
- Puntaje cero: el informe no describe pruebas ni manejo de pérdidas.

### I3 - Decisiones de diseño y situaciones borde

- Origen del puntaje: propuesto
- Puntaje máximo: 0.5 pts, distribución propuesta dentro de los 1.5 pts originales del informe
- Sección: INF
- Requisito evaluado: explicación de decisiones de diseño tomadas, especialmente las relacionadas con `recv(buff_size)` y situaciones borde no especificadas.
- Evidencia esperada: informe en Markdown con decisiones de implementación sobre headers, números de secuencia, timeouts, manejo de datos sobrantes cuando `len(message_received) > buff_size`, y situaciones borde encontradas.
- Puntaje completo: el informe documenta claramente las decisiones de diseño relevantes y cualquier situación borde no especificada encontrada durante la implementación.
- Puntaje parcial: propuesto para revisión humana:
  - hasta 0.3 pts por decisiones de diseño de `send`, `recv`, headers, secuencias y timeouts;
  - hasta 0.2 pts por identificar situaciones borde no especificadas o indicar que no se encontraron.
- Puntaje cero: el informe no presenta decisiones de diseño ni situaciones borde.

## Descuentos, topes y reglas especiales - si corresponde

No corresponde.

## Escala final

- Puntaje máximo original por sección:
  - Código: 4.5 pts
  - Informe: 1.5 pts
  - Total: 6.0 pts
- Ponderación entre secciones:
  - Código: 4.5/6.0
  - Informe: 1.5/6.0
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales:
  - La tarea vale 4.5 pts de código y 1.5 pts de informe.
  - El código se desglosa en 1.0 pts por handshake, 1.0 pts por cierre y 2.5 pts por `send`/`recv`, incluyendo manejo de pérdidas.
  - El cliente debe poder ejecutarse como `python3 cliente.py localhost 8000 < archivo.txt`.
  - La carga útil máxima por segmento es de 16 bytes, sin incluir headers.
  - El informe debe incluir diagramas del 3-way handshake y del caso borde de pérdida del último ACK del handshake.
  - El informe debe indicar decisiones de diseño, especialmente las relacionadas con `recv(buff_size)`, y situaciones borde no especificadas.
- Puntajes o niveles propuestos:
  - La distribución interna del informe en I1, I2 e I3 es propuesta, porque el material solo entrega el total de 1.5 pts.
  - Los niveles de puntaje parcial dentro de C1, C2 y C3 son propuestos, porque el material solo especifica máximos por funcionalidad.
- Ambigüedades no resueltas:
  - No se especifica formato obligatorio de headers, solo que deben contener `ACK`, `SYN`, `FIN` y `seq`.
  - No se especifica valor fijo de timeout.
  - No se especifica estructura exacta de archivos ni nombres obligatorios, salvo el ejemplo `cliente.py`.
- Requisitos que no pueden verificarse solo con el material:
  - La efectividad bajo pérdida depende del ambiente de pruebas, uso de `netem` o simulación manual.
  - La revisión del modo debug requiere ejecutar o inspeccionar la implementación entregada.
