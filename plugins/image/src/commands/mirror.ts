import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { validatePaths, resolveOutputPaths, IMAGE_EXTENSIONS, getFileName, createStandardHelp, showPluginBranding, explainFlag } from '@mediaproc/core';
import { createSharpInstance } from '../utils/sharp.js';
import { ImageOptions } from '../types.js';

interface MirrorOptions extends ImageOptions {
  input: string;
  mode?: 'horizontal' | 'vertical' | 'both' | 'quad';
  output?: string;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

export function mirrorCommand(imageCmd: Command): void {
  imageCmd
    .command('mirror <input>')
    .description('Create mirror/kaleidoscope effects')
    .option('-m, --mode <mode>', 'Mirror mode: horizontal, vertical, both, quad (kaleidoscope) (default: horizontal)', 'horizontal')
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--explain', 'Explain the proper flow of this command in detail.')
    .option('--help', 'Display help for mirror command')
    .action(async function (input: string, options: MirrorOptions) {
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'mirror',
          emoji: '🪞',
          description: 'Create stunning mirror and kaleidoscope effects by reflecting images horizontally, vertically, or in quadrants. Generate artistic symmetrical images.',
          usage: ['mirror <input>', 'mirror <input> --mode vertical', 'mirror photo.jpg -m quad -o kaleidoscope.jpg'],
          options: [
            { flag: '-m, --mode <mode>', description: 'Mirror mode: horizontal, vertical, both, quad (default: horizontal)' },
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-mirror-<mode>.ext)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '--explain', description: 'Explain what is happening behind the scene in proper flow and in detail.' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'mirror photo.jpg', description: 'Horizontal mirror (left-right symmetry)' },
            { command: 'mirror photo.jpg --mode vertical', description: 'Vertical mirror (top-bottom symmetry)' },
            { command: 'mirror photo.jpg --mode both', description: 'Both horizontal and vertical mirroring' },
            { command: 'mirror photo.jpg --mode quad', description: 'Quadrant kaleidoscope effect' },
            { command: 'mirror landscape.jpg -m vertical -o reflection.jpg', description: 'Water reflection effect' }
          ],
          additionalSections: [
            {
              title: 'Mirror Modes',
              items: [
                'horizontal - Mirror left to right (creates left-right symmetry)',
                'vertical - Mirror top to bottom (creates top-bottom symmetry)',
                'both - Mirror both axes (4-way symmetry)',
                'quad - Kaleidoscope (mirrors each quadrant for artistic effect)'
              ]
            },
            {
              title: 'Creative Uses',
              items: [
                'Water reflections (vertical mode)',
                'Symmetrical portraits',
                'Kaleidoscope art (quad mode)',
                'Abstract patterns',
                'Rorschach test style images',
                'Architectural symmetry',
                'Mandala-like designs'
              ]
            },
            {
              title: 'Best Practices',
              items: [
                'Works best with asymmetric input images',
                'Use vertical mode for water/reflection effects',
                'Use quad mode for psychedelic art',
                'Experiment with different modes on the same image',
                'Combine with other effects for unique results'
              ]
            }
          ],
          tips: [
            'Horizontal mode: great for face symmetry',
            'Vertical mode: perfect for reflections',
            'Quad mode: creates mandala-like patterns',
            'Try mirroring already processed images'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Creating mirror effect...').start();

      try {
        // Validate input paths
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

        const mode = options.mode || 'horizontal';
        const validModes = ['horizontal', 'vertical', 'both', 'quad'];

        if (!validModes.includes(mode)) {
          spinner.fail(chalk.red(`Invalid mode: ${mode}. Use: ${validModes.join(', ')}`));
          process.exit(1);
        }

        const outputPaths = resolveOutputPaths(inputFiles, outputPath, {
          suffix: `-mirror-${mode}`,
        });

        let successCount = 0;
        let failCount = 0;

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Found ${inputFiles.length} file(s)`));
          console.log(chalk.dim(`  Mode: ${mode}`));
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green(`✓ Would create ${mode} mirror effect for ${inputFiles.length} file(s):`));
          inputFiles.forEach(f => console.log(chalk.dim(`  - ${f}`)));
          showPluginBranding('Image', '../../package.json');
          return;
        }
        if (options.explain) {
          explainFlag({
            command: this,
            args: { input, output: options.output },
            options
          });
        }

        // Process all files
        for (let i = 0; i < inputFiles.length; i++) {
          const inputFile = inputFiles[i];
          try {
            const fileName = getFileName(inputFile);
            const outputPath = outputPaths.get(inputFile)!;

            if (options.verbose) {
              spinner.text = `Processing ${fileName} (${i + 1}/${inputFiles.length})...`;
            }

            const sharpInstance = createSharpInstance(inputFile);
            const metadata = await sharpInstance.metadata();
            const width = metadata.width!;
            const height = metadata.height!;
            const format = metadata.format!;

            let resultBuffer: Buffer;

            if (mode === 'horizontal') {
              const originalBuffer = await sharpInstance.toFormat(format as any).toBuffer();
              const flippedBuffer = await createSharpInstance(originalBuffer).flop().toFormat(format as any).toBuffer();

              resultBuffer = await createSharpInstance({
                create: {
                  width: width * 2,
                  height: height,
                  channels: 4,
                  background: { r: 0, g: 0, b: 0, alpha: 0 }
                }
              })
                .composite([
                  { input: originalBuffer, left: 0, top: 0 },
                  { input: flippedBuffer, left: width, top: 0 }
                ])
                .toFormat(format as any)
                .toBuffer();

            } else if (mode === 'vertical') {
              const originalBuffer = await sharpInstance.toFormat(format as any).toBuffer();
              const flippedBuffer = await createSharpInstance(originalBuffer).flip().toFormat(format as any).toBuffer();

              resultBuffer = await createSharpInstance({
                create: {
                  width: width,
                  height: height * 2,
                  channels: 4,
                  background: { r: 0, g: 0, b: 0, alpha: 0 }
                }
              })
                .composite([
                  { input: originalBuffer, left: 0, top: 0 },
                  { input: flippedBuffer, left: 0, top: height }
                ])
                .toFormat(format as any)
                .toBuffer();

            } else if (mode === 'both') {
              const originalBuffer = await sharpInstance.toFormat(format as any).toBuffer();
              const flopBuffer = await createSharpInstance(originalBuffer).flop().toFormat(format as any).toBuffer();
              const flipBuffer = await createSharpInstance(originalBuffer).flip().toFormat(format as any).toBuffer();
              const bothBuffer = await createSharpInstance(originalBuffer).flop().flip().toFormat(format as any).toBuffer();

              resultBuffer = await createSharpInstance({
                create: {
                  width: width * 2,
                  height: height * 2,
                  channels: 4,
                  background: { r: 0, g: 0, b: 0, alpha: 0 }
                }
              })
                .composite([
                  { input: originalBuffer, left: 0, top: 0 },
                  { input: flopBuffer, left: width, top: 0 },
                  { input: flipBuffer, left: 0, top: height },
                  { input: bothBuffer, left: width, top: height }
                ])
                .toFormat(format as any)
                .toBuffer();

            } else { // quad
              const halfWidth = Math.floor(width / 2);
              const halfHeight = Math.floor(height / 2);

              const centerBuffer = await sharpInstance
                .extract({ left: halfWidth - Math.floor(halfWidth / 2), top: halfHeight - Math.floor(halfHeight / 2), width: halfWidth, height: halfHeight })
                .toFormat(format as any)
                .toBuffer();

              const flopBuffer = await createSharpInstance(centerBuffer).flop().toFormat(format as any).toBuffer();
              const flipBuffer = await createSharpInstance(centerBuffer).flip().toFormat(format as any).toBuffer();
              const bothBuffer = await createSharpInstance(centerBuffer).flop().flip().toFormat(format as any).toBuffer();

              resultBuffer = await createSharpInstance({
                create: {
                  width: halfWidth * 2,
                  height: halfHeight * 2,
                  channels: 4,
                  background: { r: 0, g: 0, b: 0, alpha: 0 }
                }
              })
                .composite([
                  { input: centerBuffer, left: 0, top: 0 },
                  { input: flopBuffer, left: halfWidth, top: 0 },
                  { input: flipBuffer, left: 0, top: halfHeight },
                  { input: bothBuffer, left: halfWidth, top: halfHeight }
                ])
                .toFormat(format as any)
                .toBuffer();
            }

            await createSharpInstance(resultBuffer).toFile(outputPath);

            if (options.verbose || inputFiles.length === 1) {
              spinner.succeed(chalk.green(`✓ ${fileName}`));
              if (i < inputFiles.length - 1) {
                spinner.start();
              }
            }
            successCount++;
          } catch (error) {
            if (options.verbose || inputFiles.length === 1) {
              spinner.fail(chalk.red(`✗ Failed: ${getFileName(inputFile)}`));
              if (i < inputFiles.length - 1) {
                spinner.start();
              }
            } else {
              console.log(chalk.red(`✗ Failed: ${getFileName(inputFile)}`));
            }
            if (options.verbose && error instanceof Error) {
              console.log(chalk.red(`    Error: ${error.message}`));
            }
            failCount++;
          }
        }

        if (!options.verbose && inputFiles.length > 1) {
          spinner.succeed(chalk.green(`Processed ${inputFiles.length} file(s)`));
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
