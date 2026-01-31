import type { Command } from 'commander';
import chalk from 'chalk';
import { stat } from 'fs/promises';
import type { TranscodeOptions } from '../types.js';
import {
  runFFmpeg,
  getVideoMetadata,
  checkFFmpeg,
  formatFileSize,
  formatDuration
} from '../utils/ffmpeg.js';
import { createStandardHelp, VIDEO_EXTENSIONS } from '@mediaproc/core';
import { validatePaths, resolveOutputPaths } from '@mediaproc/core';
import { styleFFmpegOutput, shouldDisplayLine } from '../utils/ffmpeg-output.js';

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
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('-v, --verbose', 'Verbose output')
    .option('--help', 'Display help for command')
    .action(async (input: string, options: TranscodeOptions) => {
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'transcode',
          emoji: '🎬',
          description: 'Transcode video files to different formats and codecs. Supports popular formats like MP4, WebM, MKV, and AVI with various codec options.',
          usage: [
            'transcode <input> [options]',
            'transcode video.mp4 -f webm --codec vp9',
            'transcode videos/ -o output/ --format mkv'
          ],
          options: [
            { flag: '-o, --output <path>', description: 'Output file path (default: <input>-transcoded.<ext>)' },
            { flag: '-f, --format <format>', description: 'Output format: mp4, webm, mkv, avi (default: mp4)' },
            { flag: '--codec <codec>', description: 'Video codec: h264 (default), h265, vp9, av1' },
            { flag: '--bitrate <bitrate>', description: 'Target video bitrate (e.g., 2M, 5000k)' },
            { flag: '--audio-codec <codec>', description: 'Audio codec: aac (default), opus, mp3' },
            { flag: '--audio-bitrate <bitrate>', description: 'Audio bitrate: 128k (default), 192k, 256k' },
            { flag: '--dry-run', description: 'Preview FFmpeg command without executing' },
            { flag: '--explain [mode]', description: 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.' },
            { flag: '-v, --verbose', description: 'Show detailed FFmpeg output and progress' }
          ],
          examples: [
            { command: 'transcode video.mp4 -f webm --codec vp9', description: 'Transcode MP4 to WebM using VP9 codec' },
            { command: 'transcode video.mkv -f mp4 --codec h264 --bitrate 3M', description: 'Transcode MKV to MP4 with H.264 at 3Mbps' },
            { command: 'transcode video.avi -f mkv --codec h265 --audio-codec aac', description: 'Transcode AVI to MKV with H.265 video and AAC audio' },
            { command: 'transcode videos/ -o output/ --format mp4', description: 'Batch transcode all videos in folder to MP4 format' }
          ],
        })
      }
      try {
        console.log(chalk.blue.bold('🎬 Video Transcoding\n'));

        // Check ffmpeg
        const ffmpegAvailable = await checkFFmpeg();
        if (!ffmpegAvailable) {
          console.error(chalk.red('ffmpeg is not installed or not in PATH'));
          process.exit(1);
        }

        // Centralized input/output validation
        const { inputFiles, outputPath, errors } = validatePaths(input, options.output, {
          allowedExtensions: VIDEO_EXTENSIONS,
        });
        if (errors.length > 0) {
          console.error(chalk.red(errors.join('\n')));
          process.exit(1);
        }
        if (inputFiles.length === 0) {
          console.error(chalk.red('No valid video files found'));
          process.exit(1);
        }
        const inputPath = inputFiles[0];

        // Get input metadata
        console.log(chalk.dim('📊 Analyzing video...'));
        const metadata = await getVideoMetadata(inputPath);
        const inputStat = await stat(inputPath);

        console.log(chalk.gray(`   Duration: ${formatDuration(metadata.duration)}`));
        console.log(chalk.gray(`   Resolution: ${metadata.width}x${metadata.height}`));
        console.log(chalk.gray(`   Current codec: ${metadata.codec}`));
        console.log(chalk.gray(`   Size: ${formatFileSize(inputStat.size)}`));
        console.log();

        // Centralized output path resolution
        const outputExt = options.formats ? `.${options.formats}` : '.mp4';
        const outputPaths = resolveOutputPaths([inputPath], outputPath, {
          suffix: '-transcoded',
          newExtension: outputExt,
        });
        const output = outputPaths.get(inputPath)!;

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
        if (outputExt && outputExt.includes('webm')) {
          args.push('-f', 'webm');
        } else if (outputExt && outputExt.includes('mkv')) {
          args.push('-f', 'matroska');
        }

        args.push('-y', output);

        if (options.dryRun) {
          console.log(chalk.yellow('🏃 Dry run mode - no files will be created\n'));
          console.log(chalk.dim('Command:'));
          console.log(chalk.gray(`  ffmpeg ${args.join(' ')}\n`));
          console.log(chalk.dim('Output:'));
          console.log(chalk.gray(`  Format: ${outputExt || '.mp4'}`));
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

        await runFFmpeg(args, options.verbose, (line) => {
          if (shouldDisplayLine(line)) {
            console.log(styleFFmpegOutput(line));
          }
        });

        // Get output file size
        const outputStat = await stat(output);

        console.log();
        console.log(chalk.green.bold('✓ Transcoding Complete!\n'));
        console.log(chalk.gray(`   Format: ${metadata.format} → ${outputExt || '.mp4'}`));
        console.log(chalk.gray(`   Codec: ${metadata.codec} → ${options.codec || 'h264'}`));
        console.log(chalk.gray(`   Size: ${formatFileSize(inputStat.size)} → ${formatFileSize(outputStat.size)}`));
        console.log(chalk.dim(`\n   ${output}`));
      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
