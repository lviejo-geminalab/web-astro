// Pruebas del esquema de la base de datos del estado y del script que la crea. Node sin dependencias:
//   node --test "_flujo/pruebas/*.test.mjs"
// Cada prueba crea la base en una carpeta temporal (fuera de cualquier repositorio) y comprueba que las restricciones
// del esquema aceptan lo válido y rechazan lo que no.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

process.removeAllListeners('warning');
const { DatabaseSync } = await import('node:sqlite');

const RAIZ_FLUJO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CREAR = path.join(RAIZ_FLUJO, 'crear-base.mjs');
const ESQUEMA = fs.readFileSync(path.join(RAIZ_FLUJO, 'esquema.sql'), 'utf8');

const temporal = () => fs.mkdtempSync(path.join(os.tmpdir(), 'flujo-base-'));
function crear(...extra) {
  const r = spawnSync(process.execPath, [CREAR, ...extra], { encoding: 'utf8', env: { ...process.env, FLUJO_BASE: '' } });
  return { codigo: r.status, salida: (r.stdout + r.stderr).trim() };
}
function baseEnMemoria() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(ESQUEMA);
  return db;
}
const rechaza = (db, sql, ...a) => assert.throws(() => db.prepare(sql).run(...a), undefined, `debía rechazar: ${sql}`);
const acepta = (db, sql, ...a) => db.prepare(sql).run(...a);

// Un proyecto con un ciclo abierto, sus fases 2 y 4, un SDD, una tarea y un test, para probar las relaciones.
function proyectoBase() {
  const db = baseEnMemoria();
  db.exec(`
    INSERT INTO proyecto (id, uuid, nombre) VALUES (1, 'u-1', 'prueba');
    INSERT INTO ciclo (id, proyecto_id, posicion, numero, objetivo, estado) VALUES (1, 1, 1, 1, 'primero', 'abierto');
    INSERT INTO fase (id, ciclo_id, numero, estado) VALUES (2, 1, 2, 'borrador'), (3, 1, 3, 'pendiente'), (4, 1, 4, 'pendiente');
    INSERT INTO sdd (id, fase_id, nombre, orden) VALUES (1, 4, 'web', 1);
    INSERT INTO tarea (id, sdd_id, codigo, titulo) VALUES (1, 1, 'TA1', 'primera'), (2, 1, 'TA2', 'segunda');
    INSERT INTO test (id, codigo, titulo) VALUES (1, 'T1', 'primero');
    INSERT INTO requerimiento (id, fase_id, tipo, codigo, titulo) VALUES (1, 2, 'H', 'H1', 'historia');
  `);
  return db;
}

// ---------- el script que crea la base ----------
test('crear-base: crea la base con todas las tablas, la versión y permisos restringidos', () => {
  const dir = temporal();
  const ruta = path.join(dir, 'estado.db');
  const r = crear('--ruta', ruta);
  assert.equal(r.codigo, 0, r.salida);
  assert.match(r.salida, /Base creada/);
  const db = new DatabaseSync(ruta);
  assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type = 'table'").get().n, 18);
  assert.equal(db.prepare("SELECT valor FROM meta WHERE clave = 'esquema_version'").get().valor, '1');
  db.close();
  if (process.platform !== 'win32') assert.equal(fs.statSync(ruta).mode & 0o777, 0o600);
});

test('crear-base: es idempotente y no toca una base que ya existe', () => {
  const dir = temporal();
  const ruta = path.join(dir, 'estado.db');
  assert.equal(crear('--ruta', ruta).codigo, 0);
  const db = new DatabaseSync(ruta);
  db.exec("INSERT INTO proyecto (uuid, nombre) VALUES ('u-1', 'guardado')");
  db.close();
  const r = crear('--ruta', ruta);
  assert.equal(r.codigo, 0, r.salida);
  assert.match(r.salida, /ya existe/);
  const db2 = new DatabaseSync(ruta);
  assert.equal(db2.prepare('SELECT count(*) AS n FROM proyecto').get().n, 1);
  db2.close();
});

test('crear-base: se detiene si la ruta está dentro de un repositorio git', () => {
  const dir = temporal();
  execFileSync('git', ['init', '-q', dir]);
  const r = crear('--ruta', path.join(dir, 'datos', 'estado.db'));
  assert.equal(r.codigo, 2);
  assert.match(r.salida, /dentro del repositorio/);
  assert.equal(fs.existsSync(path.join(dir, 'datos')), false);
});

test('crear-base: no toca un fichero que no es una base del flujo', () => {
  const dir = temporal();
  const ruta = path.join(dir, 'otra.db');
  const db = new DatabaseSync(ruta);
  db.exec('CREATE TABLE cosas (x INTEGER)');
  db.close();
  const r = crear('--ruta', ruta);
  assert.equal(r.codigo, 3);
  assert.match(r.salida, /no es una base del flujo/);
});

test('crear-base: se detiene si la base es de un esquema más nuevo que la plantilla', () => {
  const dir = temporal();
  const ruta = path.join(dir, 'estado.db');
  assert.equal(crear('--ruta', ruta).codigo, 0);
  const db = new DatabaseSync(ruta);
  db.exec("UPDATE meta SET valor = '99' WHERE clave = 'esquema_version'");
  db.close();
  const r = crear('--ruta', ruta);
  assert.equal(r.codigo, 3);
  assert.match(r.salida, /más nuevo/);
});

test('crear-base: usa la variable FLUJO_BASE cuando no hay --ruta', () => {
  const dir = temporal();
  const ruta = path.join(dir, 'por-entorno.db');
  const r = spawnSync(process.execPath, [CREAR], { encoding: 'utf8', env: { ...process.env, FLUJO_BASE: ruta } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(fs.existsSync(ruta), true);
});

// ---------- restricciones del esquema ----------
test('esquema: solo puede haber un ciclo abierto por proyecto', () => {
  const db = proyectoBase();
  rechaza(db, "INSERT INTO ciclo (proyecto_id, posicion, numero, objetivo, estado) VALUES (1, 2, 2, 'otro', 'abierto')");
  acepta(db, "INSERT INTO ciclo (proyecto_id, posicion, objetivo, estado) VALUES (1, 2, 'previsto', 'previsto')");
});

test('esquema: una fila por fase y ciclo, con números válidos', () => {
  const db = proyectoBase();
  rechaza(db, "INSERT INTO fase (ciclo_id, numero, estado) VALUES (1, 4, 'pendiente')");
  rechaza(db, "INSERT INTO fase (ciclo_id, numero, estado) VALUES (1, 7, 'pendiente')");
  rechaza(db, "INSERT INTO fase (ciclo_id, numero, estado) VALUES (1, 6, 'inventado')");
});

test('esquema: los SDD de una fase tienen nombre y orden distintos', () => {
  const db = proyectoBase();
  acepta(db, "INSERT INTO sdd (fase_id, nombre, orden) VALUES (4, 'api', 2)");
  rechaza(db, "INSERT INTO sdd (fase_id, nombre, orden) VALUES (4, 'web', 3)");
  rechaza(db, "INSERT INTO sdd (fase_id, nombre, orden) VALUES (4, 'cli', 2)");
  rechaza(db, "INSERT INTO sdd (fase_id, nombre, orden) VALUES (4, 'cli', 0)");
  rechaza(db, "INSERT INTO sdd (fase_id, nombre, orden) VALUES (99, 'cli', 3)");
});

test('esquema: una historia no repite código en su fase y un criterio no repite el suyo en su requerimiento', () => {
  const db = proyectoBase();
  rechaza(db, "INSERT INTO requerimiento (fase_id, tipo, codigo, titulo) VALUES (2, 'H', 'H1', 'repetida')");
  acepta(db, "INSERT INTO requerimiento (fase_id, sdd_id, tipo, codigo, titulo) VALUES (4, 1, 'R', 'R5', 'añadido en el SDD')");
  acepta(db, "INSERT INTO criterio (requerimiento_id, codigo, texto) VALUES (1, 'H1-C1', 'uno')");
  rechaza(db, "INSERT INTO criterio (requerimiento_id, codigo, texto) VALUES (1, 'H1-C1', 'repetido')");
  acepta(db, "INSERT INTO criterio (requerimiento_id, codigo, texto) VALUES (1, 'H1-C2', 'dos')");
});

test('esquema: un test se crea en una sola tarea, pero puede modificarse en otras', () => {
  const db = proyectoBase();
  acepta(db, "INSERT INTO tarea_test (tarea_id, test_id, accion) VALUES (1, 1, 'crea')");
  rechaza(db, "INSERT INTO tarea_test (tarea_id, test_id, accion) VALUES (2, 1, 'crea')");
  acepta(db, "INSERT INTO tarea_test (tarea_id, test_id, accion) VALUES (2, 1, 'modifica')");
});

test('esquema: una tarea de cierre puede cerrar varios requisitos', () => {
  const db = proyectoBase();
  acepta(db, "INSERT INTO requerimiento (fase_id, sdd_id, tipo, codigo, titulo) VALUES (4, 1, 'R', 'R14', 'a'), (4, 1, 'R', 'R15', 'b')");
  acepta(db, 'INSERT INTO tarea_cierre (tarea_id, requerimiento_id) VALUES (2, 2), (2, 3)');
  rechaza(db, 'INSERT INTO tarea_cierre (tarea_id, requerimiento_id) VALUES (2, 2)');
  rechaza(db, 'INSERT INTO tarea_cierre (tarea_id, requerimiento_id) VALUES (2, 99)');
});

test('esquema: las tareas no repiten código dentro de su SDD y tienen estados fijos', () => {
  const db = proyectoBase();
  rechaza(db, "INSERT INTO tarea (sdd_id, codigo, titulo) VALUES (1, 'TA1', 'repetida')");
  rechaza(db, "INSERT INTO tarea (sdd_id, codigo, titulo, estado) VALUES (1, 'TA3', 'x', 'terminada')");
  rechaza(db, "INSERT INTO tarea (sdd_id, codigo, titulo) VALUES (99, 'TA3', 'x')");
});

test('esquema: el historial apunta a lo que cambió con las claves que corresponden a su entidad', () => {
  const db = proyectoBase();
  const h = (entidad, fase, sdd, tarea, hueco) => () => db.prepare(
    "INSERT INTO historial_estado (ciclo_id, momento, entidad, fase_id, sdd_id, tarea_id, hueco_id, a, quien) VALUES (1, '2026-11-24T10:00:00', ?, ?, ?, ?, ?, 'x', 'persona')"
  ).run(entidad, fase, sdd, tarea, hueco);
  assert.doesNotThrow(h('ciclo', null, null, null, null));
  assert.doesNotThrow(h('fase', 2, null, null, null));
  assert.doesNotThrow(h('sdd', null, 1, null, null));
  assert.doesNotThrow(h('sdd_tareas', null, 1, null, null));
  assert.doesNotThrow(h('tarea', null, null, 1, null));
  assert.throws(h('tarea', null, null, null, null));
  assert.throws(h('fase', 2, 1, null, null));
  assert.throws(h('tarea', null, null, 99, null));
  assert.throws(h('cosa', null, null, null, null));
});

test('esquema: la aprobación apunta a una fase que existe', () => {
  const db = proyectoBase();
  acepta(db, "INSERT INTO aprobacion (fase_id, fecha, via, comando) VALUES (2, '2026-11-24', 'aviso de permiso', 'aprobar 2')");
  acepta(db, "INSERT INTO aprobacion (fase_id, fecha, via, comando) VALUES (2, '2026-11-25', 'aviso de permiso', 'aprobar 2')");
  rechaza(db, "INSERT INTO aprobacion (fase_id, fecha, via, comando) VALUES (99, '2026-11-24', 'aviso de permiso', 'x')");
  rechaza(db, "INSERT INTO aprobacion (fase_id, fecha, via, comando) VALUES (2, '2026-11-24', 'a escondidas', 'x')");
});

test('esquema: un hueco solo tiene los caminos y estados del flujo', () => {
  const db = proyectoBase();
  acepta(db, "INSERT INTO hueco (ciclo_id, codigo, tarea_id, estado, camino, descripcion) VALUES (1, 'G1', 1, 'abierto', NULL, 'falta algo')");
  rechaza(db, "INSERT INTO hueco (ciclo_id, codigo, estado, descripcion) VALUES (1, 'G1', 'abierto', 'repetido')");
  rechaza(db, "INSERT INTO hueco (ciclo_id, codigo, estado, camino, descripcion) VALUES (1, 'G2', 'resuelto', 'ignorar', 'x')");
  rechaza(db, "INSERT INTO hueco (ciclo_id, codigo, estado, descripcion) VALUES (1, 'G2', 'olvidado', 'x')");
});

test('esquema: el contador solo numera los tipos de identificador del flujo', () => {
  const db = proyectoBase();
  acepta(db, "INSERT INTO contador (proyecto_id, tipo, siguiente) VALUES (1, 'H', 2), (1, 'V', 1)");
  rechaza(db, "INSERT INTO contador (proyecto_id, tipo, siguiente) VALUES (1, 'X', 1)");
  rechaza(db, "INSERT INTO contador (proyecto_id, tipo, siguiente) VALUES (1, 'H', 3)");
  rechaza(db, "INSERT INTO contador (proyecto_id, tipo, siguiente) VALUES (1, 'R', 0)");
});

test('esquema: el catálogo de fases da nombre a cada número y la 7 y la 8 no llevan estado', () => {
  const db = baseEnMemoria();
  const filas = db.prepare('SELECT numero, nombre, con_estado FROM fase_definicion ORDER BY numero').all();
  assert.deepEqual(filas.map((f) => f.numero), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(filas.find((f) => f.numero === 1).nombre, 'brief');
  assert.deepEqual(filas.filter((f) => !f.con_estado).map((f) => f.numero), [7, 8]);
  // Las fases con estado del catálogo son exactamente las que se pueden guardar en `fase`.
  assert.deepEqual(filas.filter((f) => f.con_estado).map((f) => f.numero), [0, 1, 2, 3, 4, 5, 6, 9]);
});
