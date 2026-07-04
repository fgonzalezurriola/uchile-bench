#!/usr/bin/bash

trap "rm -rf /tmp/defs.dicc" EXIT
ARCH=$(arch)
CONSULTAR=./$1
chmod +x $CONSULTAR

test() {
  DICC=$1
  LLAVE=$2
  EXTRA=$3
  echo "Ejecutando: $CONSULTAR $DICC $LLAVE $EXTRA"
  ( $CONSULTAR $DICC $LLAVE $EXTRA > raw-std.txt ) >& err.txt
  RC=$?
  cat raw-std.txt | xargs > std.txt
  ( ./prof.ref-$ARCH $DICC $LLAVE $EXTRA > raw-std-ref.txt ) >& err-ref.txt
  REFRC=$?
  cat raw-std-ref.txt | xargs > std-ref.txt

  cmp err.txt err-ref.txt
  if [ $? -ne 0 ]
  then
    echo "*** Salida estandar de errores incorrecta ***"
    echo "Su solucion entrega en la salida estandar de errores:"
    echo "============================================================"
    cat err.txt
    echo "============================================================"
    echo "Debio ser:"
    echo "============================================================"
    cat err-ref.txt
    echo "============================================================"
    echo "Si la salida parece ser igual, instale xxdiff con:"
    echo "    sudo apt-get install xxdiff"
    echo "y luego compare los caracteres invisibles con:"
    echo "xxdiff err.txt err-ref.txt"
    echo "Para depurar lance ddd con: make ddd"
    echo "En la ventana de ddd, coloque un breakpoint con: b main"
    echo "Ejecute con: run defs.dicc $LLAVE $EXTRA"
    echo "Luego ejecute paso a paso con el boton next"
    exit 1
  fi
  cat err.txt

  cmp std.txt std-ref.txt
  if [ $? -ne 0 ]
  then
    echo "*** Salida estandar incorrecta ***"
    echo "Su solucion entrega en la salida estandar:"
    echo "============================================================"
    cat std.txt
    echo "============================================================"
    echo "Debio ser:"
    echo "============================================================"
    cat std-ref.txt
    echo "============================================================"
    echo "Si la salida parece ser igual, instale xxdiff con:"
    echo "    sudo apt-get install xxdiff"
    echo "y luego compare los caracteres invisibles con:"
    echo "xxdiff std.txt std-ref.txt"
    echo "Para depurar lance ddd con: make ddd"
    echo "En la ventana de ddd, coloque un breakpoint con: b main"
    echo "Ejecute con: run defs.dicc $LLAVE $EXTRA"
    echo "Luego ejecute paso a paso con el boton next"
    exit 1
  fi
  cat raw-std.txt

  if [ "$RC" == 0 ]
  then
    if [ "$REFRC" != 0 ]
    then
      echo "El codigo de retorno es incorrectamente 0.  Debio ser $REFRC"
      echo "Es el valor que retorna la funcion main, o el parametro de exit"
      exit 1
    fi
  fi
  if [ "$RC" != 0 ]
  then
    if [ "$REFRC" == 0 ]
    then
      echo "El codigo de retorno es incorrectamente $RC.  Debio ser 0"
      echo "Es el valor que retorna la funcion main, o el parametro de exit"
      exit 1
    fi
  fi
  if [ "$RC" != 0 ]
  then
    echo "Bien.  Se diagnostico correctamente el error."
  fi
}

echo "-----------------------------------------------------------"
echo "Tests unitarios"
test defs.dicc embarcacion
test defs.dicc casa
test defs.dicc lluvia
test defs.dicc alimento
test defs.dicc celular
test defs.dicc canario
test defs.dicc palacio
test defs.dicc bolsillo
test defs.dicc correr
test defs.dicc nadar
test defs.dicc posada
test defs.dicc taladro
test defs.dicc perro
test defs.dicc techo

echo "-----------------------------------------------------------"
echo "Test con llave inexistente"
test defs.dicc vaca

echo "-----------------------------------------------------------"
echo "Test con un diccionario inexistente"
test nodefs.dicc bolsillo
echo "-----------------------------------------------------------"
echo "Test con diccionario sin permiso de lectura"
cp defs.dicc /tmp/
chmod -r /tmp/defs.dicc
test /tmp/defs.dicc litigio
rm -f /tmp/defs.dicc

echo "-----------------------------------------------------------"
echo "Test de uso incorrecto de parametros"
test defs.dicc perro "mamifero domestico con olfato muy fino, inteligente y leal"
test defs.dicc

echo
echo "Felicitaciones: Aprobo todos los tests"
