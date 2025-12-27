import type { Command } from 'commander';
import { compressCommand } from './commands/compress.js';
import { extractCommand } from './commands/extract.js';
import { ocrCommand } from './commands/ocr.js';
import { mergeCommand } from './commands/merge.js';
import { splitCommand } from './commands/split.js';

export const name = '@mediaproc/document';
export const version = '1.0.0';

export function register(program: Command): void {
  const docCmd = program
    .command('document')
    .alias('doc')
    .description('Document processing commands (PDF, DOCX)');

  compressCommand(docCmd);
  extractCommand(docCmd);
  ocrCommand(docCmd);
  mergeCommand(docCmd);
  splitCommand(docCmd);
}
