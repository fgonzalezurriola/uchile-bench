# Pauta de evaluación

## Alcance

Se evalúa la etapa cumulative CC4303-transport/t04: control de congestión sobre la implementación heredada de Stop & Wait de la etapa anterior. La entrega incluye código e informe en Markdown.

El código debe implementar:

- una clase `CongestionControl`;
- envío y recepción usando Go-Back N;
- integración de control de congestión en `send_using_go_back_n` usando slow start y congestion avoidance, según la versión simplificada indicada en el enunciado.

El informe debe documentar respuestas, pruebas de integridad, evolución de la ventana de congestión y comparación experimental solicitada.

## Secciones y ponderación - si corresponde

| Sección | Identificador | Ponderación | Puntaje máximo original |
|---|---:|---:|---:|
| Código | COD | 4.5/6.0 del total original | 4.5 pts |
| Informe en Markdown | INF | 1.5/6.0 del total original | 1.5 pts |

## Criterios

### P1 - Clase de control de congestión

- Origen del puntaje: enunciado
- Puntaje máximo: 1.5 pts
- Sección: COD
- Requisito evaluado: la clase `CongestionControl` maneja correctamente `cwnd`, `ssthresh`, `MSS` y los estados slow start y congestion avoidance.
- Evidencia esperada: archivo/módulo importable como `CongestionControl`, clase `CongestionControl(MSS: int)`, métodos requeridos y ejecución satisfactoria de `CongestionControl_test.py`.
- Puntaje completo: la clase cumple la firma indicada, inicializa correctamente sus variables, implementa `get_cwnd`, `get_MSS_in_cwnd`, `event_ack_received`, `event_timeout`, `is_state_slow_start`, `is_state_congestion_avoidance` y `get_ssthresh`, y reproduce el comportamiento esperado para distintos valores de `MSS`.
- Puntaje parcial: propuesto para revisión humana:
  - hasta 0.3 pts por constructor e inicialización correcta;
  - hasta 0.3 pts por getters y métodos de estado;
  - hasta 0.4 pts por manejo correcto de ACKs en slow start y congestion avoidance;
  - hasta 0.3 pts por manejo correcto de timeouts, `ssthresh`, `cwnd` y cambios de estado;
  - hasta 0.2 pts por compatibilidad con las pruebas provistas.
- Puntaje cero: la clase no existe, no puede instanciarse con `CongestionControl(MSS)`, o no implementa funcionalidad verificable de control de congestión.

### P2 - Implementación de Go-Back N

- Origen del puntaje: enunciado
- Puntaje máximo: 1.5 pts
- Sección: COD
- Requisito evaluado: el código implementa correctamente envío y recepción usando Go-Back N, manteniendo Stop & Wait como modo disponible.
- Evidencia esperada: clase `SocketTCP` con `send_using_stop_and_wait`, `recv_using_stop_and_wait`, `send_using_go_back_n`, `recv_using_go_back_n`, y métodos `send`/`recv` con parámetro `mode`, incluyendo `mode="stop_and_wait"` por defecto y `mode="go_back_n"`.
- Puntaje completo: el envío y recepción con Go-Back N permiten transferir archivos correctamente sin pérdida y con pérdida inducida, usando `SocketUDP` y `SlidingWindowCC` según corresponda.
- Puntaje parcial: propuesto para revisión humana:
  - hasta 0.3 pts por separar correctamente el código previo de Stop & Wait;
  - hasta 0.3 pts por integrar el parámetro `mode` en `send` y `recv`;
  - hasta 0.4 pts por implementar la lógica central de Go-Back N;
  - hasta 0.3 pts por funcionamiento correcto sin pérdidas;
  - hasta 0.2 pts por funcionamiento correcto con pérdidas inducidas.
- Puntaje cero: no existe implementación de Go-Back N, o `send`/`recv` no permiten usar un modo Go-Back N verificable.

### P3 - Eventos de control de congestión en Go-Back N

- Origen del puntaje: enunciado
- Puntaje máximo: 1.5 pts
- Sección: COD
- Requisito evaluado: `send_using_go_back_n` usa un objeto `CongestionControl` y llama correctamente los eventos de control de congestión.
- Evidencia esperada: uso de `CongestionControl` con `MSS = 8`, división del mensaje en trozos de tamaño `MSS`, actualización de `window_size` y `data_window`, llamadas a `event_timeout()` y `event_ack_received()`, y modo debug para observar la evolución de la ventana.
- Puntaje completo: la ventana de envío se inicializa y actualiza desde `CongestionControl`; los ACKs y timeouts modifican correctamente la ventana de congestión; los nuevos elementos que entran a la ventana se envían consecutivamente; y se maneja el caso borde donde la ventana disminuye después de haber enviado la ventana previa.
- Puntaje parcial: propuesto para revisión humana:
  - hasta 0.3 pts por crear e inicializar correctamente `congestion_controler` con `MSS = 8` y dividir datos según `MSS`;
  - hasta 0.4 pts por llamar `event_ack_received()` y `event_timeout()` en los puntos correctos;
  - hasta 0.3 pts por actualizar `window_size` y `data_window` después de eventos que modifican `cwnd`;
  - hasta 0.2 pts por manejar el caso borde de ACK mayor al mayor número de secuencia dentro de la ventana reducida;
  - hasta 0.3 pts por modo debug y evolución observable coherente de la ventana.
- Puntaje cero: `send_using_go_back_n` no usa `CongestionControl`, o no hay llamadas verificables a los eventos de control de congestión.

### I1 - Preguntas previas sobre Go-Back N y Stop & Wait

- Origen del puntaje: propuesto
- Puntaje máximo: 0.3 pts
- Sección: INF
- Requisito evaluado: el informe responde las dos preguntas solicitadas antes de implementar Go-Back N.
- Evidencia esperada: informe Markdown con respuestas sobre la utilidad de Stop & Wait como base para Go-Back N y sobre la función `recv` con `SocketUDP` y `SlidingWindowCC`.
- Puntaje completo: ambas respuestas están presentes y se relacionan directamente con lo preguntado.
- Puntaje parcial: propuesto: otorgar proporcionalmente si falta una respuesta o si alguna es incompleta.
- Puntaje cero: no se responden las preguntas solicitadas.

### I2 - Pruebas de integridad con y sin pérdida

- Origen del puntaje: propuesto
- Puntaje máximo: 0.3 pts
- Sección: INF
- Requisito evaluado: el informe comprueba que los datos llegan íntegros tras añadir control de congestión.
- Evidencia esperada: descripción de pruebas cliente-servidor con y sin pérdida de datos, usando `netem loss` o pérdidas forzadas manualmente.
- Puntaje completo: se documentan pruebas con y sin pérdida y se reporta integridad de origen a destino.
- Puntaje parcial: propuesto: otorgar proporcionalmente si solo se documenta una condición o falta evidencia clara.
- Puntaje cero: no hay pruebas de integridad documentadas.

### I3 - Evolución sin pérdida inducida

- Origen del puntaje: propuesto
- Puntaje máximo: 0.3 pts
- Sección: INF
- Requisito evaluado: el informe observa el comportamiento del control de congestión sin inducir pérdida.
- Evidencia esperada: uso del modo debug para reportar evolución de estados, `cwnd`, `ssthresh` y ocurrencia o ausencia de timeouts espontáneos.
- Puntaje completo: se describe la evolución observada y se verifica que los cambios de estado y variables son correctos.
- Puntaje parcial: propuesto: otorgar proporcionalmente si la observación es incompleta o no conecta con las variables solicitadas.
- Puntaje cero: no se reporta comportamiento sin pérdida inducida.

### I4 - Evolución con pérdida inducida

- Origen del puntaje: propuesto
- Puntaje máximo: 0.3 pts
- Sección: INF
- Requisito evaluado: el informe repite la observación del control de congestión induciendo pérdidas.
- Evidencia esperada: resultados con pérdida inducida y evolución de la ventana de congestión mediante debug.
- Puntaje completo: se documenta la prueba con pérdida y se analiza la evolución esperada ante ACKs y timeouts.
- Puntaje parcial: propuesto: otorgar proporcionalmente si la prueba o el análisis están incompletos.
- Puntaje cero: no se reporta prueba con pérdida inducida.

### I5 - Comparación Go-Back N con y sin control de congestión

- Origen del puntaje: propuesto
- Puntaje máximo: 0.3 pts
- Sección: INF
- Requisito evaluado: el informe compara Go-Back N con control de congestión versus sin control de congestión.
- Evidencia esperada: experimento con tasa de pérdida de 20%, archivo de al menos 100 KB, medición de mensajes intercambiados y tiempo de envío, 5 repeticiones, y comparación con resultados de Go-Back N de la actividad anterior.
- Puntaje completo: se responde cuál toma menos tiempo y se presentan las mediciones solicitadas para ambas configuraciones.
- Puntaje parcial: propuesto: otorgar proporcionalmente si faltan repeticiones, métricas o comparación.
- Puntaje cero: no se realiza la comparación solicitada.

## Descuentos, topes y reglas especiales - si corresponde

No corresponde.

## Escala final

- Puntaje máximo original por sección:
  - Código: 4.5 pts
  - Informe en Markdown: 1.5 pts
- Puntaje máximo original total: 6.0 pts
- Ponderación entre secciones: 4.5/6.0 código y 1.5/6.0 informe
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales:
  - el puntaje total original es 4.5 pts de código + 1.5 pts de informe;
  - el código se divide en tres funcionalidades de 1.5 pts cada una;
  - el informe debe incluir respuestas, pruebas con/sin pérdida, evolución del control de congestión y comparación experimental;
  - `CongestionControl_test.py` entrega expectativas concretas para la clase `CongestionControl`.
- Puntajes o niveles propuestos:
  - la subdivisión interna de cada criterio de 1.5 pts;
  - la división del informe en cinco criterios de 0.3 pts;
  - las reglas de puntaje parcial.
- Ambigüedades no resueltas:
  - no se especifican nombres exactos de todos los archivos de la entrega, salvo lo inferible por los imports y clases mencionadas;
  - no se entrega el código previo de Stop & Wait ni las pruebas finales de la actividad anterior;
  - el material describe TCP Tahoe, pero la actividad declara que en esta tarea solo se implementan slow start y congestion avoidance.
- Requisitos que pueden no ser verificables con el material o ambiente disponible:
  - pruebas con `netem loss` si el ambiente no permite configurar pérdidas;
  - comparación con resultados de la actividad anterior si dichos resultados no están disponibles;
  - mediciones de tiempo bajo condiciones de red reproducibles.
