# Pauta de evaluación

## Alcance

Se evalúa la entrega final de la Tarea 5 CC4303, “Forwarding básico”, consistente en un único informe en Markdown y el código final de un mini-Internet simulado con sockets UDP. La tarea incluye una Parte I sin TTL y una Parte II con TTL. Se consideran los requisitos funcionales descritos para `router.py`, las tablas de rutas, el manejo de paquetes IP simulados, forwarding, round-robin, TTL y las pruebas/observaciones solicitadas en el informe.

## Secciones y ponderación - si corresponde

- **INF - Informe Markdown**
  - Ponderación: 2/6 pts
  - Puntaje máximo original: 2 pts

- **COD - Código**
  - Ponderación: 4/6 pts
  - Puntaje máximo original: 4 pts

## Criterios

### INF1 - Informe Mini-Internet sin TTL

- Origen del puntaje: enunciado
- Puntaje máximo: 1.0 pt
- Sección: INF
- Requisito evaluado: El informe documenta las pruebas y observaciones solicitadas para la parte sin TTL.
- Evidencia esperada: Informe Markdown con explicaciones, resultados de pruebas y contenidos de tablas de rutas cuando se solicitan.
- Puntaje completo: Incluye las observaciones sobre una tabla de rutas mal configurada, pruebas de round-robin en la estructura de 5 routers, comparación de saltos observados versus mínimos, pruebas con la estructura extendida del Test 2, contenidos de archivos de rutas creados, descripción breve de similitudes/diferencias con tablas de rutas reales, decisión de diseño para round-robin y ubicación de la ruta default.
- Puntaje parcial: Propuesto para revisión humana: asignar proporcionalmente según la cobertura y claridad de los elementos solicitados.
- Puntaje cero: No entrega informe, o el informe no incluye evidencia verificable de la parte sin TTL.

### INF2 - Informe Mini-Internet con TTL

- Origen del puntaje: enunciado
- Puntaje máximo: 1.0 pt
- Sección: INF
- Requisito evaluado: El informe documenta las pruebas y observaciones solicitadas para la parte con TTL.
- Evidencia esperada: Informe Markdown con resultados de pruebas usando TTL, observaciones y comandos o configuraciones usados.
- Puntaje completo: Repite la prueba de tabla de rutas mal configurada con TTL inicial 10, describe diferencias observadas, usa el código de envío línea por línea para probar con un archivo grande en la configuración de 5 routers y comenta qué ocurre con el orden de los paquetes.
- Puntaje parcial: Propuesto para revisión humana: asignar proporcionalmente según la cobertura y claridad de las pruebas y observaciones solicitadas.
- Puntaje cero: No entrega informe, o el informe no incluye evidencia verificable de la parte con TTL.

### COD1 - Forwarding correcto sin TTL

- Origen del puntaje: enunciado
- Puntaje máximo: 1.2 pts
- Sección: COD
- Requisito evaluado: El router implementa correctamente el forwarding básico de paquetes sin TTL.
- Evidencia esperada: Código final, especialmente `router.py`, ejecutable como `python3 router.py router_IP router_puerto router_rutas.txt`, uso de sockets UDP, funciones de parseo/creación de paquetes, lectura de tablas de rutas y pruebas con múltiples routers.
- Puntaje completo: El router recibe parámetros por `sys.argv`, escucha en el par IP/puerto indicado mediante UDP, procesa paquetes en loop, implementa `parse_packet`, `create_packet` y `check_routes`, reenvía paquetes al siguiente salto correcto según la tabla de rutas, ignora paquetes sin ruta e imprime los mensajes de redirección o ausencia de ruta indicados.
- Puntaje parcial: Propuesto para revisión humana: otorgar puntaje proporcional si algunas funciones existen pero fallan en casos de prueba, si el forwarding funciona solo en topologías simples, o si hay errores menores de formato que no impiden verificar la funcionalidad principal.
- Puntaje cero: El código no ejecuta un router UDP funcional o no realiza forwarding de paquetes.

### COD2 - Impresión de mensajes solo en destino

- Origen del puntaje: enunciado
- Puntaje máximo: 0.3 pts
- Sección: COD
- Requisito evaluado: Los routers imprimen el contenido del mensaje solo cuando el paquete está dirigido a ellos.
- Evidencia esperada: Ejecución con múltiples routers y paquetes dirigidos a distintos destinos.
- Puntaje completo: Un router imprime el contenido sin headers únicamente cuando la IP y puerto de destino corresponden a su propia dirección. Se permiten mensajes de debug.
- Puntaje parcial: Propuesto para revisión humana: otorgar parte del puntaje si el comportamiento es correcto en algunos casos, pero imprime contenido indebidamente en ciertos forwards o rutas.
- Puntaje cero: Los routers imprimen el mensaje de datos aunque el paquete no esté dirigido a ellos, o nunca imprimen mensajes destinados a ellos.

### COD3 - Round-robin correcto

- Origen del puntaje: enunciado
- Puntaje máximo: 1.0 pt
- Sección: COD
- Requisito evaluado: El router alterna correctamente entre múltiples rutas posibles mediante round-robin.
- Evidencia esperada: Código de selección de rutas, estado de round-robin, tablas de rutas con múltiples opciones y pruebas en la estructura de 5 routers y estructura extendida.
- Puntaje completo: Cuando existe más de una ruta posible, el router cicla entre ellas en orden round-robin, mantiene el estado entre paquetes y separa correctamente el estado para distintas áreas o rangos de destino, funcionando para un número arbitrario de rutas posibles.
- Puntaje parcial: Propuesto para revisión humana: otorgar puntaje proporcional si alterna solo entre dos rutas, si no separa correctamente áreas distintas, si pierde estado en algunos casos, o si funciona solo para la topología entregada.
- Puntaje cero: No implementa round-robin o siempre elige la misma ruta cuando hay múltiples opciones.

### COD4 - Manejo del nuevo header TTL

- Origen del puntaje: enunciado
- Puntaje máximo: 0.5 pts
- Sección: COD
- Requisito evaluado: El código maneja correctamente el nuevo formato de paquete con TTL.
- Evidencia esperada: Funciones `parse_packet` y `create_packet` actualizadas, pruebas de conversión ida y vuelta con paquetes que incluyen TTL.
- Puntaje completo: El router reconoce paquetes con formato `[Dirección IP];[Puerto];[TTL];[mensaje]`, extrae y conserva correctamente el campo TTL y puede reconstruir el paquete sin perder información.
- Puntaje parcial: Propuesto para revisión humana: otorgar parte del puntaje si el TTL se parsea pero existen errores menores de tipo, formato o reconstrucción.
- Puntaje cero: El código no reconoce paquetes con TTL o falla al parsearlos.

### COD5 - Actualización correcta del TTL

- Origen del puntaje: enunciado
- Puntaje máximo: 0.5 pts
- Sección: COD
- Requisito evaluado: El TTL se actualiza correctamente al reenviar paquetes.
- Evidencia esperada: Ejecución con al menos 3 routers y paquetes con TTL inicial conocido.
- Puntaje completo: Antes de reenviar un paquete, el router decrementa el TTL en 1 y reenvía el paquete con el TTL actualizado.
- Puntaje parcial: Propuesto para revisión humana: otorgar parte del puntaje si decrementa el TTL en algunos forwards, pero no en todos los caminos o presenta errores de borde.
- Puntaje cero: El TTL no se modifica al reenviar paquetes o se modifica de forma incompatible con el enunciado.

### COD6 - Descarte de paquetes según TTL

- Origen del puntaje: enunciado
- Puntaje máximo: 0.5 pts
- Sección: COD
- Requisito evaluado: El router descarta paquetes cuando corresponde según su TTL.
- Evidencia esperada: Pruebas con paquetes de TTL bajo, por ejemplo desde R1 a R3 con TTL 1 en una estructura de al menos 3 routers.
- Puntaje completo: El router procesa paquetes solo si `TTL > 0`; si recibe un paquete con `TTL = 0`, lo ignora, no lo reenvía e imprime `Se recibió paquete [paquete_ip] con TTL 0`.
- Puntaje parcial: Propuesto para revisión humana: otorgar parte del puntaje si descarta correctamente pero no imprime el mensaje indicado, o si el descarte falla solo en algunos casos.
- Puntaje cero: Los paquetes con TTL 0 son reenviados o procesados como si fueran válidos.

## Descuentos, topes y reglas especiales - si corresponde

No corresponde.

## Escala final

- Puntaje máximo original total: 6 pts
- Puntaje máximo original por sección:
  - Informe Markdown: 2 pts
  - Código: 4 pts
- Ponderación entre secciones:
  - Informe Markdown: 2/6
  - Código: 4/6
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales:
  - La tarea vale 6 pts totales.
  - El informe vale 2 pts y el código vale 4 pts.
  - El desglose explícito del código es: forwarding correcto 1.2, impresión solo en destino 0.3, round-robin 1.0, manejo de header TTL 0.5, actualización TTL 0.5 y descarte por TTL 0.5.
  - El informe se divide en pruebas sin TTL 1 pt y pruebas con TTL 1 pt.

- Puntajes o niveles propuestos:
  - Los niveles de puntaje parcial dentro de cada criterio son propuestos para revisión humana, porque el material no entrega subpuntajes internos.

- Ambigüedades no resueltas:
  - El enunciado muestra ejemplos con separadores `;` y también ejemplos con `,` para paquetes con TTL.
  - El código `prueba_router.py` se solicita como apoyo para pruebas, pero no tiene puntaje explícito separado en el desglose de código.
  - La sección “Simulando un mini-Internet” es referenciada, pero no está incluida en el material proporcionado.

- Requisitos que no pueden verificarse solo con el material:
  - Las imágenes de las topologías no están disponibles en el texto entregado.
  - La verificación completa requiere ejecutar múltiples procesos de routers y enviar paquetes UDP con `netcat` o scripts de prueba.
