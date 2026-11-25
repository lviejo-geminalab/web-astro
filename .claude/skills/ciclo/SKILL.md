---
name: ciclo
description: "Fase 0 de un ciclo posterior al primero. Abre un ciclo nuevo: carpeta, nombre e idea del ciclo."
argument-hint: "[idea del ciclo, opcional]"
disable-model-invocation: true
---

Ejecuta la fase 0 del flujo de este repositorio.

1. Si esta conversación ya contiene el trabajo de otra fase, dilo y recomienda empezar de nuevo con `/clear`; continúa solo si la persona responsable lo confirma.
2. Lee enteros `_flujo/convenciones.md` y `_flujo/ciclo-nuevo.md`.
3. Sigue el fichero de la fase al pie de la letra: comprobación de estado, validación de entradas, proceso, salida y parada final.

Indicaciones adicionales de la persona responsable (puede estar vacío): $ARGUMENTS
