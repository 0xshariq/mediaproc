import type { Command } from 'commander';

/**
 * Plugin API for mediaproc
 * 
 * All plugins must export a `register` function that takes a Commander program
 * and registers their commands.
 * 
 * @example
 * ```ts
 * import type { Command } from 'commander';
 * 
 * export const name = '@mediaproc/plugin-name';
 * export const version = '1.0.0';
 * 
 * export function register(program: Command): void {
 *   const pluginCmd = program
 *     .command('plugin')
 *     .description('plugin description')
 *     .version(version, '-v, --version', 'Output the plugin version')
 *     .helpOption('-h, --help', 'Display help for plugin');
 *   
 *   pluginCmd
 *     .command('subcommand <parameters>')
 *     .option('--flags', 'Flag description')
 *     .action(async (input, options) => {
 *        // Implementation
 *     });
 * }
 * ```
 */

export interface PluginAPI {
  /**
   * Plugin name (should match package name)
   * - Official: @mediaproc/plugin-name
   * - Community: mediaproc-plugin-name
   * - Third-party: any valid npm package name
   */
  name: string;
  
  /**
   * Plugin version (semver format)
   */
  version: string;
  
  /**
   * Register commands with the CLI
   * This function is called when the plugin is loaded
   */
  register(program: Command): void | Promise<void>;
  
  /**
   * Optional: Indicates if this is a built-in/bundled plugin
   */
  isBuiltIn?: boolean;
  
  /**
   * Optional: Plugin description
   */
  description?: string;
  
  /**
   * Optional: Plugin author
   */
  author?: string;
  
  /**
   * Optional: System requirements (e.g., FFmpeg, Sharp)
   */
  systemRequirements?: string[];
}

/**
 * Plugin metadata structure
 */
export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

/**
 * Plugin load result
 */
export interface PluginLoadResult {
  success: boolean;
  plugin?: PluginAPI;
  error?: string;
}

/**
 * Plugin type enum
 */
export enum PluginType {
  OFFICIAL = 'official',
  COMMUNITY = 'community',
  THIRD_PARTY = 'third-party'
}

/**
 * Plugin status
 */
export enum PluginStatus {
  LOADED = 'loaded',
  NOT_INSTALLED = 'not-installed',
  LOADING = 'loading',
  ERROR = 'error'
}

export type { Command };
