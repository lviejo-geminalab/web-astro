# Modo automático: fases 7 y 8 encadenadas

Lee primero `_flujo/07-programador.md` y `_flujo/08-revisor.md` (solo "Objetivo", "Antes de empezar" y "Salida") y la sección "Forma del mensaje final" de `_flujo/convenciones.md`.

## Objetivo

Encadenar la implementación y la revisión de las tareas del plan, sin que la persona responsable tenga que lanzar a mano cada `/implementar` y cada `/revisar`, hasta el próximo cierre de historia o de bloque de requisitos, o hasta que algo exija su decisión. Es una comodidad opcional: solo se usa cuando la persona la pide, y no cambia ninguna regla de las fases 7 y 8.

**No es una fase.** No produce ningún documento, no aprueba nada y no sustituye a ningún agente. Quien orquesta no programa, no revisa y no decide: solo lanza al agente que toca y lee el resultado.

**Lo que no cambia:** el programador y el revisor siguen siendo agentes aislados, cada uno en su propio contexto, y el revisor sigue siendo quien pone `aprobada`. La fase 9 sigue necesitando la aprobación explícita de la persona.

## Entradas

- El alcance que pide la persona (ver "Alcance").
- `_docs/proyecto.md`, `<ciclo>/estado.md`, `<ciclo>/verificacion.md`; la tabla «Tareas» está en `estado.md`.

## Antes de empezar

1. Comprueba que la fase 6 está en `aprobado` en `<ciclo>/estado.md` y que `<ciclo>/verificacion.md` dice `listo para implementar`. Si no, detente, di qué falta y recomienda `/estado`.
2. Comprueba que no hay tareas `bloqueada` ni revisiones con la nota `requiere decisión` que impidan avanzar. Si las hay, detente y di el comando que sigue (`/hueco G<n>` o `/hueco TA<n>`).
3. Anota el alcance pedido y di en una línea qué vas a hacer y hasta dónde.

## Alcance

La unidad natural es el cierre: el modo se detiene cuando la revisión de cierre de una historia (`cierre H<n>`) o de un bloque de requisitos (`cierre TA<n>`) queda aprobada, para que la persona mire lo hecho antes de seguir. La persona puede cambiarlo al lanzar el modo:

- Sin indicación: hasta el próximo cierre aprobado.
- `<n> cierres`: hasta `<n>` cierres aprobados seguidos.
- `hasta TA<n>`: hasta que la tarea `TA<n>` esté `aprobada`.
- `<n> tareas`: hasta `<n>` tareas aprobadas (útil para una prueba corta).
- `todo`: hasta que no queden tareas por aprobar, sin parar en los cierres intermedios.

Si el alcance no se entiende, pregunta una vez antes de empezar.

## Proceso

El procedimiento sigue el último renglón de cada resultado, que por las convenciones es siempre el comando exacto que toca. Repite:

1. **Lanza al agente que toca, nuevo cada vez.** Si el siguiente paso es `/implementar [TA<n>]`, lanza el subagente `programador` con ese argumento; si es `/revisar [argumento]`, lanza el subagente `revisor`. Solo le pasas el argumento. No le cuentas lo que hizo el otro agente ni lo que opinas: cada agente parte de lo escrito en `_docs/` y en el repositorio, y nunca reutilizas un agente anterior.
2. **Lee el resultado.** Toma de su resumen el comando de «Siguiente paso» y comprueba el estado real con `node _flujo/estado.mjs` (la tabla «Tareas» de `<ciclo>/estado.md` es su copia legible) y con `git log`: que la tarea está en el estado que dice (`implementada`, `aprobada`, `cambios necesarios`) y que el commit existe y está subido (`git log --grep "^TA<n>"`). Si el resumen y los ficheros no coinciden, detente.
3. **Informa en una línea** (por ejemplo, `TA93 implementada`, `TA93 aprobada`). No copies el resumen entero del agente: la conversación se llena rápido y el estado ya está en los ficheros.
4. **Decide.** Si el siguiente paso es `/implementar` o `/revisar` y no has llegado al alcance, vuelve al punto 1. En cualquier otro caso, o al llegar al alcance, detente.

## Cuándo te detienes

Siempre, sin intentar resolverlo:

- El siguiente paso no es `/implementar` ni `/revisar`: `/hueco …`, `/cerrar`, `/estado` o cualquier otro.
- Un agente se detiene por una tarea `bloqueada`, una revisión `requiere decisión` o una tercera revisión sin aprobar.
- La suite de partida no está en verde, un `git push` falla o falta un permiso. No vuelvas a intentar la acción por otra vía: di qué falta y el comando para repetir la tarea.
- Un agente termina sin línea de «Siguiente paso», o con un resultado que no se entiende.
- La misma tarea ha vuelto a `cambios necesarios` tres veces seguidas en esta tanda.
- Has alcanzado el alcance pedido, que por defecto es un cierre de historia o de bloque aprobado.

## Qué no haces

- No escribes ni modificas ningún fichero, no haces commits ni `git push`: lo hacen los agentes.
- No cambias ningún estado ni respondes tú a lo que un agente pregunta o a un hueco.
- No ejecutas `/hueco`, `/cerrar` ni ninguna otra fase.
- No saltas ni reordenas tareas, ni cambias el orden que decide el programador.

## Salida

Cuando te detengas, un resumen corto con la forma de «Forma del mensaje final» de las convenciones:

```
## Modo automático detenido
Tareas aprobadas en esta tanda: TA92, TA93, TA94. Motivo de la parada: cierre de H1 aprobado.

**Decisiones menores del programador:** TA93: el límite se redondea hacia abajo.

**Pendientes:** TA95 a TA134 (40 tareas).

**Siguiente paso:** `/clear` y `/implementar TA95`
```

- Las decisiones menores del programador son las de las líneas «Decisiones menores del programador» de las revisiones de la tanda; si no hay ninguna, no escribas la línea.
- El motivo es una frase: el cierre aprobado u otro alcance cumplido, o el problema concreto y dónde queda registrado.
- Si no queda ninguna tarea por aprobar y las revisiones de cierre están aprobadas, el siguiente paso es `/clear` y `/cerrar`. No lo ejecutes tú: la fase 9 parte de una conversación limpia, solo de lo escrito en `_docs/`, y la aprueba la persona responsable.
- Si te has detenido por un problema, el siguiente paso es el que dio el agente (`/hueco G<n>`, `/hueco TA<n>` o repetir la tarea), nunca uno inventado por ti.

## Terminado cuando

- Se ha alcanzado el alcance pedido o ha ocurrido una de las paradas, y la persona sabe cuál y qué comando sigue.
- No se ha modificado ningún fichero desde esta conversación.
