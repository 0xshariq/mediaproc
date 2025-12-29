import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';
import type { PluginManager } from '../plugin-manager.js';

export function removeCommand(program: Command, pluginManager: PluginManager): void {
  program
    .command('remove <plugin>')
    .alias('rm')
    .description('Uninstall a mediaproc plugin')
    .option('-g, --global', 'Uninstall plugin globally')
    .action(async (plugin: string, options: { global?: boolean }) => {
      const spinner = ora(`Removing ${chalk.cyan(plugin)}...`).start();

      try {
        // Ensure plugin name starts with @mediaproc/
        const pluginName = plugin.startsWith('@mediaproc/') 
          ? plugin 
          : `@mediaproc/${plugin}`;

        // Check if plugin is currently loaded
        const wasLoaded = pluginManager.isPluginLoaded(pluginName);
        if (wasLoaded) {
          spinner.info(chalk.dim(`Plugin ${pluginName} is currently loaded`));
        }

        // Uninstall using pnpm
        const removeCmd = options.global ? 'uninstall' : 'remove';
        const globalFlag = options.global ? '-g' : '';
        
        await execa('pnpm', [removeCmd, globalFlag, pluginName].filter(Boolean), {
          stdio: 'pipe'
        });

        spinner.succeed(chalk.green(`✓ Successfully removed ${pluginName}`));

      } catch (error) {
        spinner.fail(chalk.red(`Failed to remove ${plugin}`));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(errorMessage));
        process.exit(1);
      }
    });
}
