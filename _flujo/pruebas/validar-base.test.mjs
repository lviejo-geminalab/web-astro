// Pruebas de las comprobaciones del validador contra la base (_flujo/validar-base.mjs, reglas R-BAS-nn).
// Monta un proyecto con el propio comando de estado (que escribe también proyecto.md y estado.md), comprueba que no da
// ningún R-BAS y siembra un fallo cada vez en la base o en los documentos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

process.removeAllListeners('warning');
const { DatabaseSync } = await import('node:sqlite');
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ESTADO = path.join(AQUI, '..', 'estado.mjs');
const VALIDAR = path.join(AQUI, '..', 'validar.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'valbase-'));
const sinBase = { ...process.env, HOME: tmp }; delete sinBase.FLUJO_BASE;
let n = 0;

function proyecto() {
  const dir = path.join(tmp, `p${n++}`);
  fs.mkdirSync(dir);
  const base = path.join(dir, 'base.db');
  const run = (...a) => { const r = spawnSync(process.execPath, [ESTADO, ...a, '--ruta', base, '--json'], { encoding: 'utf8', cwd: dir }); assert.ok(r.stdout, r.stderr); return { ...JSON.parse(r.stdout), codigo: r.status }; };
  const ok = (...a) => { const r = run(...a); assert.equal(r.codigo, 0, `${a.join(' ')}: ${r.mensaje}`); return r; };
  ok('proyecto', 'iniciar', '--nombre', 'demo', '--quien', 'persona');
  ok('ciclo', 'abrir', '--nombre', 'primera', '--objetivo', 'x', '--origen', 'kickoff', '--quien', 'persona');
  ok('ciclo', 'via', 'completa', '--quien', 'persona');
  ok('sdd', 'alta', '--nombre', 'nucleo', '--orden', '1', '--quien', 'agente');
  ok('tarea', 'alta', '--sdd', 'nucleo', '--titulo', 'Algo', '--quien', 'agente');
  ok('tarea', 'estado', 'TA1', 'implementada', '--quien', 'programador');
  ok('tarea', 'estado', 'TA1', 'aprobada', '--quien', 'revisor', '--commit', 'abc1234');
  ok('fase', '1', 'borrador', '--quien', 'agente');
  ok('aprobar', 'fase', '1');
  const validar = (...extra) => {
    const r = spawnSync(process.execPath, [VALIDAR, '--raiz', dir, '--todos', '--json', ...extra], { encoding: 'utf8', env: sinBase });
    const salida = JSON.parse(r.stdout);
    return { ...salida, bas: salida.problemas.filter((p) => p.codigo.startsWith('R-BAS')) };
  };
  const sql = (consulta) => { const db = new DatabaseSync(base); db.exec(`PRAGMA foreign_keys = OFF; ${consulta}`); db.close(); };
  const doc = (rel, cambio) => { const f = path.join(dir, rel); fs.writeFileSync(f, cambio(fs.readFileSync(f, 'utf8'))); };
  return { dir, base, run, ok, validar, sql, doc };
}
const codigos = (r) => r.bas.map((p) => p.codigo).sort();

test('un proyecto llevado con el comando no da ningún R-BAS', () => {
  const p = proyecto();
  const r = p.validar('--base', p.base);
  assert.deepEqual(r.bas, [], JSON.stringify(r.bas));
  assert.match(r.base, /comprobada/);
});

test('sin base no es un error y lo dice; con --base que no existe, sí', () => {
  const p = proyecto();
  const r = p.validar();
  assert.deepEqual(r.bas, []);
  assert.match(r.base, /sin base/);
  assert.deepEqual(codigos(p.validar('--base', path.join(tmp, 'no-existe.db'))), ['R-BAS-01']);
  assert.match(p.validar('--sin-base').base, /sin-base/);
});

test('una base ajena o de otro esquema se rechaza', () => {
  const p = proyecto();
  const ajena = path.join(tmp, 'ajena.db');
  const db = new DatabaseSync(ajena); db.exec('CREATE TABLE otra (a)'); db.close();
  assert.deepEqual(codigos(p.validar('--base', ajena)), ['R-BAS-01']);
  p.sql("UPDATE meta SET valor = '99' WHERE clave = 'esquema_version'");
  assert.deepEqual(codigos(p.validar('--base', p.base)), ['R-BAS-01']);
});

test('el proyecto del repositorio no está en la base: aviso si la base es la de siempre, error si se pidió', () => {
  const p = proyecto();
  p.doc('_docs/proyecto.md', (t) => t.replace('Nombre: demo', 'Nombre: otro'));
  const otraBase = path.join(tmp, 'otra-base.db');
  assert.equal(spawnSync(process.execPath, [path.join(AQUI, '..', 'crear-base.mjs'), '--ruta', otraBase], { encoding: 'utf8' }).status, 0);
  assert.equal(p.validar('--base', otraBase).bas.find((x) => x.codigo === 'R-BAS-02').nivel, 'ERROR');
  const casa = fs.mkdtempSync(path.join(tmp, 'casa-'));
  fs.mkdirSync(path.join(casa, '.flujo'));
  fs.copyFileSync(otraBase, path.join(casa, '.flujo', 'estado.db'));
  const r = spawnSync(process.execPath, [VALIDAR, '--raiz', p.dir, '--todos', '--json'], { encoding: 'utf8', env: { ...sinBase, HOME: casa } });
  assert.equal(JSON.parse(r.stdout).problemas.find((x) => x.codigo === 'R-BAS-02').nivel, 'AVISO');
});

test('proyecto.md: ciclo activo, estado de un ciclo y contadores que no coinciden', () => {
  const p = proyecto();
  p.doc('_docs/proyecto.md', (t) => t.replace(/^Ciclo activo:.*$/m, 'Ciclo activo: ninguno').replace('| abierto |', '| cerrado |').replace('| TA (tarea) | 2 |', '| TA (tarea) | 9 |'));
  assert.deepEqual(codigos(p.validar('--base', p.base)), ['R-BAS-03', 'R-BAS-04', 'R-BAS-07']);
});

test('estado.md: estado de una fase, de una tarea y su commit', () => {
  const p = proyecto();
  p.doc('_docs/ciclos/01-primera/estado.md', (t) => t.replace('| 1 Brief | `brief.md` | aprobado |', '| 1 Brief | `brief.md` | borrador |').replace('| nucleo | TA1 | aprobada | abc1234 |', '| nucleo | TA1 | implementada | ffff000 |'));
  const r = p.validar('--base', p.base);
  assert.deepEqual(codigos(r), ['R-BAS-05', 'R-BAS-06', 'R-BAS-06']);
  assert.ok(r.bas.every((x) => x.nivel === 'ERROR'));
});

test('estado.md: una tarea que la base no tiene y un SDD que falta', () => {
  const p = proyecto();
  p.doc('_docs/ciclos/01-primera/estado.md', (t) => t.replace(/(\| nucleo \| TA1 .*\n)/, '$1| nucleo | TA7 | pendiente | | |\n').replace('`sdd-nucleo.md`', '`sdd-web.md`'));
  const c = codigos(p.validar('--base', p.base));
  assert.ok(c.includes('R-BAS-05') && c.includes('R-BAS-06'), c.join());
});

test('reglas de la base: SDD fuera de la fase 4, aprobaciones mal formadas, códigos repetidos', () => {
  const p = proyecto();
  p.sql("UPDATE sdd SET fase_id = (SELECT id FROM fase WHERE numero = 3 LIMIT 1)");
  p.sql("UPDATE aprobacion SET sdd_id = (SELECT id FROM sdd LIMIT 1)");
  assert.deepEqual(codigos(p.validar('--base', p.base)).filter((c) => ['R-BAS-10', 'R-BAS-11'].includes(c)), ['R-BAS-10', 'R-BAS-11']);
  const q = proyecto();
  q.ok('sdd', 'alta', '--nombre', 'otro', '--orden', '2', '--quien', 'agente');
  q.sql("INSERT INTO tarea (sdd_id, codigo, titulo) SELECT id, 'TA1', 'repetida' FROM sdd WHERE nombre = 'otro'");
  assert.ok(codigos(q.validar('--base', q.base)).includes('R-BAS-12'));
});

test('reglas de la base: requisito en la fase equivocada', () => {
  const p = proyecto();
  p.sql("INSERT INTO requerimiento (fase_id, tipo, codigo, titulo) SELECT id, 'H', 'H1', 'mal' FROM fase WHERE numero = 3");
  p.sql("INSERT INTO requerimiento (fase_id, tipo, codigo, titulo) SELECT id, 'R', 'R1', 'mal' FROM fase WHERE numero = 1");
  p.sql("INSERT INTO requerimiento (fase_id, tipo, codigo, titulo) SELECT id, 'R', 'H9', 'mal' FROM fase WHERE numero = 1");
  assert.equal(p.validar('--base', p.base).bas.filter((x) => x.codigo === 'R-BAS-13').length, 4);
});

test('reglas de la base: estados de tarea, hueco y fase que no encajan', () => {
  const p = proyecto();
  p.sql("UPDATE tarea SET commit_hash = NULL");
  p.ok('hueco', 'abrir', '--descripcion', 'algo', '--quien', 'persona');
  p.sql("UPDATE hueco SET tarea_id = (SELECT id FROM tarea LIMIT 1)");
  p.sql("UPDATE fase SET estado = 'aprobado' WHERE numero = 2");
  p.sql("UPDATE fase SET estado = 'aprobado' WHERE numero = 4");
  const c = codigos(p.validar('--base', p.base));
  assert.ok(c.filter((x) => x === 'R-BAS-14').length >= 2, c.join());
  assert.ok(c.includes('R-BAS-16'));
});

test('reglas de la base: contador por detrás de un código usado y aprobación de otra vía', () => {
  const p = proyecto();
  p.sql("UPDATE contador SET siguiente = 1 WHERE tipo = 'TA'");
  p.sql("UPDATE aprobacion SET via = 'otra'");
  const r = p.validar('--base', p.base);
  assert.ok(codigos(r).includes('R-BAS-18'));
  assert.equal(r.bas.find((x) => x.codigo === 'R-BAS-17').nivel, 'AVISO');
});

test('reglas de la base: la fila 4 no resume a sus SDD y un ciclo cerrado sin la fase 9 aprobada', () => {
  const p = proyecto();
  p.ok('sdd', 'estado', 'nucleo', 'sdd', 'borrador', '--quien', 'agente');
  p.sql("UPDATE fase SET estado = 'aprobado' WHERE numero = 4");
  p.sql("UPDATE ciclo SET estado = 'cerrado'");
  const c = codigos(p.validar('--base', p.base));
  assert.ok(c.includes('R-BAS-15'));
  assert.ok(c.includes('R-BAS-19'));
});
