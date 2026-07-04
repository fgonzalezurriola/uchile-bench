#define _XOPEN_SOURCE 500
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/time.h>
#include <string.h>

#include "rango.h"

#define TOLERANCIA 80

#ifdef OPT
#define NTESTS 5000
#define LENLIS 10000
#else
#define NTESTS 500
#define LENLIS 10000
#endif

// ----------------------------------------------------
// Funcion que entrega el tiempo transcurrido desde el lanzamiento del
// programa en milisegundos

static int time0= 0;

static int getTime0() {
    struct timeval Timeval;
    gettimeofday(&Timeval, NULL);
    return Timeval.tv_sec*1000+Timeval.tv_usec/1000;
}

static void resetTime() {
  time0= getTime0();
}

static int getTime() {
  return getTime0()-time0;
}

// ----------------------------------------------------
// Funcion que construye una lista a partir de un elemento
// y otra lista

Nodo *lista(int x, Nodo *cola) {
  Nodo *nodo= malloc(sizeof(Nodo));
  if (nodo==NULL) {
    fprintf(stderr,
            "Se acabo la memoria.  Parace que Ud. no libera los nodos\n");
    exit(1);
  }
  nodo->x= x;
  nodo->prox= cola;
  return nodo;
}

// ----------------------------------------------------
// Funciones utilitarias

int iguales(Nodo *lis1, Nodo *lis2) {
  if (lis1==NULL)
    return lis2==NULL;
  if (lis2==NULL)
    return 0;
  return lis1->x==lis2->x && iguales(lis1->prox, lis2->prox);
}

Nodo *copia(Nodo *lis) {
  if (lis==NULL)
    return NULL;
  else
    return lista(lis->x, copia(lis->prox));
}

void libera(Nodo *lis) {
  while (lis!=NULL) {
    Nodo *rem= lis;
    lis= lis->prox;
    free(rem);
  }
}

Nodo *listaGrande(int i, int j) {
  Nodo *lis= NULL;
  for (int k= j; k>=i; k--)
    lis= lista(k, lis);
  return lis;
}

void revisa(Nodo *prim, int *ar, int n) {
  int len= 0;
  Nodo *lis= prim;
  if (lis!=NULL) {
    int prev= lis->x;
    for (;;) {
      lis= lis->prox;
      if (lis==NULL)
        break;
      if (lis->x<=prev) {
        fprintf(stderr, "La lista esta desordenada\n");
        exit(1);
      }
    }
  }
  lis= prim;
  while (lis!=NULL) {
    if (!(0<=lis->x && lis->x<=n-1)) {
      fprintf(stderr, "La lista contiene erroneamente %d\n", lis->x);
      exit(1);
    }
    if (ar[lis->x]==0) {
      fprintf(stderr, "La lista contiene erroneamente %d\n", lis->x);
      exit(1);
    }
    lis= lis->prox;
    len++;
  }
  lis= prim;
  for (int i=0; i<n; i++) {
    if (ar[i]==1) {
      if (lis==NULL || lis->x!=i) {
        fprintf(stderr, "La lista no contiene %d\n", i);
        exit(1);
      }
      if (lis!=NULL)
        lis= lis->prox;
    }
  }
} 

void check(Nodo *lis, Nodo *res, char *msg) {
  if (!iguales(lis, res)) {
    fprintf(stderr, "Error: %s\n", msg);
    exit(1);
  }
}

// ----------------------------------------------------
// Test unitatios

void test() {
  Nodo *lista5= lista(5, NULL);
  Nodo *lista29=  lista(2, lista(9, NULL));
  Nodo *lista789= lista(7, lista(8, lista(9, NULL)));
  Nodo *lista24= lista(2, lista(4, NULL));
  Nodo *lista24589= lista(2, lista(4, lista(7, lista(8, lista(9, NULL)))));
  {
    printf("Eliminar de una lista vacia\n");
    Nodo *lis= NULL;
    eliminarRango(&lis, 0, 120);
    check(lis, NULL, "La lista resultante no esta vacia");
  }

  {
    printf("Eliminar elementos inexistentes\n");
    Nodo *lis= copia(lista24589);
    eliminarRango(&lis, 0, 1);
    check(lis, lista24589, "Resultado incorrecto");
    eliminarRango(&lis, 5, 6);
    check(lis, lista24589, "Resultado incorrecto");
    eliminarRango(&lis, 10, 100);
    check(lis, lista24589, "Resultado incorrecto");
    libera(lis);
  }

  {
    printf("Eliminar el unico elemento de una lista\n");
    Nodo *lis= copia(lista5);
    eliminarRango(&lis, 5, 5);
    check(lis, NULL, "La lista no esta vacia");
    lis= copia(lista5);
    eliminarRango(&lis, 0, 5);
    check(lis, NULL, "La lista no esta vacia");
    lis= copia(lista5);
    eliminarRango(&lis, 5, 100);
    check(lis, NULL, "La lista no esta vacia");
    lis= copia(lista5);
    eliminarRango(&lis, 0, 100);
    check(lis, NULL, "La lista no esta vacia");
  }

  {
    printf("Eliminar rango [4,8] de la lista 2 4 5 8 9\n");
    Nodo *lis= copia(lista24589);
    eliminarRango(&lis, 4, 8);
    check(lis, lista29, "La lista no es 2 9");
    eliminarRango(&lis, 0, 100);
    check(lis, NULL, "La lista no esta vacia");
  }
    
  {
    printf("Eliminar rango [0,5] de la lista 2 4 5 8 9\n");
    Nodo *lis= copia(lista24589);
    eliminarRango(&lis, 0, 5);
    check(lis, lista789, "La lista no es 7 8 9");
    eliminarRango(&lis, 7, 9);
    check(lis, NULL, "La lista no esta vacia");
  }
    
  {
    printf("Eliminar rango [5, 10] de la lista 2 4 5 8 9\n");
    Nodo *lis= copia(lista24589);
    eliminarRango(&lis, 5, 10);
    check(lis, lista24, "La lista no es 2 4");
    eliminarRango(&lis, 0, 4);
    check(lis, NULL, "La lista no esta vacia");
  }

  libera(lista5);
  libera(lista29);
  libera(lista789);
  libera(lista24);
  libera(lista24589);
}

void testGrande(int nreps) {
  // Se eliminan rangos aleatorios de una lista de 10000 elementos hasta
  // que la lista quede vacia.
  for (int r= 0; r<nreps; r++) {
    int ar[LENLIS];
    for (int k= 0; k<LENLIS; k++)
      ar[k]= 1;
    Nodo *lis= listaGrande(0, LENLIS-1);
    revisa(lis, ar, LENLIS);
    while (lis!=NULL) {
      int i= random()%LENLIS;
      int j= random()%LENLIS;
      if (i>j) {
        int tmp= i;
        i= j;
        j= tmp;
      }
      eliminarRango(&lis, i, j);
      for (int k= i; k<=j; k++)
        ar[k]= 0;
      revisa(lis, ar, LENLIS);
    }
  }
}

// ----------------------------------------------------
// Benchmark

long benchRango(int nreps) {
  long ini= getTime();
  for (int r= 0; r<nreps; r++) {
    Nodo *lis= listaGrande(0, LENLIS-1);
    while (lis!=NULL) {
      int i= random()%LENLIS;
      int j= random()%LENLIS;
      if (i>j) {
        int tmp= i;
        i= j;
        j= tmp;
      }
      eliminarRango(&lis, i, j);
    }
  }
  return getTime()-ini;
}

int main(int argc, char *argv[]) {

  printf("Tests unitarios\n");
  test();
  printf("Test intensivo\n");
  srandom(0);
  testGrande(10);
  printf("Benchmark\n");
  printf("----------------------------\n");
  printf("Benchmark de eliminarRango\n");
  printf("Se verificara que libere la memoria con free.\n");
  printf("Si no libera la memoria, el programa fallara por falta\n");
  printf("de memoria, terminando en seg. fault.\n");
  printf("El trabajo en make run es mucho mayor que con run-g y run-san\n");
  printf("----------------------------\n");

  int tiempo_rango= 0;
  int tiempo_prof= 0;
  if (argc==2) {
    tiempo_prof= atoi(argv[1]);
  }

  {
    if (tiempo_prof!=0)
      printf("Tiempo para la version del profesor= %d milisegundos\n",
             tiempo_prof);
    int intento= 1;
    while (intento<=5) {
      if (tiempo_prof!=0)
        printf("Intento= %d\n", intento);
      srandom(0);
      int tiempo= benchRango(NTESTS);
      tiempo_rango= tiempo;
      printf("Tiempo para su version= %d milisegundos\n", tiempo);
      if (tiempo_prof==0)
        break;
      double q= (double)tiempo/(double)tiempo_prof;
      int porciento= (q-1.)*100;
      printf("Porcentaje de sobrecosto: %d %%\n", porciento);
      if (porciento<=TOLERANCIA) {
        break;
      }
      printf("Excede en mas del %d %% la version del profesor\n", TOLERANCIA);
      if (intento<5)
        printf("Se hara un nuevo intento\n");
      intento++;
    }
    if (intento>5) {
      fprintf(stderr, "Lo siento: Despues de 5 intentos no satisface "
                      "la eficiencia requerida\n");
      fprintf(stderr,
              "Coloque su computador en modo alto rendimiento, porque el\n"
              "economizador de bateria puede alterar los resultados.\n"
              "No ejecute este programa junto a otros programas que hagan\n"
              "un uso intensivo de la CPU.  En windows puede lanzar el\n"
              "administrador de tareas para verificar que el uso de CPU\n"
              "sea bajo.\n");

      exit(1);
    }
  }

  if (argc==2 && strcmp(argv[1], "ref")==0) {
    FILE *out= fopen("tiempo-ref.txt", "w");
    if (out==NULL) {
      perror("tiempo-ref.txt");
      exit(1);
    }
    fprintf(out, "%d\n", tiempo_rango);
    fclose(out);
  }

  printf("\nFelicitaciones!  Aprobo todos los tests\n");

  return 0;
}
