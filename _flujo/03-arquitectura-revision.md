# Fase 3: Revisión de la arquitectura

Lee primero `_flujo/convenciones.md`.

## Objetivo

Cuestionar la arquitectura propuesta antes de que la persona responsable la apruebe. Esta fase la ejecuta un agente distinto del que la escribió, en un contexto aislado: no has visto la conversación en la que se decidió y no debes dar por buenas sus justificaciones sin comprobarlas.

No es la verificación de la fase 6, que comprueba que los documentos encajan entre sí. Aquí se juzga la decisión: si cubre lo que se le pide, si es más compleja de lo necesario y qué riesgos tiene.

Tu trabajo es encontrar los problemas ahora, cuando corregirlos cuesta una conversación. No es proponer la arquitectura que tú habrías elegido.

## Entradas

- `_docs/arquitectura.md` (su fila de la fase 3 debe estar en `borrador`).
- `<ciclo>/brief.md` y `<ciclo>/historias.md`.
- `_docs/proyecto.md`: la hoja de ruta.
- `_docs/sistema.md`, si existe.
- Los ficheros de `_flujo/criterios/`, si los hay.
- `<ciclo>/revision-arquitectura.md`, si existe: revisiones anteriores.

## Proceso

Haz las comprobaciones en este orden.

1. **Requisitos.** Recorre uno a uno los requisitos que no son de usuario y las restricciones del brief. ¿La arquitectura responde a cada uno de forma creíble? Señala los que no aparecen o cuya respuesta es una afirmación sin mecanismo ("escalará sin problemas").

2. **Simplicidad.** Para cada artefacto, almacén y tecnología: ¿qué requisito lo justifica? ¿Se cumplirían los requisitos con una pieza menos? La complejidad sin requisito que la pida es un hallazgo, no una preferencia.

3. **Datos.** ¿Cada almacén tiene un único dueño? ¿Hay dos artefactos escribiendo en el mismo sitio, o datos duplicados sin que se diga cuál manda?

4. **Comunicación y fallos.** Para cada vía de comunicación: ¿qué ocurre si el otro lado no responde, responde tarde o recibe el mismo mensaje dos veces? En los flujos asíncronos, ¿está previsto el reintento y qué pasa con lo que no se puede procesar?

5. **Seguridad.** Cómo se autentican los artefactos entre sí y los usuarios ante el sistema, dónde están los secretos y qué queda expuesto a internet.

6. **Operación y coste.** ¿Cada artefacto puede desplegarse por separado como se dice? ¿Se podrá saber qué ha fallado cuando falle? ¿El modelo de coste es coherente con el volumen esperado y con el límite del brief?

7. **Plataforma.** Localiza las afirmaciones concretas sobre la plataforma en las que se apoya una decisión: límites, planes, capacidades, precios. Si tienes acceso a la web, contrástalas con la documentación oficial actual y cita la fuente. Las que no puedas comprobar, lístalas como "sin verificar": no las des por ciertas ni por falsas.

8. **Hoja de ruta.** ¿Alguna decisión impide o encarece mucho un ciclo previsto? No pidas construir para el futuro; señala solo los bloqueos.

9. **Alternativas.** ¿Las alternativas descartadas son reales y el motivo se sostiene? ¿Hay alguna claramente más simple que no se haya considerado?

10. **Criterios de la organización.** Aplica cada fichero de `_flujo/criterios/` que corresponda a las tecnologías usadas y señala cada regla incumplida.

11. **Suficiencia.** ¿Quien escriba un SDD puede empezar sin tomar decisiones estructurales? ¿Están definidos la estructura del repositorio, las herramientas de calidad de cada artefacto, el comando único que las ejecuta y la integración continua?

Si es una segunda revisión, comprueba primero qué ha pasado con cada hallazgo anterior.

## Qué informar

Cada hallazgo lleva:

- Gravedad: `bloqueante` (un requisito queda sin cubrir, o hay un riesgo serio de tener que rehacer la arquitectura), `importante` (riesgo real pero acotado, o complejidad injustificada) o `menor`.
- Sección de `_docs/arquitectura.md` e IDs de requisitos afectados.
- Qué ocurre y qué lo demuestra.
- En qué dirección habría que mirar, en una frase. No rediseñes.

Distingue los problemas de las preferencias: "yo habría usado otra cosa" no es un hallazgo si lo elegido cumple los requisitos. Si no encuentras nada bloqueante ni importante, dilo así y no busques hallazgos de relleno.

## Salida

Añade una entrada al final de `<ciclo>/revision-arquitectura.md`, sin modificar las anteriores:

```
## Revisión 1 — [fecha]
Veredicto: requiere cambios

Hallazgos:
1. [bloqueante] Sección 4 (Datos), R3 — la web y la función de avisos
   escriben ambas en la tabla de socios y no se indica quién es el
   dueño. Con dos escritores no hay forma de garantizar R3
   (consistencia de cuotas). Mirar: un único dueño y que el otro pida
   el cambio a través de él.
2. [importante] Sección 2 — el backend separado de la web no está
   justificado por ningún requisito. Mirar: si basta un solo artefacto.

Sin verificar:
- Sección 6: límite de duración de ejecución del plan elegido.

Comprobado: requisitos, simplicidad, datos, comunicación, seguridad,
operación, plataforma, hoja de ruta, alternativas, criterios, suficiencia.
```

Veredictos: `sin objeciones` (ningún hallazgo bloqueante ni importante) o `requiere cambios`.

No hagas commit: el informe se publicará con el siguiente commit de la fase 3 (la aprobación o la repetición de la arquitectura). Termina con un resumen de dos o tres líneas en la conversación. La decisión de aprobar es de la persona responsable, que se lo dirá a un agente en la conversación principal ("apruebo la arquitectura"): puede aceptar un hallazgo como riesgo asumido, y entonces debe quedar anotado en "Decisiones y supuestos" de `_docs/arquitectura.md`. Antes de aprobar, los hallazgos se resuelven como describe la sección «Resolver la revisión» de `_flujo/03-arquitectura.md`.

## Terminado cuando

- Las once comprobaciones están hechas y la entrada dice cuáles.
- Cada hallazgo puede verificarlo quien lo lea.
- Las afirmaciones de plataforma están contrastadas con su fuente o listadas como sin verificar.
- El veredicto se sigue de los hallazgos.

## Fuera de esta fase

- Modificar `_docs/arquitectura.md` o cualquier otro documento: solo escribes en `<ciclo>/revision-arquitectura.md`.
- Proponer una arquitectura alternativa completa.
- Cambiar estados en `<ciclo>/estado.md`.
- Opinar sobre el alcance, las historias o la hoja de ruta.
