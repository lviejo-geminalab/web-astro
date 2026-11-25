#!/usr/bin/env node
// Crea la base de datos del estado del flujo (SQLite) a partir de `_flujo/esquema.sql`.
// Uso: node _flujo/crear-base.mjs [--ruta <fichero>] [--json]
// Dónde: --ruta, o la variable de entorno FLUJO_BASE, o ~/.flujo/estado.db. Una base por persona, nunca dentro de un
// repositorio (decisión 46): si la ruta cae dentro de uno, se detiene.
// Es idempotente: si la base ya existe con el esquema de esta plantilla, no toca nada. Si es de otra versión, se
// detiene (decisión 55: el comando se para si la base es más nueva que su plantilla; aún no hay migraciones).
// Códigos de salida: 0 bien; 2 ruta o uso no válidos; 3 versión de esquema distinta o fichero que no es del flujo.
// Requiere Node 22.13 o posterior (`node:sqlite`) y no tiene más dependencias. Cada conexión que abra la base debe
// ejecutar `PRAGMA foreign_keys = ON`; el esquema lo hace al crearla, pero SQLite no lo recuerda entre conexiones.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const JSON_OUT = args.includes('--json');

function salir(codigo, mensaje, extra = {}) {
  if (JSON_OUT) console.log(JSON.stringify({ ok: codigo === 0, mensaje, ...extra }));
  else (codigo === 0 ? console.log : console.error)(codigo === 0 ? mensaje : `ERROR: ${mensaje}`);
  process.exit(codigo);
}

// ---------- Node y aviso experimental ----------
const [mayor, menor] = process.versions.node.split('.').map(Number);
if (mayor < 22 || (mayor === 22 && menor < 13)) salir(2, `hace falta Node 22.13 o posterior (hay ${process.versions.node}), por \`node:sqlite\``);
// `node:sqlite` avisa de que es experimental en cada ejecución; ese aviso es ruido aquí, el resto se deja pasar.
process.removeAllListeners('warning');
process.on('warning', (w) => { if (!(w.name === 'ExperimentalWarning' && /SQLite/i.test(w.message))) console.error(`${w.name}: ${w.message}`); });
const { DatabaseSync } = await import('node:sqlite');

// ---------- esquema de esta plantilla ----------
const FICHERO_ESQUEMA = path.join(path.dirname(fileURLToPath(import.meta.url)), 'esquema.sql');
const esquema = fs.readFileSync(FICHERO_ESQUEMA, 'utf8');
const versionPlantilla = Number(/\('esquema_version',\s*'(\d+)'\)/.exec(esquema)?.[1]);
if (!Number.isInteger(versionPlantilla)) salir(2, '`_flujo/esquema.sql` no declara `esquema_version`');

// ---------- ruta ----------
const ruta = path.resolve(opt('--ruta') ?? process.env.FLUJO_BASE ?? path.join(os.homedir(), '.flujo', 'estado.db'));

// La base nunca va dentro de un repositorio: se mira desde la primera carpeta existente hacia arriba.
function dentroDeRepositorio(ruta) {
  let d = path.dirname(ruta);
  while (!fs.existsSync(d)) d = path.dirname(d);
  d = fs.realpathSync(d);
  for (;;) {
    if (fs.existsSync(path.join(d, '.git'))) return d;
    const padre = path.dirname(d);
    if (padre === d) return null;
    d = padre;
  }
}
const repo = dentroDeRepositorio(ruta);
if (repo) salir(2, `la ruta ${ruta} está dentro del repositorio ${repo}: la base va siempre fuera (decisión 46). Usa --ruta o FLUJO_BASE`);

const contar = (db) => db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type = 'table'").get().n;

// ---------- ya existe ----------
if (fs.existsSync(ruta)) {
  const db = new DatabaseSync(ruta);
  let version;
  try { version = Number(db.prepare("SELECT valor FROM meta WHERE clave = 'esquema_version'").get()?.valor); }
  catch { version = NaN; }
  const tablas = contar(db);
  db.close();
  if (!Number.isInteger(version)) salir(3, `${ruta} ya existe y no es una base del flujo (no tiene la tabla \`meta\` con \`esquema_version\`); no la toco`);
  if (version > versionPlantilla) salir(3, `la base ${ruta} es del esquema ${version}, más nuevo que el de esta plantilla (${versionPlantilla}): actualiza la plantilla antes de usarla (decisión 55)`);
  if (version < versionPlantilla) salir(3, `la base ${ruta} es del esquema ${version} y esta plantilla trae el ${versionPlantilla}: hace falta migrarla y todavía no hay migraciones (decisión 55)`);
  salir(0, `La base ya existe: ${ruta} (esquema versión ${version}, ${tablas} tablas). No se ha cambiado nada.`, { ruta, version, tablas, creada: false });
}

// ---------- crearla ----------
fs.mkdirSync(path.dirname(ruta), { recursive: true, mode: 0o700 });
fs.closeSync(fs.openSync(ruta, 'wx', 0o600)); // permisos restringidos desde el primer momento
const db = new DatabaseSync(ruta);
try {
  db.exec(esquema);
  const huerfanas = db.prepare('PRAGMA foreign_key_check').all();
  if (huerfanas.length > 0) throw new Error('el esquema recién creado tiene claves foráneas rotas');
} catch (e) {
  db.close();
  fs.rmSync(ruta, { force: true });
  salir(2, `no se pudo crear la base: ${e.message}`);
}
const tablas = contar(db);
db.close();
try { fs.chmodSync(ruta, 0o600); } catch { /* sistemas sin permisos POSIX */ }
salir(0, `Base creada: ${ruta} (esquema versión ${versionPlantilla}, ${tablas} tablas).`, { ruta, version: versionPlantilla, tablas, creada: true });
