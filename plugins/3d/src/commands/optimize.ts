import type { Command } from 'commander';
import chalk from 'chalk';
export function optimizeCommand(cmd: Command): void {
  cmd.command('optimize <input>').description('Optimize 3D model')
    .option('-o, --output <path>', 'Output path')
    .action((input) => {
      console.log(chalk.blue('🎮 3D Optimize'), chalk.dim(input));
      console.log(chalk.yellow('⚠️  Not implemented - requires gltf-transform'));
    });
}
