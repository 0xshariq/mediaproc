import type { Command } from 'commander';
import chalk from 'chalk';
import type { AudioOptions } from '../types.js';

export function trimCommand(audioCmd: Command): void {
  audioCmd
    .command('trim <input>')
    .description('Trim audio to specified time range')
    .option('-o, --output <path>', 'Output file path')
    .option('--start <time>', 'Start time (HH:MM:SS)', '00:00:00')
    .option('--end <time>', 'End time (HH:MM:SS)')
    .option('--duration <seconds>', 'Duration in seconds', parseInt)
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: AudioOptions) => {
      console.log(chalk.blue('🎵 Trim command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - placeholder only'));
    });
}
