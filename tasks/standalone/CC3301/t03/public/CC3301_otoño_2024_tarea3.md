CC3301 Programación de Software de Sistemas – Semestre Otoño 2024

configurado en modo alto rendimiento y que no estén corriendo otros
procesos intensivos en uso de CPU al mismo tiempo.   De otro modo
podría no lograr la eficiencia solicitada.

Producto esperado
Genere el archivo  rango.zip
 A   continuación   es   muy
generado   por   el   comando  make   zip.

Programe eficientemente la función  eliminarRango  que elimina de un
conjunto de enteros todos los elementos que estén en el rango [y,z].  El
conjunto   se   representa   mediante   una   lista   enlazada  ordenada
ascendentemente.     Esta   es   la   estructura   de   la   lista   enlazada   y   el
encabezado de eliminarRango:
typedef struct nodo {
  int x;             // un elemento del conjunto
  struct nodo *prox; // próximo nodo de la lista enlazada
} Nodo;
void eliminarRango(Nodo **phead, int y, int z);

Por ejemplo suponga que head es de tipo Nodo* y corresponde a la lista
enlazada que contiene 2, 4, 7, 8 y 9, entonces:

•

•

•

eliminarRango(&head, 4, 8) dejaría a head con 2 y 9
eliminarRango(&head, 0, 5) dejaría a head con 7, 8 y 9
eliminarRango(&head, 5, 10) dejaría a head con 2 y 4.

Requerimientos:

• Ud.   debe   liberar   con  free  la   memoria   de   todos   los   nodos

eliminados de la lista.
El requisito de eficiencia significa que Ud. debe eliminar todos
los nodos con un sólo recorrido de la lista enlazada.

•

Instrucciones
Use los archivos incluidos en este directorio.  El directorio T3 contiene los
archivos (a) test-rango.c que prueba si su tarea funciona y compara su
eficiencia con la solución de referencia, (b)  prof.ref-x86_64 y prof.ref-
aarch64  con  los  binarios  ejecutables  de  la  solución   del  referencia,  (c)
rango.h  que   incluye   los   encabezados   de   las   funcion   pedidas,   y   (d)
Makefile que le servirá para compilar y ejecutar su tarea.  Ejecute en un
terminal   el   comando  make  para   recibir   instrucciones   adicionales.
Estos son los requerimientos para aprobar su tarea.

• make run  debe felicitarlo por aprobar este modo de ejecución.
Su   solución   no   debe   ser   80%   más   lenta   que   la   solución   del
referencia.

• make run-g debe felicitarlo.
• make   run-san  debe   felicitarlo   y   no   reportar   ningún   problema

como por ejemplo goteras de memoria.

Cuando pruebe su tarea con make run asegúrese que su computador esté


Producto esperado
Genere el archivo `consultar.zip` con `make zip`. Verifique el archivo generado ejecutando nuevamente los tests antes de considerarlo listo.
