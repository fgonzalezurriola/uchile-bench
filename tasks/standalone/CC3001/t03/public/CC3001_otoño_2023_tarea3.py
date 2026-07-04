# -*- coding: utf-8 -*-
"""Tarea 3: Resolucion de Sudoku por backtracking."""

import numpy as np


def leer_matriz(archivo):
    f = open(archivo, "r")
    M = np.zeros((9, 9), dtype=int)
    for i in range(0, 9):
        linea = f.readline()
        b = linea.split()
        for j in range(0, 9):
            M[i, j] = int(b[j])
    return M


def pruebaSudoku(M):
    return


if __name__ == "__main__":
    for i in range(1, 8):
        sinSolucion = "data/sudoku" + str(i) + ".txt"
        conSolucion = "data/solsudoku" + str(i) + ".txt"
        A = leer_matriz(sinSolucion)
        print("Probando solucion para " + sinSolucion + ":")
        print(A)
        B = leer_matriz(conSolucion)
        print(" ")
        print("La solucion correcta es:")
        print(B)
        print(" ")
        pruebaSudoku(A)
        print(A == B)
        print(" ")
        assert np.array_equal(A, B)
    print("Su funcion paso todos los tests")
