import type { Command } from 'commander';
import { packCommand } from './commands/pack.js';
import { chunkCommand } from './commands/chunk.js';
import { encryptCommand } from './commands/encrypt.js';

export const name = '@mediaproc/stream';
export const version = '1.0.0';

export function register(program: Command): void {
  const cmd = program.command('stream').description('Streaming & packaging');
  packCommand(cmd);
  chunkCommand(cmd);
  encryptCommand(cmd);
}
