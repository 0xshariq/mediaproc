import type { Command } from 'commander';
import chalk from 'chalk';
import type { ResizeOptions } from '../types.js';

export function resizeCommand(imageCmd: Command): void {
  imageCmd
    .command('resize <input>')
    .description('Resize image to specified dimensions')
    .option('-w, --width <width>', 'Width in pixels', parseInt)
    .option('-h, --height <height>', 'Height in pixels', parseInt)
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--fit <fit>', 'Fit mode: cover, contain, fill, inside, outside', 'cover')
    .option('--no-aspect-ratio', 'Do not maintain aspect ratio')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: ResizeOptions) => {
      console.log(chalk.blue('🔧 Resize command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.dim(`Width: ${options.width || 'auto'}`));
      console.log(chalk.dim(`Height: ${options.height || 'auto'}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - placeholder only'));
      
      // TODO: Implement with Sharp
      // const sharp = require('sharp');
      // await sharp(input).resize(options.width, options.height).toFile(output);
    });
}
