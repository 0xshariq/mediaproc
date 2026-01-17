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
import { updateCommand } from './commands/update.js';
import { doctorCommand } from './commands/doctor.js';
import { searchCommand } from './commands/search.js';
import { historyCommand } from './commands/history.js';
import { batchCommand } from './commands/batch.js';
import { compareCommand } from './commands/compare.js';
import { templateCommand } from './commands/template.js';
import { workspaceCommand } from './commands/workspace.js';
import { watchCommand } from './commands/watch.js';
import { benchmarkCommand } from './commands/benchmark.js';

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
  updateCommand(program);
  helpCommand(program);

  // System & utility commands
  program.addCommand(doctorCommand);
  program.addCommand(searchCommand);
  program.addCommand(historyCommand);
  program.addCommand(batchCommand);
  program.addCommand(compareCommand);
  program.addCommand(templateCommand);
  program.addCommand(workspaceCommand);
  program.addCommand(watchCommand);
  program.addCommand(benchmarkCommand);

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

