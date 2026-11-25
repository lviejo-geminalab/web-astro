# Fase 0: Apertura de un ciclo

Lee primero `_flujo/convenciones.md`.

## Objetivo

Abrir un ciclo: darle nombre, crear su carpeta y dejar escrita la idea que lo motiva en `<ciclo>/idea.md`. Este fichero tiene el procedimiento completo de abrir un ciclo y lo usan dos comandos: `/ciclo` abre todos los ciclos posteriores al primero, y el kickoff (`_flujo/00-kickoff.md`) abre el primero siguiendo el apartado «Abrir el ciclo» de aquí, después de hacer lo propio del proyecto.

Igual que el kickoff, esta fase captura la idea tal como la tiene la persona responsable. No la cuestiona, no la recorta y no decide cómo encaja en el sistema: eso empieza en la fase 1.

## Entradas

- Lo que la persona responsable cuente en esta conversación.
- `_docs/proyecto.md`.
- `_docs/sistema.md`: lo que el sistema hace hoy.
- `_flujo/plantillas/estado.md` y `_flujo/plantillas/idea.md`.

## Antes de empezar

1. **Comprueba que el kickoff está hecho.** Si `_docs/proyecto.md` no tiene nombre de proyecto, di que falta el kickoff y detente.
2. **Comprueba que no hay ningún ciclo abierto.** El cierre del ciclo anterior (fase 9) ya lo deja `cerrado` y pone `Ciclo activo: ninguno`, así que aquí no se cierra nada. Si `_docs/proyecto.md` tiene un ciclo en `abierto` o `Ciclo activo` apunta a una carpeta, detente: solo puede haber un ciclo abierto a la vez. Di cuál es, en qué fase está según su `estado.md` y qué falta para cerrarlo.

## Proceso

1. **Parte de la hoja de ruta.** Si la persona responsable no ha dicho ya qué quiere hacer, mira la tabla de `_docs/proyecto.md`: si hay ciclos en `previsto`, propón el primero como punto de partida y pregunta si es ese, otro de la lista o algo distinto. La hoja de ruta orienta, no obliga.

2. **Escucha la idea del ciclo.** Pídele que explique qué quiere conseguir, aunque el ciclo venga de la hoja de ruta: la línea que hay allí es un recordatorio, no la idea.

3. **Sitúala.** Lee `_docs/sistema.md` para entender de qué está hablando y poder usar los mismos nombres que ya tiene el sistema. No evalúes todavía cómo encaja ni qué habría que cambiar.

4. **Completa lo imprescindible.** Haz como máximo 3 preguntas, de una en una (ver "Pregunta poco y bien" en las convenciones), solo sobre lo que no haya dicho:
   - Qué problema resuelve o qué permite hacer que hoy no se puede.
   - Si es algo nuevo, un cambio de algo que ya existe o una corrección.
   - Qué tiene ya decidido y qué dudas tiene.

   Acepta "no lo sé" como respuesta válida.

5. **Abre el ciclo**, como dice el apartado siguiente, con origen `previsto` si viene de una fila de la hoja de ruta o la persona responsable si no, y el mensaje de commit `docs: fase 0 ciclo [NN-nombre]`.

## Abrir el ciclo

Este apartado es común al kickoff y a `/ciclo`. Quien lo sigue ya tiene la idea contada por la persona responsable.

1. **Nombra el ciclo.** Un nombre corto en minúsculas con guiones (`primera-version`, `exportar-pdf`) y el objetivo en una línea. El número lo pone el comando (el siguiente, con dos cifras: `01-primera-version`). Si quien te llama no ha fijado ya el nombre, propónlo con el objetivo y espera la confirmación antes de abrirlo: un ciclo abierto no se renombra.

2. **Abre el ciclo** con `node _flujo/estado.mjs ciclo abrir --nombre <nombre> --objetivo "<objetivo>" --origen <kickoff | decisión de la persona responsable | de dónde viene> --quien "agente de la fase 0"`; si viene de una fila de la hoja de ruta, añade `--desde <posición de esa fila>`. El comando le da el número y la carpeta `_docs/ciclos/[NN-nombre]/`, pone las fases en su sitio (la 0 en `hecho`), lo coloca en la hoja de ruta a continuación del último ciclo que ya no es previsto y escribe `_docs/proyecto.md` (con `Ciclo activo`) y `estado.md` en la carpeta. Si ya hay un ciclo abierto, se niega. de `_flujo/plantillas/idea.md` y rellenado con estas reglas: usa las palabras y los ejemplos de la persona responsable, ordena pero no reinterpretes; no añadas funcionalidades, usuarios ni restricciones que no haya mencionado; lo que no haya dicho se escribe «Sin definir»; las dudas van tal como se expresaron, porque son la materia prima de las preguntas de la fase 1. Si contó la idea por etapas, añade una sección «Etapas que imagino» con sus palabras y, si no, no la crees. La sección «Qué cambia respecto a lo que hay» solo existe a partir del segundo ciclo, con lo que la persona haya dicho; en el primero, bórrala. Elimina el párrafo introductorio de la plantilla.

3. **Escribe `idea.md`** en la carpeta del ciclo, copiado de `_flujo/plantillas/idea.md` y rellenado con las reglas del paso anterior. No toques `estado.md` ni `_docs/proyecto.md`: son del comando.

4. **Enseña el resultado y espera.** Antes de hacer commit, muestra a la persona responsable lo que has escrito (en el kickoff, también el nombre y la descripción del proyecto) y pregunta si lo deja así o quiere cambiar algo. No pases al paso siguiente hasta que conteste; aplica las correcciones que pida y vuelve a preguntar si hubo cambios. Que el contenido haya aparecido en la ventana de una herramienta no cuenta como habérselo enseñado.

5. **Haz commit** solo después de la respuesta del paso anterior, con el mensaje que indique quien te llama, y ejecuta `git push`.

## Salida

- La carpeta del ciclo con `estado.md` e `idea.md`.
- `_docs/proyecto.md` con el ciclo en `abierto` y `Ciclo activo` apuntando a él.
- Un commit con los cambios, subido con `git push`.

Esta fase no necesita aprobación formal: la persona responsable puede corregir `idea.md` a mano antes de lanzar la fase 1. Termina indicando que el siguiente paso es la fase 1, en una conversación nueva.

## Terminado cuando

- La persona responsable reconoce su idea en `idea.md`: no falta nada de lo que dijo ni hay nada que no dijera.
- `_docs/proyecto.md` tiene exactamente un ciclo en `abierto`, y es el nuevo.
- `idea.md` no contiene texto de la plantilla.
- Los cambios están en un commit y publicados con `git push`.

## Fuera de esta fase

- Cuestionar la idea, recortar el alcance o proponer la vía (fase 1).
- Analizar el impacto en el código o en los tests existentes (fases 4 y 5).
- Cerrar un ciclo anterior o modificar `_docs/sistema.md` o cualquier documento de un ciclo cerrado.
- Abrir un ciclo si hay otro abierto.
