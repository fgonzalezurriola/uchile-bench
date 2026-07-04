CC4302 Sistemas Operativos - Tarea 3

En   esta   tarea   Ud.   deberá   implementar   un   controlador   para
lectores/escritores   con   entradas   alternadas.   Los   encabezados   de   la
funciones pedidas son:
RWLock *makeRWLock( ): Crea un controlador
void destroyRWCtl(RWLock *rwl): Destruye el controlador rwl
void enterRead(RWLock *rwl): Solicitud de ingreso de un lector
void exitRead(RWLock *rwl): Notificación de salida de un lector
void enterWrite(RWLock *rwl): Solicitud de ingreso de un escritor
void exitWrite(RWLock *rwl): Notificación de salida de un escritor
Para evitar hambruna se requiere programar la siguiente política para la
aceptación   de   las   solicitudes   de   ingreso   de   lectores   y   escritores.   El
principio   es   que   los   lectores   y   escritores   ingresan   alternadamente,
excepto cuando los únicos threads pendientes pertenecen a solo una de
estas 2 categorías.  El siguiente es el detalle:
I. Una solicitud de ingreso de un escritor (función enterWrite) se acepta
de inmediato si no hay lectores o un escritor trabajando. De otro modo
la solicitud queda pendiente.
II. Una solicitud de ingreso de un lector (función enterRead) se acepta
de inmediato si no hay un escritor trabajando y  no hay solicitudes de
escritores pendientes. De lo contrario la solicitud queda pendiente.
III. Cuando termina de trabajar un escritor (función exitWrite) y hay
solicitudes   de   lectores   pendientes,   se   acepta   el   ingreso   de   todos   los
lectores   pendientes.   Si   no   hay   lectores   pendientes,   pero   sí   hay
solicitudes de escritores pendientes, se acepta el ingreso del escritor que
lleva más tiempo esperando.
IV. Cuando termina de trabajar un lector (función exitRead)  y ya no
quedan   otros   lectores   trabajando,   si   hay   solicitudes   de   escritores
pendientes,   se   acepta   el   ingreso   del   escritor   que   lleva  más   tiempo
esperando.

Requerimientos
● Ud. debe programar las funciones pedidas en el archivo rwlock.c.
● Ud. debe resolver esta tarea usando un mutex y múltiples condiciones

como herramienta de sincronización.  No puede usar semáforos.

● Use el patrón request eficientemente: Use múltiples condiciones para
  Debe   evitar   usar
la   espera   en  enterRead  y  enterWrite.
pthread_cond_broadcast  para   despertar   a   todos   los   threads   que

esperan en exitRead y exitWrite.  Use pthread_cond_signal.

● Use 2 colas fifo (tipo Queue que está programado en pss.h y pss.c),

una para los lectores y otra para los escritores.

 Makefile,

Instrucciones
Use los archivos incluidos en este directorio. Contiene los
archivos  test-rwlock.c,
 rwlock.h  (con   los   encabezados
requeridos)   y   otros   archivos.     Ud.   debe   programar   las   funciones
solicitadas en el archivo rwlock.c.  Defina otras funciones si las necesita.
Pruebe   su   tarea   bajo   Debian   12.     Ejecute   el   comando  make  sin
parámetros.  Le mostrará las opciones que tiene para compilar su tarea.
Estos son los requerimientos para aprobar su tarea:
● make run debe felicitarlo por aprobar este modo de ejecución.
● make run-g debe felicitarlo.
● make  run-san  debe felicitarlo y no reportar ningún incidente en el

manejo de memoria.

● make run-thr debe felicitarlo y no reportar ningún datarace.

Cuando pruebe su tarea con  make run  en su computador asegúrese de
que esté configurado en modo alto rendimiento y que no estén corriendo
otros procesos intensivos en uso de CPU al mismo tiempo.
Invoque el comando make zip para ejecutar todos los tests y generar un
archivo  rwlock.zip  que   contiene  rwlock.c,   con   su   solución,   y
resultados.txt, con la salida de make run, make run-g, make  run-san y
make run-thr.

La solución debe quedar en rwlock.c y pasar los comandos de prueba indicados.

