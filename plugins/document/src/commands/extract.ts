import type { Command } from 'commander';
import chalk from 'chalk';
import type { ExtractOptions } from '../types.js';

export function extractCommand(docCmd: Command): void {
  docCmd
    .command('extract <input>')
    .description('Extract pages or images from PDF')
    .option('-o, --output <path>', 'Output directory')
    .option('--pages <pages>', 'Pages to extract (e.g., 1-5, 10, 15-20)', '1-')
    .option('--format <format>', 'Extract format: text, images', 'images')
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: ExtractOptions) => {
      console.log(chalk.blue('📄 Extract command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - requires Poppler'));
    });
}
