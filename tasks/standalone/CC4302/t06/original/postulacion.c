#include <stdlib.h>
#include <stdio.h>    // printf
#include <unistd.h>   // sleep
#include <pthread.h>
// t6.c
#include "pss.h"
#include "postulacion.h"
#include "spinlocks.h"

typedef struct {
    Estudiante *est;
    double *ranking;
} Postulacion;

PriQueue *priQueue[N];
int postulacionTrabajos[N];

void iniciarPostulaciones(){
  //
}

void destruirPostulaciones(){
    //
}

void postularTrabajo(
          Estudiante *est, int *preferencias, double *rank) {
  //
}

int cerrarPostulacion(int i) {
  //
}
