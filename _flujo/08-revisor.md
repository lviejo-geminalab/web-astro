# Fase 8: Revisor

Lee primero las secciones "Identificadores", "Huecos en la especificación" y "Cambios hacia atrás" de `_flujo/convenciones.md`. Localízalas con `grep -n '^## ' _flujo/convenciones.md` y léelas por rango; no abras el fichero entero.

## Objetivo

Decidir si el commit de una tarea hace exactamente lo que la tarea pide, de acuerdo con el SDD y los tests de su ficha, antes de que la tarea siguiente se construya encima. Esta fase la ejecuta un agente distinto del programador, en una conversación nueva.

No has visto cómo se escribió el código y no debes fiarte de lo que el programador diga de él: ni del mensaje de commit, ni de su resumen, ni de los comentarios. Verifica cada cosa por ti mismo, leyendo el diff y ejecutando los tests.

Hay dos modos:

- **Revisión de tarea**: un commit, después de cada tarea.
- **Revisión de cierre**: el diff acumulado de todas las tareas de una historia o de un bloque de requisitos, cuando el plan de tareas marca el cierre.

## Entradas

- `_docs/arquitectura.md`
- `<ciclo>/sdd-[nombre].md`
- `<ciclo>/tareas-[nombre].md`
- La tabla «Tareas» de `<ciclo>/estado.md`
- `<ciclo>/huecos.md`, si existe.
- `<ciclo>/revisiones-[nombre].md`, si existe: revisiones anteriores.
- El repositorio y su historial.

## Antes de empezar

Elige qué revisar. Si te lo indican, eso. Si no: la primera tarea en estado `implementada` de la tabla «Tareas» de `<ciclo>/estado.md`. Si la última tarea de una historia acaba de quedar `aprobada` y no hay revisión de cierre de esa historia, haz la de cierre. Lo mismo si la tarea que acaba de quedar `aprobada` es una que el plan de tareas marca como cierre de un bloque de requisitos y aún no hay revisión de cierre de ese bloque. Si te indican `cierre H<n>`, haz la de cierre de esa historia. Si te indican `cierre TA<n>`, haz la de cierre del bloque de requisitos que esa tarea cierra.

Lee la ficha de la tarea y lo que ella cita antes de mirar el diff, para saber qué esperas encontrar: del SDD, el objetivo, el alcance, los criterios de aceptación que lista `Procede de` y las secciones de `Archivos`; del plan de tareas, la sección de entorno de pruebas y los tests de la tarea (los que van debajo de su ficha). Localízalos con `grep -n '^#'` y léelos por rango, sin abrir los documentos enteros. Si el diff toca algo que esas secciones no cubren, lee entonces la parte del SDD que lo cubre. En la revisión de cierre lee además las secciones del SDD y los tests del plan de tareas que cubren los criterios de la historia o del bloque. Los documentos pueden contener enmiendas, marcadas con el ID de su hueco: son parte de la especificación vigente y se revisa contra ellas.

## Proceso: revisión de tarea

Obtén el diff del commit de la tarea (y de sus commits de corrección, si los hay) y comprueba, en este orden:

1. **Alcance.** ¿El diff implementa lo que dice la descripción de la tarea? ¿Falta algo? ¿Sobra algo: archivos no previstos, comportamiento de tareas posteriores, refactors, cambios de configuración o dependencias? ¿Respeta la sección "Fuera de esta tarea" y los no-objetivos del SDD?

2. **Tests de la tarea.** Compara cada test con su especificación en el plan: mismos datos, misma acción, mismo resultado esperado. Un test que comprueba menos de lo especificado (una aserción más laxa, un caso omitido) es un hallazgo bloqueante.

3. **Tests anteriores.** ¿El diff modifica, elimina, desactiva o marca como "saltado" algún test que ya existía? Si lo hace, es bloqueante salvo que el plan de tareas lo liste en "Tests existentes afectados" para esta tarea y el cambio coincida exactamente con lo que el plan indica.

4. **Ejecución.** Ejecuta la suite completa sobre el commit: tests, tipos y linter. Todo en verde. Sigue "Cómo ejecutar la suite" de `_flujo/convenciones.md` y pega su salida tal cual en el resumen y en la revisión. Comprueba que el diff no relaja la calidad para conseguirlo: reglas desactivadas, comentarios que silencian avisos (`# type: ignore`, `eslint-disable` y similares), exclusiones nuevas o un nivel de exigencia más bajo en la configuración. Es bloqueante salvo que el SDD o `_docs/arquitectura.md` lo justifiquen. Después comprueba que los tests de la tarea prueban algo de verdad: léelos buscando aserciones vacías o que pasarían con cualquier implementación.

5. **Contratos.** Firmas, tipos, esquemas, endpoints y formatos de error coinciden literalmente con el SDD. El diff respeta `_docs/arquitectura.md`: está en el artefacto y la carpeta que corresponden y no introduce tecnologías, dependencias entre artefactos ni vías de comunicación que la arquitectura no contemple.

6. **Corrección.** Lee el código buscando errores reales: lógica incorrecta, casos límite del SDD no tratados, manejo de errores ausente, problemas de seguridad, valores fijos puestos solo para que el test pase.

7. **Decisiones.** Lee el mensaje completo del commit (`git log -1 --format=%B <commit>`) y busca con `grep -n 'TA<n>' <ciclo>/huecos.md` las entradas de esta tarea; no escribas «no hay entradas» sin haberlo hecho. Si el programador dejó decisiones en la línea «Decisiones menores del programador», cópialas a tu entrada con la misma línea y valóralas: ¿es de verdad un detalle menor, o toca un contrato o un comportamiento observable que debería haberse consultado? Si el commit anota `Pasa sin código nuevo: T…, comprobado: …`, comprueba la demostración: rompe tú el comportamiento que la nota dice (o razona con el código) y comprueba que el test falla. Si la nota falta cuando un test pasó sin código, o la demostración no se sostiene, es un hallazgo bloqueante.

Si es una segunda revisión tras `cambios necesarios`, comprueba primero que cada hallazgo anterior está resuelto y que el commit de corrección no introduce nada más. Después repite los pasos 3 y 4.

## Proceso: revisión de cierre

Obtén el diff acumulado de todas las tareas de la historia o del bloque y busca lo que la revisión tarea a tarea no puede ver. Léelo fichero a fichero (`git diff <primer commit>~1 <último commit> -- <ruta>`), no solo con `--stat`: los ficheros de datos y de contrato se leen enteros y se comparan con el SDD, y los tests del bloque se listan para comprobar que existen todos los que el plan asigna:

1. **Criterios de la historia o del bloque.** Recorre sus criterios de aceptación uno a uno: ¿el conjunto los cumple todos? Ejecuta los tests que los cubren.
2. **Coherencia entre tareas.** Código duplicado entre tareas, nombres o patrones inconsistentes, piezas que no encajan entre sí.
3. **Deriva respecto al diseño.** ¿La estructura resultante corresponde a los componentes y responsabilidades del SDD?
4. **Restos.** Código muerto, andamiaje temporal, comentarios de trabajo pendiente, cosas que una tarea añadió y otra dejó sin usar.
5. **Decisiones del bloque.** Lee la línea «Decisiones menores del programador» de los commits de cada tarea del bloque (`git log --grep '^TA<n>'`) y las entradas de `<ciclo>/huecos.md` con `grep -n 'TA<n>'`: ¿alguna toca un contrato o un comportamiento observable?
6. **Suite completa** en verde.

## Capturas y maqueta

Si la ficha de la tarea pide una captura como condición de «Terminada cuando», o si haces una revisión de cierre de una historia con pantalla y existe `<ciclo>/maqueta/`, genera tú las capturas con la herramienta de pruebas del proyecto (según `_docs/arquitectura.md`) y guárdalas en `<ciclo>/capturas/` con el nombre `TA<n>-<descripción>.png` (o `H<n>-<descripción>.png`). Cítalas en la entrada de la revisión. Si hay maqueta, lee con `Read` la captura y la imagen correspondiente de la maqueta y anota las diferencias visibles (posiciones, alineación, márgenes, colores) como hallazgo `menor`, o `bloqueante` si contradicen un valor literal del SDD o de los tests de la tarea. Es una estimación visual: la decisión sobre lo que se acepta es de la persona responsable. Si no puedes generar la captura (no hay navegador, el comando falla), dilo como pendiente; no describas lo que no has visto.

## Qué informar

Informa solo de problemas que afecten a la corrección o al cumplimiento del SDD o de la tarea y sus tests. Sin comentarios de estilo, salvo que el código viole una convención del repositorio. No propongas mejoras opcionales ni diseños alternativos: el diseño se decidió en la fase 4.

Cada hallazgo lleva:

- Gravedad: `bloqueante` (incumple la tarea, sus tests o el SDD, o hay un error real) o `menor` (conviene corregirlo, pero no impide aprobar).
- Archivo y línea.
- Qué ocurre y qué documento lo demuestra, con su ID o sección.
- Qué habría que cambiar, descrito en una frase. No escribas tú el código.

Si un hallazgo no se debe al código sino a que el SDD o la tarea (con sus tests) están mal, márcalo como `problema de documentación` e indica qué fase habría que repetir. Eso lo decide la persona responsable, no el programador. Regístralo además como hueco: ábrelo con `node _flujo/estado.mjs hueco abrir --descripcion "<una línea>" --tarea TA<n> --quien revisor` (da el ID `G`, sube el contador y deja la tarea `bloqueada`) y escribe su entrada en `<ciclo>/huecos.md` como indica `_flujo/convenciones.md`. Termina con `/hueco G<n>`.

Si no encuentras nada, dilo en una línea y aprueba. No busques hallazgos de relleno.

## Salida

Añade una entrada al final de `<ciclo>/revisiones-[nombre].md`, sin modificar las anteriores:

```
## TA9 — revisión 1 — [fecha]
Tarea: Restablecer la contraseña con un enlace — el enlace caduca a los 30 minutos (plan: <ciclo>/tareas-auth.md)
Commit: e4f5a6b
Veredicto: cambios necesarios
Suite: 47 tests, 47 en verde

Decisiones menores del programador:
- TA9: el límite se redondea hacia abajo. Porqué: es lo más conservador. (Valoración: detalle menor, sin efecto observable.)

Hallazgos:
1. [bloqueante] tests/auth/test_reset.py:58 — T7 comprueba solo el
   código 410; el plan exige además el cuerpo {"error":
   "enlace_caducado"} y que la contraseña no cambie. Añadir las
   aserciones que faltan.
2. [menor] src/auth/reset.py:31 — el límite de 30 minutos está escrito
   como literal; el SDD (sección 4) lo define como parámetro de
   configuración RESET_TTL_MIN.

Comprobado: alcance, tests de la tarea, tests anteriores, ejecución,
contratos, corrección, decisiones.
```

Veredictos:

- `aprobada`: ningún hallazgo bloqueante.
- `cambios necesarios`: al menos uno bloqueante.

Para una revisión de cierre, la entrada se titula `## Cierre de H2 — [fecha]` si cierra una historia, aunque lo marque una tarea (TA68 cierra H4: `## Cierre de H4`), y `## Cierre de TA11 — [fecha]` solo si el plan lo marca por bloque de requisitos y, si hay hallazgos bloqueantes, indica a qué tarea corresponde corregir cada uno.

Después actualiza el estado con el comando: `node _flujo/estado.mjs tarea estado TA<n> aprobada --commit <hash> --quien revisor` o `… cambios necesarios --quien revisor`. El `<hash>` es el identificador del commit del programador (`git log --grep "^TA<n>"`; si hay correcciones, el último); sin él, el comando no deja aprobar. El comando regenera `<ciclo>/estado.md`. En una revisión de cierre con hallazgos bloqueantes, las tareas afectadas pasan a `cambios necesarios` una a una con el mismo comando. Haz commit solo con `revisiones-[nombre].md`, `estado.md`, las entradas de `huecos.md`, `_docs/proyecto.md` (el comando lo regenera si hay hueco) y las capturas de `<ciclo>/capturas/` si las hiciste (`docs: fase 8 revisión TA<n>`), y ejecuta `git push`.

Termina con un resumen breve en la conversación, con la forma de «Forma del mensaje final» de `_flujo/convenciones.md`. En el caso limpio es exactamente este, y solo cambian los datos de la tarea:

```
## TA7 aprobada
Añade el filtro por estado en la lista (T12). Sin hallazgos. Commit [`a1b2c3d`](https://github.com/<dueño>/<repo>/commit/a1b2c3d).

**Ficheros:** [web/src/app/lista.ts](web/src/app/lista.ts), [web/src/app/lista.spec.ts](web/src/app/lista.spec.ts), [revisión](_docs/ciclos/01-primera-version/revisiones-web.md)

**Suite:** verde, 31 tests.

**Siguiente paso:** `/clear` y `/implementar TA8`
```

- El título es `## TA<n> aprobada` o `## TA<n> con cambios necesarios`. La frase dice qué hace la tarea, el veredicto y cuántos hallazgos hay; no repitas lo que ya está en tu entrada de `revisiones-[nombre].md`.
- El commit revisado va enlazado a GitHub si el remoto (`git remote get-url origin`) es de GitHub. **Ficheros:** son los del commit revisado más un enlace a tu entrada, todos como enlaces de ruta relativa a la raíz del repositorio, nunca rutas absolutas.
- Si hay hallazgos, ponlos en una línea propia en negrita (**Hallazgos**) antes de la suite.
- El siguiente paso es el comando exacto, con `/clear` antes (recomendable para mantener corta la conversación; si el agente corre como subagente aislado, no hace falta para el aislamiento): `/implementar TA<n+1>` si la tarea queda aprobada, `/implementar TA<n>` si necesita cambios. Si la tarea aprobada cierra una historia o un bloque del plan y aún no hay revisión de cierre, es esa revisión y no la tarea siguiente. El comando nombra lo que se cierra: `/revisar cierre H<n>` si cierra una historia (aunque la marque la tarea TA68, el comando es `/revisar cierre H4`) y `/revisar cierre TA<n>` solo si cierra un bloque de requisitos, con el bloque entre paréntesis (`/revisar cierre TA69 (cierra el bloque R12)`). Si el `git push` falló, indícalo junto al siguiente paso.

## Cuando no hay acuerdo

Si una tarea llega a su tercera revisión sin aprobarse, o el programador ha rebatido un hallazgo en su resumen, no sigas el intercambio: describe el desacuerdo en la entrada, con las dos posturas, y deja el veredicto en `cambios necesarios` con la nota `requiere decisión`. Lo resuelve la persona responsable con `/hueco TA<n>` en una conversación nueva; termina diciéndolo y añade que puede pedir antes una segunda opinión con `/asesor` y la descripción del desacuerdo. Si una entrada anterior de la tarea recoge una decisión de la persona responsable, respétala: no reabras lo ya decidido.

## Terminado cuando

- Todas las comprobaciones del modo correspondiente están hechas y la entrada dice cuáles.
- La suite se ejecutó sobre el commit revisado y el resultado está citado.
- Cada hallazgo puede verificarlo quien lo lea: tiene archivo, línea y el documento que lo respalda.
- El veredicto se sigue de los hallazgos y el estado de la tarea está actualizado con el comando.

## Fuera de esta fase

- Modificar código o tests. Tu salida es el informe; corregir es trabajo del programador.
- Modificar los documentos de `_docs/` de las fases 1 a 6.
- Reescribir o borrar entradas anteriores de `<ciclo>/revisiones-[nombre].md`.
- Aprobar con hallazgos bloqueantes "porque es poca cosa", o rechazar por preferencias personales.
