# Proyecto

Nombre: web-astro
Inicio: 2026-11-25
Ciclo activo: _docs/ciclos/01-primera-version

## Ciclos y hoja de ruta

Esta tabla reúne los ciclos cerrados, el ciclo abierto y los previstos, en orden. Solo puede haber un ciclo en `abierto`.

Los ciclos en `previsto` son la hoja de ruta: una línea por ciclo, sin número ni carpeta hasta que se abren. Es provisional. Se gestiona con el comando de estado (`ciclo prever`, `ciclo editar`, `ciclo mover` y `ciclo descartar`) en cualquier momento, sin repetir ninguna fase. Esta tabla la escribe el comando a partir de la base de datos: no la edites a mano.

Estados (no se traducen): `previsto`, `abierto`, `cerrado`, `descartado`.

| Nº | Carpeta | Objetivo | Estado | Origen | Abierto | Cerrado |
|---|---|---|---|---|---|---|
| 01 | _docs/ciclos/01-primera-version | Primera versión de la web del despacho de abogados, mobile first y centrada en SEO local | abierto | kickoff | 2026-11-25 | |
| | | Equipo y sobre el despacho: páginas de abogados y presentación del despacho | descartado | brief | | |
| | | Blog de artículos jurídicos para SEO de contenido | previsto | brief | | |

## Siguiente identificador libre

La numeración es única en todo el proyecto y continúa de un ciclo al siguiente. Cada fase pide sus identificadores al comando de estado (`siguiente`), que sube el contador; esta tabla la escribe el comando a partir de la base de datos.

| Tipo | Siguiente |
|---|---|
| H (historia) | 1 |
| R (requisito) | 1 |
| T (test) | 1 |
| TA (tarea) | 1 |
| G (hueco) | 1 |
| V (verificación) | 1 |
