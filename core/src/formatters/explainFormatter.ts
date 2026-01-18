

import { ExplainContext } from '../types/explainTypes.js';
import { explainHumanTemplate } from '../explain/templates/explainHumanTemplate.js';
import { explainDetailsTemplate } from '../explain/templates/explainDetailsTemplate.js';


export type ExplainFormat = 'human' | 'details' | 'json';

/**
 * Main explain formatter. Returns a string (or JSON) for the given context and format.
 */
export function explainFormatter(
	context: ExplainContext,
	format: ExplainFormat = 'human'
): string | object {
	if (format === 'json') {
		// Return raw context for machine use
		return context;
	}
	if (format === 'human') {
		return explainHumanTemplate(context);
	}
	if (format === 'details') {
		return explainDetailsTemplate(context);
	}
	return '';
}