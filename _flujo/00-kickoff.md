# Fase 0: Kickoff

Lee primero `_flujo/convenciones.md`.

## Objetivo

Arrancar el proyecto: darle nombre y descripción, dejar la idea escrita en `<ciclo>/idea.md` y abrir el primer ciclo. Esta fase captura la idea tal como la tiene la persona responsable; no la cuestiona, no la recorta y no decide nada sobre ella. Eso es trabajo de la fase 1.

El kickoff se hace una sola vez por proyecto. Los ciclos posteriores al primero se abren con `/ciclo` (`_flujo/ciclo-nuevo.md`); el primero se abre con el mismo procedimiento, en el apartado «Abrir el ciclo» de ese fichero.

Es una conversación corta. Si se alarga, está invadiendo el brief.

## Entradas

- Lo que la persona responsable cuente en esta conversación.
- Las plantillas sin rellenar: `README.md`, `_docs/proyecto.md`, `_flujo/plantillas/estado.md` y `_flujo/plantillas/idea.md`.

## Antes de empezar

1. **Comprueba que el proyecto empieza desde cero.** Esta plantilla está pensada para proyectos que nacen con ella. Si el repositorio contiene código u otros ficheros ajenos a la plantilla, dilo, explica que el flujo no contempla adoptar un proyecto que ya existía y continúa solo si la persona responsable lo confirma.
2. **Comprueba que el kickoff no está hecho.** Si `_docs/proyecto.md` ya tiene nombre de proyecto, dilo: para seguir trabajando en un proyecto ya arrancado se abre un ciclo nuevo (`/ciclo`), no se repite el kickoff.

## Proceso

1. **Escucha la idea.** Si la persona responsable no la ha contado ya, pídele que la explique con sus palabras, sin estructura.

2. **Completa lo imprescindible.** Haz como máximo 3 preguntas de contenido, de una en una (ver "Pregunta poco y bien" en las convenciones), solo sobre lo que no haya dicho:
   - Para quién es y qué problema le resuelve.
   - Qué tiene ya decidido: tecnología, plataforma, plazos, cosas que no quiere.
   - Qué dudas tiene o qué no sabe todavía.

   Acepta "no lo sé" como respuesta válida y no insistas. No preguntes por alcance, prioridades ni diseño. Si la persona responsable ya piensa la idea por etapas, anótalas tal como las cuente; no propongas tú una división.

3. **Fija el nombre.** Va aparte de las tres preguntas, en su propio mensaje: con él, el máximo real son 4 preguntas. Si la persona responsable no tiene uno, propón tres, cortos, y deja que elija o escriba otro. Si el repositorio ya tiene un nombre razonable, propónlo como primera opción en lugar de repetirlo entre las tres.

4. **Actualiza `README.md`.** Sustituye el título por el nombre del proyecto y el bloque de cita inicial por una descripción de 2 o 3 frases: qué es y para quién. Deja debajo la línea que remite a `_flujo/MANUAL.md`. No añadas nada más.

5. **Registra el proyecto** con `node _flujo/estado.mjs proyecto iniciar --nombre "<nombre>" --url "<url del remoto, si hay>" --quien "agente de la fase 0"`. Crea la base de datos del estado si no existe, el proyecto y sus contadores, y escribe el nombre y la fecha de inicio en `_docs/proyecto.md`. Si el comando dice que el proyecto ya existe, detente: el kickoff ya estaba hecho.

6. **Abre el primer ciclo** con el apartado «Abrir el ciclo» de `_flujo/ciclo-nuevo.md`: nombre corto como `primera-version` (el comando le pone el número `01`), con origen `kickoff`, y espera antes del commit. En el paso de enseñar el resultado, muestra también el nombre y la descripción del proyecto. El mensaje de commit es `docs: fase 0 kickoff`.

## Salida

- `README.md` con el nombre, la descripción y la línea que remite al manual.
- `_docs/proyecto.md` con nombre, fecha de inicio y el primer ciclo abierto (lo escribe el comando de estado).
- La carpeta del primer ciclo con `estado.md` (lo crea el comando) e `idea.md`.
- Un commit con todos los cambios, subido con `git push`.

Esta fase no produce un documento con cabecera y secciones finales, y no necesita aprobación formal: `idea.md` es una entrada, y la persona responsable puede corregirla a mano cuando quiera antes de lanzar la fase 1.

Termina indicando que el siguiente paso es la fase 1, en una conversación nueva.

## Terminado cuando

- La persona responsable ha visto el resultado y ha confirmado que reconoce su idea en `<ciclo>/idea.md`: no falta nada de lo que dijo ni hay nada que no dijera.
- El README ya no contiene texto de plantilla en el título ni en la descripción.
- `_docs/proyecto.md` tiene nombre y un ciclo en `abierto`.
- Los cambios están en un commit y publicados con `git push`.
- `idea.md` no contiene texto de la plantilla.

## Fuera de esta fase

- Cuestionar la idea, recortar el alcance, decidir qué entra en la primera versión o dividirla en ciclos (fase 1).
- Elegir stack, arquitectura, licencia o configuración de CI.
- Proponer la vía completa o corta (fase 1).
- Crear código, carpetas de código o ficheros de configuración.
