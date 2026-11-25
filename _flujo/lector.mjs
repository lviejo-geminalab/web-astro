#!/usr/bin/env node
// Lector de _docs/ del flujo SDD + TDD.
// Convierte _docs/ en un modelo JSON versionado. No valida nada: solo lee y estructura.
// Node sin dependencias. Solo lectura (lee ficheros y ejecuta `git cat-file`/`git rev-parse`).
//
// Uso:
//   node _flujo/lector.mjs [--raiz <carpeta>]      imprime el modelo en JSON
//   import { leerProyecto, VERSION } from './lector.mjs'
//
// ── Contrato del modelo (versión 2) ─────────────────────────────────────────
// - `version` es un entero. Sube solo si se quita o renombra un campo o cambia su significado.
//   Añadir campos no sube la versión. Quien consume el modelo comprueba que `version` es la que espera.
// - Todas las rutas son relativas a la raíz, con «/» como separador. Nunca hay rutas absolutas.
// - Cada entidad lleva `fichero` y `linea` (1-based; 0 si no tiene línea) para poder señalar su origen.
// - Los valores se guardan tal como están escritos (sin comillas invertidas ni espacios sobrantes),
//   sin comprobar que pertenezcan al vocabulario fijo: eso es cosa del validador.
// - Datos incoherentes: el lector NO se detiene ni descarta nada. Carga lo que hay (también un estado
//   inventado, un ID repetido o una etiqueta ausente) y registra en `problemas` solo lo que impide
//   leer con fiabilidad (código `R-LEC-nn`). Una etiqueta ausente es `null`, no un valor por defecto.
// - Los arrays salen en el orden del documento; los ciclos, por nombre de carpeta.
//
// {
//   version: 3,
//   git: { disponible, superficial },
//   proyecto: {
//     fichero, existe, nombre, inicio,                          // null si falta o es la marca «[…]» de la plantilla
//     cicloActivo: { linea, valor, id } | null,                 // `id` = «NN-nombre», o null si dice «ninguno»
//     ciclos:    [{ linea, posicion, numero, carpeta, objetivo, estado, origen, abierto, cerrado }],
//     contadores:[{ linea, tipo, siguiente }]                   // tipo: H R T TA G
//   },
//   ciclos: [{
//     id, numero, carpeta, via,
//     estado: { fichero, existe,
//               fases:[{ linea, n, nombre, documento, estado, fecha, notas, sdd }],      // sdd: de «sdd-web.md» → «web», o null
//               historial:[{ linea, fecha, fase, motivo, afectadas, huecos:[G], hallazgos:[V] }],
//               huecosMencionados:[G] },                                                   // solo fases e historial: las notas de las tareas no cuentan
//               las tareas de todos los SDD están en la tabla «Tareas» y salen en `progreso`
//     sdd: [{ nombre, ficheros:{ sdd, tareas, revisiones },                                    // null si no existe
//             resumen:[{ linea, id, descripcion, cierre }],        // tabla-resumen de tareas-*.md, con repetidos
//             matriz:[{ linea, criterio, tests:[T], vacia }] }]    // matriz de cobertura de tareas-*.md
//   }],
//   historias:[{ id, ciclo, fichero, linea, titulo, enunciado, version, prioridad, dependeDe:[id] }],
//   requisitos:[{ …igual…, anadidoEnSdd }],   // anadidoEnSdd: true los de la tabla «Requisitos añadidos en el SDD» de un sdd-*.md
//   criterios:[{ id, ciclo, fichero, linea, origen, padre, texto, dado, cuando, entonces, sustituye, sustituyeA:[id] }],   // dado/cuando/entonces: null si el texto no sigue esa forma   // primera definición
//   tests:   [{ id, ciclo, sdd, fichero, linea, titulo, cubre, nivel, artefacto, preparacion, accion, esperado }],
//                                                        // cubre: { linea, valor, criterios:[id] } | null
//                                                        // nivel: { linea, valor, tipo, archivo } | null
//   testsAfectados:[{ ciclo, sdd, fichero, linea, test, tests:[T], accion, criterios:[id], justificacion, resultado }],
//   tareas:  [{ id, ciclo, sdd, fichero, linea, titulo, procedeDe, tests, dependeDe, testsAfectados, pasaSinCodigoNuevo,
//               artefacto, archivos, fueraDeEstaTarea, terminadaCuando, cierre, cierreDe, commits:[{ corto, tipo }], ordenResumen }],   // cierreDe: { linea, valor, ids:[H|R] } | null
//                                                        // procedeDe: { linea, valor, historias, requisitos, criterios } | null
//                                                        // tests|dependeDe|testsAfectados|pasaSinCodigoNuevo: { linea, valor, ids, ninguno } | null
//   progreso:[{ ciclo, sdd, fichero (siempre el estado.md del ciclo), linea, tarea, estado, commit:{ valor, formato, existe }, notas, huecos:[G] }],
//                                                        // commit.existe: true | false | null (null = no comprobable)
//   revisiones:[{ ciclo, sdd, fichero, linea, titulo, tipo, objetivo, numero, fecha, tarea, commit, commits:[hash], veredicto, suite, comprobado, decisionesMenores }],   // decisionesMenores: texto de la línea «Decisiones menores del programador» o null
//                                                        // tipo: «tarea» | «cierre»; objetivo: TA<n> o H<n>/R<n>
//   hallazgosRevision:[{ ciclo, sdd, fichero, linea, revision:{ objetivo, numero }, numero, gravedad, marcas:[], donde, texto, problemaDocumentacion }],
//   huecos:  [{ id, ciclo, fichero, linea, titulo, tarea, abiertoPor, fecha, nivel, camino, estado, queFalta, opciones, recomendacion, decision, enmienda, documentosEnmienda:[fichero.md] }],
//                                                        // nivel|camino|estado: { linea, valor } | null (nivel: «hueco»; camino: «enmienda», «repetir fases» o «corregir código», lo anota /hueco al resolver); decision: { fecha, texto } | null
//   verificaciones:[{ ciclo, fichero, linea, numero, ejecucion, fecha, veredicto, hallazgosNuevos:[V], motivo }],   // una por fila de «Historial de ejecuciones»; sin él, una sola por fichero (numero y fecha null)
//   hallazgos:[{ id, ciclo, fichero, linea, origen, titulo, estadoTitulo, gravedad, donde, queOcurre, faseARepetir, decision }],   // V; origen: «ficha» | «tabla»
//   revisionesArquitectura:[{ ciclo, fichero, linea, numero, fecha, veredicto }],
//   hallazgosArquitectura:[{ ciclo, fichero, linea, revision, numero, gravedad, marcas:[], donde, texto, resolucion }],   // resolucion: texto de «Resolución:» o null
//   commits: [{ hash, corto, autor, fecha, mensaje, tipo, tarea, fase, hueco }],        // de git log; [] si no hay git
//   problemas:[{ nivel, codigo, fichero, linea, mensaje }]
// }
// Todo campo de texto que falta en el documento es `null`. Los textos largos (secciones de SDD, brief, informes,
// `sistema.md`, `arquitectura.md`) no se modelan. Los campos de varias líneas conservan los saltos de línea.
// Los tests viven en tareas-*.md, debajo de la ficha de su tarea (encabezado `T<n>`); la matriz de cobertura y la tabla
// «Tests existentes afectados» también se leen de ahí. La versión 2 quita `ficheros.tests`: no hay fichero de tests aparte.
// La versión 3 quita `proyecto.idioma` (el idioma es siempre el español) y añade `huecos[].camino`.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const VERSION = 3;

// ---------- utilidades de Markdown ----------
const limpia = (s) => s.replace(/`/g, '').trim();

// Tablas: [{ linea, cabecera, filas: [{ linea, celdas }] }]
function tablas(lineas) {
  const out = [];
  let t = null;
  lineas.forEach((l, i) => {
    if (/^\s*\|/.test(l)) {
      const celdas = l.trim().replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
      if (celdas.every((c) => /^:?-{2,}:?$/.test(c))) return; // separador
      if (!t) { t = { linea: i + 1, cabecera: celdas, filas: [] }; out.push(t); }
      else t.filas.push({ linea: i + 1, celdas });
    } else t = null;
  });
  return out;
}

// Fichas: secciones cuyo encabezado (cualquier nivel) empieza por un ID. [{ id, linea, titulo, cuerpo:[{n, texto}] }]
function fichas(lineas, re) {
  const out = [];
  let cur = null;
  lineas.forEach((l, i) => {
    const h = /^#{1,6}\s+(.*)$/.exec(l);
    if (h) {
      cur = null;
      const m = re.exec(h[1]);
      if (m) { cur = { id: m[1], linea: i + 1, titulo: h[1], cuerpo: [] }; out.push(cur); }
    } else if (cur) cur.cuerpo.push({ n: i + 1, texto: l });
  });
  return out;
}

// Etiqueta «Nombre: valor» dentro de un conjunto de líneas [{n, texto}].
function etiquetaEn(cuerpo, nombre) {
  const re = new RegExp('^\\s*\\**' + nombre + '\\**(?:\\s*\\([^)]*\\))?\\s*:\\s*(.*)$', 'i');
  for (const { n, texto } of cuerpo) { const m = re.exec(texto); if (m) return { linea: n, valor: m[1].trim() }; }
  return null;
}

// Igual que etiquetaEn, pero devuelve también el paréntesis (`Decisión (2026-11-21):`) y el texto de varias líneas.
// modo «sangria»: continúan las líneas con sangría; modo «bloque»: continúan todas hasta la primera línea en blanco.
function etiquetaTexto(cuerpo, nombre, modo = 'sangria') {
  const re = new RegExp('^\\s*\\**' + nombre + '\\**\\s*(?:\\(([^)]*)\\))?\\s*:\\s*(.*)$', 'i');
  for (let k = 0; k < cuerpo.length; k++) {
    const m = re.exec(cuerpo[k].texto);
    if (!m) continue;
    const trozos = [m[2].trim()];
    for (let j = k + 1; j < cuerpo.length; j++) {
      const t = cuerpo[j].texto;
      if (t.trim() === '' || (modo === 'sangria' && !/^\s/.test(t))) break;
      trozos.push(t.trim());
    }
    return { linea: cuerpo[k].n, parentesis: m[1] ?? null, valor: m[2].trim(), texto: trozos.filter(Boolean).join('\n') };
  }
  return null;
}
const textoDe = (cuerpo, nombre, modo) => etiquetaTexto(cuerpo, nombre, modo)?.texto ?? null;

// Etiqueta en negrita con los dos puntos dentro (`- **Gravedad:** valor`) o sin negrita.
function etiquetaNegrita(cuerpo, nombre) {
  const re = new RegExp('^\\s*[-*]?\\s*(?:\\*\\*' + nombre + ':?\\*\\*:?|' + nombre + ':)\\s*(.*)$', 'i');
  for (const { texto } of cuerpo) { const m = re.exec(texto); if (m) return m[1].trim(); }
  return null;
}

// Hallazgos numerados bajo «Hallazgos:» (`1. [bloqueante, problema de documentación] fichero:línea — texto`).
function leerHallazgos(cuerpo) {
  const k = cuerpo.findIndex((x) => /^\s*\**Hallazgos\**\s*:/i.test(x.texto));
  if (k < 0) return [];
  const out = [];
  for (let j = k + 1; j < cuerpo.length; j++) {
    const t = cuerpo[j].texto;
    if (t.trim() === '') break;
    const m = /^\s*(\d+)\.\s*\[([^\]]+)\]\s*(.*)$/.exec(t);
    if (m) {
      const marcas = m[2].split(',').map((x) => x.trim());
      const [donde, ...resto] = m[3].split(' — ');
      out.push({ linea: cuerpo[j].n, numero: +m[1], gravedad: marcas[0], marcas: marcas.slice(1), donde: resto.length ? donde.trim() : null, texto: (resto.length ? resto.join(' — ') : m[3]).trim() });
    } else if (out.length && /^\s/.test(t)) out[out.length - 1].texto += '\n' + t.trim();
  }
  return out;
}

// Primera tabla bajo el encabezado que cumple `re`: [{ linea (absoluta), celdas }]
function tablaTrasEncabezado(L, re) {
  const i = L.findIndex((l) => re.test(l));
  if (i < 0) return [];
  const k = L.findIndex((l, n) => n > i && /^#{1,6}\s/.test(l));
  const t = tablas(L.slice(i + 1, k < 0 ? undefined : k))[0];
  return (t?.filas ?? []).map((r) => ({ linea: r.linea + i + 1, celdas: r.celdas }));
}

// «Dado …, cuando …, entonces …» → partes (null si no tiene las tres)
function dadoCuandoEntonces(texto) {
  const m = /^\s*Dad[oa]s?\s+(.+?),?\s+cuando\s+(.+?),?\s+entonces\s+(.+)$/is.exec(texto ?? '');
  return m ? { dado: m[1].trim(), cuando: m[2].trim(), entonces: m[3].trim() } : { dado: null, cuando: null, entonces: null };
}

// Texto de un criterio: lo que sigue al ID y las líneas con sangría que lo continúan.
function textoCriterio(L, i) {
  const partes = [L[i].replace(/^\s*[-*]\s*\**(?:H|R)\d+-C\d+\**\s*(?:\([^)]*\))?\s*:?\s*/, '').trim()];
  for (let j = i + 1; j < L.length; j++) {
    if (L[j].trim() === '' || !/^\s/.test(L[j]) || /^\s*[-*]\s/.test(L[j])) break;
    partes.push(L[j].trim());
  }
  return partes.filter(Boolean).join(' ') || null;
}

const ids = (s, prefijo) => [...s.matchAll(new RegExp('(?<![A-Za-z0-9-])' + prefijo + '(\\d+)(?![A-Za-z0-9-])', 'g'))].map((m) => prefijo + m[1]);
const unicos = (a) => [...new Set(a)];

// ---------- lectura del proyecto ----------
export function leerProyecto(raizArg) {
  const RAIZ = path.resolve(raizArg ?? process.cwd());
  const DOCS = path.join(RAIZ, '_docs');
  const problemas = [];
  const rel = (f) => path.relative(RAIZ, f).split(path.sep).join('/');
  const problema = (nivel, codigo, fichero, linea, mensaje) => problemas.push({ nivel, codigo, fichero: fichero ? rel(fichero) : '', linea: linea ?? 0, mensaje });

  const cache = new Map();
  function leer(f) {
    if (!cache.has(f)) {
      let l = null;
      if (fs.existsSync(f)) {
        try { l = fs.readFileSync(f, 'utf8').split(/\r?\n/); }
        catch (e) { problema('ERROR', 'R-LEC-02', f, 0, `No se pudo leer el fichero (${e.code ?? e.message})`); }
      }
      cache.set(f, l);
    }
    return cache.get(f);
  }

  // ---- _docs/proyecto.md
  const ficheroProyecto = path.join(DOCS, 'proyecto.md');
  const LP = leer(ficheroProyecto);
  const proyecto = { fichero: rel(ficheroProyecto), existe: !!LP, nombre: null, inicio: null, cicloActivo: null, ciclos: [], contadores: [] };
  if (LP) {
    const planas = LP.map((texto, i) => ({ n: i + 1, texto })).filter((x) => !x.texto.trim().startsWith('|'));
    const dato = (nombre) => { const e = etiquetaEn(planas, nombre); const v = e ? limpia(e.valor) : ''; return v === '' || v.startsWith('[') ? null : v; };
    proyecto.nombre = dato('Nombre'); proyecto.inicio = dato('Inicio');
    const act = etiquetaEn(planas, 'Ciclo activo');
    if (act) {
      const m = /_docs\/ciclos\/(\d{2}-[^\s`)]+)/.exec(act.valor);
      proyecto.cicloActivo = { linea: act.linea, valor: limpia(act.valor), id: m ? m[1].replace(/[.,;]+$/, '') : null };
    }
    for (const t of tablas(LP)) {
      const col = (nombre) => t.cabecera.findIndex((c) => limpia(c).toLowerCase() === nombre);
      const iEstado = col('estado'), iCarpeta = col('carpeta'), iObjetivo = col('objetivo'), iNumero = col('nº'), iOrigen = col('origen'), iAbierto = col('abierto'), iCerrado = col('cerrado');
      for (const r of t.filas) {
        const c0 = limpia(r.celdas[0] ?? '');
        const mc = /^(TA|H|R|T|G)\b/.exec(c0);
        if (mc && r.celdas.length >= 2 && /^\d+$/.test(limpia(r.celdas[1]))) proyecto.contadores.push({ linea: r.linea, tipo: mc[1], siguiente: +limpia(r.celdas[1]) });
        if (iEstado >= 0 && iCarpeta >= 0) {
          const v = (i) => (i >= 0 && r.celdas[i] !== undefined && limpia(r.celdas[i]) !== '' ? limpia(r.celdas[i]) : null);
          proyecto.ciclos.push({ linea: r.linea, posicion: proyecto.ciclos.length + 1, numero: v(iNumero), carpeta: v(iCarpeta), objetivo: v(iObjetivo), estado: v(iEstado), origen: v(iOrigen), abierto: v(iAbierto), cerrado: v(iCerrado) });
        }
      }
    }
  }

  // ---- ciclos
  const carpetaCiclos = path.join(DOCS, 'ciclos');
  const idsCiclos = fs.existsSync(carpetaCiclos)
    ? fs.readdirSync(carpetaCiclos, { withFileTypes: true }).filter((d) => d.isDirectory() && /^\d{2}-/.test(d.name)).map((d) => d.name).sort()
    : [];

  const modelo = { version: VERSION, git: { disponible: false, superficial: false }, proyecto, ciclos: [], historias: [], requisitos: [], criterios: [], tests: [], testsAfectados: [], tareas: [], progreso: [], revisiones: [], hallazgosRevision: [], huecos: [], verificaciones: [], hallazgos: [], revisionesArquitectura: [], hallazgosArquitectura: [], commits: [], problemas };
  const criteriosVistos = new Set();

  for (const c of idsCiclos) {
    const dir = path.join(carpetaCiclos, c);
    const nombres = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name).sort();
    const ficherosDe = (patron) => nombres.filter((f) => patron.test(f)).map((f) => path.join(dir, f));
    const base = { ciclo: c };
    const lineasDe = (L) => L.map((texto, i) => ({ n: i + 1, texto }));

    // estado.md
    const estadoF = path.join(dir, 'estado.md');
    const EL = leer(estadoF);
    const estado = { fichero: EL ? rel(estadoF) : null, existe: !!EL, fases: [], historial: [], huecosMencionados: [] };
    let via = null;
    const filasTarea = new Set();
    if (EL) {
      const v = etiquetaEn(lineasDe(EL).filter((x) => !x.texto.trim().startsWith('|')), 'Vía');
      via = v && limpia(v.valor) !== '' ? limpia(v.valor) : null;
      for (const t of tablas(EL)) for (const r of t.filas) {
        const c0 = r.celdas[0] ?? '';
        const mf = /^(\d{1,2})\s+(\S.*)$/.exec(c0);
        if (mf) {
          const documento = limpia(r.celdas[1] ?? '');
          estado.fases.push({ linea: r.linea, n: +mf[1], nombre: limpia(mf[2]), documento, estado: limpia(r.celdas[2] ?? ''), fecha: limpia(r.celdas[3] ?? ''), notas: limpia(r.celdas[4] ?? ''), sdd: (/^(?:sdd|tareas)-(.+)\.md$/.exec(documento) ?? [])[1] ?? null });
        } else if (/^TA\d+$/.test(limpia(r.celdas[1] ?? '')) && r.celdas.length >= 3) {
          // tabla «Tareas»: SDD | Tarea | Estado | Commit | Notas
          const commit = limpia(r.celdas[3] ?? '');
          filasTarea.add(r.linea);
          modelo.progreso.push({ ...base, sdd: limpia(c0), fichero: rel(estadoF), linea: r.linea, tarea: limpia(r.celdas[1]), estado: limpia(r.celdas[2] ?? ''), commit: { valor: commit, formato: /^[0-9a-f]{7,40}$/.test(commit), existe: null }, notas: r.celdas[4] ?? '', huecos: unicos(ids(r.celdas[4] ?? '', 'G')) });
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(limpia(c0)) && r.celdas.length >= 3) {
          const fila = r.celdas.join(' ');
          estado.historial.push({ linea: r.linea, fecha: limpia(c0), fase: limpia(r.celdas[1] ?? ''), motivo: limpia(r.celdas[2] ?? ''), afectadas: limpia(r.celdas[3] ?? ''), huecos: unicos(ids(fila, 'G')), hallazgos: unicos(ids(fila, 'V')) });
        }
      }
      estado.huecosMencionados = unicos(EL.flatMap((l, i) => filasTarea.has(i + 1) ? [] : [...l.matchAll(/\bG\d+\b/g)].map((m) => m[0])));
    }

    // historias, requisitos y criterios (brief e historias; después, SDD)
    const resumenHistorias = new Map();
    for (const f of ficherosDe(/^historias\.md$/)) for (const t of tablas(leer(f))) {
      const col = (n) => t.cabecera.findIndex((x) => limpia(x).toLowerCase() === n);
      const iId = col('id'), iVersion = col('versión'), iPrioridad = col('prioridad'), iDepende = col('depende de');
      if (iId < 0) continue;
      const dato = (r, i) => (i >= 0 && r.celdas[i] !== undefined && limpia(r.celdas[i]) !== '' ? limpia(r.celdas[i]) : null);
      for (const r of t.filas) {
        const id = limpia(r.celdas[iId] ?? '');
        if (!/^[HR]\d+$/.test(id)) continue;
        const prioridad = dato(r, iPrioridad), dep = dato(r, iDepende) ?? '';
        resumenHistorias.set(id, { version: dato(r, iVersion), prioridad: /^\d+$/.test(prioridad ?? '') ? +prioridad : prioridad, dependeDe: unicos([...ids(dep, 'H'), ...ids(dep, 'R')]) });
      }
    }
    for (const f of [...ficherosDe(/^historias\.md$/), ...ficherosDe(/^brief\.md$/)]) {
      const L = leer(f);
      for (const h of fichas(L, /^([HR]\d+)\b/)) {
        const fin = h.cuerpo.findIndex((x) => /^\s*[-*]\s*\**(?:H|R)\d+-C\d+/.test(x.texto));
        const enunciado = h.cuerpo.slice(0, fin < 0 ? undefined : fin).map((x) => x.texto.trim()).filter(Boolean).join(' ') || null;
        const r = resumenHistorias.get(h.id);
        const entidad = { id: h.id, ...base, fichero: rel(f), linea: h.linea, titulo: h.titulo, enunciado, version: r?.version ?? null, prioridad: r?.prioridad ?? null, dependeDe: r?.dependeDe ?? [] };
        if (h.id[0] === 'H') modelo.historias.push(entidad); else modelo.requisitos.push({ ...entidad, anadidoEnSdd: false });
      }
      L.forEach((l, i) => {
        const m = /^\s*[-*]\s*\**((?:H|R)\d+-C\d+)\b/.exec(l);
        if (m && !criteriosVistos.has(m[1])) anadirCriterio(m[1], f, L, i, /historias\.md$/.test(f) ? 'historias' : 'brief');
      });
    }
    for (const f of ficherosDe(/^sdd-.*\.md$/)) {
      const L = leer(f);
      L.forEach((l, i) => {
        const m = /^\s*[-*]\s*\**((?:H|R)\d+-C\d+)\**\s*[(:]/.exec(l);
        if (m && !criteriosVistos.has(m[1])) anadirCriterio(m[1], f, L, i, 'sdd');
      });
      // requisitos nuevos: tabla «Requisitos añadidos en el SDD» (`ID | Título`); si falta, no se recoge ninguno
      for (const r of /sdd-indice\.md$/.test(f) ? [] : tablaTrasEncabezado(L, /^#{1,6}\s+(?:[\d.]+\s*)?Requisitos añadidos en el SDD\b/i)) {   // el índice no es un SDD
        const id = limpia(r.celdas[0] ?? '');
        if (/^R\d+$/.test(id) && !modelo.requisitos.some((x) => x.id === id)) modelo.requisitos.push({ id, ...base, fichero: rel(f), linea: r.linea, titulo: limpia(r.celdas[1] ?? '') ? `${id}: ${limpia(r.celdas[1])}` : id, enunciado: null, version: null, prioridad: null, dependeDe: [], anadidoEnSdd: true });
      }
    }
    function anadirCriterio(id, f, L, i, origen) {
      criteriosVistos.add(id);
      const texto = L[i];
      const sust = /sustituye\s+a\s+(.*)$/i.exec(texto);
      modelo.criterios.push({ id, ...base, fichero: rel(f), linea: i + 1, origen, padre: id.replace(/-C\d+$/, ''), texto: textoCriterio(L, i), ...dadoCuandoEntonces(textoCriterio(L, i)), sustituye: /sustituye\s+a\s+(?:H|R)\d+-C\d+/i.test(texto), sustituyeA: sust ? unicos([...sust[1].matchAll(/(?:H|R)\d+-C\d+/g)].map((m) => m[0])) : [] });
    }

    // huecos
    for (const f of ficherosDe(/^huecos\.md$/)) for (const h of fichas(leer(f), /^(G\d+)\b/)) {
      const nivel = etiquetaEn(h.cuerpo, 'Nivel'), camino = etiquetaEn(h.cuerpo, 'Camino'), est = etiquetaEn(h.cuerpo, 'Estado');
      const dec = etiquetaTexto(h.cuerpo, 'Decisión', 'bloque');
      modelo.huecos.push({
        id: h.id, ...base, fichero: rel(f), linea: h.linea, titulo: h.titulo,
        tarea: (/—\s*(TA\d+)\b/.exec(h.titulo) ?? [])[1] ?? null,
        abiertoPor: (/abierto por\s+(.+?)(?:\s+—|$)/.exec(h.titulo) ?? [])[1] ?? null,
        fecha: (/(\d{4}-\d{2}-\d{2})/.exec(h.titulo) ?? [])[1] ?? null,
        nivel, camino, estado: est,
        queFalta: textoDe(h.cuerpo, 'Qué falta', 'bloque'), opciones: textoDe(h.cuerpo, 'Opciones', 'bloque'), recomendacion: textoDe(h.cuerpo, 'Recomendación', 'bloque'),
        decision: dec ? { fecha: (/(\d{4}-\d{2}-\d{2})/.exec(dec.parentesis ?? '') ?? [])[1] ?? null, texto: dec.texto } : null,
        enmienda: textoDe(h.cuerpo, 'Enmienda G\\d+', 'bloque'),
        documentosEnmienda: unicos([...(textoDe(h.cuerpo, 'Enmienda G\\d+', 'bloque') ?? '').matchAll(/[\w./-]+\.md\b/g)].map((m) => m[0].replace(/^.*\//, ''))),
      });
    }

    // verificación: ejecuciones y hallazgos
    for (const f of ficherosDe(/^verificacion.*\.md$/)) {
      const L = leer(f);
      const iFase = L.findIndex((l) => /^Fase:/.test(l));
      const iVered = L.findIndex((l) => /^#{1,6}\s+(?:\d+\.\s*)?Veredicto\b/i.test(l));
      const vered = iVered < 0 ? null : L.slice(iVered + 1).map((l) => /\*\*`?([^`*]+?)`?\*\*/.exec(l)).find(Boolean);
      const filasHistorial = tablaTrasEncabezado(L, /^#{1,6}\s+(?:\d+\.\s*)?Historial de ejecuciones\b/i);
      if (filasHistorial.length) {
        for (const r of filasHistorial) modelo.verificaciones.push({ ...base, fichero: rel(f), linea: r.linea, numero: /^\d+$/.test(limpia(r.celdas[0] ?? '')) ? +limpia(r.celdas[0]) : null, ejecucion: null, fecha: /^\d{4}-\d{2}-\d{2}$/.test(limpia(r.celdas[1] ?? '')) ? limpia(r.celdas[1]) : null, veredicto: limpia(r.celdas[2] ?? '') || null, hallazgosNuevos: unicos(ids(r.celdas[3] ?? '', 'V')), motivo: limpia(r.celdas[4] ?? '') || null });
      } else {
        modelo.verificaciones.push({ ...base, fichero: rel(f), linea: iFase + 1, numero: null, ejecucion: iFase < 0 ? null : (/\(([^),]*?)\s+ejecución/i.exec(L[iFase]) ?? [])[1] ?? null, fecha: null, veredicto: vered ? vered[1].trim() : null, hallazgosNuevos: [], motivo: null });
      }
      for (const h of fichas(L, /^(V\d+)\b/)) {
        const grav = etiquetaNegrita(h.cuerpo, 'Gravedad');
        modelo.hallazgos.push({ id: h.id, ...base, fichero: rel(f), linea: h.linea, origen: 'ficha', titulo: h.titulo, estadoTitulo: (/\(([^()]*)\)\s*$/.exec(h.titulo) ?? [])[1] ?? null, gravedad: grav ? ((/`([^`]+)`/.exec(grav) ?? [])[1] ?? grav.split(/\s/)[0]) : null, donde: etiquetaNegrita(h.cuerpo, 'Dónde'), queOcurre: etiquetaNegrita(h.cuerpo, 'Qué ocurre'), faseARepetir: etiquetaNegrita(h.cuerpo, 'Fase que hay que repetir'), decision: etiquetaNegrita(h.cuerpo, 'Decisión') });
      }
      for (const t of tablas(L)) for (const r of t.filas) if (/^V\d+$/.test(r.celdas[0])) modelo.hallazgos.push({ id: r.celdas[0], ...base, fichero: rel(f), linea: r.linea, origen: 'tabla', titulo: null, estadoTitulo: null, gravedad: null, donde: null, queOcurre: null, faseARepetir: null, decision: null });
    }

    // revisión de la arquitectura
    for (const f of ficherosDe(/^revision-arquitectura\.md$/)) for (const h of fichas(leer(f), /^Revisión\s+(\d+)\b/i)) {
      modelo.revisionesArquitectura.push({ ...base, fichero: rel(f), linea: h.linea, numero: +h.id, fecha: (/(\d{4}-\d{2}-\d{2})/.exec(h.titulo) ?? [])[1] ?? null, veredicto: etiquetaEn(h.cuerpo, 'Veredicto')?.valor ?? null });
      const k = h.cuerpo.findIndex((x) => /^\s*\**Resolución\**\s*:/i.test(x.texto));
      const resolucion = new Map();
      for (let j = k < 0 ? h.cuerpo.length : k + 1; j < h.cuerpo.length && h.cuerpo[j].texto.trim() !== ''; j++) {
        const m = /^\s*(\d+)\.\s*(.+)$/.exec(h.cuerpo[j].texto);
        if (m) resolucion.set(+m[1], m[2].trim());
      }
      for (const x of leerHallazgos(h.cuerpo)) modelo.hallazgosArquitectura.push({ ...base, fichero: rel(f), linea: x.linea, revision: +h.id, numero: x.numero, gravedad: x.gravedad, marcas: x.marcas, donde: x.donde, texto: x.texto, resolucion: resolucion.get(x.numero) ?? null });
    }

    // SDD: tareas con sus tests y revisiones
    const nombresSdd = unicos(nombres.filter((f) => /^(tareas|revisiones)-.*\.md$/.test(f)).map((f) => f.replace(/^(tareas|revisiones)-/, '').replace(/\.md$/, '')));
    const sdd = [];
    for (const nombre of nombresSdd) {
      const rutas = { tareas: path.join(dir, `tareas-${nombre}.md`), revisiones: path.join(dir, `revisiones-${nombre}.md`) };
      const L = { tareas: leer(rutas.tareas), revisiones: leer(rutas.revisiones) };
      const entrada = { nombre, ficheros: { sdd: fs.existsSync(path.join(dir, `sdd-${nombre}.md`)) ? rel(path.join(dir, `sdd-${nombre}.md`)) : null, ...Object.fromEntries(Object.keys(rutas).map((k) => [k, L[k] ? rel(rutas[k]) : null])) }, resumen: [], matriz: [] };
      const origen = { ...base, sdd: nombre };

      if (L.tareas) {
        const resumen = tablas(L.tareas).flatMap((t) => t.filas).filter((r) => /^TA\d+$/.test(r.celdas[0]));
        entrada.resumen = resumen.map((r) => ({ linea: r.linea, id: r.celdas[0], descripcion: r.celdas[1] ?? null, cierre: (/\*\*(cierre[^*]*)\*\*/i.exec(r.celdas.join(' | ')) ?? [])[1] ?? null }));
        const orden = new Map();
        resumen.forEach((r) => { if (!orden.has(r.celdas[0])) orden.set(r.celdas[0], orden.size); });
        const etiquetaIds = (e, prefijo) => (e ? { linea: e.linea, valor: e.valor, ids: unicos(ids(e.valor, prefijo)), ninguno: /^ninguno/i.test(e.valor) } : null);
        for (const h of fichas(L.tareas, /^(TA\d+)\b/)) {
          const procede = etiquetaTexto(h.cuerpo, 'Procede de');
          modelo.tareas.push({
            id: h.id, ...origen, fichero: rel(rutas.tareas), linea: h.linea, titulo: h.titulo,
            procedeDe: procede ? { linea: procede.linea, valor: procede.valor, historias: unicos(ids(procede.valor, 'H')), requisitos: unicos(ids(procede.valor, 'R')), criterios: unicos([...procede.valor.matchAll(/(?:H|R)\d+-C\d+/g)].map((m) => m[0])) } : null,
            dependeDe: etiquetaIds(etiquetaEn(h.cuerpo, 'Depende de'), 'TA'),
            tests: etiquetaIds(etiquetaEn(h.cuerpo, 'Tests'), 'T'),
            testsAfectados: etiquetaIds(etiquetaEn(h.cuerpo, 'Tests existentes afectados'), 'T'),
            pasaSinCodigoNuevo: etiquetaIds(etiquetaEn(h.cuerpo, 'Pasa sin código nuevo'), 'T'),
            artefacto: textoDe(h.cuerpo, 'Artefacto'), archivos: textoDe(h.cuerpo, 'Archivos'), fueraDeEstaTarea: textoDe(h.cuerpo, 'Fuera de esta tarea'), terminadaCuando: textoDe(h.cuerpo, 'Terminada cuando'),
            cierre: entrada.resumen.find((r) => r.id === h.id)?.cierre ?? null,
            cierreDe: (() => {
              const e = etiquetaEn(h.cuerpo, 'Cierre de');
              const texto = e?.valor ?? entrada.resumen.find((r) => r.id === h.id)?.cierre ?? null;   // sin etiqueta, se lee el «**cierre de H17**» del resumen
              return texto ? { linea: e?.linea ?? 0, valor: texto, ids: unicos([...ids(texto, 'H'), ...ids(texto, 'R')]) } : null;
            })(),
            ordenResumen: orden.has(h.id) ? orden.get(h.id) : null,
          });
        }
      }

      // Tests: encabezados `T<n>` de tareas-*.md, debajo de la ficha de su tarea.
      for (const fuente of [{ ruta: rutas.tareas, lineas: L.tareas }]) {
        if (!fuente.lineas) continue;
        for (const h of fichas(fuente.lineas, /^(T\d+)\b/)) {
          const cubre = etiquetaEn(h.cuerpo, 'Cubre'), nivel = etiquetaEn(h.cuerpo, 'Nivel');
          const [tipo, ...resto] = nivel ? nivel.valor.split(' — ') : [];
          modelo.tests.push({
            id: h.id, ...origen, fichero: rel(fuente.ruta), linea: h.linea, titulo: h.titulo,
            cubre: cubre ? { linea: cubre.linea, valor: cubre.valor, criterios: unicos([...cubre.valor.matchAll(/(?:H|R)\d+-C\d+/g)].map((m) => m[0])) } : null,
            nivel: nivel ? { linea: nivel.linea, valor: nivel.valor, tipo: tipo.trim(), archivo: resto.length ? limpia(resto.join(' — ')) : null } : null,
            artefacto: textoDe(h.cuerpo, 'Artefacto'), preparacion: textoDe(h.cuerpo, 'Preparación'), accion: textoDe(h.cuerpo, 'Acción'), esperado: textoDe(h.cuerpo, 'Esperado'),
          });
        }
      }
      if (L.tareas) {
        for (const t of tablas(L.tareas)) for (const r of t.filas) if (/^(H|R)\d+-C\d+$/.test(limpia(r.celdas[0]))) {
          entrada.matriz.push({ linea: r.linea, criterio: limpia(r.celdas[0]), tests: unicos(ids(r.celdas.slice(1).join(' '), 'T')), vacia: r.celdas.slice(1).join('').trim() === '' });
        }
        // «Tests existentes afectados»: primera tabla de esa sección
        for (const r of tablaTrasEncabezado(L.tareas, /^#{1,6}\s+(?:\d+\.\s*)?Tests existentes afectados\b/i)) {
          const tests = unicos(ids(r.celdas[0] ?? '', 'T'));
          if (!tests.length) continue;
          modelo.testsAfectados.push({ ...origen, fichero: rel(rutas.tareas), linea: r.linea, test: r.celdas[0], tests, accion: limpia(r.celdas[1] ?? ''), criterios: unicos([...(r.celdas[2] ?? '').matchAll(/(?:H|R)\d+-C\d+/g)].map((m) => m[0])), justificacion: r.celdas[2] ?? null, resultado: r.celdas[3] ?? null });
        }
      }

      // Revisiones de tarea y de cierre
      if (L.revisiones) for (const h of fichas(L.revisiones, /^((?:TA\d+\s+—\s+revisión\b|Cierre de\b).*)$/)) {
        const cierre = /^Cierre de\b/i.test(h.titulo);
        const objetivo = (/\b((?:TA|H|R)\d+)\b/.exec(h.titulo) ?? [])[1] ?? null;
        const num = /revisión\s+(\d+)/i.exec(h.titulo);
        const comm = etiquetaEn(h.cuerpo, 'Commits?(?: revisados?)?');
        const hashes = comm ? unicos([...limpia(comm.valor).replace(/\([^)]*\)/g, ' ').matchAll(/\b[0-9a-f]{7,40}\b/g)].map((m) => m[0])) : [];
        const numero = num ? +num[1] : 1;
        modelo.revisiones.push({
          ...origen, fichero: rel(rutas.revisiones), linea: h.linea, titulo: h.titulo, tipo: cierre ? 'cierre' : 'tarea', objetivo, numero,
          fecha: (/(\d{4}-\d{2}-\d{2})/.exec(h.titulo) ?? [])[1] ?? null,
          tarea: etiquetaEn(h.cuerpo, 'Tarea')?.valor ?? null, commit: hashes[0] ?? null, commits: hashes,
          veredicto: etiquetaEn(h.cuerpo, 'Veredicto')?.valor ?? null, suite: textoDe(h.cuerpo, 'Suite'), comprobado: textoDe(h.cuerpo, 'Comprobado', 'bloque'), decisionesMenores: textoDe(h.cuerpo, 'Decisiones menores del programador', 'bloque'),
        });
        for (const x of leerHallazgos(h.cuerpo)) modelo.hallazgosRevision.push({ ...origen, fichero: rel(rutas.revisiones), linea: x.linea, revision: { objetivo, numero }, numero: x.numero, gravedad: x.gravedad, marcas: x.marcas, donde: x.donde, texto: x.texto, problemaDocumentacion: x.marcas.includes('problema de documentación') });
      }
      sdd.push(entrada);
    }

    modelo.ciclos.push({ id: c, numero: c.slice(0, 2), carpeta: `_docs/ciclos/${c}`, via, estado, sdd });
  }

  // ---- commits del progreso (una sola llamada a git)
  const hayGit = fs.existsSync(path.join(RAIZ, '.git'));
  const git = (...a) => execFileSync('git', ['-C', RAIZ, ...a], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  if (hayGit) {
    try { modelo.git = { disponible: true, superficial: git('rev-parse', '--is-shallow-repository') === 'true' }; } catch { /* sin git utilizable */ }
  }
  if (modelo.git.disponible) {
    const candidatos = unicos(modelo.progreso.filter((p) => p.commit.formato).map((p) => p.commit.valor));
    const existe = new Map();
    if (candidatos.length) {
      try {
        const salida = execFileSync('git', ['-C', RAIZ, 'cat-file', '--batch-check'], { input: candidatos.map((c) => c + '^{commit}').join('\n') + '\n', stdio: ['pipe', 'pipe', 'ignore'] }).toString().split('\n');
        candidatos.forEach((c, i) => existe.set(c, !/ missing$/.test(salida[i] ?? '')));
      } catch { candidatos.forEach((c) => existe.set(c, null)); }
    }
    let sinComprobar = 0;
    for (const p of modelo.progreso) {
      if (!p.commit.formato) continue;
      let e = existe.get(p.commit.valor) ?? null;
      if (e === false && modelo.git.superficial) { e = null; sinComprobar++; }
      p.commit.existe = e;
    }
    if (sinComprobar) problema('AVISO', 'R-LEC-04', null, 0, `El repositorio es un clon superficial: no se puede comprobar si existen ${sinComprobar} commits del progreso. Clona con historial completo (en GitHub Actions, actions/checkout con fetch-depth: 0)`);
  }

  // ---- commits (de git log; en un clon superficial, solo los que haya)
  if (modelo.git.disponible) {
    try {
      const salida = execFileSync('git', ['-C', RAIZ, 'log', '--format=%H%x1f%an%x1f%aI%x1f%s'], { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 256 * 1024 * 1024 }).toString().split('\n').filter(Boolean);
      for (const linea of salida) {
        const [hash, autor, fecha, ...m] = linea.split('\x1f');
        const mensaje = m.join('\x1f');
        const t = /^TA(\d+) \(corrección\):/.exec(mensaje), a = /^TA(\d+):/.exec(mensaje), f = /^docs: fase (\d+)/.exec(mensaje), e = /^docs: enmienda G(\d+)/.exec(mensaje);
        modelo.commits.push({ hash, corto: hash.slice(0, 7), autor, fecha, mensaje, tipo: t ? 'correccion' : a ? 'tarea' : f ? 'fase' : e ? 'enmienda' : 'otro', tarea: t || a ? 'TA' + (t ?? a)[1] : null, fase: f ? +f[1] : null, hueco: e ? 'G' + e[1] : null });
      }
    } catch { /* sin historial utilizable */ }
  }

  // ---- IDs repetidos (la numeración es única en todo el proyecto)
  for (const [lista, tipo] of [[modelo.historias, 'historia'], [modelo.requisitos, 'requisito'], [modelo.tests, 'test'], [modelo.tareas, 'tarea'], [modelo.huecos, 'hueco']]) {
    const vistos = new Map();
    for (const e of lista) {
      if (vistos.has(e.id)) problema('ERROR', 'R-LEC-01', path.join(RAIZ, e.fichero), e.linea, `${e.id} (${tipo}) ya está definido en ${vistos.get(e.id)}; los IDs son únicos en todo el proyecto`);
      else vistos.set(e.id, `${e.fichero}:${e.linea}`);
    }
  }

  // ---- relación tarea → commits (por el mensaje `TA<n>: …` y `TA<n> (corrección): …`)
  const porTarea = new Map();
  for (const c of [...modelo.commits].reverse()) if (c.tarea) (porTarea.get(c.tarea) ?? porTarea.set(c.tarea, []).get(c.tarea)).push({ corto: c.corto, tipo: c.tipo });
  for (const t of modelo.tareas) t.commits = porTarea.get(t.id) ?? [];

  modelo.problemas.sort((a, b) => a.fichero.localeCompare(b.fichero) || a.linea - b.linea);
  return modelo;
}

// ---------- ejecución directa ----------
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--raiz');
  process.stdout.write(JSON.stringify(leerProyecto(i >= 0 ? process.argv[i + 1] : undefined), null, 2) + '\n');
}
