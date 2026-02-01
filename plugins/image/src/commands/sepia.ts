import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { validatePaths, resolveOutputPaths, IMAGE_EXTENSIONS, getFileName, createStandardHelp } from '@mediaproc/core';
import { createSharpInstance } from '../utils/sharp.js';
import { ImageOptions } from '../types.js';
import path from 'node:path';

interface SepiaOptions extends ImageOptions {
  input: string;
  output?: string;
  intensity?: number;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function sepiaCommand(imageCmd: Command): void {
  imageCmd
    .command('sepia [input]')
    .description('Apply sepia tone effect (vintage/antique look)')
    .option('-i, --intensity <value>', 'Sepia intensity 0-100 (default: 80)', parseFloat, 80)
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100, only for JPEG, WebP, AVIF; for PNG, maps to compression level; ignored for others)', parseInt)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('--help', 'Display help for sepia command')
    .action(async (input: string, options: SepiaOptions) => {
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'sepia',
          emoji: '📜',
          description: 'Apply sepia tone effect to create vintage, antique, or nostalgic photographs. Converts colors to warm brown tones.',
          usage: ['sepia <input>', 'sepia <input> -i 90', 'sepia <input> -o vintage.jpg'],
          options: [
            { flag: '-i, --intensity <value>', description: 'Sepia intensity 0-100 (default: 80)' },
            { flag: '-o, --output <path>', description: 'Output file path' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (optional, only for JPEG, WebP, AVIF; for PNG, maps to compression level; ignored for others)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '--explain [mode]', description: 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'sepia photo.jpg', description: 'Apply default sepia effect' },
            { command: 'sepia image.png -i 100', description: 'Maximum sepia intensity' },
            { command: 'sepia pic.jpg -i 50', description: 'Subtle sepia tone' },
            { command: 'sepia photo.jpg -o vintage.jpg', description: 'Save as vintage photo' }
          ],
          additionalSections: [
            {
              title: 'Intensity Guide',
              items: [
                '0-30 - Subtle warm tint',
                '40-60 - Moderate vintage look',
                '70-85 - Classic sepia (recommended)',
                '90-100 - Strong antique effect'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Create vintage photograph effects',
                'Historical photo restoration style',
                'Artistic nostalgic looks',
                'Wedding photo albums',
                'Heritage collections'
              ]
            }
          ],
          tips: [
            'Start with 80 intensity for classic look',
            'Combine with vignette for enhanced vintage feel',
            'Works great on portraits and landscapes',
            'Lower intensity for subtle warmth'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Validating inputs...').start();

      try {
        const intensity = Math.max(0, Math.min(100, options.intensity || 80)) / 100;

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
          suffix: '-sepia',
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Intensity: ${(intensity * 100).toFixed(0)}%`));
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
            const metadata = await createSharpInstance(inputFile).metadata();

            // Sepia tone matrix (standard sepia transformation)
            // Adjusted by intensity
            const sepiaMatrix = [
              [0.393 * intensity + (1 - intensity), 0.769 * intensity, 0.189 * intensity],
              [0.349 * intensity, 0.686 * intensity + (1 - intensity), 0.168 * intensity],
              [0.272 * intensity, 0.534 * intensity, 0.131 * intensity + (1 - intensity)]
            ];

            const pipeline = createSharpInstance(inputFile)
              .recomb(sepiaMatrix as [[number, number, number], [number, number, number], [number, number, number]]);

            const outputExt = path.extname(outputPath).toLowerCase();
            if (outputExt === '.jpg' || outputExt === '.jpeg' || outputExt === '.webp' || outputExt === '.avif') {
              if (typeof options.quality === 'number' && !isNaN(options.quality)) {
                if (outputExt === '.jpg' || outputExt === '.jpeg') {
                  pipeline.jpeg({ quality: options.quality });
                } else if (outputExt === '.webp') {
                  pipeline.webp({ quality: options.quality });
                } else if (outputExt === '.avif') {
                  pipeline.avif({ quality: options.quality });
                }
              } else {
                if (outputExt === '.jpg' || outputExt === '.jpeg') {
                  pipeline.jpeg();
                } else if (outputExt === '.webp') {
                  pipeline.webp();
                } else if (outputExt === '.avif') {
                  pipeline.avif();
                }
              }
            } else if (outputExt === '.png') {
              // For PNG, map quality (1-100) to compressionLevel (0-9)
              if (typeof options.quality === 'number' && !isNaN(options.quality)) {
                const compressionLevel = Math.round(9 - (options.quality / 100) * 9);
                pipeline.png({ compressionLevel });
              } else {
                pipeline.png();
              }
            }
            // For other formats, do not apply quality

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
