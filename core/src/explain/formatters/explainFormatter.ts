

import { ExplainContext, ExplainMode } from '../../types/explainTypes.js';
import { explainHumanTemplate } from '../templates/explainHumanTemplate.js';
import { explainDetailsTemplate } from '../templates/explainDetailsTemplate.js';
import { explainAuditTemplate } from '../templates/explainAuditTemplate.js';
import { explainDebugTemplate } from '../templates/explainDebugTemplate.js';




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
  else if (mode === ExplainMode.Human) {
    return explainHumanTemplate(context);
  }
  else if (mode === ExplainMode.Details) {
    return explainDetailsTemplate(context);
  }
  else if (mode === ExplainMode.Audit) {
    return explainAuditTemplate(/* context */)
  }
  else if (mode === ExplainMode.Debug) {
    return explainDebugTemplate(/* context */)
  }
  return '';
}