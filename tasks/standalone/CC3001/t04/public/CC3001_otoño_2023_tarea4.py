# -*- coding: utf-8 -*-
"""Tarea 4: Generacion de codigo para formulas."""


class Nodoi:
    def __init__(self, izq, info, der):
        self.izq = izq
        self.info = info
        self.der = der


class Nodoe:
    def __init__(self, info):
        self.info = info


class Arbol:
    def __init__(self, formula):
        global k
        global s
        s = formula + ";"
        k = 0

        def expresion():
            global k
            global s
            a = factor()
            while s[k] == "+" or s[k] == "-":
                op = s[k]
                k += 1
                b = factor()
                a = Nodoi(a, op, b)
            return a

        def factor():
            global k
            global s
            a = termino()
            while s[k] == "*" or s[k] == "/":
                op = s[k]
                k += 1
                b = termino()
                a = Nodoi(a, op, b)
            return a

        def termino():
            global k
            global s
            if s[k].isalpha() or s[k].isdigit():
                a = Nodoe(s[k])
                k += 1
                return a
            if s[k] == "(":
                k += 1
                a = expresion()
                if s[k] != ")":
                    print("Error: Falta cierra parentesis: " + formula[k:])
                    assert False
                k += 1
                return a
            print("Error: Falta variable, numero o abre parentesis: " + formula[k:])
            assert False

        a = expresion()
        if s[k] != ";":
            print("Error: Basura al final de la formula: " + formula[k:])
            assert False
        self.raiz = a

    def codigo(self):
        # Esta es la funcion que se debe implementar.
        return ["Aqui", "va", "el", "codigo", "generado"]

    def dibujar(self):
        try:
            import aed_utilities as aed
        except ImportError as error:
            raise RuntimeError(
                "Instale aed-utilities para usar la visualizacion."
            ) from error
        btd = aed.BinaryTreeDrawer(
            fieldData="info",
            fieldLeft="izq",
            fieldRight="der",
            classNone=Nodoe,
        )
        btd.draw_tree(self, "raiz")


def probar(formula):
    a = Arbol(formula)
    for x in a.codigo():
        print(x)


if __name__ == "__main__":
    probar("a+1")
    probar("(a+b)*(c-d)")
    probar("(2-p*q)*(1/n+1/(p+q))")
    probar("((((a+b)+c)+d)+e)")
    probar("(a+(b+(c+(d+e))))")
    probar("a")
