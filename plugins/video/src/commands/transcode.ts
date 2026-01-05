import type { Command } from 'commander';
import chalk from 'chalk';
import { stat } from 'fs/promises';
import type { TranscodeOptions } from '../types.js';
import {
  runFFmpeg,
  getVideoMetadata,
  checkFFmpeg,
  validateInputFile,
  generateOutputPath,
  formatFileSize,
  formatDuration,
} from '../utils/ffmpeg.js';

export function transcodeCommand(videoCmd: Command): void {
  videoCmd
    .command('transcode <input>')
    .description('Transcode video to different format/codec')
    .option('-o, --output <path>', 'Output file path')
    .option('-f, --format <format>', 'Output format: mp4, webm, mkv, avi', 'mp4')
    .option('--codec <codec>', 'Video codec: h264, h265, vp9, av1', 'h264')
    .option('--bitrate <bitrate>', 'Target bitrate (e.g., 2M, 5000k)')
    .option('--audio-codec <codec>', 'Audio codec: aac, opus, mp3', 'aac')
    .option('--audio-bitrate <bitrate>', 'Audio bitrate (e.g., 128k)', '128k')
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: TranscodeOptions) => {
      try {
        console.log(chalk.blue.bold('🎬 Video Transcoding\n'));

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
        console.log(chalk.gray(`   Current codec: ${metadata.codec}`));
        console.log(chalk.gray(`   Size: ${formatFileSize(inputStat.size)}`));
        console.log();

        // Generate output path
        const format = options.format || 'mp4';
        const output = options.output || generateOutputPath(inputPath, 'transcoded', format);

        // Map codec to proper ffmpeg names
        const codecMap: Record<string, string> = {
          h264: 'libx264',
          h265: 'libx265',
          vp9: 'libvpx-vp9',
          av1: 'libaom-av1',
        };

        const videoCodec = codecMap[options.codec || 'h264'] || 'libx264';

        // Build ffmpeg arguments
        const args = ['-i', inputPath, '-c:v', videoCodec];

        // Add bitrate if specified
        if (options.bitrate) {
          args.push('-b:v', options.bitrate);
        } else {
          // Use CRF for better quality
          args.push('-crf', '23');
        }

        // Audio encoding
        const audioCodec = options.audioCodec || 'aac';
        args.push('-c:a', audioCodec);
        args.push('-b:a', options.audioBitrate || '128k');

        // Preset for encoding speed
        args.push('-preset', 'medium');

        // Output format specific options
        if (format === 'webm') {
          args.push('-f', 'webm');
        } else if (format === 'mkv') {
          args.push('-f', 'matroska');
        }

        args.push('-y', output);

        if (options.dryRun) {
          console.log(chalk.yellow('🏃 Dry run mode - no files will be created\n'));
          console.log(chalk.dim('Command:'));
          console.log(chalk.gray(`  ffmpeg ${args.join(' ')}\n`));
          console.log(chalk.dim('Output:'));
          console.log(chalk.gray(`  Format: ${format}`));
          console.log(chalk.gray(`  Video codec: ${options.codec || 'h264'}`));
          console.log(chalk.gray(`  Audio codec: ${audioCodec}`));
          console.log(chalk.green('\n✓ Dry run complete'));
          return;
        }

        // Run transcode
        console.log(chalk.dim('🔄 Transcoding video...'));
        if (options.verbose) {
          console.log(chalk.dim(`ffmpeg ${args.join(' ')}\n`));
        }

        await runFFmpeg(args, options.verbose);

        // Get output file size
        const outputStat = await stat(output);

        console.log();
        console.log(chalk.green.bold('✓ Transcoding Complete!\n'));
        console.log(chalk.gray(`   Format: ${metadata.format} → ${format}`));
        console.log(chalk.gray(`   Codec: ${metadata.codec} → ${options.codec || 'h264'}`));
        console.log(chalk.gray(`   Size: ${formatFileSize(inputStat.size)} → ${formatFileSize(outputStat.size)}`));
        console.log(chalk.dim(`\n   ${output}`));
      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
