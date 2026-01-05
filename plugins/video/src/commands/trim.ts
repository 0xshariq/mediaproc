import type { Command } from 'commander';
import chalk from 'chalk';
import { stat } from 'fs/promises';
import type { VideoOptions } from '../types.js';
import {
  runFFmpeg,
  getVideoMetadata,
  checkFFmpeg,
  validateInputFile,
  generateOutputPath,
  formatFileSize,
  formatDuration,
  parseTimeToSeconds,
} from '../utils/ffmpeg.js';

export function trimCommand(videoCmd: Command): void {
  videoCmd
    .command('trim <input>')
    .description('Trim video to specified time range')
    .option('-o, --output <path>', 'Output file path')
    .option('--start <time>', 'Start time (HH:MM:SS or seconds)', '00:00:00')
    .option('--end <time>', 'End time (HH:MM:SS or seconds)')
    .option('--duration <duration>', 'Duration (HH:MM:SS or seconds)')
    .option('--fast', 'Fast mode (stream copy, less accurate)')
    .option('--dry-run', 'Show what would be done')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, options: VideoOptions) => {
      try {
        console.log(chalk.blue.bold('🎬 Video Trimming\n'));

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

        console.log(chalk.gray(`   Total duration: ${formatDuration(metadata.duration)}`));
        console.log(chalk.gray(`   Resolution: ${metadata.width}x${metadata.height}`));
        console.log(chalk.gray(`   Size: ${formatFileSize(inputStat.size)}`));
        console.log();

        // Parse start time
        const startSeconds = parseTimeToSeconds(options.start || '0');

        // Calculate end time
        let endSeconds: number;
        if (options.duration) {
          endSeconds = startSeconds + parseTimeToSeconds(options.duration);
        } else if (options.end) {
          endSeconds = parseTimeToSeconds(options.end);
        } else {
          throw new Error('Either --end or --duration must be specified');
        }

        // Validate times
        if (startSeconds < 0 || startSeconds >= metadata.duration) {
          throw new Error(`Start time ${startSeconds}s is out of range`);
        }
        if (endSeconds > metadata.duration) {
          throw new Error(`End time ${endSeconds}s exceeds video duration`);
        }
        if (endSeconds <= startSeconds) {
          throw new Error('End time must be after start time');
        }

        const trimDuration = endSeconds - startSeconds;

        // Generate output path
        const output = options.output || generateOutputPath(inputPath, 'trimmed', 'mp4');

        // Build ffmpeg arguments
        const args = ['-ss', startSeconds.toString(), '-i', inputPath];

        if (options.fast) {
          // Fast mode: stream copy (accurate seeking not guaranteed)
          args.push('-t', trimDuration.toString(), '-c', 'copy');
        } else {
          // Accurate mode: re-encode
          args.push('-t', trimDuration.toString(), '-c:v', 'libx264', '-crf', '23', '-c:a', 'aac');
        }

        args.push('-y', output);

        console.log(chalk.dim('Trim range:'));
        console.log(chalk.gray(`   Start: ${formatDuration(startSeconds)}`));
        console.log(chalk.gray(`   End: ${formatDuration(endSeconds)}`));
        console.log(chalk.gray(`   Duration: ${formatDuration(trimDuration)}`));
        console.log(chalk.gray(`   Mode: ${options.fast ? 'Fast (stream copy)' : 'Accurate (re-encode)'}`));
        console.log();

        if (options.dryRun) {
          console.log(chalk.yellow('🏃 Dry run mode - no files will be created\n'));
          console.log(chalk.dim('Command:'));
          console.log(chalk.gray(`  ffmpeg ${args.join(' ')}\n`));
          console.log(chalk.green('✓ Dry run complete'));
          return;
        }

        // Run trim
        console.log(chalk.dim('✂️  Trimming video...'));
        if (options.verbose) {
          console.log(chalk.dim(`ffmpeg ${args.join(' ')}\n`));
        }

        await runFFmpeg(args, options.verbose);

        // Get output file size
        const outputStat = await stat(output);

        console.log();
        console.log(chalk.green.bold('✓ Trimming Complete!\n'));
        console.log(chalk.gray(`   Duration: ${formatDuration(metadata.duration)} → ${formatDuration(trimDuration)}`));
        console.log(chalk.gray(`   Size: ${formatFileSize(inputStat.size)} → ${formatFileSize(outputStat.size)}`));
        console.log(chalk.dim(`\n   ${output}`));
      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
