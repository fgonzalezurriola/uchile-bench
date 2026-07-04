#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#include "sort.h"

#define NFRASES 12

static int verboso;

static char *data[]= {
"FERNANDEZ maria",  // 0
"fernandez monica", // 1
"fernandez veri",   // 2
"gonzalez ana",     // 3
"Gonzalez DIEGO",   // 4
"gonzalez Diego",   // 4
"Gonzalez peDro",   // 5
"jerez tatiana",    // 6
"perez alberto",    // 7
"PEREZ JOSE",       // 8
"perez josefa",     // 9
"pereZ juan"        // 10
};

static int res[]= { 0, 1, 2, 3, 4, 4, 5, 6, 7, 8, 9, 10 };
 
static char *desordenado[]= {
"perez alberto",    // 8
"perez josefa",     // 10
"fernandez veri",   // 2
"FERNANDEZ maria",  // 0
"Gonzalez DIEGO",   // 5
"jerez tatiana",    // 7
"pereZ juan",       // 11
"gonzalez Diego",   // 4
"Gonzalez peDro",   // 6
"fernandez monica", // 1
"gonzalez ana",     // 3
"PEREZ JOSE",       // 9
};

static void help(int line, char *s0, char *s1) {
  printf("Para depurar use estos comandos:\n");
  printf("make sort-rv-im.ddd\n");
  printf("o tambien make sort-c-im.ddd\n");
  printf("Ingrese estos comandos en el panel de comandos de ddd:\n");
  printf("break test2\n");
  printf("cond 3 s0==%p && s1==%p\n", s0, s1);
  printf("continue\n");
  printf("Abra el panel de assembler seleccionando View -> "
         "Machine Code Window\n");
  printf("Avance con next hasta la invocacion de la funcion sort.\n");
  printf("Enseguida depure con stepi para avanzar lentamente.\n");
  printf("El arreglo tiene solo 2 elementos, no va a demorarse mucho.\n");
  exit(1);
}

static void dump(char *a[], int n) {
  for (int i= 0; i<n; i++) {
    printf("  \"%s\"\n", a[i]);
  }
}

static void test2(char *msg, char *s0, char *s1, int ordenado) {
  if (verboso)
    printf("%s", msg);
  if (verboso)
    printf("Arreglo es:\n  \"%s\"\n  \"%s\"\n", s0, s1);
  char *str[ ]= { s0, s1 };
  sort(str, 2);
  if ( (  ordenado && (strcmp(str[0], s0)!=0 || strcmp(str[1], s1)!=0) ) ||
       ( !ordenado && (strcmp(str[1], s0)!=0 || strcmp(str[0], s1)!=0) ) ) {
    if (!verboso) {
      printf("%s", msg);
      printf("Arreglo %s es:\n  \"%s\"\n  \"%s\"\n",
             ordenado ? "ordenado" : "desordenado", s0, s1);
    }
    fprintf(stderr, "El resultado es incorrecto:\n");
    dump(str, 2);
    help(98, s0, s1);
    exit(1);
  }
}

int main(int argc, char *argv[]) {
  verboso= 1;
  printf("Primera serie de tests con arreglos de solo 2 nombres\n");
  test2("Ambos nombres vacios\n", "", "", 1);
  test2("Nombres iguales\n", "=", "=", 1);
  test2("Nombres iguales\n", "a", "A", 1);
  test2("Nombres iguales\n", "A", "a", 1);
  test2("Primer nombre menor que el segundo\n", "a", "b", 1);
  test2("Primer nombre mayor que el segundo\n", "b", "a", 0);
  printf("\nNombres con varios caracteres\n");
  test2("Primer nombre menor que el segundo\n", "ab", "ac", 1);
  test2("Primer nombre mayor que el segundo\n", "ac", "ab", 0);
  printf("\nNombres con mayusculas y minusculas\n");
  test2("Primer nombre menor que el segundo\n", "A", "b", 1);
  test2("Primer nombre mayor que el segundo\n", "B", "a", 0);
  test2("Primer nombre menor que el segundo\n", "a", "B", 1);
  test2("Primer nombre mayor que el segundo\n", "b", "A", 0);
  test2("Primer nombre menor que el segundo\n", "Ab", "ac", 1);
  test2("Primer nombre mayor que el segundo\n", "Ac", "ab", 0);
  test2("Primer nombre menor que el segundo\n", "ab", "Ac", 1);
  test2("Primer nombre mayor que el segundo\n", "ac", "Ab", 0);
  printf("\nNombres largos con espacios en blanco\n");
  test2("Primer nombre menor que el segundo\n", "aAa bBb", "AaA Bbc", 1);
  test2("Primer nombre mayor que el segundo\n", "MN xyZ", "mn XYY", 0);

  printf("\nSegunda serie de tests nombres reales\n");
  verboso= 0;

  for (int i= 0; i<NFRASES; i++)
    for (int j= 0; j<NFRASES; j++)
      test2("alfabetico\n", data[i], data[j], res[i]<=res[j]);

  printf("Aprobado\n");

  printf("\nTercera serie de tests con todo el arreglo de nombres\n");

  printf("El arreglo desordenado es:\n");
  printf("--------------------------\n");
  for (int i= 0; i<NFRASES; i++) {
    printf("%s\n", desordenado[i]);
  }
  printf("\n");
  sort(desordenado, NFRASES);
  printf("\n");
  printf("El arreglo ordenado es:\n");
  printf("-----------------------\n");
  for (int i= 0; i<NFRASES; i++) {
    printf("%s\n", desordenado[i]);
  }
  printf("\n");
  for (int i= 0; i<NFRASES; i++) {
    if (data[i]!=desordenado[i]) {
      fprintf(stderr, "El %d-esimo elemento es incorrecto\n", i);
      fprintf(stderr, "  \"%s\"\n debio ser\n  \"%s\"\n",
              desordenado[i], data[i]);
      exit(1);
    }
  }

  printf("Felicitaciones: todos los tests aprobados\n");
  return 0;
}
