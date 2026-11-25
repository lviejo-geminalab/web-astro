# Fase 9: Cierre del ciclo

Lee primero `_flujo/convenciones.md`.

## Objetivo

Cerrar el ciclo activo dejando `_docs/sistema.md` al día. Ese documento describe qué hace el sistema hoy, y es lo que leerá el ciclo siguiente para no partir de cero ni tener que reconstruir el presente a partir de los documentos de todos los ciclos anteriores.

Los SDD de un ciclo son la foto de unas decisiones; `_docs/sistema.md` es el estado actual. Por eso se escribe mirando el código y la suite, no copiando los SDD.

## Entradas

- Todos los documentos de la carpeta del ciclo activo.
- `_docs/sistema.md`, si existe (no existe al cerrar el primer ciclo).
- `_docs/arquitectura.md`.
- `_docs/proyecto.md`.
- El repositorio y su historial.

## Antes de empezar

Comprueba que el ciclo está realmente terminado. Si algo de esto no se cumple, enuméralo y detente:

1. Todas las tareas de la tabla «Tareas» de `<ciclo>/estado.md` están en `aprobada`.
2. Cada historia del ciclo tiene su revisión de cierre en `<ciclo>/revisiones-[nombre].md`, sin hallazgos bloqueantes pendientes.
3. No queda ninguna revisión marcada `requiere decisión`.
4. La suite completa está en verde. Ejecútala; no lo des por supuesto.
5. Todos los huecos de `<ciclo>/huecos.md` están en `resuelto` y ninguna tarea figura como `bloqueada`.

## Proceso

1. **Reúne lo que este ciclo ha cambiado.** A partir de las historias, los SDD y el código: capacidades nuevas, comportamiento modificado, criterios de ciclos anteriores que quedaron sustituidos, componentes y contratos nuevos o cambiados.

2. **Contrasta con el código.** Para cada cosa que vayas a afirmar en `_docs/sistema.md`, comprueba que el código y los tests lo respaldan. Si el código no coincide con lo que dice un SDD, describe lo que hace el código y anota la diferencia en tu resumen final. Haz lo mismo con `_docs/arquitectura.md`: si el código se ha apartado de ella, no la corrijas; anótalo en el resumen para que la persona responsable decida si se trata en la fase 3 de un ciclo posterior.

3. **Recoge las decisiones de implementación.** Busca en `<ciclo>/revisiones-*.md` las líneas «Decisiones menores del programador» (`grep -n -A5 'Decisiones menores del programador'`): las que fijan una convención o un comportamiento que los ciclos siguientes deben respetar pasan a `_docs/sistema.md`. Repasa también `<ciclo>/huecos.md`: si los huecos se repiten con un mismo patrón (siempre faltan los mensajes de error, por ejemplo), dilo en tu resumen final e indica qué fase los origina, para que la persona responsable ajuste su fichero en la plantilla.

4. **Recoge lo pendiente.** Lo que el brief dejó fuera de alcance, las historias aplazadas, los hallazgos `menor` de las revisiones que nadie corrigió, los huecos nuevos y las limitaciones conocidas que hayan aparecido. Lo que dé para un ciclo propio y no esté ya en la tabla de `_docs/proyecto.md`, añádelo con `node _flujo/estado.mjs ciclo prever --objetivo "<una línea>" --origen cierre --quien "agente de la fase 9"`, que lo pone al final de la hoja de ruta con este cierre como origen. No reordenes, reescribas ni elimines las filas existentes: eso lo decide la persona responsable.

5. **Escribe o actualiza `_docs/sistema.md`** con la estructura de la sección Salida. Actualiza las secciones existentes; no añadas un apartado por ciclo. El documento describe el presente: lo que ya no es cierto se elimina o se mueve a la tabla de criterios sustituidos.

6. **Mantenlo corto.** Es un mapa para orientarse, no una copia del diseño. Para el detalle, apunta a rutas del código y, cuando importe el porqué, al documento del ciclo que tomó la decisión.

7. **Actualiza el estado.** Pon la fase 9 en `borrador` con `node _flujo/estado.mjs fase 9 borrador --quien "agente de la fase 9"`. El ciclo se cierra solo al aprobar, en el paso 8.

8. **Pregunta con el selector Sí/No si se aprueba, y publica.** Sigue "Aprobar y publicar" de las convenciones: con el sí explícito de la persona responsable, ejecuta `node _flujo/estado.mjs aprobar fase 9`. El comando pone la fase en `aprobado`, cierra el ciclo y regenera `_docs/proyecto.md` (`Ciclo activo: ninguno`) y `estado.md`; si falta algo (tareas sin aprobar, huecos abiertos) se niega y lo dice. Después haz un único commit con el mensaje `docs: fase 9 cierre [NN-nombre]` y ejecuta `git push`.

9. **Ofrece marcar el cierre con una etiqueta de Git.** Una vez publicada la aprobación, pregunta si quiere dejar una etiqueta en el commit del cierre, para poder volver a ese punto exacto del repositorio. Propón el nombre `ciclo-[NN]` (por ejemplo `ciclo-01`); la persona puede elegir otro. Solo con su sí explícito, ejecuta `git tag -a [nombre] -m "Ciclo [NN-nombre]: [objetivo del ciclo]"` sobre el commit del paso 8 y `git push origin [nombre]`. Si no la quiere, no hagas nada y no insistas. No crees la etiqueta antes de que la fase 9 esté en `aprobado`. Si el repositorio está en GitHub, puedes mencionar que sobre esa etiqueta puede crearse una release con notas, pero no la crees tú.

## Salida

`_docs/sistema.md`, con esta estructura (y, si la persona lo acepta, la etiqueta `ciclo-[NN]`):

1. **Qué hace hoy**: capacidades agrupadas por área, en lenguaje de usuario, cada una con los IDs de las historias y criterios vigentes que la definen (los de las historias más los añadidos en el SDD).
2. **Arquitectura**: no se describe aquí; remite a `_docs/arquitectura.md`. Añade solo el mapa de componentes internos de cada artefacto, con sus rutas.
3. **Contratos públicos**: interfaces, endpoints y esquemas vigentes, resumidos, con la ruta donde están definidos.
4. **Ejecución**: cómo arrancar cada artefacto en local y el comando único de la suite completa. El stack está en `_docs/arquitectura.md`.
5. **Convenciones del código**: las que los ciclos siguientes deben respetar, incluidas las decisiones menores del programador que recogiste de las revisiones.
6. **Criterios sustituidos**: tabla con el criterio antiguo, el que lo sustituye y el ciclo en que ocurrió.
7. **Pendiente**: limitaciones conocidas y lo dejado para más adelante que no tenga fila propia en la tabla de ciclos de `_docs/proyecto.md`.

Termina con un resumen en la conversación: cuántas revisiones hubo y cuántos hallazgos reales, qué tests pasaron sin código nuevo (`Pasa sin código nuevo`, de los commits), qué ha cambiado en `_docs/sistema.md`, las diferencias encontradas entre documentos y código, y qué debe mirar la persona responsable antes de aprobar.

## Terminado cuando

- Alguien que no conoce el proyecto puede saber, leyendo solo `_docs/sistema.md`, qué hace el sistema, dónde está cada cosa y cómo ejecutar los tests.
- Todo lo que afirma el documento está respaldado por el código y la suite actuales.
- No queda en el documento nada que este ciclo haya dejado de ser cierto.
- Cada criterio marcado `sustituye a` en el ciclo aparece en la tabla de criterios sustituidos.
- La persona responsable ha contestado: la fase 9 está en `aprobado`, el ciclo en `cerrado` y todo publicado, o en `borrador` si prefirió revisarla más tarde. Si aprobó, se le ha ofrecido la etiqueta del cierre.

## Fuera de esta fase

- Modificar código, tests o cualquier documento del ciclo que no sea su `estado.md`.
- Cerrar el ciclo con tareas sin aprobar o revisiones pendientes.
- Marcar el ciclo como `cerrado` sin la aprobación explícita de la persona responsable, o aprobar tu propio documento.
- Planificar el ciclo siguiente o proponer funcionalidades nuevas: solo recoges como previstos los pendientes que ya existían.
