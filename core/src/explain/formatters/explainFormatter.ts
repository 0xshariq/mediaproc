

import { ExplainContext, ExplainMode } from '../../types/explainTypes.js';
import { explainHumanTemplate } from '../templates/explainHumanTemplate.js';
import { explainDetailsTemplate } from '../templates/explainDetailsTemplate.js';




/**
 * Main explain formatter. Returns a string (or JSON) for the given context and mode.
 */
export function explainFormatter(
  context: ExplainContext,
  mode: ExplainMode = ExplainMode.Human
): string | object {
  // Future: Add context-aware formatting logic here if needed
  if (mode === ExplainMode.Json) {
    // Return raw context for machine use, including all enhanced fields
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