import { Command } from 'commander';
import type { MediaProcPlugin } from './types.js';

export class PluginManager {
  private plugins: Map<string, MediaProcPlugin> = new Map();
  private readonly pluginPrefix = '@mediaproc/';

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
   * Get official plugins list
   */
  getOfficialPlugins(): string[] {
    return [...this.officialPlugins];
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
      return true;
    }
    return false;
  }

}
// Export a singleton PluginManager instance
export const pluginManager = new PluginManager();

/**
 * Get the plugin name for a given command name.
 * Checks loaded plugins for a command match, otherwise returns 'core'.
 */
export function getPluginNameForCommand(commandName: string): string {
  for (const [pluginName, plugin] of pluginManager['plugins'].entries()) {
    // If plugin has a 'commands' array property (non-standard, but some plugins may add it)
    if (plugin && (plugin as any).commands && Array.isArray((plugin as any).commands)) {
      if ((plugin as any).commands.includes(commandName)) {
        return pluginName;
      }
    }
    // If plugin has a 'getCommands' method (non-standard, but some plugins may add it)
    if (plugin && typeof (plugin as any).getCommands === 'function') {
      try {
        const cmds = (plugin as any).getCommands();
        if (Array.isArray(cmds) && cmds.includes(commandName)) {
          return pluginName;
        }
      } catch {}
    }
  }
  return 'core';
}
