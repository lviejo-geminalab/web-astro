---
name: asesor
description: "Segunda opinión antes de decidir. Clasifica un problema o un hueco, compara las opciones con su impacto y contrasta la recomendación, en un subagente aislado y de solo lectura."
argument-hint: "[descripción del problema, o ID de hueco (G3)]"
disable-model-invocation: true
context: fork
agent: asesor
background: false
---

Ejecuta el asesor de decisiones de este repositorio.

Lee entero `_flujo/asesor.md`, junto con las partes de `_flujo/convenciones.md` que indica, y síguelo al pie de la letra.

Qué hay que tratar en esta ejecución: $ARGUMENTS

Tu respuesta final es la que pide el fichero. No modifiques ningún fichero.

La conversación principal que recibe esta respuesta la entrega tal cual: no añade recomendaciones propias ni supone lo que quiere la persona. Si la persona aporta datos nuevos, se vuelve a lanzar `/asesor`.
