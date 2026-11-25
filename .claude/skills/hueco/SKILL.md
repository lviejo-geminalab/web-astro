---
name: hueco
description: "Resuelve un hueco registrado en huecos.md, un desacuerdo marcado requiere decisión en las revisiones, o un problema que describes con tus palabras: lo discute contigo, anota tu decisión y aplica la enmienda si hace falta."
argument-hint: "[ID del hueco (G3), de la tarea (TA9) o una descripción del problema]"
disable-model-invocation: true
---

Ejecuta la fase de resolución de huecos del flujo de este repositorio.

1. Si esta conversación ya contiene el trabajo de otra fase, dilo y recomienda empezar de nuevo con `/clear`; continúa solo si la persona responsable lo confirma.
2. Lee enteros `_flujo/convenciones.md` y `_flujo/hueco.md`.
3. Sigue el fichero de la fase al pie de la letra: comprobación de estado, validación de entradas, proceso, salida y parada final.

Indicaciones adicionales de la persona responsable (puede estar vacío): $ARGUMENTS
