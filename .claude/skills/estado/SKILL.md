---
name: estado
description: "Resume en qué punto del flujo está el proyecto y cuál es el siguiente paso. Úsalo cuando pregunten por el estado o por qué toca hacer ahora."
---

Informa del punto en que está el proyecto, sin ejecutar ninguna fase ni modificar ningún fichero.

1. Ejecuta `node _flujo/estado.mjs ayuda` si necesitas recordar las órdenes del estado (el estado lo guarda la base de datos; `_docs/proyecto.md` y `<ciclo>/estado.md` son copias legibles que el comando regenera). Lee `_docs/proyecto.md` para saber cuál es el ciclo activo (`<ciclo>` es su carpeta, `_docs/ciclos/NN-nombre`) y después `<ciclo>/estado.md`. Si existen, lee también `<ciclo>/verificacion.md` y las últimas entradas de `<ciclo>/revisiones-*.md` y `<ciclo>/huecos.md`. Ejecuta también `git status -sb` y `git stash list` (solo lectura). Ejecuta además `node _flujo/validar.mjs` (solo lectura) para comprobar la coherencia de `_docs/`.
2. Resume en pocas líneas: ciclo activo, ciclos ya cerrados y ciclos previstos, vía elegida, qué fases están aprobadas, cuál está en borrador o por revisar y, si la implementación ha empezado, cuántas tareas hay aprobadas, implementadas y pendientes.
3. Señala lo que espera una decisión de la persona responsable: documentos en `borrador`, huecos en `abierto`, revisiones marcadas `requiere decisión`, preguntas abiertas que bloquean. Señala también las tareas `bloqueada` (con su ID de hueco: `/hueco G<n>`), las revisiones `requiere decisión` (`/hueco TA<n>`), los cambios sin commit o los stash que dejó una ejecución interrumpida, los commits locales sin publicar (`git push`) y los `ERROR` y `AVISO` del validador, agrupados por fichero (si no se puede ejecutar, dilo y sigue).
4. Di cuál es el siguiente paso y con qué comando se lanza.
