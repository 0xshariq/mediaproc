import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export function configCommand(program: Command): void {
  const configCmd = program
    .command('config')
    .description('Manage mediaproc configuration');
  
  configCmd
    .command('show')
    .description('Show current configuration')
    .action(() => {
      const configPath = join(process.cwd(), 'mediaproc.config.json');
      
      if (!existsSync(configPath)) {
        console.log(chalk.yellow('No config file found. Run: mediaproc init'));
        return;
      }
      
      try {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        console.log(chalk.bold('\nCurrent Configuration:\n'));
        console.log(JSON.stringify(config, null, 2));
      } catch (error) {
        console.error(chalk.red('✗ Failed to parse config file (corrupted JSON)'));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.dim(errorMessage));
        process.exit(1);
      }
    });
  
  configCmd
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action((key: string, value: string) => {
      const configPath = join(process.cwd(), 'mediaproc.config.json');
      
      if (!existsSync(configPath)) {
        console.log(chalk.yellow('No config file found. Run: mediaproc init'));
        return;
      }
      
      try {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        
        // Simple dot notation support
        const keys = key.split('.');
        let current: any = config;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        
        // Try to parse value as JSON, fallback to string
        try {
          current[keys[keys.length - 1]] = JSON.parse(value);
        } catch {
          current[keys[keys.length - 1]] = value;
        }
        
        writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(chalk.green(`✓ Set ${key} = ${value}`));
      } catch (error) {
        console.error(chalk.red('✗ Failed to parse or update config file'));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.dim(errorMessage));
        process.exit(1);
      }
    });
}
