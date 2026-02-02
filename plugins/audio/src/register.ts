
import type { Command } from 'commander';
import { convertCommand } from './commands/convert.js';
import { normalizeCommand } from './commands/normalize.js';
import { trimCommand } from './commands/trim.js';
import { mergeCommand } from './commands/merge.js';
import { extractCommand } from './commands/extract.js';
import { metadataCommand } from './commands/metadata.js';

// ESM dynamic import for package.json version
import { fileURLToPath } from 'url';
import path from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgPath = path.join(__dirname, '../package.json');
let currentVersion = 'unknown';
try {
  const pkgContent = readFileSync(pkgPath, 'utf-8');
  const pkg = JSON.parse(pkgContent);
  currentVersion = pkg.version;
} catch (e) {
  console.warn('Failed to read package version:', e);
}


export const name = '@mediaproc/audio';
export const version = currentVersion;
export const isBuiltIn = true;
export const description = 'Audio processing powered by FFmpeg - convert, normalize, trim, merge, and extract audio tracks';
export const author = 'MediaProc Team';
export const systemRequirements = ['FFmpeg 4.0+'];

export function register(program: Command): void {
  const audioCmd = program
    .command('audio')
    .description('Audio processing commands (powered by FFmpeg)')
    .version(currentVersion, '-V, --version', 'Output the audio plugin version')
    .helpOption('-h, --help', 'Display help for audio plugin');

  // Register each command on the audio subcommand
  convertCommand(audioCmd);
  normalizeCommand(audioCmd);
  trimCommand(audioCmd);
  mergeCommand(audioCmd);
  extractCommand(audioCmd);
  metadataCommand(audioCmd);
}
