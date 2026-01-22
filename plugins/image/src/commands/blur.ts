import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';


import { validatePaths, resolveOutputPaths, IMAGE_EXTENSIONS, getFileName, createStandardHelp } from '@mediaproc/core';
import { MediaProcError, ValidationError, UserInputError, EXIT_CODES } from '@mediaproc/core';
import type { FilterOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import path from 'node:path';

export function blurCommand(imageCmd: Command): void {
  imageCmd
    .command('blur <input>')
    .description('Apply blur effect to image')
    .option('-s, --sigma <sigma>', 'Blur strength (0.3-1000, default: 10)', parseFloat, 10)
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for blur command')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .action(async (input: string, options: FilterOptions) => {
      // Show help if requested
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'blur',
          emoji: '🌫️',
          description: 'Apply Gaussian blur effect to images. Control the blur intensity with sigma parameter for subtle to extreme blur effects.',
          usage: [
            'blur <input>',
            'blur <input> -s <sigma>',
            'blur <input> -s <sigma> -o <output>'
          ],
          options: [
            { flag: '-s, --sigma <sigma>', description: 'Blur strength (0.3-1000, default: 10)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-blurred.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '--explain [mode]', description: 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'blur photo.jpg', description: 'Apply default blur (sigma: 10)' },
            { command: 'blur image.png -s 5', description: 'Apply light blur' },
            { command: 'blur pic.jpg -s 50', description: 'Apply heavy blur' },
            { command: 'blur photo.jpg -s 20 -o blurred.jpg', description: 'Blur with custom output' },
            { command: 'blur background.png -s 30 -q 95', description: 'Blur with high quality' }
          ],
          additionalSections: [
            {
              title: 'Blur Strength Guide',
              items: [
                'Light blur: 1-5 (subtle effect)',
                'Medium blur: 5-15 (noticeable but detailed)',
                'Strong blur: 15-30 (background blur effect)',
                'Heavy blur: 30+ (privacy/anonymization)'
              ]
            }
          ],
          tips: [
            'Use sigma 3-5 for portrait background blur',
            'Use sigma 20+ for privacy/face obscuring',
            'Higher sigma values increase processing time'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Validating inputs...').start();

      try {
        // Validate sigma
        if (options.sigma && (options.sigma < 0.3 || options.sigma > 1000)) {
          throw new ValidationError('Sigma must be between 0.3 and 1000', { sigma: options.sigma }, undefined);
        }

        // Validate quality
        const quality = typeof options.quality === 'number' ? options.quality : 90;
        if (isNaN(quality) || quality < 1 || quality > 100) {
          throw new ValidationError('Quality must be an integer between 1 and 100', { quality }, undefined);
        }

        const { inputFiles, outputPath, errors } = validatePaths(input, options.output, {
          allowedExtensions: IMAGE_EXTENSIONS,
        });

        if (errors.length > 0) {
          throw new ValidationError('Validation failed', errors, undefined);
        }

        if (inputFiles.length === 0) {
          throw new UserInputError('No valid image files found', undefined, undefined);
        }

        const outputPaths = resolveOutputPaths(inputFiles, outputPath, {
          suffix: '-blurred',
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Sigma: ${options.sigma || 10}`));
          console.log(chalk.dim(`  Quality: ${quality}`));
        }

        if (options.dryRun) {
          console.log(chalk.yellow('\nDry run mode - no changes will be made\n'));
          console.log(chalk.green(`Would blur ${inputFiles.length} image(s):`));
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
            const pipeline = createSharpInstance(inputFile).blur(options.sigma || 10);

            const outputExt = path.extname(outputPath).toLowerCase();
            if (outputExt === '.jpg' || outputExt === '.jpeg') {
              pipeline.jpeg({ quality });
            } else if (outputExt === '.png') {
              pipeline.png({ quality });
            } else if (outputExt === '.webp') {
              pipeline.webp({ quality });
            }

            await pipeline.toFile(outputPath);

            spinner.succeed(chalk.green(`✓ ${fileName} blurred`));
            successCount++;
          } catch (error) {
            spinner.fail(chalk.red(`✗ Failed to blur ${fileName}`));
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
        spinner.fail(chalk.red('Failed to blur images'));
        if (error instanceof MediaProcError) {
          console.error(chalk.red(error.message));
          process.exit(error.exitCode);
        } else {
          console.error(chalk.red(error instanceof Error ? error.message : String(error)));
          process.exit(EXIT_CODES.INTERNAL);
        }
      }
    });
}
