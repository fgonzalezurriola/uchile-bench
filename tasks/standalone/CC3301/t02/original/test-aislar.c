#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/time.h>
#include <string.h>

#include "aislar.h"

#ifdef OPT
#define REPS 15000
#else
#define REPS 500
#endif

#define TOLERANCIA 80

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
// Revisar: verifica que un string es un valor especifico

void revisar(char *s, char *valor) {
  if (strcmp(s, valor)!=0) {
    fprintf(stderr, "El string debio ser \"%s\", no \"%s\"\n", valor, s);
    exit(1);
  }
}

void revisar_int(int n, int nref) {
  if (n!=nref) {
    fprintf(stderr, "El valor retornado debio ser %d, no %d\n", nref, n);
    exit(1);
  }
}

// ----------------------------------------------------
// revisar_mutable: verifica correctitud del resultado y
// que no se alteren los alrededores del string

void revisar_mutable(char *s, char *referencia, int nref) {
  int len= strlen(s);
  char *cpy = malloc(len+1);
  strcpy(cpy, s);
  int n= aislar_palabras(cpy);

  revisar(cpy, referencia);
  revisar_int(n, nref);
  free(cpy);
}

// ----------------------------------------------------
// revisar_inmutable: verifica correctitud del resultado

void revisar_inmutable(char *s, char *referencia) {
  char *res= palabras(s);
  revisar(res, referencia);
  free(res);
}

int bench_palabras(int reps) {
  int tiempo_palabras;
  {
    int size= 1000000;
    printf("Apareceran %d puntos.\n", reps/100);
    char *big= malloc(size+1);
    char *sims= "!·$%&/()=?¿,;.:-[]{}+0123456789";
    int sim_len= strlen(sims);
    char *alfas= "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    int alfa_len= strlen(alfas);
    char **resultados= malloc(reps*sizeof(char*));
    for (int i= 0; i<size; i++)
      big[i]= sims[i%sim_len];
    big[size]= 0;
    resetTime();
    for (int i= 0; i<reps; i++) {
      int pos= rand()%size;
      char save= big[pos];
      char c= alfas[i%alfa_len];
      big[pos]= c;
      resultados[i]= palabras(big);
      if (resultados[i][0]!=c || resultados[i][1]!=0) {
        fprintf(stderr, "Resultado incorrecto\n");
        exit(1);
      }
      big[pos]= save;
      if (i%100==0) {
        printf(".");
        fflush(stdout);
      }
    }
    tiempo_palabras= getTime();
    for (int i= 0; i<reps; i++) {
      free(resultados[i]);
    }
    free(resultados);
    free(big);
  }
  printf("\n");
  return tiempo_palabras;
}

int bench_aislar(int reps) {
  printf("Se medira la eficiencia de la funcion aislar_palabras\n");
  int tiempo_aislar;
  char *tests[]= {
      "",
      " ",
      "  ",
      "        ",
      "a",
      "Z ",
      "  z ",
      "abcdefghijklmnopqrstuvwxyz",
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      "0123456789",
      "!·$%&/()=?¿,;.:-[]{}+",
      "a123bc4def56g7",
      "   a   bc def  g ",
      "  return ('a'<=ch && ch<='z') || ('A'<=ch && ch<='Z');",
      NULL
  };
  int tam= 0;
  while (tests[tam]!=NULL)
    tam++;
  char **copias= malloc(tam*sizeof(char*));
  for (int j= 0; j<tam; j++) {
    copias[j]= malloc(strlen(tests[j])+1);
  }
  resetTime();
  int cnt= 0;
  for (int i= 0; i<reps; i++) {
    for (int j= 0; j<tam; j++) {
      strcpy(copias[j], tests[j]);
      cnt += aislar_palabras(copias[j]);
    }
    if (i%(100*600)==0) {
      printf(".");
      fflush(stdout);
    }
  }
  tiempo_aislar= getTime();
  for (int j= 0; j<tam; j++) {
    free(copias[j]);
  }
  printf("\n");
  free(copias);
  return tiempo_aislar;
}

int main(int argc, char *argv[]) {
  printf("Tests unitarios de aislar_palabras\n");
  revisar_mutable("", "", 0);
  revisar_mutable(" ", "", 0);
  revisar_mutable("  ", "", 0);
  revisar_mutable("        ", "", 0);
  revisar_mutable("a", "a", 1);
  revisar_mutable("Z ", "Z", 1);
  revisar_mutable("  z ", "z", 1);
  revisar_mutable("abcdefghijklmnopqrstuvwxyz",
                  "abcdefghijklmnopqrstuvwxyz", 1);
  revisar_mutable("ABCDEFGHIJKLMNOPQRSTUVWXYZ",
                  "ABCDEFGHIJKLMNOPQRSTUVWXYZ", 1);
  revisar_mutable("0123456789", "", 0);
  revisar_mutable("!·$%&/()=?¿,;.:-[]{}+", "", 0);
  revisar_mutable("a123bc4def56g7", "a bc def g", 4);
  revisar_mutable("   a   bc def  g ", "a bc def g", 4);
  revisar_mutable("  return ('a'<=ch && ch<='z') || ('A'<=ch && ch<='Z');",
                    "return a ch ch z A ch ch Z", 9);
  
  printf("Bien: aprobo los tests de la funcion aislar_palabras\n");

  printf("Tests unitarios de palabras\n");

  revisar_inmutable("", "");
  revisar_inmutable(" ", "");
  revisar_inmutable("  ", "");
  revisar_inmutable("        ", "");
  revisar_inmutable("a", "a");
  revisar_inmutable("Z ", "Z");
  revisar_inmutable("  z ", "z");
  revisar_inmutable("abcdefghijklmnopqrstuvwxyz", "abcdefghijklmnopqrstuvwxyz");
  revisar_inmutable("ABCDEFGHIJKLMNOPQRSTUVWXYZ", "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  revisar_inmutable("0123456789", "");
  revisar_inmutable("!·$%&/()=?¿,;.:-[]{}+", "");
  revisar_inmutable("a123bc4def56g7", "a bc def g");
  revisar_inmutable("   a   bc def  g ", "a bc def g");
  revisar_inmutable("  return ('a'<=ch && ch<='z') || ('A'<=ch && ch<='Z');",
                    "return a ch ch z A ch ch Z");

  printf("Bien: aprobo los tests de la funcion palabras\n");

  int tiempo_palabras_prof= 0;
  int tiempo_aislar_prof= 0; 
  if (argc==3) { 
    tiempo_aislar_prof= atoi(argv[1]);
    tiempo_palabras_prof= atoi(argv[2]);
  } 
  int tiempo_palabras= 0;
  int tiempo_aislar= 0; 

  {
    printf("----------------------------\n");
    printf("Benchmark de aislar_palabras\n");
    printf("----------------------------\n");
    if (tiempo_aislar_prof!=0)
      printf("Tiempo para la version del profesor= %d milisegundos\n",
             tiempo_aislar_prof);
    int intento= 1;
    while (intento<=5) {
      if (tiempo_aislar_prof!=0)
        printf("Intento= %d\n", intento);
      int tiempo= bench_aislar(REPS*500);
      tiempo_aislar= tiempo;
      printf("Tiempo para su version= %d milisegundos\n", tiempo);
      if (tiempo_aislar_prof==0)
        break;
      double q= (double)tiempo/(double)tiempo_aislar_prof;
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
    printf("Aprobado\n");
  }

  printf("----------------------------\n");
  printf("Benchmark de palabras\n");
  printf("Se verificara que palabras no pida mas memoria que la necesaria.\n");
  printf("Si Ud. no es eficiente en el uso de la memoria, se acabara la\n");
  printf("memoria y tomara mucho tiempo hasta que termine en seg. fault.\n");
  printf("----------------------------\n");
  {
    if (tiempo_palabras_prof!=0)
      printf("Tiempo para la version del profesor= %d milisegundos\n",
             tiempo_palabras_prof);
    int intento= 1;
    while (intento<=5) {
      if (tiempo_palabras_prof!=0)
        printf("Intento= %d\n", intento);
      int tiempo= bench_palabras(REPS);
      tiempo_palabras= tiempo;
      printf("Tiempo para su version= %d milisegundos\n", tiempo);
      if (tiempo_palabras_prof==0)
        break;
      double q= (double)tiempo/(double)tiempo_palabras_prof;
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
    printf("Aprobado\n");
  }

  if (argc==2 && strcmp(argv[1], "ref")==0) {
    FILE *out= fopen("tiempo-ref.txt", "w");
    if (out==NULL) {
      perror("tiempo-ref.txt");
      exit(1);
    }
    fprintf(out, "%d %d\n", tiempo_aislar, tiempo_palabras);
    fclose(out);
  }

  printf("Felicitaciones!  Aprobo todos los tests.\n");

  return 0;
}
