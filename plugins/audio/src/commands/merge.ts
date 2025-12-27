import type { Command } from 'commander';
import chalk from 'chalk';

export function mergeCommand(audioCmd: Command): void {
  audioCmd
    .command('merge <inputs...>')
    .description('Merge multiple audio files')
    .option('-o, --output <path>', 'Output file path', 'merged.mp3')
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (inputs: string[], options: any) => {
      console.log(chalk.blue('🎵 Merge command called'));
      console.log(chalk.dim(`Inputs: ${inputs.join(', ')}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - placeholder only'));
    });
}
