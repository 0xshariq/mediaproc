
import { ExplainContext } from '../../types/explainTypes.js';
import chalk from 'chalk';
import boxen from 'boxen';

export function explainHumanTemplate(context: ExplainContext): string {
    let sections: string[] = [];

    // Header
    sections.push(boxen('EXPLANATION', { padding: 1, borderColor: 'blueBright', borderStyle: 'round', align: 'center', backgroundColor: 'blue' }));

    // Explain-only mode
    if (context.explainOnly) {
        sections.push(boxen('EXPLAIN-ONLY MODE: No command will be executed', { borderColor: 'yellow', borderStyle: 'classic', backgroundColor: 'yellow', padding: 0, margin: 0 }));
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
    if (context.plugin) {
        sections.push(chalk.bold(`This command uses the "${context.plugin}" plugin.`));
    }

    // Dynamic: Decisions/What will happen
    let whatWillHappen = chalk.bold.underline('What will happen:') + '\n';
    if (context.decisions && context.decisions.length > 0) {
        for (const d of context.decisions) {
            let valueStr = (d.value === undefined || Number.isNaN(d.value)) ? 'N/A' : d.value;
            // Prevent function display
            if (typeof valueStr === 'function') valueStr = '[function]';
            whatWillHappen += chalk.green(`• ${d.key} will be set to ${valueStr}`) + '\n';
        }
    } else {
        whatWillHappen += chalk.green('• The command will use default settings.') + '\n';
    }
    sections.push(boxen(whatWillHappen.trim(), { borderColor: 'green', borderStyle: 'round' }));

    // Dynamic: Result/Outcome
    if (context.outcome && context.outcome.result) {
        let resultSection = chalk.bold.underline('Result:') + '\n';
        let resultValue = context.outcome.result;
        if (typeof resultValue === 'function') resultValue = '[function]';
        resultSection += chalk.yellow(`• ${resultValue}`) + '\n';
        if (context.outcome.sideEffects && Array.isArray(context.outcome.sideEffects) && context.outcome.sideEffects.length > 0) {
            for (const s of context.outcome.sideEffects) {
                let side = s;
                if (typeof side === 'function') side = '[function]';
                resultSection += chalk.yellow(`• ${side}`) + '\n';
            }
        }
        sections.push(boxen(resultSection.trim(), { borderColor: 'yellow', borderStyle: 'round' }));
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
                sections.push(boxen(custom.trim(), { borderColor: 'cyan', borderStyle: 'round' }));
            }
        }
    }

    // Tip
    sections.push(chalk.gray('Tip: Use --explain=details for a technical breakdown.'));

    return sections.join('\n\n');
}
