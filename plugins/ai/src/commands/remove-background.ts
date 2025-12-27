import type { Command } from 'commander';
import chalk from 'chalk';
export function removeBackgroundCommand(cmd: Command): void {
  cmd.command('remove-background <input>').description('Remove background from image')
    .action((input) => {
      console.log(chalk.blue('🤖 Remove Background'), chalk.dim(input));
      console.log(chalk.yellow('⚠️  Not implemented'));
    });
}
