import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Configuration structure for MediaProc
 */
export interface MediaProcConfig {
    version: string;
    installedPlugins: string[];      // Plugins installed in package.json
    loadedPlugins: string[];         // Plugins currently loaded in memory
    defaults?: {
        [plugin: string]: {
            [key: string]: any;
        };
    };
    pipelines?: {
        [name: string]: {
            name: string;
            steps: Array<{
                plugin: string;
                command: string;
                options?: Record<string, any>;
            }>;
        };
    };
    lastUpdated?: string;
}

/**
 * Configuration manager for MediaProc
 * Handles reading/writing config from ~/.mediaproc/config.json
 */
export class ConfigManager {
    private static readonly CONFIG_DIR = join(homedir(), '.mediaproc');
    private static readonly CONFIG_FILE = join(ConfigManager.CONFIG_DIR, 'config.json');

    private config: MediaProcConfig | null = null;

    /**
     * Get the config directory path
     */
    static getConfigDir(): string {
        return ConfigManager.CONFIG_DIR;
    }

    /**
     * Get the config file path
     */
    static getConfigPath(): string {
        return ConfigManager.CONFIG_FILE;
    }

    /**
     * Ensure config directory exists
     */
    private ensureConfigDir(): void {
        if (!existsSync(ConfigManager.CONFIG_DIR)) {
            mkdirSync(ConfigManager.CONFIG_DIR, { recursive: true });
        }
    }

    /**
     * Load config from file
     */
    load(): MediaProcConfig {
        if (this.config) {
            return this.config;
        }

        this.ensureConfigDir();

        if (!existsSync(ConfigManager.CONFIG_FILE)) {
            // Create default config
            this.config = this.createDefaultConfig();
            this.save();
            return this.config;
        }

        try {
            const data = readFileSync(ConfigManager.CONFIG_FILE, 'utf-8');
            this.config = JSON.parse(data);
            return this.config!;
        } catch (error) {
            console.error('Failed to parse config file, creating new one');
            this.config = this.createDefaultConfig();
            this.save();
            return this.config;
        }
    }

    /**
     * Create default config
     */
    private createDefaultConfig(): MediaProcConfig {
        return {
            version: '1.0',
            installedPlugins: [],
            loadedPlugins: [],
            defaults: {},
            pipelines: {},
            lastUpdated: new Date().toISOString(),
        };
    }

    /**
     * Save config to file
     */
    save(): void {
        if (!this.config) {
            return;
        }

        this.ensureConfigDir();
        this.config.lastUpdated = new Date().toISOString();

        writeFileSync(
            ConfigManager.CONFIG_FILE,
            JSON.stringify(this.config, null, 2),
            'utf-8'
        );
    }

    /**
     * Get current config
     */
    get(): MediaProcConfig {
        if (!this.config) {
            return this.load();
        }
        return this.config;
    }

    /**
     * Check if a plugin is installed
     */
    isPluginInstalled(pluginName: string): boolean {
        const config = this.get();
        return config.installedPlugins.includes(pluginName);
    }

    /**
     * Check if a plugin is loaded
     */
    isPluginLoaded(pluginName: string): boolean {
        const config = this.get();
        return config.loadedPlugins.includes(pluginName);
    }

    /**
     * Add plugin to installed list
     */
    addInstalledPlugin(pluginName: string): void {
        const config = this.get();
        if (!config.installedPlugins.includes(pluginName)) {
            config.installedPlugins.push(pluginName);
            this.save();
        }
    }

    /**
     * Remove plugin from installed list
     */
    removeInstalledPlugin(pluginName: string): void {
        const config = this.get();
        config.installedPlugins = config.installedPlugins.filter(p => p !== pluginName);
        config.loadedPlugins = config.loadedPlugins.filter(p => p !== pluginName);
        this.save();
    }

    /**
     * Add plugin to loaded list
     */
    addLoadedPlugin(pluginName: string): void {
        const config = this.get();
        if (!config.loadedPlugins.includes(pluginName)) {
            config.loadedPlugins.push(pluginName);
            this.save();
        }
    }

    /**
     * Remove plugin from loaded list
     */
    removeLoadedPlugin(pluginName: string): void {
        const config = this.get();
        config.loadedPlugins = config.loadedPlugins.filter(p => p !== pluginName);
        this.save();
    }

    /**
     * Get list of installed plugins
     */
    getInstalledPlugins(): string[] {
        const config = this.get();
        return [...config.installedPlugins];
    }

    /**
     * Get list of loaded plugins
     */
    getLoadedPlugins(): string[] {
        const config = this.get();
        return [...config.loadedPlugins];
    }

    /**
     * Set a configuration value
     */
    set(key: string, value: any): void {
        const config = this.get();
        const keys = key.split('.');
        let current: any = config;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
        this.save();
    }

    /**
     * Get a configuration value
     */
    getValue(key: string): any {
        const config = this.get();
        const keys = key.split('.');
        let current: any = config;

        for (const k of keys) {
            if (current[k] === undefined) {
                return undefined;
            }
            current = current[k];
        }

        return current;
    }

    /**
     * Reset config to defaults
     */
    reset(): void {
        this.config = this.createDefaultConfig();
        this.save();
    }

    /**
     * Check if config file exists
     */
    exists(): boolean {
        return existsSync(ConfigManager.CONFIG_FILE);
    }
}
