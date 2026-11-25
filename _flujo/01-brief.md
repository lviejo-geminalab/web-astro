# Fase 1: Brief

Lee primero `_flujo/convenciones.md`.

## Objetivo

Convertir una idea en bruto en un brief de una página que fije qué problema se resuelve, para quién, y cuál es la versión más pequeña que aporta valor. El brief habla solo de este ciclo: lo que quede fuera se anota en la hoja de ruta de `_docs/proyecto.md`, no aquí. Un error de alcance aquí se multiplica en todas las fases siguientes, así que esta es la fase donde más conviene preguntar.

## Entradas

- La idea del ciclo: `<ciclo>/idea.md`.
- `_docs/sistema.md` y el repositorio, a partir del segundo ciclo: lo que el sistema ya hace.
- Lo que la persona responsable añada en esta conversación.

La idea no pasa por aprobación formal. Comprueba en `<ciclo>/estado.md` que la fase 0 figura como `hecho`; si no, o si la idea sigue siendo una plantilla sin rellenar, di que falta abrir el ciclo y detente.

## Proceso

1. **Lee la idea.** Separa lo que está decidido, lo que está sin definir y las dudas que la persona responsable dejó anotadas. A partir del segundo ciclo, sitúala sobre `_docs/sistema.md`: qué se añade, qué cambia de lo que ya existe y qué debe quedar intacto.

2. **Aclara.** Haz como máximo 7 preguntas, de una en una (ver "Pregunta poco y bien" en las convenciones), solo las que cambiarían el alcance o el diseño:
   - Quién lo va a usar y en qué situación.
   - Qué problema concreto resuelve y cómo se resuelve hoy.
   - Qué es lo mínimo que tendría que hacer para ser útil.
   - Qué queda expresamente fuera.
   - Qué restricciones hay: plazos, tecnología, compatibilidad, datos, seguridad.
   - Cómo se sabrá que ha funcionado.

   No preguntes lo que la idea ya responde ni lo que puedas decidir tú razonablemente. Las dudas que recoge la idea son un buen punto de partida para tus preguntas. Espera cada respuesta antes de formular la siguiente, y no sigas con el brief hasta haber terminado las preguntas.

3. **Recorta.** Reduce la idea a la versión más pequeña que sea útil por sí sola. Si dudas de si algo entra, déjalo fuera y dilo.

   Si lo recortado es mucho, agrúpalo en ciclos previstos: bloques que aporten valor por sí solos, en el orden en que tendría sentido hacerlos, cada uno descrito en una línea y, si importa, con su motivo. Ten en cuenta las etapas que la persona responsable haya anotado en la idea. No los detalles más: se concretarán cuando se abran, con lo aprendido hasta entonces. Los ciclos previstos son la única hoja de ruta y viven en la hoja de ruta de `_docs/proyecto.md`, como filas `previsto` a continuación del ciclo activo, sin número ni carpeta y con este brief como origen. Se registran con `node _flujo/estado.mjs ciclo prever --objetivo "<una línea>" --origen brief --quien "agente de la fase 1"`, uno por uno y en orden (el comando regenera la tabla; no la edites a mano). Si la hoja de ruta ya tenía ciclos previstos, puedes proponer reordenarlos, corregirlos o descartarlos, explicando por qué en «Decisiones y supuestos»; solo si la persona responsable lo acepta en esta conversación, se aplica con `ciclo mover`, `ciclo editar` o `ciclo descartar` y `--quien persona`. El brief no menciona futuribles.

4. **Propón la vía.** Indica si el trabajo justifica el flujo completo o la vía corta descrita en las convenciones, comprobando sus tres condiciones. Regístrala con `node _flujo/estado.mjs ciclo via <completa|corta> --quien "agente de la fase 1"` (el comando escribe la línea `Vía:` de `<ciclo>/estado.md`, que es el único sitio donde se anota). En la vía corta, marca además la fase 2 con `node _flujo/estado.mjs fase 2 "no aplica" --quien "agente de la fase 1"`; el porqué va a «Decisiones y supuestos» del brief. Al aprobar el brief, la persona responsable aprueba también la vía; si prefiere la otra, se cambia con el mismo comando. Si elige la corta con una condición incumplida, anota el riesgo en «Decisiones y supuestos».

5. **Escribe el brief** y, si no existe, crea `<ciclo>/aprobaciones.md` a partir de `_flujo/plantillas/aprobaciones.md`.

## Salida

`<ciclo>/brief.md`, de una página como máximo, con la cabecera y las secciones finales que marcan las convenciones, y estas seis secciones:

1. **Problema**: qué ocurre hoy y por qué es un problema, en 2-4 frases.
2. **Usuarios**: quién lo usa y en qué situación.
3. **Resultado esperado**: qué podrá hacer el usuario cuando esté terminado y cómo se sabrá que ha funcionado.
4. **Alcance del ciclo**: lista de capacidades, en lenguaje de usuario.
5. **No-objetivos**: lo que no se va a construir ni tocar. A partir del segundo ciclo, incluye el comportamiento existente que debe quedar intacto.
6. **Restricciones técnicas**: lo que la persona responsable ya tiene decidido o impuesto: plataforma, lenguajes, integraciones, plazos, coste. No elijas stack ni arquitectura: se deciden en la fase 3. A partir del segundo ciclo, parte de `_docs/arquitectura.md` y `_docs/sistema.md` e indica expresamente si este ciclo necesita cambiar la arquitectura (por ejemplo, un artefacto nuevo) o no; de eso depende que la fase 3 se ejecute.
En la vía corta, añade además una sección **Requisitos**, con IDs `R` (los da `node _flujo/estado.mjs siguiente R --cantidad <n>`) y criterios de aceptación en formato Dado/Cuando/Entonces con datos concretos, porque no habrá fase de historias.

Al entregar, pon la fase 1 en `borrador` con `node _flujo/estado.mjs fase 1 borrador --quien "agente de la fase 1"` y añade tu entrada a `<ciclo>/aprobaciones.md` con los requisitos o criterios que has añadido tú y los supuestos sin confirmar (ver «Aprobaciones y atención especial» en las convenciones).

## Terminado cuando

- Alguien que no conoce la idea puede explicar, tras leer el brief, qué se va a construir y qué no.
- Si hay ciclos previstos, están en la tabla de `_docs/proyecto.md`, cada uno se entiende en una línea y aporta valor por sí solo.
- El alcance del ciclo cabe en una lista corta y cada elemento aporta valor.
- Las restricciones técnicas conocidas están anotadas y, a partir del segundo ciclo, queda dicho si la arquitectura cambia.
- Las respuestas a tus preguntas están reflejadas en el documento, no solo en la conversación.

## Fuera de esta fase

- Elegir stack, plataforma o arquitectura (fase 3).
- Historias de usuario detalladas y criterios de aceptación (fase 2), salvo en la vía corta.
- Decisiones de diseño: componentes, esquemas, endpoints (fase 4).
- Tests y tareas (fase 5).
