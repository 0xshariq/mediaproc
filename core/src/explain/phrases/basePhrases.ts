import { CommonPhrases } from '../../types/explainTypes.js';
import { COMMON_PHRASES } from '../constants/commonPhrases.js';

// Plugin-specific phrase overrides
const PLUGIN_PHRASES: Record<string, Partial<CommonPhrases>> = {};

/**
 * Register or override phrases for a plugin.
 * @param pluginName The plugin name (string)
 * @param phrases An object of phrase overrides (same shape as COMMON_PHRASES)
 */
export function registerPluginPhrases(pluginName: string, phrases: Partial<CommonPhrases>) {
    PLUGIN_PHRASES[pluginName] = {
        ...(PLUGIN_PHRASES[pluginName] || {}),
        ...phrases,
    };
}

/**
 * Lookup a phrase, checking plugin overrides first.
 * @param key The phrase key (string)
 * @param pluginName Optional plugin name for override lookup
 */
export function getPhrase<K extends keyof CommonPhrases>(key: K, pluginName?: string): CommonPhrases[K] {
    if (pluginName && PLUGIN_PHRASES[pluginName] && PLUGIN_PHRASES[pluginName][key]) {
        return PLUGIN_PHRASES[pluginName][key] as CommonPhrases[K];
    }
    return COMMON_PHRASES[key];
}