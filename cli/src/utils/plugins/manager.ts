import { Command } from 'commander';
import type { MediaProcPlugin } from '../../types.js';
import { PluginType, PluginStatus, type PluginLoadResult } from './api.js';

/**
 * Enhanced Plugin Manager with concurrent loading protection and better error handling
 */
export class PluginManager {
  private plugins: Map<string, MediaProcPlugin> = new Map();
  private loadingPlugins: Set<string> = new Set();
  private failedPlugins: Map<string, string> = new Map();
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
    return this.officialPlugins.includes(pluginName) || pluginName.startsWith(this.pluginPrefix);
  }

  /**
   * Get the plugin prefix
   */
  getPluginPrefix(): string {
    return this.pluginPrefix;
  }

  /**
   * Get plugin type
   */
  getPluginType(pluginName: string): PluginType {
    if (pluginName.startsWith('@mediaproc/')) {
      return PluginType.OFFICIAL;
    }
    if (pluginName.startsWith('mediaproc-')) {
      return PluginType.COMMUNITY;
    }
    return PluginType.THIRD_PARTY;
  }

  /**
   * Get plugin status
   */
  getPluginStatus(pluginName: string): PluginStatus {
    if (this.plugins.has(pluginName)) {
      return PluginStatus.LOADED;
    }
    if (this.loadingPlugins.has(pluginName)) {
      return PluginStatus.LOADING;
    }
    if (this.failedPlugins.has(pluginName)) {
      return PluginStatus.ERROR;
    }
    return PluginStatus.NOT_INSTALLED;
  }

  /**
   * Load a specific plugin and register its commands
   */
  async loadPlugin(pluginName: string, program: Command, isBuiltIn = false): Promise<boolean> {
    // Skip if already loaded
    if (this.plugins.has(pluginName)) {
      return true;
    }

    // Prevent concurrent loading of same plugin
    if (this.loadingPlugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} is already being loaded`);
    }

    // Clear any previous failure state
    this.failedPlugins.delete(pluginName);
    this.loadingPlugins.add(pluginName);

    try {
      // Dynamic import of the plugin
      const plugin = await import(pluginName) as MediaProcPlugin;

      // Validate plugin structure
      if (!plugin.name || !plugin.version) {
        this.loadingPlugins.delete(pluginName);
        const error = `Plugin ${pluginName} missing required exports (name, version)`;
        this.failedPlugins.set(pluginName, error);
        throw new Error(error);
      }

      if (typeof plugin.register !== 'function') {
        this.loadingPlugins.delete(pluginName);
        const error = `Plugin ${pluginName} does not export a register() function`;
        this.failedPlugins.set(pluginName, error);
        throw new Error(error);
      }

      // Register plugin commands with the CLI
      await plugin.register(program);

      // Store plugin instance
      this.plugins.set(pluginName, {
        ...plugin,
        isBuiltIn
      });

      this.loadingPlugins.delete(pluginName);
      return true;
    } catch (error) {
      this.loadingPlugins.delete(pluginName);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.failedPlugins.set(pluginName, errorMessage);
      throw new Error(`Failed to load plugin ${pluginName}: ${errorMessage}`);
    }
  }

  /**
   * Load multiple plugins concurrently (with error tolerance)
   */
  async loadPlugins(
    pluginNames: string[],
    program: Command,
    options: { throwOnError?: boolean } = {}
  ): Promise<PluginLoadResult[]> {
    const results = await Promise.allSettled(
      pluginNames.map(name => this.loadPlugin(name, program))
    );

    return results.map((result, index) => {
      const pluginName = pluginNames[index];
      if (result.status === 'fulfilled' && result.value) {
        return {
          success: true,
          plugin: this.plugins.get(pluginName)
        };
      } else {
        const error = result.status === 'rejected' ? result.reason?.message : 'Unknown error';
        if (options.throwOnError) {
          throw new Error(error);
        }
        return {
          success: false,
          error
        };
      }
    });
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
   * Get all plugin instances
   */
  getAllPlugins(): Map<string, MediaProcPlugin> {
    return new Map(this.plugins);
  }

  /**
   * Get failed plugins with error messages
   */
  getFailedPlugins(): Map<string, string> {
    return new Map(this.failedPlugins);
  }

  /**
   * Unload a plugin (remove from registry)
   * Properly cleans up all references to prevent memory leaks
   */
  unloadPlugin(pluginName: string): boolean {
    if (this.plugins.has(pluginName)) {
      // Get plugin instance for cleanup
      const plugin = this.plugins.get(pluginName);
      
      // Call cleanup if plugin provides it
      if (plugin && typeof (plugin as any).cleanup === 'function') {
        try {
          (plugin as any).cleanup();
        } catch (error) {
          console.warn(`Warning: Plugin ${pluginName} cleanup failed:`, error);
        }
      }
      
      // Remove from all tracking structures
      this.plugins.delete(pluginName);
      this.failedPlugins.delete(pluginName);
      this.loadingPlugins.delete(pluginName);
      
      return true;
    }
    return false;
  }

  /**
   * Reload a plugin (unload then load again)
   * Useful after updating a plugin to refresh its code
   */
  async reloadPlugin(pluginName: string, program: Command): Promise<boolean> {
    // Unload first (this will clean up resources)
    this.unloadPlugin(pluginName);
    
    // Clear Node.js module cache to force fresh import
    // This is important when reloading after an update
    try {
      // Try CommonJS cache clearing
      if (typeof require !== 'undefined' && require.cache) {
        const moduleId = require.resolve(pluginName);
        if (moduleId && require.cache[moduleId]) {
          delete require.cache[moduleId];
        }
      }
    } catch (error) {
      // Module may be ES module or not in cache - continue anyway
    }
    
    // Add a small delay to ensure file system has released handles
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Load fresh version with cache-busting query parameter
    return await this.loadPlugin(pluginName, program);
  }

  /**
   * Check if any plugins are currently loading
   */
  hasLoadingPlugins(): boolean {
    return this.loadingPlugins.size > 0;
  }

  /**
   * Get count of loaded plugins
   */
  getLoadedCount(): number {
    return this.plugins.size;
  }

  /**
   * Clear all plugins (useful for testing)
   */
  clear(): void {
    this.plugins.clear();
    this.loadingPlugins.clear();
    this.failedPlugins.clear();
  }
}

// Export a singleton PluginManager instance
export const pluginManager = new PluginManager();

/**
 * Get the plugin name for a given command name.
 * Checks loaded plugins for a command match, otherwise returns 'core'.
 */
export function getPluginNameForCommand(commandName: string): string {
  const allPlugins = pluginManager.getAllPlugins();
  
  for (const [pluginName, plugin] of allPlugins.entries()) {
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
      } catch {
        // Ignore errors from getCommands
      }
    }
  }
  
  return 'core';
}
