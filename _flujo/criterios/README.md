# Criterios de la organización

Esta carpeta es opcional y está vacía por defecto. Sirve para dejar escritas las reglas propias de tu organización que una arquitectura debe cumplir y que ningún agente puede conocer por su cuenta.

La fase 3 (arquitectura) y su revisión leen todos los ficheros `.md` que haya aquí, salvo este, y los aplican cuando corresponden a las tecnologías del proyecto.

## Cómo usarla

Crea un fichero por tecnología o por tema, con el nombre que quieras: `azure.md`, `aws.md`, `escritorio-windows.md`, `web.md`, `seguridad.md`.

Dentro, una lista de reglas. Cada regla con su motivo, para que el agente sepa aplicarla en los casos que no previste:

```
# Azure

- Solo se despliega en la región West Europe. Motivo: residencia de datos.
- Las funciones usan identidad administrada; no se guardan claves de
  acceso en la configuración. Motivo: política de seguridad.
- Servicios aprobados: Functions, App Service, Storage, SQL Database.
  Cualquier otro requiere justificación en "Alternativas descartadas".
- Nomenclatura de recursos: [proyecto]-[entorno]-[tipo].
```

## Qué poner y qué no

- Sí: servicios y regiones permitidos, límites de coste, normas de seguridad y de nomenclatura, tecnologías que el equipo sabe mantener, lecciones de proyectos anteriores.
- No: buenas prácticas generales de una plataforma. Los agentes ya las conocen, y repetirlas aquí solo alarga lo que tienen que leer.

Mantén estos ficheros en el repositorio plantilla para que los hereden todos los proyectos nuevos.
