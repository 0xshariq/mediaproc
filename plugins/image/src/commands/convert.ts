import type { Command } from 'commander';
import chalk from 'chalk';
import type { ConvertOptions } from '../types.js';

export function convertCommand(imageCmd: Command): void {
  imageCmd
    .command('convert <input>')
    .description('Convert image to different format')
    .option('-f, --format <format>', 'Output format: jpg, png, webp, avif, tiff, gif', 'webp')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: ConvertOptions) => {
      console.log(chalk.blue('🔧 Convert command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.dim(`Format: ${options.format}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - placeholder only'));
      
      // TODO: Implement with Sharp
    });
}
