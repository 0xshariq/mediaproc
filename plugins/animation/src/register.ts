import type { Command } from 'commander';
import { gififyCommand } from './commands/gifify.js';
import { optimizeCommand } from './commands/optimize.js';

export const name = '@mediaproc/animation';
export const version = '1.0.0';

export function register(program: Command): void {
  const animCmd = program
    .command('animation')
    .alias('anim')
    .description('Animation processing commands (GIF, WebP, Lottie)');

  gififyCommand(animCmd);
  optimizeCommand(animCmd);
}
