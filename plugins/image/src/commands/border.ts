import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { validatePaths, resolveOutputPaths, IMAGE_EXTENSIONS, getFileName, createStandardHelp, normalizeColor } from '@mediaproc/core';
import type { BorderOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import path from 'node:path';

interface BorderOptionsExtended extends BorderOptions {
  help?: boolean;
}

export function borderCommand(imageCmd: Command): void {
  imageCmd
    .command('border [input]')
    .description('Add decorative border/frame around image')
    .option('-w, --width <pixels>', 'Border width in pixels', parseInt, 10)
    .option('--color <color>', 'Border color (hex, rgb, or name)', '#000000')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Output quality (1-100). Optional. Applies to JPEG/WEBP/AVIF. For PNG, maps to compression level (higher quality = lower compression). Ignored for other formats.', parseInt)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('--help', 'Show detailed help for border command')
    .action(async (input: string, options: BorderOptionsExtended) => {
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'border',
          emoji: '🖼️',
          description: 'Add solid color borders or decorative frames around images. Accepts hex, rgb(a), named, and ascii color formats.',
          usage: ['border <input>', 'border <input> --width 20 --color white', 'border <input> -w 50 --color "#FF0000"'],
          options: [
            { flag: '-w, --width <pixels>', description: 'Border width in pixels (default: 10)' },
            { flag: '--color <color>', description: 'Border color - hex (#FF0000), rgb (rgb(255,0,0)), rgba(255,0,0,0.5), name (red), ascii (255,0,0)' },
            { flag: '-o, --output <path>', description: 'Output file path' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-q, --quality <quality>', description: 'Output quality (1-100). Optional. Applies to JPEG/WEBP/AVIF. For PNG, maps to compression level (higher quality = lower compression). Ignored for other formats.' },
            { flag: '--explain [mode]', description: 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.' },
            { flag: '-v, --verbose', description: 'Show detailed output' },
            { flag: '--help', description: 'Display help for border command' }
          ],
          examples: [
            { command: 'border photo.jpg', description: 'Add default 10px black border' },
            { command: 'border image.png --width 20 --color white', description: 'Add 20px white border' },
            { command: 'border pic.jpg -w 5 --color "#FF5733"', description: 'Add 5px orange border' },
            { command: 'border photo.jpg --width 30 --color "rgb(100,100,100)"', description: 'Add 30px gray border' },
            { command: 'border image.png --width 15 --color gold', description: 'Add 15px gold border' }
          ],
          additionalSections: [
            {
              title: 'Color Formats',
              items: [
                'Hex: #FF0000, #00FF00, #0000FF',
                'RGB: rgb(255,0,0), rgba(255,0,0,0.5)',
                'Named: white, black, red, blue, gold, silver, etc.',
                'ASCII: 255,0,0 or 255,0,0,0.5',
                'Transparent: rgba(0,0,0,0) for transparent border'
              ]
            },
            {
              title: 'Use Cases',
              items: [
                'Frame images for presentations',
                'Add white space around photos',
                'Create Instagram-style borders',
                'Separate images in galleries',
                'Professional photo finishing'
              ]
            }
          ],
          tips: [
            'Use white borders for clean, modern look',
            'Black borders work well for galleries',
            'Colored borders can match brand identity',
            'Larger borders create emphasis'
          ]
        });
        return;
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
          suffix: '-border',
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Border width: ${options.width || 10}px`));
          console.log(chalk.dim(`  Border color: ${options.color || '#000000'}`));
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
            let pipeline = createSharpInstance(inputFile)
              .extend({
                top: options.width || 10,
                bottom: options.width || 10,
                left: options.width || 10,
                right: options.width || 10,
                background: normalizeColor(options.color || '#000000', 'auto')
              });

            const outputExt = path.extname(outputPath).toLowerCase();
            if (outputExt === '.jpg' || outputExt === '.jpeg') {
              pipeline = pipeline.jpeg({ quality: options.quality });
            } else if (outputExt === '.png') {
              pipeline = pipeline.png({ quality: options.quality });
            } else if (outputExt === '.webp') {
              pipeline = pipeline.webp({ quality: options.quality });
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
        spinner.fail(chalk.red('Failed to add border'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}