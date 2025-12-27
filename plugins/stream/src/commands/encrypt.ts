import type { Command } from 'commander';
import chalk from 'chalk';
export function encryptCommand(cmd: Command): void {
  cmd.command('encrypt <input>').description('Encrypt streaming segments')
    .action((input) => {
      console.log(chalk.blue('📡 Encrypt'), chalk.dim(input));
      console.log(chalk.yellow('⚠️  Not implemented'));
    });
}
