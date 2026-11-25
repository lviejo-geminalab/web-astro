---
name: revisar-arquitectura
description: "Fase 3 del flujo. Revisa en un subagente aislado la arquitectura propuesta, antes de aprobarla."
disable-model-invocation: true
context: fork
agent: revisor-arquitectura
background: false
---

Ejecuta la fase 3 del flujo de este repositorio.

Lee entero `_flujo/03-arquitectura-revision.md`, junto con las partes de `_flujo/convenciones.md` que indica, y síguelo al pie de la letra.

Qué hay que tratar en esta ejecución (si está vacío, elígelo como indica la sección "Antes de empezar" del fichero de la fase): $ARGUMENTS

Tu respuesta final es el resumen que pide el fichero de la fase. Si el procedimiento te manda detenerte, termina y devuelve la explicación del problema.
