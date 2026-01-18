import { ExplainContext } from '../../types/explainTypes.js';
import chalk from 'chalk';
import boxen from 'boxen';

export function explainHumanTemplate(context: ExplainContext): string {
    let lines: string[] = [];

    // Header
    lines.push(chalk.bgBlueBright.white.bold('  EXPLANATION  '));

    // Summary
    if (context.summary) {
        lines.push(chalk.bgCyanBright.black.bold(' Summary: ') + chalk.bgCyanBright.white(' ' + context.summary + ' '));
    }

    // Explain-only mode
    if (context.explainOnly) {
        lines.push(chalk.bgYellow.black.bold(' [explain-only] No files were modified. '));
    }

    // Context enrichment
        function safe(val: any): string {
            if (val === null || val === undefined || (typeof val === 'number' && Number.isNaN(val))) return 'N/A';
            if (typeof val === 'function') return '[function]';
            return String(val);
        }
        lines.push(chalk.bgWhiteBright.gray(
            ` Timestamp: ${safe(context.timestamp)} | User: ${safe(context.user)} | Platform: ${safe(context.platform)} | Mode: ${safe(context.mode)} `
        ));

    // Plugin/command info
    if (context.plugin) {
        lines.push(chalk.bgWhiteBright.blue.bold(` This command uses the "${context.plugin}" plugin. `));
    }

    // What will happen
    lines.push('');
    lines.push(chalk.bgGreenBright.black.bold(' What will happen: '));
    if (context.decisions && context.decisions.length > 0) {
        for (const d of context.decisions) {
                let valueStr = safe(d.value);
            if (typeof valueStr === 'function') valueStr = '[function]';
            let src = d.provenance || d.reason || '';
            lines.push(chalk.greenBright(`  • ${d.key}: ${valueStr} (${src})`));
        }
    } else {
        lines.push(chalk.greenBright('  • The command will use default settings.'));
    }

    // Why these choices were made
    if (context.decisions && context.decisions.length > 0) {
        lines.push('');
        lines.push(chalk.bgCyanBright.black.bold(' Why these choices were made: '));
        for (const d of context.decisions) {
            let src = d.provenance || d.reason || '';
            lines.push(chalk.cyanBright(`  • ${d.key}: ${src}`));
        }
    }

    // Result/Outcome
    if (context.outcome && context.outcome.result) {
        lines.push('');
        lines.push(chalk.bgYellowBright.black.bold(' Result: '));
            let resultValue = safe(context.outcome.result);
        if (typeof resultValue === 'function') resultValue = '[function]';
        lines.push(chalk.yellowBright(`  • ${resultValue}`));
        if (context.outcome.sideEffects && Array.isArray(context.outcome.sideEffects) && context.outcome.sideEffects.length > 0) {
            for (const s of context.outcome.sideEffects) {
                    let side = safe(s);
                if (typeof side === 'function') side = '[function]';
                lines.push(chalk.yellowBright(`  • ${side}`));
            }
        }
    }

    // Placeholders for Tier 3/4
    if (context.schemaVersion) {
        lines.push(chalk.bgGray.white(`[schemaVersion: ${context.schemaVersion}]`));
    }
    if (context.exitCode !== undefined) {
        lines.push(chalk.bgGray.white(`[exitCode: ${context.exitCode} // placeholder for future validation logic]`));
    }
    if (context.outcome && context.outcome.confidence) {
        lines.push(chalk.bgGray.white(`[confidence: ${context.outcome.confidence} // placeholder for future confidence logic]`));
    }

    // What will NOT happen
    if (context.outcome && context.outcome.whatWillNotHappen) {
        lines.push('');
        lines.push(chalk.bgRedBright.white.bold(' What will NOT happen: '));
        for (const n of context.outcome.whatWillNotHappen) {
            lines.push(chalk.redBright(`  • ${n}`));
        }
    }

    // Custom plugin sections
    if (context.customSections && Array.isArray(context.customSections)) {
        for (const section of context.customSections) {
            if (section.items && section.items.length > 0) {
                lines.push('');
                lines.push(chalk.bgMagentaBright.white.bold(` ${section.title} `));
                for (const item of section.items) {
                    let safeItem = (typeof item === 'function') ? '[function]' : item;
                    lines.push(chalk.magentaBright(`  • ${safeItem}`));
                }
            }
        }
    }

    // Tip
    lines.push('');
    lines.push(chalk.bgWhiteBright.gray(' Tip: Use --explain=details for a technical breakdown. '));

    // Wrap all in a single box with a blue gradient border
    return boxen(lines.join('\n'), {
        padding: 1,
        borderColor: 'blueBright',
        borderStyle: 'round',
        backgroundColor: 'black',
    });
}
