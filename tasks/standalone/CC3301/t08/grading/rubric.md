# Pauta de evaluación

## Alcance

Se evalúa la implementación del comando `masrecientes` en `masrecientes.c`, empaquetado mediante `make zip` como `masrecientes.zip`, que debe recibir un directorio `dir` y un entero `n`, recorrer recursivamente `dir` en profundidad y mostrar por salida estándar los `n` archivos regulares modificados más recientemente.

La evaluación considera los requisitos funcionales del enunciado, la metodología obligatoria indicada y los comportamientos verificados por los materiales de prueba públicos (`make run`, `make run-g`, `make run-san`, `test.sh`, referencias esperadas y archivos de ejemplo).

## Criterios

### P1 - Integración, compilación e invocación del comando

- Origen del puntaje: propuesto
- Puntaje máximo: 0.7 puntos propuestos
- Requisito evaluado: el programa se implementa en `masrecientes.c`, compila con los comandos provistos y se invoca como `./masrecientes.bin dir n`.
- Evidencia esperada: ejecución exitosa de `make`, `make run`, `make run-g`, `make run-san` o comandos equivalentes del material.
- Puntaje completo: compila sin errores, genera el binario esperado y acepta exactamente los parámetros requeridos para las pruebas públicas.
- Puntaje parcial: propuesto; hasta 0.4 si compila pero falla alguna integración con los targets provistos; hasta 0.2 si requiere ajustes menores de invocación no respaldados por el material.
- Puntaje cero: no compila, no genera binario ejecutable o no existe `masrecientes.c`.

### P2 - Recorrido recursivo en profundidad del directorio

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0 puntos propuestos
- Requisito evaluado: recorrer recursivamente el directorio recibido, basándose en la lógica de `list-dir.c`.
- Evidencia esperada: comportamiento observable al ejecutar `./masrecientes.bin dir1 3` y `./masrecientes.bin dir2 10`; inspección de código si corresponde.
- Puntaje completo: visita correctamente los archivos contenidos en subdirectorios anidados y omite las entradas `.` y `..`.
- Puntaje parcial: propuesto; hasta 0.7 si recorre subdirectorios pero omite algunos niveles o casos; hasta 0.4 si solo recorre parcialmente; hasta 0.2 si solo procesa el directorio raíz.
- Puntaje cero: no realiza recorrido recursivo del directorio recibido.

### P3 - Selección exclusiva de archivos regulares

- Origen del puntaje: propuesto
- Puntaje máximo: 0.8 puntos propuestos
- Requisito evaluado: considerar solo archivos regulares y no mostrar directorios u otros tipos de archivo.
- Evidencia esperada: salida estándar sin nombres de directorios, especialmente casos como `dir1/tamanos-distintos` frente a `dir1/tamanos-distintos/cardinales.txt`.
- Puntaje completo: usa información de `stat` y `S_ISREG` para incluir únicamente archivos regulares.
- Puntaje parcial: propuesto; hasta 0.5 si excluye directorios pero falla con algunos tipos especiales; hasta 0.3 si mezcla archivos y directorios ocasionalmente.
- Puntaje cero: incluye directorios como resultados o no distingue archivos regulares.

### P4 - Obtención y almacenamiento de nombre y fecha de modificación

- Origen del puntaje: propuesto
- Puntaje máximo: 0.9 puntos propuestos
- Requisito evaluado: por cada archivo regular encontrado, guardar su nombre y fecha de modificación `st_mtime`.
- Evidencia esperada: código que usa `stat`, `st_mtime`, estructuras dinámicas y copias de nombres mediante `strdup` o mecanismo equivalente seguro.
- Puntaje completo: almacena correctamente nombre completo y fecha de modificación de cada archivo regular encontrado.
- Puntaje parcial: propuesto; hasta 0.6 si obtiene las fechas pero con errores menores en nombres/rutas; hasta 0.4 si guarda nombres correctos pero ordena con metadatos incompletos; hasta 0.2 si depende de otro criterio no indicado.
- Puntaje cero: no usa la fecha de modificación para decidir los resultados.

### P5 - Ordenamiento por fecha de modificación y elección de los `n` más recientes

- Origen del puntaje: propuesto
- Puntaje máximo: 1.3 puntos propuestos
- Requisito evaluado: ordenar los archivos encontrados por fecha de modificación y seleccionar los `n` primeros correspondientes a los más recientes.
- Evidencia esperada: uso de una función comparadora para ordenar por fecha; salida coincidente con `ref-dir1` y `ref-dir2`.
- Puntaje completo: entrega exactamente los `n` archivos más recientes, en el orden esperado por las referencias públicas.
- Puntaje parcial: propuesto; hasta 0.9 si identifica el conjunto correcto pero con orden incorrecto; hasta 0.6 si ordena por fecha pero falla en algunos casos; hasta 0.3 si respeta `n` pero no el criterio de reciente.
- Puntaje cero: no ordena por fecha de modificación o no limita la salida a `n` resultados.

### P6 - Formato de salida y comportamiento observable en pruebas

- Origen del puntaje: material de evaluación
- Puntaje máximo: 0.8 puntos propuestos
- Requisito evaluado: imprimir solo los nombres de archivos esperados, uno por línea, por salida estándar; retornar código 0 y no escribir en salida estándar de errores en las ejecuciones válidas.
- Evidencia esperada: `diff recientes.txt ref-dir1.txt`, `diff recientes.txt ref-dir2.txt`, `cmp err.txt empty.txt` en `test.sh`.
- Puntaje completo: la salida estándar coincide exactamente con las referencias y la salida de errores está vacía.
- Puntaje parcial: propuesto; hasta 0.5 si los archivos son correctos pero hay diferencias menores de formato; hasta 0.3 si hay salida adicional o faltante; hasta 0.2 si el código de retorno es incorrecto pese a producir parte de la salida.
- Puntaje cero: la salida no es comparable con la esperada o el programa termina con error en casos válidos.

### P7 - Uso de la metodología obligatoria indicada

- Origen del puntaje: enunciado
- Puntaje máximo: 0.7 puntos propuestos
- Requisito evaluado: usar la cola `Queue`, calcular su tamaño con `queueLength`, transferir sus elementos a un arreglo y ordenar con `sortPtrArray`.
- Evidencia esperada: inspección de `masrecientes.c` y uso de funciones declaradas en `pss.h`.
- Puntaje completo: sigue la metodología descrita: cola global, estructuras creadas con `malloc`, transferencia a arreglo y ordenamiento con `sortPtrArray`.
- Puntaje parcial: propuesto; hasta 0.5 si usa parte sustantiva de la metodología; hasta 0.3 si resuelve funcionalmente pero omite varios elementos obligatorios.
- Puntaje cero: no sigue la metodología obligatoria o reemplaza completamente los mecanismos exigidos.

### P8 - Gestión de memoria y limpieza bajo sanitizers

- Origen del puntaje: enunciado y README
- Puntaje máximo: 0.8 puntos propuestos
- Requisito evaluado: liberar la memoria que `sanitize` diagnostique como gotera de memoria y evitar referencias colgantes u otros problemas.
- Evidencia esperada: `make run-san` felicita y no reporta goteras de memoria, referencias colgantes ni errores similares.
- Puntaje completo: no presenta errores de memoria reportados por `make run-san`.
- Puntaje parcial: propuesto; hasta 0.5 si la funcionalidad es correcta pero queda alguna fuga menor; hasta 0.3 si hay errores de memoria no fatales en algunos casos.
- Puntaje cero: presenta errores graves de memoria, referencias colgantes, uso después de liberar o falla bajo `make run-san`.

## Descuentos, topes y reglas especiales - si corresponde

- Condición explícita de aprobación: `make run-san`, `make run-g` y `make run` deben felicitar al estudiante. Efecto: el material lo declara como requisito para aprobar la tarea; no se especifica un descuento numérico adicional.
- Condición explícita de memoria: `make run-san` no debe reportar goteras de memoria, referencias colgantes ni problemas similares.
- Condición de ambiente: la tarea debe probarse bajo Debian 11 de 64 bits nativo o virtualizado; el material advierte que los tests no aprobarán si `trec.zip` se descomprime en un sistema de archivos de Windows.
- No se especifican descuentos numéricos, topes de nota ni notas directas adicionales en los materiales.

## Escala final

- Puntaje máximo original por sección o total: no hay puntaje original especificado; total propuesto para revisión humana: 6.0 puntos
- Ponderación entre secciones: no corresponde
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales: comando `masrecientes`, parámetros `dir` y `n`, recorrido recursivo en profundidad, solo archivos regulares, uso de `stat.st_mtime`, metodología con `Queue`, `queueLength`, arreglo y `sortPtrArray`, uso de `strdup`, liberación de memoria y aprobación de `make run`, `make run-g`, `make run-san`.
- Puntajes o niveles propuestos: todos los puntajes máximos y reglas de puntaje parcial son propuestos, porque el material no entrega una pauta numérica.
- Ambigüedades no resueltas: no se especifica qué hacer si `n` es mayor que la cantidad de archivos, si `n` no es entero válido, si el directorio no existe o cómo desempatar archivos con igual `st_mtime`.
- Requisitos no verificables completamente con el material disponible: el grado exacto de fiscalización de la “metodología obligatoria” puede requerir inspección manual del código además de las pruebas públicas.
