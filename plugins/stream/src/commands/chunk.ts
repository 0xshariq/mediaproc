import type { Command } from 'commander';
import chalk from 'chalk';
export function chunkCommand(cmd: Command): void {
  cmd.command('chunk <input>').description('Chunk video into segments')
    .option('--duration <seconds>', 'Segment duration', '6')
    .action((input) => {
      console.log(chalk.blue('📡 Chunk Video'), chalk.dim(input));
      console.log(chalk.yellow('⚠️  Not implemented'));
    });
}
