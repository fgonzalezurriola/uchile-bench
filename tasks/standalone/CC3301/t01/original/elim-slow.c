#include <stdio.h>
#include <stdint.h>

#include "elim.h"

// Puede tomar ideas de esta solucion pero considere que:
// - esta version es mucho mas lenta que la del profesor
// - usa * / y % que estan prohibidos por ser ineficientes
// Piense en una version eficiente que no use los operadores prohibidos

uint64_t elimHex(uint64_t x, int h) {
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

