import type { Command } from 'commander';
import { runPipelineCommand } from './commands/run.js';
import { validatePipelineCommand } from './commands/validate.js';

export const name = '@mediaproc/pipeline';
export const version = '1.0.0';

export function register(program: Command): void {
  const cmd = program.command('pipeline').description('Media processing pipelines');
  runPipelineCommand(cmd);
  validatePipelineCommand(cmd);
}
