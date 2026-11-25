# Estado del ciclo

Ciclo: [NN-nombre]
Vía: [completa | corta] — se fija al aprobar el brief

Estados posibles (se escriben siempre así):

- `pendiente`: la fase no se ha ejecutado.
- `hecho`: fase terminada que no requiere aprobación formal. Solo lo usa la fase 0.
- `borrador`: el agente ha entregado el documento y espera aprobación.
- `aprobado`: la persona responsable lo ha validado. Se pone solo con su aprobación explícita (ver "Aprobar y publicar" en las convenciones).
- `por revisar`: una fase anterior ha cambiado y este documento puede estar desactualizado.
- `no aplica`: la fase se omite por la vía elegida.

| Fase | Documento | Estado | Fecha | Notas |
|---|---|---|---|---|
| 0 Apertura | idea del ciclo | pendiente | | |
| 1 Brief | `brief.md` | pendiente | | |
| 2 Historias | `historias.md` | pendiente | | |
| 3 Arquitectura | `_docs/arquitectura.md` | pendiente | | |
| 4 SDD | `sdd-[nombre].md` | pendiente | | |
| 5 Tareas | `tareas-[nombre].md` | pendiente | | |
| 6 Verificación | `verificacion.md` | pendiente | | |
| 9 Cierre | `_docs/sistema.md` | pendiente | | |

Si hay varios SDD, añade una fila de las fases 4 y 5 por cada uno. El avance de las fases 7 y 8 se sigue en la tabla «Tareas» y en `revisiones-[nombre].md`.

## Tareas

Una fila por cada tarea de cada plan del ciclo. La fase 7 añade las filas de un plan al empezarlo, en estado `pendiente`; la columna `SDD` es el nombre del plan. Estados en `_flujo/estados.md`.

| SDD | Tarea | Estado | Commit | Notas |
|---|---|---|---|---|

## Historial de cambios hacia atrás

Anota aquí cada vez que se repite una fase ya aprobada: fecha, fase, motivo y qué fases posteriores pasaron a `por revisar`.

| Fecha | Fase repetida | Motivo | Fases afectadas |
|---|---|---|---|
