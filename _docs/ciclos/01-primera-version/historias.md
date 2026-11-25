# Historias: primera versión de la web del despacho
Fase: 2 Historias
Entradas: `_docs/ciclos/01-primera-version/brief.md`, `_docs/ciclos/01-primera-version/idea.md`

Convenciones de este documento:
- «Los datos del despacho» son los de la ficha de Google: nombre, dirección, teléfono, horario y número de WhatsApp. Los aporta el despacho al implementar; los criterios los referencian y no repiten valores concretos.
- «Un área» es cada área de especialidad que el despacho facilita (el número y los textos los aporta el despacho). Hay una página por área.
- «Móvil» es una pantalla de 360 × 640 px; «escritorio» es una de 1366 × 768 px.

## 1. Resumen

| ID | Título | Prioridad | Dependencias |
|---|---|---|---|
| H1 | Contactar con un toque por llamada o WhatsApp | 1 | — |
| H2 | Conocer el despacho y sus áreas desde la página de inicio | 2 | H1 |
| H3 | Consultar una área de especialidad | 3 | H1 |
| H4 | Ver cómo llegar y los datos de contacto | 4 | H1 |
| H5 | Enviar una consulta por formulario | 5 | H4 |
| H6 | Consultar el aviso legal y la política de privacidad | 6 | — |
| R1 | Puntuación 100 en Lighthouse | transversal | — |
| R2 | SEO local: datos coherentes y estructurados | transversal | — |
| R3 | SEO técnico: metadatos, mapa del sitio, `robots.txt` y canónicas | transversal | — |
| R4 | Sin cookies ni rastreo de terceros | transversal | — |
| R5 | Despliegue en Firebase Hosting | transversal | — |
| R6 | Diseño mobile first y accesible | transversal | — |

Orden propuesto: H1 → H2 → H3 → H4 → H5 → H6. Los requisitos R se verifican en todas las páginas desde la primera.

## 2. Historias

### H1: Contactar con un toque por llamada o WhatsApp
Como persona que busca un abogado desde el móvil, quiero llamar o escribir por WhatsApp al despacho en un toque desde cualquier página para consultar mi caso sin buscar el contacto.

- H1-C1: Dado un visitante en móvil en cualquier página del sitio, cuando mira la pantalla sin desplazarse, entonces ve dos botones fijos, «Llamar» y «WhatsApp», que permanecen visibles al hacer scroll.
- H1-C2: Dado un visitante en móvil, cuando toca «Llamar», entonces el dispositivo inicia una llamada al teléfono del despacho mediante un enlace `tel:` con el número en formato internacional.
- H1-C3: Dado un visitante en móvil, cuando toca «WhatsApp», entonces se abre una conversación con el número de WhatsApp del despacho mediante un enlace `https://wa.me/<número>` en una pestaña nueva.
- H1-C4: Dado un visitante en escritorio (ancho ≥ 1024 px), cuando carga cualquier página, entonces el teléfono y el botón de WhatsApp se muestran en la cabecera como enlaces visibles, sin barra fija inferior.
- H1-C5: Dado un visitante en móvil, cuando los botones fijos están visibles, entonces no tapan el contenido: al llegar al final de la página, el último elemento de contenido queda por encima de ellos.

### H2: Conocer el despacho y sus áreas desde la página de inicio
Como persona que llega desde Google, quiero ver en la página de inicio qué es el despacho y qué áreas trata para decidir si puede ayudarme.

- H2-C1: Dado un visitante que abre la URL raíz (`/`), cuando la página carga, entonces ve el nombre del despacho, una presentación breve y el logo.
- H2-C2: Dado un visitante en la página de inicio, cuando recorre la página, entonces ve una lista con una entrada por cada área, y cada entrada es un enlace a la página de esa área.
- H2-C3: Dado un visitante en la página de inicio, cuando recorre la página, entonces ve la dirección, el teléfono, el horario y un mapa de la ubicación, con un enlace a la página de contacto.
- H2-C4: Dado un visitante que abre una URL que no existe (por ejemplo `/no-existe`), cuando el servidor responde, entonces ve una página 404 con el mensaje «Página no encontrada», un enlace a la página de inicio y los botones de H1, con código HTTP 404.

### H3: Consultar una área de especialidad
Como persona con un problema legal concreto, quiero leer una página sobre mi tipo de caso para saber si el despacho lo trata y cómo actuar.

- H3-C1: Dado un visitante que abre la página de un área, cuando carga, entonces ve un único título principal con el nombre del área y el texto propio de esa área, distinto del de las demás.
- H3-C2: Dado un visitante en la página de un área, cuando llega al final del contenido, entonces ve una llamada a contactar con el teléfono, el WhatsApp y un enlace a la página de contacto.
- H3-C3: Dado un visitante en la página de un área, cuando mira el pie o el menú, entonces puede ir a cualquier otra área y a la página de inicio en un toque.
- H3-C4: Dado un visitante que abre la URL de un área con barra final o con mayúsculas (por ejemplo `/Derecho-Familia/`), cuando el servidor responde, entonces recibe la página canónica en minúsculas y sin barra final, o una redirección 301 a ella.

### H4: Ver cómo llegar y los datos de contacto
Como persona que quiere acudir al despacho, quiero ver la dirección, el horario y cómo llegar para ir sin dudas.

- H4-C1: Dado un visitante que abre la página de contacto, cuando carga, entonces ve la dirección completa, el horario por día de la semana y el teléfono, idénticos a los de la ficha de Google.
- H4-C2: Dado un visitante en la página de contacto, cuando toca «Cómo llegar», entonces se abre la ubicación del despacho en Google Maps en una pestaña nueva.
- H4-C3: Dado un visitante en la página de contacto, cuando busca la ficha del despacho, entonces ve un enlace a la ficha de Google (opiniones y perfil) que abre en una pestaña nueva con `rel="noopener"`.
- H4-C4: Dado un visitante en la página de contacto con el mapa visible, cuando ve la página, entonces el mapa aparece sin que el navegador reciba ni guarde cookies de terceros (R4) y tiene un nombre accesible («Mapa de la ubicación del despacho»).
- H4-C5: Dado un visitante con JavaScript desactivado, cuando abre la página de contacto, entonces sigue viendo la dirección, el horario, el teléfono y un enlace a Google Maps.

### H5: Enviar una consulta por formulario
Como persona que prefiere escribir, quiero enviar una consulta por formulario para que el despacho me responda cuando pueda.

- H5-C1: Dado un visitante en el formulario de contacto, cuando lo mira, entonces ve los campos «Nombre», «Teléfono o correo», «Mensaje» y una casilla obligatoria de aceptación de la política de privacidad con un enlace a ella.
- H5-C2: Dado un formulario relleno con nombre «Ana Pérez», correo `ana@ejemplo.com`, un mensaje de 40 caracteres y la casilla marcada, cuando se envía, entonces el visitante ve el mensaje «Hemos recibido tu consulta. Te responderemos lo antes posible.» y el despacho recibe el mensaje con esos datos.
- H5-C3: Dado un formulario con algún campo obligatorio vacío o con la casilla sin marcar, cuando se intenta enviar, entonces no se envía nada y se indica junto a cada campo afectado qué falta.
- H5-C4: Dado un formulario con un contacto que no es un correo con forma válida ni un teléfono de 9 a 15 dígitos (por ejemplo `ana@`) o un mensaje de más de 2000 caracteres, cuando se intenta enviar, entonces no se envía y se muestra el motivo junto al campo. Un teléfono como `600123456` se acepta.
- H5-C5: Dado un fallo en el envío (sin red o servicio no disponible), cuando se envía el formulario, entonces el visitante ve el mensaje «No hemos podido enviar tu consulta. Llámanos o escríbenos por WhatsApp.» con los botones de H1, y lo escrito no se pierde.
- H5-C6: Dado un envío automático con el campo oculto de control relleno, cuando el servicio lo recibe, entonces no se entrega ningún mensaje al despacho y no se muestra error al emisor.

### H6: Consultar el aviso legal y la política de privacidad
Como visitante, quiero leer quién es el titular de la web y cómo se tratan mis datos para decidir si uso el formulario.

- H6-C1: Dado un visitante en cualquier página, cuando mira el pie, entonces ve enlaces al aviso legal y a la política de privacidad.
- H6-C2: Dado un visitante en el aviso legal, cuando lo lee, entonces ve la identidad del titular (nombre o razón social, NIF, dirección, correo y teléfono de contacto).
- H6-C3: Dado un visitante en la política de privacidad, cuando la lee, entonces ve el responsable del tratamiento, la finalidad (atender la consulta del formulario), la base legal, el plazo de conservación, los derechos de la persona y cómo ejercerlos.
- H6-C4: Dado un visitante en la política de privacidad, cuando busca información sobre cookies, entonces lee que el sitio no usa cookies.

## 3. Requisitos que no son de usuario

### R1: Puntuación 100 en Lighthouse
Todas las páginas deben obtener 100 en Rendimiento, Accesibilidad, Buenas prácticas y SEO de Lighthouse, en móvil y en escritorio.

- R1-C1: Dada cualquier página pública del sitio desplegado o servido en local con la compilación de producción, cuando se ejecuta Lighthouse en el perfil móvil, entonces las cuatro categorías puntúan 100.
- R1-C2: Dada la misma página, cuando se ejecuta Lighthouse en el perfil de escritorio, entonces las cuatro categorías puntúan 100.
- R1-C3: Dada cualquier página, cuando se mide, entonces el JavaScript transferido es ≤ 20 KB comprimido y el desplazamiento acumulado de diseño (CLS) es 0.
- R1-C4: Dada cualquier imagen, cuando se sirve, entonces tiene dimensiones declaradas, formato moderno (AVIF o WebP) con alternativa y, si está bajo el primer pliegue, carga diferida.

### R2: SEO local: datos coherentes y estructurados
Los datos del despacho deben ser idénticos en todo el sitio y a los de la ficha de Google, y deben publicarse como datos estructurados válidos.

- R2-C1: Dadas todas las páginas donde aparecen el nombre, la dirección y el teléfono, cuando se comparan carácter a carácter entre sí y con la ficha de Google, entonces son idénticos (nombre, dirección y teléfono).
- R2-C2: Dada la página de inicio, cuando se analiza su código, entonces contiene un bloque JSON-LD de tipo `LegalService` (subtipo de `LocalBusiness`) con `name`, `address`, `telephone`, `openingHoursSpecification`, `geo`, `url`, `logo` y `sameAs` con la URL de la ficha de Google.
- R2-C3: Dado el JSON-LD de la página de inicio, cuando se valida con el Validador de Marcado de Schema.org y con la prueba de resultados enriquecidos de Google, entonces no devuelve errores.
- R2-C4: Dada la página de un área, cuando se analiza su código, entonces contiene JSON-LD de tipo `BreadcrumbList` (Inicio › Área) sin errores de validación.
- R2-C5: Dada cualquier página, cuando se analiza su código, entonces los teléfonos son enlaces `tel:` y la dirección va en el contenido como texto, no como imagen.

### R3: SEO técnico: metadatos, mapa del sitio, `robots.txt` y canónicas
- R3-C1: Dada cualquier página, cuando se analiza su código, entonces tiene un `<title>` único de ≤ 60 caracteres, una `meta description` única de entre 70 y 160 caracteres, `lang="es"` y un único `<h1>`.
- R3-C2: Dada cualquier página, cuando se analiza su código, entonces tiene `<link rel="canonical">` con la URL absoluta, en minúsculas y sin barra final, igual a la URL servida.
- R3-C3: Dado el sitio desplegado, cuando se pide `/sitemap.xml`, entonces responde 200 y lista la URL absoluta de cada página pública (inicio, cada área, contacto, aviso legal y política de privacidad) y ninguna otra.
- R3-C4: Dado el sitio desplegado, cuando se pide `/robots.txt`, entonces responde 200, permite el rastreo de todo el sitio y contiene la línea `Sitemap:` con la URL absoluta de `/sitemap.xml`.
- R3-C5: Dada cualquier página, cuando se comparte en redes, entonces tiene las etiquetas Open Graph `og:title`, `og:description`, `og:url` y `og:image`.
- R3-C6: Dado el sitio desplegado, cuando se pide cualquier URL con `http://` o con `www.` (por ejemplo `http://www.despacho.es/contacto`), entonces responde con una redirección 301 a la misma ruta en `https://` sin `www.` (`https://despacho.es/contacto`).

### R4: Sin cookies ni rastreo de terceros
- R4-C1: Dada cualquier página del sitio, cuando se carga en un navegador con el almacenamiento vacío, entonces no se establece ninguna cookie ni se escribe en `localStorage` ni `sessionStorage`.
- R4-C2: Dada cualquier página, cuando se inspeccionan las peticiones de red, entonces no hay peticiones a dominios de terceros que establezcan cookies o rastreen al visitante (analítica, píxeles, fuentes o scripts de CDN externos).
- R4-C3: Dado el sitio, cuando se revisa su código, entonces no incluye ningún aviso ni banner de cookies.

### R5: Despliegue en Firebase Hosting
- R5-C1: Dado el repositorio, cuando se ejecuta el comando de despliegue definido en la arquitectura, entonces el sitio queda publicado en Firebase Hosting y todas las páginas públicas responden 200.
- R5-C2: Dado el sitio desplegado, cuando se pide cualquier recurso estático con nombre con hash (JS, CSS, imágenes), entonces responde con `Cache-Control` de al menos un año (`max-age=31536000`) e `immutable`; el HTML se sirve con revalidación.
- R5-C3: Dado el sitio desplegado, cuando se piden las cabeceras de cualquier página, entonces incluye `Strict-Transport-Security`, `X-Content-Type-Options: nosniff` y una `Content-Security-Policy` que no permite orígenes de terceros no autorizados.

### R6: Diseño mobile first y accesible
- R6-C1: Dada cualquier página en móvil (360 px de ancho), cuando se visualiza, entonces no hay desplazamiento horizontal y todo el contenido es legible sin ampliar.
- R6-C2: Dada cualquier página en móvil, cuando se mide, entonces los elementos tocables (enlaces y botones) tienen al menos 48 × 48 px de área tocable y 8 px de separación.
- R6-C3: Dada cualquier página, cuando se comprueba el contraste, entonces el texto cumple la relación mínima 4,5:1 (3:1 en texto grande).
- R6-C4: Dada cualquier página, cuando se navega solo con teclado, entonces todos los elementos interactivos son alcanzables, tienen foco visible y el primer enlace de la página permite saltar al contenido principal.
- R6-C5: Dada cualquier página en escritorio (1366 px de ancho), cuando se visualiza, entonces el contenido se muestra en una columna de ancho máximo legible (≤ 75 caracteres por línea en texto corrido) sin elementos descolocados.

## 4. Cobertura del brief

| Capacidad del alcance | Historias o requisitos |
|---|---|
| Página de inicio: presentación, áreas, datos de contacto y mapa | H2, R2 |
| Una página por cada área con contenido propio | H3, R2-C4 |
| Página de contacto y cómo llegar | H4 |
| Botones de llamada y WhatsApp visibles en todas las páginas, fijos en móvil | H1 |
| Formulario de contacto, secundario | H5 |
| Aviso legal y política de privacidad | H6 |
| SEO local y técnico | R2, R3 |
| Despliegue en Firebase Hosting | R5 |
| Resultado esperado: 100 en Lighthouse en móvil y escritorio | R1 |
| Restricción: mobile first | R6, H1 |
| Restricción: sin cookies ni terceros que las pongan | R4, H4-C4, H6-C4 |

Toda historia y requisito tiene capacidad o restricción del brief que lo origina, salvo lo marcado como añadido por el agente en la sección siguiente.

## Decisiones y supuestos
- Decisión: el alcance se divide en 5 historias de capacidad más la de páginas legales; los botones de llamada y WhatsApp (H1) son la historia de mayor prioridad porque son la conversión principal del brief.
- Decisión: SEO local, SEO técnico, despliegue, sin cookies y mobile first se recogen como requisitos R y no como historias, porque no son acciones del visitante.
- *Añadido por el agente*: H2-C4 (página 404). El brief no la nombra; es necesaria para Firebase Hosting y para la puntuación de SEO.
- *Añadido por el agente*: H3-C4 y R3-C2 (URL canónica en minúsculas, sin barra final), derivado de «URLs canónicas» del brief.
- *Añadido por el agente*: H4-C5 (contenido de contacto sin JavaScript).
- *Añadido por el agente*: H5-C1 a H5-C6 en sus datos concretos: campos del formulario, el límite de 2000 caracteres del mensaje, los textos de confirmación y error y el campo oculto de control antispam (sin cookies ni CAPTCHA de tercero). El brief solo dice «formulario de contacto».
- *Añadido por el agente*: cifras de R1-C3 (≤ 20 KB de JavaScript, CLS 0), R1-C4, R2-C2 (tipo `LegalService`), R3-C1 (límites de título y descripción), R5-C2 y R5-C3 (cabeceras), R6-C2 (48 × 48 px) y R6-C5 (75 caracteres por línea). El brief solo fija «100 en Lighthouse»; estas cifras son medidas habituales para conseguirlo y cumplir las recomendaciones actuales.
- *Añadido por el agente*: R3-C5 (Open Graph) y R3-C6 (redirección a `https` sin `www`, decidido por la persona responsable).
- Supuesto: el número de áreas y sus nombres los facilita el despacho; no se fijan aquí. Cada área tiene su propia URL en minúsculas derivada de su nombre.
- Supuesto: el aviso legal incluye los datos del titular que el despacho aporte; este documento no redacta textos jurídicos (decisión del brief).
- Supuesto: «escritorio» arranca en 1024 px de ancho para el diseño de la cabecera (H1-C4); por debajo de ese ancho se aplica el diseño móvil.
- Supuesto: R4-C2 permite el mapa de la página de contacto si el SDD o la arquitectura lo resuelven sin cookies ni rastreo (por ejemplo, un enlace o una imagen estática); la elección es de la fase 3.

## Preguntas abiertas
- Formulario (H5-C2): quién recibe los mensajes y cómo (servicio de envío, función en Firebase, correo del despacho). Lo decide la fase 3.
- Mapa (H2-C3, H4-C4): qué solución cumple «sin cookies» con la ficha de Google. Lo decide la fase 3.
- Nombre del dominio definitivo: lo aporta el despacho antes de implementar. La versión es siempre `https` sin `www` (R3-C6).

## Notas para fases posteriores
- Fase 3: los criterios H5-C5, H5-C6, R1-C3 y R5-C3 limitan la solución del formulario, de los terceros y de la política de seguridad de contenido (CSP).
- Fase 4: asignar el nombre de cada área a su URL y fijar el comando concreto de medición de Lighthouse y de validación del JSON-LD.
- Fase 5: R1, R3 y R6 se comprueban con herramientas automáticas (Lighthouse CI, validadores); los tests han de nombrar la herramienta y la versión.
