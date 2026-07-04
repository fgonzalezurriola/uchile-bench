#define _XOPEN_SOURCE 500

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <unistd.h>
#include <sys/time.h>
#include <string.h>

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
// Funciones para crear un diccionario grande

#define TAM 10

typedef struct {
  int izq, der;
  short tam_llave, tam_valor;
  char llave[TAM], valor[TAM];
} NodoArch;

void i2str(int k, char *res) {
  char buf[20];
  sprintf(buf, "%d", k);
  int len= strlen(buf);
  int i= 0;
  while (i<TAM-len) {
     res[i]= '0';
     i++;
  }
  strncpy(&res[i], buf, len);
}

int llenar(NodoArch arch[], int i, int j, int *pidx) {
    if (i>j)
        return -1;
    int h=(i+j+1)/2;  // Llave de este nodo
    NodoArch *p= &arch[*pidx];
    int pos = *pidx * sizeof(NodoArch);
    (*pidx)++;
    int izq= llenar(arch, i, h-1, pidx);
    int der= llenar(arch, h+1, j, pidx);
    NodoArch nodoa= { izq, der, TAM, TAM};
    i2str(h, nodoa.llave);
    i2str(h, nodoa.valor);
    *p= nodoa;
    return pos;
}

// ----------------------------------------------------
// Benchmark

char *read_file(char *nom) {
    FILE *fil= fopen(nom, "r");
    fseek(fil, 0, SEEK_END);
    int tam= ftell(fil);
    char *res= malloc(tam+1);
    fseek(fil, 0, SEEK_SET);
    fread(res, tam, 1, fil);
    res[tam]= 0;
    fclose(fil);
    return res;
}

int bench(char *binary, int n, int ntests) {
    srandom(100);
    int ini= getTime();
    for (int i= 0; i<ntests; i++) {
        char cmd[100], llave[20];
        int k= random()%n;
        i2str(k, llave);
        llave[TAM]=0;
        sprintf(cmd, "%s big.dicc %s > res.txt\n", binary, llave);
        int rc= system(cmd);
        if (rc!=0) {
            fprintf(stderr, "Codigo de retorno %d es incorrecto\n", rc);
            exit(1);
        }
        char *res= read_file("res.txt");
        int len_res= strlen(res);
        if (len_res>0 && res[len_res-1]=='\n')
            res[len_res-1]= 0; // Se quita el '\n'
        if (strcmp(res, llave)!=0) {
            fprintf(stderr, "Busqueda de %s entrega incorrectamente %s\n",
                    llave, res);
            exit(1);
        }
        free(res);
    }
    return getTime()-ini;
}

int main(int argc, char **argv) {
    printf("\n--------------------------------------------------\n");
    printf("Test de eficiencia\n\n");
    if (argc!=3) {
        fprintf(stderr, "uso: ./bench <bin-prof> <bin>\n");
        exit(1);
    }
    FILE *dicc = fopen("big.dicc", "w");
    if (dicc==NULL) {
        perror("big.dicc");
        exit(1);
    }
    int n= 100000;
    int ntests= 1000;
    printf("Construyendo diccionario de %d definiciones\n", n);
    NodoArch *arch= malloc(n*sizeof(NodoArch));
    int idx= 0;
    llenar(arch, 0, n-1, &idx);
    fwrite(arch, sizeof(NodoArch), n, dicc);
    fclose(dicc);
    free(arch);

    char *bin_prof= argv[1];
    char *bin= argv[2];

    int intento= 1;
    while (intento<=5) {
        printf("Intento= %d\n", intento);
        printf("Midiendo tiempo del binario del profesor con %d busquedas\n",
               ntests);
        int tiempo_prof= bench(bin_prof, n, ntests);
        printf("Tiempo= %d milisegundos\n", tiempo_prof);
        printf("Midiendo tiempo de su solucion con %d busquedas\n", ntests);
        int tiempo= bench(bin, n, ntests);
        printf("Tiempo= %d milisegundos\n", tiempo);
        double q= (double)tiempo/(double)tiempo_prof;
        int porciento= (q-1.)*100;
        printf("Porcentaje de sobrecosto: %d %%\n", porciento);
        if (porciento<=TOLERANCIA)
            break;
        printf("Excede en mas del %d %% la version del profesor\n", TOLERANCIA);
        if (intento<5)
            printf("Se hara un nuevo intento\n");
        intento++;
    }
    if (intento>5) {
      fprintf(stderr, "Lo siento: Despues de 5 intentos no satisface "
                      "la eficiencia requerida.\n");
      fprintf(stderr,
              "Si esta leyendo el archivo completo no aprobara este test.\n"
              "Coloque su computador en modo alto rendimiento, porque el\n"
              "economizador de bateria puede alterar los resultados.\n"
              "No ejecute este programa junto a otros programas que hagan\n"
              "un uso intensivo de la CPU.  En windows puede lanzar el\n"
              "administrador de tareas para verificar que el uso de CPU\n"
              "sea bajo.\n");
      exit(1);
    }
    
    printf("Felicitaciones: Aprobo el test de eficiencia\n");
    
    return 0;
}
