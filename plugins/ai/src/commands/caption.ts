import type { Command } from 'commander';
import chalk from 'chalk';
export function captionCommand(cmd: Command): void {
  cmd.command('caption <input>').description('Auto-caption audio/video')
    .option('--language <lang>', 'Language code', 'en')
    .action((input) => {
      console.log(chalk.blue('🤖 Auto-Caption'), chalk.dim(input));
      console.log(chalk.yellow('⚠️  Not implemented - requires Whisper'));
    });
}
