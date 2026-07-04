#lang play


#|
Nombre: 
¿Utilizó Whiteboard Policy? (SI o NO):
En caso afirmativo, ¿con quién?:
¿en qué ejercicio(s)?:
|#


;;------------ ;;
;;==== P1 ==== ;;
;;------------ ;;

#| Parte A |#

#|
<poly> ::= (poly (Listof <number>))
         | (id <id>)
         | (add <poly> <poly>)
         | (mul <poly> <poly>)
         | (if0 <poly> <poly> <poly>)
         | (with <id> <poly> <poly>)
|#

#| Parte B |#

#|
<s-poly> ::= <number>
           | <symbol>
           | (list <number> ...)
           | (list + <s-poly> <s-poly> ...)
           | (list * <s-poly> <s-poly> ...)
           | (list if0 <s-poly> <s-poly> <s-poly>)
           | (list with <symbol> <s-poly> <s-poly>)
|#

;; parse :: <s-poly> -> Poly

#| Parte C |#

(deftype Env
  (tyEnv)
  (xtEnv symbol value env))

(define empty-env (tyEnv))

;; extend-env :: symbol Poly Env -> Env
;; Extiende un ambiente añadiendo una variable.
(define (extend-env x v env)
  (xtEnv x v env))

;; env-lookup :: symbol Env -> (or #f Env)
;; Busca una variable en un ambiente, retornando el
;; valor encontrado o #f en caso de que no esté definida.
(define (env-lookup x env)
  (match env
    [(tyEnv) #f]
    [(xtEnv s v tail) (if (symbol=? x s)
                          v
                          (env-lookup x tail))]))

;; reduce :: Poly Env -> Poly



;;------------ ;;
;;==== P2 ==== ;;
;;------------ ;;

#| Parte A |#

#|
<expr> ::= ...
        | (addc <expr> <expr>)
        | (subc <expr> <expr>)
        | (if0c <expr> <expr> <expr>)
        | ...
|#
(deftype Expr
  ; ...
  (addc l r)
  (subc l r)
  (if0c c t f)
  ; ...
  )

#| Parte B |#

#|
Concrete syntax of expressions:

<s-expr> ::= ...
           | (+ <s-expr> <s-expr>)
           | (- <s-expr> <s-expr>)
           | (if0 <s-expr> <s-expr> <s-expr>)
           | ...
|#

;; parser :: <s-expr> -> Expr

(define (parser s-expr) '???)

#| Parte C |#

#|
<cvalue> ::= (compV <num> <num>)
|#

(deftype CValue (compV r i))

;; from-CValue :: CValue -> Expr
(define (from-CValue v) '???)

;; cmplx+ :: CValue CValue -> CValue
(define (cmplx+ v1 v2) '???)

;; cmplx- :: CValue CValue -> CValue
(define (cmplx- v1 v2) '???)

;; cmplx0? :: CValue -> Boolean
(define (cmplx0? v) '???)

#| Parte D |#

;; subst :: Expr Symbol Expr -> Expr
(define (subst in what for) '???)

#| Parte E |#

;; interp :: Expr -> CValue
(define (interp expr) '???)

