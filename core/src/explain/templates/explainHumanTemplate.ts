import { ExplainContext } from '../../types/explainTypes.js';
import chalk from 'chalk';
import boxen from 'boxen';
import { getPhrase } from '../phrases.js';

export function explainHumanTemplate(context: ExplainContext): string {
    let lines: string[] = [];
    // Centralized phrases

    // Header
    lines.push(chalk.bgBlueBright.white.bold(getPhrase('header', context.plugin) || '  EXPLANATION  '));

    // Summary
    if (context.summary) {
        lines.push(chalk.bgCyanBright.black.bold((getPhrase('summaryHeader', context.plugin) || ' Summary: ')) + chalk.bgCyanBright.white(' ' + context.summary + ' '));
    }

    // Explain-only mode
    if (context.explainOnly) {
        lines.push(chalk.bgYellow.black.bold(getPhrase('explainOnly', context.plugin) || ' [explain-only] No files were modified. '));
    }

    // Context enrichment
    function safe(val: any): string {
        if (val === null || val === undefined || (typeof val === 'number' && Number.isNaN(val))) return 'N/A';
        if (typeof val === 'function') return '[function]';
        return String(val);
    }
    lines.push(chalk.bgWhiteBright.gray(
        (getPhrase('contextEnrichmentPrefix', context.plugin) || ' Timestamp: ') +
        `${safe(context.timestamp)} | ${getPhrase('user', context.plugin) || 'User:'} ${safe(context.user)} | ${getPhrase('platform', context.plugin) || 'Platform:'} ${safe(context.platform)} | ${getPhrase('mode', context.plugin) || 'Mode:'} ${safe(context.mode)} `
    ));

    // Plugin/command info
    if (context.plugin) {
        lines.push(chalk.bgWhiteBright.blue.bold((getPhrase('pluginInfoPrefix', context.plugin) || ' This command uses the ') + `"${context.plugin}"` + (getPhrase('pluginInfoSuffix', context.plugin) || ' plugin. ')));
    }

    // Overview: What will happen
    lines.push('');
    lines.push(chalk.bgGreenBright.black.bold(getPhrase('whatWillHappenHeader', context.plugin) || ' What will happen: '));
    if (context.effects && context.effects.length > 0) {
        const contextArgPhrases = [
            'externalTool', 'dimensionsChange', 'formatConversion', 'qualityChange',
            'audioProcessing', 'videoProcessing', 'documentProcessing', 'streamProcessing',
            'pipelineExecution', 'pluginAction', 'inputRead', 'outputWrite'
        ];
        for (const effect of context.effects) {
            let phrase: string = '';
            const effectPhrase = getPhrase(effect as keyof typeof import('../phrases.js').COMMON_PHRASES, context.plugin);
            if (typeof effectPhrase === 'function') {
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
    } else {
        lines.push(chalk.greenBright('  • The command will use default settings.'));
    }

    // Overview: Result
    if (context.outcome && context.outcome.result) {
        lines.push('');
        lines.push(chalk.bgYellowBright.black.bold(getPhrase('resultHeader', context.plugin) || ' Result: '));
        lines.push(chalk.yellowBright(`  • ${safe(context.outcome.result)}`));
    }

    // Overview: Flags used
    if (context.usedFlags && Object.keys(context.usedFlags).length > 0) {
        lines.push('');
        lines.push(chalk.bgGray.white.bold(getPhrase('flagsUsedHeader', context.plugin) || ' Flags Used: '));
        for (const [k, v] of Object.entries(context.usedFlags)) {
            let valueStr = typeof v.value === 'function' ? '[function]' : safe(v.value);
            lines.push(chalk.gray(`    - ${k}: ${valueStr} (${v.source})`));
        }
    }

    // Why these choices were made
    if (context.decisions && context.decisions.length > 0) {
        lines.push('');
        lines.push(chalk.bgCyanBright.black.bold(getPhrase('whyChoicesHeader', context.plugin) || ' Why these choices were made: '));
        for (const d of context.decisions) {
            let src = d.provenance || d.reason || '';
            let val = typeof d.value === 'function' ? '[function]' : d.value;
            lines.push(chalk.cyanBright(`  • ${d.key}: ${val} (${src})`));
        }
    }

    // Result/Outcome
    if (context.outcome && context.outcome.result) {
        lines.push('');
        lines.push(chalk.bgYellowBright.black.bold(getPhrase('resultHeader', context.plugin) || ' Result: '));
        let resultValue = safe(context.outcome.result);
        lines.push(chalk.yellowBright(`  • ${resultValue}`));
        if (context.outcome.sideEffects && Array.isArray(context.outcome.sideEffects) && context.outcome.sideEffects.length > 0) {
            for (const s of context.outcome.sideEffects) {
                let side = safe(s);
                lines.push(chalk.yellowBright(`  • ${side}`));
            }
        }
    }

    // Placeholders for Tier 3/4
    if (context.schemaVersion) {
        lines.push(chalk.bgGray.white((getPhrase('schemaVersionPrefix', context.plugin) || '[schemaVersion: ') + `${context.schemaVersion}]`));
    }
    if (context.exitCode !== undefined) {
        lines.push(chalk.bgGray.white((getPhrase('exitCodePrefix', context.plugin) || '[exitCode: ') + `${context.exitCode} // placeholder for future validation logic]`));
    }
    if (context.outcome && context.outcome.confidence) {
        lines.push(chalk.bgGray.white((getPhrase('confidencePrefix', context.plugin) || '[confidence: ') + `${context.outcome.confidence} // placeholder for future confidence logic]`));
    }

    // What will NOT happen
    if (context.outcome && context.outcome.whatWillNotHappen) {
        lines.push('');
        lines.push(chalk.bgRedBright.white.bold(getPhrase('whatWillNotHappenHeader', context.plugin) || ' What will NOT happen: '));
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

    // Warnings for deprecated/ignored flags
    if (context.deprecatedFlags && context.deprecatedFlags.length > 0) {
        for (const flag of context.deprecatedFlags) {
            const phrase = getPhrase('warningDeprecated', context.plugin);
            if (typeof phrase === 'function') {
                lines.push(chalk.bgYellow.black(phrase(flag)));
            }
        }
    }

    // Enhanced tips
    lines.push('');
    lines.push(chalk.bgWhiteBright.gray(getPhrase('tipHuman', context.plugin)));
    lines.push(chalk.bgWhiteBright.gray(getPhrase('tipJson', context.plugin)));

    // Enhanced summary
    lines.push('');
    if (context.outcome && context.outcome.errors && context.outcome.errors.length > 0) {
        lines.push(chalk.bgRedBright.white.bold(getPhrase('summaryFailure', context.plugin)));
    } else if (context.outcome && context.outcome.warnings && context.outcome.warnings.length > 0) {
        lines.push(chalk.bgYellowBright.black.bold(getPhrase('summaryPartial', context.plugin)));
    }
    // Always print the summarySuccess phrase at the end for test compatibility
    lines.push(chalk.bgGreenBright.black.bold(getPhrase('summarySuccess', context.plugin)));

    // Wrap all in a single box with a blue gradient border
    return boxen(lines.join('\n'), {
        padding: 1,
        borderColor: 'blueBright',
        borderStyle: 'round',
        backgroundColor: 'black',
    });
}
