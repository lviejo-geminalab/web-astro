---
name: verificar
description: "Fase 6 del flujo. Verifica en un subagente aislado que toda la documentación es coherente y suficiente antes de implementar."
disable-model-invocation: true
context: fork
agent: verificador
background: false
---

Ejecuta la fase 6 del flujo de este repositorio.

Lee entero `_flujo/06-verificacion.md`, junto con las partes de `_flujo/convenciones.md` que indica, y síguelo al pie de la letra.

Qué hay que tratar en esta ejecución (si está vacío, elígelo como indica la sección "Antes de empezar" del fichero de la fase): $ARGUMENTS

Tu respuesta final es el resumen que pide el fichero de la fase. Si el procedimiento te manda detenerte, termina y devuelve la explicación del problema.
