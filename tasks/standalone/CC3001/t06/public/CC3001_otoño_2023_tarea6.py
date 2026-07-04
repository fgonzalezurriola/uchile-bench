# -*- coding: utf-8 -*-
"""Tarea 6: Comparacion de Quicksort original y mediana de tres."""

import numpy as np


def quicksort(a):
    qsort(a, 0, len(a) - 1)


def qsort(a, i, j):
    if i < j:
        k = particion(a, i, j)
        qsort(a, i, k - 1)
        qsort(a, k + 1, j)


def particion(a, i, j):
    # a[i] es el pivote.
    s = i
    for t in range(s, j):
        if a[t + 1] <= a[i]:
            (a[s + 1], a[t + 1]) = (a[t + 1], a[s + 1])
            s = s + 1
    (a[i], a[s]) = (a[s], a[i])
    return s


def chequea_orden(a):
    print("Ordenado" if np.all(a[:-1] <= a[1:]) else "Desordenado")


def quicksort3(a):
    qsort3(a, 0, len(a) - 1)


def qsort3(a, i, j):
    # Reemplace esto por la version con mediana de tres.
    return


def particionMedianaDe3(a, i, j):
    # Reemplace esto por la particion con mediana de tres.
    return i


if __name__ == "__main__":
    a = np.random.random(30)
    print(a)
    chequea_orden(a)
    quicksort(a)
    print(a)
    chequea_orden(a)

    b = np.random.random(30)
    print(b)
    chequea_orden(b)
    quicksort3(b)
    print(b)
    chequea_orden(b)

    ns = [100, 1000, 5000, 10000, 15000, 20000, 40000]
    print("Valores de n para el experimento:", ns)
