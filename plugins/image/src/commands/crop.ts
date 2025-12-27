import type { Command } from 'commander';
import chalk from 'chalk';
import type { ImageOptions } from '../types.js';

export function cropCommand(imageCmd: Command): void {
  imageCmd
    .command('crop <input>')
    .description('Crop image to specified dimensions')
    .option('-x, --x <x>', 'X coordinate', parseInt, 0)
    .option('-y, --y <y>', 'Y coordinate', parseInt, 0)
    .option('-w, --width <width>', 'Crop width', parseInt)
    .option('-h, --height <height>', 'Crop height', parseInt)
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: ImageOptions) => {
      console.log(chalk.blue('🔧 Crop command called'));
      console.log(chalk.dim(`Input: ${input}`));
      console.log(chalk.yellow('\n⚠️  Not implemented yet - placeholder only'));
      
      // TODO: Implement with Sharp
    });
}
