import type { Command } from 'commander';
import { runPipelineCommand } from './commands/run.js';
import { validatePipelineCommand } from './commands/validate.js';

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
export const name = '@mediaproc/pipeline';
export const version = currentVersion;

export function register(program: Command): void {
  const cmd = program.command('pipeline').description('Media processing pipelines').version(version);
  runPipelineCommand(cmd);
  validatePipelineCommand(cmd);
}
