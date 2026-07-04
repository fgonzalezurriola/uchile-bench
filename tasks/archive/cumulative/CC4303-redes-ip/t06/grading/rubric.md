# Pauta de evaluación

## Alcance

Se evalúa la etapa cumulative **Fragmentación** de CC4303-redes-ip/t06. La entrega debe incorporar fragmentación de datagramas IP al mini-Internet heredado de la etapa anterior de forwarding básico con TTL, usando tablas de rutas con MTU, y debe incluir un informe en Markdown con pruebas.

Se evalúan los requisitos explícitos de la tarea: manejo del nuevo formato de paquete IP, obtención y uso de MTU, fragmentación, forwarding de fragmentos, reensamblaje en destino, almacenamiento por ID, y pruebas documentadas.

## Secciones y ponderación - si corresponde

| Identificador | Sección | Ponderación | Puntaje máximo original |
|---|---:|---:|---:|
| SEC-COD | Código | 75% | 4.5 pts |
| SEC-INF | Informe en Markdown | 25% | 1.5 pts |

## Criterios

### C1 - Manejo del nuevo HEAD y rutas con MTU

- Origen del puntaje: enunciado
- Puntaje máximo: 1.0 pt
- Sección: SEC-COD
- Requisito evaluado: el código maneja correctamente los cambios del HEAD del paquete IP y soporta tablas de rutas con MTU.
- Evidencia esperada: implementación de `parse_packet`, `create_packet`, `check_routes`, pruebas equivalentes a la actividad anterior adaptadas a `IP_packet_v1`, y ejecución con configuración de 5 routers con MTU sin caídas.
- Puntaje completo: el paquete usa correctamente el formato `[Dirección IP];[Puerto];[TTL];[ID];[Offset];[Tamaño];[FLAG];[mensaje]`; `TTL` ocupa 3 dígitos; `ID`, `Offset` y `Tamaño` ocupan 8 dígitos; `FLAG` ocupa 1 dígito; `Tamaño` representa bytes del mensaje sin header; el puerto se maneja con 4 dígitos; la IP usada es `127.0.0.1`; `check_routes` extrae y retorna ruta y MTU; el resto del código soporta este retorno sin fallar.
- Puntaje parcial: no hay subpuntajes explícitos; cualquier distribución interna debe considerarse propuesta para revisión humana.
- Puntaje cero: el código no maneja el nuevo formato de paquete IP o no puede ejecutarse con las tablas de rutas con MTU.

### C2 - Fragmentación de paquetes IP

- Origen del puntaje: enunciado
- Puntaje máximo: 1.8 pts
- Sección: SEC-COD
- Requisito evaluado: los paquetes IP son fragmentados correctamente, incluyendo el caso en que un fragmento debe volver a fragmentarse.
- Evidencia esperada: función `fragment_IP_packet(IP_packet, MTU)`, pruebas con paquetes menores o iguales al MTU y mayores al MTU, integración con forwarding usando el MTU de la ruta.
- Puntaje completo: `fragment_IP_packet` retorna `[IP_packet]` si el tamaño completo del paquete con headers incluidos es menor o igual al MTU; si excede el MTU, retorna todos los fragmentos necesarios, cada uno de tamaño total menor o igual al MTU; recalcula correctamente `Offset`, `Tamaño` y `FLAG`; respeta el tamaño del header al calcular el tamaño del mensaje; maneja correctamente la fragmentación de un fragmento, incluyendo la propagación apropiada de `FLAG`; antes de hacer forwarding, el router fragmenta usando el MTU de la ruta y envía todos los fragmentos resultantes.
- Puntaje parcial: no hay subpuntajes explícitos; si se requiere una pauta interna, se propone para revisión humana asignar puntaje según corrección de casos sin fragmentación, cálculo de tamaños, headers de fragmentos, fragmentación de fragmentos e integración con forwarding.
- Puntaje cero: no existe fragmentación funcional o los fragmentos generados no respetan el MTU ni contienen headers reensamblables.

### C3 - Reensamblaje de paquetes IP

- Origen del puntaje: enunciado
- Puntaje máximo: 1.7 pts
- Sección: SEC-COD
- Requisito evaluado: los paquetes IP se pueden rearmar correctamente al llegar a destino.
- Evidencia esperada: función `reassemble_IP_packet(fragment_list)`, almacenamiento de fragmentos/paquetes por `ID`, pruebas con fragmentos en orden, en desorden e intercalando IDs.
- Puntaje completo: `reassemble_IP_packet` ordena los fragmentos por `Offset`; reconstruye el paquete original cuando todos los fragmentos están disponibles; retorna `None` si la lista está incompleta; distingue correctamente un paquete completo no fragmentado de una lista incompleta de fragmentos; el router almacena lo recibido en un diccionario usando `ID` como llave; intenta reensamblar cada vez que recibe algo; al completar el paquete imprime el área `[mensaje]` igual que antes; funciona con fragmentos en orden, desordenados e intercalando distintos IDs.
- Puntaje parcial: no hay subpuntajes explícitos; cualquier distribución interna debe considerarse propuesta para revisión humana.
- Puntaje cero: no existe reensamblaje funcional o el router no puede recuperar el mensaje original al recibir fragmentos.

### I1 - Informe de pruebas de fragmentación

- Origen del puntaje: enunciado
- Puntaje máximo: 1.5 pts
- Sección: SEC-INF
- Requisito evaluado: el informe en Markdown documenta pruebas que demuestran TTL, round-robin, fragmentación y reensamblaje.
- Evidencia esperada: informe Markdown con comandos, paquetes usados, observaciones y resultados de pruebas con la configuración de 5 routers con MTU.
- Puntaje completo: el informe comprueba que el código sigue manejando correctamente TTL y rutas alternadas por round-robin usando paquetes no afectados por fragmentación, por ejemplo `127.0.0.1;8885;010;00000347;00000000;00000005;0;hola!` de R1 a R5; usa `netcat` para enviar datagramas IP; prueba un paquete IP de tamaño total 150 bytes enviado varias veces de R1 a R5; verifica fragmentación y reensamblaje exitosos; describe cómo cambia el comportamiento al enviar desde otros routers; indica si el código logra fragmentar un fragmento en fragmentos más pequeños cuando corresponde.
- Puntaje parcial: no hay desglose explícito; si se requiere, se propone para revisión humana asignar puntaje según cobertura de pruebas de TTL/round-robin, pruebas de fragmentación/reensamblaje, pruebas desde distintos routers y claridad de observaciones.
- Puntaje cero: no se entrega informe o el informe no documenta pruebas relacionadas con los requisitos de la actividad.

## Descuentos, topes y reglas especiales - si corresponde

No corresponde.

## Escala final

- Puntaje máximo original total: 6.0 pts
- Puntaje máximo original por sección:
  - Código: 4.5 pts
  - Informe en Markdown: 1.5 pts
- Ponderación entre secciones:
  - Código: 75%
  - Informe en Markdown: 25%
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales: puntaje total de 6 pts, distribución 1.5 pts informe y 4.5 pts código, y desglose de código en 1.0 pts HEAD, 1.8 pts fragmentación y 1.7 pts reensamblaje.
- Información extraída de los materiales: el informe debe centrarse en pruebas con TTL, round-robin, paquetes sin fragmentación, paquetes de tamaño total 150 bytes, envíos con `netcat`, comportamiento desde distintos routers y fragmentación de fragmentos.
- Puntajes o niveles propuestos: no hay subpuntajes explícitos dentro de cada criterio; las reglas de puntaje parcial indicadas son propuestas para revisión humana.
- Ambigüedades no resueltas: el material no especifica una distribución interna para el informe ni para cada funcionalidad de código.
- Requisitos no verificables solo con el material: la existencia exacta de archivos entregados, comandos de prueba automatizados y resultados de ejecución dependen del ambiente de corrección disponible.
