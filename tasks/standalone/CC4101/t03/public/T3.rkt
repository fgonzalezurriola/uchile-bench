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
<s-type> ::= 'Number
           | 'Boolean
           | (list -> <s-type> <s-type>)
|#

#|
<type> ::= (numT)
         | (boolT)
         | (arrowT <type> <type>)
|#
(deftype Type
  (numT)
  (boolT)
  (arrowT arg ret))

;; parse-type :: <s-type> -> Type


#| Parte B |#

#|
<s-expr> ::= <number>
           | true
           | false
           | <symbol>
           | (list + <s-expr> <s-expr>)
           | (list * <s-expr> <s-expr>)
           | (list < <s-expr> <s-expr>)
           | (list if <s-expr> <s-expr> <s-expr>)
           | ...
|#

#|
<expr> ::= (num <number>)
         | (tt)
         | (ff)
         | (id <symbol>)
         | (add <expr> <expr>)
         | (mul <expr> <expr>)
         | (lt <expr> <expr>)
         | (ite <expr> <expr> <expr>)
         | ...
|#
(deftype Expr
  (num n)
  (tt)
  (ff)
  (id x)
  (add left right)
  (mul left right)
  (lt left right)
  (ite cond true false)
  '...)


#| Parte C |#

;; parse :: <s-expr> -> Expr


#| Parte D |#

#| TypeEnv Utils |#
(deftype TypeEnv
  (mtTenv)
  (xTenv id type env))

(define empty-tenv (mtTenv))

(define extend-tenv xTenv)

(define (tenv-lookup x env)
  (match env
    [(mtTenv) (error 'tenv-lookup "free identifier: ~a" x)]
    [(xTenv id type rest) (if (symbol=? x id) type (tenv-lookup x rest))]))

;; check-type :: Expr TypeEnv -> Type


#| Parte E |#

#| Language Values |#
;; numV y boolV son wrappers de los valores de Racket.
(deftype Value
  (numV n)
  (boolV v)
  (closureV arg body env))

#| Env Utils |#
;; Recuerde que los ambientes guardan valores, no expresiones.
(deftype Env
  (mtEnv)
  (xtEnv id val env))

(define empty-env (mtEnv))

(define extend-env xtEnv)

(define (lookup x env)
  (match env
    [(mtEnv) (error 'lookup "free identifier: ~a" x)]
    [(xtEnv id val rest) (if (symbol=? x id) val (lookup x rest))]))

;; interp :: Expr Env -> Value


#| Parte F |#

;; run :: <s-expr> -> Value


;;------------ ;;
;;==== P2 ==== ;;
;;------------ ;;

#| Parte A y E |#

#|
<prog> ::= (numbr <number>)
         | (variable <symbol>)
         | (plus <prog> <prog>)
         | (nil)
         | (conz <prog> <prog>)
         | ...
|#
(deftype Prog
  (numbr n)
  (plus l r)
  (nil)
  (conz a b)
  (variable x))

#|
<s-expr> ::= <number>
           | <symbol>
           | (list + <s-prog> <s-prog>)
           | (list nil)
           | (list cons <s-prog> <s-prog>)
           | (list list <s-prog> ...)
           | ...
|#

;; parser :: <s-prog> -> Prog


#| Parte B |#

#|
<pattern> ::= (numP <number>)
            | (varP <symbol>)
            | (nilP)
            | (conzP <pattern> <pattern>)
|#
(deftype Pattern
  (numP n)
  (varP x)
  (nilP)
  (conzP a b))

;; parse-pattern :: <s-prog> -> Pattern


#| Parte C |#

#|
<pvalue> ::= (numerical <number>)
          | (nilV)
          | (conzV <value> <value>)
|#
(deftype PValue
  (numerical n)
  (nilV)
  (conzV a b))

#|
<result> e v ::= (failure e)
               | (success v)
|#
(deftype Result
  (failure e)
  (success v))

;; generate-subst :: Pattern PValue -> (Result String (Listof (Symbol * PValue)))


#| Parte D y E |#

;; num+ PValue PValue -> PValue
(define (num+ v1 v2)
  (match v1
    [(numerical n) (match v2
                [(numerical m) (numerical (+ n m))]
                [_ (error "TypeError: expected a number")])]
    [_ (error "TypeError: expected a number")]))

;; reduce :: Prog (Listof (Symbol * PValue)) -> PValue


#| Parte F |#

#|
Respuesta:
|#