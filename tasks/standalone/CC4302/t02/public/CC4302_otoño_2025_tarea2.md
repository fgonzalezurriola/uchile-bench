CC4302 Sistemas Operativos - Tarea 2
Múltiples threads representan damas y varones que buscan una pareja aparezca su pareja.  En ningún caso puede usar busy-waiting.
para bailar en una discoteca invocando las funciones dama y varon Programe además  la función  discoInit  para inicializar las
●
respectivamente.  Ambas funciones reciben como parámetro el nombre
variables globales que necesite y la función discoDestroy para
de quien invoca la función y deben retornar el nombre de su pareja de liberar los recursos que solicitó.   Si no las necesita, debe
baile.  Si al invocar dama o varon no hay personas del sexo opuesto en incluirlas de todas formas, pero pueden quedar vacías.
espera, la invocación debe esperar.  Si no, se elige como pareja la
Instrucciones
| persona |     | del   sexo |   opuesto |   que |   lleva |     | más   tiempo |   esperando, |   se |     |     |     |
| ------- | --- | ---------- | --------- | ----- | ------- | --- | ------------ | ------------ | ---- | --- | --- | --- |
Use los archivos incluidos en este directorio. Contiene los
intercambian nombres y las funciones dama y varon de la pareja armada
retornan.  En ningún momento puede ocurrir que hay simultáneamente archivos test-disco.c, Makefile, disco.h (con los encabezados requeridos)
y otros archivos.  Ud. debe programar en el archivo disco.c las funciones
varones y damas en espera.  El siguiente es un diagrama de threads que
muestra un ejemplo de ejecución. solicitadas.  Defina otras funciones si las necesita.
|     |      |     |     |     |     |     |     |     |     | Pruebe su tarea bajo Debian 12.  |  Ejecute el comando |  make  sin |
| --- | ---- | --- | --- | --- | --- | --- | --- | --- | --- | -------------------------------- | ------------------- | ---------- |
| D   | dama | D   |     | V   | V   |     | V   | D   |     |                                  |                     |            |
| 1   |      | 2   |     | 1   | 2   |     | 3   | 3   |     |                                  |                     |            |
parámetros.  Le mostrará las opciones que tiene para compilar su tarea.
D(“ana”)
Estos son los requerimientos para aprobar su tarea:
|     |     | D(“sara”) |     | varon |     |     |     |     |     |     |     |     |
| --- | --- | --------- | --- | ----- | --- | --- | --- | --- | --- | --- | --- | --- |
• make run debe felicitarlo por aprobar este modo de ejecución.
make run-g debe felicitarlo.
|     |         |     |     | V(“pedro”) |     |           |     |     |     | •   |     |     |
| --- | ------- | --- | --- | ---------- | --- | --------- | --- | --- | --- | --- | --- | --- |
|     | “pedro” |     |     | “ana”      |     | V(“juan”) |     |     |     |     |     |     |
“juan” make run-san debe felicitarlo y no reportar ningún incidente en
|     |     |     |     |     |     | “sara” |     |     |     | •   |     |     |
| --- | --- | --- | --- | --- | --- | ------ | --- | --- | --- | --- | --- | --- |
V(“diego”)
el manejo de memoria.
|     |     |     |     |     |     |     |     | D(“alba”) |     | make run-thr debe felicitarlo y no reportar ningún datarace. |     |     |
| --- | --- | --- | --- | --- | --- | --- | --- | --------- | --- | ------------------------------------------------------------ | --- | --- |
•
|     |     |     |     |     |     |     | “alba” | “diego” |     |     |     |     |
| --- | --- | --- | --- | --- | --- | --- | ------ | ------- | --- | --- | --- | --- |
Cuando pruebe su tarea con make run en su computador asegúrese de
| El diagrama muestra que la pareja de ana (D |     |     |     |     |     |     | ) es pedro (V | ) y que por lo |     |     |     |     |
| ------------------------------------------- | --- | --- | --- | --- | --- | --- | ------------- | -------------- | --- | --- | --- | --- |
1 1 que esté configurado en modo alto rendimiento y que no estén corriendo
| tanto dama en D        |     |     |  retorna “pedro” y varon en V |        |           |     |  retorna “ana”.            |     |     |                                                          |     |     |
| ---------------------- | --- | --- | ----------------------------- | ------ | --------- | --- | -------------------------- | --- | --- | -------------------------------------------------------- | --- | --- |
|                        |     |     | 1                             |        |           |     | 1                          |     |     | otros procesos intensivos en uso de CPU al mismo tiempo. |     |     |
| Programe las funciones |     |     |                               |  dama  | y  varon  |     | usando obligatoriamente la |     |     |                                                          |     |     |
Invoque el comando make zip para ejecutar todos los tests y generar un
siguiente metodología:
archivo disco.zip que contiene disco.c, con su solución, y resultados.txt,
Debe usar un solo mutex y una sola condición de pthreads.  No
● con la salida de make run, make run-g, make run-san y make run-thr.
puede usar múltiples condiciones u otras herramientas de
sincronización como por ejemplo semáforos.
Las personas del mismo sexo deben conseguir pareja de baile
por orden de llegada.  Para ello use un distribuidor de números
para las damas y otro distribuidor para los varones como se usó
para el problema de los lectores/escritores visto en cátedra.  No
puede usar colas fifo para almacenar las damas o varones en
espera.
|     | Necesitará |     |   usar |   variables |     | globales |   para |   almacenar |   los |           |     |     |
| --- | ---------- | --- | ------ | ----------- | --- | -------- | ------ | ----------- | ----- | --------- | --- | --- |
|     | ●          |     |        |             |     |          |        |             |       |           |     |     |
distribuidores de tickets, los displays, el nombre de la dama o
varón que espera pareja, etc.
Si una persona le toca ser atendida, pero no encuentra pareja del
●
sexo opuesto, colóquela en espera usando la condición, hasta que
