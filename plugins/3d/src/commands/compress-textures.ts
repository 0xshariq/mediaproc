import type { Command } from 'commander';
import chalk from 'chalk';
export function compressTexturesCommand(cmd: Command): void {
  cmd.command('compress-textures <input>').description('Compress model textures')
    .action((input) => {
      console.log(chalk.blue('🎮 Compress Textures'), chalk.dim(input));
      console.log(chalk.yellow('⚠️  Not implemented'));
    });
}
