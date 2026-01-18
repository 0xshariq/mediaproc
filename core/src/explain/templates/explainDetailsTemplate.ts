import { ExplainContext } from '../../types/explainTypes.js';
import chalk from 'chalk';

export function explainDetailsTemplate(context: ExplainContext): string {
    let output = '';
    output += chalk.bold.bgMagenta.white('╔════════════════════════════════════════════════════════════════╗') + '\n';
    output += chalk.bold.bgMagenta.white('║                  EXPLANATION (DETAILS)                       ║') + '\n';
    output += chalk.bold.bgMagenta.white('╚════════════════════════════════════════════════════════════════╝') + '\n';
    if (context.explainOnly) {
        output += chalk.bgYellow.black(' [EXPLAIN-ONLY MODE: No command will be executed] ') + '\n';
    }
    // Context enrichment (timestamp, user, platform, mode)
    output += chalk.gray(`Timestamp: ${context.timestamp ?? 'N/A'} | User: ${context.user ?? 'N/A'} | Platform: ${context.platform ?? 'N/A'} | Mode: ${context.mode ?? 'N/A'}`) + '\n';
    if (context.plugin || context.cliVersion || context.pluginVersion) {
        output += chalk.bold(`Plugin: ${context.plugin || 'N/A'} | CLI Version: ${context.cliVersion || 'N/A'} | Plugin Version: ${context.pluginVersion || 'N/A'}`) + '\n';
    }
    // Inputs/Outputs section
    if (context.inputs || context.outputs) {
        output += chalk.bold.bgGray.white('\n──────────────────────── Inputs & Outputs ────────────────────────') + '\n';
        if (context.inputs && Object.keys(context.inputs).length > 0) {
            output += chalk.whiteBright('Inputs:') + '\n';
            for (const [k, v] of Object.entries(context.inputs)) {
                output += chalk.gray(`  - ${k}: ${v}`) + '\n';
            }
        }
        if (context.outputs && Object.keys(context.outputs).length > 0) {
            output += chalk.whiteBright('Outputs:') + '\n';
            for (const [k, v] of Object.entries(context.outputs)) {
                output += chalk.gray(`  - ${k}: ${v}`) + '\n';
            }
        }
    }
    // Technical workflow
    output += chalk.bold.underline(`\n${chalk.cyan('Technical Workflow:')}`) + '\n';
    if (context.explainFlow && Array.isArray(context.explainFlow) && context.explainFlow.length > 0) {
        for (const step of context.explainFlow) {
            output += chalk.greenBright(`• ${step}`) + '\n';
        }
    }
    // Flags used
    output += chalk.bold.underline(`\n${chalk.cyan('Flags Used:')}`) + '\n';
    if (context.usedFlags) {
        const userFlags = Object.entries(context.usedFlags).filter(([_, v]) => v.source === 'user');
        const defaultFlags = Object.entries(context.usedFlags).filter(([_, v]) => v.source === 'default');
        const systemFlags = Object.entries(context.usedFlags).filter(([_, v]) => v.source === 'system');
        if (userFlags.length > 0) {
            output += chalk.bold.bgGray.white('\n──────────────────────────── User Flags ──────────────────────────') + '\n';
            for (const [k, v] of userFlags) {
                let valueStr = (v.value === undefined || Number.isNaN(v.value)) ? 'N/A' : v.value;
                output += chalk.gray(`  - ${k}: ${valueStr}`) + '\n';
            }
        }
        if (defaultFlags.length > 0) {
            output += chalk.bold.bgGray.white('\n─────────────────────────── Default Flags ───────────────────────') + '\n';
            for (const [k, v] of defaultFlags) {
                let valueStr = (v.value === undefined || Number.isNaN(v.value)) ? 'N/A' : v.value;
                output += chalk.gray(`  - ${k}: ${valueStr}`) + '\n';
            }
        }
        if (systemFlags.length > 0) {
            output += chalk.bold.bgGray.white('\n─────────────────────────── System Flags ────────────────────────') + '\n';
            for (const [k, v] of systemFlags) {
                let valueStr = (v.value === undefined || Number.isNaN(v.value)) ? 'N/A' : v.value;
                output += chalk.gray(`  - ${k}: ${valueStr}`) + '\n';
            }
        }
    }
    // Errors and warnings
    if (context.outcome && Array.isArray(context.outcome.errors) && context.outcome.errors.length > 0) {
        output += chalk.redBright.bold('\nErrors:') + '\n';
        for (const err of context.outcome.errors) {
            output += chalk.redBright(`  - ${err}`) + '\n';
        }
    }
    if (context.outcome && Array.isArray(context.outcome.warnings) && context.outcome.warnings.length > 0) {
        output += chalk.yellowBright.bold('\nWarnings:') + '\n';
        for (const warn of context.outcome.warnings) {
            output += chalk.yellowBright(`  - ${warn}`) + '\n';
        }
    }
    // Developer info
    if (context.technical && typeof context.technical === 'object') {
        output += chalk.bold.bgGray.white('\n──────────────────────── Technical Details ──────────────────────') + '\n';
        for (const [k, v] of Object.entries(context.technical)) {
            let valueStr = (v === undefined || Number.isNaN(v)) ? 'N/A' : v;
            output += chalk.gray(`  - ${k}: ${valueStr}`) + '\n';
        }
    }
    if (context.environment && typeof context.environment === 'object') {
        output += chalk.bold.bgGray.white('\n─────────────────────────── Environment ────────────────────────') + '\n';
        output += chalk.bold(`  cwd: ${context.environment.cwd ?? 'N/A'}`) + '\n';
        output += chalk.bold(`  OS: ${context.environment.os ?? 'N/A'}`) + '\n';
        output += chalk.bold(`  Node: ${context.environment.nodeVersion ?? 'N/A'}`) + '\n';
        output += chalk.bold(`  Shell: ${context.environment.shell ?? 'N/A'}`) + '\n';
    }
    output += chalk.gray('\nTip: Use --explain for a simple summary.');
    return output.trim();
}
