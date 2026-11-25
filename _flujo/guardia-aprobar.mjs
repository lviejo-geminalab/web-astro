#!/usr/bin/env node
// Guardia de la aprobación: hook PreToolUse de Claude Code, registrado en `.claude/settings.json`.
//
// Qué protege: `node _flujo/estado.mjs aprobar …` es la única orden que aprueba una fase, un SDD o un plan de tareas
// y la que cierra un ciclo (aprobar la fase 9). Solo vale si la persona responsable la ha visto y ha dicho que sí.
//
// Qué hace, para cada llamada a la herramienta Bash:
//   - Si el comando no es `estado.mjs aprobar`, no dice nada y la llamada sigue su camino normal.
//   - Si lo es y la pide un agente aislado (el hook recibe `agent_id`): la NIEGA. Los agentes aislados no aprueban.
//   - En cualquier otro caso: la deja pasar sin aviso de permiso. La confirmación de la persona es la pregunta Sí/No
//     que el agente le hace antes (`AskUserQuestion`), según `_flujo/convenciones.md`; ver D98.
//
// Límites (ver D94 y D98 de `_flujo/DISENO.md`): esto NO comprueba que la persona haya dicho que sí; solo impide que
// aprueben los agentes aislados. Que el agente pregunte antes lo exigen `convenciones.md` y `CLAUDE.md`, no el entorno.
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
  return respuesta('allow', 'La persona responsable ha aprobado en la pregunta Sí/No que el agente le hizo en esta conversación.');
}

if (process.argv[1]?.endsWith('guardia-aprobar.mjs')) {
  let entrada;
  try { entrada = JSON.parse(fs.readFileSync(0, 'utf8')); } catch { process.exit(0); }
  const r = decidir(entrada);
  if (r) process.stdout.write(JSON.stringify(r));
  process.exit(0);
}
