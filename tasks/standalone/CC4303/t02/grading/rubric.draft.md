# Pauta de evaluación

## Alcance

Se evalúa la entrega independiente de la Tarea 2 de CC4303: implementación de un resolver DNS en `resolver.py` y un informe en Markdown. El código debe recibir consultas DNS tipo A mediante `dig` en `localhost:8000`, resolverlas consultando servidores DNS desde el servidor raíz indicado, responder a `dig` en formato DNS válido y usar caché según lo especificado. El informe debe registrar respuestas, resultados, observaciones y explicaciones solicitadas para los experimentos y preguntas del enunciado.

## Secciones y ponderación - si corresponde

- **COD**: Código, puntaje máximo original **3.5 pts**.
- **INF**: Informe en Markdown, puntaje máximo original **2.5 pts**.

## Criterios

### C1 - Resolución DNS siguiendo el procedimiento indicado

- Origen del puntaje: enunciado
- Puntaje máximo: **2.0 pts**
- Sección: COD
- Requisito evaluado: el resolver sigue correctamente los pasos del punto 3 para consultar dominios DNS tipo A.
- Evidencia esperada: archivo `resolver.py`; ejecución del resolver en `localhost:8000`; consultas con `dig -p8000 @localhost eol.uchile.cl`, `www.uchile.cl` y `cc4303.bachmann.cl`; trazas del modo debug cuando corresponda.
- Puntaje completo: implementa una función `resolver(mensaje_consulta)` que recibe el mensaje DNS en bytes, consulta al servidor raíz `192.33.4.12` en puerto DNS, procesa respuestas con registros A en Answer, sigue delegaciones NS usando registros A en Additional o resolviendo recursivamente el Name Server cuando no hay IP en Additional, ignora otros tipos de respuesta según lo indicado y retorna una respuesta DNS útil al cliente.
- Puntaje parcial: asignar proporcionalmente según avance observable en recepción de mensajes DNS, parseo, consulta al root server, seguimiento de delegaciones, resolución recursiva de Name Servers y envío final de respuestas. Esta distribución interna es propuesta para revisión humana.
- Puntaje cero: no existe un resolver funcional o no realiza consultas DNS externas para resolver dominios.

### C2 - Respuesta compatible con `dig`

- Origen del puntaje: enunciado
- Puntaje máximo: **0.5 pts**
- Sección: COD
- Requisito evaluado: el resolver entrega una respuesta a `dig` en el formato correcto.
- Evidencia esperada: ejecución de comandos como `dig -p8000 @localhost www.uchile.cl` sin errores de formato ni timeouts cuando el dominio es resoluble por el resolver.
- Puntaje completo: `dig` recibe y muestra una respuesta DNS válida desde el resolver.
- Puntaje parcial: propuesto para revisión humana: otorgar parte del puntaje si el resolver responde pero con problemas menores de contenido o encabezados que impiden cumplir completamente el formato esperado.
- Puntaje cero: `dig` no recibe respuesta, recibe bytes no parseables como DNS o siempre termina en timeout.

### C3 - Uso de caché

- Origen del puntaje: enunciado
- Puntaje máximo: **1.0 pts**
- Sección: COD
- Requisito evaluado: si se consulta por un dominio consultado anteriormente, se utiliza el caché.
- Evidencia esperada: repetición de consultas con `dig -p8000 @localhost eol.uchile.cl`; modo debug indicando uso del caché; misma IP esperada `146.83.63.70` en la segunda consulta.
- Puntaje completo: mantiene un caché con los últimos 3 dominios que más se repiten dentro de las últimas 20 consultas recibidas, revisa el caché antes de resolver, responde con la IP almacenada cuando corresponde y el modo debug indica si se usa caché.
- Puntaje parcial: propuesto para revisión humana: otorgar parte del puntaje si existe caché funcional pero no respeta completamente el criterio de “últimos 3 dominios más repetidos dentro de las últimas 20 consultas” o si no informa claramente el uso de caché en debug.
- Puntaje cero: no implementa caché o nunca responde desde caché ante consultas repetidas.

### I1 - Preguntas e indicaciones preliminares del informe

- Origen del puntaje: propuesto
- Puntaje máximo: **0.4 pts** propuesto para revisión humana
- Sección: INF
- Requisito evaluado: el informe registra las respuestas solicitadas antes y durante la construcción inicial del resolver.
- Evidencia esperada: informe Markdown con la indicación del tipo de socket usado para asociarse a `('localhost', 8000)` y la comparación solicitada sobre la IP obtenida al consultar `example.com` con `dig @8.8.8.8`.
- Puntaje completo: responde ambas indicaciones de forma clara y coherente con el funcionamiento de DNS y sockets.
- Puntaje parcial: propuesto para revisión humana: otorgar parte del puntaje si solo una de las respuestas está presente o si la comparación es incompleta.
- Puntaje cero: no incluye estas respuestas.

### I2 - Experimento con `www.webofscience.com`

- Origen del puntaje: propuesto
- Puntaje máximo: **0.7 pts** propuesto para revisión humana
- Sección: INF
- Requisito evaluado: el informe documenta el experimento solicitado para `www.webofscience.com`.
- Evidencia esperada: resultado de intentar resolver `www.webofscience.com` con el programa y respuestas a: si resuelve, qué sucede, por qué sucede y cómo se arreglaría.
- Puntaje completo: incluye observación del comportamiento, explicación técnica basada en DNS y propuesta de arreglo.
- Puntaje parcial: propuesto para revisión humana: otorgar parte del puntaje si faltan algunas preguntas o la explicación es incompleta.
- Puntaje cero: no reporta el experimento.

### I3 - Experimento con `www.cc4303.bachmann.cl`

- Origen del puntaje: propuesto
- Puntaje máximo: **0.8 pts** propuesto para revisión humana
- Sección: INF
- Requisito evaluado: el informe documenta y explica el comportamiento al ejecutar `dig -p8000 @localhost www.cc4303.bachmann.cl`.
- Evidencia esperada: observación de lo ocurrido, contraste con `dig @8.8.8.8 www.cc4303.bachmann.cl` y explicación usando conocimientos de DNS.
- Puntaje completo: presenta observación, expectativa, contraste con Google DNS y explicación técnica coherente.
- Puntaje parcial: propuesto para revisión humana: otorgar parte del puntaje si hay observaciones sin contraste, contraste sin explicación o explicación insuficiente.
- Puntaje cero: no reporta el experimento.

### I4 - Experimento de consultas repetidas y Name Servers

- Origen del puntaje: propuesto
- Puntaje máximo: **0.6 pts** propuesto para revisión humana
- Sección: INF
- Requisito evaluado: el informe analiza consultas repetidas a un mismo dominio usando el modo debug.
- Evidencia esperada: registros u observaciones sobre los Name Servers y direcciones IP consultadas en varias ejecuciones, respuesta a si son siempre los mismos y explicación de por qué ocurre.
- Puntaje completo: describe las consultas internas observadas y entrega una explicación coherente.
- Puntaje parcial: propuesto para revisión humana: otorgar parte del puntaje si reporta observaciones pero la explicación es incompleta.
- Puntaje cero: no reporta este experimento.

## Descuentos, topes y reglas especiales - si corresponde

No corresponde.

## Escala final

- Puntaje máximo original por sección o total: **3.5 pts código + 2.5 pts informe = 6.0 pts total**
- Ponderación entre secciones: código **3.5/6.0**, informe **2.5/6.0**
- Nota mínima del benchmark: **1.0**
- Nota máxima del benchmark: **7.0**
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales: puntajes máximos de código e informe; desglose de código en 2.0, 0.5 y 1.0 pts; pruebas funcionales esperadas; dominios e IPs indicadas; experimentos requeridos para el informe.
- Puntajes o niveles propuestos: desglose interno de los **2.5 pts** del informe; reglas de puntaje parcial dentro de cada criterio.
- Ambigüedades no resueltas: el enunciado no entrega desglose explícito para el informe ni puntaje específico para el modo debug fuera de su relación con pruebas, caché y experimentos.
- Requisitos que pueden depender del ambiente: disponibilidad de red, servidores DNS externos, respuestas actuales de dominios y comportamiento temporal de Name Servers.
