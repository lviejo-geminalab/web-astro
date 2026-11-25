#!/usr/bin/env node
// Validador determinista de _docs/ del flujo SDD + TDD.
// Usa el modelo de `_flujo/lector.mjs` (versión 3). Solo lee. Node sin dependencias. Uso:
//   node _flujo/validar.mjs [--raiz <carpeta>] [--ciclo <NN-nombre> | --todos] [--base <fichero> | --sin-base] [--json]
// Salida: una línea por problema (ERROR o AVISO). Código de salida 1 si hay algún ERROR.
// Sin --ciclo ni --todos valida el ciclo activo de _docs/proyecto.md.
// Si hay una base de datos del estado (--base, la variable FLUJO_BASE o ~/.flujo/estado.db), también comprueba sus reglas y
// que coincide con proyecto.md y estado.md (reglas R-BAS-nn, en `_flujo/validar-base.mjs`). Sin base no es un error: se dice
// que no se ha comprobado. `--sin-base` lo desactiva.

import fs from 'node:fs';
import path from 'node:path';
import { leerProyecto, VERSION } from './lector.mjs';

const VERSION_ESPERADA = 3;

// ---------- argumentos ----------
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const RAIZ = path.resolve(opt('--raiz') ?? process.cwd());
const TODOS = args.includes('--todos');
const JSON_OUT = args.includes('--json');
const CICLO_ARG = opt('--ciclo');

// ---------- vocabulario fijo ----------
const ESTADOS_FASE = ['pendiente', 'hecho', 'borrador', 'aprobado', 'por revisar', 'no aplica'];
const ESTADOS_TAREA = ['pendiente', 'implementada', 'cambios necesarios', 'aprobada', 'bloqueada'];
const ESTADOS_CICLO = ['previsto', 'abierto', 'cerrado', 'descartado'];
const NIVELES_HUECO = ['hueco'];   // un detalle `menor` no se registra en huecos.md
const CAMINOS_HUECO = ['enmienda', 'repetir fases', 'corregir código'];
const VIAS = ['completa', 'corta'];
const MAX_ARCHIVOS_FICHA = 6;      // orientación de las convenciones: más de seis archivos por tarea es señal de tarea demasiado grande
const ESTADOS_HUECO = ['abierto', 'resuelto'];
const TIPOS_CONTADOR = ['H', 'R', 'T', 'TA', 'G'];

// ---------- modelo ----------
const M = leerProyecto(RAIZ);
if (M.version !== VERSION_ESPERADA || VERSION !== VERSION_ESPERADA) {
  console.error(`El lector entrega la versión ${M.version} del modelo y este validador espera la ${VERSION_ESPERADA}. Actualiza _flujo/validar.mjs y _flujo/lector.mjs juntos.`);
  process.exit(2);
}

// ---------- problemas ----------
const problemas = M.problemas.map((p) => ({ ...p })); // los del lector (R-LEC-nn) van primero
const problema = (nivel, codigo, fichero, linea, mensaje) => problemas.push({ nivel, codigo, fichero: fichero ?? '', linea: linea ?? 0, mensaje });
const error = (c, f, l, m) => problema('ERROR', c, f, l, m);
const aviso = (c, f, l, m) => problema('AVISO', c, f, l, m);

// ---------- índices ----------
const idx = (lista) => new Map(lista.map((e) => [e.id, e]).reverse()); // gana la primera definición
const defTA = idx(M.tareas), defT = idx(M.tests), defG = idx(M.huecos), defCriterio = idx(M.criterios);
const idsCiclos = M.ciclos.map((c) => c.id);
const PROYECTO = M.proyecto.fichero;

// ---------- lectura de texto ----------
const leerTexto = (rel) => { try { return fs.readFileSync(path.join(RAIZ, rel), 'utf8'); } catch { return null; } };
// Cuerpo de la sección cuyo encabezado contiene `titulo` (hasta el siguiente encabezado del mismo nivel o superior).
function seccion(texto, titulo) {
  if (!texto) return null;
  const lineas = texto.split('\n');
  const i = lineas.findIndex((l) => /^#{1,6}\s/.test(l) && l.toLowerCase().includes(titulo.toLowerCase()));
  if (i < 0) return null;
  const nivel = /^#+/.exec(lineas[i])[0].length;
  const fin = lineas.findIndex((l, k) => k > i && /^#{1,6}\s/.test(l) && /^#+/.exec(l)[0].length <= nivel);
  return lineas.slice(i + 1, fin < 0 ? undefined : fin).join('\n').trim();
}

// ---------- _docs/proyecto.md ----------
function validarProyecto() {
  if (!M.proyecto.existe) { error('R-PRO-01', PROYECTO, 0, 'No existe _docs/proyecto.md'); return null; }
  // contadores
  const maximo = (tipo) => Math.max(0, ...[...M[{ H: 'historias', R: 'requisitos', T: 'tests', TA: 'tareas', G: 'huecos' }[tipo]]].map((e) => +e.id.slice(tipo.length)));
  const vistos = new Set();
  for (const c of M.proyecto.contadores) {
    vistos.add(c.tipo);
    const max = maximo(c.tipo);
    if (c.siguiente <= max) error('R-CON-01', PROYECTO, c.linea, `El contador de ${c.tipo} es ${c.siguiente} pero ya existe ${c.tipo}${max}: el siguiente libre debe ser ${max + 1} o más`);
  }
  for (const tipo of TIPOS_CONTADOR) if (maximo(tipo) > 0 && !vistos.has(tipo)) aviso('R-CON-02', PROYECTO, 0, `No se encontró el contador de ${tipo} en _docs/proyecto.md`);

  // ciclos
  const filas = M.proyecto.ciclos;
  for (const f of filas) if (f.estado && !ESTADOS_CICLO.includes(f.estado)) error('R-CIC-07', PROYECTO, f.linea, `Estado de ciclo no válido: «${f.estado}»`);
  const abiertos = filas.filter((f) => f.estado === 'abierto');
  if (abiertos.length > 1) error('R-CIC-01', PROYECTO, abiertos[1].linea, `Hay ${abiertos.length} ciclos en estado abierto; solo puede haber uno`);
  for (const f of filas) if (f.carpeta && /^_docs\/ciclos\/\d{2}-/.test(f.carpeta) && !idsCiclos.includes(f.carpeta.replace(/^_docs\/ciclos\//, '').replace(/\/$/, ''))) error('R-CIC-02', PROYECTO, f.linea, `La carpeta ${f.carpeta} no existe`);
  const activo = M.proyecto.cicloActivo?.id ? M.proyecto.cicloActivo : null;
  if (activo) {
    if (!idsCiclos.includes(activo.id)) error('R-CIC-03', PROYECTO, activo.linea, `El ciclo activo ${activo.id} no existe`);
    else if (abiertos.length === 1 && abiertos[0].carpeta && !abiertos[0].carpeta.endsWith(activo.id)) error('R-CIC-04', PROYECTO, activo.linea, `El ciclo activo (${activo.id}) no coincide con el ciclo abierto de la tabla (${abiertos[0].carpeta})`);
    else if (abiertos.length === 0) aviso('R-CIC-05', PROYECTO, activo.linea, `Hay ciclo activo (${activo.id}) pero ninguna fila está en abierto`);
  } else if (abiertos.length === 1) error('R-CIC-04', PROYECTO, abiertos[0].linea, 'Hay un ciclo abierto en la tabla pero «Ciclo activo» no apunta a ninguna carpeta');
  // ciclos cerrados: fase 9 aprobada
  for (const f of filas) if (f.estado === 'cerrado' && f.carpeta) {
    const ciclo = M.ciclos.find((c) => c.carpeta === f.carpeta.replace(/\/$/, ''));
    // la fila de cierre se localiza por su nombre, no por su número: los ciclos anteriores a la numeración de 0 a 9 la llevan como fase 10
    const cierre = ciclo?.estado.fases.find((x) => /^cierre\b/i.test(x.nombre));
    if (cierre && cierre.estado !== 'aprobado') error('R-CIC-06', PROYECTO, f.linea, `El ciclo ${f.carpeta} está cerrado pero su fila de cierre (fase ${cierre.n}) no está aprobada`);
  }
  return activo?.id ?? null;
}

// ---------- un ciclo ----------
function validarCiclo(ciclo) {
  const c = ciclo.id;
  const estadoF = `${ciclo.carpeta}/estado.md`;
  // ---- estado.md
  if (!ciclo.estado.existe) error('R-EST-00', estadoF, 0, 'Falta estado.md');
  else {
    const anterior = [];
    for (const r of ciclo.estado.fases) {
      if (!ESTADOS_FASE.includes(r.estado)) error('R-EST-01', ciclo.estado.fichero, r.linea, `Estado de fase no válido: «${r.estado}»`);
      if (r.estado === 'aprobado') for (const p of anterior) if (['pendiente', 'borrador'].includes(p.estado) && p.n < r.n) error('R-EST-02', ciclo.estado.fichero, r.linea, `La fase ${r.n} está aprobada pero la fase ${p.n} sigue en ${p.estado}`);
      if (['aprobado', 'hecho'].includes(r.estado) && !/^\d{4}-\d{2}-\d{2}$/.test(r.fecha)) aviso('R-EST-03', ciclo.estado.fichero, r.linea, `La fase ${r.n} está ${r.estado} sin fecha`);
      anterior.push(r);
    }
    // vía: una sola línea `Vía:` en estado.md; la corta omite la fase 2
    const fase2 = ciclo.estado.fases.find((x) => x.n === 2);
    if (!ciclo.via) aviso('R-VIA-01', ciclo.estado.fichero, 0, 'estado.md no tiene la línea «Vía:» (completa o corta)');
    else if (!VIAS.includes(ciclo.via)) error('R-VIA-02', ciclo.estado.fichero, 0, `Vía no válida: «${ciclo.via}» (debe ser completa o corta)`);
    else if (fase2 && ciclo.via === 'corta' && fase2.estado !== 'no aplica') error('R-VIA-03', ciclo.estado.fichero, fase2.linea, `La vía es corta pero la fase 2 está ${fase2.estado}: en la vía corta queda «no aplica»`);
    else if (fase2 && ciclo.via === 'completa' && fase2.estado === 'no aplica') error('R-VIA-04', ciclo.estado.fichero, fase2.linea, 'La vía es completa pero la fase 2 figura «no aplica»');
    for (const h of ciclo.estado.historial) for (const g of h.huecos) if (!defG.has(g)) error('R-EST-04', ciclo.estado.fichero, h.linea, `El historial cita ${g}, que no existe`);
  }

  // ---- requisitos sin criterios (sin criterios no se relacionan con ningún test ni tarea)
  const conCriterio = new Set(M.criterios.filter((d) => d.ciclo === c).map((d) => d.padre));
  for (const r of [...M.historias, ...M.requisitos].filter((x) => x.ciclo === c)) {
    if (!conCriterio.has(r.id)) error('R-REQ-01', r.fichero, r.linea, `${r.id} no tiene ningún criterio de aceptación: sin criterios no se relaciona con ningún test ni tarea`);
  }

  // ---- huecos
  const huecos = M.huecos.filter((h) => h.ciclo === c);
  for (const h of huecos) {
    if (!h.nivel || !NIVELES_HUECO.includes(h.nivel.valor)) error('R-HUE-01', h.fichero, h.nivel?.linea ?? h.linea, `${h.id}: nivel no válido o ausente (${h.nivel?.valor ?? 'sin Nivel'})`);
    if (h.camino && !CAMINOS_HUECO.includes(h.camino.valor)) error('R-HUE-06', h.fichero, h.camino.linea, `${h.id}: camino no válido (${h.camino.valor}); debe ser ${CAMINOS_HUECO.join(', ')}`);
    if (h.estado?.valor === 'resuelto' && !h.camino) aviso('R-HUE-07', h.fichero, h.linea, `${h.id} está resuelto pero no anota «Camino»`);
    if (!h.estado || !ESTADOS_HUECO.includes(h.estado.valor)) error('R-HUE-02', h.fichero, h.estado?.linea ?? h.linea, `${h.id}: estado no válido o ausente (${h.estado?.valor ?? 'sin Estado'})`);
    if (h.tarea && !defTA.has(h.tarea)) aviso('R-HUE-03', h.fichero, h.linea, `${h.id} cita ${h.tarea}, que no existe`);
  }

  // ---- por cada SDD
  for (const sdd of ciclo.sdd) {
    const { tareas: tareasF } = sdd.ficheros;
    const progF = ciclo.estado.fichero;   // las tareas están en la tabla «Tareas» de estado.md
    const tareas = M.tareas.filter((t) => t.ciclo === c && t.sdd === sdd.nombre);
    const tests = M.tests.filter((t) => t.ciclo === c && t.sdd === sdd.nombre);
    const progreso = M.progreso.filter((p) => p.ciclo === c && p.sdd === sdd.nombre);

    // fichas de tareas
    if (tareasF) {
      const ordenTA = []; const vistosTA = new Set();
      for (const r of sdd.resumen) { if (vistosTA.has(r.id)) error('R-TAR-01', tareasF, r.linea, `${r.id} aparece dos veces en la tabla del resumen`); vistosTA.add(r.id); ordenTA.push(r.id); }
      const conFicha = new Set(tareas.map((t) => t.id));
      for (const id of ordenTA) if (!conFicha.has(id)) error('R-TAR-02', tareasF, 0, `${id} está en el resumen pero no tiene ficha`);
      for (const t of tareas) if (!vistosTA.has(t.id)) error('R-TAR-03', tareasF, t.linea, `${t.id} tiene ficha pero no está en la tabla del resumen`);
      const pos = new Map(ordenTA.map((id, i) => [id, i]));
      for (const t of tareas) {
        if (!t.dependeDe) error('R-TAR-04', tareasF, t.linea, `${t.id}: falta «Depende de»`);
        else for (const d of t.dependeDe.ids) {
          if (!defTA.has(d)) error('R-TAR-05', tareasF, t.dependeDe.linea, `${t.id} depende de ${d}, que no existe`);
          else if (pos.has(d) && pos.has(t.id) && pos.get(d) >= pos.get(t.id)) error('R-TAR-06', tareasF, t.dependeDe.linea, `${t.id} depende de ${d}, que no es anterior en el orden de ejecución`);
          else if (d === t.id) error('R-TAR-06', tareasF, t.dependeDe.linea, `${t.id} depende de sí misma`);
        }
        if (!t.tests) error('R-TAR-07', tareasF, t.linea, `${t.id}: falta «Tests»`);
        // decisión 44: más de seis archivos por ficha es señal de tarea demasiado grande
        const archivos = (t.archivos ?? '').split(/[,\n]/).map((a) => a.replace(/[`*]/g, '').trim()).filter((a) => /[./]/.test(a));
        if (archivos.length > MAX_ARCHIVOS_FICHA) aviso('R-TAR-08', tareasF, t.linea, `${t.id} lista ${archivos.length} archivos (orientación: ${MAX_ARCHIVOS_FICHA} como máximo); valora dividirla`);
      }
    }

    // decisión 44: rutas y comandos citados que existen, y cambios a lo existente declarados en los tres sitios
    const textoSdd = sdd.ficheros.sdd ? leerTexto(sdd.ficheros.sdd) : null;
    if (textoSdd) {
      const contexto = seccion(textoSdd, 'Contexto técnico') ?? '';
      for (const m of contexto.matchAll(/`([\w.@-]+(?:\/[\w.@-]+)+)`/g)) {
        const ruta = m[1];
        if (!/\.\w+$/.test(ruta) && !ruta.endsWith('/')) continue;
        if (!fs.existsSync(path.join(RAIZ, ruta))) aviso('R-RUT-01', sdd.ficheros.sdd, 0, `El contexto técnico cita \`${ruta}\`, que no existe en el repositorio`);
      }
    }
    const afectados = M.testsAfectados.filter((a) => a.ciclo === c && a.sdd === sdd.nombre);
    if (tareasF && afectados.length > 0) {
      const impacto = textoSdd ? seccion(textoSdd, 'Impacto en lo existente') : null;
      if (textoSdd && (impacto === null || /^no aplica\.?$/i.test(impacto))) aviso('R-EXI-01', sdd.ficheros.sdd, 0, `El plan modifica o retira tests existentes (${afectados.map((a) => a.test).join(', ')}) pero el SDD no declara impacto en lo existente`);
      const aprob = leerTexto(`${ciclo.carpeta}/aprobaciones.md`);
      const entrada5 = aprob ? aprob.split(/^(?=## )/m).filter((e) => /^## Fase 5\b/.test(e)) : [];
      if (!entrada5.some((e) => !/^Nada especial\.?\s*$/m.test(e.split('\n').slice(1).filter((l) => l.trim() && !/^Aprobado:/.test(l)).join('\n')))) aviso('R-EXI-02', `${ciclo.carpeta}/aprobaciones.md`, 0, 'El plan modifica o retira tests existentes y la entrada de la fase 5 de aprobaciones.md no los señala');
    }
    const comandos = (leerTexto(tareasF ?? '') ?? '').match(/`npm (?:run )?[\w:-]+`/g) ?? [];
    if (comandos.length) {
      const scripts = new Set();
      const buscar = (dir, prof) => { if (prof > 3) return; let es; try { es = fs.readdirSync(path.join(RAIZ, dir), { withFileTypes: true }); } catch { return; }
        for (const e of es) { if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
          if (e.isDirectory()) buscar(path.join(dir, e.name), prof + 1);
          else if (e.name === 'package.json') { try { for (const s of Object.keys(JSON.parse(fs.readFileSync(path.join(RAIZ, dir, e.name), 'utf8')).scripts ?? {})) scripts.add(s); } catch { /* json roto: no es asunto del validador */ } } } };
      buscar('.', 0);
      if (scripts.size > 0) for (const cmd of new Set(comandos)) {
        const nombre = cmd.replace(/[`]/g, '').replace(/^npm (?:run )?/, '');
        if (!scripts.has(nombre)) aviso('R-RUT-02', tareasF, 0, `El plan cita ${cmd}, pero ningún package.json define el script «${nombre}»`);
      }
    }

    // tests ↔ tareas
    const asignados = new Map(); // test -> [tareas]
    for (const t of tareas) {
      if (!t.tests || t.tests.ninguno) continue;
      const afectados = t.testsAfectados?.ids ?? [];
      for (const x of t.tests.ids) {
        if (!defT.has(x)) error('R-TES-01', tareasF, t.tests.linea, `${t.id} cita ${x}, que no existe`);
        if ((asignados.get(x) ?? []).length > 0 && afectados.includes(x)) continue; // reescritura autorizada
        asignados.set(x, [...(asignados.get(x) ?? []), t.id]);
      }
    }

    if (tareasF) {
      const matriz = new Map(); // criterio -> [tests]
      for (const r of sdd.matriz) {
        matriz.set(r.criterio, r.tests);
        if (!defCriterio.has(r.criterio)) error('R-COB-01', tareasF, r.linea, `La matriz cita el criterio ${r.criterio}, que no existe`);
        for (const x of r.tests) if (!defT.has(x)) error('R-COB-02', tareasF, r.linea, `La matriz cita ${x}, que no existe`);
        if (r.vacia) error('R-COB-03', tareasF, r.linea, `El criterio ${r.criterio} no tiene ningún test ni justificación en la matriz`);
      }
      for (const d of tests) {
        const as = asignados.get(d.id) ?? [];
        if (tareasF && as.length === 0) error('R-TES-02', tareasF, d.linea, `${d.id} no está asignado a ninguna tarea`);
        if (as.length > 1) error('R-TES-03', tareasF, d.linea, `${d.id} está asignado a varias tareas: ${as.join(', ')}`);
        const crits = d.cubre?.criterios ?? [];
        const enMatriz = [...matriz].filter(([, ts]) => ts.includes(d.id)).map(([k]) => k);
        if (matriz.size > 0) {
          for (const k of crits) if (!enMatriz.includes(k)) error('R-COB-04', tareasF, d.cubre.linea, `${d.id} declara que cubre ${k} pero la matriz no lo recoge`);
          for (const k of enMatriz) if (d.cubre && !crits.includes(k)) aviso('R-COB-05', tareasF, d.cubre.linea, `La matriz asigna ${d.id} a ${k} pero el test no lo declara en «Cubre»`);
          if (enMatriz.length === 0 && crits.length === 0) aviso('R-COB-06', tareasF, d.linea, `${d.id} no cubre ningún criterio`);
        }
      }
      // criterios del ciclo sin cobertura (solo si el ciclo tiene un único SDD)
      if (ciclo.sdd.length === 1) for (const d of M.criterios) if (d.ciclo === c && !matriz.has(d.id)) error('R-COB-07', d.fichero, d.linea, `El criterio ${d.id} no aparece en la matriz de cobertura de ${tareasF}`);
    }

    // progreso (tabla «Tareas» de estado.md; sin filas no hay nada que comprobar)
    if (progF && progreso.length > 0) {
      const vistos = new Set();
      for (const p of progreso) {
        if (vistos.has(p.tarea)) error('R-PRG-01', progF, p.linea, `${p.tarea} aparece dos veces en el progreso`); vistos.add(p.tarea);
        if (!ESTADOS_TAREA.includes(p.estado)) { error('R-PRG-02', progF, p.linea, `${p.tarea}: estado de tarea no válido «${p.estado}»`); continue; }
        if (tareasF && !defTA.has(p.tarea)) error('R-PRG-03', progF, p.linea, `${p.tarea} está en el progreso pero no tiene ficha`);
        // `implementada` no lleva commit: lo anota el revisor al revisarla. Si lo lleva, tiene que ser válido.
        if (p.estado === 'aprobada' || (p.estado === 'implementada' && p.commit.valor !== '')) {
          if (!p.commit.formato) error('R-PRG-04', progF, p.linea, `${p.tarea} está ${p.estado} pero no tiene un commit válido («${p.commit.valor}»)`);
          else if (p.commit.existe === false) error('R-PRG-05', progF, p.linea, `${p.tarea}: el commit ${p.commit.valor} no existe en el repositorio`);
        }
        if (p.estado === 'bloqueada') {
          if (p.huecos.length === 0) error('R-PRG-06', progF, p.linea, `${p.tarea} está bloqueada pero sus notas no citan ningún hueco`);
          for (const g of p.huecos) {
            const h = defG.get(g);
            if (!h) error('R-PRG-07', progF, p.linea, `${p.tarea} está bloqueada por ${g}, que no existe en huecos.md`);
            else if (h.estado?.valor !== 'abierto') error('R-PRG-08', progF, p.linea, `${p.tarea} está bloqueada por ${g}, que está ${h.estado?.valor}`);
          }
        }
      }
      for (const t of tareas) if (!vistos.has(t.id)) error('R-PRG-09', progF, 0, `${t.id} está en el plan pero no tiene fila en el progreso`);
      // hueco abierto ⇒ tarea bloqueada
      for (const h of huecos) if (h.estado?.valor === 'abierto' && h.tarea && defTA.get(h.tarea)?.fichero === tareasF) {
        const fila = progreso.find((p) => p.tarea === h.tarea);
        if (!fila) continue;
        if (fila.estado !== 'bloqueada' || !fila.huecos.includes(h.id)) error('R-HUE-04', h.fichero, h.linea, `${h.id} está abierto pero ${h.tarea} no figura como bloqueada por él (está ${fila.estado})`);
      }
    }
  }

  // tareas de un SDD que no existe
  for (const p of M.progreso) if (p.ciclo === c && !ciclo.sdd.some((s) => s.nombre === p.sdd)) error('R-PRG-10', p.fichero, p.linea, `${p.tarea} pertenece al SDD «${p.sdd}», que no tiene plan de tareas en este ciclo`);

  // hueco resuelto con camino «repetir fases» ⇒ fases repetidas en el historial
  if (ciclo.estado.existe) for (const h of huecos) if (h.estado?.valor === 'resuelto' && h.camino?.valor === 'repetir fases' && !ciclo.estado.huecosMencionados.includes(h.id)) {
    aviso('R-HUE-05', h.fichero, h.linea, `${h.id} se resolvió repitiendo fases y está resuelto, pero el historial de estado.md no lo cita`);
  }
}

// ---------- secciones citadas de las convenciones ----------
// Todo texto entre comillas que precede, en una línea, a «convenciones» (`_flujo/convenciones.md` o «las convenciones»)
// es el nombre de una sección: tiene que existir como encabezado o como párrafo en negrita de `_flujo/convenciones.md`.
function validarSeccionesCitadas() {
  const conv = leerTexto('_flujo/convenciones.md');
  if (!conv) return;
  const existentes = new Set();
  for (const l of conv.split('\n')) {
    const h = /^#{1,6}\s+(.+?)\s*$/.exec(l);
    if (h) existentes.add(h[1].toLowerCase());
    for (const b of l.matchAll(/\*\*([^*]+?)\*\*/g)) existentes.add(b[1].replace(/[.:]+$/, '').trim().toLowerCase());
  }
  const ficheros = [];
  const recorre = (dir) => { let es; try { es = fs.readdirSync(path.join(RAIZ, dir), { withFileTypes: true }); } catch { return; }
    for (const e of es) { const r = path.join(dir, e.name);
      if (e.isDirectory()) recorre(r);
      else if (e.name.endsWith('.md') && !['DISENO.md', 'convenciones.md'].includes(e.name)) ficheros.push(r); } };
  for (const d of ['_flujo', '.claude', '.github']) recorre(d);
  for (const f of ficheros.sort()) {
    const lineas = (leerTexto(f) ?? '').split('\n');
    lineas.forEach((l, i) => {
      // «Sección» [, «otra»…] de `_flujo/convenciones.md` | en las convenciones
      for (const m of l.matchAll(/((?:[«"][^«»"\n]{4,70}[»"](?:\s*(?:,|y|e|o)\s*)?)+)\s+(?:de|en)\s+(?:las convenciones|`_flujo\/convenciones\.md`)/g)) {
        for (const q of m[1].matchAll(/[«"]([^«»"\n]{4,70})[»"]/g)) {
          const n = q[1].trim().toLowerCase();
          if (![...existentes].some((e) => e === n || e.startsWith(n + ',') || e.startsWith(n + ' '))) error('R-REF-01', f, i + 1, `Cita la sección «${q[1]}» de las convenciones, que no existe`);
        }
      }
    });
  }
}

// ---------- ejecución ----------
const cicloActivo = validarProyecto();
validarSeccionesCitadas();
const aValidar = TODOS ? idsCiclos : [CICLO_ARG ?? cicloActivo].filter(Boolean);
for (const id of aValidar) {
  const ciclo = M.ciclos.find((x) => x.id === id);
  if (!ciclo) { error('R-CIC-03', PROYECTO, 0, `El ciclo ${id} no existe`); continue; }
  validarCiclo(ciclo);
}

// ---------- la base de datos del estado ----------
let notaBase = '--sin-base: no se ha comprobado el estado frente a la base';
if (!args.includes('--sin-base')) {
  const { validarBase } = await import('./validar-base.mjs');
  const r = await validarBase({ M, ruta: opt('--base'), explicita: args.includes('--base') });
  problemas.push(...r.problemas);
  notaBase = r.nota;
}

problemas.sort((a, b) => a.fichero.localeCompare(b.fichero) || a.linea - b.linea);
const nE = problemas.filter((p) => p.nivel === 'ERROR').length, nA = problemas.length - nE;
if (JSON_OUT) console.log(JSON.stringify({ ciclos: aValidar, errores: nE, avisos: nA, base: notaBase, problemas }, null, 2));
else {
  for (const p of problemas) console.log([`${p.nivel} ${p.codigo}`, p.fichero ? `${p.fichero}${p.linea ? ':' + p.linea : ''}` : null, p.mensaje].filter(Boolean).join(' '));
  console.log(`\nCiclos validados: ${aValidar.join(', ') || 'ninguno'}. ${nE} errores, ${nA} avisos.\nBase: ${notaBase}.`);
}
process.exit(nE > 0 ? 1 : 0);
