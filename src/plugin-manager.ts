import { Command } from 'commander';
import type { MediaProcPlugin } from './types.js';
import { ConfigManager } from './config-manager.js';

export class PluginManager {
  private plugins: Map<string, MediaProcPlugin> = new Map();
  private readonly pluginPrefix = '@mediaproc/';
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
  }

  // Official plugins (recommended, but installed on-demand)
  private readonly officialPlugins = [
    '@mediaproc/image',
    '@mediaproc/video',
    '@mediaproc/audio',
    '@mediaproc/document',
    '@mediaproc/animation',
    '@mediaproc/3d',
    '@mediaproc/stream',
    '@mediaproc/ai',
    '@mediaproc/metadata',
    '@mediaproc/pipeline',
  ];

  /**
   * Check if a plugin is official (@mediaproc/* package)
   */
  isOfficialPlugin(pluginName: string): boolean {
    // Check if it's in the official list OR starts with @mediaproc/
    return this.officialPlugins.includes(pluginName) || pluginName.startsWith(this.pluginPrefix);
  }

  /**
   * Get the plugin prefix
   */
  getPluginPrefix(): string {
    return this.pluginPrefix;
  }

  /**
   * Load a specific plugin and register its commands
   */
  async loadPlugin(pluginName: string, program: Command, isBuiltIn = false): Promise<boolean> {
    // Skip if already loaded
    if (this.plugins.has(pluginName)) {
      return true;
    }

    try {
      // Dynamic import of the plugin
      const plugin = await import(pluginName) as MediaProcPlugin;

      if (typeof plugin.register !== 'function') {
        throw new Error(`Plugin ${pluginName} does not export a register() function`);
      }

      // Register plugin commands with the CLI
      await plugin.register(program);

      this.plugins.set(pluginName, {
        ...plugin,
        isBuiltIn
      });

      // Update config to mark as loaded
      this.configManager.addLoadedPlugin(pluginName);

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load plugin ${pluginName}: ${errorMessage}`);
    }
  }

  /**
   * Get list of loaded plugins (currently in memory)
   */
  getLoadedPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Get list of installed plugins from config
   */
  getInstalledPlugins(): string[] {
    return this.configManager.getInstalledPlugins();
  }

  /**
   * Check if a plugin is installed (from config)
   */
  isPluginInstalled(pluginName: string): boolean {
    return this.configManager.isPluginInstalled(pluginName);
  }

  /**
   * Get official plugins list
   */
  getOfficialPlugins(): string[] {
    return [...this.officialPlugins];
  }

  /**
   * Check if a plugin is loaded (in memory)
   */
  isPluginLoaded(pluginName: string): boolean {
    return this.configManager.isPluginLoaded(pluginName);
  }

  /**
   * Get plugin instance
   */
  getPlugin(pluginName: string): MediaProcPlugin | undefined {
    return this.plugins.get(pluginName);
  }

  /**
   * Unload a plugin (remove from registry)
   */
  unloadPlugin(pluginName: string): boolean {
    if (this.plugins.has(pluginName)) {
      this.plugins.delete(pluginName);
      // Update config to mark as unloaded
      this.configManager.removeLoadedPlugin(pluginName);
      return true;
    }
    return false;
  }

  /**
   * Get the config manager instance
   */
  getConfigManager(): ConfigManager {
    return this.configManager;
  }
}
