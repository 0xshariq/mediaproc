import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import {
  runFFmpeg,
  getVideoMetadata,
  checkFFmpeg,
  formatDuration,
  parseTimeToSeconds,
} from '../utils/ffmpeg.js';
import { parseInputPaths, resolveOutputPaths } from '../utils/pathValidator.js';
import { logFFmpegOutput } from '../utils/ffmpegLogger.js';
import { createStandardHelp } from '../utils/helpFormatter.js';

export function trimCommand(videoCmd: Command): void {
  videoCmd
    .command('trim [input]')
    .description('Trim videos to specified time range with precision')
    .option('-o, --output <path>', 'Output file or directory path')
    .option('-s, --start <time>', 'Start time (HH:MM:SS or seconds) (default: 00:00:00)', '00:00:00')
    .option('-e, --end <time>', 'End time (HH:MM:SS or seconds)')
    .option('-d, --duration <duration>', 'Duration from start (HH:MM:SS or seconds)')
    .option('--fast', 'Fast mode - stream copy (less accurate but faster)')
    .option('-c, --codec <codec>', 'Video codec: h264, h265 (default: copy)', 'copy')
    .option('--format <format>', 'Output format: mp4, mkv, webm')
    .option('--dry-run', 'Preview command without executing')
    .option('-v, --verbose', 'Show detailed FFmpeg output')
    .option('-h, --help', 'Display help for trim command')
    .action(async (input: string | undefined, options: any) => {
      // Show help if requested
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'trim',
          emoji: '✂️',
          description: 'Trim videos to specific time ranges. Extract clips from longer videos with precision timing. Supports both fast stream copy mode and re-encoding mode. Can process single files or entire directories.',
          usage: [
            'trim <input> --start <time> --end <time>',
            'trim video.mp4 -s 00:01:30 -e 00:05:45',
            'trim videos/ -s 10 -d 30 -o output/'
          ],
          options: [
            { flag: '-o, --output <path>', description: 'Output file/directory (default: <input>-trimmed.<ext>)' },
            { flag: '-s, --start <time>', description: 'Start time: HH:MM:SS or seconds (default: 00:00:00)' },
            { flag: '-e, --end <time>', description: 'End time: HH:MM:SS or seconds' },
            { flag: '-d, --duration <duration>', description: 'Duration from start: HH:MM:SS or seconds' },
            { flag: '--fast', description: 'Fast mode - stream copy without re-encoding' },
            { flag: '-c, --codec <codec>', description: 'Video codec: h264, h265, copy (default: copy)' },
            { flag: '--format <format>', description: 'Output format: mp4, mkv, webm' },
            { flag: '--dry-run', description: 'Preview FFmpeg command without executing' },
            { flag: '-v, --verbose', description: 'Show detailed FFmpeg output' }
          ],
          examples: [
            { command: 'trim video.mp4 -s 00:01:30 -e 00:05:45', description: 'Trim from 1:30 to 5:45' },
            { command: 'trim video.mp4 -s 10 -d 30', description: 'Extract 30 seconds starting at 10 seconds' },
            { command: 'trim video.mp4 -s 60 -d 120 --fast', description: 'Fast trim using stream copy' },
            { command: 'trim videos/ -s 5 -d 30 -o clips/', description: 'Trim all videos in folder' },
            { command: 'trim long.mp4 -s 00:10:00 -e 00:15:00 -c h265', description: 'Trim and re-encode with H265' }
          ],
          additionalSections: [
            {
              title: 'Time Format',
              items: [
                'Seconds: 90 (1 minute 30 seconds)',
                'MM:SS: 01:30 (1 minute 30 seconds)',
                'HH:MM:SS: 00:01:30 (1 minute 30 seconds)',
                'You must specify either --end or --duration (not both)'
              ]
            },
            {
              title: 'Fast Mode vs Re-encoding',
              items: [
                'Fast (--fast): Stream copy, very quick, may not be frame-accurate',
                'Re-encode (default with codec): Slower but frame-accurate',
                'Stream copy (default): Fast and frame-accurate for most cases'
              ]
            }
          ],
          tips: [
            'Use --fast for quick previews or when exact frame accuracy is not critical',
            'For precise frame-accurate cuts, omit --fast (slight re-encoding)',
            'Specify --end for absolute time or --duration for relative time',
            'Use seconds for simpler time specifications (e.g., -s 90 -d 30)'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Processing trim...').start();

      try {
        // Check ffmpeg
        const ffmpegAvailable = await checkFFmpeg();
        if (!ffmpegAvailable) {
          spinner.fail(chalk.red('ffmpeg is not installed or not in PATH'));
          process.exit(1);
        }

        // Parse input files
        const inputFiles = parseInputPaths(input);

        if (inputFiles.length === 0) {
          spinner.fail(chalk.red('No valid video files found'));
          process.exit(1);
        }

        spinner.text = `Found ${inputFiles.length} video file(s) to process`;

        // Parse start time
        const startSeconds = parseTimeToSeconds(options.start || '0');

        // Validate time options
        if (!options.end && !options.duration) {
          spinner.fail(chalk.red('Either --end or --duration must be specified'));
          process.exit(1);
        }

        // Resolve output paths
        const outputPaths = resolveOutputPaths(inputFiles, options.output, {
          suffix: '-trimmed',
          newExtension: options.format ? `.${options.format}` : undefined
        });

        // Process each file
        for (let i = 0; i < inputFiles.length; i++) {
          const inputFile = inputFiles[i];
          const outputFile = outputPaths.get(inputFile)!;

          spinner.text = `Processing ${i + 1}/${inputFiles.length}: ${inputFile}`;

          // Get metadata
          const metadata = await getVideoMetadata(inputFile);

          // Calculate end time
          let endSeconds: number;
          if (options.duration) {
            endSeconds = startSeconds + parseTimeToSeconds(options.duration);
          } else {
            endSeconds = parseTimeToSeconds(options.end);
          }

          // Validate times
          if (startSeconds < 0 || startSeconds >= metadata.duration) {
            spinner.warn(chalk.yellow(`Skipping ${inputFile}: Start time out of range`));
            continue;
          }
          if (endSeconds > metadata.duration) {
            endSeconds = metadata.duration;
          }
          if (endSeconds <= startSeconds) {
            spinner.warn(chalk.yellow(`Skipping ${inputFile}: Invalid time range`));
            continue;
          }

          const trimDuration = endSeconds - startSeconds;

          // Build ffmpeg arguments
          const args = ['-ss', startSeconds.toString(), '-i', inputFile];

          if (options.duration) {
            args.push('-t', trimDuration.toString());
          } else {
            args.push('-to', endSeconds.toString());
          }

          // Codec settings
          if (options.fast) {
            args.push('-c', 'copy');
          } else if (options.codec && options.codec !== 'copy') {
            const codecMap: Record<string, string> = {
              'h264': 'libx264',
              'h265': 'libx265',
              'hevc': 'libx265',
            };
            args.push('-c:v', codecMap[options.codec] || 'copy', '-c:a', 'aac');
          } else {
            args.push('-c', 'copy');
          }

          args.push('-y', outputFile);

          // Show command if dry-run
          if (options.dryRun) {
            console.log(chalk.cyan('\nFFmpeg command:'));
            console.log(chalk.gray('ffmpeg ' + args.join(' ')));
            console.log();
            continue;
          }

          // Run trim
          await runFFmpeg(args, options.verbose, (line) => {
            if (options.verbose) {
              logFFmpegOutput(line);
            }
          });

          spinner.succeed(
            chalk.green(
              `✓ [${i + 1}/${inputFiles.length}] Trimmed ${formatDuration(startSeconds)} → ${formatDuration(endSeconds)} (${formatDuration(trimDuration)})\n` +
              chalk.dim(`   ${outputFile}`)
            )
          );
        }

        if (!options.dryRun) {
          console.log(chalk.green.bold(`\n✨ Successfully trimmed ${inputFiles.length} video(s)!`));
        }
      } catch (error) {
        spinner.fail(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
