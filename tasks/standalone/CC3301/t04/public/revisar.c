#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#include "pss.h"

#define TAM_MAX 255

typedef struct {
  int izq, der;
  short tam_llave, tam_valor;
} NodoArch;

typedef struct nodo {
  intptr_t pos;
  char *llave, *valor;
  struct nodo *pizq, *pder;
  NodoArch nodoa;
} Nodo;

// Lee un nodo en el diccionario en dicc
Nodo *leer_nodo(FILE *dicc, char *nom) {
    int pos= ftell(dicc);
    NodoArch nodoa;
    int rc= fread(&nodoa, sizeof(NodoArch), 1, dicc);
    if (feof(dicc))
        return NULL;

    if (ferror(dicc)) {
        perror(nom);
        exit(1);
    }

    Nodo *pnodo= malloc(sizeof(Nodo));
    pnodo->pos= pos;
    pnodo->nodoa= nodoa;
    if (nodoa.tam_llave>TAM_MAX || nodoa.tam_llave<0) {
        fprintf(stderr, "El tamanno de la llave parece corrupto (%d)\n",
                nodoa.tam_llave);
        exit(1);
    }
    if (nodoa.tam_valor>TAM_MAX || nodoa.tam_valor<0) {
        fprintf(stderr, "El tamanno del valor parece corrupto (%d)\n",
                nodoa.tam_llave);
        exit(1);
    }

    pnodo->llave= malloc(nodoa.tam_llave+1);
    rc= fread(pnodo->llave, nodoa.tam_llave, 1, dicc);
    if (rc<=0) {
       fprintf(stderr, "No se puede leer llave de nodo en posicion %d\n", pos);
       exit(1);
    }
    pnodo->llave[nodoa.tam_llave]= 0;

    pnodo->valor= malloc(nodoa.tam_valor+1);
    rc= fread(pnodo->valor, nodoa.tam_valor, 1, dicc);
    if (rc<=0) {
       fprintf(stderr, "No se puede leer valor de nodo en posicion %d\n", pos);
       exit(1);
    }
    pnodo->valor[nodoa.tam_valor]= 0;
    return pnodo;
}

// Asigna los campos nodo_izq y nodo_der en un nodo y sus subnodos
Nodo *completar_abb(Map *pos2nodo, intptr_t pos) {
    if (pos==-1)
        return NULL;
    Nodo *pnodo= query(pos2nodo, (void*)pos);
    if (pnodo==NULL) {
        fprintf(stderr, "No se pudo ubicar nodo en posicion %ld\n", pos);
        exit(1);
    }
    pnodo->pizq= completar_abb(pos2nodo, pnodo->nodoa.izq);
    pnodo->pder= completar_abb(pos2nodo, pnodo->nodoa.der);
    return pnodo;
}

// Verifica el buen ordenamiento de un arbol binario de busqueda
void verificar_abb(Nodo *pnodo, Nodo **pprev) {
    if (pnodo==NULL)
        return;

    // Verifica recursivamente el subarbol izquierdo
    // En *pprev queda el ultimo nodo visitado en el subarbol izquierdo
    verificar_abb(pnodo->pizq, pprev);

    // Se verifica que pnodo este bien ordenado con respecto a *pprev.
    // Cuidado porque el nodo extremo de la izquierda no posee nodo
    // previo y por lo tanto *pprev==NULL.
    if (*pprev!=NULL && strcmp((*pprev)->llave, pnodo->llave)>=0) {
        fprintf(stderr, "Las llaves %s y %s estan desordenadas\n",
                (*pprev)->llave, pnodo->llave);
        exit(1);
    }

    // Ahora el ultimo nodo visitado es pnodo
    *pprev= pnodo;
    // Se verifica recursivamente el subarbol derecho.
    // pnodo es el nodo previo al nodo extremo izquierdo del subarbol derecho.
    verificar_abb(pnodo->pder, pprev);
}

void libera_abb(Nodo *pnodo, Map *pos2nodo) {
    if (pnodo==NULL)
        return;
    libera_abb(pnodo->pizq, pos2nodo);
    libera_abb(pnodo->pder, pos2nodo);
    del(pos2nodo, (void*)pnodo->pos);
    free(pnodo->llave);
    free(pnodo->valor);
    free(pnodo);
}

int main(int argc, char **argv) {
    if (argc!=2) {
        fprintf(stderr, "uso: ./revivar <archivo>\n");
        exit(1);
    }
    char *nom= argv[1];
    FILE *dicc = fopen(nom, "r");
    if (dicc==NULL) {
        perror(nom);
        exit(1);
    }

    Map *pos2nodo= makeHashMap(1000, hash_ptr, pointer_equals);

    // Leemos todos los nodos en el archivo.
    // El diccionario pos2nodo almacena la relacion posicion -> nodo.
    for (;;) {
        intptr_t pos= ftell(dicc); // La posicion del nodo que se va a leer
        // Lee nodo ubicado en desplazamiento pos
        // En *pnodo quedara la llave y el valor, pero no pizq y pder
        Nodo *pnodo= leer_nodo(dicc, nom);
        if (pnodo==NULL)
            break;
        // Se establece que en la posicion pos esta el nodo con direccion pnodo
        define(pos2nodo, (void*)pos, pnodo);
        printf("%s ===> %s\n", pnodo->llave, pnodo->valor);
    }
    int pos= ftell(dicc);
    fseek(dicc, 0, SEEK_END);
    int tam= ftell(dicc);
    if (pos!=tam) {
        fprintf(stderr,
            "Tamanno del archivo %d es inconsistente con lo leido %d\n",
            tam, pos);
        exit(1);
    }
    fclose(dicc);

    // Se asignan los campos pizq y pder en todo el abb
    Nodo *raiz= completar_abb(pos2nodo, 0);

    // Se hacer un recorrido en orden para verificar que las llaves
    // estan correctamente ordenadas.  En prev se almacena la direccion
    // del ultimo nodo visitado.  Cada vez que se visita un nodo n se
    // valida que la lleva en el nodo previamente visitado sea menor
    // lexicograficamente que la llave en n.
    Nodo *prev= NULL;
    verificar_abb(raiz, &prev);
    printf("El diccionario es consistente\n");
    libera_abb(raiz, pos2nodo);
    destroyHashMap(pos2nodo);

    return 0;
}
