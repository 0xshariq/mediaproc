import { Command } from 'commander';
import chalk from 'chalk';
import type { PluginManager } from '../plugin-manager.js';

export function listCommand(program: Command, pluginManager: PluginManager): void {
  program
    .command('list')
    .alias('ls')
    .description('List all installed mediaproc plugins')
    .action(() => {
      const plugins = pluginManager.getLoadedPlugins();

      if (plugins.length === 0) {
        console.log(chalk.yellow('No plugins installed'));
        console.log(chalk.dim('\nInstall a plugin with: mediaproc add <plugin-name>'));
        console.log(chalk.dim('Available plugins: image, video, audio, document, animation'));
        return;
      }

      console.log(chalk.bold('\nInstalled Plugins:\n'));
      
      plugins.forEach((pluginName, index) => {
        const shortName = pluginName.replace('@mediaproc/', '');
        const plugin = pluginManager.getPlugin(pluginName);
        
        console.log(`${chalk.green('✓')} ${chalk.cyan(shortName)} ${chalk.dim(`(${pluginName})`)}`);
        
        if (plugin) {
          console.log(chalk.dim(`  Version: ${plugin.version || 'unknown'}`));
        }
        
        if (index < plugins.length - 1) {
          console.log('');
        }
      });

      console.log('');
    });
}
