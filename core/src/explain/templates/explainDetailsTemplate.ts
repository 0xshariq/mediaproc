
import { ExplainContext } from '../../types/explainTypes.js';
import chalk from 'chalk';
import boxen from 'boxen';
import { explainSentences } from '../explainSentences.js';

export function explainDetailsTemplate(context: ExplainContext): string {
    function safe(val: any): string {
        if (val === null || val === undefined || (typeof val === 'number' && Number.isNaN(val))) return 'N/A';
        if (typeof val === 'function') return '[function]';
        return String(val);
    }
    let lines: string[] = [];


    // Gradient header
        lines.push(
            chalk.bgMagentaBright.white.bold(explainSentences.detailsHeader())
        );

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
        lines.push(
            chalk.bgYellow.black.bold(explainSentences.explainOnly())
        );
    }

    // Overview and command info (technical context)
    if (context.plugin && context.mode && context.inputs) {
        const inputCount = context.inputs ? Object.keys(context.inputs).length : 0;
        const fileType = context.inputs && inputCount > 0 ? Object.keys(context.inputs)[0] : 'file';
            lines.push(chalk.bgWhiteBright.gray(explainSentences.technicalContext(context.plugin, String(context.mode), inputCount, fileType)));
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

    // Execution workflow (step-by-step)
    if (context.explainFlow && Array.isArray(context.explainFlow) && context.explainFlow.length > 0) {
        const steps = context.explainFlow.map(f => f.step);
        lines.push('');
            lines.push(chalk.bgCyanBright.black.bold(explainSentences.technicalWorkflowHeader()));
            lines.push(chalk.cyanBright(explainSentences.executionWorkflow(steps)));
    }

    // Overview: What will NOT happen (assumptions)
    if (context.outcome && context.outcome.whatWillNotHappen && context.outcome.whatWillNotHappen.length > 0) {
        lines.push('');
            lines.push(chalk.bgRedBright.white.bold(explainSentences.whatWillNotHappenHeader()));
        for (const n of context.outcome.whatWillNotHappen) {
            lines.push(chalk.redBright(`  • ${n}`));
        }
    }

    // Flags resolved
    if (context.usedFlags && Object.keys(context.usedFlags).length > 0) {
        lines.push('');
            lines.push(chalk.bgGray.white.bold(explainSentences.flagsUsedHeader()));
            const flagsArr = Object.entries(context.usedFlags).map(([name, v]) => ({ name, value: v.value, source: v.source }));
            lines.push(chalk.gray(explainSentences.flagsResolved(flagsArr)));
    }
    if (context.omittedFlags && Object.keys(context.omittedFlags).length > 0) {
        lines.push(chalk.bgGray.white.bold(' Omitted/Unused Flags:'));
        for (const [k, v] of Object.entries(context.omittedFlags)) {
            lines.push(chalk.gray(`    - ${k}: default=${safe(v.defaultValue)} (${v.source})`));
        }
    }
    if (context.deprecatedFlags && context.deprecatedFlags.length > 0) {
        lines.push(chalk.bgYellowBright.black.bold(' Deprecated Flags:'));
        for (const flag of context.deprecatedFlags) {
            lines.push(chalk.yellowBright(`    - ${flag}`));
        }
    }
    if (context.ignoredFlags && context.ignoredFlags.length > 0) {
        lines.push(chalk.bgYellowBright.black.bold(' Ignored Flags:'));
        for (const flag of context.ignoredFlags) {
            lines.push(chalk.yellowBright(`    - ${flag}`));
        }
    }

    // Errors and warnings
    if (context.outcome && Array.isArray(context.outcome.errors) && context.outcome.errors.length > 0) {
        lines.push('');
        lines.push(chalk.bgRedBright.white.bold(' Errors: '));
        for (const err of context.outcome.errors) {
            lines.push(chalk.redBright(`  - ${safe(err)}`));
        }
    }
    if (context.outcome && Array.isArray(context.outcome.warnings) && context.outcome.warnings.length > 0) {
        lines.push('');
        lines.push(chalk.bgYellowBright.black.bold(' Warnings: '));
        for (const warn of context.outcome.warnings) {
            lines.push(chalk.yellowBright(`  - ${safe(warn)}`));
        }
    }

    // Technical details
    if (context.technical && typeof context.technical === 'object' && Object.keys(context.technical).length > 0) {
        lines.push('');
            lines.push(chalk.bgMagentaBright.white.bold(explainSentences.technicalDetailsHeader()));
        const detailsArr = Object.entries(context.technical).map(([k, v]) => `${k}: ${v}`);
        lines.push(chalk.gray(explainSentences.technicalDetails(detailsArr)));
    }

    // ...removed environment dump from details mode as per v1 plan...

    // Custom plugin sections
    if (context.customSections && Array.isArray(context.customSections)) {
        for (const section of context.customSections) {
            if (section.items && section.items.length > 0) {
                lines.push('');
                lines.push(chalk.bgMagentaBright.white.bold(` ${section.title} `));
                for (const item of section.items) {
                    let safeItem = (typeof item === 'function') ? '[function]' : safe(item);
                    lines.push(chalk.magentaBright(`  • ${safeItem}`));
                }
            }
        }
    }

    // ...removed diagram placeholder and related code as per v1 plan...

    // Tips
    lines.push('');
    lines.push(chalk.bgWhiteBright.gray(explainSentences.tipDetails()));
    lines.push(chalk.bgWhiteBright.gray(explainSentences.tipJson()));

    // Always print the summary/result phrase at the end
    // Always print the summarySuccess phrase at the end for test compatibility
    lines.push(chalk.bgGreenBright.black.bold(explainSentences.summarySuccess()));

    // Wrap all in a single box with a magenta border
    return boxen(lines.join('\n'), {
        padding: 1,
        borderColor: 'magenta',
        borderStyle: 'round',
        backgroundColor: 'black',
    });
}
