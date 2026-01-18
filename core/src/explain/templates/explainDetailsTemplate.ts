
import { ExplainContext } from '../../types/explainTypes.js';
import chalk from 'chalk';
import boxen from 'boxen';

export function explainDetailsTemplate(context: ExplainContext): string {
    let sections: string[] = [];

    // Header
    sections.push(boxen('EXPLANATION (DETAILS)', {padding: 1, borderColor: 'magenta', borderStyle: 'round', align: 'center', backgroundColor: 'magenta'}));

    // Explain-only mode
    if (context.explainOnly) {
        sections.push(boxen('EXPLAIN-ONLY MODE: No command will be executed', {borderColor: 'yellow', borderStyle: 'classic', backgroundColor: 'yellow', padding: 0, margin: 0}));
    }

    // Context enrichment
    const contextInfo = [
        `Timestamp: ${context.timestamp ?? 'N/A'}`,
        `User: ${context.user ?? 'N/A'}`,
        `Platform: ${context.platform ?? 'N/A'}`,
        `Mode: ${context.mode ?? 'N/A'}`
    ].join(' | ');
    sections.push(chalk.gray(contextInfo));

    // Plugin/command info
    if (context.plugin || context.cliVersion || context.pluginVersion) {
        sections.push(chalk.bold(`Plugin: ${context.plugin || 'N/A'} | CLI Version: ${context.cliVersion || 'N/A'} | Plugin Version: ${context.pluginVersion || 'N/A'}`));
    }

    // Inputs/Outputs
    if ((context.inputs && Object.keys(context.inputs).length > 0) || (context.outputs && Object.keys(context.outputs).length > 0)) {
        let io = '';
        if (context.inputs && Object.keys(context.inputs).length > 0) {
            io += chalk.whiteBright('Inputs:') + '\n';
            for (const [k, v] of Object.entries(context.inputs)) {
                io += chalk.gray(`  - ${k}: ${v}`) + '\n';
            }
        }
        if (context.outputs && Object.keys(context.outputs).length > 0) {
            io += chalk.whiteBright('Outputs:') + '\n';
            for (const [k, v] of Object.entries(context.outputs)) {
                io += chalk.gray(`  - ${k}: ${v}`) + '\n';
            }
        }
        sections.push(boxen(io.trim(), {borderColor: 'gray', borderStyle: 'round'}));
    }

    // Technical workflow
    if (context.explainFlow && Array.isArray(context.explainFlow) && context.explainFlow.length > 0) {
        let flow = chalk.bold.underline(chalk.cyan('Technical Workflow:')) + '\n';
        for (const step of context.explainFlow) {
            let safeStep = (typeof step === 'function') ? '[function]' : step;
            flow += chalk.greenBright(`• ${safeStep}`) + '\n';
        }
        sections.push(boxen(flow.trim(), {borderColor: 'cyan', borderStyle: 'round'}));
    }

    // Flags used
    if (context.usedFlags && Object.keys(context.usedFlags).length > 0) {
        let flags = chalk.bold.underline(chalk.cyan('Flags Used:')) + '\n';
        const userFlags = Object.entries(context.usedFlags).filter(([_, v]) => v.source === 'user');
        const defaultFlags = Object.entries(context.usedFlags).filter(([_, v]) => v.source === 'default');
        const systemFlags = Object.entries(context.usedFlags).filter(([_, v]) => v.source === 'system');
        if (userFlags.length > 0) {
            flags += chalk.bold('User Flags:') + '\n';
            for (const [k, v] of userFlags) {
                let valueStr = (v.value === undefined || Number.isNaN(v.value)) ? 'N/A' : v.value;
                if (typeof valueStr === 'function') valueStr = '[function]';
                flags += chalk.gray(`  - ${k}: ${valueStr}`) + '\n';
            }
        }
        if (defaultFlags.length > 0) {
            flags += chalk.bold('Default Flags:') + '\n';
            for (const [k, v] of defaultFlags) {
                let valueStr = (v.value === undefined || Number.isNaN(v.value)) ? 'N/A' : v.value;
                if (typeof valueStr === 'function') valueStr = '[function]';
                flags += chalk.gray(`  - ${k}: ${valueStr}`) + '\n';
            }
        }
        if (systemFlags.length > 0) {
            flags += chalk.bold('System Flags:') + '\n';
            for (const [k, v] of systemFlags) {
                let valueStr = (v.value === undefined || Number.isNaN(v.value)) ? 'N/A' : v.value;
                if (typeof valueStr === 'function') valueStr = '[function]';
                flags += chalk.gray(`  - ${k}: ${valueStr}`) + '\n';
            }
        }
        sections.push(boxen(flags.trim(), {borderColor: 'gray', borderStyle: 'round'}));
    }

    // Errors and warnings
    if (context.outcome && Array.isArray(context.outcome.errors) && context.outcome.errors.length > 0) {
        let errSection = chalk.redBright.bold('Errors:') + '\n';
        for (const err of context.outcome.errors) {
            errSection += chalk.redBright(`  - ${err}`) + '\n';
        }
        sections.push(boxen(errSection.trim(), {borderColor: 'red', borderStyle: 'round'}));
    }
    if (context.outcome && Array.isArray(context.outcome.warnings) && context.outcome.warnings.length > 0) {
        let warnSection = chalk.yellowBright.bold('Warnings:') + '\n';
        for (const warn of context.outcome.warnings) {
            warnSection += chalk.yellowBright(`  - ${warn}`) + '\n';
        }
        sections.push(boxen(warnSection.trim(), {borderColor: 'yellow', borderStyle: 'round'}));
    }

    // Developer/technical info
    if (context.technical && typeof context.technical === 'object' && Object.keys(context.technical).length > 0) {
        let tech = chalk.bold('Technical Details:') + '\n';
        for (const [k, v] of Object.entries(context.technical)) {
            let valueStr = (v === undefined || Number.isNaN(v)) ? 'N/A' : v;
            if (typeof valueStr === 'function') valueStr = '[function]';
            tech += chalk.gray(`  - ${k}: ${valueStr}`) + '\n';
        }
        sections.push(boxen(tech.trim(), {borderColor: 'magenta', borderStyle: 'round'}));
    }

    // Environment info
    if (context.environment && typeof context.environment === 'object') {
        let env = chalk.bold('Environment:') + '\n';
        env += chalk.bold(`  cwd: ${context.environment.cwd ?? 'N/A'}`) + '\n';
        env += chalk.bold(`  OS: ${context.environment.os ?? 'N/A'}`) + '\n';
        env += chalk.bold(`  Node: ${context.environment.nodeVersion ?? 'N/A'}`) + '\n';
        env += chalk.bold(`  Shell: ${context.environment.shell ?? 'N/A'}`) + '\n';
        sections.push(boxen(env.trim(), {borderColor: 'gray', borderStyle: 'round'}));
    }

    // Custom plugin sections
    if (context.customSections && Array.isArray(context.customSections)) {
        for (const section of context.customSections) {
            if (section.items && section.items.length > 0) {
                let custom = chalk.bold.underline(section.title) + '\n';
                for (const item of section.items) {
                    let safeItem = (typeof item === 'function') ? '[function]' : item;
                    custom += chalk.cyan(`• ${safeItem}`) + '\n';
                }
                sections.push(boxen(custom.trim(), {borderColor: 'cyan', borderStyle: 'round'}));
            }
        }
    }

    // Diagram placeholder
    sections.push(boxen(chalk.gray('Diagram: [future diagram rendering here]'), {borderColor: 'white', borderStyle: 'round'}));

    // Tip
    sections.push(chalk.gray('Tip: Use --explain for a simple summary.'));

    return sections.join('\n\n');
}
