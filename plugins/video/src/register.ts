import type { Command } from 'commander';
import { compressCommand } from './commands/compress.js';
import { convertCommand } from './commands/convert.js';
import { transcodeCommand } from './commands/transcode.js';
import { extractCommand } from './commands/extract.js';
import { trimCommand } from './commands/trim.js';
import { resizeCommand } from './commands/resize.js';
import { mergeCommand } from './commands/merge.js';
import { metadataCommand } from './commands/metadata.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgUrl = path.join(__dirname, '../package.json');
let currentVersion = 'unknown';
try {
  const pkg = await import(pkgUrl, { assert: { type: 'json' } });
  currentVersion = pkg.default.version as string;
} catch (e) {
  // fallback or log error if needed
}



export const name = '@mediaproc/video';
export const version = currentVersion;
export const isBuiltIn = true;
export const description = 'Professional video processing powered by FFmpeg - compress, transcode, trim, resize, merge, and extract media';
export const author = 'MediaProc Team';
export const systemRequirements = ['FFmpeg 4.0+'];

export function register(program: Command): void {
  const videoCmd = program
    .command('video')
    .description('Video processing commands (powered by FFmpeg)')
    .version(currentVersion, '-v, --version', 'Output the video plugin version')
    .helpOption('-h, --help', 'Display help for video plugin');
    
  // Register commands directly without 'video' subcommand
  compressCommand(videoCmd);
  convertCommand(videoCmd);
  transcodeCommand(videoCmd);
  extractCommand(videoCmd);
  trimCommand(videoCmd);
  resizeCommand(videoCmd);
  mergeCommand(videoCmd);
  metadataCommand(videoCmd);
}
