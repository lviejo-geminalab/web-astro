# Resolver un hueco de especificación

Lee primero `_flujo/convenciones.md`, en especial la sección "Huecos en la especificación".

## Objetivo

Resolver un hueco que el programador o el revisor han registrado en `<ciclo>/huecos.md`: discutirlo con la persona responsable, dejar escrita su decisión y aplicar a los documentos la corrección mínima que la refleja, para que la tarea bloqueada pueda continuar.

La decisión tiene que quedar escrita. Una respuesta que se da solo en la conversación no existe para el programador ni para el revisor, que trabajan con contexto limpio: implementarían o revisarían contra unos documentos que no la recogen.

Un hueco también puede abrirlo la persona responsable describiéndolo con sus palabras (`/hueco el navegador da error por el favicon`): el agente redacta la entrada y, a partir de ahí, el proceso es el mismo.

No es una fase numerada: se ejecuta cuando hay huecos en `abierto`, en la conversación principal. También resuelve los desacuerdos entre programador y revisor (una revisión con la nota `requiere decisión`), que se indican con el ID de la tarea (`/hueco TA9`): explica las dos posturas de la entrada de `revisiones-[nombre].md`, ayuda a decidir y escribe la decisión en esa misma entrada, con fecha y "Decisión de la persona responsable". No hay enmienda salvo que la decisión revele un hueco, que entonces se trata como tal. Si da la razón al revisor, la tarea queda en `cambios necesarios` y el siguiente paso es `/implementar TA<n>`; si se la da al programador, el siguiente paso es `/revisar TA<n>`. Commit `docs: decisión TA<n>` y `git push`.

## Entradas

- `<ciclo>/huecos.md`: la entrada del hueco, escrita por quien lo encontró.
- Los documentos del ciclo a los que afecta: SDD, plan de tareas (con sus tests) y, si existe, `<ciclo>/historias.md`.
- `_docs/arquitectura.md`.
- la tabla «Tareas» de `<ciclo>/estado.md` (estado de las tareas).
- El código, si hace falta para entender el hueco.

## Antes de empezar

1. Si te han indicado un hueco, trata ese. Si te han dado una descripción en lugar de un ID, todavía no hay entrada: comprueba que el problema es real y que los documentos no lo dicen ya, la entrada es de nivel `hueco`; redáctala al final de `<ciclo>/huecos.md` como indica "Cómo se registra" de `_flujo/convenciones.md` (el ID lo da `node _flujo/estado.mjs hueco abrir --descripcion "<una línea>" --quien persona`, que sube el contador; `abierto por la persona responsable`; qué falta, opciones y recomendación). Si lo descrito es una funcionalidad nueva que el brief deja fuera, no es un hueco: no lo registres, dilo, propón la hoja de ruta (`/ciclo` cuando toque) y termina. Si no te han dado nada, lista los que están en `abierto` y pregunta por cuál empezar. Trata uno cada vez.
2. Lee la entrada y los documentos que cita. Comprueba que el hueco es real: que lo que falta no está ya escrito en otro sitio. Si lo está, dilo, anótalo en la entrada como respuesta y pasa al paso de cierre sin enmienda.

   **Cierre de un hueco con camino `repetir fases` ya decidido.** Si la entrada tiene `Camino: repetir fases`, tiene la decisión escrita y el historial de `<ciclo>/estado.md` muestra que ya se repitieron las fases que indica (filas que citan `G<n>`), no hay nada que discutir: ni decidir otra vez ni enmendar. Comprueba que la fase 6 se ha vuelto a ejecutar o que la persona lo pide expresamente, pon la entrada en `resuelto` con la fecha y una línea (`fases repetidas: …`), ejecuta `node _flujo/estado.mjs hueco resolver G<n> --camino "repetir fases" --tarea-a <pendiente|"cambios necesarios"|aprobada> --quien "agente de /hueco"` (`pendiente` si la tarea no tiene código, `cambios necesarios` si el código hay que ajustar, `aprobada` si ya estaba aprobada y su código no cambia; sin tarea bloqueada, omite `--tarea-a`), haz commit con `docs: cierre G<n>`, ejecuta `git push` y termina con el siguiente paso. Si las fases aún no se han repetido, no cierres nada: di cuáles faltan y da su comando y su frase, como en el paso 3.

## Proceso

1. **Explica el hueco** a la persona responsable en pocas líneas: qué falta, por qué importa y qué opciones propone quien lo encontró. Si ves una opción mejor o una consecuencia que no se ha mencionado, añádela. Si la persona responsable quiere una segunda opinión independiente antes de decidir, puede lanzar `/asesor` con la pregunta.

2. **Discútelo.** Responde a sus preguntas y ayúdale a decidir, señalando qué implica cada opción para lo ya implementado, para los tests y para las tareas pendientes. La decisión es suya.

3. **Elige el camino.** Con la decisión tomada, decide por qué camino se resuelve y anótalo en la entrada (`Camino:`):
   - Si la decisión contradice algo aprobado, afecta a la arquitectura, cambia el alcance o toca varias tareas ya implementadas, el camino es **`repetir fases`**. No apliques ninguna enmienda: explica qué fase hay que repetir según "Cambios hacia atrás", anota en la entrada la decisión, la fase que se repite y el comando, y detente. Termina dando el comando de esa fase y, para pegar en la conversación nueva, una frase completa que diga que se repite por el hueco `G<n>`, que lea su entrada en `huecos.md`, qué debe cambiar exactamente (con los valores concretos, y sin tomar como definitivo un ejemplo de la entrada que hayas comprobado que no sirve) y que anote `G<n> resuelto` en "Decisiones y supuestos" y la fila del historial. Sin esa frase, la fase repetida ve su documento `aprobado` y no sabe por qué se le pide repetirla.
   - Si resulta ser un detalle sin efecto observable, es **menor**, no un hueco: no hay enmienda ni se anota en ningún fichero; dile a la persona que el programador la decidirá y la dejará en la línea «Decisiones menores del programador» del mensaje de commit de la tarea.
   - Si la especificación es clara y el código de una tarea ya aprobada no la cumple, el camino es **`corregir código`**: no hay enmienda. Escribe la decisión (paso 4), pon la tarea en `cambios necesarios` con `node _flujo/estado.mjs tarea estado TA<n> "cambios necesarios" --notas G<n> --quien persona`, anota en la entrada el síntoma y si algún test debía haberlo detectado, y ve al paso 7. Si no había test que lo cubriera, lo único que se enmienda es añadirlo, con ID nuevo, en la ficha de esa tarea. Si la tarea es de un ciclo ya cerrado, no se modifica: el arreglo va a un ciclo nuevo (`/ciclo`). El siguiente paso es `/implementar TA<n>`.
   - En otro caso el camino es **`enmienda`**: sigue con ella.

4. **Escribe la decisión** en la entrada del hueco, con la fecha, la opción elegida y el motivo en palabras de la persona responsable.

5. **Prepara la enmienda.** La corrección mínima que hace que los documentos digan lo decidido:
   - En el SDD: la fila, el contrato o el caso que faltaba.
   - Si cambia o añade comportamiento observable: el criterio de aceptación correspondiente, con ID nuevo si es nuevo.
   - En el plan de tareas: el test nuevo o ajustado, completo y dentro de la tarea afectada, o una tarea nueva si no cabe en ninguna sin romper la definición de tarea atómica, y la matriz de cobertura. Una tarea nueva lleva su ficha completa, con el ID del contador de `_docs/proyecto.md`; su fila en la tabla del resumen, en el lugar del orden de ejecución que le corresponde y con `Depende de:` solo de tareas anteriores; sus tests debajo de la ficha y en la matriz de cobertura; y su fila `pendiente` en la tabla «Tareas» de `<ciclo>/estado.md`.

   Marca cada cambio con el ID del hueco, por ejemplo `(enmienda G3)`, para que cualquiera pueda ver de dónde sale. Toma los identificadores nuevos con `node _flujo/estado.mjs siguiente <H|R|T|TA|G|V> [--cantidad <n>]`, que sube el contador; si la enmienda añade una tarea, dala de alta con `tarea alta --sdd <nombre> --titulo "<descripción>" --quien persona`.

   No aproveches para mejorar nada más: una enmienda toca solo lo que el hueco exige.

   **Una excepción: el mismo defecto en otras tareas.** Si el hueco es un defecto de la ficha o del plan que puede repetirse (por ejemplo, un test asignado a una tarea en la que no puede fallar, o una fila de casos límite sin criterio), revisa las tareas pendientes del plan antes de enseñar la enmienda. Si encuentras más casos, preséntalos aparte y con su motivo: ampliar la enmienda a ellos necesita la confirmación expresa de la persona responsable, igual que el resto. Anota en la entrada del hueco qué tareas se han revisado y qué se ha encontrado, aunque sea nada.

6. **Enseña la enmienda** a la persona responsable: qué documentos cambian y cómo. Espera su confirmación expresa. Si pide cambios, aplícalos y vuelve a enseñarla.

7. **Cierra el hueco.** Con la confirmación:
   - Aplica la enmienda a los documentos.
   - Completa la entrada: resumen de la enmienda, "Confirmada por la persona responsable en conversación" con la fecha, y estado `resuelto`.
   - Con `node _flujo/estado.mjs hueco resolver G<n> --camino <el elegido> --tarea-a <pendiente|"cambios necesarios"|aprobada> --quien "agente de /hueco"`, pasa el hueco a `resuelto` y devuelve la tarea de `bloqueada` a `pendiente`, a `cambios necesarios` si ya tenía código que hay que ajustar, o a `aprobada` si ya estaba aprobada y su código no cambia (por ejemplo, un hueco solo de documentación). Antes, con la elección de la persona, `hueco camino G<n> --camino <el elegido> --quien persona` deja anotado el camino. Si el hueco no tenía ninguna tarea bloqueada (lo abrió la persona responsable), no hay nada que desbloquear.
   - Haz commit con el mensaje `docs: enmienda G<n>` y ejecuta `git push`.

8. **Indica el siguiente paso:** qué tarea puede retomar el programador, y si quedan más huecos en `abierto`.

## Salida

- La entrada del hueco completa y en `resuelto`.
- Los documentos del ciclo enmendados, con cada cambio marcado.
- La tarea desbloqueada (con el comando de estado).
- Un commit, subido con `git push`.

Esta es la única situación del flujo en la que la aprobación se da en la conversación y no con `aprobar`: la enmienda es pequeña, la persona responsable la ve entera antes de confirmar y queda registrada con su fecha.

## Terminado cuando

- La decisión está escrita con su motivo y no solo en la conversación.
- Alguien que lea ahora el SDD y la tarea con sus tests no encontraría el hueco.
- Cada cambio de la enmienda lleva el ID del hueco.
- Si el hueco era un defecto que puede repetirse, la entrada dice qué tareas pendientes se han revisado y el resultado.
- La matriz de cobertura sigue sin huecos y todo test sigue dentro de una tarea.
- La tarea ya no figura como `bloqueada`.

## Fuera de esta fase

- Decidir por la persona responsable, o aplicar una enmienda sin su confirmación expresa.
- Resolver con una enmienda un hueco de camino `repetir fases`.
- Cambiar en los documentos algo que el hueco no exige.
- Modificar código o tests: eso lo hará el programador al retomar la tarea.
- Modificar `_docs/arquitectura.md` o documentos de ciclos cerrados.
