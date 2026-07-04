# Pauta de evaluación

## Alcance

Se evalúa la implementación de `./consultar.bin` en `consultar.c` para consultar un diccionario persistente almacenado en un archivo binario como árbol binario de búsqueda. El programa debe recibir el archivo de diccionario y una llave, buscar eficientemente la llave y reproducir el comportamiento de `./prof.ref-$(arch)` en salida estándar, salida estándar de errores y código de retorno.

También se considera la compilación mediante los comandos provistos, la ejecución correcta de los tests indicados y la generación de `consultar.zip` mediante `make zip`. Esta es una tarea independiente; no se evalúan etapas previas.

## Criterios

### P1 - Compilación e integración del ejecutable

- Origen del puntaje: propuesto
- Puntaje máximo: 0.8 puntos propuestos
- Requisito evaluado: la solución debe estar implementada en `consultar.c`, incluyendo `main`, y debe compilar como `consultar.bin` usando los comandos entregados.
- Evidencia esperada: `consultar.c`; ejecución de `make consultar.bin`, `make run`, `make run-g` y `make run-san`.
- Puntaje completo: `make consultar.bin` genera el ejecutable sin errores, `consultar.c` contiene la solución principal y el binario puede ejecutarse con los parámetros esperados.
- Puntaje parcial: propuesto: asignar parte del puntaje si compila solo con advertencias menores o si requiere ajustes menores al flujo de compilación sin cambiar la lógica principal.
- Puntaje cero: no compila, no genera `consultar.bin`, falta `main` o la solución no está en `consultar.c`.

### P2 - Lectura correcta del formato binario del diccionario

- Origen del puntaje: propuesto
- Puntaje máximo: 1.2 puntos propuestos
- Requisito evaluado: interpretar correctamente cada nodo del archivo binario con campos `izq`, `der`, `tam_llave`, `tam_valor`, `llave` y `valor`, respetando tamaños y desplazamientos.
- Evidencia esperada: comportamiento correcto al consultar `defs.dicc` y diccionarios generados por los tests; uso de lectura binaria y posicionamiento en archivo.
- Puntaje completo: lee correctamente enteros de 4 bytes, enteros de 2 bytes, llaves y valores sin terminación de string; interpreta `-1` como ausencia de subárbol y la raíz en desplazamiento `0`.
- Puntaje parcial: propuesto: asignar puntaje proporcional si la lectura funciona para algunos nodos o valores, pero falla en casos con tamaños variables, desplazamientos o terminaciones de string.
- Puntaje cero: trata el diccionario como texto, no interpreta la estructura binaria o no logra leer nodos válidos.

### P3 - Búsqueda funcional de llaves existentes

- Origen del puntaje: propuesto
- Puntaje máximo: 1.4 puntos propuestos
- Requisito evaluado: para llaves existentes, entregar en salida estándar exactamente el valor asociado.
- Evidencia esperada: comparación contra `./prof.ref-$(arch)` mediante `test-consultar.sh`, incluyendo consultas como `perro`, `casa`, `lluvia`, `bolsillo`, `techo` y otras llaves de `defs.dicc`.
- Puntaje completo: para todas las llaves existentes probadas, la salida estándar coincide con la referencia y el código de retorno es correcto.
- Puntaje parcial: propuesto: asignar puntaje según la proporción de consultas existentes respondidas correctamente, siempre que el programa ejecute sin fallas generales.
- Puntaje cero: no encuentra llaves existentes, imprime valores incorrectos o falla en las consultas normales.

### P4 - Manejo de errores y casos inválidos

- Origen del puntaje: propuesto
- Puntaje máximo: 1.2 puntos propuestos
- Requisito evaluado: diagnosticar correctamente errores de archivo, llaves inexistentes y cantidad incorrecta de parámetros.
- Evidencia esperada: ejecución de `test-consultar.sh` en casos de llave inexistente, diccionario inexistente, diccionario sin permiso de lectura, parámetros faltantes y parámetros extra.
- Puntaje completo: usa `perror` cuando no puede leer el diccionario; para llave inexistente o cantidad incorrecta de parámetros emite en `stderr` el mismo mensaje que `./prof.ref-$(arch)`; coincide también el código de retorno.
- Puntaje parcial: propuesto: asignar parte del puntaje si detecta los errores pero difiere parcialmente en mensaje, canal de salida o código de retorno.
- Puntaje cero: no detecta errores, termina anormalmente o reporta errores por un canal incorrecto sin coincidir con la referencia.

### P5 - Eficiencia de búsqueda en árbol binario de búsqueda

- Origen del puntaje: propuesto
- Puntaje máximo: 1.2 puntos propuestos
- Requisito evaluado: minimizar la cantidad de nodos leídos aprovechando que el archivo representa un árbol binario de búsqueda.
- Evidencia esperada: inspección de la estrategia de búsqueda y ejecución del benchmark de eficiencia incluido en `bench.c`.
- Puntaje completo: busca comparando llaves y siguiendo solo los desplazamientos `izq` o `der` necesarios mediante `fseek`; no lee secuencialmente todo el archivo; satisface el test de eficiencia.
- Puntaje parcial: propuesto: asignar puntaje reducido si usa parcialmente los desplazamientos del árbol pero realiza lecturas innecesarias significativas, siempre que no lea completamente el archivo.
- Puntaje cero: recorre secuencialmente el archivo, carga todo el diccionario para buscar o no usa la estructura de árbol binario de búsqueda.

### P6 - Compatibilidad con tests y sanitizers

- Origen del puntaje: propuesto
- Puntaje máximo: 0.7 puntos propuestos
- Requisito evaluado: la solución debe pasar los comandos de prueba indicados sin reportar problemas, incluyendo errores de memoria.
- Evidencia esperada: salidas de `make run`, `make run-g` y `make run-san`, incluidas en `resultados.txt` al ejecutar `make zip`.
- Puntaje completo: los tres comandos felicitan al estudiante y `make run-san` no reporta problemas como memory leaks.
- Puntaje parcial: propuesto: asignar puntaje si los tests funcionales pasan pero hay advertencias o problemas menores detectados por herramientas de depuración/sanitización.
- Puntaje cero: los tests principales fallan, el programa tiene fugas o errores de memoria relevantes, o no se pueden ejecutar los comandos requeridos.

### P7 - Producto esperado

- Origen del puntaje: propuesto
- Puntaje máximo: 0.5 puntos propuestos
- Requisito evaluado: generación del archivo `consultar.zip` con el contenido esperado.
- Evidencia esperada: ejecución de `make zip`; existencia de `consultar.zip` con `consultar.c` y `resultados.txt`.
- Puntaje completo: `make zip` ejecuta los tests y genera `consultar.zip` con `consultar.c` y `resultados.txt`.
- Puntaje parcial: propuesto: asignar parte del puntaje si el archivo se genera pero falta evidencia secundaria o requiere correcciones menores de empaquetado.
- Puntaje cero: no se entrega `consultar.zip` o no contiene la solución requerida.

## Descuentos, topes y reglas especiales - si corresponde

- Requisito explícito para aprobar: `make run-san`, `make run-g` y `make run` deben felicitar al estudiante. El material indica que estos son “los requerimientos para aprobar su tarea”. No se especifica un tope numérico exacto si alguno falla.
- Eficiencia explícita: el benchmark de `bench.c` exige que el sobrecosto respecto de la referencia no exceda `80%`; realiza hasta 5 intentos. Si después de 5 intentos no satisface la eficiencia, el test falla.
- Exactitud frente a la referencia: los tests comparan salida estándar, salida estándar de errores y código de retorno contra `./prof.ref-$(arch)`.
- Ambiente de prueba indicado: Debian 12 nativo o virtualizado; WSL 1 queda excluido y WSL 2 está permitido.
- No se consideran penalizaciones administrativas no descritas en el material.

## Escala final

- Puntaje máximo original total: no especificado en los materiales.
- Puntaje máximo propuesto para revisión humana: 7.0 puntos.
- Ponderación entre secciones: no corresponde; no hay secciones originales con ponderaciones propias.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales: implementación en `consultar.c`; comando `./consultar.bin <diccionario> <llave>`; formato binario del árbol; raíz en posición `0`; uso de `fseek`; errores con `perror` o mensajes iguales a la referencia; tests `make run`, `make run-g`, `make run-san`; generación de `consultar.zip`.
- Puntajes propuestos: todos los puntajes de criterios son propuestos, porque el material no entrega una distribución de puntaje.
- Ambigüedad no resuelta: los mensajes exactos para llave inexistente o uso incorrecto no aparecen escritos; deben verificarse comparando con `./prof.ref-$(arch)`.
- Requisitos no verificables solo con el texto: contenido exacto de `defs.dicc`, comportamiento exacto de `prof.ref-$(arch)` y detalles del `Makefile`; se asume que están disponibles en el ambiente de evaluación.
