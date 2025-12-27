import type { Command } from 'commander';
import chalk from 'chalk';
export function runPipelineCommand(cmd: Command): void {
  cmd.command('run <file>').description('Run pipeline from YAML/JSON file')
    .option('--dry-run', 'Preview without executing')
    .action((file) => {
      console.log(chalk.blue('⚙️  Run Pipeline'), chalk.dim(file));
      console.log(chalk.yellow('⚠️  Not implemented'));
    });
}
