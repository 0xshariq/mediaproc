import type { Command } from 'commander';
import { resizeCommand } from './commands/resize.js';
import { convertCommand } from './commands/convert.js';
import { grayscaleCommand } from './commands/grayscale.js';
import { blurCommand } from './commands/blur.js';
import { sharpenCommand } from './commands/sharpen.js';
import { rotateCommand } from './commands/rotate.js';
import { flipCommand } from './commands/flip.js';
import { cropCommand } from './commands/crop.js';
import { optimizeCommand } from './commands/optimize.js';
import { watermarkCommand } from './commands/watermark.js';

export const name = '@mediaproc/image';
export const version = '1.0.0';

export function register(program: Command): void {
  const imageCmd = program
    .command('image')
    .description('Image processing commands (powered by Sharp)');

  // Register all image subcommands
  resizeCommand(imageCmd);
  convertCommand(imageCmd);
  grayscaleCommand(imageCmd);
  blurCommand(imageCmd);
  sharpenCommand(imageCmd);
  rotateCommand(imageCmd);
  flipCommand(imageCmd);
  cropCommand(imageCmd);
  optimizeCommand(imageCmd);
  watermarkCommand(imageCmd);
}
