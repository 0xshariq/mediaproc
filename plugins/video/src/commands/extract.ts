import type { Command } from 'commander';
import chalk from 'chalk';
import type { ExtractOptions } from '../types.js';

export function extractCommand(videoCmd: Command): void {
  videoCmd
    .command('extract-frames <input>')
    .description('Extract frames from video')
    .option('-o, --output <path>', 'Output directory')
    .option('--start <time>', 'Start time (HH:MM:SS)')
    .option('--end <time>', 'End time (HH:MM:SS)')
    .option('--fps <fps>', 'Frames per second', parseInt, 1)
    .option('--format <format>', 'Image format: jpg, png', 'jpg')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: ExtractOptions) => {
      console.log(chalk.blue('🎬 Extract frames command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - placeholder only'));
    });
}
