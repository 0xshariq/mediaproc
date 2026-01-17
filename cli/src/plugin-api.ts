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
 * export const name = 'plugin-name';
 * export const version = '1.0.0';
 * 
 * export function register(program: Command): void {
 *   const imageCmd = program
 *     .command('plugin')
 *     .description('plugin description');
 *   
 *   imageCmd
 *     .command('plugin-command <parameters>')
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
   */
  name: string;
  
  /**
   * Plugin version
   */
  version: string;
  
  /**
   * Register commands with the CLI
   */
  register(program: Command): void | Promise<void>;
}

export type { Command };
