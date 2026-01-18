

import { ExplainContext, ExplainMode } from '../types/explainTypes.js';
import { explainHumanTemplate } from '../explain/templates/explainHumanTemplate.js';
import { explainDetailsTemplate } from '../explain/templates/explainDetailsTemplate.js';




/**
 * Main explain formatter. Returns a string (or JSON) for the given context and mode.
 */
export function explainFormatter(
  context: ExplainContext,
  mode: ExplainMode = ExplainMode.Human
): string | object {
  if (mode === ExplainMode.Json) {
    // Return raw context for machine use
    return context;
  }
  if (mode === ExplainMode.Human) {
    return explainHumanTemplate(context);
  }
  if (mode === ExplainMode.Details) {
    return explainDetailsTemplate(context);
  }
  return '';
}