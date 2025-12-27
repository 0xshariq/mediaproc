import type { Command } from 'commander';
import chalk from 'chalk';
import type { NormalizeOptions } from '../types.js';

export function normalizeCommand(audioCmd: Command): void {
  audioCmd
    .command('normalize <input>')
    .description('Normalize audio levels')
    .option('-o, --output <path>', 'Output file path')
    .option('--target <db>', 'Target loudness in dB', parseInt, -16)
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: NormalizeOptions) => {
      console.log(chalk.blue('🎵 Normalize command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - placeholder only'));
    });
}
