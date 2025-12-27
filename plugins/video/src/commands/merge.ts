import type { Command } from 'commander';
import chalk from 'chalk';

export function mergeCommand(videoCmd: Command): void {
  videoCmd
    .command('merge <inputs...>')
    .description('Merge multiple videos into one')
    .option('-o, --output <path>', 'Output file path', 'merged.mp4')
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (inputs: string[], options: any) => {
      console.log(chalk.blue('🎬 Merge command called'));
      console.log(chalk.dim(`Inputs: ${inputs.join(', ')}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - placeholder only'));
    });
}
