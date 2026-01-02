import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../config-manager.js';

export function initCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize MediaProc configuration in ~/.mediaproc/')
    .option('--reset', 'Reset existing configuration')
    .action((options: { reset?: boolean }) => {
      const configManager = new ConfigManager();
      const configPath = ConfigManager.getConfigPath();
      
      if (configManager.exists() && !options.reset) {
        console.log(chalk.yellow('⚠️  Configuration already exists at:'));
        console.log(chalk.dim(`   ${configPath}`));
        console.log('');
        console.log(chalk.dim('Use --reset flag to reset configuration'));
        process.exit(1);
      }

      if (options.reset) {
        console.log(chalk.yellow('Resetting configuration...'));
        configManager.reset();
      } else {
        // Load will create default config if not exists
        configManager.load();
      }
      
      console.log(chalk.green('✓ MediaProc configuration initialized'));
      console.log(chalk.dim(`  Location: ${configPath}`));
      console.log('');
      console.log(chalk.bold('Next steps:'));
      console.log(chalk.dim('  1. Browse plugins: ') + chalk.cyan('mediaproc plugins'));
      console.log(chalk.dim('  2. Install plugins: ') + chalk.cyan('mediaproc add image'));
      console.log(chalk.dim('  3. View config:     ') + chalk.cyan('mediaproc config show'));
    });
}
