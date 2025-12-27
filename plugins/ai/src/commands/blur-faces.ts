import type { Command } from 'commander';
import chalk from 'chalk';
export function blurFacesCommand(cmd: Command): void {
  cmd.command('blur-faces <input>').description('Blur faces in video/image')
    .action((input) => {
      console.log(chalk.blue('🤖 Blur Faces'), chalk.dim(input));
      console.log(chalk.yellow('⚠️  Not implemented - requires OpenCV/TensorFlow'));
    });
}
