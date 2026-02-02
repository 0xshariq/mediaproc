import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { validatePaths, resolveOutputPaths, IMAGE_EXTENSIONS, getFileName, createStandardHelp } from '@mediaproc/core';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import path from 'node:path';

interface RecombOptions extends ImageOptions {
  matrix?: string;
  help?: boolean;
}

export function recombCommand(imageCmd: Command): void {
  imageCmd
    .command('recomb [input]')
    .description('Recombine RGB channels using matrix')
    .option('--matrix <values>', 'Recombination matrix (3x3) as JSON', '[[1,0,0],[0,1,0],[0,0,1]]')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100, only for JPEG, WebP, AVIF; for PNG, maps to compression level; ignored for others)', parseInt)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('--help', 'Display help for recomb command')
    .action(async (input: string | undefined, options: RecombOptions) => {
      if (options.help || !input) {
        createStandardHelp({
          pluginName: 'image',
          commandName: 'recomb',
          emoji: '🌈',
          description: 'Recombine image channels using a transformation matrix. Create custom color effects by mixing R, G, B channels.',
          usage: [
            'recomb <input> --matrix "[[1,0,0],[0,1,0],[0,0,1]]"',
            'recomb <input> --matrix "[[0,0,1],[0,1,0],[1,0,0]]" (swap R/B)'
          ],
          options: [
            { flag: '--matrix <values>', description: '3x3 matrix as JSON array (default: identity)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-recomb.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (optional, only for JPEG, WebP, AVIF; for PNG, maps to compression level; ignored for others)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '--explain [mode]', description: 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'recomb image.jpg --matrix "[[0,0,1],[0,1,0],[1,0,0]]"', description: 'Swap red and blue channels' },
            { command: 'recomb photo.jpg --matrix "[[0.5,0.5,0],[0.5,0.5,0],[0,0,1]]"', description: 'Average red/green, keep blue' },
            { command: 'recomb pic.jpg --matrix "[[1,0,0],[1,0,0],[1,0,0]]"', description: 'Use red channel for all' }
          ],
          additionalSections: [
            {
              title: 'Matrix Format',
              items: [
                '3x3 matrix: [[R],[G],[B]]',
                'Each row defines output channel',
                'Each column represents input channel (R, G, B)',
                'Identity [[1,0,0],[0,1,0],[0,0,1]] = no change'
              ]
            },
            {
              title: 'Common Operations',
              items: [
                'Swap R/B: [[0,0,1],[0,1,0],[1,0,0]]',
                'Swap R/G: [[0,1,0],[1,0,0],[0,0,1]]',
                'Grayscale: [[0.33,0.33,0.33],...] (all rows same)',
                'Red only: [[1,0,0],[0,0,0],[0,0,0]]',
                'Remove red: [[0,0,0],[0,1,0],[0,0,1]]'
              ]
            },
            {
              title: 'Creative Effects',
              items: [
                'Channel shifting creates false color effects',
                'Mixing channels creates unique tones',
                'Can simulate color blindness',
                'Create infrared-like effects'
              ]
            }
          ],
          tips: [
            'Identity matrix produces no change',
            'Values typically 0 to 1',
            'Can use negative values for inversions',
            'Useful for color correction and artistic effects'
          ]
        });
        return;
      }
      const spinner = ora('Validating inputs...').start();

      try {
        // Parse matrix
        const matrixStr = options.matrix || '[[1,0,0],[0,1,0],[0,0,1]]';
        let matrix: number[][];
        try {
          matrix = JSON.parse(matrixStr);
          if (!Array.isArray(matrix) || matrix.length !== 3) {
            throw new Error('Matrix must be 3x3');
          }
          for (const row of matrix) {
            if (!Array.isArray(row) || row.length !== 3) {
              throw new Error('Each row must have 3 values');
            }
          }
        } catch (e) {
          spinner.fail(chalk.red('Invalid matrix format. Use 3x3 JSON array like [[1,0,0],[0,1,0],[0,0,1]]'));
          process.exit(1);
        }

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
          suffix: '-recomb',
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Matrix: ${JSON.stringify(matrix)}`));
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
            const pipeline = createSharpInstance(inputFile).recomb(matrix as [[number, number, number], [number, number, number], [number, number, number]]);

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
        spinner.fail(chalk.red('Processing failed'));
        if (options.verbose && error instanceof Error) {
          console.log(chalk.red(`Error: ${error.message}`));
        }
        process.exit(1);
      }
    });
}
