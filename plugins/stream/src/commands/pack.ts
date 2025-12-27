import type { Command } from 'commander';
import chalk from 'chalk';
export function packCommand(cmd: Command): void {
  cmd.command('pack <input>').description('Package video for streaming')
    .option('--hls', 'Generate HLS stream')
    .option('--dash', 'Generate DASH stream')
    .action((input) => {
      console.log(chalk.blue('📡 Pack Stream'), chalk.dim(input));
      console.log(chalk.yellow('⚠️  Not implemented - requires FFmpeg'));
    });
}
