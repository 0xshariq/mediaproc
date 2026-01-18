
import { ExplainContext } from '../../types/explainTypes.js';
import chalk from 'chalk';
import boxen from 'boxen';

export function explainDetailsTemplate(context: ExplainContext): string {
    function safe(val: any): string {
        if (val === null || val === undefined || (typeof val === 'number' && Number.isNaN(val))) return 'N/A';
        if (typeof val === 'function') return '[function]';
        return String(val);
    }
    let lines: string[] = [];

    // Gradient header
    lines.push(
        chalk.bgMagentaBright.white.bold('  EXPLANATION (DETAILS)  ')
    );

    // Explain-only mode
    if (context.explainOnly) {
        lines.push(
            chalk.bgYellow.black.bold(' [explain-only] No command will be executed ')
        );
    }

    // Context enrichment
    lines.push(
        chalk.bgWhiteBright.gray(
            ` Timestamp: ${safe(context.timestamp)} | User: ${safe(context.user)} | Platform: ${safe(context.platform)} | Mode: ${safe(context.mode)} `
        )
    );

    // Plugin/command info
    if (context.plugin || context.cliVersion || context.pluginVersion) {
        lines.push(
            chalk.bgWhiteBright.magenta.bold(` Plugin: ${safe(context.plugin)} | CLI Version: ${safe(context.cliVersion)} | Plugin Version: ${safe(context.pluginVersion)} `)
        );
    }

    // Inputs/Outputs
    if ((context.inputs && Object.keys(context.inputs).length > 0) || (context.outputs && Object.keys(context.outputs).length > 0)) {
        lines.push('');
        lines.push(chalk.bgGray.white.bold(' Inputs & Outputs: '));
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

    // Technical workflow
    if (context.explainFlow && Array.isArray(context.explainFlow) && context.explainFlow.length > 0) {
        lines.push('');
        lines.push(chalk.bgCyanBright.black.bold(' Technical Workflow: '));
        for (const step of context.explainFlow) {
            let safeStep = (typeof step === 'function') ? '[function]' : safe(step);
            lines.push(chalk.greenBright(`  • ${safeStep}`));
        }
    }

    // Flags used
    if (context.usedFlags && Object.keys(context.usedFlags).length > 0) {
        lines.push('');
        lines.push(chalk.bgGray.white.bold(' Flags Used: '));
        const userFlags = Object.entries(context.usedFlags).filter(([_, v]) => v.source === 'user');
        const defaultFlags = Object.entries(context.usedFlags).filter(([_, v]) => v.source === 'default');
        const systemFlags = Object.entries(context.usedFlags).filter(([_, v]) => v.source === 'system');
        if (userFlags.length > 0) {
            lines.push(chalk.bold('  User Flags:'));
            for (const [k, v] of userFlags) {
                let valueStr = safe(v.value);
                lines.push(chalk.gray(`    - ${k}: ${valueStr}`));
            }
        }
        if (defaultFlags.length > 0) {
            lines.push(chalk.bold('  Default Flags:'));
            for (const [k, v] of defaultFlags) {
                let valueStr = safe(v.value);
                lines.push(chalk.gray(`    - ${k}: ${valueStr}`));
            }
        }
        if (systemFlags.length > 0) {
            lines.push(chalk.bold('  System Flags:'));
            for (const [k, v] of systemFlags) {
                let valueStr = safe(v.value);
                lines.push(chalk.gray(`    - ${k}: ${valueStr}`));
            }
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

    // Developer/technical info
    if (context.technical && typeof context.technical === 'object' && Object.keys(context.technical).length > 0) {
        lines.push('');
        lines.push(chalk.bgMagentaBright.white.bold(' Technical Details: '));
        for (const [k, v] of Object.entries(context.technical)) {
            let valueStr = safe(v);
            lines.push(chalk.gray(`  - ${k}: ${valueStr}`));
        }
    }

    // Environment info
    if (context.environment && typeof context.environment === 'object') {
        lines.push('');
        lines.push(chalk.bgGray.white.bold(' Environment: '));
        lines.push(chalk.bold(`  cwd: ${safe(context.environment.cwd)}`));
        lines.push(chalk.bold(`  OS: ${safe(context.environment.os)}`));
        lines.push(chalk.bold(`  Node: ${safe(context.environment.nodeVersion)}`));
        lines.push(chalk.bold(`  Shell: ${safe(context.environment.shell)}`));
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
    lines.push(chalk.bgWhiteBright.gray(' Diagram: [future diagram rendering here] '));

    // Tip
    lines.push('');
    lines.push(chalk.bgWhiteBright.gray(' Tip: Use --explain for a simple summary. '));

    // Wrap all in a single box with a magenta border
    return boxen(lines.join('\n'), {
        padding: 1,
        borderColor: 'magenta',
        borderStyle: 'round',
        backgroundColor: 'black',
    });
}
