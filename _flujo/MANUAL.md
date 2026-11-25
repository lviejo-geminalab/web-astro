# Manual de uso

Cómo se trabaja en un repositorio creado con esta plantilla de flujo SDD + TDD para Claude Code. Está pensada para proyectos que empiezan desde cero.

## Cómo funciona este repositorio

El desarrollo sigue un flujo por fases, de la idea al código. Cada fase lee los documentos de la anterior y produce uno propio que una persona aprueba antes de continuar.

La lista de comandos, con la fase de cada uno, está en `.claude/CLAUDE.md`; este manual solo explica cómo usarlos. Las instrucciones de cada fase están en `_flujo/`; los comandos de `.claude/skills/` solo las lanzan.

## Empezar

1. Clona el repositorio y abre Claude Code en su carpeta, desde el terminal o la aplicación de escritorio. No uses un proyecto de Claude para esto: no carga los comandos ni los agentes del repositorio. Después ejecuta `/kickoff`. Cuéntale tu idea: pondrá nombre y descripción al proyecto en el README, abrirá el primer ciclo y escribirá tu idea en la carpeta de ese ciclo.
2. Revisa `_docs/ciclos/01-[nombre]/idea.md` y corrígelo a mano si hace falta.
3. Ejecuta `/clear` y después `/brief`. Responde a sus preguntas. Al terminar te pregunta si lo apruebas: dile que sí (o pídele cambios) y él ejecuta la orden de aprobar (el entorno te pide permiso: ahí confirmas), hace el commit y lo sube con `git push`.
4. Ejecuta `/clear` y lanza la fase siguiente. Repite hasta `/verificar`.

Las fases 0 a 5 se ejecutan en la conversación principal porque necesitan preguntarte; por eso hay que limpiar el contexto con `/clear` entre una y otra. Si hay varios SDD, pasa el nombre como argumento: `/tareas pagos`.

El agente te hace las preguntas de una en una. Si no puede subir los cambios con `git push`, hace el commit, te lo dice y te da el comando para que lo ejecutes tú.

## Implementar

Cuando `<ciclo>/verificacion.md` diga `listo para implementar`, alterna:

```
/implementar
/revisar
```

Cada uno se ejecuta en un subagente con contexto aislado (`.claude/agents/programador.md` y `revisor.md`), así que no hace falta `/clear` entre ellos. El programador implementa una tarea y termina; el revisor la aprueba o pide cambios. Puedes indicar la tarea (`/implementar TA9`, `/revisar TA9`) o pedir la revisión de cierre de una historia (`/revisar cierre H2`).

Los subagentes no pueden preguntarte durante la ejecución: si encuentran un problema, terminan y te lo devuelven explicado.

### Modo automático

Si no quieres lanzar cada paso a mano, `/automatico` encadena `/implementar` y `/revisar` con subagentes nuevos hasta el próximo cierre de historia o de bloque de requisitos aprobado, para que mires lo hecho antes de seguir. Puedes ampliarlo: `/automatico 2 cierres`, `/automatico hasta TA20`, `/automatico 2 tareas` (para una prueba) o `/automatico todo`. Se detiene solo ante un hueco, una revisión `requiere decisión`, una tercera revisión, una suite en rojo, un `git push` fallido, un permiso que falta o cualquier resultado raro, y siempre antes de `/cerrar`, que sigue siendo una fase aparte con tu aprobación. Quien orquesta no escribe, no hace commits ni decide: el revisor sigue siendo quien aprueba cada tarea. No juzga el aspecto visual: en un ciclo de diseño, mira el resultado en cada cierre. Más en `_flujo/automatico.md`.

### Permisos

Como los subagentes no pueden pedirte permiso mientras trabajan, una acción que requiera aprobación los detiene. `.claude/settings.json` deja permitido lo que el flujo hace en todas las tareas: editar ficheros, los comandos `git` de lectura, `add`, `commit`, `stash` y `push` (los `push` con `--force` o `-f` están denegados) y `echo`. Tampoco permite que un agente edite los ficheros de configuración de permisos.

Falta el comando único de tests, que depende del stack y no se conoce hasta la fase 3. Cuando apruebes `_docs/arquitectura.md`, añade su regla a `.claude/settings.local.json` (personal, fuera de git), por ejemplo:

```json
{ "permissions": { "allow": ["Bash(npm run comprobar *)"] } }
```

Si el comando guarda su salida con `>` en un fichero fuera del repositorio, pedirá aprobación igualmente: usa una ruta dentro del repositorio o la carpeta temporal de la sesión.

### Si una persona implementa una tarea

La fase 7 también puede hacerla una persona; la revisión es la misma. Para que el revisor vea el trabajo como el de cualquier otra tarea:

1. Parte del árbol limpio y de la suite en verde, con el comando único de `_docs/arquitectura.md`.
2. Lee la ficha de la tarea en `<ciclo>/tareas-[nombre].md` y trabaja solo en sus `Archivos`; lo que figure en `Fuera de esta tarea` no se toca.
3. Escribe cada test tal como lo especifica el plan, ejecútalo y comprueba que falla por la razón esperada antes de escribir el código. Solo los tests que la ficha declara en `Pasa sin código nuevo` pueden pasar sin él.
4. Escribe el código mínimo y deja la suite completa (tests, tipos y linter) en verde, sin modificar tests existentes ni relajar reglas.
5. Pon la tarea en `implementada` con `node _flujo/estado.mjs tarea estado TA<n> implementada --quien programador` (sin identificador de commit: lo anota el revisor) y haz un único commit `TA<n>: <descripción>` con tres líneas en el cuerpo: `Plan: <ciclo>/tareas-[nombre].md (TA<n>)`, `Tests: T…` y una frase con lo que hace el commit.
6. Ejecuta `git push`.
7. Si falta algo en la especificación, no lo inventes: regístralo como indica la sección «Huecos en la especificación» de `_flujo/convenciones.md`.
8. Pide la revisión: `/clear` y `/revisar TA<n>`.

## Arquitectura

La arquitectura se decide una vez, en la fase 3 del primer ciclo, después de las historias y antes del diseño. Queda en `_docs/arquitectura.md`: qué artefactos desplegables hay, cómo se comunican, dónde viven los datos, el stack de cada uno, la plataforma y la estructura del repositorio.

- **La revisión es obligatoria antes de aprobar.** Un agente que no ha participado en la decisión la cuestiona y deja sus hallazgos en `<ciclo>/revision-arquitectura.md`. Tú decides con eso delante: corregir, o asumir un riesgo dejándolo anotado.
- **Un solo repositorio.** Todos los artefactos viven aquí, cada uno en su carpeta y con su despliegue, y un comando único ejecuta los tests de todos.
- **Calidad e integración continua.** La arquitectura fija para cada artefacto los tests, el análisis de tipos y el linter, y un comando único que lo ejecuta todo. La primera tarea del proyecto crea el workflow de GitHub Actions que lanza ese comando en cada push y en cada pull request. No tienes que hacer nada más; si quieres que sea obligatorio para fusionar, actívalo en la protección de rama del repositorio.
- **En los ciclos siguientes no se repite**, salvo que el brief del ciclo declare que la arquitectura cambia.
- **Reglas de tu organización.** Si tienes normas propias (servicios aprobados, regiones, nomenclatura), escríbelas en `_flujo/criterios/`; la fase y su revisor las aplican.

## Huecos en la especificación

Por mucho cuidado que se ponga, el programador o el revisor encontrarán cosas que los documentos no dicen. No las inventan: las registran en `<ciclo>/huecos.md` con las opciones que ven y su recomendación, y la tarea queda `bloqueada`. Mientras tanto se puede seguir con otras tareas.

Para resolver uno, ejecuta `/hueco` en una conversación nueva (o `/hueco G3` para uno concreto). Puedes discutirlo todo lo que necesites. Cuando decidas, el agente anota tu decisión, corrige lo justo en el SDD y en la tarea (con sus tests), te enseña los cambios y, cuando confirmas, desbloquea la tarea. No tienes que editar nada a mano, pero tu respuesta tiene que pasar por ahí: lo que se decide solo de palabra no llega a quien implementa ni a quien revisa.

Si descubres algo al usar el sistema, no hace falta que lo registre otro: ejecuta `/hueco` seguido de la descripción (`/hueco el navegador da error por el favicon`) y el agente redacta la entrada, decide el camino y sigue el mismo proceso. Una enmienda puede añadir una tarea nueva. Si lo que ves es un fallo de algo que la especificación sí decía, el camino es corregir el código: sin enmienda, la tarea vuelve a `cambios necesarios` y se corrige con `/implementar`. Una funcionalidad nueva no entra por aquí: va a la hoja de ruta.

Si no sabes por qué camino ir, o quieres una segunda opinión antes de decidir, `/asesor` con la pregunta. Clasifica el problema, compara las opciones con su impacto y argumenta también en contra de su recomendación. Es de solo lectura: no escribe nada y la decisión sigue siendo tuya. Las fases te lo sugerirán ante una decisión de peso; nunca lo lanzan por su cuenta.

Los detalles sin efecto observable no pasan por este proceso: el programador los decide y los anota en el mensaje de su commit. Si un hueco obliga a repetir fases (una contradicción, o algo que toca arquitectura o alcance), el agente te dirá qué fase hay que repetir.

## Ciclos

El kickoff se hace una vez. Después el proyecto avanza por ciclos: cada ciclo es una pasada por las fases 1 a 9 con un objetivo (la primera versión, una funcionalidad nueva, un cambio, una corrección) y tiene su propia carpeta en `_docs/ciclos/`. En las tablas y mensajes, `<ciclo>` es la carpeta del ciclo activo, anotada en `_docs/proyecto.md`.

- **Cerrar un ciclo.** Cuando todas las tareas estén aprobadas, ejecuta `/cerrar` en una conversación nueva. El agente actualiza `_docs/sistema.md`, que describe qué hace el sistema hoy. Revísalo y, si te convence, dile al agente que lo apruebas: él lo registra, marca el ciclo como `cerrado` y lo sube.
- **Abrir el siguiente.** Ejecuta `/ciclo` en una conversación nueva y cuenta qué quieres conseguir. Crea la carpeta del ciclo con su idea. Después sigue con `/brief`, como en el primero.
- **Un ciclo abierto a la vez.** `/ciclo` no abre uno nuevo si el anterior no tiene el cierre aprobado.
- **Hoja de ruta.** Si la idea es grande, el brief la divide: detalla el ciclo actual y deja los siguientes como ciclos previstos, de una línea cada uno, en la hoja de ruta de `_docs/proyecto.md`. Es provisional: reordénala, cámbiala o descarta ciclos cuando quieras, pidiéndoselo al agente (usa `ciclo mover`, `ciclo editar` y `ciclo descartar`; no edites la tabla a mano). `/ciclo` te propone el siguiente previsto, y puedes elegir otro.
- **Lo ya entregado se respeta.** A partir del segundo ciclo, los agentes parten de `_docs/sistema.md` y del código. Un comportamiento existente solo cambia si el ciclo lo declara, y un test existente solo se toca si el plan de tareas del ciclo lo lista y lo justifica.
- **Los ciclos cerrados no se editan.** Si algo de un ciclo anterior estaba mal, se corrige en un ciclo nuevo; para algo pequeño, con la vía corta.

## Reglas para las personas

- **Solo tú apruebas, pero no editas nada.** Los agentes dejan sus documentos en `borrador` y te preguntan. Con tu sí explícito en la conversación, el agente ejecuta `aprobar` (el entorno te pide permiso y ahí confirmas), hace el commit y lo sube; una respuesta ambigua no cuenta. La arquitectura (fase 3) y la verificación (fase 6) se aprueban después de la revisión o del informe: basta decir «apruebo la arquitectura» o «apruebo la verificación» en una conversación. Los agentes de implementación y revisión nunca aprueban documentos.
- **Una conversación por fase.** El contexto limpio es lo que hace fiable cada fase, sobre todo la verificación y la revisión.
- **Los errores se corrigen en su origen.** Si un documento anterior está mal, se repite su fase; no se parchea desde una posterior.
- **Para cambios pequeños, vía corta.** El agente la propone en el brief; está descrita en `_flujo/convenciones.md`.

## Estructura

```
_flujo/            instrucciones de cada fase (no se modifican durante un proyecto)
_docs/             proyecto.md, arquitectura.md, sistema.md y una carpeta por ciclo en ciclos/
.claude/skills/   un comando por fase
.claude/agents/   subagentes verificador, revisor-arquitectura, programador, revisor y asesor
_flujo/MANUAL.md  este manual
.claude/CLAUDE.md instrucciones que Claude Code lee al entrar en el repositorio
.github/workflows/validar-docs.yml   valida la coherencia de _docs/ con _flujo/validar.mjs
```

El código y los tests van donde indique el SDD, según el stack que elijas.
