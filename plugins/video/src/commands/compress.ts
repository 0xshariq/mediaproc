import type { Command } from 'commander';
import chalk from 'chalk';
import { stat } from 'fs/promises';
import type { CompressOptions } from '../types.js';
import {
  runFFmpeg,
  getVideoMetadata,
  checkFFmpeg,
  validateInputFile,
  generateOutputPath,
  formatFileSize,
  formatDuration,
} from '../utils/ffmpeg.js';

export function compressCommand(videoCmd: Command): void {
  videoCmd
    .command('compress <input>')
    .description('Compress video file')
    .option('-o, --output <path>', 'Output file path')
    .option('-q, --quality <quality>', 'Quality: low, medium, high', 'medium')
    .option('--codec <codec>', 'Video codec: h264, h265, vp9', 'h264')
    .option('--crf <crf>', 'CRF value (0-51, lower = better quality)', parseInt)
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: CompressOptions) => {
      try {
        console.log(chalk.blue.bold('🎬 Video Compression\n'));

        // Check ffmpeg
        const ffmpegAvailable = await checkFFmpeg();
        if (!ffmpegAvailable) {
          throw new Error('ffmpeg is not installed or not in PATH');
        }

        // Validate input
        const inputPath = validateInputFile(input);

        // Get input metadata
        console.log(chalk.dim('📊 Analyzing video...'));
        const metadata = await getVideoMetadata(inputPath);
        const inputStat = await stat(inputPath);

        console.log(chalk.gray(`   Duration: ${formatDuration(metadata.duration)}`));
        console.log(chalk.gray(`   Resolution: ${metadata.width}x${metadata.height}`));
        console.log(chalk.gray(`   Codec: ${metadata.codec}`));
        console.log(chalk.gray(`   Size: ${formatFileSize(inputStat.size)}`));
        console.log();

        // Determine CRF based on quality
        const qualityCRF = {
          low: 28,
          medium: 23,
          high: 18,
        };
        const crf = options.crf ?? qualityCRF[options.quality || 'medium'];

        // Generate output path
        const output = options.output || generateOutputPath(inputPath, 'compressed', 'mp4');

        // Build ffmpeg arguments
        const args = [
          '-i',
          inputPath,
          '-c:v',
          options.codec || 'h264',
          '-crf',
          crf.toString(),
          '-preset',
          'medium',
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          '-y',
          output,
        ];

        if (options.dryRun) {
          console.log(chalk.yellow('🏃 Dry run mode - no files will be created\n'));
          console.log(chalk.dim('Command:'));
          console.log(chalk.gray(`  ffmpeg ${args.join(' ')}\n`));
          console.log(chalk.green('✓ Dry run complete'));
          return;
        }

        // Run compression
        console.log(chalk.dim('🔄 Compressing video...'));
        if (options.verbose) {
          console.log(chalk.dim(`ffmpeg ${args.join(' ')}\n`));
        }

        await runFFmpeg(args, options.verbose);

        // Get output file size
        const outputStat = await stat(output);
        const reduction = ((1 - outputStat.size / inputStat.size) * 100).toFixed(1);

        console.log();
        console.log(chalk.green.bold('✓ Compression Complete!\n'));
        console.log(chalk.gray(`   Input:  ${formatFileSize(inputStat.size)}`));
        console.log(chalk.gray(`   Output: ${formatFileSize(outputStat.size)}`));
        console.log(chalk.gray(`   Saved:  ${reduction}%`));
        console.log(chalk.dim(`\n   ${output}`));
      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
