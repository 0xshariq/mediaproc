import type { Command } from 'commander';
import chalk from 'chalk';
export function convertCommand(cmd: Command): void {
  cmd.command('convert <input>').description('Convert 3D model format')
    .option('-f, --format <format>', 'Target format: gltf, glb, obj')
    .action((input) => {
      console.log(chalk.blue('🎮 3D Convert'), chalk.dim(input));
      console.log(chalk.yellow('⚠️  Not implemented'));
    });
}
