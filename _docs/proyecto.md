# Proyecto

Nombre: [nombre] — se fija en el kickoff
Inicio: [fecha] — se fija en el kickoff
Ciclo activo: ninguno

## Ciclos y hoja de ruta

Esta tabla reúne los ciclos cerrados, el ciclo abierto y los previstos, en orden. Solo puede haber un ciclo en `abierto`.

Los ciclos en `previsto` son la hoja de ruta: una línea por ciclo, sin número ni carpeta hasta que se abren. Es provisional. Se gestiona con el comando de estado (`ciclo prever`, `ciclo editar`, `ciclo mover` y `ciclo descartar`) en cualquier momento, sin repetir ninguna fase. Esta tabla la escribe el comando a partir de la base de datos: no la edites a mano.

Estados (no se traducen): `previsto`, `abierto`, `cerrado`, `descartado`.

| Nº | Carpeta | Objetivo | Estado | Origen | Abierto | Cerrado |
|---|---|---|---|---|---|---|

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
