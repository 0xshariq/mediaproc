import { ExplainContext } from '../../types/explainTypes.js';
import chalk from 'chalk';

export function explainHumanTemplate(context: ExplainContext): string {
    let output = '';
    output += chalk.bold.bgBlueBright.white('╔════════════════════════════════════════════════════════════════╗') + '\n';
    output += chalk.bold.bgBlueBright.white('║                        EXPLANATION                           ║') + '\n';
    output += chalk.bold.bgBlueBright.white('╚════════════════════════════════════════════════════════════════╝') + '\n';
    if (context.explainOnly) {
        output += chalk.bgYellow.black(' [EXPLAIN-ONLY MODE: No command will be executed] ') + '\n';
    }

    // Friendly, conversational summary
    if (context.plugin) {
        output += chalk.bold(`This command uses the "${context.plugin}" plugin.`) + '\n';
    }


    // What will happen
    output += chalk.bold.underline(`\nWhat will happen:`) + '\n';
    if (context.decisions && context.decisions.length > 0) {
        for (const d of context.decisions) {
            let valueStr = (d.value === undefined || Number.isNaN(d.value)) ? 'N/A' : d.value;
            output += chalk.green(`• ${d.key} will be set to ${valueStr}`) + '\n';
        }
    } else {
        output += chalk.green('• The command will use default settings.') + '\n';
    }

    // Result
    if (context.outcome && context.outcome.result) {
        output += chalk.bold.underline(`\nResult:`) + '\n';
        output += chalk.yellow(`• ${context.outcome.result}`) + '\n';
        if (context.outcome.sideEffects && Array.isArray(context.outcome.sideEffects) && context.outcome.sideEffects.length > 0) {
            for (const s of context.outcome.sideEffects) {
                output += chalk.yellow(`• ${s}`) + '\n';
            }
        }
    }
    // Tip
    output += chalk.gray('\nTip: Use --explain=details for a technical breakdown.');
    return output.trim();
}
