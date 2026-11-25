# Estados y transiciones

Esta es la referencia única de los estados del flujo y de quién cambia cada uno. No añade reglas: reúne las que ya están en las convenciones y en cada fase. Si algo de aquí contradice un fichero de fase, es un error: corrígelo en el sitio donde lo descubras y avisa. Los nombres de los estados no se traducen (ver «Idioma y vocabulario fijo» en `_flujo/convenciones.md`).

## Fases (`<ciclo>/estado.md`)

El estado vive en la base de datos y se cambia solo con `node _flujo/estado.mjs`; `estado.md` y `_docs/proyecto.md` son copias legibles que el comando regenera. La columna «Quién lo pone» dice quién ejecuta el comando.

| Estado | Qué significa | Quién lo pone | Desde | Notas |
|---|---|---|---|---|
| `pendiente` | la fase no se ha ejecutado | la plantilla `_flujo/plantillas/estado.md` | | estado inicial |
| `hecho` | fase terminada sin aprobación formal | la fase 0 | `pendiente` | solo lo usa la fase 0 |
| `borrador` | el agente ha entregado el documento | el agente de la fase al entregar | `pendiente`, `por revisar`, `aprobado` (al repetir la fase) | las fases 3, 6 y 9 se entregan así y se aprueban después |
| `aprobado` | la persona responsable lo ha validado | `aprobar fase <n>` o `aprobar sdd <nombre> <sdd|tareas>`, que el agente que conversa con ella ejecuta solo tras su «Sí» al selector | `borrador` | los agentes aislados (revisión de arquitectura, verificador, programador, revisor) nunca lo escriben |
| `por revisar` | una fase anterior ha cambiado y este documento puede estar desactualizado | `repetir <fase> --motivo V<n>|G<n>`, que pone la fase en `borrador` y las posteriores en `por revisar` | `aprobado`, `borrador` | las fases posteriores a la repetida |
| `no aplica` | la fase se omite | quien la omite (fase 3 sin cambio de arquitectura; fase 2 en la vía corta) | `pendiente` | |

Las fases 7 y 8 no tienen fila en esta tabla: su avance está en la tabla «Tareas» del mismo fichero y en `revisiones-[nombre].md`.

**Repetir una fase** (ver «Cambios hacia atrás»): la fase repetida vuelve a `borrador` y las posteriores pasan a `por revisar`; se añade una fila al «Historial de cambios hacia atrás» con el motivo (`V<n>` o `G<n>`).

## Tareas (tabla «Tareas» de `<ciclo>/estado.md`)

| Transición | Quién | Cuándo |
|---|---|---|
| (nueva) → `pendiente` | la fase 5 con `tarea alta`; `/hueco` si una enmienda añade una tarea | |
| `pendiente` → `implementada` | programador | con `tarea estado` antes del commit de la tarea, que incluye el `estado.md` regenerado (sin identificador de commit) |
| `cambios necesarios` → `implementada` | programador | al corregir los hallazgos |
| `implementada` → `aprobada` | revisor | revisión sin hallazgos bloqueantes; `--commit <hash>` es obligatorio y lo anota el revisor |
| `implementada` → `cambios necesarios` | revisor | al menos un hallazgo bloqueante |
| `aprobada` → `cambios necesarios` | revisor (cierre con hallazgos bloqueantes) o `/hueco` (camino `corregir código`) | |
| `pendiente`, `implementada`, `cambios necesarios` o `aprobada` → `bloqueada` | programador o revisor | al registrar un hueco; con `hueco abrir --tarea`; la nota lleva el ID `G<n>` |
| `bloqueada` → `pendiente` | `/hueco` | al resolver el hueco, si la tarea no tiene código |
| `bloqueada` → `cambios necesarios` | `/hueco` | al resolver el hueco, si el código existente hay que ajustar |
| `bloqueada` → `aprobada` | `/hueco` | al resolver el hueco, si la tarea ya estaba aprobada y su código no cambia (por ejemplo, el hueco era solo de documentación) |

`por revisar` no es un estado de tarea. El programador solo escribe `implementada` y `bloqueada`; `aprobada` y `cambios necesarios` los escribe el revisor (salvo el caso de `/hueco` indicado).

## Huecos (`<ciclo>/huecos.md`)

| Transición | Quién | Cuándo |
|---|---|---|
| (nuevo) → `abierto` | programador, revisor o persona responsable (con `/hueco` y una descripción) | con `hueco abrir`; el ID `G` sale del contador y se sube en el mismo momento |
| `abierto` → `resuelto` | `/hueco` | Un detalle `menor` no se registra aquí, va al mensaje del commit de la tarea. `Camino: enmienda`: al aplicar la enmienda. `repetir fases` y `corregir código`: cuando las fases se han repetido o la tarea corregido (cierre del hueco). |

Mientras un hueco está `abierto`, su tarea figura como `bloqueada`.

## Ciclos (`_docs/proyecto.md`)

| Estado | Quién lo pone | Cuándo |
|---|---|---|
| `previsto` | el brief (hoja de ruta) o el cierre, con `ciclo prever` | al recoger lo pendiente |
| `abierto` | el kickoff (primer ciclo) o `_flujo/ciclo-nuevo.md`, con `ciclo abrir` | al abrir; solo puede haber uno |
| `cerrado` | fase 9, con `aprobar fase 9` | al aprobar el cierre, en el mismo commit; pone también `Ciclo activo: ninguno` |
| `descartado` | la persona responsable, con `ciclo descartar` | en cualquier momento |
