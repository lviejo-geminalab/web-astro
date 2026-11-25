---
name: revisar
description: "Fase 8 del flujo. Revisa en un subagente aislado el commit de una tarea o el cierre de una historia."
argument-hint: "[ID de tarea | cierre H<n> | cierre TA<n>, opcional]"
disable-model-invocation: true
context: fork
agent: revisor
background: false
---

Ejecuta la fase 8 del flujo de este repositorio.

Lee entero `_flujo/08-revisor.md`, junto con las partes de `_flujo/convenciones.md` que indica, y síguelo al pie de la letra.

Qué hay que tratar en esta ejecución (si está vacío, elígelo como indica la sección "Antes de empezar" del fichero de la fase): $ARGUMENTS

Tu respuesta final es el resumen que pide el fichero de la fase. Si el procedimiento te manda detenerte, termina y devuelve la explicación del problema.
