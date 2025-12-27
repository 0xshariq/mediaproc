import type { Command } from 'commander';
import { optimizeCommand } from './commands/optimize.js';
import { compressTexturesCommand } from './commands/compress-textures.js';
import { convertCommand } from './commands/convert.js';
import { generateLODCommand } from './commands/generate-lod.js';

export const name = '@mediaproc/3d';
export const version = '1.0.0';

export function register(program: Command): void {
  const cmd = program.command('3d').description('3D & spatial media processing');
  optimizeCommand(cmd);
  compressTexturesCommand(cmd);
  convertCommand(cmd);
  generateLODCommand(cmd);
}
