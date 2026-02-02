import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { validatePaths, resolveOutputPaths, IMAGE_EXTENSIONS, getFileName, createStandardHelp } from '@mediaproc/core';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import path from 'node:path';

interface FlattenOptions extends ImageOptions {
  background?: string;
}

export function flattenCommand(imageCmd: Command): void {
  const cmd = imageCmd
    .command('flatten [input]')
    .description('Flatten alpha transparency onto background color')
    .option('--background <color>', 'Background color as hex (default: #ffffff)', '#ffffff')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt)
    .option('--dry-run', 'Show what would be done without executing')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('-v, --verbose', 'Verbose output');

  cmd.addHelpText('after', () => {
    return '\n' + createStandardHelp({
      pluginName: 'image',
      commandName: 'flatten',
      emoji: '🎨',
      description: 'Remove alpha channel by merging transparency onto a solid background color. Essential for converting PNGs with transparency to JPEGs.',
      usage: ['flatten <input>', 'flatten <input> --background #ff0000'],
      options: [
        { flag: '--background <color>', description: 'Background color as hex (default: #ffffff white)' },
        { flag: '-o, --output <path>', description: 'Output file path (default: <input>-flat.<ext>)' },
        { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (optional, only applies to JPEG, WEBP, AVIF; for PNG, mapped to compression level)' },
        { flag: '--dry-run', description: 'Preview changes without executing' },
        { flag: '--explain [mode]', description: 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.' },
        { flag: '-v, --verbose', description: 'Show detailed output' }
      ],
      examples: [
        { command: 'flatten logo.png', description: 'Flatten onto white background' },
        { command: 'flatten image.png --background #000000', description: 'Flatten onto black' },
        { command: 'flatten graphic.png --background #ff0000 -o red-bg.jpg', description: 'Flatten onto red and save as JPG' }
      ],
      additionalSections: [
        {
          title: 'Use Cases',
          items: [
            'Convert PNG with transparency to JPEG',
            'Prepare images for platforms that don\'t support transparency',
            'Composite transparent images onto colored backgrounds',
            'Remove alpha channel to reduce file size'
          ]
        },
        {
          title: 'Color Formats',
          items: [
            '#ffffff - White (default)',
            '#000000 - Black',
            '#ff0000 - Red',
            '#00ff00 - Green',
            '#0000ff - Blue',
            'Use 6-digit hex format'
          ]
        }
      ],
      tips: [
        'Required when converting PNG to JPEG',
        'White background is default',
        'Choose background color that matches your design',
        'Flattened images have smaller file sizes'
      ]
    });
  });

  cmd.action(async (input: string | undefined, options: FlattenOptions) => {
    if (!input) {
      console.error(chalk.red('Error: input argument is required'));
      process.exit(1);
    }
    const spinner = ora('Validating inputs...').start();

    try {
      // Parse background color
      const bgColor = options.background || '#ffffff';
      const bgHex = bgColor.replace('#', '');

      if (!/^[0-9A-Fa-f]{6}$/.test(bgHex)) {
        spinner.fail(chalk.red('Invalid background color format. Use 6-digit hex like #ffffff'));
        process.exit(1);
      }

      const r = parseInt(bgHex.substring(0, 2), 16);
      const g = parseInt(bgHex.substring(2, 4), 16);
      const b = parseInt(bgHex.substring(4, 6), 16);

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
        suffix: '-flat',
      });

      spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

      if (options.verbose) {
        console.log(chalk.blue('\nConfiguration:'));
        console.log(chalk.dim(`  Background: ${bgColor} (R:${r}, G:${g}, B:${b})`));
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
          const pipeline = createSharpInstance(inputFile).flatten({
            background: { r, g, b }
          });

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
      spinner.fail(chalk.red('Failed to flatten image'));
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(errorMessage));
      process.exit(1);
    }
  });
}
