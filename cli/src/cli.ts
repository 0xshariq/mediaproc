#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { showBranding } from '@mediaproc/core';
import { PluginManager } from './utils/index.js';
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
import { explainPreActionHook } from '@mediaproc/core';

const program = new Command();
const pluginManager = new PluginManager();


// Get version from core branding utility
const version = '0.8.5';

/**
 * Auto-load installed plugins
 */
async function autoLoadPlugins(): Promise<void> {
  const officialPlugins = pluginManager.getOfficialPlugins();
  const loadResults = { success: 0, failed: 0 };
  
  for (const pluginName of officialPlugins) {
    try {
      // Check if plugin is actually installed first
      await import(pluginName);
      // Try to load plugin silently - if it's installed, it will load
      await pluginManager.loadPlugin(pluginName, program);
      loadResults.success++;
    } catch {
      // Plugin not installed or failed to load, skip silently
      loadResults.failed++;
    }
  }
  
  // Optional: Log stats in debug mode
  if (process.env.DEBUG === 'mediaproc') {
    console.log(`[DEBUG] Loaded ${loadResults.success} plugins, ${loadResults.failed} unavailable`);
  }
}

export async function cli(): Promise<void> {
  program
    .name('mediaproc')
    .description('Modern, plugin-based media processing CLI')
    .version(version, '-V, --version', 'Output the CLI version'); // Changed from lowercase -v to uppercase -V

  // Add hooks before adding commands
  program.hook('preAction', explainPreActionHook);
  
  // Show CLI branding after all commands
  program.hook('postAction', () => {
    showBranding();
  });

  // Plugin management commands
  addCommand(program, pluginManager);
  removeCommand(program, pluginManager);
  listCommand(program, pluginManager);
  pluginsCommand(program, pluginManager);
  updateCommand(program, pluginManager);
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

  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
    return;
  }

  // Parse arguments
  program.parse(process.argv);
}

// Run CLI if this is the main module
cli().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});

