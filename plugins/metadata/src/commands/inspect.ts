import type { Command } from 'commander';
import chalk from 'chalk';
export function inspectCommand(cmd: Command): void {
  cmd.command('inspect <input>').description('Inspect media file metadata')
    .option('--format <format>', 'Output format: json, text', 'text')
    .action((input) => {
      console.log(chalk.blue('🔍 Inspect'), chalk.dim(input));
      console.log(chalk.yellow('⚠️  Not implemented - requires ExifTool'));
    });
}
