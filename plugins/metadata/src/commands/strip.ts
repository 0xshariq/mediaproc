import type { Command } from 'commander';
import chalk from 'chalk';
export function stripCommand(cmd: Command): void {
  cmd.command('strip <input>').description('Strip all metadata from file')
    .option('-o, --output <path>', 'Output path')
    .action((input) => {
      console.log(chalk.blue('🔍 Strip Metadata'), chalk.dim(input));
      console.log(chalk.yellow('⚠️  Not implemented'));
    });
}
