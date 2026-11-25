# Fase 6: Verificación

Lee primero `_flujo/convenciones.md`.

## Objetivo

Comprobar, antes de que empiece la implementación, que el conjunto de documentos es coherente, completo y suficiente. Esta fase la ejecuta un agente que no ha participado en ninguna de las anteriores: tu valor está en leer los documentos exactamente como los leerán el programador y el revisor, sin ningún contexto adicional, y encontrar los puntos donde tendrían que adivinar.

No confíes en que algo está bien porque fue aprobado. La aprobación de cada fase se hizo mirando un documento; tú miras cómo encajan todos.

## Entradas

Todos deben estar `aprobado`:

- `<ciclo>/brief.md`
- `<ciclo>/historias.md` (no existe en la vía corta)
- `_docs/arquitectura.md` (fase 3 en `aprobado` o `no aplica`) y, si existe, `<ciclo>/revision-arquitectura.md`
- `<ciclo>/sdd-[nombre].md` y `<ciclo>/sdd-indice.md` si existe
- `<ciclo>/tareas-[nombre].md`, con los tests de cada tarea
- `_docs/sistema.md` y el repositorio, a partir del segundo ciclo.

## Proceso

Antes de las comprobaciones, ejecuta `node _flujo/validar.mjs` (solo lectura; valida el ciclo activo). Detecta de forma mecánica referencias que no existen, estados fuera del vocabulario, la vía y la fase 2, tests sin tarea, criterios sin fila en la matriz de cobertura, fichas con más de seis archivos (`R-TAR-08`), rutas y scripts de `npm` citados que no existen (`R-RUT-01`, `R-RUT-02`), tests existentes afectados que el SDD o `aprobaciones.md` no declaran (`R-EXI-01`, `R-EXI-02`) y secciones de las convenciones que ninguna fase encuentra (`R-REF-01`). Cada `ERROR` es un hallazgo: cítalo con su código (`R-TES-02`, por ejemplo) y decide tú su gravedad. Los `AVISO` solo son hallazgos si revelan un problema real. El validador no sustituye a las nueve comprobaciones: no juzga el contenido, y que no dé ningún problema no prueba que los documentos sean coherentes. Si no puedes ejecutarlo (por ejemplo, sin `node`), dilo en la sección 5 de la salida y sigue.

Haz las comprobaciones en este orden. Verifica cada una por ti mismo, recorriendo los documentos; no te fíes de las matrices de cobertura que ya contienen.

1. **Trazabilidad hacia delante.** Para cada historia y requisito: ¿todos sus criterios están en un SDD? ¿Cada criterio tiene al menos un test?

2. **Trazabilidad hacia atrás.** Para cada tarea, test y elemento de diseño: ¿responde a un criterio? Señala todo lo huérfano: es trabajo que nadie pidió.

3. **Fidelidad.** Sigue varios criterios desde la historia hasta la tarea y comprueba que dicen lo mismo en cada documento. Busca en especial valores que cambian por el camino (un límite de 30 minutos que en el test son 60), criterios que se han suavizado y condiciones de error que han desaparecido.

4. **Contradicciones.** Entre documentos y dentro de cada uno: arquitectura frente a SDD y tareas (artefactos, stack, comunicación, estructura del repositorio), contratos del SDD frente a resultados esperados de los tests, no-objetivos frente a tareas, dependencias entre SDD. A partir del segundo ciclo, también frente a lo existente: todo cambio de comportamiento ya entregado debe estar declarado en los tres sitios (criterio marcado `sustituye a`, sección "Impacto en lo existente" del SDD y "Tests existentes afectados" del plan), y ningún test existente figura como afectado sin un criterio que lo justifique.

5. **Lectura como programador.** Recorre todas las tareas, una a una; si son muchas, no tomes una muestra: cada hueco que encuentres aquí cuesta una fracción de lo que costará durante la implementación. Para cada una, con solo el SDD y la tarea con sus tests: ¿sabrías qué archivos tocar, qué test escribir y qué valor exacto esperar? Anota cada punto donde tendrías que decidir algo que el documento no dice.

6. **Lectura como revisor.** Para cada tarea: ¿podrías decidir si un diff la cumple "ni más ni menos"? ¿Está claro qué queda fuera?

7. **Atomicidad y orden.** ¿Alguna tarea usa "y", mezcla refactor con comportamiento o carece de comportamiento verificable? ¿Alguna toca más de unos seis archivos, supera la orientación de 150 líneas o crea archivos que solo usa una tarea posterior, aunque su ficha lo justifique? El validador ya cuenta los archivos de cada ficha: tú juzga si la tarea es atómica aunque no llegue a seis. Recorre el orden: ¿alguna tarea necesita algo que se crea después? En el primer ciclo, ¿la tarea de andamiaje crea el comando único y el workflow de integración continua tal como los define `_docs/arquitectura.md`?

8. **Contraste con el repositorio.** ¿Existen las funciones y los comandos citados? (el validador ya comprueba las rutas del contexto técnico y los scripts de `npm`; tú, el resto). ¿El diseño respeta las convenciones reales del código? A partir del segundo ciclo, comprueba además con el código real, no con lo que dicen los documentos:
   - **Tests existentes afectados.** Busca en los tests ya escritos los localizadores y aserciones genéricos (por ejemplo `locator('header')`, `getByRole`, un selector de etiqueta, un recuento de elementos) y compáralos con lo que el diseño añade o cambia. Si hay un test que el diseño rompería y la sección «Tests existentes afectados» no lo declara, es un hallazgo, aunque diga «ninguno».
   - **Rojos previos.** Un test que el plan o una ficha afirma que falla antes de la tarea solo vale si se puede demostrar leyendo el código actual (qué clase, regla o elemento falta hoy). No aceptes un rojo que venga de una reproducción aparte o de una simulación: comprueba si el comportamiento ya lo da algo heredado o presente (un estilo del contenedor, un valor por defecto). Si el test ya pasaría, no es un hallazgo: el programador lo demostrará al implementar (`_flujo/07-programador.md`) y la ficha no tiene que declararlo.

9. **Supuestos pendientes.** Reúne los supuestos y preguntas abiertas de todos los documentos, y los hallazgos de `<ciclo>/revision-arquitectura.md` que sigan sin resolver ni estén asumidos expresamente. Señala los que, de resultar falsos, invalidarían parte del trabajo: deben resolverse antes de implementar.

## Salida

`<ciclo>/verificacion.md`, con la cabecera de las convenciones y este contenido:

1. **Veredicto**: `listo para implementar` o `requiere cambios`.
2. **Hallazgos**: cada uno con su propia ficha, un encabezado `### V<n>: <título>` y estas etiquetas (nunca solo como fila de una tabla, aunque otra tabla los resuma):
   - `Gravedad:` `bloqueante` (el programador implementaría algo incorrecto o tendría que adivinar algo importante), `importante` (riesgo real, pero acotado) o `menor`.
   - `Dónde:` documento, sección e IDs afectados.
   - `Qué ocurre:` con la cita o el dato que lo demuestra.
   - `Fase que hay que repetir:` la fase que lo corrige, o `ninguna`.
   - `Decisión:` `pendiente`. No puedes preguntar: la persona responsable la cambia después, en la conversación principal, por `aceptado`, `repetir fase` o `resuelto`.

   Los IDs `V` los da `node _flujo/estado.mjs siguiente V --cantidad <n>`: continúan la numeración de las ejecuciones anteriores y nunca se reutilizan.
3. **Fases a repetir**: lista ordenada, de la más temprana a la más tardía, con lo que debe corregir cada una.
4. **Supuestos que hay que confirmar antes de implementar**.
5. **Qué se ha comprobado**: qué criterios y tareas seguiste de extremo a extremo, para que quien lea sepa el alcance real de la verificación, y el resultado del validador (errores y avisos, o por qué no pudiste ejecutarlo).
6. **Historial de ejecuciones**: un encabezado `## Historial de ejecuciones` y debajo una tabla con una fila por ejecución, de la primera a la actual:

   ```
   | Nº | Fecha | Veredicto | Hallazgos nuevos | Motivo |
   |---|---|---|---|---|
   | 1 | 2026-11-19 | requiere cambios | V1 a V5 | primera ejecución |
   | 2 | 2026-11-20 | listo para implementar | | tras repetir las fases 4 y 5 |
   ```

   Si ya existe `verificacion.md` de una ejecución anterior, conserva sus filas y añade la tuya al final; no las borres ni las reescribas. La fecha es la de hoy y el veredicto de la fila es el de la sección 1.

Una ejecución nueva reescribe las secciones 1 a 5 con lo que vale ahora y conserva el historial (sección 6) y los hallazgos ya decididos con su `Decisión:`.

**Cuándo hay una ejecución nueva.** Solo si cambió algún documento de las fases 1 a 5 desde la ejecución anterior. Localízalo con el último commit `docs: fase 6 verificación` (`git log --grep '^docs: fase 6'`) y `git diff <commit> -- <ciclo> _docs/arquitectura.md`. Entonces la ejecución es incremental: revisa lo que cambió, lo que depende de ello por sus IDs y el estado de los hallazgos anteriores, y anota en el historial qué documentos cambiaron. Si solo cambian las decisiones de la persona responsable sobre los hallazgos, no hay ejecución nueva (ver «Después de la verificación»).

Informa solo de problemas que afecten a la corrección, la completitud o la capacidad de implementar y revisar. Sin observaciones de estilo o redacción, salvo que la redacción cause ambigüedad.

Si no encuentras nada bloqueante ni importante, dilo así y no busques hallazgos de relleno.

## Publicar

Pon la fase 6 en `borrador` con `node _flujo/estado.mjs fase 6 borrador --quien "verificador"` (si es una ejecución nueva tras cambios, la fase ya vuelve a `borrador` con `repetir 6 --motivo V<n>`, que haces antes de escribir), haz commit con el mensaje `docs: fase 6 verificación` y ejecuta `git push`. No pidas la aprobación: no puedes preguntar. La persona responsable aprueba después, en la conversación principal.

## Después de la verificación

Lo hace la conversación principal, no el agente que verifica.

- Si el veredicto es `listo para implementar`, la conversación principal le pregunta a la persona responsable con el selector Sí/No («¿Apruebas la verificación?») y, con el Sí, aprueba el informe según "Aprobar y publicar" de las convenciones. Si prefiere escribir «apruebo la verificación», vale igual.
- Si es `requiere cambios` y los documentos de las fases anteriores no han cambiado desde el informe, solo faltan las decisiones de la persona: la conversación principal las anota y no se lanza otra ejecución. El veredicto pasa a `listo para implementar`, con su sí, cuando no queda ningún hallazgo `bloqueante` ni `importante` con `Decisión: pendiente`.
- Si es `requiere cambios`, no se aprueba hasta entonces. La persona responde de una en una las preguntas abiertas del informe y los supuestos a confirmar; en las que sean una decisión de peso, la conversación ofrece el asesor como indica "Pregunta poco y bien". Las respuestas se anotan en `<ciclo>/verificacion.md`, en una sección "Decisiones de la persona responsable" y en la etiqueta `Decisión:` del hallazgo (`aceptado`, `repetir fase` o `resuelto`), con el commit `docs: fase 6 verificación (decisiones)` y `git push`. Después se repiten las fases que indica el informe, cada una en su conversación y según "Cambios hacia atrás" de las convenciones, y se vuelve a ejecutar la fase 6 (incremental: ver «Cuándo hay una ejecución nueva»). No se implementa hasta que el veredicto sea `listo para implementar` y esté aprobado.
- Los hallazgos `menor` pueden dejarse sin repetir fases si la persona lo decide: se anotan en la decisión de la persona y se resuelven con una enmienda si el programador los encuentra. Pregunta siempre, en una pregunta propia, si se repiten las fases por los `menor` o se dejan, y anota la respuesta; no lo des por hecho.
- Al terminar las decisiones, añade tu entrada a `<ciclo>/aprobaciones.md` (hallazgos aceptados como riesgo, supuestos confirmados y fases repetidas, con enlace al informe: no lo copies; ver «Aprobaciones y atención especial» en las convenciones) y da la lista ordenada de lo que sigue, según "Al terminar, di cómo se continúa" de las convenciones: por cada fase que hay que repetir, el comando, qué hallazgos aplica y la frase que la persona debe pegar (por ejemplo `/tareas web` y «aplica V1 y V2 de `verificacion.md`»), y al final la nueva verificación. Si queda algo que solo la persona puede comprobar (un ajuste del repositorio, por ejemplo), dilo al principio.

## Terminado cuando

- Las nueve comprobaciones están hechas y la sección 5 dice sobre qué.
- Cada hallazgo es verificable por quien lo lea: indica dónde está y qué lo demuestra.
- El veredicto se sigue de los hallazgos: cualquier bloqueante implica `requiere cambios`.

## Fuera de esta fase

- Corregir los documentos. Tu salida es el informe; las correcciones se hacen repitiendo la fase correspondiente, según la regla de cambios hacia atrás de las convenciones.
- Proponer rediseños o mejoras que no respondan a un problema concreto.
- Opinar sobre si la idea merece la pena o el alcance es el adecuado: eso se decidió en la fase 1.
