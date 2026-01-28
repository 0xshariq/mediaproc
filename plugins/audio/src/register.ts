import type { Command } from 'commander';
import { convertCommand } from './commands/convert.js';
import { normalizeCommand } from './commands/normalize.js';
import { trimCommand } from './commands/trim.js';
import { mergeCommand } from './commands/merge.js';
import { extractCommand } from './commands/extract.js';

export const name = '@mediaproc/audio';
export const version = '1.3.0';
export const isBuiltIn = true;

export function register(program: Command): void {
  // Register each command directly on the root program
  convertCommand(program);
  normalizeCommand(program);
  trimCommand(program);
  mergeCommand(program);
  extractCommand(program);
}
