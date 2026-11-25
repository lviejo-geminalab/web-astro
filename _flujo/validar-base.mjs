// Comprobaciones del validador que miran la base de datos del estado (`R-BAS-nn`).
// Las usa `_flujo/validar.mjs` (no se ejecuta solo). Solo lee la base. Requiere Node 22.13 o posterior (`node:sqlite`);
// con una versión anterior el validador sigue funcionando y dice que no ha comprobado la base.
//
// Tiene dos partes:
//
// 1. REGLAS DE LA BASE (R-BAS-10 a R-BAS-19). Lo que el esquema SQL no puede garantizar por sí solo y se dijo que
//    comprobaría el validador: que un SDD cuelgue de la fase 4, que las aprobaciones de las fases 4 y 5 lleven SDD y
//    las demás no, que los códigos no se repitan en todo el proyecto, que cada requisito esté en la fase que le toca
//    según su tipo y la vía, que los estados de tarea, hueco y fase encajen entre sí, que cada aprobado tenga su
//    aprobación y que los contadores estén por delante de todos los códigos usados. Valen para toda la base.
//
// 2. BASE FRENTE AL REPOSITORIO (R-BAS-01 a R-BAS-07). Los documentos `proyecto.md` y `estado.md` son vistas de la
//    base. Aquí se comprueba que siguen diciendo lo mismo (ciclo activo, tabla de ciclos, estado de cada fase y de
//    cada tarea, contadores) y que la base conoce el proyecto del repositorio. Un documento editado a mano, una
//    fusión de git o una base de otra persona o de otro ordenador se detectan aquí. No compara el contenido
//    (títulos, criterios, tests): eso espera al lector.
//
// Cuándo corre: con `--base <fichero>`, con la variable FLUJO_BASE o, si no hay ninguna, con `~/.flujo/estado.db`
// cuando existe. Si no hay base (la integración continua, un clon recién hecho), no es un error: se dice que no se ha
// comprobado. Si la base se pide expresamente y falta, sí es un error. `--sin-base` la desactiva.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FICHERO_BASE = '(base)';
const TIPOS = { H: 'historias', R: 'requisitos', T: 'tests', TA: 'tareas', G: 'huecos' };

function versionDeEsquema() {
  return Number(/\('esquema_version',\s*'(\d+)'\)/.exec(fs.readFileSync(path.join(AQUI, 'esquema.sql'), 'utf8'))?.[1]);
}

// Resume los estados de los SDD en la fila de la fase 4 o 5 (igual que el comando de estado).
function resumen(estados) {
  if (estados.length === 0) return null;
  if (estados.every((e) => e === 'aprobado')) return 'aprobado';
  if (estados.every((e) => e === 'pendiente')) return 'pendiente';
  if (estados.every((e) => e === 'no aplica')) return 'no aplica';
  if (estados.includes('borrador')) return 'borrador';
  if (estados.includes('por revisar')) return 'por revisar';
  return 'borrador';
}
const nombreFase = { 0: 'Apertura', 1: 'Brief', 2: 'Historias', 3: 'Arquitectura', 4: 'SDD', 5: 'Tareas', 6: 'Verificación', 9: 'Cierre' };

// Devuelve { problemas, nota }. `M` es el modelo del lector. `ruta` es --base si se dio; `explicita`, si se pidió.
export async function validarBase({ M, ruta, explicita }) {
  const problemas = [];
  const p = (nivel, codigo, fichero, linea, mensaje) => problemas.push({ nivel, codigo, fichero: fichero ?? FICHERO_BASE, linea: linea ?? 0, mensaje });
  const error = (c, f, l, m) => p('ERROR', c, f, l, m);
  const aviso = (c, f, l, m) => p('AVISO', c, f, l, m);

  const fichero = path.resolve(ruta ?? process.env.FLUJO_BASE ?? path.join(os.homedir(), '.flujo', 'estado.db'));
  const pedida = explicita || !!process.env.FLUJO_BASE;
  if (!fs.existsSync(fichero)) {
    if (pedida) error('R-BAS-01', FICHERO_BASE, 0, `No existe la base ${fichero}`);
    return { problemas, nota: pedida ? `base ${fichero}: no existe` : 'sin base: no se ha comprobado el estado frente a la base' };
  }
  const [mayor, menor] = process.versions.node.split('.').map(Number);
  if (mayor < 22 || (mayor === 22 && menor < 13)) {
    if (pedida) error('R-BAS-01', FICHERO_BASE, 0, `Hace falta Node 22.13 o posterior para leer la base (hay ${process.versions.node})`);
    return { problemas, nota: 'base no comprobada: hace falta Node 22.13 o posterior' };
  }
  process.removeAllListeners('warning');
  process.on('warning', (w) => { if (!(w.name === 'ExperimentalWarning' && /SQLite/i.test(w.message))) console.error(`${w.name}: ${w.message}`); });
  const { DatabaseSync } = await import('node:sqlite');
  let db;
  try {
    db = new DatabaseSync(fichero, { readOnly: true });
    const v = db.prepare("SELECT valor FROM meta WHERE clave = 'esquema_version'").get()?.valor;
    if (v === undefined) throw new Error('no es una base del flujo');
    if (Number(v) !== versionDeEsquema()) throw new Error(`es de la versión de esquema ${v} y la plantilla es la ${versionDeEsquema()}`);
  } catch (e) {
    try { db?.close(); } catch { /* nada */ }
    error('R-BAS-01', FICHERO_BASE, 0, `No se puede usar la base ${fichero}: ${e.message}`);
    return { problemas, nota: `base ${fichero}: no se ha podido usar` };
  }
  const todos = (sql, ...a) => db.prepare(sql).all(...a);
  const uno = (sql, ...a) => db.prepare(sql).get(...a);

  // ===================================================================================================================
  // 1. Reglas de la base
  // ===================================================================================================================
  for (const r of todos("SELECT s.nombre, c.numero AS ciclo, f.numero AS fase FROM sdd s JOIN fase f ON f.id = s.fase_id JOIN ciclo c ON c.id = f.ciclo_id WHERE f.numero <> 4"))
    error('R-BAS-10', FICHERO_BASE, 0, `El SDD «${r.nombre}» del ciclo ${r.ciclo} cuelga de la fase ${r.fase}, y debe colgar de la 4`);

  for (const r of todos("SELECT a.id, f.numero AS fase, a.sdd_id, (SELECT f4.ciclo_id FROM sdd s JOIN fase f4 ON f4.id = s.fase_id WHERE s.id = a.sdd_id) AS ciclo_sdd, f.ciclo_id FROM aprobacion a JOIN fase f ON f.id = a.fase_id")) {
    const conSdd = r.fase === 4 || r.fase === 5;
    if (conSdd && r.sdd_id === null) error('R-BAS-11', FICHERO_BASE, 0, `La aprobación ${r.id} es de la fase ${r.fase} y no dice de qué SDD`);
    else if (!conSdd && r.sdd_id !== null) error('R-BAS-11', FICHERO_BASE, 0, `La aprobación ${r.id} es de la fase ${r.fase} y no debería llevar SDD`);
    else if (conSdd && r.ciclo_sdd !== r.ciclo_id) error('R-BAS-11', FICHERO_BASE, 0, `La aprobación ${r.id} apunta a un SDD de otro ciclo`);
  }

  const repetidos = (consulta, que) => { for (const r of todos(consulta)) error('R-BAS-12', FICHERO_BASE, 0, `${que} ${r.codigo} está repetido ${r.n} veces en el proyecto «${r.proyecto}»: los identificadores son únicos en todo el proyecto`); };
  repetidos("SELECT p.nombre AS proyecto, r.codigo, count(*) AS n FROM requerimiento r JOIN fase f ON f.id = r.fase_id JOIN ciclo c ON c.id = f.ciclo_id JOIN proyecto p ON p.id = c.proyecto_id GROUP BY p.id, r.codigo HAVING count(*) > 1", 'El requisito o historia');
  repetidos("SELECT p.nombre AS proyecto, t.codigo, count(*) AS n FROM tarea t JOIN sdd s ON s.id = t.sdd_id JOIN fase f ON f.id = s.fase_id JOIN ciclo c ON c.id = f.ciclo_id JOIN proyecto p ON p.id = c.proyecto_id GROUP BY p.id, t.codigo HAVING count(*) > 1", 'La tarea');
  repetidos("SELECT p.nombre AS proyecto, h.codigo, count(*) AS n FROM hueco h JOIN ciclo c ON c.id = h.ciclo_id JOIN proyecto p ON p.id = c.proyecto_id GROUP BY p.id, h.codigo HAVING count(*) > 1", 'El hueco');
  repetidos("SELECT p.nombre AS proyecto, te.codigo, count(*) AS n FROM test te JOIN tarea_test tt ON tt.test_id = te.id AND tt.accion = 'crea' JOIN tarea t ON t.id = tt.tarea_id JOIN sdd s ON s.id = t.sdd_id JOIN fase f ON f.id = s.fase_id JOIN ciclo c ON c.id = f.ciclo_id JOIN proyecto p ON p.id = c.proyecto_id GROUP BY p.id, te.codigo HAVING count(*) > 1", 'El test');

  for (const r of todos("SELECT r.codigo, r.tipo, r.sdd_id, f.numero AS fase, c.numero AS ciclo, c.via, s.fase_id AS sdd_fase, r.fase_id FROM requerimiento r JOIN fase f ON f.id = r.fase_id JOIN ciclo c ON c.id = f.ciclo_id LEFT JOIN sdd s ON s.id = r.sdd_id")) {
    const donde = `${r.codigo} (ciclo ${r.ciclo})`;
    if (!r.codigo.startsWith(r.tipo)) error('R-BAS-13', FICHERO_BASE, 0, `${donde} es de tipo ${r.tipo} y su código no empieza por ${r.tipo}`);
    if (r.tipo === 'H' && (r.fase !== 2 || r.sdd_id !== null)) error('R-BAS-13', FICHERO_BASE, 0, `${donde} es una historia y debe estar en la fase 2, sin SDD (está en la ${r.fase})`);
    if (r.tipo === 'R' && r.sdd_id === null && !(r.fase === 1 && r.via === 'corta')) error('R-BAS-13', FICHERO_BASE, 0, `${donde} es un requisito sin SDD: solo puede estar en la fase 1 de un ciclo de vía corta (está en la fase ${r.fase}, vía ${r.via ?? 'sin fijar'})`);
    if (r.tipo === 'R' && r.sdd_id !== null && (r.fase !== 4 || r.sdd_fase !== r.fase_id)) error('R-BAS-13', FICHERO_BASE, 0, `${donde} lleva SDD y debe estar en la fase 4 de ese SDD`);
  }

  for (const r of todos("SELECT t.codigo, t.estado, t.commit_hash, (SELECT count(*) FROM hueco h WHERE h.tarea_id = t.id AND h.estado = 'abierto') AS huecos FROM tarea t")) {
    if (r.estado === 'aprobada' && !r.commit_hash) error('R-BAS-14', FICHERO_BASE, 0, `La tarea ${r.codigo} está aprobada y no tiene commit anotado`);
    if (r.estado === 'bloqueada' && r.huecos === 0) error('R-BAS-14', FICHERO_BASE, 0, `La tarea ${r.codigo} está bloqueada y no tiene ningún hueco abierto`);
    if (r.estado !== 'bloqueada' && r.huecos > 0) error('R-BAS-14', FICHERO_BASE, 0, `La tarea ${r.codigo} está ${r.estado} y tiene un hueco abierto: debería estar bloqueada`);
  }
  for (const r of todos("SELECT codigo, camino FROM hueco WHERE estado = 'resuelto' AND camino IS NULL")) error('R-BAS-14', FICHERO_BASE, 0, `El hueco ${r.codigo} está resuelto y no dice por qué camino`);

  for (const c of todos('SELECT id, numero FROM ciclo WHERE numero IS NOT NULL')) {
    const fases = Object.fromEntries(todos('SELECT * FROM fase WHERE ciclo_id = ?', c.id).map((f) => [f.numero, f]));
    const sdds = todos('SELECT s.* FROM sdd s JOIN fase f ON f.id = s.fase_id WHERE f.ciclo_id = ?', c.id);
    for (const [n, campo] of [[4, 'estado_sdd'], [5, 'estado_tareas']]) {
      const esperado = resumen(sdds.map((s) => s[campo]));
      if (esperado && fases[n] && fases[n].estado !== esperado) error('R-BAS-15', FICHERO_BASE, 0, `Ciclo ${c.numero}: la fase ${n} está ${fases[n].estado} y el resumen de sus SDD es ${esperado}`);
    }
  }

  for (const f of todos("SELECT f.id, f.numero, c.numero AS ciclo FROM fase f JOIN ciclo c ON c.id = f.ciclo_id WHERE f.estado = 'aprobado' AND f.numero NOT IN (4, 5) AND NOT EXISTS (SELECT 1 FROM aprobacion a WHERE a.fase_id = f.id)"))
    error('R-BAS-16', FICHERO_BASE, 0, `Ciclo ${f.ciclo}: la fase ${f.numero} está aprobada y no hay ninguna aprobación registrada`);
  for (const [campo, fase, que] of [['estado_sdd', 4, 'SDD'], ['estado_tareas', 5, 'plan de tareas']])
    for (const s of todos(`SELECT s.id, s.nombre, c.numero AS ciclo FROM sdd s JOIN fase f4 ON f4.id = s.fase_id JOIN ciclo c ON c.id = f4.ciclo_id WHERE s.${campo} = 'aprobado' AND NOT EXISTS (SELECT 1 FROM aprobacion a JOIN fase fa ON fa.id = a.fase_id WHERE a.sdd_id = s.id AND fa.numero = ${fase})`))
      error('R-BAS-16', FICHERO_BASE, 0, `Ciclo ${s.ciclo}: el ${que} «${s.nombre}» está aprobado y no hay ninguna aprobación registrada`);
  for (const a of todos("SELECT count(*) AS n, c.numero AS ciclo FROM aprobacion a JOIN fase f ON f.id = a.fase_id JOIN ciclo c ON c.id = f.ciclo_id WHERE a.via = 'otra' GROUP BY c.id"))
    aviso('R-BAS-17', FICHERO_BASE, 0, `Ciclo ${a.ciclo}: ${a.n} aprobaciones no pasaron por el aviso de permiso (vía «otra»)`);

  for (const pr of todos('SELECT id, nombre FROM proyecto')) {
    for (const [tipo, tablaModelo] of Object.entries(TIPOS)) {
      const cont = uno('SELECT siguiente FROM contador WHERE proyecto_id = ? AND tipo = ?', pr.id, tipo);
      if (!cont) { error('R-BAS-18', FICHERO_BASE, 0, `El proyecto «${pr.nombre}» no tiene contador ${tipo}`); continue; }
      const consulta = {
        H: "SELECT r.codigo FROM requerimiento r JOIN fase f ON f.id = r.fase_id JOIN ciclo c ON c.id = f.ciclo_id WHERE c.proyecto_id = ? AND r.tipo = 'H'",
        R: "SELECT r.codigo FROM requerimiento r JOIN fase f ON f.id = r.fase_id JOIN ciclo c ON c.id = f.ciclo_id WHERE c.proyecto_id = ? AND r.tipo = 'R'",
        T: "SELECT DISTINCT te.codigo FROM test te JOIN tarea_test tt ON tt.test_id = te.id JOIN tarea t ON t.id = tt.tarea_id JOIN sdd s ON s.id = t.sdd_id JOIN fase f ON f.id = s.fase_id JOIN ciclo c ON c.id = f.ciclo_id WHERE c.proyecto_id = ?",
        TA: "SELECT t.codigo FROM tarea t JOIN sdd s ON s.id = t.sdd_id JOIN fase f ON f.id = s.fase_id JOIN ciclo c ON c.id = f.ciclo_id WHERE c.proyecto_id = ?",
        G: 'SELECT h.codigo FROM hueco h JOIN ciclo c ON c.id = h.ciclo_id WHERE c.proyecto_id = ?',
      }[tipo];
      const maximo = Math.max(0, ...todos(consulta, pr.id).map((r) => Number(r.codigo.slice(tipo.length))).filter(Number.isFinite));
      if (cont.siguiente <= maximo) error('R-BAS-18', FICHERO_BASE, 0, `Proyecto «${pr.nombre}»: el contador ${tipo} dice ${cont.siguiente} y ya existe ${tipo}${maximo}: se reutilizaría un identificador`);
    }
  }

  for (const c of todos('SELECT c.id, c.numero, c.estado FROM ciclo c WHERE c.estado IN (\'abierto\', \'cerrado\')')) {
    const f = Object.fromEntries(todos('SELECT numero, estado FROM fase WHERE ciclo_id = ?', c.id).map((x) => [x.numero, x.estado]));
    if (Object.keys(f).length !== 8) error('R-BAS-19', FICHERO_BASE, 0, `Ciclo ${c.numero}: tiene ${Object.keys(f).length} filas de fase y debe tener 8`);
    if (f[0] !== 'hecho') error('R-BAS-19', FICHERO_BASE, 0, `Ciclo ${c.numero}: está ${c.estado} y su fase 0 está ${f[0]}, no hecho`);
    if (c.estado === 'cerrado' && f[9] !== 'aprobado') error('R-BAS-19', FICHERO_BASE, 0, `Ciclo ${c.numero}: está cerrado y su fase 9 está ${f[9]}, no aprobado`);
  }

  // ===================================================================================================================
  // 2. La base frente al repositorio
  // ===================================================================================================================
  const nombre = M.proyecto.nombre;
  let proyecto = null;
  if (!nombre) aviso('R-BAS-02', M.proyecto.fichero, 0, 'proyecto.md no tiene nombre de proyecto: no se compara con la base');
  else {
    proyecto = uno('SELECT * FROM proyecto WHERE nombre = ?', nombre);
    if (!proyecto) (pedida ? error : aviso)('R-BAS-02', M.proyecto.fichero, 0, `La base no tiene el proyecto «${nombre}»${pedida ? '' : ' (¿es la base de otra persona, o de otro ordenador?)'}`);
  }
  if (proyecto) {
    const ciclos = todos('SELECT * FROM ciclo WHERE proyecto_id = ? ORDER BY posicion', proyecto.id);
    const abierto = ciclos.find((c) => c.estado === 'abierto');

    // proyecto.md: ciclo activo
    const activoDoc = M.proyecto.cicloActivo?.id ?? null;
    const activoBase = abierto?.carpeta ? path.basename(abierto.carpeta) : null;
    if (M.proyecto.cicloActivo && activoDoc !== activoBase) error('R-BAS-04', M.proyecto.fichero, M.proyecto.cicloActivo.linea, `El ciclo activo es ${activoDoc ?? 'ninguno'} en proyecto.md y ${activoBase ?? 'ninguno'} en la base`);

    // proyecto.md: tabla de ciclos
    for (const c of ciclos.filter((x) => x.carpeta)) {
      const fila = M.proyecto.ciclos.find((x) => x.carpeta === c.carpeta);
      if (!fila) aviso('R-BAS-03', M.proyecto.fichero, 0, `El ciclo ${c.carpeta} está en la base y no en la tabla de proyecto.md`);
      else if (fila.estado !== c.estado) error('R-BAS-03', M.proyecto.fichero, fila.linea, `El ciclo ${c.carpeta} está ${fila.estado} en proyecto.md y ${c.estado} en la base`);
    }
    for (const fila of M.proyecto.ciclos.filter((x) => x.carpeta))
      if (!ciclos.some((c) => c.carpeta === fila.carpeta)) aviso('R-BAS-03', M.proyecto.fichero, fila.linea, `El ciclo ${fila.carpeta} está en proyecto.md y no en la base`);
    const previstosDoc = M.proyecto.ciclos.filter((x) => x.estado === 'previsto').map((x) => x.objetivo);
    const previstosBase = ciclos.filter((x) => x.estado === 'previsto').map((x) => x.objetivo);
    if (previstosDoc.length && JSON.stringify(previstosDoc) !== JSON.stringify(previstosBase)) aviso('R-BAS-03', M.proyecto.fichero, 0, 'La hoja de ruta de proyecto.md no coincide con la de la base');

    // proyecto.md: contadores
    for (const k of M.proyecto.contadores) {
      const c = uno('SELECT siguiente FROM contador WHERE proyecto_id = ? AND tipo = ?', proyecto.id, k.tipo);
      if (c && c.siguiente !== k.siguiente) error('R-BAS-07', M.proyecto.fichero, k.linea, `El siguiente ${k.tipo} es ${k.siguiente} en proyecto.md y ${c.siguiente} en la base`);
    }

    // estado.md de cada ciclo que la base conoce
    for (const c of ciclos.filter((x) => x.carpeta)) {
      const id = path.basename(c.carpeta);
      const m = M.ciclos.find((x) => x.id === id);
      if (!m || !m.estado.existe) { if (c.estado === 'abierto' || c.estado === 'cerrado') aviso('R-BAS-05', c.carpeta, 0, `El ciclo ${id} está en la base y no tiene estado.md en el repositorio`); continue; }
      const fases = todos('SELECT * FROM fase WHERE ciclo_id = ?', c.id);
      const sdds = todos('SELECT s.* FROM sdd s JOIN fase f ON f.id = s.fase_id WHERE f.ciclo_id = ? ORDER BY s.orden', c.id);
      for (const f of m.estado.fases) {
        const base = fases.find((x) => x.numero === f.n);
        if (!base) continue;
        let esperado = base.estado;
        if (f.n === 4 || f.n === 5) {
          const sd = sdds.find((s) => s.nombre === f.sdd);
          if (f.sdd && !sd) { error('R-BAS-05', m.estado.fichero, f.linea, `El SDD «${f.sdd}» está en estado.md y no en la base`); continue; }
          if (sd) esperado = f.n === 4 ? sd.estado_sdd : sd.estado_tareas;
          else if (sdds.length > 0) continue;
        }
        if (f.estado !== esperado) error('R-BAS-05', m.estado.fichero, f.linea, `La fase ${f.n} ${nombreFase[f.n]}${f.sdd ? ` («${f.sdd}»)` : ''} está ${f.estado} en estado.md y ${esperado} en la base`);
      }
      for (const s of sdds) if (!m.estado.fases.some((f) => f.n === 4 && f.sdd === s.nombre)) aviso('R-BAS-05', m.estado.fichero, 0, `El SDD «${s.nombre}» está en la base y no tiene fila en estado.md`);

      const tareasBase = todos('SELECT t.*, s.nombre AS sdd FROM tarea t JOIN sdd s ON s.id = t.sdd_id JOIN fase f ON f.id = s.fase_id WHERE f.ciclo_id = ?', c.id);
      const progreso = M.progreso.filter((x) => x.ciclo === id);
      for (const r of progreso) {
        const t = tareasBase.find((x) => x.codigo === r.tarea);
        if (!t) { error('R-BAS-06', r.fichero, r.linea, `La tarea ${r.tarea} está en estado.md y no en la base`); continue; }
        if (r.estado !== t.estado) error('R-BAS-06', r.fichero, r.linea, `La tarea ${r.tarea} está ${r.estado} en estado.md y ${t.estado} en la base`);
        const h = r.commit.valor ?? '', hb = t.commit_hash ?? '';
        if (h !== hb && !(h && hb && (h.startsWith(hb) || hb.startsWith(h)))) error('R-BAS-06', r.fichero, r.linea, `El commit de ${r.tarea} es «${h}» en estado.md y «${hb}» en la base`);
      }
      for (const t of tareasBase) if (!progreso.some((r) => r.tarea === t.codigo)) error('R-BAS-06', m.estado.fichero, 0, `La tarea ${t.codigo} está en la base y no en la tabla «Tareas» de estado.md`);
    }
  }
  db.close();
  return { problemas, nota: `base ${fichero} comprobada` };
}
