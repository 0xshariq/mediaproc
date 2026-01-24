import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { validatePaths, resolveOutputPaths, IMAGE_EXTENSIONS, getFileName, createStandardHelp } from '@mediaproc/core';
import type { FilterOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import path from 'node:path';

interface NormalizeOptions extends FilterOptions {
  help?: boolean;
}

export function normalizeCommand(imageCmd: Command): void {
  imageCmd
    .command('normalize <input>')
    .description('Normalize image (enhance contrast)')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('--help', 'Display help for normalize command')
    .action(async (input: string, options: NormalizeOptions) => {
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'normalize',
          emoji: '📊',
          description: 'Normalize image by enhancing contrast using histogram stretching. Automatically adjusts brightness and contrast for optimal image quality.',
          usage: ['normalize <input>', 'normalize <input> -o output.jpg', 'normalize photo.jpg -q 95'],
          options: [
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-normalized.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality (1-100). Optional. Applies to JPEG/WEBP/AVIF. For PNG, maps to compression level (higher quality = lower compression). Ignored for other formats.' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '--explain [mode]', description: 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'normalize photo.jpg', description: 'Enhance contrast automatically' },
            { command: 'normalize dark-image.png', description: 'Fix underexposed image' },
            { command: 'normalize washed-out.jpg', description: 'Fix overexposed/washed out image' },
            { command: 'normalize pic.jpg -q 95', description: 'Normalize with high quality' }
          ],
          additionalSections: [
            {
              title: 'How It Works',
              items: [
                'Stretches histogram to use full dynamic range',
                'Enhances contrast by spreading pixel values',
                'Darkest pixels become black, brightest become white',
                'Improves visibility of details',
                'Non-destructive automatic adjustment'
              ]
            },
            {
              title: 'Best For',
              items: [
                'Underexposed photos (too dark)',
                'Overexposed photos (too bright/washed out)',
                'Low contrast images (flat/dull)',
                'Scanned documents',
                'Images with poor lighting'
              ]
            }
          ],
          tips: [
            'Works best on images with poor exposure',
            'May not improve well-exposed images',
            'Great for batch processing old photos',
            'Combine with sharpen for best results'
          ]
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
          suffix: '-normalized',
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Quality: ${options.quality}`));
        }

        if (options.dryRun) {
          console.log(chalk.yellow('\nDry run mode - no changes will be made\n'));
          console.log(chalk.green(`Would process ${inputFiles.length} image(s):`));
          inputFiles.forEach((inputFile, index) => {
            const outputPath = outputPaths.get(inputFile);
            console.log(chalk.dim(`  ${index + 1}. ${getFileName(inputFile)} → ${getFileName(outputPath!)}`));
          });
          return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const [index, inputFile] of inputFiles.entries()) {
          const outputPath = outputPaths.get(inputFile)!;
          const fileName = getFileName(inputFile);

          spinner.start(`Processing ${index + 1}/${inputFiles.length}: ${fileName}...`);

          try {
            const pipeline = createSharpInstance(inputFile).normalize();

            const outputExt = path.extname(outputPath).toLowerCase();
            if (outputExt === '.jpg' || outputExt === '.jpeg') {
              pipeline.jpeg({ quality: options.quality });
            } else if (outputExt === '.png') {
              pipeline.png({ quality: options.quality });
            } else if (outputExt === '.webp') {
              pipeline.webp({ quality: options.quality });
            }

            await pipeline.toFile(outputPath);

            spinner.succeed(chalk.green(`✓ ${fileName} processed`));
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

      } catch (error) {
        spinner.fail(chalk.red('Failed to normalize image'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
