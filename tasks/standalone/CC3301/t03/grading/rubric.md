# Pauta de evaluación

## Alcance

Se evalúa la entrega independiente de la tarea CC3301/t03: implementación en `rango.c` de la función `eliminarRango` para eliminar de una lista enlazada ordenada ascendentemente todos los nodos cuyo valor esté en el rango inclusivo `[y,z]`.

La evaluación considera:

- compatibilidad con los archivos entregados, en particular `rango.h`, `test-rango.c` y `Makefile`;
- corrección funcional sobre listas vacías, listas con uno o más elementos, eliminación al inicio, medio, final o de toda la lista;
- liberación con `free` de todos los nodos eliminados;
- eficiencia: eliminación con un solo recorrido de la lista y rendimiento no más de 80% más lento que la solución de referencia en `make run`;
- generación del producto esperado `rango.zip` mediante `make zip`.

## Criterios

### P1 - Compilación e interfaz esperada

- Origen del puntaje: propuesto
- Puntaje máximo: 1.0 propuesto
- Requisito evaluado: la entrega contiene `rango.c` con una implementación de `eliminarRango` compatible con los archivos provistos y compilable mediante el `Makefile`.
- Evidencia esperada: ejecución exitosa de los comandos de compilación usados por `make`, `make run-g`, `make run-san` o `make run`; presencia de `rango.c`.
- Puntaje completo: 1.0 propuesto si la función está implementada en `rango.c`, respeta la interfaz requerida por los archivos entregados y todos los binarios de prueba compilan sin errores.
- Puntaje parcial: hasta 0.5 propuesto si existe una implementación reconocible, pero presenta problemas menores de integración que impiden ejecutar parte de los comandos sin afectar la lógica principal.
- Puntaje cero: si no se entrega `rango.c`, falta la función solicitada, la firma es incompatible con los archivos provistos o la tarea no compila.

### P2 - Corrección funcional de `eliminarRango`

- Origen del puntaje: propuesto
- Puntaje máximo: 2.5 propuesto
- Requisito evaluado: la función elimina exactamente los nodos con valores dentro del rango inclusivo `[y,z]` y conserva todos los demás elementos de la lista enlazada ordenada.
- Evidencia esperada: salida exitosa de `make run-g` y de las pruebas funcionales de `test-rango.c`, incluyendo tests unitarios e intensivos con rangos aleatorios.
- Puntaje completo: 2.5 propuesto si pasa todos los casos funcionales provistos: lista vacía, elementos inexistentes, eliminación del único elemento, eliminación al inicio, al medio, al final, eliminación total y pruebas intensivas sobre listas grandes.
- Puntaje parcial: propuesto para revisión humana:
  - 1.5 a 2.0 si la solución es mayormente correcta, pero falla algunos casos de borde como eliminación de cabeza, cola o lista completa.
  - 0.5 a 1.0 si compila y elimina algunos elementos, pero produce listas incorrectas, desordenadas o con elementos faltantes/sobrantes en varios casos.
- Puntaje cero: si la función no modifica correctamente la lista, falla en casos básicos o termina anormalmente durante las pruebas funcionales.

### P3 - Manejo de memoria y ausencia de errores detectables

- Origen del puntaje: propuesto
- Puntaje máximo: 1.5 propuesto
- Requisito evaluado: todos los nodos eliminados deben liberarse con `free` y la ejecución no debe reportar problemas de memoria ni comportamiento indefinido.
- Evidencia esperada: `make run-san` felicita al estudiante y no reporta problemas como goteras de memoria, accesos inválidos, doble liberación o comportamiento indefinido.
- Puntaje completo: 1.5 propuesto si todos los nodos eliminados son liberados correctamente y `make run-san` termina exitosamente sin reportes.
- Puntaje parcial: propuesto para revisión humana:
  - 1.0 si la solución libera memoria en la mayoría de los casos, pero presenta una fuga o error acotado en casos específicos.
  - 0.5 si la solución evita algunos errores graves, pero no libera todos los nodos eliminados o presenta reportes sanitarios relevantes.
- Puntaje cero: si no libera los nodos eliminados, produce fugas generalizadas, accesos inválidos, doble `free`, uso después de liberar o falla bajo `make run-san`.

### P4 - Eficiencia y benchmark

- Origen del puntaje: propuesto
- Puntaje máximo: 1.5 propuesto
- Requisito evaluado: la eliminación debe realizarse con un solo recorrido de la lista enlazada y no debe ser más de 80% más lenta que la solución de referencia.
- Evidencia esperada: inspección de la implementación y salida de `make run`, incluyendo el porcentaje de sobrecosto respecto de la referencia.
- Puntaje completo: 1.5 propuesto si la implementación realiza un único recorrido lineal de la lista y `make run` felicita al estudiante, con sobrecosto menor o igual a 80% respecto de la referencia.
- Puntaje parcial: propuesto para revisión humana:
  - 1.0 si el algoritmo es lineal y razonablemente eficiente, pero el benchmark no puede validarse de forma concluyente en el ambiente disponible.
  - 0.5 si la solución es funcional, pero usa recorridos adicionales evitables o falla el benchmark por ineficiencia.
- Puntaje cero: si la solución es claramente no lineal, recorre repetidamente la lista de forma innecesaria, no termina en el benchmark o excede la tolerancia de eficiencia de manera persistente.

### P5 - Producto esperado

- Origen del puntaje: propuesto
- Puntaje máximo: 0.5 propuesto
- Requisito evaluado: generación del archivo de entrega mediante `make zip`.
- Evidencia esperada: existencia de `rango.zip` generado por `make zip`, que contiene `rango.c` y `resultados.txt` con la salida de `make run`, `make run-g` y `make run-san`.
- Puntaje completo: 0.5 propuesto si `make zip` ejecuta los tests y genera correctamente `rango.zip` con los archivos esperados.
- Puntaje parcial: 0.2 propuesto si se entrega el código fuente correcto, pero el archivo `.zip` está incompleto o no fue generado exactamente mediante el proceso indicado.
- Puntaje cero: si no se entrega un producto evaluable o falta `rango.c`.

## Descuentos, topes y reglas especiales - si corresponde

- Los materiales no especifican descuentos numéricos, topes de nota ni notas directas.
- Reglas especiales extraídas de los materiales:
  - `make run-san` debe felicitar al estudiante y no reportar problemas.
  - `make run-g` debe felicitar al estudiante.
  - `make run` debe felicitar al estudiante; esta prueba se rechaza si la función es más de 80% más lenta que la solución de referencia.
  - El benchmark puede realizar hasta 5 intentos antes de rechazar la eficiencia.
  - Las pruebas deben realizarse bajo Debian 12 nativo o virtualizado; WSL 1 queda excluido y WSL 2 está permitido.
  - Para el benchmark se recomienda usar modo alto rendimiento y evitar otros procesos intensivos en CPU.

## Escala final

- Puntaje máximo original por sección o total: no especificado en los materiales.
- Puntaje máximo total propuesto para esta pauta: 7.0.
- Ponderación entre secciones: no corresponde.
- Nota mínima del benchmark: 1.0.
- Nota máxima del benchmark: 7.0.
- Redondeo: un decimal.
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales:
  - se debe crear `rango.c`;
  - la función solicitada es `eliminarRango`;
  - la estructura `Nodo` representa una lista enlazada ordenada ascendentemente;
  - deben eliminarse los elementos en el rango inclusivo `[y,z]`;
  - los nodos eliminados deben liberarse con `free`;
  - la eficiencia requerida es un solo recorrido de la lista;
  - `make run`, `make run-g` y `make run-san` deben felicitar al estudiante;
  - `make run` rechaza soluciones más de 80% más lentas que la referencia;
  - `make zip` debe generar `rango.zip`.

- Puntajes o niveles propuestos:
  - no existe pauta numérica original, por lo que todos los puntajes de criterios y niveles parciales son propuestos para revisión humana;
  - el total propuesto es 7.0 para alinearse con la escala final 1.0 a 7.0.

- Ambigüedades no resueltas:
  - el enunciado muestra una firma con `int y, int z`, pero `rango.h` declara `double y, double z`; para evaluación se asume compatibilidad con los archivos provistos.
  - aparece una mención aislada a `consultar.zip`, pero el README y el resto del material indican `rango.zip`; se asume que el producto esperado es `rango.zip`.

- Requisitos que no pueden verificarse solo con el material:
  - confirmar estrictamente “un solo recorrido” requiere inspección del código además de ejecutar tests;
  - el resultado del benchmark depende del ambiente de ejecución;
  - la ausencia total de problemas de memoria depende de las herramientas activadas por `make run-san` y del alcance de sus pruebas.
