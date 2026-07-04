#define _DEFAULT_SOURCE 1

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <unistd.h>
#include <sys/time.h>
#include <sys/resource.h>

#include "elim.h"

#define NRANDTESTS 100000
#define REP 100
#define NINTENTOS 5
#define TOLERANCIA 80

// ----------------------------------------------------
// Funcion que entrega el tiempo de CPU usado desde
// que se invoco resetTime()

static int time0= 0;

static int getTime0() {
    struct timeval Timeval;
    gettimeofday(&Timeval, NULL);
    return Timeval.tv_sec*1000+Timeval.tv_usec/1000;
}

void resetTime() {
  time0= getTime0();
}

int getTime() {
  return getTime0()-time0;
}

// ----------------------------------------------------
// Funcion que genera numeros pseudo aleatorios no muy buenos pero muy rapida
// (inspirada de la funcion rand)

#if 0
static uint32_t next = 1;

static uint64_t randNum() {
  uint32_t xh = (next = next * 1103515245 + 12345);
  uint32_t xl = (next = next * 1103515245 + 12345);
  return ((uint64_t)xh << 32) | xl;
}

static void srandNum(uint32_t seed) {
  next = seed;
}

#else

static uint64_t next = 1;

static uint64_t randNum() {
  return (next = next * 1103515245 + 12345);
}

static void srandNum(uint64_t seed) {
  next = seed;
  randNum();
  randNum();
  randNum();
}
#endif

// ----------------------------------------------------

// Puede tomar ideas de esta solucion pero considere que:
// - esta version es mucho mas lenta que la del profesor
// - usa * / y % que estan prohibidos por ser ineficientes
// Piense en una version eficiente que no use los operadores prohibidos

uint64_t elimHexSlow(uint64_t x, int h) {
  uint64_t div = 1;
  uint64_t res = 0;
  uint64_t factor = 1;
  for (int i= 0; i<16; i++) {
    uint64_t next_div = div*16;
    int xh;
    if (next_div==0)
      xh = x / div;
    else
      xh = (x % next_div) / div; // i-esima cifra de derecha a izquierda
    if ( xh != h ) {
      res += xh*factor;
      factor *= 16;
    }
    div = next_div;
  }
  return res;
}

// ----------------------------------------------------

static void check(uint64_t x, int h, uint64_t ref) {
  uint64_t r= elimHex(x, h);
  if ( r != ref) {
    fprintf( stderr,
             "Error: el resultado de elim(0x%lx,0x%x) debio ser 0x%lx, "
             "no 0x%lx\n", x, h, ref, r);
    exit(1);
  }
}

int main(int argc, char **argv) {
#if 1
  int tiempo_ref= 0;
  int bench= 0;            // si se hace o no el benchmark

  if (argc==2) {
    bench= 1;
    if (strcmp(argv[1], "ref")!=0)
      tiempo_ref= atoi(argv[1]);
  }
#endif

  printf("Tests de unidad \n");
  check(0x0, 0x0, 0x0); // El cero
  check(0x2, 0x1, 0x2); // h no esta presente
  check(0x20, 0x1, 0x20); // h no esta presente
  check(0xa, 0xa, 0x0); // h si esta presente
  check(0xa0, 0xa, 0x0); // h si esta presente
  check(0x123456789abcdef, 0xf, 0x123456789abcde); // h si esta presente
  check(0x123456789abcdef, 0x1, 0x23456789abcdef); // h si esta presente
  check(0x123456789abcdef, 0x6, 0x12345789abcdef); // h si esta presente
  check(0xaabbccddeeff0011, 0xc, 0xaabbddeeff0011); // h esta presente 2 veces
  check(0xbbccddeeff0011, 0xa, 0xbbccddeeff0011); // h esta presente 2 veces
  check(0xaabbccddeeff0011, 0x1, 0xaabbccddeeff00); // h esta presente 2 veces
  check(0xab98ab98ab98ab98, 0xa, 0xb98b98b98b98); // h esta varias veces
  check(0xab98ab98ab98ab98, 0x8, 0xab9ab9ab9ab9); // h esta varias veces
  // Caso de borde: eliminar un 0
  check(0x104c008d000000, 0x0, 0x14c8d); // Se eliminan los 0s de la derecha

  printf("Test exhaustivo de una sola cifra en distintas posiciones\n");
  for (int shift = 0; shift<64; shift += 4)
    for (uint64_t x= 0; x<=0xf; x++)
      for (int h= 1; h<=0xf; h++)
        check(x<<shift, h, x==h ? 0 : x<<shift);

  printf("%d tests con numeros aleatorios\n", NRANDTESTS*16);
  uint64_t chksum_ref= 0;
  srandNum(1);
  for (int i= 0; i<NRANDTESTS; i++) {
    uint64_t x = randNum();
    for (int h= 0; h<=0xf; h++) {
      uint64_t ref= elimHexSlow(x, h);
      chksum_ref += ref;
    }
  }

  srandNum(1);
  for (int i= 0; i<NRANDTESTS; i++) {
    uint64_t x = randNum();
    for (int h= 0; h<0xf; h++)
      check(x, h, elimHexSlow(x, h));
  }

#if 1
  if (bench) {
    printf("Benchmark de %d llamadas a elim\n", NRANDTESTS*REP*16);
    printf("Tiempo tomado por la solucion del profesor: %d milisegundos\n",
           tiempo_ref);
    int intento= 1;
    while (intento<=NINTENTOS) {
      resetTime();
      for (int k= 0; k<REP; k++) {
        srandNum(1);
        uint64_t chksum= 0;
        for (int i= 0; i<NRANDTESTS; i++) {
          uint64_t x = randNum();
          for (int h= 0; h<=0xf; h++)
            chksum += elimHex(x, h);
        }
        if (chksum != chksum_ref) {
          fprintf(stderr, "Check sum es incorrecto!\n");
          exit(1);
        }
      }
      int tiempo= getTime();
      printf("Tiempo de cpu usado por su version: %d milisegundos\n", tiempo);
      if (argc==2) {
        if (tiempo_ref!=0) {
          double q= (double)tiempo/(double)tiempo_ref;
          int porciento= (q-1.)*100;
          printf("Porcentaje de sobrecosto: %d %%\n", porciento);
          if (porciento<=TOLERANCIA) {
            break;
          }
          else {
            fprintf(stderr, "*** Su solucion es demasiado lenta ***\n");
            if (intento<NINTENTOS) {
              fprintf(stderr, "Volveremos a intentar\n");
            }
            else {
              fprintf(stderr, "Lo siento: despues de %d intentos supera "
                              "el sobrecosto tolerado de %d %%\n",
                              NINTENTOS, TOLERANCIA);
              fprintf(stderr,
                "Coloque su computador en modo alto rendimiento, porque el\n"
                "economizador de bateria puede alterar los resultados.\n"
                "No ejecute este programa junto a otros programas que hagan\n"
                "un uso intensivo de la CPU.  En windows puede lanzar el\n"
                "administrador de tareas para verificar que el uso de CPU\n"
                "sea bajo.\n");
              exit(1);
            }
            intento++;
          }
        }
        else {
          FILE *out= fopen("tiempo-ref.txt", "w");
          if (out==NULL) {
            perror("tiempo-ref.txt");
            exit(1);
          }
          fprintf(out, "%d\n", tiempo);
          fclose(out);
          break;
        }
      }
    }
  }
#endif

  printf("Bien, felicitaciones\n");
  return 0;
}
