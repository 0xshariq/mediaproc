import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { validatePaths, resolveOutputPaths, IMAGE_EXTENSIONS, getFileName, createStandardHelp } from '@mediaproc/core';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import path from 'node:path';

interface FlopOptions extends ImageOptions { }

export function flopCommand(imageCmd: Command): void {
  const cmd = imageCmd
    .command('flop [input]')
    .description('Flip image horizontally (mirror left-right)')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt)
    .option('--dry-run', 'Show what would be done without executing')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('-v, --verbose', 'Verbose output');

  cmd.addHelpText('after', () => {
    return '\n' + createStandardHelp({
      pluginName: 'image',
      commandName: 'flop',
      emoji: '🔄',
      description: 'Flip image horizontally (mirror left-right). Standalone horizontal flip operation from Sharp.',
      usage: ['flop <input>', 'flop <input> -o output.jpg'],
      options: [
        { flag: '-o, --output <path>', description: 'Output file path (default: <input>-flopped.<ext>)' },
        { flag: '-q, --quality <quality>', description: 'Output quality (1-100). Optional. Applies to JPEG/WEBP/AVIF. For PNG, maps to compression level (higher quality = lower compression). Ignored for other formats.' },
        { flag: '--dry-run', description: 'Preview changes without executing' },
        { flag: '--explain [mode]', description: 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.' },
        { flag: '-v, --verbose', description: 'Show detailed output' }
      ],
      examples: [
        { command: 'flop photo.jpg', description: 'Flip image horizontally' },
        { command: 'flop selfie.jpg -o corrected.jpg', description: 'Correct selfie mirror effect' }
      ],
      tips: [
        'Use flip command for vertical flipping',
        'Combine with other transforms in batch operations'
      ]
    });
  });

  cmd.action(async (input: string | undefined, options: FlopOptions) => {
    if (!input) {
      console.error(chalk.red('Error: input argument is required'));
      process.exit(1);
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
        suffix: '-flopped',
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
          const metadata = await createSharpInstance(inputFile).metadata();
          const pipeline = createSharpInstance(inputFile).flop();

          const outputExt = path.extname(outputPath).toLowerCase();
          if (outputExt === '.jpg' || outputExt === '.jpeg') {
            pipeline.jpeg({ quality: options.quality });
          } else if (outputExt === '.png') {
            pipeline.png({ quality: options.quality });
          } else if (outputExt === '.webp') {
            pipeline.webp({ quality: options.quality });
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

    } catch (error) {
      spinner.fail(chalk.red('Processing failed'));
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(errorMessage));
      process.exit(1);
    }
  });
}
