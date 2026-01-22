import type { Command } from 'commander';
import { compressCommand } from './commands/compress.js';
import { convertCommand } from './commands/convert.js';
import { transcodeCommand } from './commands/transcode.js';
import { extractCommand } from './commands/extract.js';
import { trimCommand } from './commands/trim.js';
import { resizeCommand } from './commands/resize.js';
import { mergeCommand } from './commands/merge.js';
import {version as videoPluginVersion} from './cli.js';


export const name = '@mediaproc/video';
export const version = videoPluginVersion;

export function register(program: Command): void {
  const videoCmd = program
    .command('video')
    .description('Video processing commands (powered by FFmpeg)')
    .version(version);
  // Register commands directly without 'video' subcommand
  compressCommand(videoCmd);
  convertCommand(videoCmd);
  transcodeCommand(videoCmd);
  extractCommand(videoCmd);
  trimCommand(videoCmd);
  resizeCommand(videoCmd);
  mergeCommand(videoCmd);
}
