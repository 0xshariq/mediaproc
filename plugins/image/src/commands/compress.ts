import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { validatePaths, resolveOutputPaths, IMAGE_EXTENSIONS, getFileName, createStandardHelp } from '@mediaproc/core';
import type { ImageOptions } from '../types.js';
import { createSharpInstance } from '../utils/sharp.js';
import { stat } from 'node:fs/promises';

interface CompressOptions extends ImageOptions {
  help?: boolean;
  lossy?: boolean;
}

export function compressCommand(imageCmd: Command): void {
  imageCmd
    .command('compress <input>')
    .description('Compress images with advanced quality control')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Compression quality (1-100)', parseInt)
    .option('--lossy', 'Use lossy compression for better size reduction')
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('--help', 'Display help for compress command')
    .action(async (input: string, options: CompressOptions) => {
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'compress',
          emoji: '🗜️',
          description: 'Advanced image compression with fine-grained quality control. Reduce file sizes significantly while maintaining visual quality.',
          usage: ['compress <input>', 'compress <input> -q <quality>', 'compress <input> --lossy'],
          options: [
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-compressed.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Compression quality 1-100 (optional, only applies to JPEG, WEBP, AVIF; for PNG, mapped to compression level)' },
            { flag: '--lossy', description: 'Enable lossy compression for maximum reduction' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '--explain [mode]', description: 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'compress photo.jpg', description: 'Compress with quality 75 (default)' },
            { command: 'compress image.png -q 60', description: 'Higher compression, lower quality' },
            { command: 'compress pic.jpg --lossy', description: 'Maximum compression using lossy method' },
            { command: 'compress photo.webp -q 80 -o small.webp', description: 'Custom quality and output' }
          ],
          additionalSections: [
            {
              title: 'Quality Levels',
              items: [
                'Quality 80-100: High quality, moderate compression',
                'Quality 60-79: Good quality, good compression (recommended)',
                'Quality 40-59: Lower quality, high compression',
                'Quality 1-39: Low quality, maximum compression',
                'Lossy mode: Aggressive compression with visible artifacts'
              ]
            },
            {
              title: 'Format-Specific',
              items: [
                'JPEG: Progressive encoding with custom quality',
                'PNG: Maximum compression with palette reduction',
                'WebP: Lossy/lossless WebP compression',
                'AVIF: Next-gen compression (50% smaller)'
              ]
            },
            {
              title: 'vs Optimize',
              items: [
                'compress: Aggressive reduction, may reduce quality',
                'optimize: Balanced approach, minimal quality loss',
                'compress --lossy: Maximum size reduction',
                'optimize: Best for general web use'
              ]
            }
          ],
          tips: [
            'Quality 60-75 offers best compression/quality trade-off',
            'Use --lossy for thumbnails or backgrounds',
            'WebP format achieves better compression than JPEG',
            'Test different quality levels to find sweet spot'
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
          suffix: '-compressed',
        });

        spinner.succeed(chalk.green(`Found ${inputFiles.length} image(s) to process`));

        for (const inputPath of inputFiles) {
          const outputFile = outputPaths.get(inputPath)!;
          const fileName = getFileName(inputPath);

          if (options.dryRun) {
            console.log(chalk.cyan(`\n📋 Dry run: ${fileName}`));
            console.log(chalk.gray(`   Input: ${inputPath}`));
            console.log(chalk.gray(`   Output: ${outputFile}`));
            if (typeof options.quality !== 'undefined') {
              console.log(chalk.gray(`   Quality: ${options.quality}`));
            }
            console.log(chalk.gray(`   Lossy: ${options.lossy ? 'Yes' : 'No'}`));
            continue;
          }

          const processSpinner = ora(`Compressing ${fileName}...`).start();

          try {
            const inputStat = await stat(inputPath);

            const sharp = await createSharpInstance(inputPath);

            // Get image format
            const metadata = await sharp.metadata();
            const format = metadata.format;

            // Apply compression based on format
            let pipeline = sharp;

            if (format === 'jpeg' || format === 'jpg') {
              if (typeof options.quality === 'number') {
                pipeline = pipeline.jpeg({
                  quality: options.quality,
                  progressive: true,
                  mozjpeg: options.lossy || false,
                  force: true,
                });
              } else {
                pipeline = pipeline.jpeg({
                  progressive: true,
                  mozjpeg: options.lossy || false,
                  force: true,
                });
              }
            } else if (format === 'png') {
              let compressionLevel = 9;
              if (typeof options.quality === 'number') {
                compressionLevel = Math.round((100 - Math.max(1, Math.min(100, options.quality))) * 9 / 99);
              }
              pipeline = pipeline.png({
                compressionLevel,
                palette: options.lossy || false,
                force: true,
              });
            } else if (format === 'webp') {
              if (typeof options.quality === 'number') {
                pipeline = pipeline.webp({
                  quality: options.quality,
                  lossless: !options.lossy,
                  force: true,
                });
              } else {
                pipeline = pipeline.webp({
                  lossless: !options.lossy,
                  force: true,
                });
              }
            } else if (format === 'avif') {
              if (typeof options.quality === 'number') {
                pipeline = pipeline.avif({
                  quality: options.quality,
                  lossless: !options.lossy,
                  force: true,
                });
              } else {
                pipeline = pipeline.avif({
                  lossless: !options.lossy,
                  force: true,
                });
              }
            } else {
              // For other formats, ignore quality flag
              pipeline = pipeline;
            }

            await pipeline.toFile(outputFile);

            const outputStat = await stat(outputFile);
            const reduction = ((inputStat.size - outputStat.size) / inputStat.size) * 100;

            processSpinner.succeed(
              chalk.green(`✓ Compressed ${fileName}`) +
              chalk.gray(` (${formatBytes(inputStat.size)} → ${formatBytes(outputStat.size)}, ${reduction.toFixed(1)}% reduction)`)
            );

            if (options.verbose) {
              console.log(chalk.dim(`   Input: ${inputPath}`));
              console.log(chalk.dim(`   Output: ${outputFile}`));
              console.log(chalk.dim(`   Quality: ${options.quality || 75}`));
              console.log(chalk.dim(`   Mode: ${options.lossy ? 'Lossy' : 'Standard'}`));
            }
          } catch (error) {
            processSpinner.fail(chalk.red(`✗ Failed to compress ${fileName}`));
            console.error(chalk.red(`   Error: ${(error as Error).message}`));
            process.exit(1);
          }
        }

        console.log();
        console.log(chalk.green.bold('✓ Compression Complete!'));
        console.log(chalk.gray(`   Processed: ${inputFiles.length} image(s)`));
      } catch (error) {
        spinner.fail(chalk.red('Error during compression'));
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
