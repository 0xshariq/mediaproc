import type { Command } from 'commander';
import chalk from 'chalk';
export function sceneDetectionCommand(cmd: Command): void {
  cmd.command('scene-detection <input>').description('Detect scenes in video')
    .action((input) => {
      console.log(chalk.blue('🤖 Scene Detection'), chalk.dim(input));
      console.log(chalk.yellow('⚠️  Not implemented'));
    });
}
