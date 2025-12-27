import type { Command } from 'commander';
import chalk from 'chalk';
import type { AudioOptions } from '../types.js';

export function convertCommand(audioCmd: Command): void {
  audioCmd
    .command('convert <input>')
    .description('Convert audio to different format')
    .option('-o, --output <path>', 'Output file path')
    .option('-f, --format <format>', 'Output format: mp3, aac, wav, flac, ogg', 'mp3')
    .option('--bitrate <bitrate>', 'Bitrate (e.g., 192k, 320k)')
    .option('--sample-rate <rate>', 'Sample rate in Hz', parseInt)
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: AudioOptions) => {
      console.log(chalk.blue('🎵 Convert command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - placeholder only'));
    });
}
