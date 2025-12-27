import type { Command } from 'commander';
import chalk from 'chalk';
import type { AnimationOptions } from '../types.js';

export function gififyCommand(animCmd: Command): void {
  animCmd
    .command('gifify <input>')
    .description('Convert video to GIF')
    .option('-o, --output <path>', 'Output file path')
    .option('--fps <fps>', 'Frames per second', parseInt, 15)
    .option('-w, --width <width>', 'Width in pixels', parseInt, 480)
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: AnimationOptions) => {
      console.log(chalk.blue('🎨 Gifify command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - placeholder only'));
    });
}
