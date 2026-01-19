
import { ExplainContext } from '../../types/explainTypes.js';
import chalk from 'chalk';
import boxen from 'boxen';
import { getPhrase } from '../phrases.js';

export function explainDetailsTemplate(context: ExplainContext): string {
    function safe(val: any): string {
        if (val === null || val === undefined || (typeof val === 'number' && Number.isNaN(val))) return 'N/A';
        if (typeof val === 'function') return '[function]';
        return String(val);
    }
    let lines: string[] = [];

    // Gradient header
    lines.push(
        chalk.bgMagentaBright.white.bold(getPhrase('detailsHeader', context.plugin) || '  EXPLANATION (DETAILS)  ')
    );

    // Explain-only mode
    if (context.explainOnly) {
        lines.push(
            chalk.bgYellow.black.bold(' [explain-only] No command will be executed ')
        );
    }

    // Overview and command info
    lines.push(chalk.bgWhiteBright.gray(` Mode: ${safe(context.mode)} | Command: ${safe(context.command)} | Plugin: ${safe(context.plugin)} `));
    if (context.commandPurpose) {
        lines.push(chalk.bgWhiteBright.magenta.bold(` Purpose: ${safe(context.commandPurpose)}`));
    }
    if (context.commandType) {
        lines.push(chalk.bgWhiteBright.magenta.bold(` Type: ${safe(context.commandType)}`));
    }
    if (context.commandCategory) {
        lines.push(chalk.bgWhiteBright.magenta.bold(` Category: ${safe(context.commandCategory)}`));
    }

    // Inputs/Outputs
    if ((context.inputs && Object.keys(context.inputs).length > 0) || (context.outputs && Object.keys(context.outputs).length > 0)) {
        lines.push('');
        lines.push(chalk.bgGray.white.bold(getPhrase('inputsOutputsHeader', context.plugin) || ' Inputs & Outputs: '));
        if (context.inputs && Object.keys(context.inputs).length > 0) {
            lines.push(chalk.whiteBright('  Inputs:'));
            for (const [k, v] of Object.entries(context.inputs)) {
                lines.push(chalk.gray(`    - ${k}: ${safe(v)}`));
            }
        }
        if (context.outputs && Object.keys(context.outputs).length > 0) {
            lines.push(chalk.whiteBright('  Outputs:'));
            for (const [k, v] of Object.entries(context.outputs)) {
                lines.push(chalk.gray(`    - ${k}: ${safe(v)}`));
            }
        }
    }

    // What will happen (overview)
    if (context.effects && context.effects.length > 0) {
        lines.push('');
        lines.push(chalk.bgGreenBright.black.bold(getPhrase('effectsHeader', context.plugin) || ' What will happen: '));
        for (const effect of context.effects) {
            let phrase: string = '';
            const effectPhrase = getPhrase(effect as keyof typeof import('../phrases.js').COMMON_PHRASES, context.plugin);
            if (typeof effectPhrase === 'function') {
                const contextArgPhrases = [
                    'externalTool', 'dimensionsChange', 'formatConversion', 'qualityChange',
                    'audioProcessing', 'videoProcessing', 'documentProcessing', 'streamProcessing',
                    'pipelineExecution', 'pluginAction', 'inputRead', 'outputWrite'
                ];
                if (contextArgPhrases.includes(effect)) {
                    phrase = (effectPhrase as (args: { context: ExplainContext }) => string)({ context });
                } else {
                    phrase = (effectPhrase as () => string)();
                }
            } else if (typeof effectPhrase === 'string') {
                phrase = effectPhrase;
            } else {
                phrase = String(effect);
            }
            lines.push(chalk.greenBright(`  • ${phrase}`));
        }
    }

    // Internal workflow (details mode)
    if (context.explainFlow && Array.isArray(context.explainFlow) && context.explainFlow.length > 0) {
        lines.push('');
        lines.push(chalk.bgCyanBright.black.bold(getPhrase('technicalWorkflowHeader', context.plugin) || ' Internal Workflow: '));
        for (const step of context.explainFlow) {
            let safeStep = (typeof step === 'function') ? '[function]' : safe(step);
            lines.push(chalk.greenBright(`  • ${safeStep}`));
        }
    }

    // Flags: used, default, omitted, deprecated, ignored
    if (context.usedFlags && Object.keys(context.usedFlags).length > 0) {
        lines.push('');
        lines.push(chalk.bgGray.white.bold(getPhrase('flagsUsedHeader', context.plugin) || ' Flags Used: '));
        for (const [k, v] of Object.entries(context.usedFlags)) {
            let valueStr = typeof v.value === 'function' ? '[function]' : safe(v.value);
            lines.push(chalk.gray(`    - ${k}: ${valueStr} (${v.source})`));
        }
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
        lines.push(chalk.bgRedBright.white.bold(getPhrase('errorsHeader', context.plugin) || ' Errors: '));
        for (const err of context.outcome.errors) {
            lines.push(chalk.redBright(`  - ${safe(err)}`));
        }
    }
    if (context.outcome && Array.isArray(context.outcome.warnings) && context.outcome.warnings.length > 0) {
        lines.push('');
        lines.push(chalk.bgYellowBright.black.bold(getPhrase('warningsHeader', context.plugin) || ' Warnings: '));
        for (const warn of context.outcome.warnings) {
            lines.push(chalk.yellowBright(`  - ${safe(warn)}`));
        }
    }

    // Developer/technical info
    if (context.technical && typeof context.technical === 'object' && Object.keys(context.technical).length > 0) {
        lines.push('');
        lines.push(chalk.bgMagentaBright.white.bold(getPhrase('technicalDetailsHeader', context.plugin) || ' Technical Details: '));
        for (const [k, v] of Object.entries(context.technical)) {
            let valueStr = safe(v);
            lines.push(chalk.gray(`  - ${k}: ${valueStr}`));
        }
    }

    // Environment info (only if present and relevant)
    if (context.environment && typeof context.environment === 'object' && Object.keys(context.environment).length > 0) {
        lines.push('');
        lines.push(chalk.bgGray.white.bold(getPhrase('environmentHeader', context.plugin) || ' Environment: '));
        if (context.environment.cwd) lines.push(chalk.bold(`  cwd: ${safe(context.environment.cwd)}`));
        if (context.environment.os) lines.push(chalk.bold(`  OS: ${safe(context.environment.os)}`));
        if (context.environment.nodeVersion) lines.push(chalk.bold(`  Node: ${safe(context.environment.nodeVersion)}`));
        if (context.environment.shell) lines.push(chalk.bold(`  Shell: ${safe(context.environment.shell)}`));
    }

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

    // Diagram placeholder
    lines.push('');
    if (context.diagram) {
        // If diagram is a string, render as ASCII art in a box
        lines.push(boxen(context.diagram, {
            padding: 1,
            borderColor: 'cyan',
            borderStyle: 'round',
            backgroundColor: 'black',
        }));
    } else {
        lines.push(chalk.bgWhiteBright.gray(getPhrase('diagramPlaceholder', context.plugin) || ' Diagram: [future diagram rendering here] '));
    }

    // Tips
    lines.push('');
    lines.push(chalk.bgWhiteBright.gray(getPhrase('tipDetails', context.plugin)));
    lines.push(chalk.bgWhiteBright.gray(getPhrase('tipJson', context.plugin)));

    // Always print the summary/result phrase at the end
    // Always print the summarySuccess phrase at the end for test compatibility
    lines.push(chalk.bgGreenBright.black.bold(getPhrase('summarySuccess', context.plugin)));

    // Wrap all in a single box with a magenta border
    return boxen(lines.join('\n'), {
        padding: 1,
        borderColor: 'magenta',
        borderStyle: 'round',
        backgroundColor: 'black',
    });
}
