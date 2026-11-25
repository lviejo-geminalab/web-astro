# Fase 5: Plan de tareas con tests

Lee primero `_flujo/convenciones.md`.

## Objetivo

Dividir la implementación en tareas atómicas y ordenadas, y especificar para cada tarea los tests que demostrarán que se cumple. Cada tarea será un commit que el programador implementa en ciclo TDD y que un agente revisor evalúa de forma aislada. El programador escribirá cada test antes que el código que lo hace pasar y no podrá modificarlo: los tests de este documento son el contrato de la implementación, y un test mal especificado obliga a implementar algo incorrecto.

El tamaño de las tareas determina la calidad de la revisión: demasiado grandes y el revisor no ve los errores; demasiado pequeñas y pierde de vista si el conjunto encaja.

## Entradas

- `<ciclo>/sdd-[nombre].md` (debe estar `aprobado`). Si hay varios SDD, esta fase se ejecuta una vez por cada uno.
- `<ciclo>/sdd-indice.md`, si existe.
- `<ciclo>/historias.md` o, en la vía corta, `<ciclo>/brief.md`, para consultar el origen de los criterios.
- `_docs/arquitectura.md`: artefactos y estructura del repositorio.
- `_docs/sistema.md` y la suite de tests existente, a partir del segundo ciclo.
- El repositorio, si existe.

## Antes de empezar

Comprueba el estado y valida las entradas según las convenciones. En particular: que cada criterio del SDD tenga un resultado esperado exacto. Si para escribir un test tendrías que inventar el valor esperado, el SDD está incompleto: detente y dilo. Si repites la fase por un informe de verificación, sigue el punto 4 de "Cambios hacia atrás" de las convenciones.

## Qué es una tarea atómica

Una tarea es atómica cuando cumple todo lo siguiente:

- Añade un único comportamiento observable, cubierto por uno o pocos tests.
- Deja la suite completa en verde al terminar: se puede fusionar sola sin romper nada.
- Se describe en una frase sin usar "y".
- Su diff se revisa en pocos minutos. Como orientación, menos de unas 150 líneas y unos seis archivos. Una tarea que lo supere se divide. Si no se puede dividir porque una parte no tiene comportamiento propio (utilidades de test, tipos, marco de la aplicación), esa parte se mueve al andamiaje o a la primera tarea que de verdad la use; solo como último recurso se deja la tarea grande, y entonces la planteas a la persona como punto para confirmar.
- No crea archivos que solo usa una tarea posterior.
- No se puede dividir más sin que alguna parte deje de ser comprobable por sí sola.

**En un ciclo de presentación visual** (estilos, maquetas), el comportamiento observable es una pieza que se ve (una tarjeta, una fila, una cabecera), no una clase de estilo suelta. Agrupa por pieza y no la trocees en tareas solo para que cada test falle por su propia razón: eso obliga a inventar rojos que luego no se cumplen, y no te preocupes si una parte ya la da otra: el programador demuestra que ese test no está vacío (ver `_flujo/07-programador.md`). No pongas en `Terminada cuando` una evidencia que ningún agente pueda producir; si hace falta una captura, la genera el revisor (ver `_flujo/08-revisor.md`).

El último punto es el límite inferior. No crees tareas que solo preparan terreno sin comportamiento verificable ("crear el archivo", "definir la firma"). La única excepción es el andamiaje inicial (estructura, configuración, dependencias, herramientas de calidad e integración continua), que va agrupado en una sola tarea al principio. En el primer ciclo es obligatoria y crea lo que define `_docs/arquitectura.md`: la estructura de carpetas, la configuración de tests, tipos y linter de cada artefacto, el comando único y el workflow de `.github/workflows/` que lo lanza. Se verifica con que el proyecto arranca y el comando único se ejecuta en verde.

## Proceso

1. **Mira cómo se prueba en el repositorio.** Framework, ubicación y nombres de los archivos de test, utilidades y datos de prueba existentes. Los tests nuevos deben seguir esas convenciones.

2. **Deriva los tests de los criterios**, no del diseño interno. Recorre la sección de criterios de aceptación del SDD y, para cada uno, define los tests necesarios para demostrarlo. Después recorre la tabla de casos límite y errores: cada fila tiene su test. Si una fila no tiene criterio, no la enlaces a uno parecido: cita la fila (`Cubre: SDD sección 6, <situación>`) y dilo entre los puntos a confirmar.

3. **Elige el nivel más bajo que demuestre el criterio.** Los niveles son cuatro, y se escriben siempre así: `unitario` si basta con una función o una clase aislada; `componente` cuando el criterio se comprueba montando una pieza de interfaz con sus dependencias simuladas; `integración` cuando depende de que varias piezas reales colaboren (por ejemplo, el código y una base de datos); `extremo a extremo` solo para los recorridos principales del usuario, con el sistema arrancado. Si ningún nivel encaja, es un hueco de la plantilla: no inventes otro ni abrevies (`e2e`).

4. **Prueba a través de interfaces públicas.** Los tests comprueban comportamiento observable y contratos del SDD. Un test que depende de detalles internos se rompe en cada refactor y deja de proteger nada.

5. **Especifica cada test por completo**: datos de entrada concretos, acción y resultado esperado exacto. Indica qué dependencias externas se sustituyen por dobles de prueba y cómo deben comportarse.

6. **Agrupa los tests en tareas.** Cada tarea toma el test o los pocos tests que describen un mismo comportamiento, y los lleva dentro de su ficha. Todo test pertenece a exactamente una tarea. Si un test protege algo que el código anterior ya cumple (una propiedad que no puede fallar antes de escribirse, como una regresión sobre lo ya construido, o un test de aceptación del tipo «X es aceptado», que se asigna a la tarea que añade la restricción que podría rechazarlo), no lo fuerces: ponlo en la tarea del comportamiento al que protege. Declararlo en la ficha con `Pasa sin código nuevo: T<n>` es opcional, pero ayuda cuando lo sabes de antemano; el programador lo demostrará de todos modos, y el revisor lo comprobará. Cuenta cuántos hay en tu entrada de aprobaciones.

7. **Identifica los tests existentes afectados.** A partir del segundo ciclo, la suite existente es la red de regresión y debe seguir en verde tal como está. Si el ciclo cambia a propósito un comportamiento ya entregado, localiza los tests existentes que lo comprueban y decláralos uno a uno: qué test, si se modifica o se retira, qué criterio marcado `sustituye a` lo justifica y, si se modifica, su nuevo resultado esperado. La modificación o retirada se hace en la tarea que cambia ese comportamiento, y la ficha de la tarea lo indica con `Tests existentes afectados`. Un test existente que no figure en esa lista no puede tocarse durante la implementación.

8. **Separa los refactors.** Si para implementar algo hay que reorganizar código existente, eso es una tarea propia, anterior, que no cambia comportamiento y se verifica con que la suite existente sigue en verde.

9. **Ordena.** Cada tarea se apoya solo en las anteriores. Dentro de cada historia: primero el camino feliz más simple, luego las variantes, luego los errores. Completa una historia antes de empezar la siguiente, salvo que las dependencias obliguen a otra cosa. Cuando una historia cruza varios artefactos, ordena por contrato: primero el artefacto que ofrece el contrato, con sus tests; después el que lo consume, probado contra ese contrato.

10. **Aísla cada tarea.** El revisor la leerá sin haber leído las demás, así que su descripción debe entenderse sola: qué comportamiento añade, dónde, y qué queda expresamente fuera aunque parezca relacionado.

11. **Marca los cierres.** Hay una revisión del diff acumulado, para detectar lo que la revisión tarea a tarea no ve: duplicación, incoherencias entre tareas, deriva respecto al diseño. Si el SDD cubre historias, el cierre va tras la última tarea de cada historia. Si cubre requisitos, va al terminar cada bloque coherente de requisitos (un contrato, una pieza de seguridad, una pantalla), y solo donde haya algo que la revisión tarea a tarea no vea; no pongas uno por cada pocas tareas.

12. **Comprueba cada tarea contra la definición** de tarea atómica. Divide las que usen "y" en su descripción; fusiona las que no tengan comportamiento verificable propio.

13. **Comprueba la cobertura** en los dos sentidos y construye la matriz.

**Qué se pregunta a la persona.** En la entrega, los puntos que planteas a la persona responsable son los huecos y ambigüedades del SDD, los criterios que faltan, las contradicciones con las notas de fases anteriores y los riesgos. Las decisiones de técnica de test (cómo inyectar un fallo, si se prueba una función o un proceso, qué doble usar, qué utilidades crear) y de planificación (el orden de las tareas, en cuál va cada test, dónde se marcan los cierres, qué incluye el andamiaje) las tomas tú y las anotas en "Decisiones y supuestos": no se preguntan, porque no cambian lo que la persona observa.

## Salida

`<ciclo>/tareas-[nombre].md`, con la cabecera y las secciones finales de las convenciones, y este contenido:

1. **Entorno de pruebas**: para cada artefacto implicado, framework y ubicación de los tests según `_docs/arquitectura.md`; el comando único de la suite completa y cómo ejecutar un test aislado; datos y utilidades comunes que habrá que crear.
2. **Resumen**: tabla con ID, descripción, historia, tests y dependencias, en orden de ejecución, con los cierres señalados.
3. **Tareas**: cada una con su ficha y, a continuación, los tests de la tarea. La ficha lleva:
   - ID (`TA` + número) y descripción en una frase. El ID lo da el comando al dar de alta la tarea: `node _flujo/estado.mjs tarea alta --sdd <nombre> --titulo "<descripción>" --quien "agente de la fase 5"` (una llamada por tarea, en el orden del plan; la deja `pendiente` en la tabla «Tareas» de `estado.md`).
   - Procede de: historia o requisito y criterios de los que procede (IDs).
   - Tests: IDs de los tests de la tarea, que aparecen justo debajo.
   - Artefacto, y archivos que crea o modifica. Una tarea toca un solo artefacto siempre que sea posible.
   - Depende de: IDs de tareas previas.
   - Cierre de: IDs de las historias o requisitos que cierra, solo si la tarea es un cierre (`Cierre de: H17` o `Cierre de: R14, R15`).
   - Pasa sin código nuevo: IDs de los tests de la tarea que no pueden fallar antes (opcional, solo si los hay y lo sabes de antemano).
   - Tests existentes afectados: IDs de los tests existentes que la tarea modifica o retira (solo si los hay).
   - Fuera de esta tarea: lo que no debe hacerse aquí.
   - Terminada cuando: los tests indicados pasan y la suite completa está en verde.

   Cada test va como un encabezado de nivel inferior debajo de la ficha de su tarea, con:
   - ID (`T` + número, los da `node _flujo/estado.mjs siguiente T --cantidad <n>`) y nombre descriptivo del comportamiento.
   - Cubre: criterio que cubre (ID).
   - Nivel (uno de los cuatro de arriba) y archivo donde irá (`Nivel: <nivel> — <archivo>`) y artefacto (`Artefacto: <nombre del artefacto, como en _docs/arquitectura.md>`).
   - Preparación: estado y datos de partida, con valores concretos.
   - Acción.
   - Esperado: resultado esperado exacto.
4. **Matriz de cobertura**: tabla de criterios y tests. Todo criterio tiene al menos un test; todo test apunta a un criterio o, en su defecto, a una fila de casos límite del SDD.
5. **Tests existentes afectados**: tabla con el test (nombre y archivo), la acción (`modificar` o `retirar`), el criterio que lo justifica y el nuevo resultado esperado. En el primer ciclo, o si no hay ninguno, "Ninguno".

Ejemplo del nivel de detalle esperado:

```
### TA9: rechazar enlaces de restablecimiento caducados
Procede de: H2 — H2-C3
Tests: T7
Artefacto: api
Archivos: src/auth/reset.py, tests/auth/test_reset.py
Depende de: TA8 (validación de token válido)
Fuera de esta tarea: la pantalla del aviso (TA10); la limpieza de
  tokens antiguos (más adelante).
Terminada cuando: T7 pasa y la suite completa está en verde.

#### T7: rechaza un enlace caducado
Cubre: H2-C3
Nivel: integración — tests/auth/test_reset.py
Artefacto: api
Preparación: usuario ana@ejemplo.com con un token de restablecimiento
  emitido hace 31 minutos.
Acción: GET /reset?token=<token>
Esperado: respuesta 410 con cuerpo {"error": "enlace_caducado"};
  el token sigue sin poder usarse; la contraseña no cambia.
```

Los tests van siempre después de las etiquetas de la ficha, no antes: el lector de la plantilla lee la ficha hasta el primer encabezado que sigue.

Al entregar, pon el plan en `borrador` con `node _flujo/estado.mjs sdd estado <nombre> tareas borrador --quien "agente de la fase 5"` (uno por SDD) y añade tu entrada a `<ciclo>/aprobaciones.md` (ver «Aprobaciones y atención especial» en las convenciones): los tests existentes que modifica o retira el plan, con el criterio que los sustituye; los tests que salen de una fila de casos límite y no de un criterio literal; los tests que pasan sin código nuevo; y las tareas que superan unas 150 líneas y seis archivos.

## Terminado cuando

- Cada tarea cumple los cinco puntos de la definición de tarea atómica.
- Todo test está dentro de exactamente una tarea, y la tarea lo cita en `Tests`.
- La matriz de cobertura no tiene filas ni columnas vacías.
- Cada test puede escribirse como código sin tomar ninguna decisión: los datos y el resultado esperado están dados.
- Ningún test exige un comportamiento que el SDD no especifica.
- Cada caso límite y de error del SDD tiene su test.
- Ningún test depende de otro para pasar ni del orden de ejecución.
- El nivel de cada test es uno de `unitario`, `componente`, `integración` o `extremo a extremo`.
- Ejecutando las tareas en orden, ninguna necesita algo que todavía no existe.
- Cada tarea se entiende leyéndola sola, junto con el SDD.
- Ningún refactor comparte tarea con un cambio de comportamiento.

## Fuera de esta fase

- Escribir el código de los tests: lo hará el programador, uno a uno, dentro de cada tarea.
- Cambiar criterios o diseño. Si un criterio no se puede probar tal como está escrito, o si al dividir descubres que un test no encaja en ninguna tarea razonable, detente y dilo.
- Indicar cómo implementar cada tarea por dentro.
- Añadir tests de cosas que el SDD no pide.
- Escribir código.
