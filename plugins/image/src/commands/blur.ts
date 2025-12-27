import type { Command } from 'commander';
import chalk from 'chalk';
import type { FilterOptions } from '../types.js';

export function blurCommand(imageCmd: Command): void {
  imageCmd
    .command('blur <input>')
    .description('Apply blur effect to image')
    .option('-r, --radius <radius>', 'Blur radius (0.3-1000)', parseFloat, 3)
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: FilterOptions) => {
      console.log(chalk.blue('🔧 Blur command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.dim(`Radius: ${options.blur || 3}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - placeholder only'));
      
      // TODO: Implement with Sharp
    });
}
