import type { Command } from 'commander';
import { convertCommand } from './commands/convert.js';
import { normalizeCommand } from './commands/normalize.js';
import { trimCommand } from './commands/trim.js';
import { mergeCommand } from './commands/merge.js';
import { extractCommand } from './commands/extract.js';


export const name = '@mediaproc/audio';

export const version = '1.2.0';

export function register(program: Command): void {
  const audioCmd = program
    .command('audio')
    .description('Audio processing commands (powered by FFmpeg)')
    .version(version);
  // Register each command directly on the root program
  convertCommand(audioCmd);
  normalizeCommand(audioCmd);
  trimCommand(audioCmd);
  mergeCommand(audioCmd);
  extractCommand(audioCmd);
  // Show plugin branding after all commands

}
