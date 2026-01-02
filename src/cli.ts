#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PluginManager } from './plugin-manager.js';
import { ConfigManager } from './config-manager.js';
import { addCommand } from './commands/add.js';
import { removeCommand } from './commands/remove.js';
import { listCommand } from './commands/list.js';
import { pluginsCommand } from './commands/plugins.js';
import { helpCommand } from './commands/help.js';
import { initCommand } from './commands/init.js';
import { configCommand } from './commands/config.js';
import { runCommand } from './commands/run.js';
import { validateCommand } from './commands/validate.js';
import { convertCommand } from './commands/convert.js';
import { infoCommand } from './commands/info.js';
import { optimizeCommand } from './commands/optimize.js';

const program = new Command();
const pluginManager = new PluginManager();

// Initialize config on startup (creates default if not exists)
const configManager = new ConfigManager();
configManager.load();

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

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
  
  // Project management commands
  initCommand(program);
  configCommand(program);
  
  // Universal commands (auto-install plugins if needed)
  convertCommand(program, pluginManager);
  infoCommand(program, pluginManager);
  optimizeCommand(program, pluginManager);
  
  // Utility commands
  runCommand(program);
  validateCommand(program);

  // Plugins are NOT loaded at startup
  // Users must explicitly install plugins using: mediaproc add <plugin>
  // This gives users full control over which plugins they want

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
