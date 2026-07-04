//==========================================
// Funciones para el TDA HashMap
//==========================================

typedef struct map Map;
typedef unsigned (*HashFun)(void *ptr);
typedef int (*EqualsFun)(void *ptrX, void *ptrY);
typedef struct map_iterator MapIterator;

// makeHashMap construye un mapa asociativo basado en una tabla de hash
// de tamano size.  Se debe prover la funcion que calcula el hash de las
// llaves.  Debe tener este encabezado por ejemplo:
//   unsigned int hash(void *ptr); 
// Tambien se debe proveer la funcion que compara las llaves con este
// encabezado:
//   int equals(void *ptrx, void *ptry);
// equals debe entregar verdadero si ptrx es igual a ptry

Map *makeHashMap(int size, HashFun hash, EqualsFun equals);
void destroyHashMap(Map *map);
int contains(Map *map, void *key);
void *query(Map *map, void *key);
int define(Map *map, void *key, void *val);
void *del(Map *map, void *key);
MapIterator *getMapIterator(Map *map);
void destroyMapIterator(MapIterator *iter);
int mapNext(MapIterator *iter, void **pkey, void **pval);
int mapHasNext(MapIterator *iter);
void resetMapIterator(MapIterator *iter);

// Funcion de hash y de igualdad para mapas de punteros

unsigned hash_ptr(void *ptr);
int pointer_equals(void *ptr1, void* ptr2);

// Funcion de hash y de igualdad para mapas de strings

unsigned hash_string(void *str);
int equals_strings(void *ptrX, void *ptrY);

// Funcion de hash y de igualdad para mapas con llaves enteras (tipo intptr_t).
// Para poder agregar asociaciones tiene que usar casts.  Por ejemplo:
//    Map *map= makeHashMap(100, hash_int, equals_int);
//    intptr_t i = ...
//    define(map, (void*) i, "i");
//    char *s= query(map, (void*)i);  // s es "i"

unsigned hash_int(void *ptr);
int equals_int(void *ptrI, void *ptrJ);

//==========================================
// Funciones para el TDA Queue
//==========================================

typedef struct queue Queue;

Queue *makeQueue();
void destroyQueue(Queue *q);
void put(Queue *q, void *ptr);
void *get(Queue *q);
void *peek(Queue *q);
int emptyQueue(Queue *q);
int queueLength(Queue *q);

//==========================================
// Funciones para el TDA cola de prioridades general
//==========================================

typedef int (*PriComparator)(void *, void*);
typedef struct priqueue PriQueue;

PriQueue *makeFullPriQueue(int iniSize, PriComparator compare);
void destroyPriQueue(PriQueue *q);
int priLength(PriQueue *q);
void *fullPriPeek(PriQueue *q);
void *fullPriGet(PriQueue *q);
void fullPriPut(PriQueue *q, void *elem);
int emptyPriQueue(PriQueue *q);

//==========================================
// Funciones para el TDA cola de prioridades simplificada
//==========================================

PriQueue *makePriQueue(void);
double priBest(PriQueue *q);
void *priPeek(PriQueue *q);
void *priGet(PriQueue *q);
void priPut(PriQueue *q, void *elem, double pri);

//==========================================
// Funciones para el TDA sort generico
//==========================================

// sortPtrArray(arr, i, j, compare) ordena el arreglo de punteros arr desde la
// posicion i a la j (inclusives) de acuerdo al criterio especificado
// por la funcion de comparacion compare.  La funcion de comparacion
// debe tener este encabezado:
//   int compare(void *arr, int i, int j);
// y debe entregar < 0 si arr[i] es menor que arr[j],
//                   0   si a[i] es igual a a[j]
//               o > 0 si no.
//
// Por ejemplo para ordenar por edad el arreglo de personas definidas
// por el tipo Persona (ver archivo ejemplo-sort.c):
//
//   typedef struct {
//     char *nom;
//     int edad;
//   } Persona;
//
// la funcion de comparacion debe ser:
//
//   int cmpPersonas(void *arr, int i, int j) {
//     Persona **a= ptr;
//     return a[i]->edad - a[j]->edad;
//   }
//
// Luego para ordenar el arreglo ppersonas definido a continuacion como:
//
//   Persona pedro= {"pedro", 5}, juan={"juan", 10}, diego{"diego", 3};
//   Persona *ppersonas[ ]= { &pedro, &juan, &diego };
//
// se debe invocar:
//   sortPtrArray(ppersonas, 0, 2, cmpPersonas);
//
// Importante: sortPtrArray solo puede ordenar arreglos de punteros.
// Por ejemplo permite ordenar el arreglo personas definido como:
//   Persona *ppersonas[10];
// pero no sirve para ordenar un arreglo definido como:
//   Persona persona[10];
// porque este no seria un arreglo de punteros.

typedef int (*Comparator)(void *ptr, int i, int j);
void sortPtrArray(void *ptr, int left, int right, Comparator compare);

// Para ordenar arreglos generales debe usar la funcion sort.
// En tal caso, ademas de la funcion de comparacion debe proveer la funcion
// que intercambia los elementos en el arreglo (ver ejemplo-sort.c).

typedef void (*Swapper)(void *ptr, int i, int j);
void sort(void *ptr, int left, int right, Comparator compare, Swapper swap);
