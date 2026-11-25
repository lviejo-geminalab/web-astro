// Pruebas del lector y del validador de _docs/. Node sin dependencias:
//   node --test _flujo/pruebas/
// Genera un proyecto mínimo y limpio en una carpeta temporal (con un repositorio git de verdad),
// comprueba que no da ningún problema y siembra un error cada vez para ver que el validador lo caza.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { leerProyecto, VERSION } from '../lector.mjs';

// Estas pruebas no dependen de la base de datos de quien las ejecute: sin base en HOME ni en FLUJO_BASE, el validador no la mira.
process.env.HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'sin-base-'));
delete process.env.FLUJO_BASE;
const VALIDAR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'validar.mjs');
const C = '_docs/ciclos/01-prueba/';

// ---------- proyecto mínimo ----------
const FICHEROS = {
  '_docs/proyecto.md': `# Proyecto

Nombre: Prueba
Inicio: 2026-01-01
Ciclo activo: _docs/ciclos/01-prueba

## Ciclos y hoja de ruta

| Nº | Carpeta | Objetivo | Estado | Origen | Abierto | Cerrado |
|---|---|---|---|---|---|---|
| 01 | _docs/ciclos/01-prueba | Primera versión | abierto | kickoff | 2026-01-01 | |

## Siguiente identificador libre

| Tipo | Siguiente |
|---|---|
| H (historia) | 2 |
| R (requisito) | 1 |
| T (test) | 3 |
| TA (tarea) | 3 |
| G (hueco) | 2 |
`,
  [C + 'estado.md']: `# Estado del ciclo

Ciclo: 01-prueba
Vía: completa

| Fase | Documento | Estado | Fecha | Notas |
|---|---|---|---|---|
| 0 Apertura | idea del ciclo | hecho | 2026-01-01 | |
| 1 Brief | \`brief.md\` | aprobado | 2026-01-01 | |
| 2 Historias | \`historias.md\` | aprobado | 2026-01-01 | |
| 3 Arquitectura | \`_docs/arquitectura.md\` | no aplica | 2026-01-01 | |
| 4 SDD | \`sdd-web.md\` | aprobado | 2026-01-01 | |
| 5 Tareas | \`tareas-web.md\` | aprobado | 2026-01-01 | |
| 6 Verificación | \`verificacion.md\` | aprobado | 2026-01-01 | |
| 9 Cierre | \`_docs/sistema.md\` | pendiente | | |

## Tareas

| SDD | Tarea | Estado | Commit | Notas |
|---|---|---|---|---|
| web | TA1 | aprobada | @COMMIT@ | |
| web | TA2 | pendiente | | |

## Historial de cambios hacia atrás

| Fecha | Fase repetida | Motivo | Fases afectadas |
|---|---|---|---|
| 2026-01-02 | 4 SDD | G1 | 5 |
`,
  [C + 'historias.md']: `# Historias

## Resumen

| ID | Título | Versión | Prioridad | Depende de |
|---|---|---|---|---|
| H1 | Ver el tablero | primera versión | 1 | R9 |

## H1 — Ver el tablero

Como persona responsable, quiero ver el tablero, para decidir qué toca.

- H1-C1: Dado un proyecto con tareas,
  cuando abro el tablero,
  entonces veo las tareas.
- H1-C2: el tablero muestra los huecos.
`,
  [C + 'sdd-web.md']: '# SDD web\n\n## 3. Contexto técnico\n\nNada existente.\n\n## 9. Impacto en lo existente\n\nModifica T1: otro localizador.\n',
  [C + 'aprobaciones.md']: '# Aprobaciones del ciclo 01-prueba\n\n## Fase 5 Plan de tareas con tests (web) — 2026-01-01\n- Tests existentes: T1 se modifica (H1-C1).\nAprobado: 2026-01-01\n',
  [C + 'tareas-web.md']: `# Tareas

## 1. Entorno de pruebas

Vitest en \`web/\`; la suite completa se lanza con \`npm test\`.

## 2. Resumen

| ID | Título | Criterios | Tests | Depende de |
|---|---|---|---|---|
| TA1 | Primera | H1-C1 | T1 | — |
| TA2 | Segunda — **cierre de H1** | H1-C2 | T2 | TA1 |

## 3. Tareas

### TA1: primera
Procede de: H1 — H1-C1
Tests: T1
Artefacto: web
Archivos: \`src/a.ts\`
Depende de: ninguna
Pasa sin código nuevo: T1
Fuera de esta tarea: el estilo; ni el resto
  de la pantalla.
Terminada cuando: T1 pasa.

#### T1: primero
Cubre: H1-C1
Nivel: unitario — \`src/a.spec.ts\`
Artefacto: web
Preparación: un proyecto con una tarea.
Acción: abrir el tablero.
Esperado: aparece la tarea.

### TA2: segunda
Tests: T2
Cierre de: H1
Depende de: TA1

#### T2: segundo
Cubre: H1-C2
Nivel: unitario

## 4. Matriz de cobertura

| Criterio | Tests |
|---|---|
| H1-C1 | T1 |
| H1-C2 | T2 |

## 5. Tests existentes afectados

| Test | Acción | Criterio que lo justifica | Nuevo resultado esperado |
|---|---|---|---|
| T1 (\`src/a.spec.ts\`) | \`modificar\` | H1-C1 | Mismo resultado con otro localizador |
`,
  [C + 'huecos.md']: `# Huecos

## G1 — TA1 — abierto por el revisor — 2026-01-01
Nivel: hueco
Camino: repetir fases
Estado: resuelto

Qué falta: el criterio no dice cuántas tareas se ven.

Opciones:
a) Fijar diez tareas.
b) No fijar nada.

Recomendación: a), porque se puede comprobar.

Decisión (2026-01-02): la persona responsable elige a).

Enmienda G1:
- \`sdd-web.md\`: se fija el número.
`,
  [C + 'revisiones-web.md']: `# Revisiones

## TA1 — revisión 1 — 2026-01-01
Tarea: Primera (plan: _docs/ciclos/01-prueba/tareas-web.md)
Commit: @COMMIT@
Veredicto: aprobada
Suite: 2 tests, 2 en verde

Decisiones menores del programador:
- TA1: se usa una lista. Porqué: es lo más simple.

Hallazgos:
1. [menor, problema de documentación] src/a.ts:3 — nombre poco claro.

Comprobado: alcance y tests.

## Cierre de H1 — 2026-01-02 (revisión 2, tras la enmienda G1)
Tarea: Cierre de la historia H1 (TA1 a TA2)
Commit: @COMMIT@ (diff acumulado)
Veredicto: aprobada
Suite: en verde

Hallazgos: ninguno.

Comprobado: todo.
`,
  [C + 'revision-arquitectura.md']: `# Revisión de la arquitectura

## Revisión 1 — 2026-01-01
Veredicto: sin objeciones

Hallazgos:
1. [menor] Sección 2 — falta decir dónde vive la función.

Resolución:
1. riesgo asumido
`,
  [C + 'verificacion.md']: `# Verificación
Fase: 6 Verificación (primera ejecución, tras aprobar los documentos)

## 1. Veredicto

**\`listo para implementar\`**

## 2. Hallazgos

### V1: ejemplo (aceptado)
- **Gravedad:** \`menor\`
- **Dónde:** \`sdd-web.md\` 1.
- **Qué ocurre:** nada grave.
- **Fase que hay que repetir:** ninguna.
- **Decisión:** aceptado

## 3. Historial de ejecuciones

| Nº | Fecha | Veredicto | Hallazgos nuevos | Motivo |
|---|---|---|---|---|
| 1 | 2026-01-01 | listo para implementar | V1 | primera ejecución |
| 2 | 2026-01-02 | listo para implementar | — | tras resolver G1 |
`,
};

const git = (dir, ...a) => execFileSync('git', ['-c', 'user.name=prueba', '-c', 'user.email=prueba@example.com', '-C', dir, ...a], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();

// Crea el proyecto limpio. Dos commits: el progreso cita el primero (así un clon superficial no lo tiene).
function proyectoLimpio() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flujo-prueba-'));
  git(dir, 'init', '-q');
  fs.writeFileSync(path.join(dir, 'LEEME'), 'x\n');
  git(dir, 'add', '.'); git(dir, 'commit', '-q', '-m', 'primero');
  const commit = git(dir, 'rev-parse', '--short', 'HEAD');
  for (const [f, texto] of Object.entries(FICHEROS)) {
    fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    fs.writeFileSync(path.join(dir, f), texto.replaceAll('@COMMIT@', commit));
  }
  git(dir, 'add', '.'); git(dir, 'commit', '-q', '-m', 'segundo');
  return { dir, commit };
}
const BASE = proyectoLimpio();
test.after(() => fs.rmSync(BASE.dir, { recursive: true, force: true }));

function copia() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flujo-caso-'));
  fs.cpSync(BASE.dir, dir, { recursive: true });
  return dir;
}
function validar(dir, ...extra) {
  const r = spawnSync('node', [VALIDAR, '--raiz', dir, '--todos', ...extra], { encoding: 'utf8' });
  return { salida: r.stdout, codigo: r.status, lineas: r.stdout.split('\n').filter((l) => /^(ERROR|AVISO) /.test(l)) };
}
const leerF = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8');
const escribirF = (dir, f, t) => fs.writeFileSync(path.join(dir, f), t);
// Sustituye `a` por `b` (una vez). Si `a` no está, la prueba falla: un error sembrado que no se siembra no prueba nada.
const sub = (f, a, b) => (dir) => { const t = leerF(dir, f); assert.ok(t.includes(a), `no se encuentra «${a}» en ${f}`); escribirF(dir, f, t.replace(a, b)); };
const anadir = (f, texto) => (dir) => escribirF(dir, f, leerF(dir, f) + texto);
const quitar = (f) => (dir) => fs.rmSync(path.join(dir, f));

// ---------- el proyecto limpio no da ningún problema ----------
test('el proyecto mínimo es válido: ningún error ni aviso', () => {
  const r = validar(BASE.dir);
  assert.deepEqual(r.lineas, []);
  assert.equal(r.codigo, 0);
  assert.match(r.salida, /0 errores, 0 avisos/);
});

test('sin ciclo activo ni opciones valida solo el ciclo activo; sin ciclo activo no valida ninguno', () => {
  const dir = copia();
  const r = spawnSync('node', [VALIDAR, '--raiz', dir], { encoding: 'utf8' });
  assert.match(r.stdout, /Ciclos validados: 01-prueba\./);
  sub('_docs/proyecto.md', 'Ciclo activo: _docs/ciclos/01-prueba', 'Ciclo activo: ninguno')(dir);
  sub('_docs/proyecto.md', '| abierto |', '| cerrado |')(dir);
  const r2 = spawnSync('node', [VALIDAR, '--raiz', dir], { encoding: 'utf8' });
  assert.match(r2.stdout, /Ciclos validados: ninguno\./);
});

// ---------- el lector ----------
test('lector: modelo versionado, sin rutas absolutas y reproducible', () => {
  const a = leerProyecto(BASE.dir), b = leerProyecto(BASE.dir);
  assert.equal(a.version, 3);
  assert.equal(VERSION, 3);
  assert.deepEqual(a, b);
  assert.deepEqual(a.problemas, []);
  assert.ok(!JSON.stringify(a).includes(BASE.dir), 'el modelo no debe contener la ruta absoluta de la raíz');
  assert.deepEqual(a.tareas.map((t) => t.id), ['TA1', 'TA2']);
  assert.deepEqual(a.tests.map((t) => t.id), ['T1', 'T2']);
  assert.deepEqual(a.criterios.map((c) => c.id), ['H1-C1', 'H1-C2']);
  assert.equal(a.huecos[0].tarea, 'TA1');
  assert.equal(a.progreso[0].commit.existe, true);
  assert.equal(a.proyecto.cicloActivo.id, '01-prueba');
  assert.deepEqual(a.proyecto.contadores.map((c) => c.tipo + c.siguiente), ['H2', 'R1', 'T3', 'TA3', 'G2']);
  assert.deepEqual(a.ciclos[0].sdd[0].matriz.map((m) => [m.criterio, m.tests]), [['H1-C1', ['T1']], ['H1-C2', ['T2']]]);
});

test('lector: recoge las entidades del inventario de datos del flujo', () => {
  const m = leerProyecto(BASE.dir);
  const por = (lista, id) => lista.find((x) => x.id === id);
  // proyecto y ciclo
  assert.deepEqual([m.proyecto.nombre, m.proyecto.inicio, 'idioma' in m.proyecto], ['Prueba', '2026-01-01', false]);
  assert.deepEqual(m.proyecto.ciclos[0], { linea: m.proyecto.ciclos[0].linea, posicion: 1, numero: '01', carpeta: '_docs/ciclos/01-prueba', objetivo: 'Primera versión', estado: 'abierto', origen: 'kickoff', abierto: '2026-01-01', cerrado: null });
  assert.equal(m.ciclos[0].via, 'completa');
  assert.equal(m.ciclos[0].numero, '01');
  // fases y cambios hacia atrás
  const f4 = m.ciclos[0].estado.fases.find((f) => f.n === 4);
  assert.deepEqual([f4.nombre, f4.documento, f4.estado, f4.sdd], ['SDD', 'sdd-web.md', 'aprobado', 'web']);
  assert.deepEqual(m.ciclos[0].estado.historial[0].huecos, ['G1']);
  // historia, criterio y requisitos
  const h1 = por(m.historias, 'H1');
  assert.deepEqual([h1.enunciado, h1.version, h1.prioridad, h1.dependeDe], ['Como persona responsable, quiero ver el tablero, para decidir qué toca.', 'primera versión', 1, ['R9']]);
  const c1 = por(m.criterios, 'H1-C1');
  assert.deepEqual([c1.padre, c1.texto], ['H1', 'Dado un proyecto con tareas, cuando abro el tablero, entonces veo las tareas.']);
  // tests y tests existentes afectados
  const t1 = por(m.tests, 'T1');
  assert.deepEqual([t1.nivel.tipo, t1.nivel.archivo, t1.preparacion, t1.accion, t1.esperado], ['unitario', 'src/a.spec.ts', 'un proyecto con una tarea.', 'abrir el tablero.', 'aparece la tarea.']);
  assert.equal(m.testsAfectados.length, 1);
  assert.deepEqual([m.testsAfectados[0].tests, m.testsAfectados[0].accion, m.testsAfectados[0].criterios], [['T1'], 'modificar', ['H1-C1']]);
  // tarea (ficha completa) y cierre
  const ta1 = por(m.tareas, 'TA1');
  assert.deepEqual(ta1.procedeDe.historias, ['H1']);
  assert.deepEqual(ta1.procedeDe.criterios, ['H1-C1']);
  assert.deepEqual([ta1.artefacto, ta1.archivos, ta1.terminadaCuando, ta1.pasaSinCodigoNuevo.ids], ['web', '`src/a.ts`', 'T1 pasa.', ['T1']]);
  assert.equal(ta1.fueraDeEstaTarea, 'el estilo; ni el resto\nde la pantalla.');
  assert.deepEqual([ta1.cierre, por(m.tareas, 'TA2').cierre], [null, 'cierre de H1']);
  // revisiones y sus hallazgos
  assert.deepEqual(m.revisiones.map((r) => [r.tipo, r.objetivo, r.numero, r.fecha, r.veredicto, r.commit]), [['tarea', 'TA1', 1, '2026-01-01', 'aprobada', BASE.commit], ['cierre', 'H1', 2, '2026-01-02', 'aprobada', BASE.commit]]);
  assert.equal(m.revisiones[0].suite, '2 tests, 2 en verde');
  assert.equal(m.hallazgosRevision.length, 1);
  assert.deepEqual([m.hallazgosRevision[0].gravedad, m.hallazgosRevision[0].marcas, m.hallazgosRevision[0].donde, m.hallazgosRevision[0].problemaDocumentacion], ['menor', ['problema de documentación'], 'src/a.ts:3', true]);
  // hueco completo y decisiones
  const g1 = por(m.huecos, 'G1');
  assert.deepEqual([g1.abiertoPor, g1.fecha, g1.queFalta], ['el revisor', '2026-01-01', 'el criterio no dice cuántas tareas se ven.']);
  assert.equal(g1.opciones, 'a) Fijar diez tareas.\nb) No fijar nada.');
  assert.deepEqual([g1.decision.fecha, g1.recomendacion.startsWith('a)')], ['2026-01-02', true]);
  assert.match(g1.enmienda, /sdd-web\.md/);
  assert.match(m.revisiones[0].decisionesMenores, /TA1: se usa una lista/);
  assert.equal(m.revisiones[1].decisionesMenores, null);
  assert.ok(!('decisiones' in m), 'la versión 2 del modelo no tiene decisiones');
  // verificación, hallazgos de verificación y de arquitectura
  assert.deepEqual(m.verificaciones.map((v) => [v.numero, v.fecha, v.veredicto, v.hallazgosNuevos, v.motivo]), [[1, '2026-01-01', 'listo para implementar', ['V1'], 'primera ejecución'], [2, '2026-01-02', 'listo para implementar', [], 'tras resolver G1']]);
  const v1 = m.hallazgos.find((x) => x.id === 'V1' && x.origen === 'ficha');
  assert.deepEqual([v1.estadoTitulo, v1.gravedad, v1.donde, v1.faseARepetir], ['aceptado', 'menor', '`sdd-web.md` 1.', 'ninguna.']);
  assert.equal(v1.decision, 'aceptado');
  assert.deepEqual([m.revisionesArquitectura[0].numero, m.revisionesArquitectura[0].veredicto, m.hallazgosArquitectura[0].gravedad], [1, 'sin objeciones', 'menor']);
  assert.equal(m.hallazgosArquitectura[0].resolucion, 'riesgo asumido');
  // formatos de D81: Artefacto en tests y Cierre de en tareas
  assert.equal(por(m.tests, 'T1').artefacto, 'web');
  assert.deepEqual([por(m.tareas, 'TA2').cierreDe.ids, por(m.tareas, 'TA2').cierreDe.valor], [['H1'], 'H1']);
  // commits de git
  assert.deepEqual(m.commits.map((c) => c.mensaje), ['segundo', 'primero']);
  assert.equal(m.commits[1].corto, BASE.commit);
});

test('lector: el proyecto sin _docs/ se lee sin fallar', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flujo-vacio-'));
  const m = leerProyecto(dir);
  assert.equal(m.proyecto.existe, false);
  assert.deepEqual(m.ciclos, []);
  fs.rmSync(dir, { recursive: true });
});

test('lector: datos incoherentes se cargan tal cual y se registra el problema', () => {
  const dir = copia();
  anadir(C + 'tareas-web.md', '\n### T2: repetido\nCubre: H1-C2\n')(dir);
  sub(C + 'estado.md', '| web | TA2 | pendiente |', '| web | TA2 | hecha |')(dir);
  const m = leerProyecto(dir);
  assert.equal(m.tests.filter((t) => t.id === 'T2').length, 2, 'las dos definiciones se conservan');
  assert.equal(m.progreso[1].estado, 'hecha', 'el estado inventado se conserva sin corregir');
  assert.deepEqual(m.problemas.map((p) => p.codigo), ['R-LEC-01']);
  assert.match(m.problemas[0].mensaje, /T2 \(test\) ya está definido en _docs\/ciclos\/01-prueba\/tareas-web\.md:\d+/);
});

test('lector: una etiqueta ausente es null, no un valor por defecto', () => {
  const dir = copia();
  sub(C + 'tareas-web.md', 'Depende de: TA1\n', '')(dir);
  const m = leerProyecto(dir);
  assert.equal(m.tareas.find((t) => t.id === 'TA2').dependeDe, null);
});

// ---------- errores sembrados ----------
// [nombre, mutación, problemas esperados]
const CASOS = [
  ['contador G sin subir', sub('_docs/proyecto.md', '| G (hueco) | 2 |', '| G (hueco) | 1 |'), ['ERROR R-CON-01']],
  ['contador G ausente', sub('_docs/proyecto.md', '| G (hueco) | 2 |\n', ''), ['AVISO R-CON-02']],
  ['dos ciclos abiertos', sub('_docs/proyecto.md', '| 01 | _docs/ciclos/01-prueba | Primera versión | abierto | kickoff | 2026-01-01 | |\n', '| 01 | _docs/ciclos/01-prueba | Primera versión | abierto | kickoff | 2026-01-01 | |\n| 02 | | Otro | abierto | kickoff | | |\n'), ['ERROR R-CIC-01']],
  ['fila de ciclo con carpeta inexistente', sub('_docs/proyecto.md', '| 01 | _docs/ciclos/01-prueba | Primera versión | abierto | kickoff | 2026-01-01 | |\n', '| 01 | _docs/ciclos/01-prueba | Primera versión | abierto | kickoff | 2026-01-01 | |\n| 02 | _docs/ciclos/02-fantasma | Otro | previsto | kickoff | | |\n'), ['ERROR R-CIC-02']],
  ['ciclo activo inexistente', sub('_docs/proyecto.md', 'Ciclo activo: _docs/ciclos/01-prueba', 'Ciclo activo: _docs/ciclos/05-nada'), ['ERROR R-CIC-03']],
  ['ciclo abierto sin ciclo activo', sub('_docs/proyecto.md', 'Ciclo activo: _docs/ciclos/01-prueba', 'Ciclo activo: ninguno'), ['ERROR R-CIC-04']],
  ['ciclo cerrado con la fase 9 sin aprobar', sub('_docs/proyecto.md', '| abierto |', '| cerrado |'), ['AVISO R-CIC-05', 'ERROR R-CIC-06']],
  ['estado de ciclo inventado', sub('_docs/proyecto.md', '| abierto |', '| abierta |'), ['ERROR R-CIC-07']],
  ['falta _docs/proyecto.md', quitar('_docs/proyecto.md'), ['ERROR R-PRO-01']],
  ['falta estado.md', quitar(C + 'estado.md'), ['ERROR R-EST-00']],
  ['estado de fase inventado', sub(C + 'estado.md', '| 1 Brief | `brief.md` | aprobado |', '| 1 Brief | `brief.md` | aprobada |'), ['ERROR R-EST-01']],
  ['fase aprobada tras una en borrador', sub(C + 'estado.md', '| 4 SDD | `sdd-web.md` | aprobado |', '| 4 SDD | `sdd-web.md` | borrador |'), ['ERROR R-EST-02']],
  ['fase aprobada sin fecha', sub(C + 'estado.md', '| 1 Brief | `brief.md` | aprobado | 2026-01-01 |', '| 1 Brief | `brief.md` | aprobado | |'), ['AVISO R-EST-03']],
  ['el historial cita un hueco inexistente', sub(C + 'estado.md', '| 4 SDD | G1 |', '| 4 SDD | G9 |'), ['ERROR R-EST-04']],
  ['nivel de hueco inventado', sub(C + 'huecos.md', 'Nivel: hueco', 'Nivel: grave'), ['ERROR R-HUE-01']],
  ['estado de hueco inventado', sub(C + 'huecos.md', 'Estado: resuelto', 'Estado: cerrado'), ['ERROR R-HUE-02']],
  ['hueco que cita una tarea inexistente', sub(C + 'huecos.md', 'G1 — TA1 —', 'G1 — TA77 —'), ['AVISO R-HUE-03']],
  ['hueco abierto con su tarea aprobada', sub(C + 'huecos.md', 'Estado: resuelto', 'Estado: abierto'), ['ERROR R-HUE-04']],
  ['hueco resuelto repitiendo fases que el historial no cita', sub(C + 'estado.md', '| 4 SDD | G1 |', '| 4 SDD | V1 |'), ['AVISO R-HUE-05']],
  ['tarea repetida en el resumen', sub(C + 'tareas-web.md', '| TA2 | Segunda — **cierre de H1** | H1-C2 | T2 | TA1 |\n', '| TA2 | Segunda — **cierre de H1** | H1-C2 | T2 | TA1 |\n| TA2 | Segunda — **cierre de H1** | H1-C2 | T2 | TA1 |\n'), ['ERROR R-TAR-01']],
  ['tarea en el resumen sin ficha', sub(C + 'tareas-web.md', '| TA2 | Segunda — **cierre de H1** | H1-C2 | T2 | TA1 |\n', '| TA2 | Segunda — **cierre de H1** | H1-C2 | T2 | TA1 |\n| TA9 | Fantasma | H1-C2 | T2 | TA1 |\n'), ['ERROR R-TAR-02']],
  ['ficha de tarea fuera del resumen', sub(C + 'tareas-web.md', '| TA2 | Segunda — **cierre de H1** | H1-C2 | T2 | TA1 |\n', ''), ['ERROR R-TAR-03']],
  ['tarea sin «Depende de»', sub(C + 'tareas-web.md', 'Depende de: TA1\n', ''), ['ERROR R-TAR-04']],
  ['depende de una tarea inexistente', sub(C + 'tareas-web.md', 'Depende de: TA1\n', 'Depende de: TA999\n'), ['ERROR R-TAR-05']],
  ['depende de una tarea posterior', sub(C + 'tareas-web.md', 'Depende de: ninguna', 'Depende de: TA2'), ['ERROR R-TAR-06']],
  ['tarea sin «Tests»', sub(C + 'tareas-web.md', 'Tests: T1\n', ''), ['ERROR R-TAR-07']],
  ['tarea que cita un test inexistente', sub(C + 'tareas-web.md', 'Tests: T2\n', 'Tests: T2, T99\n'), ['ERROR R-TES-01']],
  ['test sin tarea', sub(C + 'tareas-web.md', 'Tests: T2\n', 'Tests: ninguno\n'), ['ERROR R-TES-02']],
  ['test en dos tareas', sub(C + 'tareas-web.md', 'Tests: T2\n', 'Tests: T2, T1\n'), ['ERROR R-TES-03']],
  ['test en dos tareas, con reescritura autorizada', (d) => { sub(C + 'tareas-web.md', 'Tests: T2\n', 'Tests: T2, T1\nTests existentes afectados: T1\n')(d); }, []],
  ['la matriz cita un criterio inexistente', sub(C + 'tareas-web.md', '| H1-C2 | T2 |\n', '| H1-C9 | T2 |\n'), ['ERROR R-COB-01']],
  ['la matriz cita un test inexistente', sub(C + 'tareas-web.md', '| H1-C2 | T2 |\n', '| H1-C2 | T2, T50 |\n'), ['ERROR R-COB-02']],
  ['criterio sin test en la matriz', sub(C + 'tareas-web.md', '| H1-C2 | T2 |\n', '| H1-C2 | |\n'), ['ERROR R-COB-03']],
  ['test que declara un criterio que la matriz no recoge', sub(C + 'tareas-web.md', 'Cubre: H1-C2', 'Cubre: H1-C1, H1-C2'), ['ERROR R-COB-04']],
  ['la matriz asigna un criterio que el test no declara', sub(C + 'tareas-web.md', 'Cubre: H1-C2', 'Cubre: H1-C1'), ['AVISO R-COB-05']],
  ['test que no cubre ningún criterio', anadir(C + 'tareas-web.md', '\n### T3: huérfano\nCubre:\nNivel: unitario\n'), ['AVISO R-COB-06']],
  ['criterio que sustituye a otro, sin fila en la matriz', (d) => { sub('_docs/ciclos/01-prueba/historias.md', '- H1-C2: el tablero muestra los huecos.', '- H1-C2: el tablero muestra los huecos (sustituye a H0-C1).')(d); sub(C + 'tareas-web.md', '| H1-C2 | T2 |\n', '')(d); }, ['ERROR R-COB-07']],
  ['criterio sin fila en la matriz', sub(C + 'tareas-web.md', '| H1-C2 | T2 |\n', ''), ['ERROR R-COB-07']],
  ['tarea repetida en el progreso', sub(C + 'estado.md', '| web | TA2 | pendiente | | |\n', '| web | TA2 | pendiente | | |\n| web | TA2 | pendiente | | |\n'), ['ERROR R-PRG-01']],
  ['estado de tarea inventado', sub(C + 'estado.md', '| web | TA2 | pendiente |', '| web | TA2 | hecha |'), ['ERROR R-PRG-02']],
  ['progreso de una tarea sin ficha', sub(C + 'estado.md', '| web | TA2 | pendiente | | |\n', '| web | TA2 | pendiente | | |\n| web | TA9 | pendiente | | |\n'), ['ERROR R-PRG-03']],
  ['tarea aprobada sin commit válido', sub(C + 'estado.md', '| web | TA1 | aprobada | ' + BASE.commit, '| web | TA1 | aprobada | xyz'), ['ERROR R-PRG-04']],
  ['tarea aprobada con un commit que no existe', sub(C + 'estado.md', '| web | TA1 | aprobada | ' + BASE.commit, '| web | TA1 | aprobada | abcdef0'), ['ERROR R-PRG-05']],
  ['tarea bloqueada sin hueco', sub(C + 'estado.md', '| web | TA2 | pendiente | | |', '| web | TA2 | bloqueada | | |'), ['ERROR R-PRG-06']],
  ['tarea bloqueada por un hueco inexistente', sub(C + 'estado.md', '| web | TA2 | pendiente | | |', '| web | TA2 | bloqueada | | G9 |'), ['ERROR R-PRG-07']],
  ['tarea bloqueada por un hueco resuelto', sub(C + 'estado.md', '| web | TA2 | pendiente | | |', '| web | TA2 | bloqueada | | G1 |'), ['ERROR R-PRG-08']],
  ['tarea sin fila en el progreso', sub(C + 'estado.md', '| web | TA2 | pendiente | | |\n', ''), ['ERROR R-PRG-09']],
  ['tareas de un SDD sin plan', sub(C + 'estado.md', '| web | TA2 | pendiente | | |\n', '| web | TA2 | pendiente | | |\n| otro | TA1 | pendiente | | |\n'), ['ERROR R-PRG-10']],
  ['tarea implementada sin commit (lo anota el revisor)', sub(C + 'estado.md', '| web | TA2 | pendiente | | |', '| web | TA2 | implementada | | |'), []],
  ['tarea implementada con un commit mal escrito', sub(C + 'estado.md', '| web | TA2 | pendiente | | |', '| web | TA2 | implementada | xyz | |'), ['ERROR R-PRG-04']],
  ['tarea aprobada sin commit', sub(C + 'estado.md', '| web | TA1 | aprobada | ' + BASE.commit, '| web | TA1 | aprobada | '), ['ERROR R-PRG-04']],
  ['camino de hueco inventado', sub(C + 'huecos.md', 'Camino: repetir fases', 'Camino: ignorar'), ['ERROR R-HUE-06']],
  ['historia sin ningún criterio', (d) => { sub(C + 'historias.md', '- H1-C1: Dado un proyecto con tareas,\n  cuando abro el tablero,\n  entonces veo las tareas.\n- H1-C2: el tablero muestra los huecos.\n', '')(d); }, ['ERROR R-REQ-01']],
  ['hueco resuelto sin camino', sub(C + 'huecos.md', 'Camino: repetir fases\n', ''), ['AVISO R-HUE-07']],
  ['nivel de hueco antiguo (de especificación)', sub(C + 'huecos.md', 'Nivel: hueco', 'Nivel: de especificación'), ['ERROR R-HUE-01']],
  ['hueco resuelto con camino enmienda: el historial no tiene que citarlo', (d) => { sub(C + 'huecos.md', 'Camino: repetir fases', 'Camino: enmienda')(d); sub(C + 'estado.md', '| 4 SDD | G1 |', '| 4 SDD | V1 |')(d); }, []],
  ['vía inventada', sub(C + 'estado.md', 'Vía: completa', 'Vía: rápida'), ['ERROR R-VIA-02']],
  ['sin línea de vía', sub(C + 'estado.md', 'Vía: completa\n', ''), ['AVISO R-VIA-01']],
  ['vía corta con la fase 2 aprobada', sub(C + 'estado.md', 'Vía: completa', 'Vía: corta'), ['ERROR R-VIA-03']],
  ['vía completa con la fase 2 en no aplica', sub(C + 'estado.md', '| 2 Historias | `historias.md` | aprobado |', '| 2 Historias | `historias.md` | no aplica |'), ['ERROR R-VIA-04']],
  ['ficha de tarea con más de seis archivos', sub(C + 'tareas-web.md', 'Archivos: `src/a.ts`', 'Archivos: a/1.ts, a/2.ts, a/3.ts, a/4.ts, a/5.ts, a/6.ts, a/7.ts'), ['AVISO R-TAR-08']],
  ['ficha con seis archivos: dentro de la orientación', sub(C + 'tareas-web.md', 'Archivos: `src/a.ts`', 'Archivos: a/1.ts, a/2.ts, a/3.ts, a/4.ts, a/5.ts, a/6.ts'), []],
  ['el contexto técnico cita una ruta que no existe', sub(C + 'sdd-web.md', 'Nada existente.', 'Usa `src/falta.ts`.'), ['AVISO R-RUT-01']],
  ['el contexto técnico cita una ruta que existe', (d) => { fs.mkdirSync(path.join(d, 'src'), { recursive: true }); escribirF(d, 'src/a.ts', 'x\n'); sub(C + 'sdd-web.md', 'Nada existente.', 'Usa `src/a.ts`.')(d); }, []],
  ['el plan cita un script de npm que ningún package.json define', (d) => { escribirF(d, 'package.json', '{"scripts":{"test":"x"}}\n'); sub(C + 'tareas-web.md', 'se lanza con `npm test`', 'se lanza con `npm run comprobar`')(d); }, ['AVISO R-RUT-02']],
  ['el plan cita un script de npm que sí existe', (d) => { escribirF(d, 'package.json', '{"scripts":{"test":"x"}}\n'); }, []],
  ['el plan retira tests y el SDD dice que no hay impacto', sub(C + 'sdd-web.md', 'Modifica T1: otro localizador.', 'No aplica.'), ['AVISO R-EXI-01']],
  ['el plan retira tests y aprobaciones no los señala', sub(C + 'aprobaciones.md', '- Tests existentes: T1 se modifica (H1-C1).', 'Nada especial.'), ['AVISO R-EXI-02']],
  ['el plan retira tests y falta aprobaciones.md', quitar(C + 'aprobaciones.md'), ['AVISO R-EXI-02']],
  ['una convención citada que no existe', (d) => { fs.mkdirSync(path.join(d, '_flujo'), { recursive: true }); escribirF(d, '_flujo/convenciones.md', '# Convenciones\n\n## Aprobar y publicar\n\n**Pregunta poco y bien, y de una en una.** Texto.\n'); escribirF(d, '_flujo/01-fase.md', 'Sigue "Aprobar y publicar" de las convenciones y «Pregunta poco y bien» en `_flujo/convenciones.md`; también "Sección inventada" de `_flujo/convenciones.md`.\n'); }, ['ERROR R-REF-01']],
  ['las convenciones citadas existen', (d) => { fs.mkdirSync(path.join(d, '_flujo'), { recursive: true }); escribirF(d, '_flujo/convenciones.md', '# Convenciones\n\n## Aprobar y publicar\n\n**Pregunta poco y bien, y de una en una.** Texto.\n'); escribirF(d, '_flujo/01-fase.md', 'Sigue "Aprobar y publicar" de las convenciones y «Pregunta poco y bien» en `_flujo/convenciones.md`.\n'); }, []],
  ['ID de test repetido', anadir(C + 'tareas-web.md', '\n### T2: repetido\nCubre: H1-C2\n'), ['ERROR R-LEC-01']],
];

for (const [nombre, mutar, esperados] of CASOS) {
  test(`error sembrado: ${nombre}`, () => {
    const dir = copia();
    mutar(dir);
    const r = validar(dir);
    for (const e of esperados) assert.ok(r.lineas.some((l) => l.startsWith(e + ' ')), `falta «${e}» en:\n${r.salida}`);
    if (esperados.length === 0) assert.deepEqual(r.lineas, []);
    // Un error sembrado puede arrastrar otros (p. ej. una fila de la matriz que falta rompe también R-COB-04): el código de
    // salida debe ser 1 si y solo si la salida contiene algún ERROR, y 1 siempre que lo sembrado era un ERROR.
    const hayError = r.lineas.some((l) => l.startsWith('ERROR '));
    assert.equal(r.codigo, hayError ? 1 : 0, `código de salida incoherente con la salida:\n${r.salida}`);
    if (esperados.some((e) => e.startsWith('ERROR'))) assert.equal(r.codigo, 1);
    fs.rmSync(dir, { recursive: true, force: true });
  });
}

// ---------- ciclo completo, vía corta y ningún ciclo activo ----------
test('ningún ciclo activo con todos los ciclos cerrados es válido (el cierre de la fase 9 deja «Ciclo activo: ninguno»)', () => {
  const dir = copia();
  sub('_docs/proyecto.md', 'Ciclo activo: _docs/ciclos/01-prueba', 'Ciclo activo: ninguno')(dir);
  sub('_docs/proyecto.md', '| abierto | kickoff | 2026-01-01 | |', '| cerrado | kickoff | 2026-01-01 | 2026-02-01 |')(dir);
  sub(C + 'estado.md', '| 9 Cierre | `_docs/sistema.md` | pendiente | | |', '| 9 Cierre | `_docs/sistema.md` | aprobado | 2026-02-01 | |')(dir);
  const r = validar(dir);
  assert.deepEqual(r.lineas, [], r.salida);
  assert.equal(r.codigo, 0);
  const sin = spawnSync('node', [VALIDAR, '--raiz', dir], { encoding: 'utf8' });
  assert.equal(sin.status, 0);
  assert.match(sin.stdout, /Ciclos validados: ninguno\. 0 errores, 0 avisos/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('ciclo cerrado con la fase 9 sin aprobar es un error', () => {
  const dir = copia();
  sub('_docs/proyecto.md', 'Ciclo activo: _docs/ciclos/01-prueba', 'Ciclo activo: ninguno')(dir);
  sub('_docs/proyecto.md', '| abierto |', '| cerrado |')(dir);
  assert.ok(validar(dir).lineas.some((l) => l.startsWith('ERROR R-CIC-06 ')));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('ciclo cerrado de la numeración anterior: su cierre es la fase 10 y se localiza por el nombre', () => {
  const dir = copia();
  sub('_docs/proyecto.md', 'Ciclo activo: _docs/ciclos/01-prueba', 'Ciclo activo: ninguno')(dir);
  sub('_docs/proyecto.md', '| abierto |', '| cerrado |')(dir);
  sub(C + 'estado.md', '| 9 Cierre | `_docs/sistema.md` | pendiente | | |', '| 10 Cierre | `_docs/sistema.md` | borrador | 2026-02-01 | |')(dir);
  assert.ok(validar(dir).lineas.some((l) => l.startsWith('ERROR R-CIC-06 ')));
  sub(C + 'estado.md', '| 10 Cierre | `_docs/sistema.md` | borrador |', '| 10 Cierre | `_docs/sistema.md` | aprobado |')(dir);
  assert.ok(!validar(dir).lineas.some((l) => l.includes('R-CIC-06')));
  fs.rmSync(dir, { recursive: true, force: true });
});

// Ejemplo de vía corta: la fase 2 queda «no aplica», no hay historias.md y los criterios están en la sección «Requisitos» del brief.
function viaCorta() {
  const dir = copia();
  fs.rmSync(path.join(dir, C + 'historias.md'));
  escribirF(dir, C + 'brief.md', '# Brief\n\n## Requisitos\n\n### R1 — Ver el tablero\n\n- R1-C1: Dado un proyecto con tareas,\n  cuando abro el tablero,\n  entonces veo las tareas.\n- R1-C2: el tablero muestra los huecos.\n');
  for (const f of ['tareas-web.md', 'revisiones-web.md']) escribirF(dir, C + f, leerF(dir, C + f).replaceAll('H1', 'R1'));
  sub(C + 'estado.md', 'Vía: completa', 'Vía: corta')(dir);
  sub(C + 'estado.md', '| 2 Historias | `historias.md` | aprobado | 2026-01-01 |', '| 2 Historias | | no aplica | 2026-01-01 |')(dir);
  sub('_docs/proyecto.md', '| H (historia) | 2 |\n| R (requisito) | 1 |', '| H (historia) | 1 |\n| R (requisito) | 2 |')(dir);
  return dir;
}

test('ejemplo de vía corta: sin historias, fase 2 «no aplica» y criterios en el brief, sin ningún problema', () => {
  const dir = viaCorta();
  const r = validar(dir);
  assert.deepEqual(r.lineas, [], r.salida);
  assert.equal(r.codigo, 0);
  const m = leerProyecto(dir);
  assert.equal(m.ciclos[0].via, 'corta');
  assert.deepEqual(m.criterios.map((c) => c.id), ['R1-C1', 'R1-C2']);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('vía corta: si la fase 2 se aprueba, el validador lo señala', () => {
  const dir = viaCorta();
  sub(C + 'estado.md', '| 2 Historias | | no aplica |', '| 2 Historias | | aprobado |')(dir);
  assert.ok(validar(dir).lineas.some((l) => l.startsWith('ERROR R-VIA-03 ')));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('la plantilla del repositorio cumple sus propias reglas (secciones citadas de las convenciones)', () => {
  const raiz = path.join(path.dirname(VALIDAR), '..');
  const r = spawnSync('node', [VALIDAR, '--raiz', raiz], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /0 errores/);
});

// ---------- casos de entorno ----------
test('clon superficial: los commits que faltan no son error, solo un aviso', () => {
  const sup = fs.mkdtempSync(path.join(os.tmpdir(), 'flujo-sup-'));
  fs.rmSync(sup, { recursive: true });
  execFileSync('git', ['clone', '-q', '--depth', '1', 'file://' + BASE.dir, sup], { stdio: 'ignore' });
  const r = validar(sup);
  assert.equal(r.codigo, 0, r.salida);
  assert.ok(r.lineas.some((l) => l.startsWith('AVISO R-LEC-04 ')), r.salida);
  assert.ok(!r.lineas.some((l) => l.includes('R-PRG-05')));
  fs.rmSync(sup, { recursive: true, force: true });
});

test('lector: un hueco citado solo en las notas de una tarea no cuenta como mencionado en el historial', () => {
  const dir = copia();
  sub(C + 'estado.md', '| web | TA2 | pendiente | | |', '| web | TA2 | bloqueada | | G7 |')(dir);
  const m = leerProyecto(dir);
  assert.ok(!m.ciclos[0].estado.huecosMencionados.includes('G7'));
  assert.deepEqual(m.progreso.find((p) => p.tarea === 'TA2').huecos, ['G7']);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('sin repositorio git: no se comprueban los commits y no hay falso error', () => {
  const dir = copia();
  fs.rmSync(path.join(dir, '.git'), { recursive: true });
  sub(C + 'estado.md', BASE.commit, 'abcdef0')(dir);
  const r = validar(dir);
  assert.equal(r.codigo, 0, r.salida);
  assert.deepEqual(r.lineas, []);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('lector: los tests, la matriz y los tests afectados salen de tareas-*.md; no hay fichero de tests', () => {
  const m = leerProyecto(BASE.dir);
  const sdd = m.ciclos[0].sdd[0];
  assert.equal(sdd.ficheros.tareas, C + 'tareas-web.md');
  assert.ok(!('tests' in sdd.ficheros), 'la versión 2 del modelo no tiene ficheros.tests');
  assert.deepEqual(m.tests.map((t) => t.fichero), [C + 'tareas-web.md', C + 'tareas-web.md']);
  assert.equal(m.testsAfectados[0].fichero, C + 'tareas-web.md');
  assert.deepEqual(sdd.matriz.map((r) => r.criterio), ['H1-C1', 'H1-C2']);
});

test('un tests-web.md suelto de la numeración anterior no se lee: el test que contiene no existe', () => {
  const dir = copia();
  escribirF(dir, C + 'tests-web.md', '# Tests\n\n### T9: antiguo\nCubre: H1-C1\n');
  const m = leerProyecto(dir);
  assert.ok(!m.tests.some((t) => t.id === 'T9'));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('un test escrito debajo de la ficha de su tarea no se mezcla con las etiquetas de la tarea', () => {
  const m = leerProyecto(BASE.dir);
  const ta1 = m.tareas.find((t) => t.id === 'TA1');
  assert.equal(ta1.terminadaCuando, 'T1 pasa.');
  assert.equal(ta1.artefacto, 'web');
  assert.equal(m.tests.find((t) => t.id === 'T1').preparacion, 'un proyecto con una tarea.');
});

test('--json imprime el mismo recuento que la salida de texto', () => {
  const dir = copia();
  sub(C + 'estado.md', '| web | TA2 | pendiente |', '| web | TA2 | hecha |')(dir);
  const j = JSON.parse(validar(dir, '--json').salida);
  assert.equal(j.errores, 1);
  assert.equal(j.problemas[0].codigo, 'R-PRG-02');
  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------- D81: documentos con el formato anterior se siguen leyendo ----------
test('lector: verificacion.md sin historial ni «Decisión» (formato anterior) da una sola ejecución y decisión null', () => {
  const dir = copia();
  const f = C + 'verificacion.md';
  escribirF(dir, f, leerF(dir, f).replace(/- \*\*Decisión:\*\* aceptado\n/, '').replace(/\n## 3\. Historial[\s\S]*$/, '\n'));
  const m = leerProyecto(dir);
  assert.equal(m.verificaciones.length, 1);
  assert.deepEqual([m.verificaciones[0].numero, m.verificaciones[0].ejecucion, m.verificaciones[0].veredicto], [null, 'primera', 'listo para implementar']);
  assert.equal(m.hallazgos.find((x) => x.id === 'V1' && x.origen === 'ficha').decision, null);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('lector: tarea sin «Cierre de» toma el cierre del resumen', () => {
  const dir = copia();
  sub(C + 'tareas-web.md', 'Cierre de: H1\n', '')(dir);
  const m = leerProyecto(dir);
  assert.deepEqual(m.tareas.find((t) => t.id === 'TA2').cierreDe.ids, ['H1']);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------- datos añadidos al lector: ruta del SDD, Dado/Cuando/Entonces, documentos de enmienda, commits de tarea ----------
test('lector: ruta del SDD, partes del criterio y documentos de la enmienda', () => {
  const m = leerProyecto(BASE.dir);
  assert.equal(m.ciclos[0].sdd[0].ficheros.sdd, C + 'sdd-web.md');
  const c1 = m.criterios.find((c) => c.id === 'H1-C1');
  assert.deepEqual([c1.dado, c1.cuando, c1.entonces], ['un proyecto con tareas', 'abro el tablero', 'veo las tareas.']);
  assert.deepEqual(m.huecos[0].documentosEnmienda, ['sdd-web.md']);
});

test('lector: un criterio que no sigue Dado/Cuando/Entonces deja las tres partes en null', () => {
  const dir = copia();
  sub('_docs/ciclos/01-prueba/historias.md', '- H1-C1: Dado un proyecto con tareas,\n  cuando abro el tablero,\n  entonces veo las tareas.', '- H1-C1: el tablero muestra las tareas.')(dir);
  const c = leerProyecto(dir).criterios.find((x) => x.id === 'H1-C1');
  assert.deepEqual([c.dado, c.cuando, c.entonces], [null, null, null]);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('lector: cada tarea recoge sus commits, de más antiguo a más reciente', () => {
  const dir = copia();
  git(dir, 'commit', '-q', '--allow-empty', '-m', 'TA1: primera');
  git(dir, 'commit', '-q', '--allow-empty', '-m', 'TA1 (corrección): ajuste');
  const m = leerProyecto(dir);
  assert.deepEqual(m.tareas.find((t) => t.id === 'TA1').commits.map((c) => c.tipo), ['tarea', 'correccion']);
  assert.deepEqual(m.tareas.find((t) => t.id === 'TA2').commits, []);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('lector: la revisión de cierre con varios commits (Commits, Commit revisado) los recoge todos', () => {
  const dir = copia();
  const f = C + 'revisiones-web.md';
  const antes = leerF(dir, f);
  assert.match(antes, /^Commit: /m);
  escribirF(dir, f, antes.replace(/^Commit: (\w+).*$/gm, 'Commits revisados: $1, abcdef1 (diff acumulado $1~1..abcdef1)'));
  const m = leerProyecto(dir);
  assert.deepEqual(m.revisiones[0].commits, [BASE.commit, 'abcdef1']);
  assert.equal(m.revisiones[0].commit, BASE.commit);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('lector: «sustituye» solo marca un criterio cuando apunta a otro (`sustituye a H<n>-C<m>`)', () => {
  const dir = copia();
  sub('_docs/ciclos/01-prueba/historias.md', '- H1-C2: el tablero muestra los huecos.', '- H1-C2: el tablero sustituye a la lista de huecos.')(dir);
  let c = leerProyecto(dir).criterios.find((x) => x.id === 'H1-C2');
  assert.deepEqual([c.sustituye, c.sustituyeA], [false, []]);
  sub('_docs/ciclos/01-prueba/historias.md', 'sustituye a la lista de huecos.', 'sustituye a H0-C1.')(dir);
  c = leerProyecto(dir).criterios.find((x) => x.id === 'H1-C2');
  assert.deepEqual([c.sustituye, c.sustituyeA], [true, ['H0-C1']]);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------- requisitos añadidos en el SDD: se leen de su tabla y de ningún otro sitio ----------
test('lector: los requisitos nuevos salen de la tabla «Requisitos añadidos en el SDD»', () => {
  const dir = copia();
  escribirF(dir, C + 'sdd-web.md', '# SDD web\n\n## 7. Criterios de aceptación\n\n### Requisitos añadidos en el SDD\n\n| ID | Título |\n|---|---|\n| R7 | Contrato de la API |\n| R8 | Protección contra DNS rebinding |\n\n- **R7-C1** (añadido en el SDD): algo.\n');
  const m = leerProyecto(dir);
  const r7 = m.requisitos.find((x) => x.id === 'R7');
  assert.deepEqual([r7.titulo, r7.anadidoEnSdd, r7.fichero, r7.linea > 0], ['R7: Contrato de la API', true, C + 'sdd-web.md', true]);
  assert.deepEqual(m.requisitos.filter((x) => x.anadidoEnSdd).map((x) => x.id), ['R7', 'R8']);
  assert.deepEqual(m.problemas, []);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('lector: sin la tabla, un requisito marcado «añadido en el SDD» en otro formato no se recoge', () => {
  const dir = copia();
  escribirF(dir, C + 'sdd-web.md', '# SDD web\n\nCubre: los requisitos nuevos R7 y R8 (añadidos en el SDD).\n\n- **R7-C1** (añadido en el SDD): algo.\n\n**R9: Otro** (añadido en el SDD)\n');
  const m = leerProyecto(dir);
  assert.deepEqual(m.requisitos.filter((x) => x.anadidoEnSdd), []);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('lector: un requisito de la tabla que ya está en las historias no se duplica', () => {
  const dir = copia();
  sub('_docs/ciclos/01-prueba/historias.md', '- H1-C2: el tablero muestra los huecos.\n', '- H1-C2: el tablero muestra los huecos.\n\n### R5: Rendimiento\nLa lista carga rápido.\n')(dir);
  escribirF(dir, C + 'sdd-web.md', '# SDD web\n\n## Requisitos añadidos en el SDD\n\n| ID | Título |\n|---|---|\n| R5 | Rendimiento (otra vez) |\n| R7 | Nuevo |\n');
  const m = leerProyecto(dir);
  assert.equal(m.requisitos.filter((x) => x.id === 'R5').length, 1);
  assert.equal(m.requisitos.find((x) => x.id === 'R5').anadidoEnSdd, false);
  assert.equal(m.requisitos.find((x) => x.id === 'R7').anadidoEnSdd, true);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('lector: la tabla de requisitos de sdd-indice.md no cuenta (no es un SDD)', () => {
  const dir = copia();
  escribirF(dir, C + 'sdd-indice.md', '# Índice\n\n## Requisitos añadidos en el SDD\n\n| ID | Qué es | SDD |\n|---|---|---|\n| R7 | Algo | `sdd-web` |\n');
  assert.deepEqual(leerProyecto(dir).requisitos.filter((x) => x.anadidoEnSdd), []);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('lector: el nivel de un test se conserva tal como está escrito, también si no es del vocabulario', () => {
  const dir = copia();
  sub(C + 'tareas-web.md', 'Nivel: unitario — `src/a.spec.ts`', 'Nivel: e2e — `src/a.spec.ts`')(dir);
  const m = leerProyecto(dir);
  assert.deepEqual([m.tests.find((t) => t.id === 'T1').nivel.tipo, m.tests.find((t) => t.id === 'T1').nivel.archivo], ['e2e', 'src/a.spec.ts']);
  assert.deepEqual(m.problemas, []);
  fs.rmSync(dir, { recursive: true, force: true });
});
