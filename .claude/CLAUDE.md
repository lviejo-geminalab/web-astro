# Instrucciones del repositorio

Este repositorio se desarrolla con un flujo por fases descrito en `_flujo/`. Cada fase tiene un comando en `.claude/skills/`. Antes de hacer cualquier trabajo, averigua qué fase te corresponde.

## Qué hacer al empezar

1. Si te han invocado con un comando de fase, sigue sus instrucciones.
2. Si no, lee `_docs/proyecto.md` para saber cuál es el ciclo activo y después su `estado.md` (fases y tareas); di en qué punto está el proyecto y cuál sería la fase siguiente, y pregunta antes de ejecutarla. Si `_docs/proyecto.md` no tiene nombre de proyecto, propón empezar con `/kickoff`; si no hay ningún ciclo abierto, propón `/ciclo`.
3. Si te piden escribir código directamente y `<ciclo>/verificacion.md` no existe o no dice `listo para implementar`, avisa de que el flujo no ha llegado a la implementación y pregunta cómo continuar.
4. Si la conversación ya contiene el trabajo de otra fase, avisa de que conviene empezar con `/clear` antes de continuar: cada fase debe partir solo de lo que está escrito en `_docs/`.

## Comandos

| Comando | Fase | Dónde se ejecuta |
|---|---|---|
| `/kickoff` | 0 | conversación principal, una vez por proyecto |
| `/ciclo` | 0 | conversación principal, para abrir cada ciclo posterior al primero |
| `/brief` | 1 | conversación principal |
| `/historias` | 2 | conversación principal |
| `/arquitectura` | 3 | conversación principal |
| `/revisar-arquitectura` | 3 | subagente `revisor-arquitectura`, contexto aislado |
| `/sdd` | 4 | conversación principal |
| `/tareas` | 5 | conversación principal |
| `/verificar` | 6 | subagente `verificador`, contexto aislado |
| `/implementar` | 7 | subagente `programador`, contexto aislado |
| `/revisar` | 8 | subagente `revisor`, contexto aislado |
| `/automatico` | 7-8 | conversación principal, solo a petición de la persona responsable: orquesta los subagentes `programador` y `revisor` hasta el alcance pedido; se detiene antes de `/cerrar` |
| `/cerrar` | 9 | conversación principal |
| `/hueco` | — | conversación principal, cuando hay huecos en `abierto`, una revisión `requiere decisión` o la persona responsable describe un problema |
| `/asesor` | — | subagente `asesor`, contexto aislado, solo lectura; segunda opinión opcional, en cualquier momento |
| `/estado` | — | conversación principal, solo lectura |

## Reglas que valen siempre

- `<ciclo>` es la carpeta del ciclo activo (`_docs/ciclos/NN-nombre`), anotada en `_docs/proyecto.md`.
- Ejecuta una sola fase por conversación, salvo `/automatico`, que encadena las fases 7 y 8 porque cada paso corre en un subagente aislado y quien orquesta no escribe nada. Resolver los hallazgos de la revisión de arquitectura es parte de la fase 3 y puede hacerse en la conversación donde se lanzó.
- Si te piden un comando de fase que no existe o está mal escrito, no lances la fase por tu cuenta ni invoques el subagente directamente (salvo dentro de `/automatico`): dilo, propón el comando correcto y espera.
- Cuando te detengas, termina diciendo qué ha pasado, dónde queda registrado y el comando exacto que sigue (`/estado` si no hay otro).
- No modifiques los ficheros de `_flujo/` salvo que te lo pidan expresamente.
- El estado (fases, SDD, tareas, huecos, ciclos, contadores) se cambia solo con `node _flujo/estado.mjs` (órdenes en `_flujo/estado-comando.md`); `<ciclo>/estado.md` y `_docs/proyecto.md` son copias que el comando regenera: no los edites a mano.
- No apruebes nada por tu cuenta. `node _flujo/estado.mjs aprobar …` solo se ejecuta después de preguntar a la persona responsable con un selector (`AskUserQuestion`: «Sí, aprobar», «No, quiero cambios», «Revisarlo más tarde») y de recibir su «Sí», o de un sí explícito escrito en esta conversación, siguiendo "Aprobar y publicar" de `_flujo/convenciones.md` (aprobar, commit y `git push`). Si eres un agente aislado y no puedes preguntar, nunca lo ejecutes.
- Tras cada commit de fase, publica con `git push`. Si falla, no fuerces nada: dilo.
- No modifiques documentos de fases anteriores a la tuya. Si están mal, detente, explica el problema y di el comando que sigue.
- No modifiques, debilites ni desactives tests para que la suite pase, ni relajes el linter o el análisis de tipos.
- Si falta algo en la especificación, no lo inventes: sigue la sección "Huecos en la especificación" de `_flujo/convenciones.md`.
- Un commit por tarea, con el mensaje `TA<n>: <descripción>`. Las correcciones tras revisión, `TA<n> (corrección): <qué se corrige>`.
- Los commits de documentación de las fases 0 a 6 y 9 llevan el mensaje `docs: fase <n> <nombre>`.
- Escribe siempre en español, con el vocabulario fijo que lista `_flujo/convenciones.md`.

## Contexto del proyecto

Esta plantilla es para proyectos que nacen con ella. La arquitectura del proyecto (artefactos, stack, estructura del repositorio y comando único de tests) está en `_docs/arquitectura.md` desde que se aprueba la fase 3 del primer ciclo; antes no hay stack definido. Todos los artefactos viven en este repositorio. A partir del segundo ciclo, `_docs/sistema.md` describe lo que el sistema ya hace y sus convenciones: léelo antes de trabajar. Los documentos de ciclos cerrados no se modifican.
