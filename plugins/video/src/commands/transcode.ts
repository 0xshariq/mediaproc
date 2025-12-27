import type { Command } from 'commander';
import chalk from 'chalk';
import type { TranscodeOptions } from '../types.js';

export function transcodeCommand(videoCmd: Command): void {
  videoCmd
    .command('transcode <input>')
    .description('Transcode video to different format/codec')
    .option('-o, --output <path>', 'Output file path')
    .option('-f, --format <format>', 'Output format: mp4, webm, mkv', 'mp4')
    .option('--codec <codec>', 'Video codec: h264, h265, vp9', 'h264')
    .option('--bitrate <bitrate>', 'Target bitrate (e.g., 2M)')
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: TranscodeOptions) => {
      console.log(chalk.blue('🎬 Transcode command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - placeholder only'));
    });
}
