---
name: implementar
description: "Fase 7 del flujo. Implementa una tarea del plan mediante TDD en un subagente aislado y la deja en un commit."
argument-hint: "[ID de tarea, opcional]"
disable-model-invocation: true
context: fork
agent: programador
background: false
---

Ejecuta la fase 7 del flujo de este repositorio.

Lee entero `_flujo/07-programador.md`, junto con las partes de `_flujo/convenciones.md` que indica, y síguelo al pie de la letra.

Qué hay que tratar en esta ejecución (si está vacío, elígelo como indica la sección "Antes de empezar" del fichero de la fase): $ARGUMENTS

Tu respuesta final es el resumen que pide el fichero de la fase. Si el procedimiento te manda detenerte, termina y devuelve la explicación del problema.
