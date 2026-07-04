# Pauta de evaluación

## Alcance

Se evalúa la entrega de la Tarea 1 de CC4303: construcción de un proxy HTTP en Python que recibe solicitudes de clientes, las reenvía a servidores HTTP, filtra sitios bloqueados, reemplaza palabras prohibidas según un JSON, modifica headers y maneja mensajes mayores que el buffer de recepción. También se evalúa un informe en Markdown que documenta el diseño, funcionamiento, pruebas y manejo de mensajes HTTP.

El proxy debe funcionar para páginas HTTP. No se exige funcionamiento correcto para HTTPS.

## Secciones y ponderación - si corresponde

| Sección | Identificador | Ponderación | Puntaje máximo original |
|---|---:|---:|---:|
| Código | COD | 75% del total, derivado de 4.5/6.0 | 4.5 pts |
| Informe en Markdown | INF | 25% del total, derivado de 1.5/6.0 | 1.5 pts |

## Criterios

### C1 - Cliente recibe una respuesta

- Origen del puntaje: enunciado
- Puntaje máximo: 0.5 pts
- Sección: COD
- Requisito evaluado: el cliente HTTP recibe una respuesta desde el servidor/proxy.
- Evidencia esperada: ejecución del código y pruebas con navegador o `curl`, por ejemplo `curl -i localhost:8000` o solicitudes usando el proxy con `curl -x localhost:8000`.
- Puntaje completo: el cliente recibe una respuesta HTTP observable y satisfactoria para una solicitud válida.
- Puntaje parcial: no especificado en el material; se propone para revisión humana asignar hasta 0.25 pts si el cliente recibe datos pero la respuesta es incompleta, malformada o no sirve consistentemente como respuesta HTTP.
- Puntaje cero: el cliente no recibe respuesta, la conexión falla sin entregar datos útiles o el programa no puede ejecutarse para atender solicitudes.

### C2 - Bloqueo correcto de sitios prohibidos

- Origen del puntaje: enunciado
- Puntaje máximo: 1.0 pts
- Sección: COD
- Requisito evaluado: el proxy bloquea correctamente las direcciones indicadas en la lista `blocked` del archivo JSON.
- Evidencia esperada: archivo JSON con sitios bloqueados, código del proxy y pruebas con `curl` o navegador accediendo a `http://cc4303.bachmann.cl/secret` mediante el proxy.
- Puntaje completo: al recibir una URI bloqueada, el proxy retorna código HTTP 403 junto a un HTML que muestra una imagen local; las páginas no bloqueadas siguen funcionando.
- Puntaje parcial: no especificado en el material; se propone para revisión humana asignar puntaje parcial si se bloquean algunas direcciones pero no todas, si el bloqueo no usa correctamente el JSON, si retorna 403 sin el HTML solicitado, o si el bloqueo afecta indebidamente páginas permitidas.
- Puntaje cero: el proxy no bloquea sitios prohibidos o bloquea de forma incompatible con el comportamiento solicitado.

### C3 - Reemplazo de palabras prohibidas según JSON

- Origen del puntaje: enunciado
- Puntaje máximo: 1.2 pts
- Sección: COD
- Requisito evaluado: el proxy reemplaza contenido inadecuado usando las reglas de `forbidden_words` definidas en el JSON.
- Evidencia esperada: archivo JSON con pares de reemplazo, pruebas con `curl` o navegador accediendo a `http://cc4303.bachmann.cl/` y `http://cc4303.bachmann.cl/replace` mediante el proxy.
- Puntaje completo: todas las palabras prohibidas indicadas en el JSON son reemplazadas por sus valores correspondientes, el texto mostrado conserva el contenido esperado salvo las censuras y no aparecen errores en el contenido.
- Puntaje parcial: no especificado en el material; se propone para revisión humana asignar puntaje parcial si solo se reemplazan algunas palabras, si los reemplazos están parcialmente hardcodeados, si no se actualiza correctamente el contenido resultante o si el reemplazo funciona solo en algunos sitios de prueba.
- Puntaje cero: no se reemplazan las palabras prohibidas o la respuesta queda inutilizable.

### C4 - Modificación correcta de headers

- Origen del puntaje: enunciado
- Puntaje máximo: 0.5 pts
- Sección: COD
- Requisito evaluado: el proxy modifica correctamente los headers requeridos, en particular agregando `X-ElQuePregunta` con el nombre o usuario configurado.
- Evidencia esperada: archivo JSON con el campo `user`, pruebas con `curl -i` y acceso a `http://cc4303.bachmann.cl/` mediante el proxy para observar el cambio en el mensaje de bienvenida.
- Puntaje completo: para solicitudes no bloqueadas, el proxy agrega correctamente el header `X-ElQuePregunta` a la request enviada al servidor, usando el valor parametrizado desde el JSON.
- Puntaje parcial: no especificado en el material; se propone para revisión humana asignar hasta 0.25 pts si el header se agrega con nombre hardcodeado, se agrega en una etapa incorrecta pero produce parte del efecto esperado, o falla en algunos casos.
- Puntaje cero: el header requerido no se agrega o no tiene efecto verificable.

### C5 - Manejo de mensajes más grandes que el buffer del socket

- Origen del puntaje: enunciado
- Puntaje máximo: 1.3 pts
- Sección: COD
- Requisito evaluado: el proxy recibe correctamente mensajes HTTP cuyo tamaño excede el buffer de recepción del socket.
- Evidencia esperada: código de recepción de mensajes HTTP y pruebas con buffers pequeños, por ejemplo `recv_buffer = 50`, incluyendo los casos indicados en el enunciado.
- Puntaje completo: el proxy sigue funcionando cuando el mensaje completo es mayor que el buffer, incluyendo cuando el buffer es menor que el mensaje pero mayor que los headers, y cuando el buffer es menor que el área de headers pero mayor que la start line.
- Puntaje parcial: no especificado en el material; se propone para revisión humana asignar puntaje parcial si maneja solo algunos casos, si recibe headers completos pero falla con body, o si depende de tamaños de buffer mayores a los exigidos en las pruebas.
- Puntaje cero: el proxy solo funciona cuando cada mensaje cabe completo en un único `recv` o falla con buffers pequeños.

### I1 - Diagrama y explicación del flujo del proxy

- Origen del puntaje: propuesto
- Puntaje máximo: 0.4 pts propuestos para revisión humana
- Sección: INF
- Requisito evaluado: el informe incluye un diagrama del flujo de funcionamiento del proxy e identifica cuáles y cuántos sockets se utilizan.
- Evidencia esperada: informe Markdown con diagrama y breve explicación.
- Puntaje completo: el diagrama muestra cliente, proxy y servidor, el flujo de request/response y la cantidad/rol de sockets usados.
- Puntaje parcial: propuesto; asignar parte del puntaje si el diagrama o la explicación están incompletos pero permiten entender parcialmente el flujo.
- Puntaje cero: no se incluye diagrama ni explicación equivalente.

### I2 - Documentación del funcionamiento, diseño y manejo de mensajes HTTP

- Origen del puntaje: propuesto
- Puntaje máximo: 0.5 pts propuestos para revisión humana
- Sección: INF
- Requisito evaluado: el informe documenta el funcionamiento del código, decisiones de diseño y el manejo de mensajes HTTP con buffers pequeños.
- Evidencia esperada: informe Markdown.
- Puntaje completo: el informe explica cómo funciona el proxy, sus decisiones de diseño y responde explícitamente: cómo se sabe si llegó el mensaje completo, qué pasa si los headers no caben en el buffer, cómo se sabe que el HEAD llegó completo y cómo se sabe que el BODY llegó completo.
- Puntaje parcial: propuesto; asignar parte del puntaje si se documenta el funcionamiento pero faltan algunas respuestas explícitas o decisiones de diseño.
- Puntaje cero: no se documenta el funcionamiento ni el manejo de mensajes HTTP.

### I3 - Observaciones de pruebas solicitadas

- Origen del puntaje: propuesto
- Puntaje máximo: 0.5 pts propuestos para revisión humana
- Sección: INF
- Requisito evaluado: el informe registra las observaciones pedidas en la sección de pruebas.
- Evidencia esperada: informe Markdown con resultados de pruebas usando browser y/o `curl`.
- Puntaje completo: incluye observaciones sobre: bloqueo de `http://cc4303.bachmann.cl/secret` con error 403; cambio de contenido por headers en `http://cc4303.bachmann.cl/`; visualización de `/` y `/replace` con palabras prohibidas modificadas; funcionamiento con los dos casos de buffer pequeño indicados.
- Puntaje parcial: propuesto; asignar parte del puntaje si se reportan solo algunas pruebas u observaciones.
- Puntaje cero: no se reportan las pruebas solicitadas.

### I4 - Formato Markdown del informe

- Origen del puntaje: propuesto
- Puntaje máximo: 0.1 pts propuestos para revisión humana
- Sección: INF
- Requisito evaluado: el informe está entregado en formato Markdown.
- Evidencia esperada: archivo de informe `.md`.
- Puntaje completo: el informe está en Markdown y es legible.
- Puntaje parcial: propuesto; no se propone puntaje parcial.
- Puntaje cero: no se entrega informe en Markdown.

## Descuentos, topes y reglas especiales - si corresponde

- Compatibilidad HTTPS: el material indica que el proxy debe funcionar con páginas HTTP y que es posible que no funcione para HTTPS. No corresponde descontar por falta de soporte HTTPS si el funcionamiento HTTP requerido está correcto.
- No se especifican descuentos, topes de nota ni notas directas adicionales en el material.

## Escala final

- Puntaje máximo original por sección o total:
  - Código: 4.5 pts
  - Informe en Markdown: 1.5 pts
  - Total: 6.0 pts
- Ponderación entre secciones:
  - Código: 75%, derivado de 4.5/6.0
  - Informe: 25%, derivado de 1.5/6.0
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales:
  - La tarea consiste en construir un proxy HTTP.
  - El puntaje original es 4.5 pts de código y 1.5 pts de informe en Markdown.
  - El desglose explícito de código es: 0.5 pts por recibir respuesta, 1.0 pts por bloqueo, 1.2 pts por reemplazo de palabras, 0.5 pts por modificación de headers y 1.3 pts por manejo de mensajes mayores que el buffer.
  - El JSON contiene `user`, `blocked` y `forbidden_words`.
  - El informe debe incluir diagrama del proxy, explicación, documentación del código, decisiones de diseño, respuestas sobre manejo de HEAD/BODY y observaciones de pruebas.
- Puntajes o niveles propuestos:
  - La distribución interna del informe en I1–I4 es propuesta, porque el material solo entrega el total de 1.5 pts para informe.
  - Las reglas de puntaje parcial son propuestas, porque el material no especifica niveles intermedios.
- Ambigüedades no resueltas:
  - No se indican nombres obligatorios de archivos de código.
  - No se entrega una pauta detallada para el informe.
  - “Se modifican correctamente los headers” puede abarcar más de un header, pero el requisito verificable más explícito es `X-ElQuePregunta`.
- Requisitos no verificables con el material o ambiente disponible:
  - No es posible verificar aquí la disponibilidad real de `cc4303.bachmann.cl` ni el comportamiento del navegador del estudiante.
  - No se especifica un comando único obligatorio para ejecutar la solución, salvo que el JSON debe poder recibirse como argumento.
