# Fase 4: SDD (documento de diseño)

Lee primero `_flujo/convenciones.md`.

## Objetivo

Definir cómo se va a construir lo que piden las historias, con el detalle suficiente para que un agente programador lo implemente sin tener que adivinar ni tomar decisiones de diseño por su cuenta. El SDD fija el qué y los contratos; el cómo interno queda para el programador.

## Entradas

- `<ciclo>/brief.md` (debe estar `aprobado`).
- `<ciclo>/historias.md` (debe estar `aprobado`). En la vía corta no existe: los requisitos están en el brief.
- `_docs/arquitectura.md` (la fase 3 debe estar en `aprobado` o `no aplica`).
- `_docs/sistema.md` y el código existente, a partir del segundo ciclo.

## Antes de empezar

Comprueba el estado y valida las entradas según las convenciones. En particular: que cada criterio de aceptación sea lo bastante concreto para diseñar contra él. Si un criterio admite dos diseños distintos según cómo se interprete, detente y pregunta. Si repites la fase por un informe de verificación, sigue el punto 4 de "Cambios hacia atrás" de las convenciones.

## Proceso

1. **Explora el código existente.** Localiza los módulos, interfaces y patrones que el diseño debe reutilizar o respetar. Anota rutas exactas. A partir del segundo ciclo, empieza por `_docs/sistema.md` y contrástalo con el código: si no coinciden, manda el código, y debes señalar la diferencia en "Notas para fases posteriores".

2. **Decide la división.** Si hay grupos de historias que se pueden implementar y probar por separado, escribe un SDD por grupo. Las dependencias entre historias marcan los cortes naturales. Indica el orden de implementación y qué necesita cada SDD de los anteriores. Para un trabajo pequeño, un único SDD.

3. **Diseña.** Para cada decisión relevante, considera al menos una alternativa y anota por qué la descartas. Prefiere lo que ya existe en el repositorio a introducir piezas nuevas. Diseña dentro de la arquitectura aprobada: artefactos, comunicación, stack y estructura del repositorio ya están decididos en `_docs/arquitectura.md`. Si el diseño necesita apartarse de ella, detente y dilo: se resuelve repitiendo la fase 3, no desde el SDD.

4. **Fija los contratos.** Todo lo que cruce un límite entre componentes, o entre el sistema y el exterior, se escribe literal: firmas con tipos, esquemas de datos, endpoints con ejemplos de petición y respuesta, formatos y códigos de error.

5. **Recorre los casos límite.** Para cada componente: entradas inválidas, estados vacíos, duplicados, concurrencia, fallo de dependencias externas, límites de tamaño. Define el comportamiento esperado en cada uno. Si de aquí sale un comportamiento que ninguna historia cubre, añádele un criterio nuevo con ID del SDD (ver salida, sección 7).

6. **Afina los criterios de aceptación.** Los criterios de las historias y requisitos conservan sus IDs y su texto vive en `historias.md` (o en el brief, en la vía corta): no los copies al SDD. Si uno es vago, su concreción va a las secciones de diseño y contratos, y el resultado exacto lo fijará el test, que dirá `Cubre: H9-C1` y el valor esperado.

## Salida

`<ciclo>/sdd-[nombre].md` por cada SDD (antes de escribirlo, dalo de alta con `node _flujo/estado.mjs sdd alta --nombre <nombre> --orden <n> --quien "agente de la fase 4"`; la fila de la fase 4 del estado pasa a ser una por SDD), con la cabecera y las secciones finales de las convenciones, y esta estructura:

1. **Objetivo**: qué problema resuelve y para quién, en 2-4 frases. Incluye el porqué: el programador decide mejor en los casos no previstos si lo conoce.
2. **Alcance y no-objetivos**: IDs de las historias y requisitos que cubre y, explícitamente, qué no debe tocar ni construir.
3. **Contexto técnico**: artefactos de `_docs/arquitectura.md` que intervienen, y archivos, módulos e interfaces existentes implicados, con rutas exactas. No copies la arquitectura: el programador la leerá. Repite aquí lo necesario del brief, que no leerá.
4. **Diseño**: para cada artefacto implicado, componentes y responsabilidad de cada uno, flujo de datos y contratos literales. Los contratos entre artefactos se especifican completos y se señalan como tales: de ellos dependen dos piezas que se implementan y se prueban por separado.
5. **Alternativas descartadas**: una línea de por qué cada una, para que el programador no las reabra.
6. **Casos límite y errores**: tabla con situación y comportamiento esperado.
7. **Criterios de aceptación**: solo los IDs de los criterios que este SDD cubre (los de las historias o requisitos, sin repetir su texto) y, con su texto completo, los criterios nuevos que salgan de los casos límite. Estos llevan ID de requisito nuevo (`R` + el número que da `node _flujo/estado.mjs siguiente R`, con su `-C`) y se marcan como "añadido en el SDD". Cada requisito nuevo se declara además en una sección `## Requisitos añadidos en el SDD` de ese mismo `sdd-[nombre].md`, con una tabla `| ID | Título |` (una fila por requisito, `R<n>` y un título breve); si el SDD no añade ninguno, la sección no se pone. Esos criterios, y los textos de pantalla o decisiones de alcance que añadas, se plantean a la persona responsable de uno en uno, cada uno en su mensaje, antes de pedir la aprobación (ver "Lo que añades tú, se pregunta" en las convenciones). No basta con listarlos en el resumen de entrega.
8. **Dependencias con otros SDD**: qué necesita de ellos y qué les ofrece.
9. **Impacto en lo existente**: módulos y contratos existentes que se modifican, criterios de ciclos anteriores que quedan sustituidos y comportamiento que debe permanecer igual. En el primer ciclo, "No aplica".

Si hay varios SDD, añade `<ciclo>/sdd-indice.md` con la lista, el orden de implementación y qué historias cubre cada uno.

Al entregar, pon cada SDD en `borrador` con `node _flujo/estado.mjs sdd estado <nombre> sdd borrador --quien "agente de la fase 4"` y añade tu entrada a `<ciclo>/aprobaciones.md` (ver «Aprobaciones y atención especial» en las convenciones): criterios, textos de pantalla y decisiones de alcance que has añadido tú; contratos entre artefactos; impacto en lo existente; y las diferencias que hayas encontrado entre `_docs/sistema.md` y el código.

## Terminado cuando

- Cada historia y requisito del ciclo está cubierto por algún SDD, y el ID de cada criterio aparece en la sección 7 de exactamente uno.
- Un programador que solo lea el SDD sabría qué archivos crear o tocar y qué debe devolver cada interfaz, sin preguntar.
- Ninguna sección usa adjetivos donde debería haber una cifra o un comportamiento.
- Cada contrato tiene al menos un ejemplo de entrada y salida.
- Cada fila de la tabla de casos límite y cada función pública que define el diseño tiene al menos un criterio de la sección 7 que la cubre.
- Las rutas y nombres citados existen en el repositorio.
- Cada requisito nuevo (`R<n>` que no sale de las historias ni del brief) tiene su fila en `## Requisitos añadidos en el SDD` y sus criterios llevan la marca "añadido en el SDD".

## Fuera de esta fase

- Decidir o cambiar la arquitectura: artefactos, stack, plataforma o estructura del repositorio (fase 3).
- Cambiar el alcance o los criterios de las historias. Puedes afinarlos; si hay que cambiarlos, detente y dilo.
- Dictar la implementación interna: nombres de variables, estructura interna de funciones, algoritmos, salvo que un contrato o una convención del repo lo exijan.
- Los tests y el plan de tareas (fase 5).
- Escribir código de producción.
