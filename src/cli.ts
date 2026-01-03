#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PluginManager } from './plugin-manager.js';
import { addCommand } from './commands/add.js';
import { removeCommand } from './commands/remove.js';
import { listCommand } from './commands/list.js';
import { pluginsCommand } from './commands/plugins.js';
import { helpCommand } from './commands/help.js';
import { runCommand } from './commands/run.js';
import { validateCommand } from './commands/validate.js';
import { convertCommand } from './commands/convert.js';
import { infoCommand } from './commands/info.js';
import { optimizeCommand } from './commands/optimize.js';

const program = new Command();
const pluginManager = new PluginManager();

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

/**
 * Auto-load installed plugins
 */
async function autoLoadPlugins(): Promise<void> {
  const officialPlugins = pluginManager.getOfficialPlugins();
  
  for (const pluginName of officialPlugins) {
    try {
      // Try to load plugin silently - if it's installed, it will load
      await pluginManager.loadPlugin(pluginName, program);
    } catch {
      // Plugin not installed, skip silently
    }
  }
}

export async function cli(): Promise<void> {
  program
    .name('mediaproc')
    .description('Modern, plugin-based media processing CLI')
    .version(packageJson.version);

  // Plugin management commands
  addCommand(program, pluginManager);
  removeCommand(program, pluginManager);
  listCommand(program, pluginManager);
  pluginsCommand(program, pluginManager);
  helpCommand(program);
  
  // Universal commands (auto-install plugins if needed)
  convertCommand(program, pluginManager);
  infoCommand(program, pluginManager);
  optimizeCommand(program, pluginManager);
  
  // Utility commands
  runCommand(program);
  validateCommand(program);

  // Auto-load installed plugins before parsing commands
  await autoLoadPlugins();

  // Parse arguments
  program.parse(process.argv);

  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

// Run CLI if this is the main module
cli().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
