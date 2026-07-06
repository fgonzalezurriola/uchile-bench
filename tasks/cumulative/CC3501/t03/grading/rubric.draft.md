# Pauta de evaluación

## Alcance

Se evalúa únicamente la entrega de código fuente de la Tarea 3 de CC3501: una demostración programada sobre una temática relacionada con la materia del curso y ejecutable en el entorno del curso. El trabajo heredado de etapas anteriores solo es contexto de implementación y no materia evaluable por sí mismo.

No se evalúan evidencia externa, correo de validación por u-cursos, video ni presentación en clase, porque esos artefactos no forman parte del material disponible para el solver ni para el juez.

## Criterios

### P1 - Temática relacionada y uso del entorno del curso

- Origen del puntaje: adaptado para benchmark desde el enunciado.
- Puntaje máximo: 1.0
- Requisito evaluado: la demostración corresponde a una temática relacionada con la materia del curso y utiliza el entorno del curso.
- Evidencia esperada: código fuente ejecutable en el entorno del curso.
- Puntaje completo: la temática está relacionada con la materia y el programa usa las bibliotecas o herramientas esperadas del curso.
- Puntaje parcial: asignar crédito si la relación con la materia o el uso del entorno es débil pero verificable.
- Puntaje cero: la temática no está relacionada con la materia, no usa el entorno del curso o no hay código ejecutable.

### P2 - Implementación completa de la demostración

- Origen del puntaje: adaptado para benchmark desde el enunciado.
- Puntaje máximo: 4.0
- Requisito evaluado: la demostración está implementada de forma completa y funcional.
- Evidencia esperada: código fuente; ejecución o instanciación de la demostración en el entorno del curso; comportamiento observable de la técnica, animación, extensión o temática elegida.
- Puntaje completo: la demostración implementa una idea completa, sustantiva y observable.
- Puntaje parcial: asignar crédito según completitud, coherencia visual o interactiva y ausencia de componentes esenciales faltantes.
- Puntaje cero: la demostración no está implementada, es meramente un stub o no permite observar la idea.

### P3 - Ejecución y verificabilidad

- Origen del puntaje: adaptado para benchmark desde el enunciado.
- Puntaje máximo: 1.0
- Requisito evaluado: la demostración puede ejecutarse o instanciarse de manera verificable en el entorno del curso sin errores bloqueantes.
- Evidencia esperada: ejecución del punto de entrada o prueba equivalente que valide inicialización y comportamiento principal.
- Puntaje completo: el código se ejecuta o puede ser instanciado sin errores bloqueantes.
- Puntaje parcial: compila o importa, pero no permite verificar el comportamiento principal por defectos menores o limitaciones del entorno.
- Puntaje cero: el punto de entrada falla por errores de importación, sintaxis, inicialización o runtime que impiden observar la demostración.

## Descuentos, topes y reglas especiales - si corresponde

- Nota directa 1.0: si no hay entrega de código fuente o si la demostración no ejecuta.
- Correo de validación, video, presentación en clase y estructura administrativa de la entrega quedan fuera de la evaluación del benchmark.

## Escala final

- Puntaje máximo original por sección o total: no especificado como suma de puntos para el benchmark.
- Puntaje máximo total propuesto: 6.0 puntos.
- Ponderación entre secciones: no corresponde.
- Nota mínima del benchmark: 1.0
- Nota máxima del benchmark: 7.0
- Redondeo: un decimal.
- Conversión base: lineal desde la proporción ponderada de logro, antes de aplicar descuentos, topes o notas directas explícitas. En esta tarea, la regla directa conservada es nota 1.0 si no hay entrega o la demostración no ejecuta.

## Supuestos y decisiones para revisión humana

- Información extraída de los materiales:
  - En el benchmark se evalúa únicamente código fuente ejecutable.
  - La demostración debe usar el entorno del curso.
  - Si no entregan código fuente o la demostración no ejecuta, la nota es 1.0.
  - Evidencia externa como correo, video o presentación no está disponible para evaluación reproducible.
- Puntajes o niveles propuestos:
  - Se propone distribuir 6.0 puntos entre pertinencia/entorno, implementación y ejecución verificable.
  - Una solución completa y ejecutable puede obtener nota máxima del benchmark sin evidencia externa.
- Ambigüedades no resueltas:
  - El enunciado original no define puntajes parciales para una implementación incompleta que sí ejecuta.
  - El juez puede necesitar una prueba headless o por importación si el entorno no permite observar una ventana interactiva completa.
