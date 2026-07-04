# -*- coding: utf-8 -*-
"""Tarea 5: Arboles binarios de busqueda posicionales."""


class Nodoi:
    def __init__(self, izq, info, contador, der):
        self.izq = izq
        self.info = info
        self.contador = contador
        self.der = der
        self.rep = str(info) + "," + str(contador)


class Nodoe:
    def __init__(self, contador):
        self.contador = contador
        self.rep = contador


class Arbol:
    def __init__(self, raiz=Nodoe(0)):
        self.raiz = raiz

    def insert(self, x):
        return

    def search(self, x):
        return None

    def find(self, k):
        return None

    def dibujar(self):
        try:
            import aed_utilities as aed
        except ImportError as error:
            raise RuntimeError(
                "Instale aed-utilities para usar la visualizacion."
            ) from error
        btd = aed.BinaryTreeDrawer(
            fieldData="rep",
            fieldLeft="izq",
            fieldRight="der",
            classNone=Nodoe,
        )
        btd.draw_tree(self, "raiz")


def test_search(a, x):
    print(x, "esta" if a.search(x) is not None else "no esta")


def test_find(a, k):
    p = a.find(k)
    print("La k-esima llave para k=", k, "es", p.info if p is not None else "fuera de rango")


if __name__ == "__main__":
    a = Arbol()
    a.insert(40)
    a.insert(25)
    a.insert(32)
    a.insert(90)
    a.insert(62)
    a.insert(55)
    a.insert(70)
    test_search(a, 62)
    test_search(a, 10)
    test_find(a, 5)
    test_find(a, 8)
