import type { Command } from 'commander';
import chalk from 'chalk';
import type { OCROptions } from '../types.js';

export function ocrCommand(docCmd: Command): void {
  docCmd
    .command('ocr <input>')
    .description('Extract text from scanned PDF or image using OCR')
    .option('-o, --output <path>', 'Output file path')
    .option('--language <lang>', 'OCR language (e.g., eng, spa, fra)', 'eng')
    .option('--format <format>', 'Output format: text, pdf', 'text')
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: OCROptions) => {
      console.log(chalk.blue('📄 OCR command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - requires Tesseract'));
    });
}
