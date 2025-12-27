import type { Command } from 'commander';
import { inspectCommand } from './commands/inspect.js';
import { stripCommand } from './commands/strip.js';
import { removeGPSCommand } from './commands/remove-gps.js';
import { complianceCommand } from './commands/compliance.js';

export const name = '@mediaproc/metadata';
export const version = '1.0.0';

export function register(program: Command): void {
  const cmd = program.command('metadata').alias('meta').description('Metadata-only processing');
  inspectCommand(cmd);
  stripCommand(cmd);
  removeGPSCommand(cmd);
  complianceCommand(cmd);
}
