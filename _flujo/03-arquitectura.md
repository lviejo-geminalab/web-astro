# Fase 3: Arquitectura

Lee primero `_flujo/convenciones.md`.

## Objetivo

Decidir la arquitectura del proyecto: las decisiones que son caras de cambiar y que afectan a más de un SDD. Qué artefactos desplegables hay, cómo se comunican, dónde viven los datos, con qué tecnología se construye cada uno y cómo se organiza el repositorio.

La arquitectura es del proyecto, no del ciclo. Su documento es `_docs/arquitectura.md`, vive fuera de la carpeta del ciclo y todas las fases posteriores lo toman como marco: los SDD diseñan dentro de él y el programador no puede salirse de él.

Es la decisión más difícil de revertir de todo el flujo. Por eso se toma conversando con la persona responsable y la revisa un agente independiente antes de aprobarse.

## Cuándo se ejecuta

- **En el primer ciclo, siempre.** En un proyecto pequeño el resultado puede ser media página: un único artefacto y su stack.
- **En los ciclos siguientes, solo si el brief declara que el ciclo cambia la arquitectura** (por ejemplo, un artefacto nuevo o un cambio de plataforma). Entonces se actualiza `_docs/arquitectura.md`; no se reescribe desde cero.
- En cualquier otro caso, marca la fase 3 como `no aplica` con `node _flujo/estado.mjs fase 3 "no aplica" --quien "agente de la fase 3"`, dilo y detente.

## Entradas

- `<ciclo>/brief.md` (debe estar `aprobado`): restricciones técnicas y, a partir del segundo ciclo, si la arquitectura cambia.
- `<ciclo>/historias.md` (debe estar `aprobado`): lo que el sistema debe hacer y, sobre todo, los requisitos que no son de usuario. En la vía corta no existe: los requisitos están en el brief.
- `_docs/proyecto.md`: la hoja de ruta, solo como contexto.
- `_docs/arquitectura.md` y `_docs/sistema.md`, si existen.
- Los ficheros de `_flujo/criterios/`, si los hay: reglas de la organización que la arquitectura debe cumplir.
- El repositorio.

## Antes de empezar

Comprueba el estado y valida las entradas según las convenciones. En particular: que los requisitos de rendimiento, seguridad, coste e integración tengan cifras o comportamientos observables. Una arquitectura no se puede justificar contra "debe ser rápido".

## Proceso

1. **Reúne lo que condiciona la decisión.** Requisitos que no son de usuario, restricciones del brief, integraciones con sistemas externos, volumen esperado, y los criterios de `_flujo/criterios/`.

2. **Pregunta lo que falta.** Como máximo 5 preguntas, de una en una (ver "Pregunta poco y bien" en las convenciones), solo las que cambiarían la arquitectura. Suelen ser de este tipo: qué tecnologías conoce quien va a mantenerlo, qué plataforma o suscripciones existen ya, qué límite de coste hay, quién lo va a operar, qué obligaciones legales o de seguridad aplican.

3. **Empieza por lo más simple.** Parte del menor número de artefactos que cumple los requisitos. Cada artefacto, almacén de datos o tecnología adicional debe poder justificarse con un requisito o una restricción concretos, citados por su ID. "Por si acaso" y "es lo habitual" no son justificaciones. Tampoco añadas capas, abstracciones ni dependencias para cambios que no estén en la hoja de ruta: si la persona menciona un cambio posible, anótalo como riesgo o alternativa descartada, no lo diseñes.

4. **Considera alternativas reales.** Para cada decisión estructural (número de artefactos, plataforma, modelo de comunicación, almacenamiento), valora al menos una alternativa que alguien razonable podría haber elegido, y di qué la hace peor aquí.

5. **Mira la hoja de ruta.** No diseñes para los ciclos previstos, pero comprueba que ninguna decisión los impide. Si una decisión barata hoy evita rehacer la arquitectura para un ciclo previsto, dilo y deja que la persona responsable decida.

6. **Define el repositorio.** Todos los artefactos viven en este repositorio, cada uno en su carpeta. Fija la estructura de carpetas.

7. **Define las comprobaciones de calidad.** Para cada artefacto, elige las herramientas de tests, análisis de tipos, linter y formato, y su nivel de exigencia. Ponlo estricto desde el principio: endurecerlo con el código ya escrito cuesta mucho más. Define un comando único, ejecutable desde la raíz, que lance todas las comprobaciones de todos los artefactos: es la comprobación completa, y es lo que este flujo llama "la suite completa". Ese mismo comando lo ejecutará la integración continua en cada push a la rama principal y en cada pull request, de modo que lo que pasa en local pasa también allí.

8. **Comprueba lo específico de la plataforma.** Límites, planes, modelos de precio y capacidades cambian con el tiempo. Si puedes consultar la documentación oficial, verifica las afirmaciones concretas en las que se apoya tu decisión. Lo que no puedas verificar, márcalo como supuesto por confirmar. No fijes versiones exactas de librerías o runtimes salvo que una decisión dependa de ellas: las fija la primera tarea del plan con lo que instale el gestor de paquetes.

9. **Escribe el documento** y enseña a la persona responsable las decisiones principales y sus contrapartidas antes de darlo por entregado.

## Salida

`_docs/arquitectura.md`, con la cabecera y las secciones finales de las convenciones, y esta estructura:

1. **Resumen**: la arquitectura en un párrafo y un diagrama (Mermaid) con los artefactos y los flujos entre ellos.
2. **Artefactos desplegables**: para cada uno, qué es, de qué es responsable, de qué no, y su carpeta en el repositorio.
3. **Comunicación**: quién llama a quién, si es síncrono o asíncrono y con qué mecanismo. Solo la existencia y el tipo de cada vía; el detalle de los contratos es del SDD.
4. **Datos**: dónde vive el estado y qué artefacto es dueño de cada almacén. Un almacén tiene un solo dueño que escribe en él.
5. **Stack por artefacto**: lenguaje, framework, runtime y framework de tests, con versiones solo cuando una decisión dependa de ellas.
6. **Plataforma y despliegue**: dónde se aloja cada artefacto, entornos, cómo se despliega cada uno por separado, configuración y secretos.
7. **Aspectos transversales**: autenticación y autorización entre artefactos y hacia fuera, manejo de errores, registro y observabilidad.
8. **Atributos de calidad**: tabla con cada requisito que no es de usuario (por su ID) y cómo lo satisface la arquitectura.
9. **Estructura del repositorio y comprobaciones de calidad**: árbol de carpetas y convenciones comunes a todos los artefactos; para cada artefacto, una tabla con la herramienta, el comando y el nivel de exigencia de tests, análisis de tipos, linter y formato; el comando único de la raíz que las ejecuta todas; y la integración continua: un workflow en `.github/workflows/` que lanza ese comando en cada push a la rama principal y en cada pull request.
10. **Alternativas descartadas**: cada una con el motivo, y qué tendría que cambiar para reconsiderarla.

Si actualizas un documento existente, modifica las secciones afectadas y añade al final de "Decisiones y supuestos" qué ha cambiado en este ciclo y por qué.

Pon la fase 3 en `borrador` con `node _flujo/estado.mjs fase 3 borrador --quien "agente de la fase 3"`, haz commit (`docs: fase 3 arquitectura`) y ejecuta `git push`. No preguntes si se aprueba todavía (ver "Aprobar y publicar" en las convenciones). Añade tu entrada a `<ciclo>/aprobaciones.md` (ver «Aprobaciones y atención especial» en las convenciones): supuestos de plataforma sin verificar, hallazgos no corregidos de la revisión (cuando la haya), decisiones estructurales con su contrapartida y la alternativa razonable descartada, y, a partir del segundo ciclo, qué cambia respecto a la arquitectura vigente. Termina indicando que el siguiente paso es la revisión de arquitectura (`/revisar-arquitectura`, `_flujo/03-arquitectura-revision.md`) en un contexto aislado: es obligatoria antes de aprobar.

## Revisión y resolución (obligatoria)

La revisión de la arquitectura es un paso obligatorio de esta fase: la hace el agente `/revisar-arquitectura` en un contexto aislado (`_flujo/03-arquitectura-revision.md`) y deja su informe en `<ciclo>/revision-arquitectura.md`. No pidas la aprobación mientras no haya una revisión registrada ahí. Aprobar con hallazgos pendientes sigue siendo decisión de la persona responsable.

### Resolver la revisión (conversación principal)

Si la persona responsable quiere tratar los hallazgos, lo hace con el agente de la conversación principal, no con el revisor. Es parte de la fase 3: no rompe la regla de una fase por conversación y no hace falta `/clear`. El agente actúa así:

1. Presenta los hallazgos de uno en uno ("Hallazgo 2 de 6"), con el problema, tres opciones y su recomendación: corregirlo en `_docs/arquitectura.md`, dejarlo para el SDD o para TA1, o descartarlo como riesgo asumido. Espera la decisión de la persona antes de editar.
2. Si un hallazgo añadiría un comportamiento observable que no está en `historias.md`, no lo incorpora sin más: lo dice, y la persona decide entre dejarlo fuera, aceptarlo como detalle de un criterio existente o volver a las historias (ver "Cambios hacia atrás" en las convenciones).
3. Aplica cada decisión en `_docs/arquitectura.md` y al terminar añade a "Decisiones y supuestos" una línea por hallazgo: corregido, para el SDD o TA1, o riesgo asumido. Anota también la resolución bajo la revisión en `<ciclo>/revision-arquitectura.md`, con la etiqueta `Resolución:` y una línea por hallazgo, `<n>. corregido`, `<n>. para el SDD`, `<n>. para TA1` o `<n>. riesgo asumido`.
4. Hace un solo commit con el documento y el informe, `docs: fase 3 arquitectura (revisión)`, y `git push`. La fila de la fase 3 sigue en `borrador`.
5. Propone una segunda revisión solo si se corrigió algo bloqueante o importante; en los demás casos es opcional y la decide la persona.

Después, la persona dice "apruebo la arquitectura" y se sigue "Aprobar más tarde" de las convenciones.

### Si se aprueba sin resolver todos los hallazgos

Por ejemplo, tras una segunda revisión con hallazgos menores. El agente, antes de poner `aprobado`, añade a "Decisiones y supuestos" de `_docs/arquitectura.md` una línea por cada hallazgo no resuelto: `para el SDD`, `para TA1` o `riesgo asumido`, con el hallazgo en una frase. Van en el mismo commit de la aprobación, junto con su `Resolución:` en `<ciclo>/revision-arquitectura.md`. Es necesario porque la fase 4 lee `_docs/arquitectura.md` y no el informe de revisión.

## Terminado cuando

- Cada artefacto, almacén y tecnología está justificado por un requisito o una restricción citados.
- Cada requisito que no es de usuario aparece en la tabla de atributos de calidad.
- Quien escriba un SDD sabe en qué artefacto va cada cosa, con qué tecnología y en qué carpeta, sin decidir nada estructural.
- Están definidos las herramientas de calidad de cada artefacto, el comando único que las ejecuta todas y la integración continua, aunque aún no haya código.
- Las afirmaciones sobre la plataforma están verificadas o marcadas como supuesto.
- Hay una revisión registrada en `<ciclo>/revision-arquitectura.md` antes de pedir la aprobación.

## Fuera de esta fase

- Endpoints, esquemas de datos y diseño interno de cada artefacto (fase 4).
- Crear código, carpetas, pipelines o recursos en la nube: esta fase decide y documenta. El andamiaje, incluido el workflow de integración continua, es la primera tarea del plan.
- Workflows de despliegue: aquí solo se describe cómo se despliega cada artefacto; automatizarlo es trabajo de un ciclo.
- Elegir tecnologías o artefactos que ningún requisito de este ciclo necesita.
- Cambiar el alcance o los requisitos. Si un requisito hace inviable una arquitectura razonable, detente y dilo.
- Aprobar tu propio documento.
