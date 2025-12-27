import type { Command } from 'commander';
import { blurFacesCommand } from './commands/blur-faces.js';
import { captionCommand } from './commands/caption.js';
import { sceneDetectionCommand } from './commands/scene-detection.js';
import { removeBackgroundCommand } from './commands/remove-background.js';

export const name = '@mediaproc/ai';
export const version = '1.0.0';

export function register(program: Command): void {
  const cmd = program.command('ai').description('AI-assisted media processing');
  blurFacesCommand(cmd);
  captionCommand(cmd);
  sceneDetectionCommand(cmd);
  removeBackgroundCommand(cmd);
}
