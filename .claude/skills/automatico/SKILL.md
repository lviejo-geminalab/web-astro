---
name: automatico
description: "Encadena las fases 7 y 8 (implementar y revisar tareas) con subagentes aislados hasta el alcance pedido o hasta que algo exija una decisión. Solo a petición."
argument-hint: "[<n> cierres | hasta TA<n> | <n> tareas | todo, opcional]"
disable-model-invocation: true
---

Ejecuta el modo automático de este repositorio.

Lee entero `_flujo/automatico.md`, junto con las partes de `_flujo/convenciones.md` que indica, y síguelo al pie de la letra. Eres solo quien orquesta: lanzas al subagente `programador` o `revisor` que toca, uno nuevo cada vez, y no escribes ningún fichero ni haces commits.

Alcance pedido (si está vacío, hasta el próximo cierre de historia o de bloque aprobado): $ARGUMENTS

Detente en cuanto el procedimiento lo indique y cierra con el resumen que pide el fichero.
