import type { Command } from 'commander';
import chalk from 'chalk';
import type { ImageOptions } from '../types.js';

export function watermarkCommand(imageCmd: Command): void {
  imageCmd
    .command('watermark <input> <watermark>')
    .description('Add watermark to image')
    .option('-o, --output <path>', 'Output file path')
    .option('--position <position>', 'Position: center, top-left, top-right, bottom-left, bottom-right', 'bottom-right')
    .option('--opacity <opacity>', 'Watermark opacity (0-1)', parseFloat, 0.5)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, watermark: string, options: ImageOptions) => {
      console.log(chalk.blue('🔧 Watermark command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.dim(`Watermark: ${watermark}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - placeholder only'));
      
      // TODO: Implement with Sharp composite
    });
}
