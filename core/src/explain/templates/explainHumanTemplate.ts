import { ExplainContext } from '../../types/explainTypes.js';
import chalk from 'chalk';
import boxen from 'boxen';
import { explainSentences } from '../explainSentences.js';

export function explainHumanTemplate(context: ExplainContext): string {
    let lines: string[] = [];
    lines.push(chalk.bgBlueBright.white.bold(explainSentences.header()));

    // One-line summary at top (anchor)
    if (context.summary && context.inputs && context.outputs) {
        const inputCount = context.inputs ? Object.keys(context.inputs).length : 0;
        const fileType = context.inputs && inputCount > 0 ? Object.keys(context.inputs)[0] : 'file';
        const operation = context.command || 'processed';
        const outputPath = context.outputs && Object.values(context.outputs)[0] ? String(Object.values(context.outputs)[0]) : 'output';
        lines.push('');
        lines.push(chalk.bold.cyan(explainSentences.summary(inputCount, fileType, operation, outputPath)));
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
        lines.push(chalk.greenBright(explainSentences.actions(context.effects)));
    }

    // What will NOT happen (assumptions)
    if (context.outcome && context.outcome.whatWillNotHappen && context.outcome.whatWillNotHappen.length > 0) {
        lines.push('');
        lines.push(chalk.bgRedBright.white.bold(explainSentences.whatWillNotHappenHeader()));
        for (const n of context.outcome.whatWillNotHappen) {
            lines.push(chalk.redBright(`  • ${n}`));
        }
    }

    // Flags used (if any)
    if (context.usedFlags && Object.keys(context.usedFlags).length > 0) {
        lines.push('');
        lines.push(chalk.bgGray.white.bold(explainSentences.flagsUsedHeader()));
        const flagsArr = Object.entries(context.usedFlags).map(([name, v]) => ({ name, value: v.value, source: v.source }));
        lines.push(chalk.gray(explainSentences.flagsResolved(flagsArr)));
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
