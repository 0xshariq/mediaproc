import type { Command } from 'commander';
import { convertCommand } from './commands/convert.js';
import { normalizeCommand } from './commands/normalize.js';
import { trimCommand } from './commands/trim.js';
import { mergeCommand } from './commands/merge.js';
import { extractCommand } from './commands/extract.js';

export const name = '@mediaproc/audio';
export const version = '1.0.0';

export function register(program: Command): void {
  const audioCmd = program
    .command('audio')
    .description('Audio processing commands (powered by FFmpeg)');

  convertCommand(audioCmd);
  normalizeCommand(audioCmd);
  trimCommand(audioCmd);
  mergeCommand(audioCmd);
  extractCommand(audioCmd);
}
