# Fase 2: Historias de usuario

Lee primero `_flujo/convenciones.md`.

## Objetivo

Traducir el alcance del brief a historias de usuario con criterios de aceptación comprobables. Estos criterios son el origen de la cadena de trazabilidad: pasarán al SDD, de ahí a los tests y de ahí a las tareas. Lo que aquí quede vago, quedará vago hasta el código.

## Entradas

- `<ciclo>/brief.md` (debe estar `aprobado`).
- `_docs/sistema.md`, a partir del segundo ciclo: contiene las capacidades y los criterios vigentes.

Si el brief indica vía corta, esta fase no se ejecuta: dilo y detente.

## Antes de empezar

Comprueba el estado y valida el brief según las convenciones. En particular: que el alcance del ciclo esté claro y que no contradiga los no-objetivos.

## Proceso

1. **Escribe las historias.** Una por cada capacidad del alcance, con la forma "Como [rol], quiero [acción] para [beneficio]". Cada historia debe:
   - Aportar valor por sí sola.
   - Poder probarse de forma independiente de las demás.
   - Ser lo bastante pequeña para implementarse en unas pocas tareas. Si una historia necesita más de 5 criterios, probablemente son dos historias.

2. **Escribe los criterios de aceptación.** De 2 a 5 por historia, en formato Dado/Cuando/Entonces:
   - Con datos concretos: "Dado un carrito con 3 artículos", no "dado un carrito con artículos".
   - Con un resultado observable desde fuera, no un estado interno.
   - Al menos un criterio de error o caso límite por historia.

3. **Recoge los requisitos que no son de usuario.** Rendimiento, seguridad, datos, migraciones, operación, compatibilidad. No los fuerces en formato de historia: lístalos con ID `R` (el número lo da `node _flujo/estado.mjs siguiente R`; el de las historias, `siguiente H`) y sus propios criterios de aceptación, igual de concretos ("responde en menos de 300 ms con 10.000 registros", no "responde rápido"). Si un requisito no sale del brief ni de lo que dijo la persona (por ejemplo, rendimiento o gestión de errores que tú añades), márcalo como añadido por el agente, según las convenciones.

4. **Ordena.** Todo lo que escribes entra en este ciclo: lo recortado ya está en la hoja de ruta y no se trata aquí. Propón un orden de prioridad.

5. **Señala dependencias.** Indica qué historias necesitan que otra esté hecha antes. Esto guiará la división en varios SDD.

6. **Señala lo que cambia de lo existente.** A partir del segundo ciclo, si un criterio nuevo modifica o deja sin efecto uno vigente de `_docs/sistema.md`, anótalo junto al criterio: `sustituye a H2-C3`. Un cambio de comportamiento existente que no esté declarado así se considera un error.

## Salida

`<ciclo>/historias.md`, con la cabecera y las secciones finales de las convenciones, y este contenido:

1. **Resumen**: tabla con ID, título, prioridad y dependencias.
2. **Historias**: cada una con su ID, enunciado, criterios de aceptación con sus IDs y, si hace falta, una nota de contexto.
3. **Requisitos que no son de usuario**: cada uno con su ID y sus criterios.
4. **Cobertura del brief**: cada capacidad del alcance, con las historias que la cubren. Nada del alcance queda sin historia; ninguna historia queda fuera del alcance.

Ejemplo del nivel de detalle esperado:

```
### H2: Recuperar contraseña
Como usuario registrado, quiero restablecer mi contraseña por correo
para volver a entrar si la olvido.

- H2-C1: Dado un usuario registrado con correo ana@ejemplo.com,
  cuando solicita restablecer la contraseña con ese correo,
  entonces recibe un mensaje con un enlace válido durante 30 minutos.
- H2-C2: Dado un correo que no pertenece a ningún usuario,
  cuando se solicita restablecer la contraseña,
  entonces se muestra el mismo mensaje de confirmación que en H2-C1
  y no se envía ningún correo.
- H2-C3: Dado un enlace emitido hace más de 30 minutos,
  cuando el usuario lo abre,
  entonces ve el aviso "El enlace ha caducado" y la opción de pedir otro.
```

Al entregar, pon la fase 2 en `borrador` con `node _flujo/estado.mjs fase 2 borrador --quien "agente de la fase 2"` y añade tu entrada a `<ciclo>/aprobaciones.md` (ver «Aprobaciones y atención especial» en las convenciones): las historias o requisitos que has añadido tú, los criterios que sustituyen algo vigente, las cifras que has puesto donde la persona solo dijo «rápido» o similar, y las capacidades del brief que has dividido o fusionado.

## Terminado cuando

- Cada criterio puede comprobarse con una prueba concreta sin interpretar nada.
- Dos personas distintas entenderían lo mismo al leer cada criterio.
- La tabla de cobertura del brief no tiene huecos en ningún sentido.
- Los requisitos de rendimiento y seguridad tienen cifras o comportamientos observables.
- Cada historia o requisito que no sale del brief está marcado como añadido por el agente y la persona responsable lo ha confirmado.

## Fuera de esta fase

- Cómo se implementa: componentes, tablas, endpoints, librerías (fase 4). Las historias describen lo que el usuario observa.
- Ampliar el alcance del brief. Si crees que falta algo esencial, anótalo en "Preguntas abiertas".
- Tests y tareas (fase 5).
