# -*- coding: utf-8 -*-
"""Tarea 2: Calculadora de expresiones restringidas."""


def procesar_comando(comando, dicc_var):
    # Esta funcion recibe un comando en string y el diccionario de variables.
    # Debe procesar el comando, imprimir el resultado cuando corresponda y
    # retornar el diccionario posiblemente modificado.
    return dicc_var


def calculadora(lista_comandos):
    dicc_var = {}
    for comando in lista_comandos:
        dicc_var = procesar_comando(comando, dicc_var)


if __name__ == "__main__":
    ejemplo_1 = [
        "n=5",
        "hanoi=2^n-1",
        "var_1 = 23 - 13 + hanoi * 2",
        "h2 = hanoi /2",
        "",
        "n",
    ]
    calculadora(ejemplo_1)

    ejemplo_2 = [
        "n=5",
        "hanoi=2^n-1",
        "var_1 = 23 - 13 + hanoi2 * 2",
        "h2 = hanoi /2",
        "",
        "n",
    ]
    calculadora(ejemplo_2)
