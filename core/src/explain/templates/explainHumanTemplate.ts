import { ExplainContext } from '../../types/explainTypes.js';
import chalk from 'chalk';
import boxen from 'boxen';
import { explainSentences } from '../explainSentences.js';

export function explainHumanTemplate(context: ExplainContext): string {
    let lines: string[] = [];

    // Batch insight improvements
    if (context.batch) {
        lines.push('');
        lines.push('Batch Processing:');
        if (context.batch.size !== undefined) lines.push(`  Batch size: ${context.batch.size}`);
        if (context.batch.mode) lines.push(`  Mode: ${context.batch.mode}`);
        if (context.batch.summary) lines.push(`  Summary: ${context.batch.summary}`);
    }
    // Command context in technical details
    lines.push('');
    lines.push('Command Context:');
    lines.push(`  Command: ${context.command || 'unknown'}`);
    if (context.plugin) lines.push(`  Plugin: ${context.plugin}`);
    if (context.commandGroup) lines.push(`  Group: ${context.commandGroup}`);
    if (context.cliVersion) lines.push(`  CLI Version: ${context.cliVersion}`);
    if (context.pluginVersion) lines.push(`  Plugin Version: ${context.pluginVersion}`);
    // Execution steps (merged)
    if (context.executionSteps && context.executionSteps.length > 0) {
        lines.push('');
        lines.push('Execution Steps:');
        for (const step of context.executionSteps) {
            lines.push('  • ' + step);
        }
    }
    lines.push(chalk.bgBlueBright.white.bold(explainSentences.header()));

    // Improved summary line at top (anchor)
    if (context.summary && context.inputs && context.outputs) {
        const inputCount = context.inputs ? Object.keys(context.inputs).length : 0;
        const fileType = context.inputs && inputCount > 0 ? Object.keys(context.inputs)[0] : 'file';
        const outputCount = context.outputs ? Object.keys(context.outputs).length : 0;
        const outputType = context.outputs && outputCount > 0 ? Object.keys(context.outputs)[0] : 'output';
        const operation = context.command || 'processed';
        lines.push('');
        lines.push(chalk.bold.cyan(`This command will process ${inputCount} ${fileType}${inputCount === 1 ? '' : 's'} and produce ${outputCount} ${outputType}${outputCount === 1 ? '' : 's'} using the '${operation}' operation.`));
    } else if (context.summary) {
        lines.push('');
        lines.push(chalk.bold.cyan(context.summary));
    }

    // Explain-only mode
    if (context.explainOnly) {
        lines.push(chalk.bgYellow.black.bold(explainSentences.explainOnly()));
    }

    // Plugin info (if not generic)
    if (context.plugin && context.plugin !== 'generic') {
        lines.push(chalk.bgWhiteBright.blue.bold(explainSentences.pluginInfo(context.plugin)));
    }

    // Inputs/Outputs (input context)
    if (context.inputs && (context.inputs.inputPath || context.inputs.filesDetected)) {
        lines.push('');
        lines.push(chalk.bgGray.white.bold(explainSentences.commandInputs()));
        if (context.inputs.inputPath) {
            lines.push(chalk.gray(`Input path: ${context.inputs.inputPath}`));
        }
        if (context.inputs.filesDetected) {
            lines.push(chalk.gray(`Files detected: ${context.inputs.filesDetected}`));
        }
    }

    // What will happen (actions)
    if (context.effects && context.effects.length > 0) {
        lines.push('');
        lines.push(chalk.bgGreenBright.black.bold(explainSentences.whatWillHappenHeader()));
        // Human-readable effects (existing)
        lines.push(chalk.greenBright(explainSentences.actions(context.effects)));
        // Technical primitives (effect IDs)
        if (Array.isArray(context.effects) && context.effects.length > 0) {
            lines.push('(technical: ' + context.effects.join(', ') + ')');
        }
    }

    // What will NOT happen (assumptions)
    if (context.outcome && context.outcome.whatWillNotHappen && context.outcome.whatWillNotHappen.length > 0) {
        lines.push('');
        lines.push(chalk.bgRedBright.white.bold(explainSentences.whatWillNotHappenHeader()));
        for (const n of context.outcome.whatWillNotHappen) {
            if (typeof n === 'string') {
                lines.push(chalk.redBright(`  • ${n}`));
            } else if (n && typeof n === 'object' && 'reason' in n) {
                const obj = n as { text?: string; title?: string; reason?: string };
                lines.push(chalk.redBright(`  • ${obj.text || obj.title || 'Not applicable'}`));
                lines.push(chalk.gray(`      Reason: ${obj.reason}`));
            } else {
                lines.push(chalk.redBright(`  • ${JSON.stringify(n)}`));
            }
        }
    }

    // Unified Flags section
    if (
        (context.usedFlags && Object.keys(context.usedFlags).length > 0) ||
        (context.omittedFlags && Object.keys(context.omittedFlags).length > 0) ||
        (context.deprecatedFlags && context.deprecatedFlags.length > 0) ||
        (context.ignoredFlags && context.ignoredFlags.length > 0)
    ) {
        lines.push('');
        lines.push(chalk.bgGray.white.bold(explainSentences.flagsUsedHeader()));
        // Used/user/default flags
        if (context.usedFlags && Object.keys(context.usedFlags).length > 0) {
            const flagsArr = Object.entries(context.usedFlags).map(([name, v]) => ({ name, value: v.value, source: v.source }));
            lines.push(chalk.gray(explainSentences.flagsResolved(flagsArr)));
        }
        // Omitted flags
        if (context.omittedFlags && Object.keys(context.omittedFlags).length > 0) {
            for (const [k, v] of Object.entries(context.omittedFlags)) {
                lines.push(chalk.gray(`    - ${k}: default=${v.defaultValue} (${v.source}) [omitted]`));
            }
        }
        // Deprecated flags
        if (context.deprecatedFlags && context.deprecatedFlags.length > 0) {
            for (const flag of context.deprecatedFlags) {
                lines.push(chalk.yellowBright(`    - ${flag} [deprecated]`));
            }
        }
        // Ignored flags
        if (context.ignoredFlags && context.ignoredFlags.length > 0) {
            for (const flag of context.ignoredFlags) {
                lines.push(chalk.yellowBright(`    - ${flag} [ignored]`));
            }
        }
    }

    // Tips
    lines.push('');
    lines.push(chalk.bgWhiteBright.gray(explainSentences.tipHuman()));
    lines.push(chalk.bgWhiteBright.gray(explainSentences.tipJson()));

    // Always print the summarySuccess phrase at the end for test compatibility
    lines.push(chalk.bgGreenBright.black.bold(explainSentences.summarySuccess()));

    // Wrap all in a single box with a blue gradient border
    return boxen(lines.join('\n'), {
        padding: 1,
        borderColor: 'blueBright',
        borderStyle: 'round',
        backgroundColor: 'black',
    });
}
