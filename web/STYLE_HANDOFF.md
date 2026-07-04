# Handoff de estilo

Quiero que iteres el estilo de UChile Bench sin cambiar el modelo de datos ni el foco del producto.

Contexto:

- UChile Bench es un benchmark chileno en espanol sobre agentes de IA resolviendo tareas publicas del DCC UChile.
- La prioridad visual es el leaderboard: notas primero, costo despues, y metricas nerd en segundo plano.
- El sitio debe sentirse como una herramienta minima tipo Vercel/deepswe: oscuro, sobrio, directo, con buena densidad de informacion.
- Evita landing page marketera. La primera pantalla debe mostrar el benchmark y sus resultados.
- Mantiene navegacion simple: Resultados, Sesiones, GitHub.
- Las sesiones de agentes son una vista separada para auditoria, no el foco principal.

Restricciones:

- No uses ilustraciones decorativas, orbs, gradientes grandes ni cards anidadas.
- No cambies los nombres de modelos, targets, notas ni costos.
- No muestres DeepSeek como $0: la comparacion debe usar el costo normalizado.
- Conserva legibilidad en desktop y mobile.
- Mantiene una estetica minima; agrega refinamiento visual, no ruido.

Buen resultado esperado:

- Un visitante entiende en menos de 10 segundos que modelo rindio mejor, cuanto costo y cuantas tareas fueron evaluadas.
- La tabla sigue siendo auditable.
- Los graficos son claros, con labels y tooltips utiles.
- La vista de sesiones permite inspeccionar runs sin cargar todos los JSON por adelantado.
