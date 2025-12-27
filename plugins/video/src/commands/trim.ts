import type { Command } from 'commander';
import chalk from 'chalk';
import type { VideoOptions } from '../types.js';

export function trimCommand(videoCmd: Command): void {
  videoCmd
    .command('trim <input>')
    .description('Trim video to specified time range')
    .option('-o, --output <path>', 'Output file path')
    .option('--start <time>', 'Start time (HH:MM:SS)', '00:00:00')
    .option('--end <time>', 'End time (HH:MM:SS)')
    .option('--duration <duration>', 'Duration (in seconds)')
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: VideoOptions) => {
      console.log(chalk.blue('🎬 Trim command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - placeholder only'));
    });
}
