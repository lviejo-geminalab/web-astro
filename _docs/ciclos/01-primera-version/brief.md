# Brief: primera versión de la web del despacho
Fase: 1 Brief
Entradas: `_docs/ciclos/01-primera-version/idea.md` y respuestas de la persona responsable en la conversación

## 1. Problema
El despacho de abogados no tiene web propia que complemente su ficha de Google Maps. Quien busca un abogado cerca de su ubicación encuentra la ficha, pero no un sitio donde ver las áreas de especialidad, confirmar los datos del despacho y contactar. Sin web, el despacho pierde posiciones en las búsquedas locales y consultas que llegan por teléfono o WhatsApp.

## 2. Usuarios
- **Persona que busca un abogado desde el móvil**, en la zona de la sede, con un problema legal concreto. Quiere saber si el despacho trata su caso y contactar rápido.
- **Responsable del despacho**, que aporta el contenido y quiere que la web refuerce su presencia local.

## 3. Resultado esperado
Una persona llega desde Google (búsqueda o ficha de Maps), ve las áreas del despacho y contacta por llamada, WhatsApp o formulario en pocos toques desde el móvil. Se sabrá que ha funcionado si:
- el sitio obtiene 100 en Rendimiento, Accesibilidad, Buenas prácticas y SEO de Lighthouse/PageSpeed, en móvil y en escritorio, en todas las páginas;
- el sitio cumple las recomendaciones actuales de SEO local: nombre, dirección y teléfono idénticos a la ficha de Google, datos estructurados válidos y enlace a la ficha.

## 4. Alcance del ciclo
- Página de inicio: presentación del despacho, áreas de especialidad, datos de contacto y mapa.
- Una página por cada área de especialidad, con contenido propio.
- Página de contacto y cómo llegar: dirección, horario, teléfono, mapa y enlace a la ficha de Google.
- Botones de llamada y de WhatsApp visibles en todas las páginas, fijos en móvil.
- Formulario de contacto, secundario respecto a la llamada y a WhatsApp.
- Aviso legal y política de privacidad.
- SEO local y técnico: datos estructurados del despacho, metadatos por página, mapa del sitio, `robots.txt`, URLs canónicas.
- Despliegue en Firebase Hosting.

## 5. No-objetivos
- Varias sedes o páginas por localidad: el despacho tiene una sola sede.
- Otros idiomas: solo español.
- Página de equipo o «sobre nosotros» y blog (el blog queda como ciclo previsto).
- Reserva de cita online, área de clientes y panel de administración.
- Gestión de la ficha de Google Maps y de las reseñas.

## 6. Restricciones técnicas
- Astro y Tailwind, decididos por la persona responsable. Mobile first.
- Hosting: Firebase Hosting. Esto implica sitio estático, salvo lo que decida la fase 3 para el formulario.
- Objetivo de 100 en todas las mediciones de PageSpeed: condiciona imágenes, fuentes, JavaScript y terceros.
- El despacho ya dispone de todos sus datos, el texto de las áreas de especialidad y el logo.
- Sin plazo fijado.
- Sin aviso de cookies: la web no debe usar cookies ni tecnologías que obliguen a mostrarlo (decisión de la persona responsable: el aviso taparía los botones de llamada y WhatsApp). Esto excluye analítica con cookies y cualquier tercero que las ponga.
- Stack, estructura del repositorio y tratamiento del formulario se deciden en la fase 3, que se ejecuta por ser el primer ciclo.

## Decisiones y supuestos
- Decisión: la conversión principal es llamar o escribir por WhatsApp; el formulario es secundario (respuesta de la persona responsable).
- Decisión: una sola sede, solo español, solo el núcleo local (respuestas de la persona responsable).
- Decisión: el contenido real lo aporta el despacho; el agente no redacta textos jurídicos.
- *Añadido por el agente*: la medición de «100%» se concreta como 100 en las cuatro categorías de Lighthouse, en móvil y en escritorio.
- Decisión: sin aviso de cookies; la web no usa nada que lo exija (respuesta de la persona responsable).
- *Añadido por el agente*: aviso legal y política de privacidad entran en el alcance, porque la web trata datos personales con el formulario.
- Supuesto, vía: completa y no corta. El formulario implica un contrato con un servicio de envío y es el primer ciclo, con fase 3 obligatoria.
- Decisión, hoja de ruta: un solo ciclo previsto, «Blog de artículos»; el ciclo «Equipo y sobre el despacho» que propuse se descarta por indicación de la persona responsable.

## Preguntas abiertas
Ninguna. Los datos concretos del despacho (nombre, dirección, teléfono, áreas) los aporta la persona responsable al llegar a la implementación.

## Notas para fases posteriores
- Fase 3: el mapa y cualquier recurso externo no deben poner cookies ni rastrear, pues no hay aviso de cookies; comprobar si un mapa embebido de Google lo cumple o si hay que usar otra solución.
- Fase 3: decidir cómo recibe el formulario los mensajes bajo Firebase Hosting y qué medición de visitas es posible sin cookies.
- Fase 2: los criterios de SEO local y de rendimiento deben ser comprobables con herramientas concretas.
