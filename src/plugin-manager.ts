import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
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
    return this.officialPlugins.includes(pluginName);
  }

  /**
   * Discover installed plugins by scanning node_modules
   */
  private discoverPlugins(): string[] {
    const plugins: string[] = [];

    try {
      // Try to read package.json to find dependencies
      const packageJsonPath = join(process.cwd(), 'package.json');

      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        // Find all @mediaproc/* packages
        for (const dep of Object.keys(allDeps)) {
          if (dep.startsWith(this.pluginPrefix) && dep !== '@mediaproc/core') {
            plugins.push(dep);
          }
        }
      }
    } catch (error) {
      // Silently fail - no plugins installed yet
    }

    return plugins;
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
   * Get list of loaded plugins
   */
  getLoadedPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Get list of installed plugins from package.json (not necessarily loaded)
   */
  getInstalledPlugins(): string[] {
    return this.discoverPlugins();
  }

  /**
   * Check if a plugin is installed (exists in package.json or node_modules)
   */
  isPluginInstalled(pluginName: string): boolean {
    const installedPlugins = this.discoverPlugins();
    return installedPlugins.includes(pluginName);
  }

  /**
   * Get official plugins list
   */
  getOfficialPlugins(): string[] {
    return [...this.officialPlugins];
  }

  /**
   * Check if a plugin is loaded
   */
  isPluginLoaded(pluginName: string): boolean {
    return this.plugins.has(pluginName);
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
