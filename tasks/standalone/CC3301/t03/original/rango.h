
typedef struct nodo {
  int x;             // un elemento del conjunto
  struct nodo *prox; // proximo nodo de la lista enlazada
} Nodo;

void eliminarRango(Nodo **phead, double y, double z);
