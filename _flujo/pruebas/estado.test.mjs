// Pruebas del comando de estado (_flujo/estado.mjs).
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
const CMD = path.join(AQUI, '..', 'estado.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'estado-'));
let n = 0;
function nuevaBase() {
  const dir = path.join(tmp, `p${n++}`);
  fs.mkdirSync(dir);
  const ruta = path.join(dir, 'base.db');
  const run = (...a) => { const r = spawnSync(process.execPath, [CMD, ...a, '--ruta', ruta, '--json'], { encoding: 'utf8', cwd: dir }); return { ...(r.stdout ? JSON.parse(r.stdout) : { mensaje: r.stderr }), codigo: r.status }; };
  return { ruta, dir, run, proyectoMd: () => fs.readFileSync(path.join(dir, '_docs', 'proyecto.md'), 'utf8'), estadoMd: () => fs.readFileSync(path.join(dir, '_docs', 'ciclos', '01-primera-version', 'estado.md'), 'utf8') };
}
function consulta(ruta, sql) { const db = new DatabaseSync(ruta, { readOnly: true }); try { return db.prepare(sql).all(); } finally { db.close(); } }
function conCiclo() {
  const b = nuevaBase();
  assert.equal(b.run('proyecto', 'iniciar', '--nombre', 'demo', '--quien', 'persona').codigo, 0);
  assert.equal(b.run('ciclo', 'abrir', '--nombre', 'Primera versión', '--objetivo', 'x', '--origen', 'kickoff', '--quien', 'persona').codigo, 0);
  return b;
}
function conTarea() {
  const b = conCiclo();
  b.run('sdd', 'alta', '--nombre', 'nucleo', '--orden', '1', '--quien', 'agente');
  b.run('tarea', 'alta', '--sdd', 'nucleo', '--titulo', 'Algo', '--quien', 'agente');
  return b;
}

test('proyecto iniciar crea base, proyecto, repositorio y seis contadores', () => {
  const b = nuevaBase();
  const r = b.run('proyecto', 'iniciar', '--nombre', 'demo', '--quien', 'persona');
  assert.equal(r.codigo, 0);
  assert.equal(consulta(b.ruta, 'SELECT count(*) n FROM contador')[0].n, 6);
  assert.equal(consulta(b.ruta, 'SELECT count(*) n FROM repositorio WHERE principal = 1')[0].n, 1);
  assert.equal(b.run('proyecto', 'iniciar', '--nombre', 'demo', '--quien', 'persona').codigo, 3);
});

test('ciclo abrir crea ocho fases, carpeta con número y la fase 0 en hecho; solo uno abierto', () => {
  const b = conCiclo();
  assert.equal(consulta(b.ruta, 'SELECT count(*) n FROM fase')[0].n, 8);
  assert.equal(consulta(b.ruta, 'SELECT estado FROM fase WHERE numero = 0')[0].estado, 'hecho');
  assert.equal(consulta(b.ruta, 'SELECT carpeta FROM ciclo')[0].carpeta, '_docs/ciclos/01-primera-version');
  assert.equal(b.run('ciclo', 'abrir', '--nombre', 'otro', '--objetivo', 'y', '--quien', 'persona').codigo, 3);
});

test('ciclo abrir --desde completa un previsto y lo coloca tras los no previstos', () => {
  const b = conCiclo();
  b.run('ciclo', 'prever', '--objetivo', 'A', '--origen', 'brief', '--quien', 'agente');
  b.run('ciclo', 'prever', '--objetivo', 'B', '--origen', 'brief', '--quien', 'agente');
  b.run('ciclo', 'descartar', '1', '--quien', 'persona');
  const r = b.run('ciclo', 'abrir', '--nombre', 'segundo', '--desde', '3', '--quien', 'persona');
  assert.equal(r.codigo, 0, r.mensaje);
  assert.deepEqual(consulta(b.ruta, 'SELECT posicion, numero, estado FROM ciclo ORDER BY posicion').map((c) => `${c.posicion}:${c.numero}:${c.estado}`), ['1:1:descartado', '2:2:abierto', '3:null:previsto']);
});

test('las fases se cambian con las transiciones de estados.md y dejan historial', () => {
  const b = conCiclo();
  assert.equal(b.run('fase', '1', 'borrador', '--quien', 'agente').codigo, 0);
  assert.equal(b.run('fase', '1', 'hecho', '--quien', 'agente').codigo, 3);
  assert.equal(b.run('fase', '1', 'borrador', '--quien', 'agente').codigo, 3);
  assert.equal(b.run('fase', '2', 'no aplica', '--quien', 'persona').codigo, 0);
  assert.equal(b.run('fase', '4', 'borrador', '--quien', 'agente').codigo, 3);
  assert.equal(consulta(b.ruta, "SELECT count(*) n FROM historial_estado WHERE entidad = 'fase' AND a = 'borrador'")[0].n, 1);
  assert.equal(b.run('fase', '1', 'borrador').codigo, 2, 'falta --quien');
});

test('aprobado y por revisar se rechazan: van por otra vía', () => {
  const b = conCiclo();
  b.run('fase', '1', 'borrador', '--quien', 'agente');
  const r = b.run('fase', '1', 'aprobado', '--quien', 'persona');
  assert.equal(r.codigo, 3);
  assert.match(r.mensaje, /aprobaci/);
  assert.equal(b.run('fase', '1', 'por revisar', '--quien', 'persona').codigo, 3);
  assert.equal(consulta(b.ruta, 'SELECT estado FROM fase WHERE numero = 1')[0].estado, 'borrador');
});

test('las filas 4 y 5 resumen los SDD', () => {
  const b = conCiclo();
  b.run('sdd', 'alta', '--nombre', 'a', '--orden', '1', '--quien', 'agente');
  b.run('sdd', 'alta', '--nombre', 'b', '--orden', '2', '--quien', 'agente');
  assert.equal(b.run('sdd', 'alta', '--nombre', 'a', '--orden', '3', '--quien', 'agente').codigo, 3);
  assert.equal(b.run('sdd', 'alta', '--nombre', 'c', '--orden', '2', '--quien', 'agente').codigo, 3);
  b.run('sdd', 'estado', 'a', 'sdd', 'borrador', '--quien', 'agente');
  assert.equal(consulta(b.ruta, 'SELECT estado FROM fase WHERE numero = 4')[0].estado, 'borrador');
  assert.equal(consulta(b.ruta, 'SELECT estado FROM fase WHERE numero = 5')[0].estado, 'pendiente');
});

test('tarea: transiciones y quién las pide', () => {
  const b = conTarea();
  assert.equal(b.run('tarea', 'estado', 'TA1', 'aprobada', '--quien', 'revisor', '--commit', 'abc').codigo, 3, 'pendiente no pasa a aprobada');
  assert.equal(b.run('tarea', 'estado', 'TA1', 'implementada', '--quien', 'revisor').codigo, 3, 'implementar es del programador');
  assert.equal(b.run('tarea', 'estado', 'TA1', 'implementada', '--quien', 'programador').codigo, 0);
  assert.equal(b.run('tarea', 'estado', 'TA1', 'aprobada', '--quien', 'revisor').codigo, 2, 'falta el commit');
  assert.equal(b.run('tarea', 'estado', 'TA1', 'aprobada', '--quien', 'programador', '--commit', 'abc').codigo, 3, 'aprobar es del revisor');
  assert.equal(b.run('tarea', 'estado', 'TA1', 'aprobada', '--quien', 'revisor', '--commit', 'abc1234').codigo, 0);
  const t = consulta(b.ruta, 'SELECT estado, commit_hash FROM tarea')[0];
  assert.deepEqual([t.estado, t.commit_hash], ['aprobada', 'abc1234']);
  assert.equal(b.run('tarea', 'estado', 'TA9', 'implementada', '--quien', 'programador').codigo, 2);
});

test('hueco abrir bloquea la tarea y hueco resolver la libera', () => {
  const b = conTarea();
  b.run('tarea', 'estado', 'TA1', 'implementada', '--quien', 'programador');
  const abierto = b.run('hueco', 'abrir', '--descripcion', 'Falta algo', '--tarea', 'TA1', '--quien', 'programador');
  assert.equal(abierto.codigo, 0);
  assert.match(abierto.mensaje, /G1/);
  assert.equal(consulta(b.ruta, 'SELECT estado, notas FROM tarea')[0].estado, 'bloqueada');
  assert.equal(b.run('tarea', 'estado', 'TA1', 'implementada', '--quien', 'programador').codigo, 3, 'una tarea bloqueada no sale sola');
  assert.equal(b.run('hueco', 'resolver', 'G1', '--camino', 'enmienda', '--quien', 'persona').codigo, 2, 'falta --tarea-a');
  assert.equal(b.run('hueco', 'resolver', 'G1', '--camino', 'enmienda', '--tarea-a', 'aprobada', '--quien', 'persona').codigo, 3, 'sin commit no vuelve a aprobada');
  assert.equal(b.run('hueco', 'resolver', 'G1', '--camino', 'corregir código', '--tarea-a', 'cambios necesarios', '--quien', 'persona').codigo, 0);
  assert.equal(consulta(b.ruta, 'SELECT estado FROM tarea')[0].estado, 'cambios necesarios');
  assert.equal(consulta(b.ruta, 'SELECT estado, camino FROM hueco')[0].estado, 'resuelto');
  assert.equal(b.run('hueco', 'resolver', 'G1', '--camino', 'enmienda', '--quien', 'persona').codigo, 3, 'ya resuelto');
});

test('un hueco sin tarea no bloquea nada y admite el camino antes de resolverse', () => {
  const b = conTarea();
  b.run('hueco', 'abrir', '--descripcion', 'Duda de la arquitectura', '--quien', 'persona');
  assert.equal(b.run('hueco', 'camino', 'G1', '--camino', 'inventado', '--quien', 'persona').codigo, 2);
  assert.equal(b.run('hueco', 'camino', 'G1', '--camino', 'enmienda', '--quien', 'persona').codigo, 0);
  assert.equal(b.run('hueco', 'resolver', 'G1', '--quien', 'persona').codigo, 0);
});

test('repetir una fase vuelve a borrador la repetida y a por revisar las posteriores', () => {
  const b = conCiclo();
  b.run('fase', '1', 'borrador', '--quien', 'agente');
  b.run('fase', '2', 'borrador', '--quien', 'agente');
  b.run('sdd', 'alta', '--nombre', 'a', '--orden', '1', '--quien', 'agente');
  b.run('sdd', 'estado', 'a', 'sdd', 'borrador', '--quien', 'agente');
  const db = new DatabaseSync(b.ruta);
  db.exec("UPDATE fase SET estado = 'aprobado' WHERE numero IN (1, 2); UPDATE sdd SET estado_sdd = 'aprobado'");
  db.close();
  assert.equal(b.run('repetir', '1', '--motivo', 'texto').codigo, 2);
  const r = b.run('repetir', '1', '--motivo', 'G1', '--quien', 'persona');
  assert.equal(r.codigo, 0, r.mensaje);
  const e = Object.fromEntries(consulta(b.ruta, 'SELECT numero, estado FROM fase').map((f) => [f.numero, f.estado]));
  assert.equal(e[1], 'borrador');
  assert.equal(e[2], 'por revisar');
  assert.equal(e[3], 'pendiente');
  assert.equal(consulta(b.ruta, 'SELECT estado_sdd FROM sdd')[0].estado_sdd, 'por revisar');
  assert.equal(e[4], 'por revisar');
  assert.equal(b.run('repetir', '3', '--motivo', 'G1', '--quien', 'persona').codigo, 3, 'una fase pendiente no se repite');
});

test('siguiente entrega identificadores seguidos y no los reutiliza', () => {
  const b = conCiclo();
  assert.deepEqual(b.run('siguiente', 'R', '--cantidad', '3', '--quien', 'agente').codigos, ['R1', 'R2', 'R3']);
  assert.deepEqual(b.run('siguiente', 'R', '--quien', 'agente').codigos, ['R4']);
  assert.equal(b.run('siguiente', 'X', '--quien', 'agente').codigo, 2);
});

test('sin base, con base ajena o más nueva, se detiene con el código 4', () => {
  const b = nuevaBase();
  assert.equal(b.run('fase', '1', 'borrador', '--quien', 'x').codigo, 4);
  const ajena = path.join(tmp, 'ajena.db');
  const db = new DatabaseSync(ajena); db.exec('CREATE TABLE otra (a)'); db.close();
  const r = spawnSync(process.execPath, [CMD, '--ruta', ajena, 'fase', '1', 'borrador', '--quien', 'x'], { encoding: 'utf8', cwd: tmp });
  assert.equal(r.status, 4);
  const c = conCiclo();
  const d = new DatabaseSync(c.ruta); d.exec("UPDATE meta SET valor = '99' WHERE clave = 'esquema_version'"); d.close();
  const r2 = c.run('fase', '1', 'borrador', '--quien', 'x');
  assert.equal(r2.codigo, 4);
  assert.match(r2.mensaje, /más nueva/);
});

test('con varios proyectos hay que decir cuál', () => {
  const b = conCiclo();
  b.run('proyecto', 'iniciar', '--nombre', 'otro', '--quien', 'persona');
  assert.equal(b.run('fase', '1', 'borrador', '--quien', 'x').codigo, 2);
  assert.equal(b.run('fase', '1', 'borrador', '--quien', 'x', '--proyecto', 'demo').codigo, 0);
});

test('un cambio que falla no deja nada a medias', () => {
  const b = conTarea();
  b.run('hueco', 'abrir', '--descripcion', 'a', '--tarea', 'TA1', '--quien', 'revisor');
  const antes = consulta(b.ruta, 'SELECT count(*) n FROM historial_estado')[0].n;
  assert.equal(b.run('hueco', 'abrir', '--descripcion', 'b', '--tarea', 'TA1', '--quien', 'revisor').codigo, 3);
  assert.equal(consulta(b.ruta, 'SELECT count(*) n FROM hueco')[0].n, 1);
  assert.equal(consulta(b.ruta, 'SELECT siguiente FROM contador WHERE tipo = \'G\'')[0].siguiente, 2);
  assert.equal(consulta(b.ruta, 'SELECT count(*) n FROM historial_estado')[0].n, antes);
});

test('ciclo abrir crea estado.md desde la plantilla con las fases de la base', () => {
  const b = conCiclo();
  const md = b.estadoMd();
  assert.match(md, /^Ciclo: 01-primera-version$/m);
  assert.match(md, /\| 0 Apertura \| idea del ciclo \| hecho \| \d{4}-\d{2}-\d{2} \|/);
  assert.match(md, /\| 1 Brief \| `brief.md` \| pendiente \|/);
  assert.match(md, /Estados posibles/);
});

test('cada cambio pone al día estado.md: vía, fases por SDD y tabla de tareas', () => {
  const b = conTarea();
  b.run('ciclo', 'via', 'completa', '--quien', 'persona');
  b.run('sdd', 'estado', 'nucleo', 'sdd', 'borrador', '--quien', 'agente');
  b.run('tarea', 'estado', 'TA1', 'implementada', '--quien', 'programador');
  b.run('tarea', 'estado', 'TA1', 'aprobada', '--quien', 'revisor', '--commit', 'abc1234');
  const md = b.estadoMd();
  assert.match(md, /^Vía: completa$/m);
  assert.match(md, /\| 4 SDD \| `sdd-nucleo.md` \| borrador \|/);
  assert.match(md, /\| 5 Tareas \| `tareas-nucleo.md` \| pendiente \|/);
  assert.match(md, /\| nucleo \| TA1 \| aprobada \| abc1234 \| \|/);
  assert.doesNotMatch(md, /sdd-\[nombre\]/);
});

test('lo escrito a mano se respeta; una celda de estado que difiere se corrige con aviso', () => {
  const b = conCiclo();
  const f = path.join(b.dir, '_docs', 'ciclos', '01-primera-version', 'estado.md');
  let md = fs.readFileSync(f, 'utf8');
  md = md.replace('| 1 Brief | `brief.md` | pendiente | | |', '| 1 Brief | `brief.md` | aprobado | | nota a mano |').replace('# Estado del ciclo', '# Estado del ciclo\n\nTexto añadido por una persona.');
  fs.writeFileSync(f, md);
  const r = b.run('fase', '1', 'borrador', '--quien', 'agente');
  assert.equal(r.codigo, 0, r.mensaje);
  assert.equal(r.avisos.length, 1);
  assert.match(r.avisos[0], /decía `aprobado`.*base dice `pendiente`/);
  const nuevo = b.estadoMd();
  assert.match(nuevo, /\| 1 Brief \| `brief.md` \| borrador \| \| nota a mano \|/);
  assert.match(nuevo, /Texto añadido por una persona\./);
});

test('repetir añade una fila al historial de cambios hacia atrás', () => {
  const b = conCiclo();
  b.run('fase', '1', 'borrador', '--quien', 'agente');
  b.run('fase', '2', 'borrador', '--quien', 'agente');
  const db = new DatabaseSync(b.ruta); db.exec("UPDATE fase SET estado = 'aprobado' WHERE numero IN (1, 2)"); db.close();
  b.run('repetir', '1', '--motivo', 'G3', '--quien', 'persona');
  assert.match(b.estadoMd(), /\| \d{4}-\d{2}-\d{2} \| 1 Brief \| G3 \| 2 pasan a `por revisar` \|/);
});

test('regenerar rehace el documento desde la base', () => {
  const b = conTarea();
  const f = path.join(b.dir, '_docs', 'ciclos', '01-primera-version', 'estado.md');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('| nucleo | TA1 | pendiente |', '| nucleo | TA1 | aprobada |'));
  const r = b.run('regenerar');
  assert.equal(r.codigo, 0);
  assert.equal(r.avisos.length, 1);
  assert.match(b.estadoMd(), /\| nucleo \| TA1 \| pendiente \|/);
});

test('si no se puede escribir el documento, la base queda guardada y sale con el código 5', () => {
  const b = conCiclo();
  const carpeta = path.join(b.dir, '_docs', 'ciclos', '01-primera-version');
  fs.rmSync(carpeta, { recursive: true });
  fs.writeFileSync(carpeta, 'esto es un fichero, no una carpeta');
  const r = b.run('fase', '1', 'borrador', '--quien', 'agente');
  assert.equal(r.codigo, 5);
  assert.equal(consulta(b.ruta, 'SELECT estado FROM fase WHERE numero = 1')[0].estado, 'borrador');
});

test('proyecto.md: nombre, ciclo activo, hoja de ruta y contadores salen de la base', () => {
  const b = nuevaBase();
  fs.mkdirSync(path.join(b.dir, '_docs'));
  fs.copyFileSync(path.join(AQUI, '..', '..', '_docs', 'proyecto.md'), path.join(b.dir, '_docs', 'proyecto.md'));
  b.run('proyecto', 'iniciar', '--nombre', 'demo', '--quien', 'persona');
  assert.match(b.proyectoMd(), /^Nombre: demo$/m);
  assert.match(b.proyectoMd(), /^Inicio: \d{4}-\d{2}-\d{2}$/m);
  assert.match(b.proyectoMd(), /^Ciclo activo: ninguno$/m);
  assert.match(b.proyectoMd(), /\| V \(verificación\) \| 1 \|/);
  b.run('ciclo', 'abrir', '--nombre', 'primera version', '--objetivo', 'Empezar', '--origen', 'kickoff', '--quien', 'persona');
  b.run('ciclo', 'prever', '--objetivo', 'Exportar', '--origen', 'brief del ciclo 1', '--quien', 'agente');
  b.run('siguiente', 'H', '--cantidad', '4', '--quien', 'agente');
  const md = b.proyectoMd();
  assert.match(md, /^Ciclo activo: _docs\/ciclos\/01-primera-version$/m);
  assert.match(md, /\| 01 \| _docs\/ciclos\/01-primera-version \| Empezar \| abierto \| kickoff \| \d{4}-\d{2}-\d{2} \| \|/);
  assert.match(md, /\| \| \| Exportar \| previsto \| brief del ciclo 1 \| \| \|/);
  assert.match(md, /\| H \(historia\) \| 5 \|/);
  assert.match(md, /Estados \(no se traducen\)/);
});

test('proyecto.md: sin fichero se crea; lo escrito a mano en la hoja de ruta o los contadores se corrige con aviso', () => {
  const b = conCiclo();
  const f = path.join(b.dir, '_docs', 'proyecto.md');
  assert.ok(fs.existsSync(f));
  fs.writeFileSync(f, b.proyectoMd().replace('| H (historia) | 1 |', '| H (historia) | 40 |').replace('| x |', '| Otra cosa |'));
  const r = b.run('siguiente', 'R', '--quien', 'agente');
  assert.equal(r.codigo, 0);
  assert.ok(r.avisos.some((a) => /hoja de ruta|tabla de ciclos/.test(a)), JSON.stringify(r.avisos));
  assert.ok(r.avisos.some((a) => /siguiente H.*dice 1/.test(a)), JSON.stringify(r.avisos));
  assert.match(b.proyectoMd(), /\| H \(historia\) \| 1 \|/);
});

test('ciclo editar y ciclo mover mantienen la hoja de ruta', () => {
  const b = conCiclo();
  for (const o of ['A', 'B', 'C']) b.run('ciclo', 'prever', '--objetivo', o, '--origen', 'brief', '--quien', 'agente');
  assert.equal(b.run('ciclo', 'editar', '1', '--objetivo', 'x', '--quien', 'persona').codigo, 3, 'el ciclo abierto no se reescribe');
  assert.equal(b.run('ciclo', 'editar', '2', '--objetivo', 'A2', '--quien', 'persona').codigo, 0);
  assert.equal(b.run('ciclo', 'mover', '2', '--a', '1', '--quien', 'persona').codigo, 2, 'no se puede ir delante de los no previstos');
  assert.equal(b.run('ciclo', 'mover', '2', '--a', '4', '--quien', 'persona').codigo, 0);
  assert.deepEqual(consulta(b.ruta, 'SELECT objetivo FROM ciclo ORDER BY posicion').map((c) => c.objetivo), ['x', 'B', 'C', 'A2']);
  assert.ok(b.proyectoMd().indexOf('| B |') < b.proyectoMd().indexOf('| A2 |'));
});

function hastaBorrador(b, ...fases) { for (const n of fases) b.run('fase', String(n), 'borrador', '--quien', 'agente'); }

test('aprobar fase: solo desde borrador, anota la aprobación con el comando y el historial como persona', () => {
  const b = conCiclo();
  assert.equal(b.run('aprobar', 'fase', '1').codigo, 3, 'pendiente no se aprueba');
  hastaBorrador(b, 1);
  const r = b.run('aprobar', 'fase', '1');
  assert.equal(r.codigo, 0, r.mensaje);
  assert.equal(consulta(b.ruta, 'SELECT estado FROM fase WHERE numero = 1')[0].estado, 'aprobado');
  const a = consulta(b.ruta, 'SELECT via, comando, sdd_id FROM aprobacion')[0];
  assert.equal(a.via, 'aviso de permiso');
  assert.equal(a.comando, 'estado.mjs aprobar fase 1');
  assert.equal(a.sdd_id, null);
  assert.equal(consulta(b.ruta, "SELECT quien FROM historial_estado WHERE entidad = 'fase' AND a = 'aprobado'")[0].quien, 'persona');
  assert.equal(b.run('aprobar', 'fase', '1').codigo, 3, 'ya aprobada');
  assert.equal(b.run('aprobar', 'fase', '4').codigo, 3);
  assert.equal(b.run('aprobar', 'fase', '0').codigo, 2);
  assert.match(b.estadoMd(), /\| 1 Brief \| `brief.md` \| aprobado \| \d{4}/);
});

test('aprobar tiene que ser el primer argumento del script', () => {
  const b = conCiclo();
  hastaBorrador(b, 1);
  const r = spawnSync(process.execPath, [CMD, '--ruta', b.ruta, '--json', 'aprobar', 'fase', '1'], { encoding: 'utf8', cwd: b.dir });
  assert.equal(r.status, 3);
  assert.equal(consulta(b.ruta, 'SELECT estado FROM fase WHERE numero = 1')[0].estado, 'borrador');
});

test('aprobar sdd: el plan de tareas va después del SDD y las filas 4 y 5 se recalculan', () => {
  const b = conCiclo();
  b.run('sdd', 'alta', '--nombre', 'a', '--orden', '1', '--quien', 'agente');
  b.run('sdd', 'estado', 'a', 'sdd', 'borrador', '--quien', 'agente');
  b.run('sdd', 'estado', 'a', 'tareas', 'borrador', '--quien', 'agente');
  assert.equal(b.run('aprobar', 'sdd', 'a', 'tareas').codigo, 3, 'antes hace falta el SDD');
  assert.equal(b.run('aprobar', 'sdd', 'a', 'sdd').codigo, 0);
  assert.equal(b.run('aprobar', 'sdd', 'a', 'tareas').codigo, 0);
  assert.equal(consulta(b.ruta, 'SELECT estado FROM fase WHERE numero = 4')[0].estado, 'aprobado');
  assert.equal(consulta(b.ruta, 'SELECT estado FROM fase WHERE numero = 5')[0].estado, 'aprobado');
  const a = consulta(b.ruta, 'SELECT f.numero, a.sdd_id FROM aprobacion a JOIN fase f ON f.id = a.fase_id ORDER BY a.id');
  assert.deepEqual(a.map((x) => x.numero), [4, 5]);
  assert.ok(a.every((x) => x.sdd_id !== null));
});

test('volver a aprobar tras repetir: queda una segunda aprobación', () => {
  const b = conCiclo();
  hastaBorrador(b, 1, 2);
  b.run('aprobar', 'fase', '1'); b.run('aprobar', 'fase', '2');
  b.run('repetir', '1', '--motivo', 'G1', '--quien', 'persona');
  assert.equal(b.run('aprobar', 'fase', '2').codigo, 3, 'por revisar no se aprueba sin entregarla de nuevo');
  assert.equal(b.run('aprobar', 'fase', '1').codigo, 0);
  assert.equal(consulta(b.ruta, 'SELECT count(*) n FROM aprobacion WHERE fase_id = (SELECT id FROM fase WHERE numero = 1)')[0].n, 2);
});

test('aprobar la fase 9 cierra el ciclo, con sus condiciones', () => {
  const b = conTarea();
  hastaBorrador(b, 1, 6, 9);
  b.run('fase', '2', 'no aplica', '--quien', 'persona'); b.run('fase', '3', 'no aplica', '--quien', 'persona');
  b.run('sdd', 'estado', 'nucleo', 'sdd', 'borrador', '--quien', 'agente'); b.run('sdd', 'estado', 'nucleo', 'tareas', 'borrador', '--quien', 'agente');
  for (const n of [1, 6]) b.run('aprobar', 'fase', String(n));
  b.run('aprobar', 'sdd', 'nucleo', 'sdd'); b.run('aprobar', 'sdd', 'nucleo', 'tareas');
  assert.match(b.run('aprobar', 'fase', '9').mensaje, /tareas sin aprobar/);
  b.run('tarea', 'estado', 'TA1', 'implementada', '--quien', 'programador');
  b.run('tarea', 'estado', 'TA1', 'aprobada', '--quien', 'revisor', '--commit', 'abc1234');
  b.run('hueco', 'abrir', '--descripcion', 'algo', '--quien', 'persona');
  assert.match(b.run('aprobar', 'fase', '9').mensaje, /huecos abiertos/);
  b.run('hueco', 'resolver', 'G1', '--camino', 'enmienda', '--quien', 'persona');
  const r = b.run('aprobar', 'fase', '9');
  assert.equal(r.codigo, 0, r.mensaje);
  assert.deepEqual(consulta(b.ruta, 'SELECT estado, cerrado FROM ciclo').map((c) => [c.estado, c.cerrado !== null]), [['cerrado', true]]);
  assert.match(b.proyectoMd(), /^Ciclo activo: ninguno$/m);
  assert.match(b.estadoMd(), /\| 9 Cierre \| `_docs\/sistema.md` \| aprobado \|/);
  assert.equal(b.run('fase', '1', 'borrador', '--quien', 'x').codigo, 3, 'ya no hay ciclo abierto');
});

test('la guardia de aprobación: pregunta, y niega a los agentes aislados y a las sesiones que no preguntan', async () => {
  const { decidir } = await import('../guardia-aprobar.mjs');
  const bash = (command, extra = {}) => ({ tool_name: 'Bash', tool_input: { command }, permission_mode: 'default', ...extra });
  const decision = (e) => decidir(e)?.hookSpecificOutput.permissionDecision ?? null;
  assert.equal(decision(bash('node _flujo/estado.mjs aprobar fase 3')), 'ask');
  assert.equal(decision(bash('node ./_flujo/estado.mjs aprobar sdd web sdd')), 'ask');
  assert.equal(decision(bash("sh -c 'node _flujo/estado.mjs aprobar fase 3'")), 'ask');
  assert.equal(decision(bash('cd x && /usr/bin/node /abs/_flujo/estado.mjs aprobar fase 9')), 'ask');
  assert.equal(decision(bash('node _flujo/estado.mjs aprobar fase 3', { agent_id: 'a1', agent_type: 'revisor' })), 'deny');
  assert.equal(decision(bash('node _flujo/estado.mjs aprobar fase 3', { permission_mode: 'bypassPermissions' })), 'deny');
  assert.equal(decision(bash('node _flujo/estado.mjs aprobar fase 3', { permission_mode: 'dontAsk' })), 'deny');
  assert.equal(decision(bash('node _flujo/estado.mjs tarea estado TA1 implementada --quien programador')), null);
  assert.equal(decision(bash('node _flujo/estado.mjs hueco abrir --descripcion "hay que aprobar esto" --quien revisor')), null);
  assert.equal(decision({ tool_name: 'Edit', tool_input: { command: 'estado.mjs aprobar' } }), null);
  assert.equal(decision({}), null);
});

test('el hook se ejecuta como script: lee el JSON por la entrada estándar', () => {
  const r = spawnSync(process.execPath, [path.join(AQUI, '..', 'guardia-aprobar.mjs')], { input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'node _flujo/estado.mjs aprobar fase 1' }, permission_mode: 'default' }), encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.equal(JSON.parse(r.stdout).hookSpecificOutput.permissionDecision, 'ask');
  assert.equal(spawnSync(process.execPath, [path.join(AQUI, '..', 'guardia-aprobar.mjs')], { input: 'no es json', encoding: 'utf8' }).status, 0);
});

test('la configuración de la plantilla registra el hook y la regla de respaldo', () => {
  const ajustes = JSON.parse(fs.readFileSync(path.join(AQUI, '..', '..', '.claude', 'settings.json'), 'utf8'));
  assert.ok(ajustes.permissions.ask.includes('Bash(*estado.mjs*aprobar*)'));
  assert.ok(ajustes.permissions.allow.includes('Bash(node _flujo/estado.mjs *)'));
  const hook = ajustes.hooks.PreToolUse.find((h) => h.matcher === 'Bash').hooks[0];
  assert.match(hook.command, /guardia-aprobar\.mjs/);
  assert.ok(fs.existsSync(path.join(AQUI, '..', 'guardia-aprobar.mjs')));
});

test('la documentación generada coincide con las órdenes', () => {
  const r = spawnSync(process.execPath, [CMD, 'ayuda', '--markdown'], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.equal(fs.readFileSync(path.join(AQUI, '..', 'estado-comando.md'), 'utf8'), r.stdout, 'regenera con: node _flujo/estado.mjs ayuda --markdown > _flujo/estado-comando.md');
});
