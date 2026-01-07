import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import * as fs from 'fs';
import { validatePaths, resolveOutputPaths, IMAGE_EXTENSIONS, getFileName } from '../utils/pathValidator.js'; export { getFileName } from '../utils/pathValidator.js';
import type { ImageOptions } from '../types.js';
import { createSharpInstance, sharp } from '../utils/sharp.js';
import { createStandardHelp } from '../utils/helpFormatter.js';
import path from 'path';

interface WatermarkOptions extends ImageOptions {
  position?: string;
  opacity?: number;
  scale?: number;
  fontSize?: number;
  fontColor?: string;
  fontFamily?: string;
  help?: boolean;
}

export function watermarkCommand(imageCmd: Command): void {
  imageCmd
    .command('watermark <input> <watermark>')
    .description('Add image or text watermark to image')
    .option('-o, --output <path>', 'Output file path')
    .option('--position <position>', 'Position: center, top-left, top-right, bottom-left, bottom-right', 'bottom-right')
    .option('--opacity <opacity>', 'Watermark opacity (0-1, default: 0.5)', parseFloat, 0.5)
    .option('--scale <scale>', 'Scale: for images (0.1-1 of width, default: 0.2), for text (multiplier, default: 1.0)', parseFloat)
    .option('--font-size <size>', 'Text base font size in pixels (default: auto-calculated)', parseInt)
    .option('--font-color <color>', 'Text watermark color (hex or name, default: white)', 'white')
    .option('--font-family <family>', 'Text watermark font family (default: Arial)', 'Arial')
    .option('-q, --quality <quality>', 'Quality (1-100)', parseInt, 90)
    .option('--dry-run', 'Show what would be done without executing')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for watermark command')
    .action(async (input: string, watermark: string, options: WatermarkOptions) => {
      if (options.help) {
        createStandardHelp({
          commandName: 'watermark',
          emoji: '©️',
          description: 'Add image or text watermark to images for copyright protection, branding, or attribution. Automatically detects if watermark is a file or text.',
          usage: [
            'watermark <input> <watermark>',
            'watermark <input> logo.png --position center',
            'watermark <input> "Powered by MediaProc" --font-size 64',
            'watermark <input> "© 2026" --position bottom-right --opacity 0.7'
          ],
          options: [
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-watermarked.<ext>)' },
            { flag: '--position <position>', description: 'Position: center, top-left, top-right, bottom-left, bottom-right (default: bottom-right)' },
            { flag: '--opacity <opacity>', description: 'Watermark opacity 0-1 (default: 0.5)' },
            { flag: '--scale <scale>', description: 'Scale factor - Image: 0.1-1 of image width (default: 0.2), Text: size multiplier (default: 1.0)' },
            { flag: '--font-size <size>', description: 'Text watermark base font size in pixels (auto-calculated if not specified)' },
            { flag: '--font-color <color>', description: 'Text watermark color (default: white)' },
            { flag: '--font-family <family>', description: 'Text watermark font family (default: Arial)' },
            { flag: '-q, --quality <quality>', description: 'Output quality 1-100 (default: 90)' },
            { flag: '--dry-run', description: 'Preview changes without executing' },
            { flag: '-v, --verbose', description: 'Show detailed output' }
          ],
          examples: [
            { command: 'watermark photo.jpg logo.png', description: 'Add image watermark from file' },
            { command: 'watermark image.jpg "© 2026 Company"', description: 'Add text watermark' },
            { command: 'watermark pic.jpg "Powered by MediaProc" --scale 1.5', description: 'Larger text watermark (1.5x)' },
            { command: 'watermark photo.jpg brand.png --scale 0.3 --position top-right', description: 'Larger image watermark (30% of width)' },
            { command: 'watermark *.jpg "DRAFT" --font-color red --scale 2', description: 'Batch large text watermark in red' }
          ],
          additionalSections: [
            {
              title: 'Watermark Types',
              items: [
                'Image - Provide a file path (e.g., logo.png, watermark.svg)',
                'Text - Provide any text string (e.g., "© 2026", "Powered by MediaProc")'
              ]
            },
            {
              title: 'Positions',
              items: [
                'center - Middle of image',
                'top-left - Upper left corner',
                'top-right - Upper right corner',
                'bottom-left - Lower left corner',
                'bottom-right - Lower right corner (default)'
              ]
            }
          ],
          tips: [
            'Use PNG watermarks with transparency for best results',
            'Quotes are optional for simple text, required for text with spaces',
            'Text watermarks are rendered with transparent backgrounds',
            'Common font families: Arial, Times New Roman, Courier, Helvetica'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Processing image...').start();

      try {
        // Detect if watermark is a file or text
        const isWatermarkFile = fs.existsSync(watermark);
        const watermarkType = isWatermarkFile ? 'image' : 'text';

        if (options.verbose) {
          spinner.info(chalk.blue(`Watermark type: ${watermarkType}`));
          if (!isWatermarkFile) {
            spinner.info(chalk.dim(`Text: "${watermark}"`));
          }
        }

        // Validate input paths (can be multiple)
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
          suffix: '-watermarked',
        });

        let successCount = 0;
        let failCount = 0;

        if (options.verbose) {
          spinner.info(chalk.blue('Configuration:'));
          console.log(chalk.dim(`  Found ${inputFiles.length} file(s)`));
          console.log(chalk.dim(`  Watermark type: ${watermarkType}`));
          console.log(chalk.dim(`  Watermark: ${watermark}`));
          console.log(chalk.dim(`  Position: ${options.position || 'bottom-right'}`));
          console.log(chalk.dim(`  Opacity: ${options.opacity || 0.5}`));
          if (watermarkType === 'image') {
            console.log(chalk.dim(`  Scale: ${options.scale || 0.2} (${((options.scale || 0.2) * 100).toFixed(0)}% of image width)`));
          } else {
            console.log(chalk.dim(`  Scale: ${options.scale || 1.0}x (text size multiplier)`));
            console.log(chalk.dim(`  Base font size: ${options.fontSize ? options.fontSize + 'px' : 'auto'}`));
            console.log(chalk.dim(`  Font color: ${options.fontColor || 'white'}`));
            console.log(chalk.dim(`  Font family: ${options.fontFamily || 'Arial'}`));
          }
          spinner.start('Processing...');
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('Dry run mode - no changes will be made'));
          console.log(chalk.green(`✓ Would add ${watermarkType} watermark to ${inputFiles.length} file(s):`));
          inputFiles.forEach(f => console.log(chalk.dim(`  - ${f}`)));
          console.log(chalk.dim(`  Watermark: ${watermark}`));
          if (watermarkType === 'text') {
            console.log(chalk.dim(`  Text watermark with font size: ${options.fontSize || 48}px`));
          }
          return;
        }

        // Calculate gravity once
        const position = options.position || 'bottom-right';
        let gravity: sharp.Gravity = 'southeast';
        if (position === 'center') gravity = 'center';
        else if (position === 'top-left') gravity = 'northwest';
        else if (position === 'top-right') gravity = 'northeast';
        else if (position === 'bottom-left') gravity = 'southwest';
        else if (position === 'bottom-right') gravity = 'southeast';

        // Prepare watermark buffer based on type
        let watermarkBuffer: Buffer | null = null;

        if (watermarkType === 'image') {
          // For image watermarks, preload the watermark
          // We'll scale it per image based on each image's dimensions
          watermarkBuffer = await createSharpInstance(watermark).toBuffer();
        }
        // For text watermarks, we create them dynamically per image

        // Process all files
        for (const inputFile of inputFiles) {
          try {
            const fileName = getFileName(inputFile);
            const outputPath = outputPaths.get(inputFile)!;

            const metadata = await createSharpInstance(inputFile).metadata();
            const imageWidth = metadata.width || 800;
            const imageHeight = metadata.height || 600;

            let watermarkWithOpacity: Buffer;

            if (watermarkType === 'image') {
              // Calculate watermark size based on scale for image watermarks
              const scale = options.scale !== undefined ? options.scale : 0.2;
              const targetWidth = Math.round(imageWidth * scale);
              const targetHeight = Math.round(imageHeight * scale);

              const watermarkResized = await sharp(watermarkBuffer!)
                .resize(targetWidth, targetHeight)
                .toBuffer();

              // Apply opacity to image watermark
              watermarkWithOpacity = await sharp(watermarkResized)
                .composite([{
                  input: Buffer.from([255, 255, 255, Math.round((options.opacity || 0.5) * 255)]),
                  raw: { width: 1, height: 1, channels: 4 },
                  tile: true,
                  blend: 'dest-in'
                }])
                .toBuffer();
            } else {
              // For text watermarks, calculate font size based on image dimensions
              const scale = options.scale !== undefined ? options.scale : 1.0;

              // Auto-calculate base font size if not specified (3% of image width)
              const baseFontSize = options.fontSize || Math.round(imageWidth * 0.03);
              const fontSize = Math.round(baseFontSize * scale);

              const fontColor = options.fontColor || 'white';
              const fontFamily = options.fontFamily || 'Arial';

              // Estimate text dimensions
              const textWidth = watermark.length * fontSize * 0.6;
              const textHeight = fontSize * 1.5;
              const padding = 20;

              const svgText = `
                <svg width="${Math.ceil(textWidth + padding * 2)}" height="${Math.ceil(textHeight + padding)}">
                  <text 
                    x="${padding}" 
                    y="${fontSize + padding / 2}" 
                    font-family="${fontFamily}" 
                    font-size="${fontSize}" 
                    fill="${fontColor}"
                    font-weight="bold"
                  >${watermark}</text>
                </svg>
              `;

              const textBuffer = Buffer.from(svgText);

              // Apply opacity to text watermark
              watermarkWithOpacity = await sharp(textBuffer)
                .composite([{
                  input: Buffer.from([255, 255, 255, Math.round((options.opacity || 0.5) * 255)]),
                  raw: { width: 1, height: 1, channels: 4 },
                  tile: true,
                  blend: 'dest-in'
                }])
                .png()
                .toBuffer();
            }

            const pipeline = createSharpInstance(inputFile).composite([{
              input: watermarkWithOpacity,
              gravity,
            }]);

            const outputExt = path.extname(outputPath).toLowerCase();
            if (outputExt === '.jpg' || outputExt === '.jpeg') {
              pipeline.jpeg({ quality: options.quality || 90 });
            } else if (outputExt === '.png') {
              pipeline.png({ quality: options.quality || 90 });
            } else if (outputExt === '.webp') {
              pipeline.webp({ quality: options.quality || 90 });
            }

            await pipeline.toFile(outputPath);

            spinner.succeed(chalk.green(`✓ ${fileName} watermarked`));
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
        if (options.verbose) {
          console.error(chalk.red('Error details:'), error);
        } else {
          console.error(chalk.red((error as Error).message));
        }
        process.exit(1);
      }
    });
}
