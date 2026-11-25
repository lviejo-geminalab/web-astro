# Comando de estado del flujo (`_flujo/estado.mjs`)

<!-- Generado con `node _flujo/estado.mjs ayuda --markdown`. No lo edites a mano: cámbialo en las órdenes de `_flujo/estado.mjs`. -->

La base de datos es la fuente de verdad del estado; los documentos de `_docs/` lo son del contenido. Este comando es lo único que escribe estado. Cada orden hace todo su cambio en una transacción, apunta el historial y devuelve un mensaje (con `--json`, un objeto `{ ok, mensaje, … }`).

Opciones comunes: `--quien` (obligatoria al cambiar estado), `--proyecto`, `--ruta`, `--json`. Códigos de salida: 0 hecho, 2 uso incorrecto, 3 transición no permitida, 4 base ausente, ajena o de otra versión.

### `proyecto iniciar`

- **Uso:** `proyecto iniciar --nombre <nombre> [--url <url>] [--repo <nombre>] --quien <quién>`
- **Dónde del flujo:** Fase 0 · /kickoff
- **Quién:** persona o agente de la fase 0
- **Qué hace:** Crea la base si no existe, el proyecto, su repositorio principal y los seis contadores (H, R, T, TA, G, V) a 1. No abre ningún ciclo: eso es `ciclo abrir`.

### `ciclo prever`

- **Uso:** `ciclo prever --objetivo <texto> --origen <de dónde viene> --quien <quién>`
- **Dónde del flujo:** Fase 1 · /brief y fase 9 · /cerrar (hoja de ruta)
- **Quién:** persona o agente de la fase 1 o 9
- **Qué hace:** Añade al final de la hoja de ruta un ciclo `previsto`, sin número ni carpeta todavía.

### `ciclo abrir`

- **Uso:** `ciclo abrir --nombre <nombre-corto> --objetivo <texto> [--origen <de dónde viene>] [--desde <posición del previsto>] --quien <quién>`
- **Dónde del flujo:** Fase 0 · /kickoff y /ciclo
- **Quién:** persona o agente de la fase 0
- **Qué hace:** Abre un ciclo: le da el número siguiente y la carpeta `_docs/ciclos/NN-nombre`, crea sus ocho filas de fase (la 0 en `hecho`, el resto en `pendiente`) y lo coloca en la hoja de ruta a continuación del último ciclo que no es previsto. Con `--desde` completa un ciclo previsto en lugar de crear uno nuevo. Solo puede haber un ciclo abierto.

### `ciclo via`

- **Uso:** `ciclo via <completa|corta> --quien <quién>`
- **Dónde del flujo:** Fase 1 · /brief
- **Quién:** persona o agente de la fase 1
- **Qué hace:** Anota la vía del ciclo abierto. No cambia ninguna fase: las fases 2 y 3 se omiten con `fase <n> "no aplica"`.

### `ciclo editar`

- **Uso:** `ciclo editar <posición> [--objetivo <texto>] [--origen <texto>] --quien <quién>`
- **Dónde del flujo:** Hoja de ruta (en cualquier momento)
- **Quién:** persona
- **Qué hace:** Cambia el objetivo o el origen de un ciclo `previsto`. Los ciclos abiertos, cerrados y descartados no se reescriben.

### `ciclo mover`

- **Uso:** `ciclo mover <posición> --a <nueva posición> --quien <quién>`
- **Dónde del flujo:** Hoja de ruta (en cualquier momento)
- **Quién:** persona
- **Qué hace:** Reordena la hoja de ruta: mueve un ciclo `previsto` a otra posición. Los ciclos que ya no son previstos siempre van delante.

### `ciclo descartar`

- **Uso:** `ciclo descartar <posición> --quien persona`
- **Dónde del flujo:** En cualquier momento
- **Quién:** persona
- **Qué hace:** Pasa un ciclo `previsto` o `abierto` a `descartado`. Un ciclo cerrado no se descarta.

### `fase`

- **Uso:** `fase <0|1|2|3|6|9> <hecho|borrador|"no aplica"> --quien <quién>`
- **Dónde del flujo:** Todas las fases (al entregar su documento o al omitirla)
- **Quién:** agente de la fase o persona
- **Qué hace:** `hecho` solo en la fase 0. `borrador` al entregar el documento de la fase (también al repetirla desde `por revisar` o `aprobado`). `no aplica` al omitirla. `aprobado` y `por revisar` no se piden aquí. Las fases 4 y 5 no se tocan: se calculan desde los SDD.

### `repetir`

- **Uso:** `repetir <fase> --motivo <V<n>|G<n>> --quien <quién>`
- **Dónde del flujo:** Cambios hacia atrás: /hueco (camino «repetir fases») y revisiones de la fase 6
- **Quién:** persona o agente que conversa con ella
- **Qué hace:** Repite una fase: la fase vuelve a `borrador` y todas las posteriores que estaban en `borrador` o `aprobado` pasan a `por revisar`. En las fases 4 y 5 el cambio se hace en cada SDD. Añade una fila con el motivo al «Historial de cambios hacia atrás» de `estado.md`.

### `sdd alta`

- **Uso:** `sdd alta --nombre <nombre> --orden <n> --quien <quién>`
- **Dónde del flujo:** Fase 4 · /sdd
- **Quién:** agente de la fase 4
- **Qué hace:** Da de alta un SDD del ciclo con su orden de implementación (1 si solo hay uno). Nace con el SDD y sus tareas en `pendiente`.

### `sdd estado`

- **Uso:** `sdd estado <nombre> <sdd|tareas> <borrador|"no aplica"> --quien <quién>`
- **Dónde del flujo:** Fase 4 · /sdd y fase 5 · /tareas
- **Quién:** agente de la fase 4 o 5
- **Qué hace:** `sdd` cambia el estado del SDD (fase 4); `tareas`, el de su plan de tareas (fase 5). Después recalcula las filas 4 y 5 de `fase`, que resumen todos los SDD. `aprobado` no se pide aquí.

### `tarea alta`

- **Uso:** `tarea alta --sdd <nombre> --titulo <texto> --quien <quién>`
- **Dónde del flujo:** Fase 5 · /tareas, y /hueco cuando una enmienda añade una tarea
- **Quién:** agente de la fase 5 o persona con /hueco
- **Qué hace:** Da de alta una tarea en `pendiente` con el siguiente código TA del contador. Devuelve el código.

### `tarea estado`

- **Uso:** `tarea estado <TAn> <implementada|aprobada|"cambios necesarios"> [--commit <hash>] [--notas <texto>] --quien <programador|revisor|persona>`
- **Dónde del flujo:** Fase 7 · /implementar y fase 8 · /revisar (y /hueco para `aprobada` → `cambios necesarios`)
- **Quién:** programador, revisor o persona, según la transición
- **Qué hace:** Cambia el estado de una tarea con las transiciones de `estados.md`: el programador pasa a `implementada`; el revisor a `aprobada` (con `--commit`, el hash del commit de la tarea) o a `cambios necesarios`; la persona puede devolver una `aprobada` a `cambios necesarios`. `bloqueada` entra por `hueco abrir` y sale por `hueco resolver`.

### `hueco abrir`

- **Uso:** `hueco abrir --descripcion <texto> [--tarea <TAn>] --quien <quién>`
- **Dónde del flujo:** Fase 7, fase 8 y /hueco
- **Quién:** programador, revisor o persona
- **Qué hace:** Registra un hueco `abierto` con el siguiente código G del contador. Si se da una tarea, la deja `bloqueada` con una nota que remite al hueco. Devuelve el código.

### `hueco camino`

- **Uso:** `hueco camino <Gn> --camino <enmienda|"repetir fases"|"corregir código"> --quien persona`
- **Dónde del flujo:** /hueco
- **Quién:** persona
- **Qué hace:** Anota el camino que la persona ha elegido para un hueco que sigue `abierto`.

### `hueco resolver`

- **Uso:** `hueco resolver <Gn> --camino <enmienda|"repetir fases"|"corregir código"> [--tarea-a <pendiente|"cambios necesarios"|aprobada>] --quien <quién>`
- **Dónde del flujo:** /hueco
- **Quién:** persona o agente que conversa con ella
- **Qué hace:** Pasa un hueco a `resuelto` con su camino. Si el hueco tiene tarea, `--tarea-a` dice a qué estado sale de `bloqueada`: `pendiente` si no tiene código, `cambios necesarios` si hay que ajustarlo, `aprobada` si estaba aprobada y su código no cambia.

### `aprobar`

- **Uso:** `aprobar fase <1|2|3|6|9>   |   aprobar sdd <nombre> <sdd|tareas>`
- **Dónde del flujo:** Aprobar y publicar (fases 1, 2, 3, 4, 5, 6 y 9), también al aprobar de nuevo una fase repetida
- **Quién:** persona (su sí al selector Sí/No que le hace el agente)
- **Qué hace:** Pasa una fase (o un SDD o su plan de tareas, en las fases 4 y 5) de `borrador` a `aprobado`, anota la aprobación (fecha, vía «aviso de permiso», nombre histórico que se conserva en la base, y el comando exacto) y el historial como `persona`. Debe ser el primer argumento del script. Un plan de tareas solo se aprueba con su SDD ya aprobado. Aprobar la fase 9 cierra además el ciclo y exige todas las tareas `aprobada`, ningún hueco `abierto` y ninguna otra fase pendiente de aprobar o `por revisar`. No admite `--quien`: quien aprueba es siempre la persona.

### `regenerar`

- **Uso:** `regenerar`
- **Dónde del flujo:** Cuando `estado.md` se ha quedado atrás (por ejemplo, tras un código de salida 5) o se ha editado a mano
- **Quién:** cualquiera
- **Qué hace:** No cambia la base: vuelve a escribir en `_docs/proyecto.md` y en el `estado.md` del ciclo abierto lo que dice la base y avisa de lo que no coincidía.

### `siguiente`

- **Uso:** `siguiente <H|R|T|TA|G|V> [--cantidad <n>] --quien <quién>`
- **Dónde del flujo:** Fases 1, 2, 4, 5 y 6 (cualquier identificador nuevo)
- **Quién:** agente de la fase
- **Qué hace:** Entrega el siguiente identificador del contador del proyecto y lo sube. Con `--cantidad` entrega varios seguidos. Los identificadores no se reutilizan nunca.
