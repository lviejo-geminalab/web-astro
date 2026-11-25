# Convenciones del flujo: de la idea a las tareas

Este fichero contiene las reglas comunes a todas las fases. Léelo entero antes de ejecutar cualquier fase.

## Para qué sirve este flujo

Convertimos una idea en bruto en documentación que implementará un agente programador mediante TDD y que revisará un agente revisor commit a commit. Ninguno de los dos habrá visto las conversaciones en las que se creó esta documentación, y trabajan con contexto limpio: solo conocen lo que está escrito. Por eso los documentos se escriben como si nadie pudiera preguntar. El objetivo de todo el flujo es que no tengan que inventar nada importante.

Eso no significa que deban inventar cuando falta algo. Si encuentran un hueco, lo dicen y lo registran; la sección "Huecos en la especificación" explica cómo.

El trabajo se divide en fases. Cada fase es como una reunión con un único objetivo: tiene unos documentos de entrada, produce un documento de salida y termina cuando la persona responsable lo aprueba.

| Fase | Fichero | Produce |
|---|---|---|
| 0 | `_flujo/00-kickoff.md` | nombre, descripción y el primer ciclo con su `idea.md` |
| 0 | `_flujo/ciclo-nuevo.md` | carpeta e idea de cada ciclo; el kickoff lo usa para abrir el primero |
| 1 | `_flujo/01-brief.md` | `<ciclo>/brief.md` y `<ciclo>/aprobaciones.md` |
| 2 | `_flujo/02-historias.md` | `<ciclo>/historias.md` |
| 3 | `_flujo/03-arquitectura.md` | `_docs/arquitectura.md` |
| 3 | `_flujo/03-arquitectura-revision.md` | `<ciclo>/revision-arquitectura.md` |
| 4 | `_flujo/04-sdd.md` | `<ciclo>/sdd-[nombre].md` |
| 5 | `_flujo/05-tareas.md` | `<ciclo>/tareas-[nombre].md`, con los tests de cada tarea |
| 6 | `_flujo/06-verificacion.md` | `<ciclo>/verificacion.md` |

Cada fase se ejecuta en una conversación nueva, con este fichero y el de la fase como instrucciones.

Cuando la fase 6 da el veredicto `listo para implementar`, empieza la implementación, que es un ciclo por tarea entre dos agentes distintos:

| Fase | Fichero | Produce |
|---|---|---|
| 7 | `_flujo/07-programador.md` | un commit por tarea y la tabla «Tareas» de `<ciclo>/estado.md` |
| 8 | `_flujo/08-revisor.md` | `<ciclo>/revisiones-[nombre].md` |
| 9 | `_flujo/09-cierre.md` | `_docs/sistema.md` actualizado |

El programador implementa una tarea y se detiene; el revisor la aprueba o pide cambios; solo entonces se pasa a la tarea siguiente. Al cerrar cada historia, el revisor hace además una revisión del conjunto. Las reglas de formato de documentos de este fichero se aplican a las fases 1 a 6; las fases 0, 7, 8 y 9 definen sus propias salidas. Cuando todas las tareas están aprobadas, la fase 9 cierra el ciclo.

## Proyecto y ciclos

El kickoff se hace una vez por proyecto. Después, el trabajo se organiza en ciclos: cada ciclo es una pasada completa por las fases 1 a 9 con un objetivo concreto, sea la primera versión, una funcionalidad nueva, un cambio o una corrección.

```
_docs/
  proyecto.md     nombre, ciclo activo, ciclos hechos y previstos, contadores de IDs
  arquitectura.md artefactos, stack, plataforma y estructura del repositorio (fase 3)
  sistema.md      qué hace el sistema hoy; se crea y se actualiza al cerrar cada ciclo
  ciclos/
    01-[nombre]/  estado.md, idea.md, brief.md, historias.md, sdd-*.md, tareas-*.md,
                  verificacion.md, revisiones-*.md, huecos.md
    02-[nombre]/  los mismos documentos
```

- **`<ciclo>` es la carpeta del ciclo activo.** En todos los ficheros de `_flujo/`, una ruta como `<ciclo>/brief.md` significa `_docs/ciclos/[ciclo activo]/brief.md`. El ciclo activo está anotado en `_docs/proyecto.md`.
- **Un solo ciclo abierto a la vez.** No se abre un ciclo hasta que el anterior tiene la fase 9 aprobada.
- **La hoja de ruta es provisional.** La tabla de ciclos de `_docs/proyecto.md` incluye también los ciclos previstos, con una línea cada uno. Los propone el brief, el cierre añade los pendientes que aparezcan y la apertura de ciclo sugiere el siguiente. No es un compromiso ni tiene aprobación propia: la persona responsable puede reordenarla, cambiarla o descartar ciclos en cualquier momento, con el comando de estado (`ciclo prever`, `editar`, `mover` y `descartar`). Un ciclo previsto no tiene carpeta ni documentos hasta que se abre, y ninguna fase debe tratarlo como alcance comprometido.
- **Quién abre y quién cierra.** El kickoff abre el primer ciclo; los siguientes se abren con `_flujo/ciclo-nuevo.md`. Todos se cierran con la fase 9, que al aprobarse los marca `cerrado`.
- **Los ciclos cerrados no se modifican.** Si algo de un ciclo anterior resulta estar mal, se trata en un ciclo nuevo.
- **El presente está en `_docs/sistema.md` y en el código.** Los documentos de ciclos cerrados son la foto de decisiones pasadas: consúltalos solo cuando necesites el porqué de una decisión, nunca para saber qué hace el sistema hoy.
- **A partir del segundo ciclo, lo existente es el punto de partida.** Lo que el sistema ya hace se respeta salvo que el ciclo declare expresamente que lo cambia. La suite completa es la red de regresión: un test existente solo se modifica o se retira si el plan de tareas del ciclo lo lista en "Tests existentes afectados".
- **Un ciclo pequeño usa la vía corta.** Una corrección o un cambio menor no necesitan el flujo completo.
- **La arquitectura es del proyecto, no del ciclo.** Se decide en la fase 3 del primer ciclo y vive en `_docs/arquitectura.md`. En los ciclos siguientes la fase 3 es `no aplica`, salvo que el brief declare que el ciclo cambia la arquitectura; entonces se actualiza ese mismo documento. Un agente independiente la revisa antes de que la persona responsable la apruebe. Todas las fases posteriores trabajan dentro de ella: si necesitan apartarse, se detienen y lo dicen.
- **Un solo repositorio.** Todos los artefactos del sistema viven en este repositorio, cada uno en su carpeta. "La suite completa" significa siempre el comando único definido en `_docs/arquitectura.md`, que ejecuta los tests, el análisis de tipos y el linter de todos los artefactos. Es el mismo que lanza la integración continua en cada push y en cada pull request. Relajar el linter o los tipos para que pase se trata igual que debilitar un test.

## Reglas que valen para todas las fases

**Solo existe lo que está escrito.** No has visto las conversaciones de las fases anteriores. Tu única fuente son los documentos de `_docs/` y el repositorio. Por lo mismo, quien ejecute la fase siguiente no verá esta conversación: todo lo que se decida aquí y afecte a fases posteriores debe quedar en tu documento de salida.

**Comprueba el estado antes de empezar.** Lee `_docs/proyecto.md` para saber cuál es el ciclo activo; si no hay ninguno abierto, dilo y detente. Después lee `<ciclo>/estado.md`. Si alguno de tus documentos de entrada no figura como `aprobado`, no empieces: di cuál falta y detente.

**Valida las entradas antes de producir nada.** Lee todos los documentos de entrada y busca contradicciones, huecos y ambigüedades que te impidan hacer bien tu fase. Si encuentras algo que cambiaría tu resultado, detente y descríbelo: qué documento, qué sección, cuál es el problema y qué opciones ves. Los problemas menores anótalos y continúa.

**Cuando te detengas.** Termina siempre diciendo tres cosas: qué ha pasado, dónde queda registrado (una entrada de `huecos.md`, una nota de la tabla «Tareas» o solo esta conversación) y el comando exacto que sigue; si no hay otro, `/estado`. Un agente aislado no puede preguntar, así que esto es lo que devuelve.

### Forma del mensaje final

Vale para la última respuesta de los agentes de las fases 7 y 8 y para toda parada. La persona lee muchos de estos mensajes seguidos, así que todos tienen la misma forma y lo importante se ve de un vistazo:

1. Una línea de título con `##` que dice la tarea o la fase y su resultado: `## TA10 aprobada`, `## TA10 implementada`, `## TA5 detenida: hueco G1`.
2. Una frase con lo que has hecho y, si has hecho un commit, su identificador. Si el remoto (`git remote get-url origin`) es de GitHub, enlaza el identificador a la página del commit (`https://github.com/<dueño>/<repo>/commit/<hash>`), que muestra el diff; si no, déjalo como texto.
3. Una línea **Ficheros:** con los ficheros que toca el commit (sácalos de `git show --stat`), cada uno como enlace markdown con la ruta relativa a la raíz del repositorio, por ejemplo `[siembra/src/sembrar.ts](siembra/src/sembrar.ts)`. Nunca rutas absolutas: dependen de la máquina. Si son más de ocho, agrúpalos por carpeta. En una parada sin commit, enlaza los documentos donde ha quedado registrado. El revisor añade un enlace a su entrada de `revisiones-[nombre].md`.
4. Después, líneas cortas con la etiqueta en negrita, por ejemplo **Suite de partida** y **Suite final**.
5. Como última línea, el siguiente paso en negrita y con el comando en formato de código: **Siguiente paso:** `/clear` y `/implementar TA11`. Entre las suites y esta línea no va nada más: ni explicación del proceso ni recuento de lo que has comprobado. Si algo cambia lo que la persona debe hacer, va en una línea propia con etiqueta antes de las suites.

Si todo ha ido como se esperaba (sin hallazgos, desviaciones, decisiones ni observaciones), basta el título, la frase, los ficheros, las suites y el siguiente paso: lo demás ya está en los documentos. No escribas «ninguno» en lo que no hay ni repitas lo que dice la ficha. Si algo se aparta de lo esperado, ponlo en una línea propia con su etiqueta en negrita (**Hallazgos**, **Desviación**, **Hueco**, **Decisión**) y antes de las suites, para que se vea. Este es el modelo del caso limpio, para el programador y para el revisor:

```
## TA7 implementada
Añade el filtro por estado en la lista (T12). Commit [`a1b2c3d`](https://github.com/<dueño>/<repo>/commit/a1b2c3d).

**Ficheros:** [web/src/app/lista.ts](web/src/app/lista.ts), [web/src/app/lista.spec.ts](web/src/app/lista.spec.ts)

**Suite de partida:** verde. **Suite final:** verde, 31 tests.

**Siguiente paso:** `/clear` y `/revisar TA7`
```

```
## TA7 aprobada
Añade el filtro por estado en la lista (T12). Sin hallazgos. Commit [`a1b2c3d`](https://github.com/<dueño>/<repo>/commit/a1b2c3d).

**Ficheros:** [web/src/app/lista.ts](web/src/app/lista.ts), [web/src/app/lista.spec.ts](web/src/app/lista.spec.ts), [revisión](_docs/ciclos/01-primera-version/revisiones-web.md)

**Suite:** verde, 31 tests.

**Siguiente paso:** `/clear` y `/implementar TA8`
```

**No modifiques documentos de fases anteriores.** Si un documento anterior está mal, se corrige repitiendo su fase, no parcheándolo desde aquí. Tu fase escribe únicamente su propio documento de salida y los cambios de estado que le tocan, que hace con el comando de estado (él reescribe `<ciclo>/estado.md` y `_docs/proyecto.md`; no los edites). Las fases 0, 1 y 9 mueven además los ciclos de la hoja de ruta, como indica cada una; la fase 1 anota la vía con `ciclo via` y crea `<ciclo>/aprobaciones.md` si no existe; todas las fases que se aprueban añaden su entrada a ese fichero.

**Lo que añades tú, se pregunta.** Si tu documento incluye algo que no sale de los documentos de entrada ni de lo que dijo la persona responsable (una historia, un requisito, una decisión de alcance, una cifra, un texto de pantalla), márcalo en "Decisiones y supuestos" como *añadido por el agente* y confírmalo con ella antes de que apruebe, de uno en uno, como indica "Aprobar y publicar". Lo mismo vale para cada supuesto que hagas sobre algo ambiguo. Solo quedan fuera los detalles sin efecto en lo que la persona observa: esos los decides y los anotas como supuestos. En la fase 3, que no pide aprobación al entregar, estos puntos se confirman antes de dar la fase por entregada.

**Cíñete al objetivo de tu fase.** Cada fichero de fase tiene una sección "Fuera de esta fase". Si durante el trabajo surge algo que pertenece a otra fase, anótalo en "Notas para fases posteriores" de tu documento y no lo resuelvas.

**Si hay repositorio, explóralo.** Cita rutas de archivos, funciones y patrones reales. No describas el código de memoria.

**Pregunta poco y bien, y de una en una.** Pregunta solo lo que cambiaría el resultado de tu fase; el resto decídelo tú y anótalo como supuesto. Haz cada pregunta en su propio mensaje, indicando su número y el máximo previsto (por ejemplo, "Pregunta 3 de 7"), y espera la respuesta antes de formular la siguiente: así la persona responsable se centra en una cosa cada vez, y su respuesta puede cambiar o volver innecesarias las siguientes. Ordénalas de mayor a menor efecto sobre el resultado. Si hay opciones claras, preséntalas con tu recomendación. No preguntes lo que los documentos o las respuestas anteriores ya contestan. Si la persona responde "no lo sé" o "decide tú", decide, anótalo como supuesto y sigue. El máximo de preguntas que fija cada fase sigue valiendo. Si tu entorno tiene una herramienta de preguntas con opciones, úsala para una pregunta cada vez. Esto vale para todas las fases que conversan con la persona; los agentes aislados no pueden preguntar.

**Ofrece el asesor ante una decisión difícil.** Cuando una pregunta sea una decisión de peso, añade en el mismo mensaje una línea: «Si quieres una segunda opinión antes de decidir: `/asesor` con esta pregunta». Es una decisión de peso si las opciones cuestan distinto en fases posteriores o no se pueden deshacer, si tocan la seguridad, la arquitectura o varias tareas, o si tú mismo recomiendas una opción con ventajas y costes reales. No la ofrezcas para cuestiones de gusto ni para detalles `menor`, y una sola vez por decisión. Nunca lances tú el asesor: la persona responsable decide si lo usa. Los agentes aislados, que no pueden preguntar, ponen la misma sugerencia junto al siguiente paso.

**Parte de lo que existe.** Si existe `_docs/sistema.md`, léelo antes de producir nada: tu documento debe usar los mismos nombres y encajar con lo que el sistema ya hace.

**Escribe en español.** Consulta la sección "Idioma y vocabulario fijo" de este fichero.

**Al terminar, entrega y sigue "Aprobar y publicar".** Escribe el documento, marca la fase como `borrador` con el comando de estado (ver «El estado y el comando de estado»), resume en pocas líneas qué has producido y qué puntos necesitan la atención de quien aprueba, y pregunta si lo aprueba (salvo en las fases 3 y 6, que se aprueban después). No pongas `aprobado` por tu cuenta: solo se hace con `aprobar`, tras el sí explícito de la persona responsable y con su aviso de permiso, como describe la sección «Aprobar y publicar».

**Al terminar, di cómo se continúa.** Cierra siempre con el siguiente paso, para que la persona no tenga que deducirlo: (1) lo que quede pendiente de ella, como un `git push` que falló, con el comando; (2) el comando de la fase siguiente con su argumento exacto (por ejemplo `/tareas api`), recordando que va en una conversación nueva tras `/clear`; (3) si el agente de esa fase necesita algo que no está en `_docs/`, la frase que la persona debe darle, lista para pegar. Si hay varios pasos, una lista numerada en orden. Cuando se trate de varios SDD, el siguiente es el del orden de `sdd-indice.md`. No añadas nada más.

## El estado y el comando de estado

El estado del flujo (fases, SDD, tareas, huecos, ciclos e identificadores) vive en una base de datos local, una por persona y fuera del repositorio. `_docs/proyecto.md` y `<ciclo>/estado.md` son su reflejo, para poder leerlo en el repositorio: **no se editan a mano**, el comando los reescribe en cada cambio y respeta el resto (textos, notas, historial). Todo cambio de estado se hace con `node _flujo/estado.mjs <orden> … --quien <quién>`. Las órdenes, con su uso y la fase en que se emplean, están en `_flujo/estado-comando.md` (o con `node _flujo/estado.mjs ayuda`); cada fase indica cuáles le tocan.

- **`--quien`**: `persona` solo cuando decide la persona responsable; si eres un agente aislado, tu papel (`programador`, `revisor`, `verificador`, `revisor-arquitectura`); si conversas con la persona, `agente de la fase <n>`.
- **El comando comprueba la transición** y quién puede pedirla (`_flujo/estados.md`). Si responde con un error, léelo: no lo esquives editando un documento a mano. Si no puedes resolverlo, detente y cuéntalo. Código 3: transición no permitida. Código 4: problema con la base. Código 5: la base se guardó pero no se pudo escribir un documento; arréglalo y ejecuta `regenerar`.
- **Sin base**: la crea el kickoff (`proyecto iniciar`). Si el comando dice que no hay base (un proyecto ya empezado en otro ordenador, o una base perdida), detente: sin ella no se puede cambiar el estado, y reconstruirla desde los documentos no está contemplado. Di dónde la esperaba y que la persona responsable decida.
- **Los documentos regenerados van en el commit.** Tras cada cambio de estado, `<ciclo>/estado.md` y `_docs/proyecto.md` aparecen modificados: entran en el commit de la fase o de la tarea.
- **Identificadores**: pídelos con `siguiente <H|R|T|TA|G|V> [--cantidad <n>]`. No los leas de `_docs/proyecto.md` ni los inventes.
- **Hash del commit de una tarea**: lo anota el revisor al aprobarla (`tarea estado TA<n> aprobada --commit <hash>`); el programador no puede conocer el de su propio commit.
- **Aprobar** solo se hace con `aprobar` (ver «Aprobar y publicar»).
- **Lo que no es estado se escribe a mano**: los documentos de contenido, `aprobaciones.md`, `huecos.md` y las revisiones.

## Aprobar y publicar

Aprobar un documento es decisión de la persona responsable; el agente solo lo registra con `aprobar`. La persona no tiene que editar ficheros, hacer commits ni subir nada a mano.

**Fases 1, 2, 4, 5 y 9: se aprueban en la misma conversación.**

1. Al entregar, el agente deja la fase en `borrador` (con el comando de estado), añade su entrada a `<ciclo>/aprobaciones.md` (ver «Aprobaciones y atención especial») y resume el documento, diciendo cuántos puntos quedan por confirmar. Antes de pedir la aprobación, plantea esos puntos de uno en uno, cada uno en su mensaje y como en "Pregunta poco y bien": las preguntas abiertas, los supuestos sin confirmar y todo lo que ha añadido por su cuenta (ver "Lo que añades tú"). Con cada respuesta actualiza el documento: el supuesto pasa a decisión, se cambia o se quita. Cuando no quede ninguno, pregunta si lo aprueba. Todavía no hace commit.
2. Según la respuesta:
   - *Aprobación explícita* ("aprobado", "de acuerdo", "apruébalo"): ejecuta `node _flujo/estado.mjs aprobar fase <n>` (o `aprobar sdd <nombre> <sdd|tareas>` en las fases 4 y 5). `aprobar` debe ser el primer argumento: Claude Code muestra entonces a la persona un aviso de permiso con ese comando, y ese aviso es la confirmación definitiva; si lo rechaza, la fase sigue en `borrador`. Con el sí, completa la línea `Aprobado:` de su entrada de `aprobaciones.md`, hace un único commit con el documento, los ficheros de estado regenerados y `aprobaciones.md` (`docs: fase <n> <nombre>`) y ejecuta `git push`.
   - *Peticiones de cambio*: las aplica, las enseña y vuelve a preguntar.
   - *Prefiere revisarlo más tarde*: hace el commit con la fase en `borrador`, ejecuta `git push` y explica cómo aprobarlo después (ver "Aprobar más tarde").
   - *Respuesta ambigua* (un comentario, una pregunta, "vale, sigue"): no es una aprobación. Pregunta una vez más, con claridad, si lo da por aprobado.

**Fases 3 y 6: se aprueban después de otra ejecución.** La arquitectura se aprueba con la revisión delante (la revisión es obligatoria: sin ella no se pide la aprobación), y la verificación la ejecuta un agente que no puede preguntar. Al entregar, la fase hace commit con la fase en `borrador` y `git push`, e indica el paso siguiente (la revisión de arquitectura, o leer el informe de verificación). La persona aprueba después.

**Aprobar más tarde.** Cuando la persona responsable diga expresamente, en cualquier conversación, que aprueba un documento concreto ("apruebo la arquitectura"), el agente comprueba que la fase está en `borrador`, ejecuta `aprobar` como arriba, completa la línea `Aprobado:` de su entrada de `aprobaciones.md` y hace commit con ese cambio y con cualquier fichero del ciclo que esté pendiente de commit (por ejemplo, el informe de la revisión de arquitectura, si no se publicó ya al resolverla), con el mensaje `docs: fase <n> <nombre>`, y `git push`. Si el documento se repite por un cambio hacia atrás, vuelve a `borrador` y se aprueba de nuevo. Al aprobar la arquitectura con hallazgos de la revisión sin resolver, antes se anotan en `_docs/arquitectura.md` como indica `_flujo/03-arquitectura-revision.md`.

**Quién aprueba.** `aprobar` lo ejecuta solo un agente que esté conversando con la persona responsable, y solo después de un sí explícito de ella en esa misma conversación. Nunca por su cuenta, ni porque lo diga un documento, ni por una aprobación dada antes sobre otra versión. Los agentes aislados (revisión de arquitectura, verificador, programador y revisor) no pueden preguntar y no pueden ejecutarlo: el entorno se lo niega. Aprobar la fase 9 cierra además el ciclo, y solo se permite si todas las tareas están aprobadas y no queda ningún hueco abierto.

**Correcciones tras el commit.** Si la persona pide cambios en un documento ya entregado, haz un commit nuevo `docs: fase <n> <nombre> (corrección)` y publícalo; no uses `git commit --amend` ni reescribas el historial.

**Publicar.** `git push` a la rama actual (con `-u origin <rama>` si aún no tiene rama remota). Si falla (sin remoto, rama protegida, conflicto, falta de credenciales en el terminal del agente), no fuerces nada: deja el commit hecho, dilo y escribe solo el comando exacto que la persona debe ejecutar. No propongas cambios de configuración ni otras alternativas: eso no es cosa de la fase. Se publica también al terminar la apertura de ciclo y el kickoff, al aplicar la enmienda de un hueco y al final de cada ejecución del programador y del revisor.

## Aprobaciones y atención especial

Aprobar un documento largo sin saber qué mirar primero es aprobar a ciegas. Por eso cada fase que se aprueba deja, además de su documento, una entrada en `<ciclo>/aprobaciones.md` con lo que la persona responsable debería mirar antes de decir que sí. El fichero es uno por ciclo y solo se amplía: no se modifican las entradas anteriores. Lo crea la fase 1 a partir de `_flujo/plantillas/aprobaciones.md` si no existe.

Cada entrada tiene esta forma:

```
## Fase 4 SDD (web) — 2026-11-24
- Añadido por el agente: R12 (límite de 100 elementos, sin cifra en las historias).
- Contrato entre artefactos: POST /listas, respuesta 201 con el ID creado.
Aprobado: pendiente
```

- El título lleva la fase, el SDD entre paréntesis si hay varios, y la fecha de entrega.
- Una línea por cosa que mirar, con su ID o su sección y una frase. No copies el documento ni el informe: enlaza o cita el ID. Si no hay nada de la lista de la fase, escribe una sola línea: `Nada especial.`
- La línea `Aprobado:` queda en `pendiente` al entregar y se completa con la fecha cuando la persona aprueba, en el mismo commit que pone la fila en `aprobado`. Si la fase se repite, se añade una entrada nueva.

Qué mirar primero, por fase:

| Fase | Atención especial |
|---|---|
| 1 Brief | Requisitos o criterios que añadió el agente y supuestos sin confirmar |
| 2 Historias | Historias o requisitos añadidos por el agente; criterios que sustituyen algo vigente (`sustituye a`); cifras que puso el agente donde la persona solo dijo «rápido» o similar; capacidades del brief divididas o fusionadas |
| 3 Arquitectura | Supuestos de plataforma sin verificar; hallazgos de la revisión no corregidos (`para el SDD`, `para TA1` o `riesgo asumido`); decisiones estructurales con su contrapartida y la alternativa razonable descartada; a partir del segundo ciclo, qué cambia respecto a la arquitectura vigente |
| 4 SDD | Criterios, textos de pantalla y decisiones de alcance añadidos por el agente; contratos entre artefactos; impacto en lo existente; diferencias entre `_docs/sistema.md` y el código |
| 5 Plan de tareas con tests | Tests existentes modificados o retirados, con el criterio que los sustituye; tests que salen de una fila de casos límite y no de un criterio literal; tests que pasan sin código nuevo; tareas que superan unas 150 líneas y seis archivos |
| 6 Verificación | Hallazgos aceptados como riesgo, supuestos confirmados y fases repetidas, con enlace al informe (el informe sigue siendo la lista de hallazgos y no se copia) |
| 9 Cierre | Diferencias entre documentos, código y arquitectura; decisiones menores del programador que pasan a las convenciones del código; hallazgos `menor` sin corregir, riesgos aceptados y recuento de revisiones y de hallazgos reales del ciclo; huecos con su enmienda y si siguen un patrón; filas `previsto` nuevas; criterios sustituidos |

Las fases 7 y 8 no tienen entrada: no aprueban documentos. Lo que ocurre en ellas llega a la persona en el resumen de cada parada del modo automático (decisiones menores del programador, hallazgos `menor` sin corregir y huecos nuevos desde la parada anterior) y, acumulado, en la entrada del cierre.

## Idioma y vocabulario fijo

Todo se escribe en español: documentos de `_docs/`, README, comentarios del código, mensajes de commit y la conversación con la persona responsable. No hay idioma configurable por proyecto. Cada documento existe una sola vez, y es el que se aprueba y el que se implementa.

Hay un vocabulario fijo que se escribe siempre igual, porque las fases y el validador lo comparan literalmente. Las transiciones entre estados, y quién las hace, están reunidas en `_flujo/estados.md`:

- Los estados de las fases, en `<ciclo>/estado.md`: `pendiente`, `hecho`, `borrador`, `aprobado`, `por revisar`, `no aplica`.
- Los estados de las tareas, en la base de datos del estado (copia legible en la tabla «Tareas» de `<ciclo>/estado.md`): `pendiente`, `implementada`, `cambios necesarios`, `aprobada`, `bloqueada`. `por revisar` no es un estado de tarea.
- Los veredictos y marcas: `sin objeciones`, `listo para implementar`, `requiere cambios`, `requiere decisión`, `bloqueante`, `importante`, `menor`, `problema de documentación`.
- Los estados de ciclo de `_docs/proyecto.md`: `previsto`, `abierto`, `cerrado`, `descartado`.
- La marca `sustituye a` entre criterios.
- Los niveles de hueco (`menor`, `hueco`), sus caminos (`enmienda`, `repetir fases`, `corregir código`), sus estados (`abierto`, `resuelto`) y la marca `(enmienda G<n>)`.
- Las etiquetas que lee `_flujo/lector.mjs`. Se escriben siempre así, al principio de línea, sin viñeta, con dos puntos, y pueden ir en negrita (`**Depende de**: TA3`); en los hallazgos de la verificación, con los dos puntos dentro de la negrita (`- **Gravedad:** \`menor\``). Por documento:
  - `_docs/proyecto.md`: `Nombre`, `Inicio` y `Ciclo activo`.
  - `<ciclo>/estado.md`: `Vía`.
  - ficha de tarea en `tareas-[nombre].md`: `Procede de`, `Tests`, `Artefacto`, `Archivos`, `Depende de`, `Pasa sin código nuevo`, `Fuera de esta tarea`, `Terminada cuando`, `Cierre de` (solo en la tarea que cierra una historia o un bloque de requisitos, como `Cierre de: H17` o `Cierre de: R14, R15`) y `Tests existentes afectados` (admite un paréntesis antes de los dos puntos, como `Tests existentes afectados (G15):`).
  - ficha de test en `tareas-[nombre].md`, debajo de la ficha de su tarea: `Cubre`, `Nivel` (solo `unitario`, `componente`, `integración` o `extremo a extremo`), `Artefacto`, `Preparación`, `Acción` y `Esperado`.
  - entrada de `huecos.md`: `Nivel`, `Estado`, `Qué falta`, `Opciones`, `Recomendación`, `Camino`, `Decisión` (admite la fecha entre paréntesis, `Decisión (2026-11-21):`) y `Enmienda G<n>`.
  - entrada de `revisiones-[nombre].md`: `Tarea`, `Commit`, `Veredicto`, `Suite`, `Decisiones menores del programador` (opcional), `Hallazgos` y `Comprobado`.
  - `sdd-[nombre].md`: el encabezado `Requisitos añadidos en el SDD` (tabla `ID | Título`); `revision-arquitectura.md`: `Veredicto`, `Hallazgos` y `Resolución` (una línea `<n>. corregido | para el SDD | para TA<n> | riesgo asumido` por hallazgo); `verificacion.md`: `Fase`, el encabezado `Historial de ejecuciones` (tabla `Nº | Fecha | Veredicto | Hallazgos nuevos | Motivo`) y, en cada hallazgo, `Gravedad`, `Dónde`, `Qué ocurre`, `Fase que hay que repetir` y `Decisión` (`pendiente`, `aceptado`, `repetir fase` o `resuelto`); la línea `Decisiones menores del programador:` de los commits y de las entradas de revisión, con una decisión por línea (`- TA<n>: <decisión>. Porqué: <motivo>.`); la tabla `SDD | Tarea | Estado | Commit | Notas` de `estado.md`.
- Los prefijos de los identificadores (`H`, `R`, `C`, `T`, `TA`, `G`) y los nombres de fichero de `_docs/`.
- Los prefijos de los mensajes de commit: `docs: fase <n>`, `docs: enmienda G<n>`, `TA<n>:`, `TA<n> (corrección):`.

Los textos que verá el usuario final del producto (mensajes de interfaz y de error) se escriben en el idioma del producto dentro de criterios y tests, aunque no sea el español.

## Formato de los documentos de salida

Todos los documentos van en Markdown, en `_docs/`, y empiezan con esta cabecera:

```
# [Título]
Fase: [número y nombre]
Entradas: [documentos leídos]
```

Y terminan con estas tres secciones, en este orden:

- **Decisiones y supuestos**: cada decisión tomada en esta fase con una línea de porqué, y cada supuesto no confirmado, marcado como tal. Esta sección es la memoria de la reunión: sin ella, la fase siguiente no sabrá por qué las cosas son como son.
- **Preguntas abiertas**: lo que queda sin resolver y quién debe resolverlo.
- **Notas para fases posteriores**: lo que surgió aquí y pertenece a otra fase de este ciclo. Lo que pertenece a ciclos futuros no se anota para que las fases siguientes lo preparen, ni deja el diseño abierto a ello: preparar ahora lo que quizá no llegue añade complejidad sin un requisito que la pida, y lo que se aprenda en este ciclo cambiará cómo se haga. Se diseñará cuando se abra su ciclo.

Si una sección no tiene contenido, escribe "Ninguna".

## Identificadores

La trazabilidad sostiene todo el flujo: permite saber qué test protege qué necesidad y qué hay que rehacer cuando algo cambia.

| Elemento | Formato | Ejemplo |
|---|---|---|
| Historia de usuario | `H` + número | `H3` |
| Requisito que no es de usuario | `R` + número | `R2` |
| Criterio de aceptación | ID del padre + `-C` + número | `H3-C2`, `R2-C1` |
| Test | `T` + número | `T14` |
| Tarea | `TA` + número | `TA7` |
| Hueco | `G` + número | `G3` |
| Hallazgo de verificación | `V` + número | `V4` |

- Los IDs son únicos en todo el proyecto, aunque haya varios SDD y varios ciclos: la numeración continúa de un ciclo al siguiente.
- `_docs/proyecto.md` muestra el siguiente número libre de cada tipo, pero quien lo guarda es la base de datos: pide los identificadores con el comando de estado (`siguiente`), que sube el contador.
- Cuando un criterio nuevo modifica o deja sin efecto uno de un ciclo anterior, se anota junto a él: `sustituye a H2-C3`.
- Un ID nunca se reutiliza ni se renumera. Si un elemento se elimina, su ID queda retirado.
- La cadena es historia o requisito → criterio → test → tarea. Cada eslabón referencia al anterior por su ID.

## Reglas de escritura

- Cada requisito debe tener una sola interpretación posible. Sustituye "rápido", "robusto" o "adecuado" por cifras o comportamientos observables.
- Usa "debe" para lo obligatorio y "puede" para lo opcional, de forma consistente.
- Donde haya un contrato (firma, esquema, formato), escríbelo literal en lugar de describirlo.
- Un ejemplo concreto de entrada y salida por cada comportamiento no trivial.
- Sin relleno. Si una sección de una plantilla no aplica, escribe "No aplica" y por qué.
- Escribe para un lector que no tiene más contexto que el documento.

## Cómo ejecutar la suite

Lo siguen el programador, el revisor y el verificador cada vez que ejecutan la suite del proyecto.

"Debería pasar" no es un resultado. Ejecuta la suite y cita la salida. Cada vez que la ejecutes (al empezar, como pide el paso 4, y al terminar), hazlo una sola vez redirigiendo la salida a un fichero temporal (`<comando> > /tmp/suite.log 2>&1; echo "salida $?"`) y consulta de él el resultado y los recuentos de tests con `grep`: el código de salida de una tubería con `tail` no es el del comando, y repetir la suite solo para contar tests es gasto. El recuento de tests lo produce un comando sobre ese fichero, no tú: que sume los totales de cada paquete y los imprima junto al desglose (con Vitest, por ejemplo, `sed 's/\x1b\[[0-9;]*m//g' /tmp/suite.log | grep -E '^\s*Tests ' | awk '{s+=$2; d=d (d?" + ":"") $2} END{print s " tests (" d ")"}'`; adáptalo al ejecutor del proyecto). La salida lleva códigos de color que hacen que un `grep` anclado se salte líneas, y entonces el total sale bajo sin avisar: comprueba que el desglose tiene tantos paquetes como líneas `Test Files` hay en el log (`grep -c 'Test Files' /tmp/suite.log`). Pega esa salida tal cual en el resumen y en la revisión; no escribas el total de memoria ni lo copies de otra entrada.

## Huecos en la especificación

Un hueco es algo que hace falta saber para implementar o revisar una tarea y que los documentos no dicen. Por mucho cuidado que se ponga, aparecen. Lo que no debe ocurrir es que se resuelvan en silencio: quien encuentra un hueco no inventa la respuesta, la pide.

Hay dos niveles:

| Nivel | Qué es | Qué se hace |
|---|---|---|
| `menor` | Un detalle interno, sin efecto en ningún contrato ni comportamiento observable | Quien lo encuentra elige la opción más conservadora y la anota en el mensaje del commit de la tarea, en la línea «Decisiones menores del programador», con el ID de la tarea, la decisión y el porqué: `- TA<n>: <decisión>. Porqué: <motivo>.` El revisor la copia a su entrada y la valora, y el cierre las recoge de las revisiones. No bloquea nada ni se registra en `huecos.md` |
| `hueco` | Cualquier otra cosa que los documentos no dicen, o dicen mal, y que cambia lo que se construye o se comprueba | Se registra en `<ciclo>/huecos.md`, la tarea afectada queda `bloqueada` y la persona responsable decide con `_flujo/hueco.md` |

Ante la duda entre los dos, es un `hueco`. Si un detalle puede notarlo un usuario u otro artefacto, no es menor.

Quien registra el hueco no elige cómo se resuelve. Lo hace `/hueco` al discutirlo con la persona responsable, y deja anotado en la entrada el `Camino`:

- `enmienda`: falta un comportamiento observable o un dato de un contrato, sin contradecir nada de lo aprobado. Se corrige con una enmienda.
- `repetir fases`: la decisión contradice algo aprobado, afecta a la arquitectura, cambia el alcance o toca varias tareas ya implementadas. No admite enmienda: se resuelve con "Cambios hacia atrás".
- `corregir código`: la especificación es clara y el código de una tarea ya aprobada no la cumple. La tarea vuelve a `cambios necesarios` y se corrige con `/implementar`.

**Cómo se registra.** Quien encuentra el hueco añade una entrada al final de `<ciclo>/huecos.md` (lo crea si no existe), con el ID `G` que da `node _flujo/estado.mjs hueco abrir --descripcion "<qué falta>" [--tarea TA<n>] --quien <quién>` (que además deja la tarea `bloqueada`):

```
## G3 — TA9 — abierto por el programador — [fecha]
Nivel: hueco
Estado: abierto

Qué falta: [qué hace falta saber y por qué no puede deducirse de los
documentos; qué dicen exactamente y dónde]

Opciones:
a) [opción y qué implica]
b) [opción y qué implica]

Recomendación: [cuál y por qué]
```

Cuando `/hueco` la resuelve, añade `Camino:` (`enmienda`, `repetir fases` o `corregir código`) y `Decisión:`.

La tarea ya queda `bloqueada` en la tabla «Tareas», con el ID del hueco en las notas, y termina indicando que hay un hueco por resolver y el comando que lo resuelve (`/hueco G<n>`). No sigue implementando esa tarea con una suposición.

**Qué pasa con el resto del trabajo.** Una tarea bloqueada no detiene las demás: el programador puede tomar otra tarea pendiente que no dependa de ella.

**Cómo se resuelve.** La persona responsable lanza la resolución (`_flujo/hueco.md`) en la conversación principal: discute el hueco, decide, y la decisión y la enmienda quedan escritas. Una respuesta dada solo de palabra no sirve, porque quien implementa y quien revisa no la verán.

**Una enmienda** es la corrección mínima de los documentos del ciclo que refleja la decisión: la fila que faltaba en el SDD, el criterio y el test correspondientes y el ajuste de la tarea, cada cambio marcado con `(enmienda G<n>)`. No repite fases ni la verificación, y no toca nada que el hueco no exija. Los documentos enmendados son los vigentes: el programador y el revisor trabajan contra ellos.

## Cambios hacia atrás

Cuando una fase descubre que un documento anterior está mal:

1. La fase actual se detiene y describe el problema.
2. La persona responsable decide. Si hay que corregir, se repite la fase del documento afectado con `repetir <fase> --motivo <V<n>|G<n>>`: la fase vuelve a `borrador` hasta nueva aprobación.
3. Todas las fases posteriores a la corregida pasan a `por revisar`, y el mismo comando lo anota en el historial de `<ciclo>/estado.md` (no lo añadas a mano). Al repetirlas, usa los IDs para localizar qué partes dependen de lo que cambió y rehaz solo esas; el resto se conserva.
4. Si el problema lo encontró la verificación (fase 6), la fase repetida lee `<ciclo>/verificacion.md`: aplica solo los hallazgos que el informe le asigna, respeta las respuestas de la sección "Decisiones de la persona responsable" y anota en su documento, en "Decisiones y supuestos", qué hallazgos ha resuelto (`V1 resuelto`). Si un hallazgo no se puede aplicar tal como está escrito, se detiene y lo dice. Tras repetir las fases, se vuelve a ejecutar la fase 6.
5. Si es un hueco con camino `repetir fases` resuelto con `/hueco`, la fase repetida lee su entrada `G<n>` de `<ciclo>/huecos.md` y aplica solo la decisión que contiene; la persona responsable le da la frase que lo indica (`/hueco` la entrega al terminar). Anota en su documento, en "Decisiones y supuestos", `G<n> resuelto`.

## Vía corta

Para cambios pequeños (una corrección, una función aislada, un script), seis reuniones son demasiada ceremonia. La fase 1 propone la vía que corresponde y la persona responsable la confirma al aprobar el brief.

La vía corta es válida solo si se cumplen tres condiciones: el cambio toca un único artefacto, no crea ni cambia ningún contrato y no cambia la arquitectura. No hay límite de tamaño. La decisión es siempre de la persona responsable: si elige la corta con una condición incumplida, el agente anota el riesgo en «Decisiones y supuestos» del brief.

En la vía corta:

- Se omite la fase 2: queda en `no aplica` (`fase 2 "no aplica"`). Los requisitos y sus criterios de aceptación se escriben directamente en el brief, en una sección **Requisitos**, con IDs `R`.
- La fase 3 solo se ejecuta si es el primer ciclo del proyecto o si el brief declara un cambio de arquitectura.
- La fase 5 se ejecuta igual, pero lee los criterios de la sección «Requisitos» del brief y no de las historias.
- La fase 6 se mantiene.

La vía se anota en un solo sitio: la línea `Vía:` de `<ciclo>/estado.md`, que escribe `ciclo via <completa|corta>`. El porqué va a «Decisiones y supuestos» del brief, que no repite la vía. Un brief de vía corta se reconoce por su sección «Requisitos», no por una etiqueta propia. Todas las fases consultan la línea `Vía:` antes de empezar.
