# Pauta de evaluación

## Alcance

Evalúa la entrega de la Tarea 2 CC3001: una calculadora de expresiones matemáticas restringidas. La entrega esperada incluye un archivo `.py` con las funciones `procesar_comando(comando, dicc_var)` y `calculadora(lista_comandos)`, y un documento Markdown que describa el problema, la estrategia mediante diagramas de estados y las explicaciones necesarias.

Se evalúa que la calculadora procese comandos de asignación y consulta de variables, use variables enteras, operadores `+`, `-`, `*`, `/`, `^`, evalúe expresiones de izquierda a derecha sin paréntesis, imprima resultados o errores según corresponda, y procese la entrada carácter a carácter sin usar funciones de Python que operen sobre strings de largo mayor que uno para dicho procesamiento.

## Criterios

### P1 - Entregables e interfaz esperada

- Origen del puntaje: propuesto
- Puntaje máximo: 0.6
- Requisito evaluado: entrega de los archivos esperados y definición de la interfaz indicada en el enunciado.
- Evidencia esperada: archivo `.py`, archivo Markdown, funciones `procesar_comando(comando, dicc_var)` y `calculadora(lista_comandos)`.
- Puntaje completo: la entrega incluye ambos archivos; las funciones tienen la firma esperada; `procesar_comando` recibe un comando y un diccionario, imprime cuando corresponde y retorna el diccionario; `calculadora` inicializa el diccionario y procesa la lista de comandos.
- Puntaje parcial: hasta 0.3 por archivos y firmas correctas; hasta 0.2 por flujo correcto entre `calculadora` y `procesar_comando`; hasta 0.1 por retornar y mantener correctamente el diccionario.
- Puntaje cero: no se entrega código ejecutable o no existe una interfaz compatible con la solicitada.

### P2 - Procesamiento sintáctico carácter a carácter

- Origen del puntaje: propuesto
- Puntaje máximo: 1.1
- Requisito evaluado: procesamiento de comandos siguiendo la estructura definida, carácter a carácter, sin usar funciones de Python que operen sobre strings de largo mayor que uno para el análisis.
- Evidencia esperada: implementación del analizador en el `.py`; revisión de código.
- Puntaje completo: reconoce variables que comienzan con letra y continúan con letras, dígitos o `_`; reconoce números enteros, operadores permitidos y `=`; admite espacios como en los ejemplos; distingue asignaciones de consultas; detecta sintaxis incorrecta; todo el procesamiento relevante se realiza carácter a carácter.
- Puntaje parcial: hasta 0.4 por reconocer correctamente variables, números y operadores; hasta 0.3 por manejar asignaciones, consultas y espacios; hasta 0.2 por detectar sintaxis inválida; hasta 0.2 por cumplir la restricción de procesamiento carácter a carácter.
- Puntaje cero: el análisis se basa principalmente en mecanismos incompatibles con la restricción, como separar toda la expresión con funciones de strings de largo mayor que uno, expresiones regulares o evaluación directa de strings.

### P3 - Variables, asignaciones y consultas

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0
- Requisito evaluado: manejo de variables definidas por el usuario.
- Evidencia esperada: ejecución con comandos como `n=5`, `hanoi=2^n-1`, `n`.
- Puntaje completo: una asignación `variable=expresión` calcula la expresión, guarda el resultado en la variable e imprime el valor; una consulta sin `=` imprime el valor de la variable; los valores quedan disponibles para comandos posteriores.
- Puntaje parcial: hasta 0.4 por guardar correctamente asignaciones; hasta 0.3 por consultar variables ya definidas; hasta 0.3 por mantener el estado entre comandos.
- Puntaje cero: no se implementa almacenamiento de variables o las variables no pueden reutilizarse.

### P4 - Evaluación de expresiones enteras

- Origen del puntaje: propuesto
- Puntaje máximo: 1.4
- Requisito evaluado: cálculo correcto de expresiones restringidas.
- Evidencia esperada: pruebas con operadores `+`, `-`, `*`, `/`, `^`, operandos numéricos y variables.
- Puntaje completo: implementa los operadores permitidos; trabaja con números enteros; la división entrega resultado entero truncado; no usa paréntesis; evalúa estrictamente de izquierda a derecha, sin precedencia usual de operadores.
- Puntaje parcial: hasta 0.5 por implementar correctamente los operadores; hasta 0.3 por usar valores enteros y división truncada; hasta 0.3 por usar variables y constantes como operandos; hasta 0.3 por respetar evaluación de izquierda a derecha.
- Puntaje cero: no evalúa expresiones o usa una semántica incompatible con el enunciado.

### P5 - Manejo de errores

- Origen del puntaje: propuesto
- Puntaje máximo: 1.2
- Requisito evaluado: impresión de errores definidos por el enunciado.
- Evidencia esperada: ejecución con variables no definidas y comandos con sintaxis incorrecta.
- Puntaje completo: si se usa una variable no definida imprime exactamente un mensaje de la forma `ERROR: variable indefinida "..."`; si hay error de sintaxis imprime un mensaje de la forma `ERROR: al procesar "..."`, donde el string corresponde a la parte de la entrada desde el punto del error hacia adelante; el procesamiento de comandos posteriores puede continuar.
- Puntaje parcial: hasta 0.5 por detectar variables indefinidas con mensaje correcto; hasta 0.5 por detectar errores sintácticos con mensaje correcto; hasta 0.2 por no abortar la calculadora ante un error.
- Puntaje cero: los errores no se detectan, producen excepciones no controladas o imprimen mensajes incompatibles con el formato solicitado.

### P6 - Comportamiento observable de la calculadora

- Origen del puntaje: propuesto
- Puntaje máximo: 0.6
- Requisito evaluado: coincidencia con los ejemplos públicos y procesamiento secuencial de listas de comandos.
- Evidencia esperada: ejecución de los ejemplos del enunciado.
- Puntaje completo: reproduce las salidas esperadas de los dos ejemplos, incluyendo no imprimir nada para el comando vacío y continuar después del error de variable indefinida.
- Puntaje parcial: hasta 0.4 por reproducir el ejemplo sin errores; hasta 0.2 por reproducir el ejemplo con error y continuación.
- Puntaje cero: no se puede ejecutar la calculadora sobre listas de comandos o las salidas no corresponden al formato esperado.

### P7 - Documento Markdown y diagramas de estados

- Origen del puntaje: propuesto
- Puntaje máximo: 1.1
- Requisito evaluado: documentación solicitada en el enunciado.
- Evidencia esperada: documento Markdown entregado.
- Puntaje completo: el documento describe brevemente el problema; presenta la estrategia de solución mediante uno o más diagramas de estados para la estructura de la entrada; explica cómo esos diagramas se reflejan en el código; incluye explicaciones suficientes para entender la solución.
- Puntaje parcial: hasta 0.2 por descripción del problema; hasta 0.5 por diagramas de estados pertinentes; hasta 0.2 por relacionar diagramas y código; hasta 0.2 por explicaciones claras.
- Puntaje cero: no se entrega documento Markdown o no contiene la descripción ni los diagramas solicitados.

## Descuentos, topes y reglas especiales - si corresponde

No corresponde.

## Escala final

- Puntaje máximo original por sección o total: no especificado en el material.
- Puntaje máximo total propuesto para revisión humana: 7.0
- Ponderación entre secciones: no corresponde.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales: requisitos funcionales de la calculadora, formato de errores, operadores permitidos, evaluación de izquierda a derecha, uso de enteros, restricción de procesamiento carácter a carácter, entrega de `.py` y Markdown con diagramas.
- Puntajes propuestos: todos los puntajes de los criterios P1 a P7, porque el material no entrega distribución original.
- Ambigüedades no resueltas: el enunciado no precisa cómo truncar divisiones negativas ni detalla todos los casos posibles de sintaxis inválida.
- Requisitos no verificables automáticamente sin revisión de código: cumplimiento estricto de procesamiento carácter a carácter y no uso de funciones de strings de largo mayor que uno para el análisis.
