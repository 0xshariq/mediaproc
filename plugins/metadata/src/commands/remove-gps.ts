import type { Command } from 'commander';
import chalk from 'chalk';
export function removeGPSCommand(cmd: Command): void {
  cmd.command('remove-gps <input>').description('Remove GPS data from images')
    .action((input) => {
      console.log(chalk.blue('🔍 Remove GPS'), chalk.dim(input));
      console.log(chalk.yellow('⚠️  Not implemented'));
    });
}
