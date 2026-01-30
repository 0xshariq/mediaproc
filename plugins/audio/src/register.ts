
import type { Command } from 'commander';
import { convertCommand } from './commands/convert.js';
import { normalizeCommand } from './commands/normalize.js';
import { trimCommand } from './commands/trim.js';
import { mergeCommand } from './commands/merge.js';
import { extractCommand } from './commands/extract.js';

// ESM dynamic import for package.json version
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


export const name = '@mediaproc/audio';
export const version = currentVersion;
export const isBuiltIn = true;

export function register(program: Command): void {
  // Register each command directly on the root program
  convertCommand(program);
  normalizeCommand(program);
  trimCommand(program);
  mergeCommand(program);
  extractCommand(program);
}
