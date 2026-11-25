#!/usr/bin/env node
// Comando de estado del flujo: la única vía para cambiar el ESTADO en la base de datos.
//
// Uso:  node _flujo/estado.mjs <orden> [argumentos] [--quien <quién>] [--proyecto <nombre>] [--ruta <base>] [--json]
//       node _flujo/estado.mjs ayuda [--markdown]
//
// QUÉ ES
//   La base de datos (SQLite, una por persona, fuera del repositorio) es la fuente de verdad del ESTADO: fases, SDD,
//   tareas, huecos, ciclos, contadores e historial. Los documentos de `_docs/` son la fuente del CONTENIDO. Este
//   comando es lo único que escribe estado en la base: ni las personas ni los agentes tocan las tablas a mano.
//
// QUÉ HACE CADA VEZ
//   1. Abre la base y comprueba el acceso: que existe, que es del flujo y que su esquema es el de esta plantilla.
//   2. Encuentra el proyecto (ver «Qué proyecto») y, salvo en `proyecto iniciar` y `ciclo prever`, su ciclo abierto.
//   3. Comprueba que la transición pedida existe y que la pide quien puede (ver `estados.md`).
//   4. Escribe todo el cambio en UNA transacción: el nuevo estado, la fila de `historial_estado`, los contadores y los
//      estados derivados (las filas 4 y 5 de `fase` resumen los SDD). Si algo falla, no queda nada a medias.
//   5. Después de guardar, pone al día `_docs/proyecto.md` y `<ciclo>/estado.md` (ver «Los documentos»).
//   6. Dice qué ha hecho. Con `--json` lo dice como un objeto: `{ ok, mensaje, avisos, ... }`.
//
// LOS DOCUMENTOS
//   El estado vive en la base; `estado.md` y `proyecto.md` son vistas que el comando mantiene para que se puedan leer
//   en el repositorio (revisiones, GitHub) sin acceso a la base.
//   `_docs/proyecto.md`: `Nombre:`, `Inicio:` y `Ciclo activo:`; la tabla de ciclos y hoja de ruta entera, en el orden de
//   la base; y la tabla «Siguiente identificador libre» (H, R, T, TA, G y V). Se actualiza con cada orden. El resto
//   del texto se respeta. Ya no se edita a mano: la hoja de ruta se gestiona con `ciclo prever`, `editar`, `mover` y
//   `descartar`, y los identificadores salen de `siguiente`.
//   `<ciclo>/estado.md`, solo con un ciclo abierto. Solo se reescribe lo que es estado:
//     - `Ciclo:` y `Vía:`; las columnas Estado y Fecha de la tabla de fases (con una fila de las fases 4 y 5 por
//       cada SDD); la tabla «Tareas» entera (estado, commit y notas de cada tarea).
//     - Una fila nueva en «Historial de cambios hacia atrás» cada vez que se usa `repetir`.
//   Todo lo demás —textos, columna Documento, notas escritas a mano, filas del historial— se respeta tal cual.
//   Si `estado.md` no existe se crea desde `_flujo/plantillas/estado.md`; si `proyecto.md` no existe, con un esqueleto.
//   Si lo escrito a mano en una celda de estado, en la hoja de ruta o en un contador no coincide con la base, la base
//   manda: el comando lo corrige y lo dice en `avisos`. Si la base se guarda pero un documento no se puede escribir, sale con el código 5; se arregla
//   con `regenerar`.
//   Los documentos van en `<raíz>/<carpeta del ciclo>`; la raíz es `--raiz`, o la del repositorio git, o la carpeta actual.
//
// LA APROBACIÓN
//   Aprobar una fase o un SDD (o volver a aprobarlos tras repetirlos) y cerrar un ciclo son las únicas órdenes que
//   necesitan el sí de la persona responsable. Van todas por `aprobar` (aprobar la fase 9 cierra el ciclo), que debe ser
//   el PRIMER argumento del script: `node _flujo/estado.mjs aprobar fase 3`. Las demás órdenes rechazan `aprobado`.
//   El sí de la persona no lo comprueba este script ni el entorno: lo exigen `_flujo/convenciones.md` y `CLAUDE.md`
//   (el agente que conversa con ella le pregunta con un selector Sí/No y solo con el Sí ejecuta `aprobar`). Lo único que
//   impone el entorno es que no aprueben los agentes aislados: el hook `_flujo/guardia-aprobar.mjs` (registrado en
//   `.claude/settings.json`) los niega. Ver D98.
//   Cada aprobación queda en la tabla `aprobacion` con el comando exacto que la hizo y en el historial como `persona`.
//   Detalle y entornos compatibles: decisión D94 de `_flujo/DISENO.md`.
//
// QUÉ NO HACE (de momento)
//   - No escribe el contenido (títulos, criterios, tests): eso lo carga el lector desde los documentos.
//   - No importa proyectos existentes (D92).
//
// QUÉ PROYECTO
//   --proyecto <nombre>, o la variable FLUJO_PROYECTO; si no, el que tenga un repositorio con la misma URL que
//   `git remote get-url origin`; si no, el único que haya en la base. Si no se puede decidir, se detiene y lo dice.
//
// QUIÉN (--quien)
//   Obligatorio en las órdenes que cambian estado. `persona` para la persona responsable; `programador`, `revisor`,
//   `verificador`… para los agentes. Se guarda en el historial. En las tareas, además, limita qué transición puede
//   pedir cada uno (ver `estados.md`).
//
// DÓNDE ESTÁ LA BASE
//   --ruta, o FLUJO_BASE, o ~/.flujo/estado.db (igual que `crear-base.mjs`, que la crea).
//
// CÓDIGOS DE SALIDA
//   0 hecho · 2 uso incorrecto · 3 transición no permitida o situación que no lo permite · 4 base ausente, ajena o de
//   otra versión de esquema · 5 la base se ha guardado pero no se pudo escribir un documento (usa `regenerar`).
//
// Requiere Node 22.13 o posterior (`node:sqlite`). Sin dependencias.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);

// ---------- argumentos ----------
const OPCIONES_CON_VALOR = new Set(['ruta', 'proyecto', 'raiz', 'quien', 'nombre', 'url', 'repo', 'objetivo', 'origen', 'desde', 'a', 'orden', 'titulo', 'sdd', 'descripcion', 'tarea', 'camino', 'tarea-a', 'commit', 'notas', 'motivo', 'cantidad']);
const pos = [];
const opts = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const k = a.slice(2);
    if (OPCIONES_CON_VALOR.has(k)) opts[k] = argv[++i];
    else opts[k] = true;
  } else pos.push(a);
}
const JSON_OUT = opts.json === true;

class Fallo extends Error { constructor(codigo, mensaje) { super(mensaje); this.codigo = codigo; } }
const uso = (m) => new Fallo(2, m);
const prohibido = (m) => new Fallo(3, m);

function terminar(codigo, mensaje, extra = {}) {
  if (JSON_OUT) console.log(JSON.stringify({ ok: codigo === 0, mensaje, ...extra }));
  else (codigo === 0 ? console.log : console.error)(codigo === 0 ? mensaje : `ERROR: ${mensaje}`);
  process.exit(codigo);
}

// ---------- vocabulario y reglas ----------
const NUMEROS_FASE = [0, 1, 2, 3, 4, 5, 6, 9];
const TIPOS_CONTADOR = ['H', 'R', 'T', 'TA', 'G', 'V'];
const CAMINOS = ['enmienda', 'repetir fases', 'corregir código'];

// Transiciones permitidas de una fase o de un SDD (estados.md). `aprobado` y `por revisar` no se piden por aquí.
const TRANSICIONES_FASE = {
  pendiente: ['hecho', 'borrador', 'no aplica'],
  'por revisar': ['borrador'],
  aprobado: ['borrador'],
  borrador: [],
  hecho: [],
  'no aplica': [],
};

// Transiciones de tarea que pide directamente quien trabaja (estados.md). `bloqueada` entra por `hueco abrir` y
// sale por `hueco resolver`.
const TRANSICIONES_TAREA = [
  { de: 'pendiente', a: 'implementada', quien: ['programador'] },
  { de: 'cambios necesarios', a: 'implementada', quien: ['programador'] },
  { de: 'implementada', a: 'aprobada', quien: ['revisor'], commit: true },
  { de: 'implementada', a: 'cambios necesarios', quien: ['revisor'] },
  { de: 'aprobada', a: 'cambios necesarios', quien: ['revisor', 'persona'] },
];

// ---------- fechas ----------
const ahora = () => new Date().toISOString().slice(0, 19);
const hoy = () => ahora().slice(0, 10);

// ---------- base ----------
const [mayor, menor] = process.versions.node.split('.').map(Number);
if (mayor < 22 || (mayor === 22 && menor < 13)) terminar(2, `hace falta Node 22.13 o posterior (hay ${process.versions.node}), por \`node:sqlite\``);
process.removeAllListeners('warning');
process.on('warning', (w) => { if (!(w.name === 'ExperimentalWarning' && /SQLite/i.test(w.message))) console.error(`${w.name}: ${w.message}`); });
const { DatabaseSync } = await import('node:sqlite');

const versionPlantilla = Number(/\('esquema_version',\s*'(\d+)'\)/.exec(fs.readFileSync(path.join(AQUI, 'esquema.sql'), 'utf8'))?.[1]);
const rutaBase = () => path.resolve(opts.ruta ?? process.env.FLUJO_BASE ?? path.join(os.homedir(), '.flujo', 'estado.db'));

function abrirBase({ crear = false } = {}) {
  const ruta = rutaBase();
  if (!fs.existsSync(ruta)) {
    if (!crear) throw new Fallo(4, `no hay base en ${ruta}. Se crea con \`node _flujo/crear-base.mjs\` (o con \`proyecto iniciar\`)`);
    const r = spawnSync(process.execPath, [path.join(AQUI, 'crear-base.mjs'), '--ruta', ruta], { encoding: 'utf8' });
    if (r.status !== 0) throw new Fallo(4, `no se pudo crear la base: ${(r.stderr || r.stdout).trim()}`);
  }
  const db = new DatabaseSync(ruta);
  db.exec('PRAGMA foreign_keys = ON');
  let v;
  try { v = db.prepare("SELECT valor FROM meta WHERE clave = 'esquema_version'").get()?.valor; } catch { v = undefined; }
  if (v === undefined) { db.close(); throw new Fallo(4, `${ruta} no es una base del flujo`); }
  if (Number(v) > versionPlantilla) { db.close(); throw new Fallo(4, `la base es de la versión de esquema ${v}, más nueva que la de esta plantilla (${versionPlantilla}): actualiza la plantilla`); }
  if (Number(v) < versionPlantilla) { db.close(); throw new Fallo(4, `la base es de la versión de esquema ${v} y la plantilla es la ${versionPlantilla}; aún no hay migraciones`); }
  return db;
}

let db;
const todos = (sql, ...p) => db.prepare(sql).all(...p);
const uno = (sql, ...p) => db.prepare(sql).get(...p);
const ejecutar = (sql, ...p) => db.prepare(sql).run(...p);
function insertar(tabla, fila) {
  const cols = Object.keys(fila);
  return Number(db.prepare(`INSERT INTO ${tabla} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).run(...cols.map((c) => fila[c])).lastInsertRowid);
}

// ---------- proyecto, ciclo, quién ----------
function resolverProyecto() {
  const nombre = opts.proyecto ?? process.env.FLUJO_PROYECTO;
  if (nombre) {
    const p = uno('SELECT * FROM proyecto WHERE nombre = ?', nombre);
    if (!p) throw uso(`no hay ningún proyecto llamado «${nombre}» en la base`);
    return p;
  }
  const origen = spawnSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' });
  if (origen.status === 0) {
    const p = uno('SELECT p.* FROM proyecto p JOIN repositorio r ON r.proyecto_id = p.id WHERE r.url = ?', origen.stdout.trim());
    if (p) return p;
  }
  const lista = todos('SELECT * FROM proyecto');
  if (lista.length === 1) return lista[0];
  if (lista.length === 0) throw prohibido('la base no tiene ningún proyecto: empieza con `proyecto iniciar`');
  throw uso(`la base tiene varios proyectos (${lista.map((p) => p.nombre).join(', ')}): indica cuál con --proyecto <nombre>`);
}
function cicloActivo(proyecto) {
  const c = uno("SELECT * FROM ciclo WHERE proyecto_id = ? AND estado = 'abierto'", proyecto.id);
  if (!c) throw prohibido('el proyecto no tiene ningún ciclo abierto: ábrelo con `ciclo abrir`');
  return c;
}
function quien() {
  if (!opts.quien || opts.quien === true) throw uso('falta --quien (persona, programador, revisor…)');
  return opts.quien;
}
const obligatoria = (k, m) => { if (!opts[k] || opts[k] === true) throw uso(`falta --${k}${m ? ` (${m})` : ''}`); return opts[k]; };

// ---------- historial y contadores ----------
function historial(cicloId, entidad, claves, de, a, q, commit = null) {
  insertar('historial_estado', {
    ciclo_id: cicloId, momento: ahora(), entidad,
    fase_id: claves.fase ?? null, sdd_id: claves.sdd ?? null, tarea_id: claves.tarea ?? null, hueco_id: claves.hueco ?? null,
    de, a, quien: q, commit_hash: commit,
  });
}
function siguienteCodigo(proyecto, tipo) {
  const c = uno('SELECT siguiente FROM contador WHERE proyecto_id = ? AND tipo = ?', proyecto.id, tipo);
  if (!c) throw prohibido(`falta el contador ${tipo}: el proyecto no se creó con \`proyecto iniciar\``);
  ejecutar('UPDATE contador SET siguiente = siguiente + 1 WHERE proyecto_id = ? AND tipo = ?', proyecto.id, tipo);
  return `${tipo}${c.siguiente}`;
}

// ---------- fases y SDD ----------
const fasesDe = (cicloId) => Object.fromEntries(todos('SELECT * FROM fase WHERE ciclo_id = ?', cicloId).map((f) => [f.numero, f]));
const sddsDe = (cicloId) => todos('SELECT s.* FROM sdd s JOIN fase f ON f.id = s.fase_id WHERE f.ciclo_id = ? AND f.numero = 4 ORDER BY s.orden', cicloId);
function buscarSdd(ciclo, nombre) {
  const s = sddsDe(ciclo.id).find((x) => x.nombre === nombre);
  if (!s) throw uso(`el ciclo no tiene ningún SDD llamado «${nombre}»`);
  return s;
}
// La fila de la fase 4 (o 5) resume los estados de todos los SDD del ciclo.
function resumen(estados) {
  if (estados.length === 0) return null;
  if (estados.every((e) => e === 'aprobado')) return 'aprobado';
  if (estados.every((e) => e === 'pendiente')) return 'pendiente';
  if (estados.every((e) => e === 'no aplica')) return 'no aplica';
  if (estados.includes('borrador')) return 'borrador';
  if (estados.includes('por revisar')) return 'por revisar';
  return 'borrador';
}
function recalcularResumenes(ciclo, q) {
  const fases = fasesDe(ciclo.id);
  const sdds = sddsDe(ciclo.id);
  for (const [n, campo] of [[4, 'estado_sdd'], [5, 'estado_tareas']]) {
    const nuevo = resumen(sdds.map((s) => s[campo]));
    if (!nuevo || nuevo === fases[n].estado) continue;
    ejecutar('UPDATE fase SET estado = ?, fecha = ? WHERE id = ?', nuevo, nuevo === 'aprobado' || nuevo === 'no aplica' ? hoy() : null, fases[n].id);
    historial(ciclo.id, 'fase', { fase: fases[n].id }, fases[n].estado, nuevo, q);
  }
}
function comprobarTransicion(de, a, que) {
  if (a === 'aprobado') throw prohibido(`${que}: poner \`aprobado\` no se hace con este comando. La aprobación va por \`aprobar\`, y solo tras el sí de la persona responsable`);
  if (a === 'por revisar') throw prohibido(`${que}: \`por revisar\` lo ponen las fases al repetirse: usa \`repetir <fase> --motivo <V|G>\``);
  if (!TRANSICIONES_FASE[de]?.includes(a)) throw prohibido(`${que}: de \`${de}\` no se puede pasar a \`${a}\`${TRANSICIONES_FASE[de]?.length ? ` (solo a ${TRANSICIONES_FASE[de].map((x) => `\`${x}\``).join(', ')})` : ''}`);
}

// ---------- tareas y huecos ----------
function buscarTarea(ciclo, codigo) {
  const l = todos("SELECT t.* FROM tarea t JOIN sdd s ON s.id = t.sdd_id JOIN fase f ON f.id = s.fase_id WHERE f.ciclo_id = ? AND t.codigo = ?", ciclo.id, codigo);
  if (l.length === 0) throw uso(`el ciclo no tiene la tarea ${codigo}`);
  if (l.length > 1) throw prohibido(`la tarea ${codigo} está repetida en varios SDD del ciclo: hay que arreglarlo en la base antes de seguir`);
  return l[0];
}
function buscarHueco(ciclo, codigo) {
  const h = uno('SELECT * FROM hueco WHERE ciclo_id = ? AND codigo = ?', ciclo.id, codigo);
  if (!h) throw uso(`el ciclo no tiene el hueco ${codigo}`);
  return h;
}
function cambiarTarea(ciclo, t, nuevo, q, { commit = null, notas } = {}) {
  ejecutar('UPDATE tarea SET estado = ?, commit_hash = COALESCE(?, commit_hash), notas = ? WHERE id = ?', nuevo, commit, notas === undefined ? t.notas : notas, t.id);
  historial(ciclo.id, 'tarea', { tarea: t.id }, t.estado, nuevo, q, commit);
}

// ---------- reordenar la hoja de ruta ----------
// Los ciclos que ya no son `previsto` van primero, por su posición; después el ciclo que se acaba de abrir y por último
// los previstos que quedan. La posición es única, así que se pasa primero por valores negativos.
function asignarPosiciones(orden) {
  orden.forEach((c, i) => ejecutar('UPDATE ciclo SET posicion = ? WHERE id = ?', -(i + 1), c.id));
  orden.forEach((c, i) => ejecutar('UPDATE ciclo SET posicion = ? WHERE id = ?', i + 1, c.id));
}
function reordenarCiclos(proyecto, cicloNuevoId) {
  const todosLosCiclos = todos('SELECT id, estado, posicion FROM ciclo WHERE proyecto_id = ? ORDER BY posicion', proyecto.id);
  const anteriores = todosLosCiclos.filter((c) => c.id !== cicloNuevoId && c.estado !== 'previsto');
  const previstos = todosLosCiclos.filter((c) => c.id !== cicloNuevoId && c.estado === 'previsto');
  const orden = [...anteriores, ...(cicloNuevoId ? [{ id: cicloNuevoId }] : []), ...previstos];
  asignarPosiciones(orden);
}
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');


// ---------- el documento estado.md ----------
const NOMBRE_FASE = { 0: 'Apertura', 1: 'Brief', 2: 'Historias', 3: 'Arquitectura', 4: 'SDD', 5: 'Tareas', 6: 'Verificación', 9: 'Cierre' };
const DOCUMENTO_FASE = { 0: 'idea del ciclo', 1: '`brief.md`', 2: '`historias.md`', 3: '`_docs/arquitectura.md`', 6: '`verificacion.md`', 9: '`_docs/sistema.md`' };
const celda = (v) => String(v ?? '').replace(/\|/g, '/').replace(/\s*\n\s*/g, ' ').trim();
const celdasDe = (linea) => linea.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
const fila = (cs) => `|${cs.map((c) => (celda(c) ? ` ${celda(c)} ` : ' ')).join('|')}|`;

function raizDelRepositorio() {
  if (opts.raiz && opts.raiz !== true) return path.resolve(opts.raiz);
  const r = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : process.cwd();
}

// Lo que la base dice que debe haber en estado.md.
function esperadoEnDocumento(ciclo) {
  const fases = fasesDe(ciclo.id);
  const sdds = sddsDe(ciclo.id);
  const filasFase = [];
  for (const n of NUMEROS_FASE) {
    const base = { n, etiqueta: `${n} ${NOMBRE_FASE[n]}` };
    if (n === 4 || n === 5) {
      const campo = n === 4 ? 'estado_sdd' : 'estado_tareas', fechaCampo = n === 4 ? 'fecha_sdd' : 'fecha_tareas', prefijo = n === 4 ? 'sdd' : 'tareas';
      if (sdds.length === 0) filasFase.push({ ...base, clave: `${n}|${prefijo}-[nombre].md`, documento: `\`${prefijo}-[nombre].md\``, estado: fases[n].estado, fecha: fases[n].fecha ?? '', notas: fases[n].notas });
      for (const sd of sdds) filasFase.push({ ...base, clave: `${n}|${prefijo}-${sd.nombre}.md`, documento: `\`${prefijo}-${sd.nombre}.md\``, estado: sd[campo], fecha: sd[fechaCampo] ?? '', notas: sd.notas });
    } else filasFase.push({ ...base, clave: `${n}`, documento: DOCUMENTO_FASE[n], estado: fases[n].estado, fecha: fases[n].fecha ?? '', notas: fases[n].notas });
  }
  const filasTarea = [];
  for (const sd of sdds) {
    const ts = todos('SELECT * FROM tarea WHERE sdd_id = ?', sd.id).sort((a, b) => Number(a.codigo.slice(2)) - Number(b.codigo.slice(2)));
    for (const t of ts) filasTarea.push({ sdd: sd.nombre, codigo: t.codigo, estado: t.estado, commit: t.commit_hash ?? '', notas: t.notas });
  }
  return { carpeta: ciclo.carpeta, via: ciclo.via, filasFase, filasTarea };
}

// Localiza una tabla por su cabecera: devuelve { desde, hasta (exclusivo), filas: [celdas] } o null.
function tablaPor(lineas, esCabecera) {
  for (let i = 0; i < lineas.length; i++) {
    if (!lineas[i].trim().startsWith('|') || !esCabecera(celdasDe(lineas[i]))) continue;
    let j = i + 1;
    while (j < lineas.length && lineas[j].trim().startsWith('|')) j++;
    return { desde: i, hasta: j, filas: lineas.slice(i + 2, j).map(celdasDe) };
  }
  return null;
}
const esTablaFases = (c) => c[0] === 'Fase' && c[2] === 'Estado';
const esTablaTareas = (c) => c[0] === 'SDD' && c[1] === 'Tarea';
const esTablaHistorial = (c) => c[0] === 'Fecha' && c[1] === 'Fase repetida';
const sinTildes = (x) => x.replace(/`/g, '');
const claveFila = (c) => { const m = /^(\d{1,2})\b/.exec(c[0] ?? ''); if (!m) return null; return /^[45]$/.test(m[1]) ? `${m[1]}|${sinTildes(c[1] ?? '')}` : m[1]; };

// Qué difiere entre el documento y la base (antes de escribir).
function divergencias(texto, esperado) {
  const lineas = texto.split('\n');
  const avisos = [];
  const tf = tablaPor(lineas, esTablaFases);
  if (tf) for (const f of esperado.filasFase) {
    const e = tf.filas.find((c) => claveFila(c) === f.clave);
    if (e && e[2] !== f.estado) avisos.push(`estado.md decía \`${e[2]}\` en la fase ${f.etiqueta}${f.clave.includes('|') ? ` (${f.documento.replace(/`/g, '')})` : ''} y la base dice \`${f.estado}\`: manda la base`);
  }
  const tt = tablaPor(lineas, esTablaTareas);
  if (tt) for (const t of esperado.filasTarea) {
    const e = tt.filas.find((c) => c[1] === t.codigo);
    if (e && e[2] !== t.estado) avisos.push(`estado.md decía \`${e[2]}\` en la tarea ${t.codigo} y la base dice \`${t.estado}\`: manda la base`);
  }
  return avisos;
}

// Devuelve el texto nuevo del documento a partir del que hay (o de la plantilla) y de lo que dice la base.
function renderizarEstado(texto, esperado, filaHistorial) {
  let lineas = texto.split('\n');
  const nombreCiclo = path.basename(esperado.carpeta ?? '') || '[NN-nombre]';
  lineas = lineas.map((l) => (/^Ciclo:/.test(l) ? `Ciclo: ${nombreCiclo}` : esperado.via && /^Vía:/.test(l) ? `Vía: ${esperado.via}` : l));
  const avisos = [];

  const tf = tablaPor(lineas, esTablaFases);
  if (tf) {
    const previas = new Map(tf.filas.map((c) => [claveFila(c), c]));
    const nuevas = esperado.filasFase.map((f) => { const p = previas.get(f.clave); return fila([f.etiqueta, p?.[1] || f.documento, f.estado, f.fecha, f.notas ?? p?.[4] ?? '']); });
    lineas.splice(tf.desde + 2, tf.hasta - tf.desde - 2, ...nuevas);
  } else avisos.push('no encuentro la tabla de fases en estado.md; no la he tocado');

  const tt = tablaPor(lineas, esTablaTareas);
  if (tt) {
    const previas = new Map(tt.filas.map((c) => [c[1], c]));
    const nuevas = esperado.filasTarea.map((t) => fila([t.sdd, t.codigo, t.estado, t.commit, t.notas ?? previas.get(t.codigo)?.[4] ?? '']));
    lineas.splice(tt.desde + 2, tt.hasta - tt.desde - 2, ...nuevas);
  } else avisos.push('no encuentro la tabla «Tareas» en estado.md; no la he tocado');

  if (filaHistorial) {
    const th = tablaPor(lineas, esTablaHistorial);
    if (th) lineas.splice(th.hasta, 0, fila([filaHistorial.fecha, filaHistorial.fase, filaHistorial.motivo, filaHistorial.afectadas]));
    else avisos.push('no encuentro la tabla «Historial de cambios hacia atrás» en estado.md; no he anotado la repetición');
  }
  return { texto: lineas.join('\n'), avisos };
}

function rutaEstado(ciclo) { return path.join(raizDelRepositorio(), ciclo.carpeta, 'estado.md'); }
const plantillaEstado = () => fs.readFileSync(path.join(AQUI, 'plantillas', 'estado.md'), 'utf8');

// Antes de cambiar nada: qué celdas del documento no coinciden con la base.
function avisosPrevios(ciclo) {
  const f = rutaEstado(ciclo);
  if (!fs.existsSync(f)) return [];
  return divergencias(fs.readFileSync(f, 'utf8'), esperadoEnDocumento(ciclo));
}
// Después de guardar: pone al día el documento. Devuelve los avisos de esa escritura.
function escribirEstado(ciclo, filaHistorial) {
  const f = rutaEstado(ciclo);
  const actual = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : plantillaEstado();
  const { texto, avisos } = renderizarEstado(actual, esperadoEnDocumento(ciclo), filaHistorial);
  if (!fs.existsSync(f) || texto !== actual) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, texto); }
  return avisos;
}


// ---------- el documento proyecto.md ----------
const ETIQUETA_CONTADOR = { H: 'H (historia)', R: 'R (requisito)', T: 'T (test)', TA: 'TA (tarea)', G: 'G (hueco)', V: 'V (verificación)' };
const ESQUELETO_PROYECTO = `# Proyecto

Nombre: [nombre]
Inicio: [fecha]
Ciclo activo: ninguno

## Ciclos y hoja de ruta

| Nº | Carpeta | Objetivo | Estado | Origen | Abierto | Cerrado |
|---|---|---|---|---|---|---|

## Siguiente identificador libre

| Tipo | Siguiente |
|---|---|
`;
const esTablaCiclos = (c) => c[0] === 'Nº' && c[1] === 'Carpeta';
const esTablaContadores = (c) => c[0] === 'Tipo' && c[1] === 'Siguiente';

function esperadoProyecto(proyecto) {
  const ciclos = todos('SELECT * FROM ciclo WHERE proyecto_id = ? ORDER BY posicion', proyecto.id);
  const filasCiclo = ciclos.map((c) => [c.numero ? String(c.numero).padStart(2, '0') : '', c.carpeta ?? '', c.objetivo, c.estado, c.origen ?? '', c.abierto ?? '', c.cerrado ?? ''].map(celda));
  const contadores = todos('SELECT tipo, siguiente FROM contador WHERE proyecto_id = ?', proyecto.id);
  const filasContador = TIPOS_CONTADOR.filter((t) => contadores.some((c) => c.tipo === t)).map((t) => [ETIQUETA_CONTADOR[t], String(contadores.find((c) => c.tipo === t).siguiente)]);
  const activo = ciclos.find((c) => c.estado === 'abierto');
  return { nombre: proyecto.nombre, inicio: proyecto.inicio, activo: activo?.carpeta ?? 'ninguno', filasCiclo, filasContador };
}
const igualesFila = (a, b) => a.length === b.length && a.every((x, i) => celda(x) === b[i]);

function divergenciasProyecto(texto, e) {
  const lineas = texto.split('\n');
  const avisos = [];
  const tc = tablaPor(lineas, esTablaCiclos);
  if (tc && tc.filas.length > 0 && (tc.filas.length !== e.filasCiclo.length || tc.filas.some((f, i) => !igualesFila(f, e.filasCiclo[i])))) {
    const i = tc.filas.findIndex((f, k) => !e.filasCiclo[k] || !igualesFila(f, e.filasCiclo[k]));
    avisos.push(`la tabla de ciclos de proyecto.md no coincidía con la base${i >= 0 && tc.filas[i] ? ` (fila ${i + 1}: «${tc.filas[i].filter(Boolean).join(' · ')}»)` : ''}: manda la base`);
  }
  const tk = tablaPor(lineas, esTablaContadores);
  if (tk) for (const f of tk.filas) {
    const x = e.filasContador.find((y) => y[0].split(' ')[0] === (f[0] ?? '').split(' ')[0]);
    if (x && x[1] !== f[1]) avisos.push(`proyecto.md decía ${f[1]} como siguiente ${x[0].split(' ')[0]} y la base dice ${x[1]}: manda la base`);
  }
  return avisos;
}

function renderizarProyecto(texto, e) {
  let lineas = texto.split('\n').map((l) => (/^Nombre:/.test(l) ? `Nombre: ${e.nombre}` : /^Inicio:/.test(l) ? `Inicio: ${e.inicio ?? ''}` : /^Ciclo activo:/.test(l) ? `Ciclo activo: ${e.activo}` : l));
  const avisos = [];
  const tc = tablaPor(lineas, esTablaCiclos);
  if (tc) lineas.splice(tc.desde + 2, tc.hasta - tc.desde - 2, ...e.filasCiclo.map(fila));
  else avisos.push('no encuentro la tabla de ciclos en proyecto.md; no la he tocado');
  const tk = tablaPor(lineas, esTablaContadores);
  if (tk) lineas.splice(tk.desde + 2, tk.hasta - tk.desde - 2, ...e.filasContador.map(fila));
  else avisos.push('no encuentro la tabla de identificadores en proyecto.md; no la he tocado');
  return { texto: lineas.join('\n'), avisos };
}
const rutaProyecto = () => path.join(raizDelRepositorio(), '_docs', 'proyecto.md');
function avisosPreviosProyecto(proyecto) {
  const f = rutaProyecto();
  return fs.existsSync(f) ? divergenciasProyecto(fs.readFileSync(f, 'utf8'), esperadoProyecto(proyecto)) : [];
}
function escribirProyecto(proyecto) {
  const f = rutaProyecto();
  const actual = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ESQUELETO_PROYECTO;
  const { texto, avisos } = renderizarProyecto(actual, esperadoProyecto(proyecto));
  if (!fs.existsSync(f) || texto !== actual) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, texto); }
  return avisos;
}

// =====================================================================================================================
// ÓRDENES. Cada una declara en qué parte del flujo se usa, quién la pide y qué escribe: de aquí sale `ayuda`.
// =====================================================================================================================
const ORDENES = [
  {
    orden: 'proyecto iniciar', uso: 'proyecto iniciar --nombre <nombre> [--url <url>] [--repo <nombre>] --quien <quién>',
    flujo: 'Fase 0 · /kickoff', quien: 'persona o agente de la fase 0',
    que: 'Crea la base si no existe, el proyecto, su repositorio principal y los seis contadores (H, R, T, TA, G, V) a 1. No abre ningún ciclo: eso es `ciclo abrir`.',
    ejecutar() {
      const nombre = obligatoria('nombre');
      quien();
      if (uno('SELECT 1 FROM proyecto WHERE nombre = ?', nombre)) throw prohibido(`ya hay un proyecto llamado «${nombre}»`);
      const id = insertar('proyecto', { uuid: crypto.randomUUID(), nombre, inicio: hoy() });
      insertar('repositorio', { proyecto_id: id, nombre: opts.repo ?? nombre, url: opts.url ?? null, principal: 1 });
      for (const t of TIPOS_CONTADOR) insertar('contador', { proyecto_id: id, tipo: t, siguiente: 1 });
      return { mensaje: `Proyecto «${nombre}» creado. Siguiente: abrir su primer ciclo con \`ciclo abrir\`.`, proyecto: nombre };
    },
    sinProyecto: true, crearBase: true, documento: false,
  },
  {
    orden: 'ciclo prever', uso: 'ciclo prever --objetivo <texto> --origen <de dónde viene> --quien <quién>',
    flujo: 'Fase 1 · /brief y fase 9 · /cerrar (hoja de ruta)', quien: 'persona o agente de la fase 1 o 9',
    que: 'Añade al final de la hoja de ruta un ciclo `previsto`, sin número ni carpeta todavía.',
    ejecutar(ctx) {
      const q = quien();
      const objetivo = obligatoria('objetivo'), origen = obligatoria('origen');
      const { m } = uno('SELECT COALESCE(MAX(posicion), 0) AS m FROM ciclo WHERE proyecto_id = ?', ctx.proyecto.id);
      const id = insertar('ciclo', { proyecto_id: ctx.proyecto.id, posicion: m + 1, objetivo, estado: 'previsto', origen });
      historial(id, 'ciclo', {}, null, 'previsto', q);
      return { mensaje: `Ciclo previsto en la posición ${m + 1}: ${objetivo}.`, posicion: m + 1 };
    },
    sinCiclo: true, documento: false,
  },
  {
    orden: 'ciclo abrir', uso: 'ciclo abrir --nombre <nombre-corto> --objetivo <texto> [--origen <de dónde viene>] [--desde <posición del previsto>] --quien <quién>',
    flujo: 'Fase 0 · /kickoff y /ciclo', quien: 'persona o agente de la fase 0',
    que: 'Abre un ciclo: le da el número siguiente y la carpeta `_docs/ciclos/NN-nombre`, crea sus ocho filas de fase (la 0 en `hecho`, el resto en `pendiente`) y lo coloca en la hoja de ruta a continuación del último ciclo que no es previsto. Con `--desde` completa un ciclo previsto en lugar de crear uno nuevo. Solo puede haber un ciclo abierto.',
    ejecutar(ctx) {
      const q = quien();
      const nombre = slug(obligatoria('nombre', 'nombre corto en minúsculas con guiones'));
      if (!nombre) throw uso('el nombre del ciclo no tiene letras ni números');
      if (uno("SELECT 1 FROM ciclo WHERE proyecto_id = ? AND estado = 'abierto'", ctx.proyecto.id)) throw prohibido('ya hay un ciclo abierto: solo puede haber uno');
      const { m } = uno('SELECT COALESCE(MAX(numero), 0) AS m FROM ciclo WHERE proyecto_id = ?', ctx.proyecto.id);
      const numero = m + 1;
      const carpeta = `_docs/ciclos/${String(numero).padStart(2, '0')}-${nombre}`;
      let id;
      if (opts.desde) {
        const previsto = uno("SELECT * FROM ciclo WHERE proyecto_id = ? AND posicion = ? AND estado = 'previsto'", ctx.proyecto.id, Number(opts.desde));
        if (!previsto) throw prohibido(`la posición ${opts.desde} no es un ciclo previsto`);
        id = previsto.id;
        ejecutar("UPDATE ciclo SET numero = ?, carpeta = ?, estado = 'abierto', abierto = ?, objetivo = ?, origen = COALESCE(?, origen) WHERE id = ?", numero, carpeta, hoy(), opts.objetivo ?? previsto.objetivo, opts.origen ?? null, id);
        historial(id, 'ciclo', {}, 'previsto', 'abierto', q);
      } else {
        const objetivo = obligatoria('objetivo');
        const { mp } = uno('SELECT COALESCE(MAX(posicion), 0) AS mp FROM ciclo WHERE proyecto_id = ?', ctx.proyecto.id);
        id = insertar('ciclo', { proyecto_id: ctx.proyecto.id, posicion: mp + 1, numero, carpeta, objetivo, estado: 'abierto', origen: opts.origen ?? null, abierto: hoy() });
        historial(id, 'ciclo', {}, null, 'abierto', q);
      }
      reordenarCiclos(ctx.proyecto, id);
      for (const n of NUMEROS_FASE) {
        const fid = insertar('fase', { ciclo_id: id, numero: n, estado: n === 0 ? 'hecho' : 'pendiente', fecha: n === 0 ? hoy() : null });
        if (n === 0) historial(id, 'fase', { fase: fid }, 'pendiente', 'hecho', q);
      }
      return { mensaje: `Ciclo ${String(numero).padStart(2, '0')} abierto en ${carpeta}. Fase 0 en \`hecho\`.`, ciclo: numero, carpeta };
    },
    sinCiclo: true,
  },
  {
    orden: 'ciclo via', uso: 'ciclo via <completa|corta> --quien <quién>',
    flujo: 'Fase 1 · /brief', quien: 'persona o agente de la fase 1',
    que: 'Anota la vía del ciclo abierto. No cambia ninguna fase: las fases 2 y 3 se omiten con `fase <n> "no aplica"`.',
    ejecutar(ctx) {
      quien();
      const v = pos[2];
      if (!['completa', 'corta'].includes(v)) throw uso('la vía es `completa` o `corta`');
      ejecutar('UPDATE ciclo SET via = ? WHERE id = ?', v, ctx.ciclo.id);
      return { mensaje: `Vía del ciclo: ${v}.` };
    },
  },
  {
    orden: 'ciclo editar', uso: 'ciclo editar <posición> [--objetivo <texto>] [--origen <texto>] --quien <quién>',
    flujo: 'Hoja de ruta (en cualquier momento)', quien: 'persona',
    que: 'Cambia el objetivo o el origen de un ciclo `previsto`. Los ciclos abiertos, cerrados y descartados no se reescriben.',
    ejecutar(ctx) {
      quien();
      const c = uno('SELECT * FROM ciclo WHERE proyecto_id = ? AND posicion = ?', ctx.proyecto.id, Number(pos[2]));
      if (!c) throw uso(`no hay ningún ciclo en la posición ${pos[2]}`);
      if (c.estado !== 'previsto') throw prohibido(`solo se reescribe un ciclo \`previsto\`; este está \`${c.estado}\``);
      if (!opts.objetivo && !opts.origen) throw uso('indica --objetivo, --origen o los dos');
      ejecutar('UPDATE ciclo SET objetivo = COALESCE(?, objetivo), origen = COALESCE(?, origen) WHERE id = ?', opts.objetivo ?? null, opts.origen ?? null, c.id);
      return { mensaje: `Ciclo previsto de la posición ${c.posicion} actualizado.` };
    },
    sinCiclo: true, documento: false,
  },
  {
    orden: 'ciclo mover', uso: 'ciclo mover <posición> --a <nueva posición> --quien <quién>',
    flujo: 'Hoja de ruta (en cualquier momento)', quien: 'persona',
    que: 'Reordena la hoja de ruta: mueve un ciclo `previsto` a otra posición. Los ciclos que ya no son previstos siempre van delante.',
    ejecutar(ctx) {
      quien();
      const todosOrdenados = todos('SELECT id, estado, posicion FROM ciclo WHERE proyecto_id = ? ORDER BY posicion', ctx.proyecto.id);
      const i = todosOrdenados.findIndex((c) => c.posicion === Number(pos[2]));
      if (i < 0) throw uso(`no hay ningún ciclo en la posición ${pos[2]}`);
      if (todosOrdenados[i].estado !== 'previsto') throw prohibido(`solo se mueve un ciclo \`previsto\`; este está \`${todosOrdenados[i].estado}\``);
      const destino = Number(obligatoria('a', 'la nueva posición'));
      const primerosPrevistos = todosOrdenados.filter((c) => c.estado !== 'previsto').length;
      if (!Number.isInteger(destino) || destino <= primerosPrevistos || destino > todosOrdenados.length) throw uso(`la nueva posición va de ${primerosPrevistos + 1} a ${todosOrdenados.length} (delante van los ciclos que ya no son previstos)`);
      const [c] = todosOrdenados.splice(i, 1);
      todosOrdenados.splice(destino - 1, 0, c);
      asignarPosiciones(todosOrdenados);
      return { mensaje: `Ciclo previsto movido de la posición ${pos[2]} a la ${destino}.` };
    },
    sinCiclo: true, documento: false,
  },
  {
    orden: 'ciclo descartar', uso: 'ciclo descartar <posición> --quien persona',
    flujo: 'En cualquier momento', quien: 'persona',
    que: 'Pasa un ciclo `previsto` o `abierto` a `descartado`. Un ciclo cerrado no se descarta.',
    ejecutar(ctx) {
      const q = quien();
      if (q !== 'persona') throw prohibido('descartar un ciclo lo decide la persona responsable: --quien persona');
      const c = uno('SELECT * FROM ciclo WHERE proyecto_id = ? AND posicion = ?', ctx.proyecto.id, Number(pos[2]));
      if (!c) throw uso(`no hay ningún ciclo en la posición ${pos[2]}`);
      if (!['previsto', 'abierto'].includes(c.estado)) throw prohibido(`un ciclo \`${c.estado}\` no se descarta`);
      ejecutar("UPDATE ciclo SET estado = 'descartado' WHERE id = ?", c.id);
      historial(c.id, 'ciclo', {}, c.estado, 'descartado', q);
      return { mensaje: `Ciclo de la posición ${c.posicion} descartado.` };
    },
    sinCiclo: true,
  },
  {
    orden: 'fase', uso: 'fase <0|1|2|3|6|9> <hecho|borrador|"no aplica"> --quien <quién>',
    flujo: 'Todas las fases (al entregar su documento o al omitirla)', quien: 'agente de la fase o persona',
    que: '`hecho` solo en la fase 0. `borrador` al entregar el documento de la fase (también al repetirla desde `por revisar` o `aprobado`). `no aplica` al omitirla. `aprobado` y `por revisar` no se piden aquí. Las fases 4 y 5 no se tocan: se calculan desde los SDD.',
    ejecutar(ctx) {
      const q = quien();
      const n = Number(pos[0 + 1]), nuevo = pos[2];
      if (!NUMEROS_FASE.includes(n)) throw uso(`la fase ${pos[1]} no existe (0, 1, 2, 3, 4, 5, 6 o 9)`);
      if (n === 4 || n === 5) throw prohibido(`la fase ${n} no se cambia directamente: su estado resume el de los SDD. Usa \`sdd estado\``);
      if (!nuevo) throw uso('falta el estado nuevo');
      const f = fasesDe(ctx.ciclo.id)[n];
      comprobarTransicion(f.estado, nuevo, `fase ${n}`);
      if (nuevo === 'hecho' && n !== 0) throw prohibido('`hecho` solo lo usa la fase 0');
      ejecutar('UPDATE fase SET estado = ?, fecha = ?, notas = COALESCE(?, notas) WHERE id = ?', nuevo, ['hecho', 'no aplica'].includes(nuevo) ? hoy() : null, opts.notas ?? null, f.id);
      historial(ctx.ciclo.id, 'fase', { fase: f.id }, f.estado, nuevo, q);
      return { mensaje: `Fase ${n}: \`${f.estado}\` → \`${nuevo}\`.` };
    },
  },
  {
    orden: 'repetir', uso: 'repetir <fase> --motivo <V<n>|G<n>> --quien <quién>',
    flujo: 'Cambios hacia atrás: /hueco (camino «repetir fases») y revisiones de la fase 6', quien: 'persona o agente que conversa con ella',
    que: 'Repite una fase: la fase vuelve a `borrador` y todas las posteriores que estaban en `borrador` o `aprobado` pasan a `por revisar`. En las fases 4 y 5 el cambio se hace en cada SDD. Añade una fila con el motivo al «Historial de cambios hacia atrás» de `estado.md`.',
    ejecutar(ctx) {
      const q = quien();
      const n = Number(pos[1]);
      const motivo = obligatoria('motivo', 'V<n> o G<n>');
      if (!/^[VG]\d+$/.test(motivo)) throw uso('el motivo es el identificador de una verificación o de un hueco: V3, G2…');
      if (![1, 2, 3, 4, 5, 6, 9].includes(n)) throw uso('se puede repetir la fase 1, 2, 3, 4, 5, 6 o 9');
      const fases = fasesDe(ctx.ciclo.id);
      const sdds = sddsDe(ctx.ciclo.id);
      const reabre = ['aprobado', 'por revisar', 'borrador'];
      const cambios = [];
      const afectadas = new Set();
      // la fase repetida
      if (n === 4 || n === 5) {
        const campo = n === 4 ? 'estado_sdd' : 'estado_tareas';
        if (sdds.length === 0) throw prohibido(`la fase ${n} no tiene ningún SDD que repetir`);
        for (const s of sdds) if (reabre.includes(s[campo]) && s[campo] !== 'borrador') { this.cambiarSdd(ctx, s, campo, 'borrador', q); cambios.push(`${s.nombre} (${campo === 'estado_sdd' ? 'SDD' : 'tareas'}) → borrador`); }
      } else {
        const f = fases[n];
        if (!reabre.includes(f.estado)) throw prohibido(`la fase ${n} está en \`${f.estado}\`: solo se repite una fase ya entregada`);
        if (f.estado !== 'borrador') { ejecutar('UPDATE fase SET estado = ?, fecha = NULL WHERE id = ?', 'borrador', f.id); historial(ctx.ciclo.id, 'fase', { fase: f.id }, f.estado, 'borrador', q); cambios.push(`fase ${n} → borrador`); }
      }
      // las posteriores
      for (const m of NUMEROS_FASE.filter((x) => x > n)) {
        if (m === 4 || m === 5) {
          const campo = m === 4 ? 'estado_sdd' : 'estado_tareas';
          for (const s of sddsDe(ctx.ciclo.id)) {
            if (n === 4 && m === 4) continue;
            if (n === 5 && m === 5) continue;
            const actual = uno('SELECT * FROM sdd WHERE id = ?', s.id)[campo];
            if (['aprobado', 'borrador'].includes(actual)) { this.cambiarSdd(ctx, s, campo, 'por revisar', q); cambios.push(`${s.nombre} (${campo === 'estado_sdd' ? 'SDD' : 'tareas'}) → por revisar`); afectadas.add(m); }
          }
        } else if (['aprobado', 'borrador'].includes(fases[m].estado)) {
          ejecutar('UPDATE fase SET estado = ?, fecha = NULL WHERE id = ?', 'por revisar', fases[m].id);
          historial(ctx.ciclo.id, 'fase', { fase: fases[m].id }, fases[m].estado, 'por revisar', q);
          cambios.push(`fase ${m} → por revisar`);
          afectadas.add(m);
        }
      }
      recalcularResumenes(ctx.ciclo, q);
      const lista = [...afectadas].sort((a, b) => a - b);
      return {
        mensaje: `Fase ${n} repetida por ${motivo}. Cambios: ${cambios.join('; ') || 'ninguno más'}.`, cambios,
        filaHistorial: { fecha: hoy(), fase: `${n} ${NOMBRE_FASE[n]}`, motivo, afectadas: lista.length ? `${lista.join(', ')} pasan a \`por revisar\`` : 'ninguna' },
      };
    },
    cambiarSdd(ctx, s, campo, nuevo, q) {
      ejecutar(`UPDATE sdd SET ${campo} = ?, ${campo === 'estado_sdd' ? 'fecha_sdd' : 'fecha_tareas'} = NULL WHERE id = ?`, nuevo, s.id);
      historial(ctx.ciclo.id, campo === 'estado_sdd' ? 'sdd' : 'sdd_tareas', { sdd: s.id }, s[campo], nuevo, q);
    },
  },
  {
    orden: 'sdd alta', uso: 'sdd alta --nombre <nombre> --orden <n> --quien <quién>',
    flujo: 'Fase 4 · /sdd', quien: 'agente de la fase 4',
    que: 'Da de alta un SDD del ciclo con su orden de implementación (1 si solo hay uno). Nace con el SDD y sus tareas en `pendiente`.',
    ejecutar(ctx) {
      quien();
      const nombre = obligatoria('nombre'), orden = Number(obligatoria('orden', 'número de orden, 1 o más'));
      if (!Number.isInteger(orden) || orden < 1) throw uso('--orden es un entero de 1 o más');
      const f4 = fasesDe(ctx.ciclo.id)[4];
      if (todos('SELECT 1 FROM sdd WHERE fase_id = ? AND nombre = ?', f4.id, nombre).length) throw prohibido(`ya hay un SDD llamado «${nombre}» en el ciclo`);
      if (todos('SELECT 1 FROM sdd WHERE fase_id = ? AND orden = ?', f4.id, orden).length) throw prohibido(`ya hay un SDD con el orden ${orden}`);
      insertar('sdd', { fase_id: f4.id, nombre, orden });
      return { mensaje: `SDD «${nombre}» dado de alta con el orden ${orden}.` };
    },
  },
  {
    orden: 'sdd estado', uso: 'sdd estado <nombre> <sdd|tareas> <borrador|"no aplica"> --quien <quién>',
    flujo: 'Fase 4 · /sdd y fase 5 · /tareas', quien: 'agente de la fase 4 o 5',
    que: '`sdd` cambia el estado del SDD (fase 4); `tareas`, el de su plan de tareas (fase 5). Después recalcula las filas 4 y 5 de `fase`, que resumen todos los SDD. `aprobado` no se pide aquí.',
    ejecutar(ctx) {
      const q = quien();
      const [, , nombre, cual, nuevo] = pos;
      if (!nombre || !['sdd', 'tareas'].includes(cual) || !nuevo) throw uso('uso: sdd estado <nombre> <sdd|tareas> <estado>');
      const s = buscarSdd(ctx.ciclo, nombre);
      const campo = cual === 'sdd' ? 'estado_sdd' : 'estado_tareas';
      comprobarTransicion(s[campo], nuevo, `SDD «${nombre}» (${cual})`);
      if (nuevo === 'hecho') throw prohibido('`hecho` solo lo usa la fase 0');
      ejecutar(`UPDATE sdd SET ${campo} = ?, ${cual === 'sdd' ? 'fecha_sdd' : 'fecha_tareas'} = ? WHERE id = ?`, nuevo, nuevo === 'no aplica' ? hoy() : null, s.id);
      historial(ctx.ciclo.id, cual === 'sdd' ? 'sdd' : 'sdd_tareas', { sdd: s.id }, s[campo], nuevo, q);
      recalcularResumenes(ctx.ciclo, q);
      return { mensaje: `SDD «${nombre}» (${cual}): \`${s[campo]}\` → \`${nuevo}\`.` };
    },
  },
  {
    orden: 'tarea alta', uso: 'tarea alta --sdd <nombre> --titulo <texto> --quien <quién>',
    flujo: 'Fase 5 · /tareas, y /hueco cuando una enmienda añade una tarea', quien: 'agente de la fase 5 o persona con /hueco',
    que: 'Da de alta una tarea en `pendiente` con el siguiente código TA del contador. Devuelve el código.',
    ejecutar(ctx) {
      const q = quien();
      const s = buscarSdd(ctx.ciclo, obligatoria('sdd'));
      const titulo = obligatoria('titulo');
      const codigo = siguienteCodigo(ctx.proyecto, 'TA');
      const id = insertar('tarea', { sdd_id: s.id, codigo, titulo });
      historial(ctx.ciclo.id, 'tarea', { tarea: id }, null, 'pendiente', q);
      return { mensaje: `Tarea ${codigo} dada de alta en «${s.nombre}».`, codigo };
    },
  },
  {
    orden: 'tarea estado', uso: 'tarea estado <TAn> <implementada|aprobada|"cambios necesarios"> [--commit <hash>] [--notas <texto>] --quien <programador|revisor|persona>',
    flujo: 'Fase 7 · /implementar y fase 8 · /revisar (y /hueco para `aprobada` → `cambios necesarios`)', quien: 'programador, revisor o persona, según la transición',
    que: 'Cambia el estado de una tarea con las transiciones de `estados.md`: el programador pasa a `implementada`; el revisor a `aprobada` (con `--commit`, el hash del commit de la tarea) o a `cambios necesarios`; la persona puede devolver una `aprobada` a `cambios necesarios`. `bloqueada` entra por `hueco abrir` y sale por `hueco resolver`.',
    ejecutar(ctx) {
      const q = quien();
      const codigo = pos[2], nuevo = pos[3];
      if (!codigo || !nuevo) throw uso('uso: tarea estado <TAn> <estado>');
      const t = buscarTarea(ctx.ciclo, codigo);
      if (nuevo === 'bloqueada') throw prohibido('una tarea se bloquea al registrar un hueco: usa `hueco abrir --tarea ' + codigo + '`');
      if (t.estado === 'bloqueada') throw prohibido(`la tarea ${codigo} está \`bloqueada\`: sale al resolver su hueco (\`hueco resolver\`)`);
      const regla = TRANSICIONES_TAREA.find((r) => r.de === t.estado && r.a === nuevo);
      if (!regla) throw prohibido(`la tarea ${codigo} no puede pasar de \`${t.estado}\` a \`${nuevo}\``);
      if (!regla.quien.includes(q)) throw prohibido(`esa transición la pide ${regla.quien.join(' o ')}, no ${q}`);
      if (regla.commit && !opts.commit) throw uso('al aprobar una tarea hay que dar su commit con --commit <hash>');
      cambiarTarea(ctx.ciclo, t, nuevo, q, { commit: opts.commit ?? null, notas: opts.notas });
      return { mensaje: `Tarea ${codigo}: \`${t.estado}\` → \`${nuevo}\`.` };
    },
  },
  {
    orden: 'hueco abrir', uso: 'hueco abrir --descripcion <texto> [--tarea <TAn>] --quien <quién>',
    flujo: 'Fase 7, fase 8 y /hueco', quien: 'programador, revisor o persona',
    que: 'Registra un hueco `abierto` con el siguiente código G del contador. Si se da una tarea, la deja `bloqueada` con una nota que remite al hueco. Devuelve el código.',
    ejecutar(ctx) {
      const q = quien();
      const descripcion = obligatoria('descripcion');
      const t = opts.tarea ? buscarTarea(ctx.ciclo, opts.tarea) : null;
      if (t && t.estado === 'bloqueada') throw prohibido(`la tarea ${t.codigo} ya está \`bloqueada\`: mira primero su hueco abierto`);
      const codigo = siguienteCodigo(ctx.proyecto, 'G');
      const id = insertar('hueco', { ciclo_id: ctx.ciclo.id, codigo, tarea_id: t?.id ?? null, abierto_por: q, fecha: hoy(), estado: 'abierto', descripcion });
      historial(ctx.ciclo.id, 'hueco', { hueco: id }, null, 'abierto', q);
      if (t) cambiarTarea(ctx.ciclo, t, 'bloqueada', q, { notas: `Bloqueada por ${codigo}.` });
      return { mensaje: `Hueco ${codigo} abierto${t ? `; la tarea ${t.codigo} queda \`bloqueada\`` : ''}.`, codigo };
    },
  },
  {
    orden: 'hueco camino', uso: 'hueco camino <Gn> --camino <enmienda|"repetir fases"|"corregir código"> --quien persona',
    flujo: '/hueco', quien: 'persona',
    que: 'Anota el camino que la persona ha elegido para un hueco que sigue `abierto`.',
    ejecutar(ctx) {
      const q = quien();
      const h = buscarHueco(ctx.ciclo, pos[2]);
      const camino = obligatoria('camino');
      if (!CAMINOS.includes(camino)) throw uso(`el camino es ${CAMINOS.map((c) => `«${c}»`).join(', ')}`);
      if (h.estado !== 'abierto') throw prohibido(`el hueco ${h.codigo} ya está resuelto`);
      ejecutar('UPDATE hueco SET camino = ? WHERE id = ?', camino, h.id);
      return { mensaje: `Hueco ${h.codigo}: camino «${camino}» (lo anota ${q}).` };
    },
  },
  {
    orden: 'hueco resolver', uso: 'hueco resolver <Gn> --camino <enmienda|"repetir fases"|"corregir código"> [--tarea-a <pendiente|"cambios necesarios"|aprobada>] --quien <quién>',
    flujo: '/hueco', quien: 'persona o agente que conversa con ella',
    que: 'Pasa un hueco a `resuelto` con su camino. Si el hueco tiene tarea, `--tarea-a` dice a qué estado sale de `bloqueada`: `pendiente` si no tiene código, `cambios necesarios` si hay que ajustarlo, `aprobada` si estaba aprobada y su código no cambia.',
    ejecutar(ctx) {
      const q = quien();
      const h = buscarHueco(ctx.ciclo, pos[2]);
      const camino = opts.camino ?? h.camino;
      if (!camino) throw uso('falta --camino (el hueco aún no tiene uno anotado)');
      if (!CAMINOS.includes(camino)) throw uso(`el camino es ${CAMINOS.map((c) => `«${c}»`).join(', ')}`);
      if (h.estado !== 'abierto') throw prohibido(`el hueco ${h.codigo} ya está resuelto`);
      let nota = '';
      if (h.tarea_id) {
        const t = uno('SELECT * FROM tarea WHERE id = ?', h.tarea_id);
        const destino = obligatoria('tarea-a', `a qué estado sale la tarea ${t.codigo}`);
        if (!['pendiente', 'cambios necesarios', 'aprobada'].includes(destino)) throw uso('--tarea-a es `pendiente`, `cambios necesarios` o `aprobada`');
        if (t.estado !== 'bloqueada') throw prohibido(`la tarea ${t.codigo} no está \`bloqueada\` sino \`${t.estado}\`: hay que revisar la base`);
        if (destino === 'aprobada' && !t.commit_hash) throw prohibido(`la tarea ${t.codigo} no tiene commit anotado: no puede volver a \`aprobada\``);
        cambiarTarea(ctx.ciclo, t, destino, q, { notas: null });
        nota = `; la tarea ${t.codigo} sale a \`${destino}\``;
      }
      ejecutar("UPDATE hueco SET estado = 'resuelto', camino = ? WHERE id = ?", camino, h.id);
      historial(ctx.ciclo.id, 'hueco', { hueco: h.id }, 'abierto', 'resuelto', q);
      return { mensaje: `Hueco ${h.codigo} resuelto por «${camino}»${nota}.` };
    },
  },
  {
    orden: 'aprobar', uso: 'aprobar fase <1|2|3|6|9>   |   aprobar sdd <nombre> <sdd|tareas>',
    flujo: 'Aprobar y publicar (fases 1, 2, 3, 4, 5, 6 y 9), también al aprobar de nuevo una fase repetida', quien: 'persona (su sí al selector Sí/No que le hace el agente)',
    que: 'Pasa una fase (o un SDD o su plan de tareas, en las fases 4 y 5) de `borrador` a `aprobado`, anota la aprobación (fecha, vía «aviso de permiso», nombre histórico que se conserva en la base, y el comando exacto) y el historial como `persona`. Debe ser el primer argumento del script. Un plan de tareas solo se aprueba con su SDD ya aprobado. Aprobar la fase 9 cierra además el ciclo y exige todas las tareas `aprobada`, ningún hueco `abierto` y ninguna otra fase pendiente de aprobar o `por revisar`. No admite `--quien`: quien aprueba es siempre la persona.',
    ejecutar(ctx) {
      if (argv[0] !== 'aprobar') throw prohibido('`aprobar` debe ser el primer argumento: `node _flujo/estado.mjs aprobar fase <n>` (así lo reconoce la guardia)');
      const comando = `estado.mjs ${argv.filter((a, i) => !(a === '--json' || (argv[i - 1] && ['--ruta', '--proyecto', '--raiz'].includes(argv[i - 1])) || ['--ruta', '--proyecto', '--raiz'].includes(a))).join(' ')}`;
      const q = 'persona';
      const fases = fasesDe(ctx.ciclo.id);
      const aprobacion = (faseId, sddId) => insertar('aprobacion', { fase_id: faseId, sdd_id: sddId, fecha: hoy(), via: 'aviso de permiso', comando });
      if (pos[1] === 'sdd') {
        const [, , nombre, cual] = pos;
        if (!nombre || !['sdd', 'tareas'].includes(cual)) throw uso('uso: aprobar sdd <nombre> <sdd|tareas>');
        const sd = buscarSdd(ctx.ciclo, nombre);
        const campo = cual === 'sdd' ? 'estado_sdd' : 'estado_tareas';
        if (sd[campo] !== 'borrador') throw prohibido(`el ${cual === 'sdd' ? 'SDD' : 'plan de tareas'} «${nombre}» está \`${sd[campo]}\`: solo se aprueba lo que está en \`borrador\``);
        if (cual === 'tareas' && sd.estado_sdd !== 'aprobado') throw prohibido(`el plan de tareas de «${nombre}» no se aprueba antes que su SDD (que está \`${sd.estado_sdd}\`)`);
        ejecutar(`UPDATE sdd SET ${campo} = 'aprobado', ${cual === 'sdd' ? 'fecha_sdd' : 'fecha_tareas'} = ? WHERE id = ?`, hoy(), sd.id);
        historial(ctx.ciclo.id, cual === 'sdd' ? 'sdd' : 'sdd_tareas', { sdd: sd.id }, 'borrador', 'aprobado', q);
        aprobacion(fases[cual === 'sdd' ? 4 : 5].id, sd.id);
        recalcularResumenes(ctx.ciclo, q);
        return { mensaje: `${cual === 'sdd' ? 'SDD' : 'Plan de tareas'} «${nombre}» aprobado.` };
      }
      if (pos[1] !== 'fase') throw uso('uso: aprobar fase <n>   |   aprobar sdd <nombre> <sdd|tareas>');
      const n = Number(pos[2]);
      if (n === 4 || n === 5) throw prohibido(`la fase ${n} se aprueba por SDD: \`aprobar sdd <nombre> <${n === 4 ? 'sdd' : 'tareas'}>\``);
      if (![1, 2, 3, 6, 9].includes(n)) throw uso('se aprueba la fase 1, 2, 3, 6 o 9 (la 0 no lleva aprobación)');
      const f = fases[n];
      if (f.estado !== 'borrador') throw prohibido(`la fase ${n} está \`${f.estado}\`: solo se aprueba lo que está en \`borrador\`${f.estado === 'por revisar' ? ' (hay que volver a entregarla primero)' : ''}`);
      if (n === 9) {
        const pendientes = todos("SELECT t.codigo FROM tarea t JOIN sdd s ON s.id = t.sdd_id JOIN fase fa ON fa.id = s.fase_id WHERE fa.ciclo_id = ? AND t.estado <> 'aprobada'", ctx.ciclo.id);
        if (pendientes.length) throw prohibido(`no se puede cerrar el ciclo: hay tareas sin aprobar (${pendientes.map((t) => t.codigo).slice(0, 8).join(', ')}${pendientes.length > 8 ? '…' : ''})`);
        const huecos = todos("SELECT codigo FROM hueco WHERE ciclo_id = ? AND estado = 'abierto'", ctx.ciclo.id);
        if (huecos.length) throw prohibido(`no se puede cerrar el ciclo: hay huecos abiertos (${huecos.map((h) => h.codigo).join(', ')})`);
        const sin = [0, 1, 2, 3, 4, 5, 6].filter((x) => !['aprobado', 'hecho', 'no aplica'].includes(fases[x].estado));
        if (sin.length) throw prohibido(`no se puede cerrar el ciclo: las fases ${sin.join(', ')} no están aprobadas`);
      }
      ejecutar("UPDATE fase SET estado = 'aprobado', fecha = ? WHERE id = ?", hoy(), f.id);
      historial(ctx.ciclo.id, 'fase', { fase: f.id }, 'borrador', 'aprobado', q);
      aprobacion(f.id, null);
      if (n === 9) {
        ejecutar("UPDATE ciclo SET estado = 'cerrado', cerrado = ? WHERE id = ?", hoy(), ctx.ciclo.id);
        historial(ctx.ciclo.id, 'ciclo', {}, 'abierto', 'cerrado', q);
        return { mensaje: `Fase 9 aprobada y ciclo ${String(ctx.ciclo.numero).padStart(2, '0')} cerrado.`, cicloDocumento: ctx.ciclo.id };
      }
      return { mensaje: `Fase ${n} aprobada.` };
    },
  },
  {
    orden: 'regenerar', uso: 'regenerar',
    flujo: 'Cuando `estado.md` se ha quedado atrás (por ejemplo, tras un código de salida 5) o se ha editado a mano', quien: 'cualquiera',
    que: 'No cambia la base: vuelve a escribir en `_docs/proyecto.md` y en el `estado.md` del ciclo abierto lo que dice la base y avisa de lo que no coincidía.',
    ejecutar() { return { mensaje: 'Documentos puestos al día con la base.' }; },
    sinCiclo: true,
  },
  {
    orden: 'siguiente', uso: 'siguiente <H|R|T|TA|G|V> [--cantidad <n>] --quien <quién>',
    flujo: 'Fases 1, 2, 4, 5 y 6 (cualquier identificador nuevo)', quien: 'agente de la fase',
    que: 'Entrega el siguiente identificador del contador del proyecto y lo sube. Con `--cantidad` entrega varios seguidos. Los identificadores no se reutilizan nunca.',
    ejecutar(ctx) {
      quien();
      const tipo = pos[1];
      if (!TIPOS_CONTADOR.includes(tipo)) throw uso(`el tipo es ${TIPOS_CONTADOR.join(', ')}`);
      const n = opts.cantidad ? Number(opts.cantidad) : 1;
      if (!Number.isInteger(n) || n < 1 || n > 500) throw uso('--cantidad es un entero entre 1 y 500');
      const codigos = Array.from({ length: n }, () => siguienteCodigo(ctx.proyecto, tipo));
      return { mensaje: codigos.join(' '), codigos };
    },
    sinCiclo: true, documento: false,
  },
];

// =====================================================================================================================
// AYUDA: sale de la tabla de órdenes, así que no puede quedarse atrás.
// =====================================================================================================================
function textoAyuda(markdown) {
  const cabecera = 'Comando de estado del flujo (`_flujo/estado.mjs`)';
  if (markdown) {
    const filas = ORDENES.map((o) => `### \`${o.orden}\`\n\n- **Uso:** \`${o.uso}\`\n- **Dónde del flujo:** ${o.flujo}\n- **Quién:** ${o.quien}\n- **Qué hace:** ${o.que}\n`);
    return `# ${cabecera}\n\n<!-- Generado con \`node _flujo/estado.mjs ayuda --markdown\`. No lo edites a mano: cámbialo en las órdenes de \`_flujo/estado.mjs\`. -->\n\nLa base de datos es la fuente de verdad del estado; los documentos de \`_docs/\` lo son del contenido. Este comando es lo único que escribe estado. Cada orden hace todo su cambio en una transacción, apunta el historial y devuelve un mensaje (con \`--json\`, un objeto \`{ ok, mensaje, … }\`).\n\nOpciones comunes: \`--quien\` (obligatoria al cambiar estado), \`--proyecto\`, \`--ruta\`, \`--json\`. Códigos de salida: 0 hecho, 2 uso incorrecto, 3 transición no permitida, 4 base ausente, ajena o de otra versión.\n\n${filas.join('\n')}`;
  }
  const sangria = (s) => s.replace(/^/gm, '    ');
  return `${cabecera}\n\nOpciones comunes: --quien (obligatoria al cambiar estado), --proyecto, --ruta, --json.\n\n${ORDENES.map((o) => `  ${o.uso}\n    Dónde: ${o.flujo}. Quién: ${o.quien}.\n${sangria(o.que)}\n`).join('\n')}`;
}

// =====================================================================================================================
// EJECUCIÓN
// =====================================================================================================================
const primera = pos[0];
if (!primera || primera === 'ayuda' || opts.ayuda) {
  process.stdout.write(textoAyuda(opts.markdown === true) + (opts.markdown ? '' : '\n'));
  process.exit(0);
}

const orden = ORDENES.find((o) => o.orden === `${pos[0]} ${pos[1]}`) ?? ORDENES.find((o) => o.orden === pos[0]);
if (!orden) terminar(2, `la orden «${pos.slice(0, 2).join(' ')}» no existe. Mira \`node _flujo/estado.mjs ayuda\``);

try {
  db = abrirBase({ crear: orden.crearBase });
  db.exec('BEGIN IMMEDIATE');
  try {
    const ctx = {};
    if (!orden.sinProyecto) ctx.proyecto = resolverProyecto();
    if (!orden.sinProyecto && !orden.sinCiclo) ctx.ciclo = cicloActivo(ctx.proyecto);
    const abierto = ctx.proyecto ? uno("SELECT * FROM ciclo WHERE proyecto_id = ? AND estado = 'abierto'", ctx.proyecto.id) : null;
    const avisos = [...(ctx.proyecto ? avisosPreviosProyecto(ctx.proyecto) : []), ...(abierto && orden.documento !== false ? avisosPrevios(abierto) : [])];
    const r = orden.ejecutar.call(orden, ctx);
    const roto = db.prepare('PRAGMA foreign_key_check').all();
    if (roto.length) throw prohibido(`el cambio dejaría claves foráneas rotas (${JSON.stringify(roto[0])}); no se ha guardado nada`);
    db.exec('COMMIT');
    const { mensaje, filaHistorial, cicloDocumento, ...extra } = r;
    let fallo = null;
    const proyecto = ctx.proyecto ?? (r.proyecto ? uno('SELECT * FROM proyecto WHERE nombre = ?', r.proyecto) : null);
    if (proyecto) {
      try {
        avisos.push(...escribirProyecto(proyecto));
        const c = orden.documento === false ? null : cicloDocumento ? uno('SELECT * FROM ciclo WHERE id = ?', cicloDocumento) : uno("SELECT * FROM ciclo WHERE proyecto_id = ? AND estado = 'abierto'", proyecto.id);
        if (c) avisos.push(...escribirEstado(c, filaHistorial));
      } catch (e) { fallo = e; }
    }
    db.close();
    if (fallo) terminar(5, `la base se ha guardado, pero no se pudo escribir un documento (${fallo.message}). Arréglalo y usa \`regenerar\``, { avisos });
    terminar(0, avisos.length ? `${mensaje}\n${avisos.map((a) => `AVISO: ${a}`).join('\n')}` : mensaje, { ...extra, avisos });
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch { /* ya deshecha */ }
    db.close();
    throw e;
  }
} catch (e) {
  if (e instanceof Fallo) terminar(e.codigo, e.message);
  terminar(3, `no se pudo hacer el cambio y no se ha guardado nada: ${e.message}`);
}
