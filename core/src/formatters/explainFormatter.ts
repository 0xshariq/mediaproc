
import { ExplainContext } from '../types/explainTypes.js';
import chalk from 'chalk';

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

	let output = '';
	if (format === 'human') {
		output += chalk.bold.bgBlueBright.white(' EXPLANATION ') + '\n';
		if (context.plugin || context.cliVersion || context.pluginVersion) {
			output += chalk.bold(`Plugin: ${context.plugin || 'N/A'} | CLI Version: ${context.cliVersion || 'N/A'} | Plugin Version: ${context.pluginVersion || 'N/A'}`) + '\n';
		}
		output += chalk.bold.underline(`\n${chalk.cyan('What ' + tenseMap.what + ' happen:')}`) + '\n';
		for (const d of context.decisions) {
			output += chalk.green(`• ${decisionToHuman(d)}`) + '\n';
		}
		if (context.outcome && context.outcome.result) {
			output += chalk.bold.underline(`\n${chalk.cyan('Result:')}`) + '\n';
			output += chalk.yellow(`• ${context.outcome.result}`) + '\n';
			if (context.outcome.sideEffects && context.outcome.sideEffects.length > 0) {
				for (const s of context.outcome.sideEffects) {
					output += chalk.yellow(`• ${s}`) + '\n';
				}
			}
		}
		output += chalk.bold.underline(`\n${chalk.cyan(tenseMap.why + ':')}`) + '\n';
		for (const d of context.decisions) {
			output += chalk.magenta(`• ${decisionToWhy(d)}`) + '\n';
		}
	} else if (format === 'details') {
		output += chalk.bold.bgMagenta.white(' EXPLANATION (DETAILS) ') + '\n';
		if (context.plugin || context.cliVersion || context.pluginVersion) {
			output += chalk.bold(`Plugin: ${context.plugin || 'N/A'} | CLI Version: ${context.cliVersion || 'N/A'} | Plugin Version: ${context.pluginVersion || 'N/A'}`) + '\n';
		}
		output += chalk.bold.underline(`\n${chalk.cyan('What ' + tenseMap.what + ' happen:')}`) + '\n';
		for (const d of context.decisions) {
			output += chalk.greenBright(`• ${decisionToHuman(d)}`) + '\n';
		}
		if (context.outcome && context.outcome.result) {
			output += chalk.bold.underline(`\n${chalk.cyan('Result:')}`) + '\n';
			output += chalk.yellowBright(`• ${context.outcome.result}`) + '\n';
			if (context.outcome.sideEffects && context.outcome.sideEffects.length > 0) {
				for (const s of context.outcome.sideEffects) {
					output += chalk.yellowBright(`• ${s}`) + '\n';
				}
			}
		}
		output += chalk.bold.underline(`\n${chalk.cyan(tenseMap.why + ':')}`) + '\n';
		for (const d of context.decisions) {
			output += chalk.magentaBright(`• ${decisionToWhy(d)}`) + '\n';
		}
		// Add technical details if present
		output += chalk.bold.underline(`\n${chalk.cyan('Technical details:')}`) + '\n';
		if (context.inferred) {
			for (const [k, v] of Object.entries(context.inferred)) {
				output += chalk.gray(`• ${k}: ${v}`) + '\n';
			}
		}
		if (context.usedFlags) {
			output += chalk.bold.underline(`\n${chalk.cyan('Flags used:')}`) + '\n';
			for (const [k, v] of Object.entries(context.usedFlags)) {
				output += chalk.gray(`• ${k}: ${v.value} (${v.source})`) + '\n';
			}
		}
		// Add extra info for developers
		output += chalk.bold.underline(`\n${chalk.cyan('Execution flow:')}`) + '\n';
		output += chalk.whiteBright('• Input validation, output path resolution, image processing, result summary') + '\n';
		output += chalk.whiteBright('• All steps are performed in sequence for each input file') + '\n';
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