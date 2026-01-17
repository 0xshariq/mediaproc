
import { ExplainContext } from '../types/explainTypes.js';

export type ExplainFormat = 'human' | 'details' | 'json';

/**
 * Main explain formatter. Returns a string (or JSON) for the given context and format.
 */
export function explainFormatter(
	context: ExplainContext,
	format: ExplainFormat = 'human',
	tense: 'will' | 'would' | 'did' = 'will'
): string | object {
	if (format === 'json') {
		// Return raw context for machine use
		return context;
	}

	// Tense helpers
	const tenseMap = {
		will: { what: 'will', result: 'will be', why: 'Why' },
		would: { what: 'would', result: 'would be', why: 'Why' },
		did: { what: 'was', result: 'was', why: 'Why' },
	}[tense];

	// Human-first (default)
	let output = '';
	output += `What ${tenseMap.what} happen:\n`;
	for (const d of context.decisions) {
		output += `• ${decisionToHuman(d)}\n`;
	}
	if (context.outcome && context.outcome.result) {
		output += `\nResult:\n• ${context.outcome.result}\n`;
		if (context.outcome.sideEffects && context.outcome.sideEffects.length > 0) {
			for (const s of context.outcome.sideEffects) {
				output += `• ${s}\n`;
			}
		}
	}
	output += `\n${tenseMap.why}:\n`;
	for (const d of context.decisions) {
		output += `• ${decisionToWhy(d)}\n`;
	}

	if (format === 'details') {
		// Add technical details if present
		if (context.inferred) {
			output += `\nTechnical details:\n`;
			for (const [k, v] of Object.entries(context.inferred)) {
				output += `• ${k}: ${v}\n`;
			}
		}
		if (context.usedFlags) {
			output += `\nFlags used:\n`;
			for (const [k, v] of Object.entries(context.usedFlags)) {
				output += `• ${k}: ${v.value} (${v.source})\n`;
			}
		}
	}
	return output.trim();
}

// Helper: turn a decision into a human sentence
function decisionToHuman(d: { key: string; value: any; reason: string }): string {
	// You can expand this for more natural language
	if (d.reason === 'user specified') {
		return `Set ${d.key} to ${d.value} (user choice)`;
	}
	if (d.reason === 'preserve proportions') {
		return `${d.key} set to ${d.value} to keep proportions`;
	}
	return `${d.key}: ${d.value} (${d.reason})`;
}

// Helper: turn a decision into a why sentence
function decisionToWhy(d: { key: string; value: any; reason: string }): string {
	if (d.reason === 'user specified') {
		return `${d.key} was set because you specified it`;
	}
	if (d.reason === 'preserve proportions') {
		return `${d.key} was set to keep the image undistorted`;
	}
	return `${d.key}: ${d.reason}`;
}