import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';


import * as fs from 'fs';
import { validatePaths, resolveOutputPaths, IMAGE_EXTENSIONS, getFileName, createStandardHelp } from '@mediaproc/core';
import { MediaProcError, ValidationError, UserInputError, EXIT_CODES } from '@mediaproc/core';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import path from 'path';

interface BooleanOptions extends ImageOptions {
  operation: string;
  operand?: string;
}

export function booleanCommand(imageCmd: Command): void {
  const cmd = imageCmd
    .command('boolean <input>')
    .description('Perform boolean operations between images')
    .requiredOption('--operation <op>', 'Boolean operation: and, or, eor (XOR)','and')
    .requiredOption('--operand <path>', 'Second image for operation')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('-v, --verbose', 'Verbose output');

  cmd.addHelpText('after', () => {
    return '\n' +
      createStandardHelp({
        commandName: 'boolean',
        emoji: '⚡',
        description: 'Perform bitwise boolean operations between two images. Combine images using AND, OR, or XOR (EOR) logic.',
        usage: [
          'boolean <input> --operation and --operand mask.png',
          'boolean <input> --operation or --operand overlay.png',
          'boolean <input> --operation eor --operand pattern.png'
        ],
        options: [
          { flag: '--operation <op>', description: 'Operation: and, or, eor (required)' },
          { flag: '--operand <path>', description: 'Second image path (required)' },
          { flag: '-o, --output <path>', description: 'Output file path (default: <input>-boolean.<ext>)' },
          { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
          { flag: '--dry-run', description: 'Preview changes without executing' },
          { flag: '--explain [mode]', description: 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.' },
          { flag: '-v, --verbose', description: 'Show detailed output' }
        ],
        examples: [
          { command: 'boolean image.jpg --operation and --operand mask.png', description: 'AND operation (extract masked region)' },
          { command: 'boolean photo.jpg --operation or --operand overlay.png', description: 'OR operation (combine images)' },
          { command: 'boolean pic.jpg --operation eor --operand pattern.png', description: 'XOR operation (find differences)' }
        ],
        additionalSections: [
          {
            title: 'Operations',
            items: [
              'and: Bitwise AND - keeps pixels present in both',
              'or: Bitwise OR - combines pixels from both',
              'eor (XOR): Exclusive OR - highlights differences'
            ]
          },
          {
            title: 'Use Cases',
            items: [
              'AND: Apply masks, extract regions',
              'OR: Combine patterns, merge images',
              'XOR: Detect changes, create patterns',
              'Watermarking and steganography',
              'Image differencing'
            ]
          },
          {
            title: 'Requirements',
            items: [
              'Both images should have same dimensions',
              'Works best with grayscale or similar formats',
              'Output format follows input format',
              'Bitwise operations on pixel values'
            ]
          },
          {
            title: 'Tips',
            items: [
              'XOR useful for change detection',
              'AND useful for masking operations',
              'OR useful for compositing',
              'Consider converting to grayscale first'
            ]
          }
        ],
        tips: [
          'Images should have matching dimensions',
          'XOR highlights differences between images',
          'AND is useful for applying masks',
          'Results depend on pixel bit patterns'
        ]
      });
  });

  cmd.action(async (input: string, options: BooleanOptions) => {
    const spinner = ora('Processing image...').start();

    try {
      // Validate operand file exists (single file)
      if (!options.operand || !fs.existsSync(options.operand)) {
        throw new ValidationError(`Operand image not found: ${options.operand}`, undefined, undefined);
      }

      const validOperations = ['and', 'or', 'eor'];
      const operation = options.operation.toLowerCase();
      if (!validOperations.includes(operation)) {
        throw new ValidationError(`Invalid operation. Use: ${validOperations.join(', ')}`, undefined, undefined);
      }

      // Validate quality
      const quality = typeof options.quality === 'number' ? options.quality : 90;
      if (isNaN(quality) || quality < 1 || quality > 100) {
        throw new ValidationError('Quality must be an integer between 1 and 100', { quality }, undefined);
      }

      // Validate input paths (can be multiple)
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
        suffix: '-boolean',
      });

      let successCount = 0;
      let failCount = 0;

      if (options.verbose) {
        spinner.info(chalk.blue('Configuration:'));
        console.log(chalk.dim(`  Found ${inputFiles.length} file(s)`));
        console.log(chalk.dim(`  Operand: ${options.operand}`));
        console.log(chalk.dim(`  Operation: ${operation.toUpperCase()}`));
        spinner.start('Processing...');
      }

      if (options.dryRun) {
        spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
        console.log(chalk.green(`✓ Would perform ${operation.toUpperCase()} operation on ${inputFiles.length} file(s):`));
        inputFiles.forEach(f => console.log(chalk.dim(`  - ${f}`)));
        console.log(chalk.dim(`  Operand: ${options.operand}`));
        return;
      }

      // Preload operand buffer
      const operandBuffer = await createSharpInstance(options.operand).toBuffer();

      // Process all files
      for (const inputFile of inputFiles) {
        try {
          const fileName = getFileName(inputFile);
          const outputPath = outputPaths.get(inputFile)!;

          const pipeline = createSharpInstance(inputFile).boolean(operandBuffer, operation as 'and' | 'or' | 'eor');

          const outputExt = path.extname(outputPath).toLowerCase();
          if (outputExt === '.jpg' || outputExt === '.jpeg') {
            pipeline.jpeg({ quality });
          } else if (outputExt === '.png') {
            pipeline.png({ quality });
          } else if (outputExt === '.webp') {
            pipeline.webp({ quality });
          }

          await pipeline.toFile(outputPath);

          spinner.succeed(chalk.green(`✓ ${fileName} boolean operation applied`));
          successCount++;
        } catch (error) {
          spinner.fail(chalk.red(`✗ Failed: ${getFileName(inputFile)}`));
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
