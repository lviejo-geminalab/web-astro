#!/usr/bin/env node
// Guardia de la aprobación: hook PreToolUse de Claude Code, registrado en `.claude/settings.json`.
//
// Qué protege: `node _flujo/estado.mjs aprobar …` es la única orden que aprueba una fase, un SDD o un plan de tareas
// y la que cierra un ciclo (aprobar la fase 9). Solo vale si la persona responsable la ha visto y ha dicho que sí.
//
// Qué hace, para cada llamada a la herramienta Bash:
//   - Si el comando no es `estado.mjs aprobar`, no dice nada y la llamada sigue su camino normal.
//   - Si lo es y la pide un agente aislado (el hook recibe `agent_id`): la NIEGA. Los agentes aislados no aprueban.
//   - Si lo es y la sesión no pregunta a la persona (modo `bypassPermissions`, o `dontAsk`): la NIEGA, porque nadie
//     vería el aviso. Para aprobar hay que cambiar de modo, o ejecutar la orden la propia persona en su terminal.
//   - En cualquier otro caso: FUERZA el aviso de permiso («ask»), con el comando delante, y la persona decide.
//
// Límites (ver D94 de `_flujo/DISENO.md`): un hook no es una frontera de seguridad. Mira el texto del comando; quien
// ejecute el script por otro camino (`node -e`, un script propio) no pasa por aquí. Lo cubre `.claude/settings.json`
// con una regla `ask` de respaldo, y la regla de `CLAUDE.md` que prohíbe aprobar sin el sí de la persona.
//
// Entrada: el JSON del hook por la entrada estándar. Salida: nada (deja pasar) o el JSON de decisión.
// Sin dependencias; Node 18 o posterior.

import fs from 'node:fs';

// `estado.mjs` seguido de `aprobar` como primer argumento, también dentro de `sh -c '…'` o con ruta distinta.
export const APROBAR = /estado\.mjs["']?\s+["']?aprobar(?=[\s"']|$)/;

export function decidir(e) {
  if (e?.tool_name !== 'Bash') return null;
  const comando = e.tool_input?.command;
  if (typeof comando !== 'string' || !APROBAR.test(comando)) return null;
  const respuesta = (decision, motivo) => ({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: motivo } });
  if (e.agent_id) return respuesta('deny', 'Aprobar es de la persona responsable: un agente aislado no puede ejecutar `estado.mjs aprobar`. Termina diciendo qué hay que aprobar y con qué comando.');
  if (['bypassPermissions', 'dontAsk'].includes(e.permission_mode)) return respuesta('deny', `La sesión está en modo ${e.permission_mode} y no avisaría a la persona. Cambia de modo para aprobar, o ejecuta la orden tú en tu terminal.`);
  return respuesta('ask', `Aprobación: ${comando.trim().slice(0, 200)}. Solo con el sí de la persona responsable.`);
}

if (process.argv[1]?.endsWith('guardia-aprobar.mjs')) {
  let entrada;
  try { entrada = JSON.parse(fs.readFileSync(0, 'utf8')); } catch { process.exit(0); }
  const r = decidir(entrada);
  if (r) process.stdout.write(JSON.stringify(r));
  process.exit(0);
}
