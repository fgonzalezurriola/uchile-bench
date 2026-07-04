probar() {
  BIN=$1
  DIR=$2
  N=$3
  REF=$4
  echo "Ejecutando: ./$BIN $DIR $N > recientes.txt"
  (./$BIN $DIR $N > recientes.txt) >& err.txt
  RC=$?
  echo "La salida estandar es:"
  echo "-------------------------------------------"
  cat recientes.txt
  echo "-------------------------------------------"
  if [ $RC -ne 0 ]
  then
    echo
    echo "*** El codigo de retorno fue $RC. Debio ser 0 ***"
    echo "El codigo de retorno es el valor que retorna la funcion main"
    echo "o el argumento de la funcion exit"
    echo "La salida estandar de errores fue:"
    echo "-------------------------------------------"
    cat err.txt
    echo "-------------------------------------------"
    exit 1
  fi
  echo "Comparando salida estandar con salida esperada con:"
  echo "diff recientes.txt $REF"
  diff recientes.txt $REF
  if [ $? -ne 0 ]
  then
    echo
    echo "*** La salida estandar es incorrecta ***"
    echo "Debio ser:"
    echo "-------------------------------------------"
    cat $REF
    echo "-------------------------------------------"
    echo "Si la salida parece ser igual, instale xxdiff con:"
    echo "    sudo apt-get install xxdiff"
    echo "y luego compare los caracteres invisibles con:"
    echo "xxdiff recientes.txt $REF"
    exit 1
  fi
  cmp err.txt empty.txt
  if [ $? -ne 0 ]
  then
    echo
    echo "*** La salida estandar de errores es incorrecta ***"
    echo "Debio estar vacia"
    echo "La salida estandar de errores fue:"
    echo "-------------------------------------------"
    cat err.txt
    echo "-------------------------------------------"
    exit 1
  fi
  echo Aprobado
}

probar $1 dir1 3 ref-dir1.txt
probar $1 dir2 10 ref-dir2.txt
