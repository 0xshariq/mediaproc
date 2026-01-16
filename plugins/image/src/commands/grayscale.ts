import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { validatePaths, resolveOutputPaths, IMAGE_EXTENSIONS, getFileName, createStandardHelp, showPluginBranding } from '@mediaproc/core';
import type { FilterOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import path from 'node:path';

export function grayscaleCommand(imageCmd: Command): void {
  imageCmd
    .command('grayscale <input>')
    .alias('greyscale')
    .description('Convert image to grayscale (black and white)')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--explain', 'Explain the proper flow of this command in detail (Coming Soon...)')
    .option('--help', 'Display help for grayscale command')
    .action(async (input: string, options: FilterOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'grayscale',
          emoji: '⚫',
          description: 'Convert color images to grayscale (black and white). Perfect for creating artistic effects, reducing file size, or preparing images for print.',
          usage: ['grayscale <input>', 'grayscale <input> -o <output>', 'greyscale <input>'],
          options: [
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-grayscale.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '--explain', description: 'Explain what is happening behind the scene in proper flow and in detail (Coming Soon...)' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'grayscale photo.jpg', description: 'Convert to grayscale with default settings' },
            { command: 'grayscale image.png -o bw.png', description: 'Convert with custom output name' },
            { command: 'greyscale portrait.jpg -q 95', description: 'Convert with high quality (UK spelling)' }
          ],
          tips: ['Grayscale images are typically smaller than color images', 'Both "grayscale" and "greyscale" commands work identically']
        });
        process.exit(0);
      }

      const spinner = ora('Validating inputs...').start();

      try {
        const { inputFiles, outputPath, errors } = validatePaths(input, options.output, {
          allowedExtensions: IMAGE_EXTENSIONS,
        });

        if (errors.length > 0) {
          spinner.fail(chalk.red('Validation failed:'));
          errors.forEach(err => console.log(chalk.red(`  ✗ ${err}`)));
          process.exit(1);
        }

        if (inputFiles.length === 0) {
          spinner.fail(chalk.red('No valid image files found'));
          process.exit(1);
        }

        const outputPaths = resolveOutputPaths(inputFiles, outputPath, {
          suffix: '-grayscale',
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Quality: ${options.quality || 90}`));
        }

        if (options.dryRun) {
          console.log(chalk.yellow('\nDry run mode - no changes will be made\n'));
          console.log(chalk.green(`Would process ${inputFiles.length} image(s):`));
          inputFiles.forEach((inputFile, index) => {
            const outputPath = outputPaths.get(inputFile);
            console.log(chalk.dim(`  ${index + 1}. ${getFileName(inputFile)} → ${getFileName(outputPath!)}`));
          });
          showPluginBranding('Image', '../../package.json');
          return;
        }
        if (options.explain) {
          console.log(chalk.gray('Explain mode is not yet available.'))
          console.log(chalk.cyan('Planned for v0.8.x.'))
        }

        let successCount = 0;
        let failCount = 0;

        for (const [index, inputFile] of inputFiles.entries()) {
          const outputPath = outputPaths.get(inputFile)!;
          const fileName = getFileName(inputFile);

          spinner.start(`Processing ${index + 1}/${inputFiles.length}: ${fileName}...`);

          try {
            const metadata = await createSharpInstance(inputFile).metadata();
            const pipeline = createSharpInstance(inputFile).grayscale();

            const outputExt = path.extname(outputPath).toLowerCase();
            if (outputExt === '.jpg' || outputExt === '.jpeg') {
              pipeline.jpeg({ quality: options.quality || 90 });
            } else if (outputExt === '.png') {
              pipeline.png({ quality: options.quality || 90 });
            } else if (outputExt === '.webp') {
              pipeline.webp({ quality: options.quality || 90 });
            }

            await pipeline.toFile(outputPath);

            if (options.verbose) {
              spinner.succeed(chalk.green(`✓ ${fileName} processed (${metadata.width}x${metadata.height})`));
            } else {
              spinner.succeed(chalk.green(`✓ ${fileName} processed`));
            }
            successCount++;
          } catch (error) {
            spinner.fail(chalk.red(`✗ Failed: ${fileName}`));
            if (options.verbose && error instanceof Error) {
              console.log(chalk.red(`    Error: ${error.message}`));
            }
            failCount++;
          }
        }

        console.log(chalk.bold('\nSummary:'));
        console.log(chalk.green(`  ✓ Success: ${successCount}`));
        if (failCount > 0) {
          console.log(chalk.red(`  ✗ Failed: ${failCount}`));
        }
        showPluginBranding('Image', '../../package.json');

      } catch (error) {
        spinner.fail(chalk.red('Processing failed'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
