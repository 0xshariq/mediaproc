import type { Command } from 'commander';
import chalk from 'chalk';
import type { ImageOptions } from '../types.js';

export function flipCommand(imageCmd: Command): void {
  imageCmd
    .command('flip <input>')
    .description('Flip image horizontally or vertically')
    .option('--horizontal', 'Flip horizontally')
    .option('--vertical', 'Flip vertically')
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: ImageOptions) => {
      console.log(chalk.blue('🔧 Flip command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - placeholder only'));
      
      // TODO: Implement with Sharp
    });
}
