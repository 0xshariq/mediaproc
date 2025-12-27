import type { Command } from 'commander';
import chalk from 'chalk';
import type { FilterOptions } from '../types.js';

export function sharpenCommand(imageCmd: Command): void {
  imageCmd
    .command('sharpen <input>')
    .description('Sharpen image')
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: FilterOptions) => {
      console.log(chalk.blue('🔧 Sharpen command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - placeholder only'));
      
      // TODO: Implement with Sharp
    });
}
