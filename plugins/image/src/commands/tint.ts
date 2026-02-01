import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { validatePaths, resolveOutputPaths, IMAGE_EXTENSIONS, getFileName, createStandardHelp, normalizeColor } from '@mediaproc/core';
import type { FilterOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import path from 'node:path';

interface TintOptions extends FilterOptions {
  color?: string;
  help?: boolean;
}

export function tintCommand(imageCmd: Command): void {
  imageCmd
    .command('tint [input]')
    .description('Apply color tint to image')
    .option('-c, --color <color>', 'Tint color (hex, rgb, or name, default: #0000ff)', '#0000ff')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('--help', 'Show detailed help for tint command')
    .action(async (input: string, options: TintOptions) => {
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'tint',
          emoji: '🎨',
          description: 'Apply color tint overlay to images. Accepts hex, rgb(a), named, and ascii color formats.',
          usage: ['tint <input>', 'tint <input> -c <color>', 'tint <input> -c "#ff6600"'],
          options: [
            { flag: '-c, --color <color>', description: 'Tint color as hex (#ff0000), rgb (rgb(255,0,0)), rgba(255,0,0,0.5), name (red), ascii (255,0,0)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-tinted.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (optional, only applies to JPEG, WEBP, AVIF; for PNG, mapped to compression level)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '--explain [mode]', description: 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.' },
            { flag: '-v, --verbose', description: 'Show detailed output' },
            { flag: '--help', description: 'Display help for tint command' }
          ],
          examples: [
            { command: 'tint photo.jpg -c blue', description: 'Apply blue tint' },
            { command: 'tint image.png -c "#ff6600"', description: 'Apply orange tint (hex color)' },
            { command: 'tint pic.jpg -c "rgb(255, 0, 128)"', description: 'Apply pink tint (RGB)' },
            { command: 'tint photo.jpg -c red', description: 'Apply red tint' }
          ],
          additionalSections: [
            {
              title: 'Color Formats',
              items: [
                'Hex: #ff0000, #f00',
                'RGB: rgb(255,0,0), rgba(255,0,0,0.5)',
                'Named: red, blue, green, yellow, etc.',
                'ASCII: 255,0,0 or 255,0,0,0.5',
                'Popular: sepia (#704214), cyan (#00ffff)'
              ]
            },
            {
              title: 'Common Tints',
              items: [
                'Sepia: #704214 - Vintage/warm look',
                'Blue: #0066cc - Cool/cold mood',
                'Orange: #ff6600 - Warm/sunset effect',
                'Purple: #9933cc - Creative/artistic',
                'Green: #00cc66 - Nature/fresh feel'
              ]
            }
          ],
          tips: [
            'Subtle tints work better than strong colors',
            'Use sepia (#704214) for vintage effects',
            'Blue tints create cool, calm atmospheres',
            'Orange/red tints add warmth to photos'
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
          suffix: '-tinted',
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        if (options.verbose) {
          console.log(chalk.blue('\nConfiguration:'));
          console.log(chalk.dim(`  Color: ${options.color || '#0000ff'}`));
          if (typeof options.quality !== 'undefined') {
            console.log(chalk.dim(`  Quality: ${options.quality}`));
          }
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
            const pipeline = createSharpInstance(inputFile).tint(normalizeColor(options.color || '#0000ff', 'auto'));

            const outputExt = path.extname(outputPath).toLowerCase();
            if (outputExt === '.jpg' || outputExt === '.jpeg') {
              if (typeof options.quality === 'number') {
                pipeline.jpeg({ quality: options.quality });
              } else {
                pipeline.jpeg();
              }
            } else if (outputExt === '.webp') {
              if (typeof options.quality === 'number') {
                pipeline.webp({ quality: options.quality });
              } else {
                pipeline.webp();
              }
            } else if (outputExt === '.avif') {
              if (typeof options.quality === 'number') {
                pipeline.avif({ quality: options.quality });
              } else {
                pipeline.avif();
              }
            } else if (outputExt === '.png') {
              let compressionLevel = 9;
              if (typeof options.quality === 'number') {
                compressionLevel = Math.round((100 - Math.max(1, Math.min(100, options.quality))) * 9 / 99);
              }
              pipeline.png({ compressionLevel });
            }
            // For other formats, do not set quality

            await pipeline.toFile(outputPath);

            if (options.verbose) {
              spinner.succeed(chalk.green(`✓ ${fileName} processed (${metadata.width}x${metadata.height}, color=${options.color || '#0000ff'})`));
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
        console.log(chalk.dim(`  Color: ${options.color || '#0000ff'}`));
      } catch (error) {
        spinner.fail(chalk.red('Failed to apply tint'));
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
