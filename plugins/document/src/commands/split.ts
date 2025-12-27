import type { Command } from 'commander';
import chalk from 'chalk';

export function splitCommand(docCmd: Command): void {
  docCmd
    .command('split <input>')
    .description('Split PDF into separate pages')
    .option('-o, --output <directory>', 'Output directory', './split-output')
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: any) => {
      console.log(chalk.blue('📄 Split command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - requires Poppler'));
    });
}
