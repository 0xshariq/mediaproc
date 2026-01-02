import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../config-manager.js';

export function configCommand(program: Command): void {
  const configCmd = program
    .command('config')
    .description('Manage MediaProc configuration');
  
  configCmd
    .command('show')
    .description('Show current configuration')
    .action(() => {
      const configManager = new ConfigManager();
      
      if (!configManager.exists()) {
        console.log(chalk.yellow('No config file found. Run: ') + chalk.cyan('mediaproc init'));
        return;
      }
      
      try {
        const config = configManager.get();
        const configPath = ConfigManager.getConfigPath();
        
        console.log('');
        console.log(chalk.bold('MediaProc Configuration'));
        console.log(chalk.dim(`Location: ${configPath}`));
        console.log(chalk.dim('─'.repeat(50)));
        console.log('');
        console.log(chalk.cyan('Version: ') + config.version);
        console.log(chalk.cyan('Last Updated: ') + (config.lastUpdated ? new Date(config.lastUpdated).toLocaleString() : 'Never'));
        console.log('');
        
        console.log(chalk.bold('Installed Plugins:'));
        if (config.installedPlugins.length === 0) {
          console.log(chalk.dim('  (none)'));
        } else {
          config.installedPlugins.forEach(p => {
            const isLoaded = config.loadedPlugins.includes(p);
            const status = isLoaded ? chalk.green('✓ loaded') : chalk.yellow('not loaded');
            console.log(`  ${p} ${chalk.dim(`[${status}${chalk.dim(']')}`)}`)
          });
        }
        console.log('');
        
        if (config.defaults && Object.keys(config.defaults).length > 0) {
          console.log(chalk.bold('Defaults:'));
          console.log(JSON.stringify(config.defaults, null, 2));
          console.log('');
        }
        
        if (config.pipelines && Object.keys(config.pipelines).length > 0) {
          console.log(chalk.bold('Pipelines:'));
          console.log(JSON.stringify(config.pipelines, null, 2));
          console.log('');
        }
      } catch (error) {
        console.error(chalk.red('✗ Failed to read config file'));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.dim(errorMessage));
        process.exit(1);
      }
    });
  
  configCmd
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action((key: string, value: string) => {
      const configManager = new ConfigManager();
      
      if (!configManager.exists()) {
        console.log(chalk.yellow('No config file found. Run: ') + chalk.cyan('mediaproc init'));
        return;
      }
      
      try {
        // Try to parse value as JSON, fallback to string
        let parsedValue: any;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          parsedValue = value;
        }
        
        configManager.set(key, parsedValue);
        console.log(chalk.green(`✓ Set ${key} = ${JSON.stringify(parsedValue)}`));
      } catch (error) {
        console.error(chalk.red('✗ Failed to update config'));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.dim(errorMessage));
        process.exit(1);
      }
    });
  
  configCmd
    .command('get <key>')
    .description('Get a configuration value')
    .action((key: string) => {
      const configManager = new ConfigManager();
      
      if (!configManager.exists()) {
        console.log(chalk.yellow('No config file found. Run: ') + chalk.cyan('mediaproc init'));
        return;
      }
      
      const value = configManager.getValue(key);
      if (value === undefined) {
        console.log(chalk.yellow(`Key '${key}' not found in config`));
      } else {
        console.log(JSON.stringify(value, null, 2));
      }
    });
  
  configCmd
    .command('path')
    .description('Show configuration file path')
    .action(() => {
      console.log(ConfigManager.getConfigPath());
    });
}
