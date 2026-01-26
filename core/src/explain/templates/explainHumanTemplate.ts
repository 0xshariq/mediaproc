import { ExplainContext } from '../../types/explainTypes.js';
import chalk from 'chalk';
import boxen from 'boxen';
// import { explainSentences } from '../phrases/explainSentences.js'; // Not used

export function explainHumanTemplate(context: ExplainContext): string {
    // Helper to sanitize values for user-facing output
    function displayValue(val: any, fallback: string = 'default'): string {
        if (val === undefined || val === null) return fallback;
        if (val === true) return 'enabled';
        if (val === false) return 'disabled';
        if (Array.isArray(val) && val.length === 0) return 'None';
        if (typeof val === 'object' && val !== null && Object.keys(val).length === 0) return 'None';
        return String(val);
    }
    let lines: string[] = [];

    // === SUMMARY ===
    lines.push('');
    lines.push('=== SUMMARY ===');
    if (context.summary && context.inputs && context.outputs) {
        const inputCount = context.inputs ? Object.keys(context.inputs).length : 0;
        const fileType = context.inputs && inputCount > 0 ? Object.keys(context.inputs)[0] : 'file';
        const outputCount = context.outputs ? Object.keys(context.outputs).length : 0;
        const outputType = context.outputs && outputCount > 0 ? Object.keys(context.outputs)[0] : 'output';
        const operation = context.command || 'processed';
        lines.push(chalk.bold.cyan(`This command will process ${inputCount} ${fileType}${inputCount === 1 ? '' : 's'} and produce ${outputCount} ${outputType}${outputCount === 1 ? '' : 's'} using the '${operation}' operation.`));
    } else if (context.summary) {
        lines.push(chalk.bold.cyan(context.summary));
    }

    // === WHAT WILL HAPPEN ===
    if (context.effects && Array.isArray(context.effects) && context.effects.length > 0) {
        lines.push('');
        lines.push('=== WHAT WILL HAPPEN ===');
        lines.push(chalk.greenBright(
            context.effects
                .map(eff => typeof eff === 'string' && eff.match(/effectNamespace|schemaVersion|processingScope/) ? '' : displayValue(eff))
                .filter(Boolean)
                .join('\n')
        ));
        const techEffects = context.effects
            .filter(eff => typeof eff === 'string' && !eff.match(/effectNamespace|schemaVersion|processingScope/))
            .map(val => displayValue(val));
        if (techEffects.length > 0) {
            lines.push(chalk.gray('Technical Effects: ' + techEffects.join(', ')));
        }
    }

    // === INPUTS ===
    if (context.inputs && (context.inputs.inputPath || context.inputs.filesDetected)) {
        lines.push('');
        lines.push('=== INPUTS ===');
        if (context.inputs.inputPath) {
            lines.push(chalk.gray(`Input path: ${displayValue(context.inputs.inputPath, 'None')}`));
        }
        if (context.inputs.filesDetected) {
            lines.push(chalk.gray(`Files detected: ${displayValue(context.inputs.filesDetected, 'None')}`));
        }
    }

    // === OUTPUTS ===
    if (context.outputs && Object.keys(context.outputs).length > 0) {
        lines.push('');
        lines.push('=== OUTPUTS ===');
        for (const [k, v] of Object.entries(context.outputs)) {
            lines.push(chalk.gray(`${k}: ${displayValue(v, 'None')}`));
        }
    }

    // === FLAGS ===
    if (context.usedFlags && Object.keys(context.usedFlags).length > 0) {
        lines.push('');
        lines.push('=== FLAGS ===');
        const userFlags = Object.entries(context.usedFlags)
            .filter(([_, v]) => v.source === 'user')
            .map(([name, v]) => ` ${name}: ${displayValue(v.value)}`);
        const defaultFlags = Object.entries(context.usedFlags)
            .filter(([_, v]) => v.source !== 'user')
            .map(([name, v]) => ` ${name}: ${displayValue(v.value)}`);
        if (userFlags.length > 0) {
            lines.push('User Flags:');
            lines.push(chalk.gray(userFlags.join('\n')));
        }
        if (defaultFlags.length > 0) {
            lines.push('Default Flags:');
            lines.push(chalk.gray(defaultFlags.join('\n')));
        }
    }

    // === SAFETY ===
    lines.push('');
    lines.push('=== SAFETY ===');
    lines.push(chalk.green('No network access. All processing is local. No telemetry is collected.'));

    // === PROCESSING FLOW ===
    if (context.executionSteps && context.executionSteps.length > 0) {
        lines.push('');
        lines.push('=== PROCESSING FLOW ===');
        for (const step of context.executionSteps) {
            const s = typeof step === 'string' ? step.trim() : '';
            const actionStep = /^[A-Z]/.test(s) ? s : s.charAt(0).toUpperCase() + s.slice(1);
            lines.push('   ' + actionStep);
        }
    }

    // === OUTCOME ===
    if (
        context.outcome &&
        ((Array.isArray(context.outcome.errors) && context.outcome.errors.length > 0) ||
         (Array.isArray(context.outcome.warnings) && context.outcome.warnings.length > 0))
    ) {
        lines.push('');
        lines.push('=== OUTCOME ===');
        if (Array.isArray(context.outcome.errors) && context.outcome.errors.length > 0) {
            lines.push(chalk.red('Errors:'));
            for (const err of context.outcome.errors) {
                lines.push(chalk.red(`  - ${displayValue(err, 'None')}`));
            }
        }
        if (Array.isArray(context.outcome.warnings) && context.outcome.warnings.length > 0) {
            lines.push(chalk.yellow('Warnings:'));
            for (const warn of context.outcome.warnings) {
                lines.push(chalk.yellow(`  - ${displayValue(warn, 'None')}`));
            }
        }
        lines.push(chalk.gray('Result: See above for details.'));
    }

    // === TECHNICAL DETAILS ===
    if (context.technical && typeof context.technical === 'object' && Object.keys(context.technical).length > 0) {
        lines.push('');
        lines.push('=== TECHNICAL DETAILS ===');
        const detailsArr = Object.entries(context.technical)
            .filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'unknown')
            .map(([k, v]) => `${k}: ${displayValue(v)}`);
        if (detailsArr.length > 0) {
            lines.push(chalk.gray(detailsArr.join('\n')));
        }
    }

    // Custom plugin sections
    if (context.customSections && Array.isArray(context.customSections)) {
        for (const section of context.customSections) {
            if (section.items && section.items.length > 0) {
                lines.push('');
                lines.push(chalk.bgMagentaBright.white.bold(` ${section.title} `));
                for (const item of section.items) {
                    let safeItem = (typeof item === 'function') ? '[function]' : displayValue(item);
                    lines.push(chalk.magentaBright(`  ${safeItem}`));
                }
            }
        }
    }

    // Tips
    lines.push('');
    lines.push(chalk.bgWhiteBright.gray('Tip: Use --json for machine-readable output.'));
    lines.push(chalk.bgWhiteBright.gray('Tip: See the documentation for more details.'));

    // Always print the summary/result phrase at the end
    lines.push(chalk.bgGreenBright.black.bold('Operation explained successfully.'));

    // Wrap all in a single box with a magenta border
    return boxen(lines.join('\n'), {
        padding: 1,
        borderColor: 'magenta',
        borderStyle: 'round',
        backgroundColor: 'black',
    });
}
        // Used/user/default flags
