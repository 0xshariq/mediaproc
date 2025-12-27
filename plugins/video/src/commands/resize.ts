import type { Command } from 'commander';
import chalk from 'chalk';
import type { VideoOptions } from '../types.js';

export function resizeCommand(videoCmd: Command): void {
  videoCmd
    .command('resize <input>')
    .description('Resize video resolution')
    .option('-o, --output <path>', 'Output file path')
    .option('-w, --width <width>', 'Width in pixels', parseInt)
    .option('-h, --height <height>', 'Height in pixels', parseInt)
    .option('--scale <scale>', 'Scale preset: 720p, 1080p, 4k', '1080p')
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: VideoOptions) => {
      console.log(chalk.blue('🎬 Resize command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - placeholder only'));
    });
}
