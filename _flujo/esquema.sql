-- Esquema de la base de datos del estado del flujo (SQLite). Versión 1.
-- Lo escribe el comando de estado de la plantilla; Rumbo solo lo lee (decisión 54).
-- Reparto (decisiones 45, 51 y 53): la base manda en el ESTADO; los documentos de git mandan en el CONTENIDO.
-- Las filas de contenido (requerimientos, criterios, tests, títulos de tareas) son un índice derivado de los
-- documentos, que las carga un lector al aprobar cada fase; nadie las escribe a mano.
-- Vocabulario fijo: los mismos valores que `_flujo/convenciones.md` y `_flujo/estados.md`.
-- Evolución (decisión 55): lo que añade (tabla nueva, columna opcional) no cambia la versión mayor.

PRAGMA foreign_keys = ON;

-- ---------- metadatos ----------
CREATE TABLE meta (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);
INSERT INTO meta (clave, valor) VALUES ('esquema_version', '1');

-- ---------- proyecto y repositorios ----------
-- Una base por persona con todos sus proyectos. El repositorio solo guarda `uuid` y el nombre del perfil (decisión 46).
CREATE TABLE proyecto (
  id        INTEGER PRIMARY KEY,
  uuid      TEXT NOT NULL UNIQUE,
  nombre    TEXT NOT NULL UNIQUE,
  inicio    TEXT                       -- AAAA-MM-DD
);

-- Un proyecto sigue siendo un repositorio (decisión 59), pero el campo ya existe para poder ampliarlo.
CREATE TABLE repositorio (
  id          INTEGER PRIMARY KEY,
  proyecto_id INTEGER NOT NULL REFERENCES proyecto(id),
  nombre      TEXT NOT NULL,
  url         TEXT,
  principal   INTEGER NOT NULL DEFAULT 1 CHECK (principal IN (0, 1)),
  UNIQUE (proyecto_id, nombre)
);

-- Siguiente identificador libre por tipo (la numeración es única en todo el proyecto).
CREATE TABLE contador (
  proyecto_id INTEGER NOT NULL REFERENCES proyecto(id),
  tipo        TEXT NOT NULL CHECK (tipo IN ('H', 'R', 'T', 'TA', 'G', 'V')),
  siguiente   INTEGER NOT NULL CHECK (siguiente >= 1),
  PRIMARY KEY (proyecto_id, tipo)
);

-- ---------- ciclo y fases ----------
CREATE TABLE ciclo (
  id          INTEGER PRIMARY KEY,
  proyecto_id INTEGER NOT NULL REFERENCES proyecto(id),
  posicion    INTEGER NOT NULL,                       -- orden en la hoja de ruta
  numero      INTEGER,                                -- NULL mientras es `previsto`
  carpeta     TEXT,                                   -- `_docs/ciclos/NN-nombre`
  objetivo    TEXT NOT NULL,
  estado      TEXT NOT NULL CHECK (estado IN ('previsto', 'abierto', 'cerrado', 'descartado')),
  via         TEXT CHECK (via IN ('completa', 'corta')),
  origen      TEXT,
  abierto     TEXT,
  cerrado     TEXT,
  UNIQUE (proyecto_id, posicion),
  UNIQUE (proyecto_id, numero)
);
-- Solo un ciclo abierto por proyecto.
CREATE UNIQUE INDEX un_ciclo_abierto ON ciclo (proyecto_id) WHERE estado = 'abierto';

-- Fases por ciclo: 0, 1, 2, 3, 4, 5, 6 y 9, una fila de cada una. La 7 y la 8 no se aprueban (su avance está en las tareas).
-- Las filas de las fases 4 y 5 resumen el estado de todos los SDD del ciclo; las escribe el comando a partir de `sdd`.
CREATE TABLE fase (
  id        INTEGER PRIMARY KEY,
  ciclo_id  INTEGER NOT NULL REFERENCES ciclo(id),
  numero    INTEGER NOT NULL CHECK (numero IN (0, 1, 2, 3, 4, 5, 6, 9)),
  estado    TEXT NOT NULL CHECK (estado IN ('pendiente', 'hecho', 'borrador', 'aprobado', 'por revisar', 'no aplica')),
  fecha     TEXT,
  notas     TEXT,
  UNIQUE (ciclo_id, numero)
);

-- Un SDD cuelga de la fase 4 de su ciclo (0 a n: ninguno hasta que se ejecuta la fase 4, uno o varios después).
-- El ciclo se deduce de la fase. Que `fase_id` sea la fila de la fase 4 lo comprueba el validador.
-- Lleva el estado propio de sus fases 4 (SDD) y 5 (tareas), que se aprueban por separado en cada SDD.
CREATE TABLE sdd (
  id            INTEGER PRIMARY KEY,
  fase_id       INTEGER NOT NULL REFERENCES fase(id),
  nombre        TEXT NOT NULL,
  orden         INTEGER NOT NULL CHECK (orden >= 1),   -- orden de implementación (sdd-indice.md); 1 si solo hay uno
  estado_sdd    TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_sdd IN ('pendiente', 'borrador', 'aprobado', 'por revisar', 'no aplica')),
  fecha_sdd     TEXT,
  estado_tareas TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_tareas IN ('pendiente', 'borrador', 'aprobado', 'por revisar', 'no aplica')),
  fecha_tareas  TEXT,
  notas         TEXT,
  UNIQUE (fase_id, nombre),
  UNIQUE (fase_id, orden)
);

-- Sin tabla (se añadirían más adelante, decisión 55, si un consumidor las pide):
-- repeticiones de fase (viven en estado.md) y dependencias entre historias o entre
-- tareas (se comprueban en los documentos; Rumbo podría usarlas para el kanban) y artefactos
-- (la lista vive en `_docs/arquitectura.md`; ningún consumidor la lee de la base).

-- ---------- contenido derivado de los documentos ----------
-- Historias (H) y requisitos (R). Cuelgan de la fase en la que nacen: la 2 (historias), la 1 (requisitos del brief
-- en la vía corta) o la 4 (requisitos añadidos en un SDD, que además llevan `sdd_id`). El ciclo se deduce de la fase.
-- Que la fase sea la que corresponde, y que los códigos no se repitan en todo el ciclo, lo comprueba el validador.
CREATE TABLE requerimiento (
  id          INTEGER PRIMARY KEY,
  fase_id     INTEGER NOT NULL REFERENCES fase(id),
  sdd_id      INTEGER REFERENCES sdd(id),
  tipo        TEXT NOT NULL CHECK (tipo IN ('H', 'R')),
  codigo      TEXT NOT NULL,                          -- H1, R12…
  titulo      TEXT NOT NULL,
  enunciado   TEXT,
  version     TEXT,
  prioridad   INTEGER,
  UNIQUE (fase_id, codigo)
);

CREATE TABLE criterio (
  id               INTEGER PRIMARY KEY,
  requerimiento_id INTEGER NOT NULL REFERENCES requerimiento(id),
  codigo           TEXT NOT NULL,                     -- H1-C1…
  texto            TEXT NOT NULL,
  sustituye_a_id   INTEGER REFERENCES criterio(id),
  UNIQUE (requerimiento_id, codigo)
);

-- El SDD de un test se deduce de la tarea que lo crea (tarea_test con accion = 'crea'), que es única.
CREATE TABLE test (
  id                 INTEGER PRIMARY KEY,
  codigo             TEXT NOT NULL,                   -- T1…
  titulo             TEXT NOT NULL,
  nivel              TEXT CHECK (nivel IN ('unitario', 'componente', 'integración', 'extremo a extremo')),
  archivo            TEXT,
  pasa_sin_codigo    INTEGER NOT NULL DEFAULT 0 CHECK (pasa_sin_codigo IN (0, 1)),
  demostracion       TEXT                             -- qué se rompió y qué falló (del commit)
);

CREATE TABLE test_criterio (
  test_id     INTEGER NOT NULL REFERENCES test(id),
  criterio_id INTEGER NOT NULL REFERENCES criterio(id),
  PRIMARY KEY (test_id, criterio_id)
);

-- ---------- tareas ----------
-- El ciclo de una tarea se deduce de su SDD (sdd -> fase 4 -> ciclo); no se repite aquí.
-- Sin repositorio_id: con un repositorio por proyecto no aporta nada. Se añade como columna opcional cuando se admitan varios (decisiones 55 y 59).
CREATE TABLE tarea (
  id             INTEGER PRIMARY KEY,
  sdd_id         INTEGER NOT NULL REFERENCES sdd(id),
  codigo         TEXT NOT NULL,                       -- TA1…
  titulo         TEXT NOT NULL,
  estado         TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'implementada', 'cambios necesarios', 'aprobada', 'bloqueada')),
  commit_hash    TEXT,                                -- lo anota el revisor al revisarla
  notas          TEXT,
  UNIQUE (sdd_id, codigo)
);

-- Historias o requisitos que cierra una tarea de cierre (`Cierre de: R14, R15`); puede cerrar varios.
-- De qué requisitos procede una tarea normal no se guarda: se deduce por sus tests
-- (tarea_test -> test_criterio -> criterio -> requerimiento). Las tareas de cierre no llevan tests.
CREATE TABLE tarea_cierre (
  tarea_id         INTEGER NOT NULL REFERENCES tarea(id),
  requerimiento_id INTEGER NOT NULL REFERENCES requerimiento(id),
  PRIMARY KEY (tarea_id, requerimiento_id)
);

-- Tests de la tarea. `modifica` = test existente que la tarea reescribe o retira (autorizado en el plan).
CREATE TABLE tarea_test (
  tarea_id INTEGER NOT NULL REFERENCES tarea(id),
  test_id  INTEGER NOT NULL REFERENCES test(id),
  accion   TEXT NOT NULL DEFAULT 'crea' CHECK (accion IN ('crea', 'modifica', 'retira')),
  PRIMARY KEY (tarea_id, test_id)
);
-- Un test se crea en una sola tarea; `modifica` y `retira` pueden repetirse.
CREATE UNIQUE INDEX un_test_una_creacion ON tarea_test (test_id) WHERE accion = 'crea';

-- ---------- huecos ----------
-- Solo se registran los huecos; un detalle `menor` va al mensaje del commit de la tarea.
-- Sin columnas de decisión: la frase de la persona vive en `huecos.md` (el validador la comprueba), el resultado
-- está en `camino` y la fecha de resolución, en `historial_estado`.
CREATE TABLE hueco (
  id             INTEGER PRIMARY KEY,
  ciclo_id       INTEGER NOT NULL REFERENCES ciclo(id),
  codigo         TEXT NOT NULL,                       -- G1…
  tarea_id       INTEGER REFERENCES tarea(id),
  abierto_por    TEXT,
  fecha          TEXT,
  camino         TEXT CHECK (camino IN ('enmienda', 'repetir fases', 'corregir código')),
  estado         TEXT NOT NULL CHECK (estado IN ('abierto', 'resuelto')),
  descripcion    TEXT NOT NULL,
  UNIQUE (ciclo_id, codigo)
);

-- Revisiones y verificación (revision, hallazgo_revision, verificacion, hallazgo_verificacion): fuera de esta versión.
-- Su consumidor sería la medición por ciclo y Rumbo (decisión 38), que aún no están definidas. Se añaden después
-- sin romper nada (decisión 55). Mientras tanto viven solo en revisiones-[nombre].md y verificacion.md.

-- ---------- aprobaciones (decisiones 50 y 52) ----------
-- Las decisiones de la persona (vía corta, hueco, hallazgo, riesgo, abrir ciclo) NO tienen tabla: su frase vive en los
-- documentos, que son el contexto de los agentes, y el validador comprueba que esté (decisión 52).
-- Solo aprobar una fase, volver a aprobarla tras un cambio y cerrar el ciclo llevan aviso de permiso.
-- `sdd_id` solo en las fases 4 y 5, que se aprueban por SDD: lo comprueba el validador.
CREATE TABLE aprobacion (
  id          INTEGER PRIMARY KEY,
  fase_id     INTEGER NOT NULL REFERENCES fase(id),
  sdd_id      INTEGER REFERENCES sdd(id),
  fecha       TEXT NOT NULL,
  via         TEXT NOT NULL CHECK (via IN ('aviso de permiso', 'otra')),   -- el validador marca las `otra`
  comando     TEXT NOT NULL
);

-- ---------- historial de cambios de estado (decisión 45) ----------
-- Quién, qué, cuándo y con qué commit. Se escribe en la misma operación que el cambio.
-- Cada fila apunta a lo que cambió con claves reales (no con texto libre); `entidad` dice cuáles se usan.
-- `sdd` es el estado de la fase 4 de un SDD (estado_sdd) y `sdd_tareas` el de su fase 5 (estado_tareas).
CREATE TABLE historial_estado (
  id          INTEGER PRIMARY KEY,
  ciclo_id    INTEGER NOT NULL REFERENCES ciclo(id),
  momento     TEXT NOT NULL,                          -- fecha y hora, ISO 8601
  entidad     TEXT NOT NULL CHECK (entidad IN ('ciclo', 'fase', 'sdd', 'sdd_tareas', 'tarea', 'hueco')),
  fase_id     INTEGER REFERENCES fase(id),            -- fase
  sdd_id      INTEGER REFERENCES sdd(id),             -- sdd y sdd_tareas
  tarea_id    INTEGER REFERENCES tarea(id),           -- tarea
  hueco_id    INTEGER REFERENCES hueco(id),           -- hueco
  de          TEXT,
  a           TEXT NOT NULL,
  quien       TEXT NOT NULL,                          -- persona o agente (programador, revisor…)
  commit_hash TEXT,
  CHECK (
    (entidad = 'ciclo'                      AND fase_id IS NULL     AND sdd_id IS NULL     AND tarea_id IS NULL     AND hueco_id IS NULL) OR
    (entidad = 'fase'                       AND fase_id IS NOT NULL AND sdd_id IS NULL     AND tarea_id IS NULL     AND hueco_id IS NULL) OR
    (entidad IN ('sdd', 'sdd_tareas')       AND fase_id IS NULL     AND sdd_id IS NOT NULL AND tarea_id IS NULL     AND hueco_id IS NULL) OR
    (entidad = 'tarea'                      AND fase_id IS NULL     AND sdd_id IS NULL     AND tarea_id IS NOT NULL AND hueco_id IS NULL) OR
    (entidad = 'hueco'                      AND fase_id IS NULL     AND sdd_id IS NULL     AND tarea_id IS NULL     AND hueco_id IS NOT NULL)
  )
);
CREATE INDEX historial_por_ciclo ON historial_estado (ciclo_id, entidad, momento);
