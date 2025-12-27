import { Command } from 'commander';
import chalk from 'chalk';
import { getPluginsByCategory } from '../plugin-registry.js';

export function helpCommand(program: Command): void {
  program
    .command('plugins')
    .description('Show available plugins and their descriptions')
    .action(() => {
      console.log(chalk.bold('\n📦 MediaProc Plugin Registry\n'));
      
      const grouped = getPluginsByCategory();
      
      // Core plugins
      console.log(chalk.cyan.bold('■ Core Plugins') + chalk.dim(' (Essential media processing)'));
      console.log('');
      grouped.core.forEach((plugin) => {
        console.log(chalk.green(`  ${plugin.name.padEnd(12)}`), chalk.dim(plugin.package));
        console.log(chalk.dim(`  ${''.padEnd(12)} ${plugin.description}`));
        if (plugin.systemRequirements && plugin.systemRequirements.length > 0) {
          console.log(chalk.yellow(`  ${''.padEnd(12)} Requires: ${plugin.systemRequirements.join(', ')}`));
        }
        console.log('');
      });
      
      // Advanced plugins
      console.log(chalk.cyan.bold('■ Advanced Plugins') + chalk.dim(' (Production & enterprise features)'));
      console.log('');
      grouped.advanced.forEach((plugin) => {
        console.log(chalk.green(`  ${plugin.name.padEnd(12)}`), chalk.dim(plugin.package));
        console.log(chalk.dim(`  ${''.padEnd(12)} ${plugin.description}`));
        if (plugin.systemRequirements && plugin.systemRequirements.length > 0) {
          console.log(chalk.yellow(`  ${''.padEnd(12)} Requires: ${plugin.systemRequirements.join(', ')}`));
        }
        console.log('');
      });
      
      // Future-proof plugins
      console.log(chalk.cyan.bold('■ Future-Proof Plugins') + chalk.dim(' (AI & next-gen features)'));
      console.log('');
      grouped['future-proof'].forEach((plugin) => {
        console.log(chalk.green(`  ${plugin.name.padEnd(12)}`), chalk.dim(plugin.package));
        console.log(chalk.dim(`  ${''.padEnd(12)} ${plugin.description}`));
        if (plugin.systemRequirements && plugin.systemRequirements.length > 0) {
          console.log(chalk.yellow(`  ${''.padEnd(12)} Requires: ${plugin.systemRequirements.join(', ')}`));
        }
        console.log('');
      });
      
      console.log(chalk.bold('Installation:'));
      console.log(chalk.dim(`  mediaproc add <plugin-name>`));
      console.log(chalk.dim(`  mediaproc add image          # Install image processing`));
      console.log(chalk.dim(`  mediaproc add video          # Install video processing`));
      console.log(chalk.dim(`  mediaproc add doc            # Install document processing`));
      console.log('');
      
      console.log(chalk.bold('Options:'));
      console.log(chalk.dim(`  -g, --global                 # Install globally`));
      console.log(chalk.dim(`  -l, --local                  # Install locally`));
      console.log('');
    });
}
