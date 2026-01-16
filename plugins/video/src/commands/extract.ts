import type { Command } from 'commander';
import chalk from 'chalk';
import { runFFmpeg, checkFFmpeg, generateOutputPath } from '../utils/ffmpeg.js';
import ora from 'ora';
import { logFFmpegOutput } from '../utils/ffmpegLogger.js';

export function extractCommand(videoCmd: Command): void {
  const extract = videoCmd.command('extract').description('Extract audio, frames, or thumbnails from video');

  // Extract audio subcommand
  extract
    .command('audio <input>')
    .description('Extract audio from video file')
    .option('-o, --output <path>', 'Output audio file path')
    .option('-f, --format <format>', 'Audio format (mp3, wav, etc.)', 'mp3')
    .option('-b, --bitrate <bitrate>', 'Audio bitrate (e.g., 192k)', '192k')
    .action(async (input: string, options: any) => {
      const spinner = ora('Extracting audio...').start();
      try {
        if (!(await checkFFmpeg())) throw new Error('FFmpeg not found.');
        const output = options.output || generateOutputPath(input, 'audio', options.format);
        const args = [
          '-i', input,
          '-vn',
          '-acodec', options.format,
          '-b:a', options.bitrate,
          '-y', output
        ];
        await runFFmpeg(args, options.verbose, logFFmpegOutput);
        spinner.succeed(`Audio extracted to ${output}`);
      } catch (err: any) {
        spinner.fail(err.message);
      }
    });

  // Extract frame subcommand
  extract
    .command('frame <input>')
    .description('Extract a single frame from video file')
    .option('-o, --output <path>', 'Output image file path')
    .option('-t, --time <timestamp>', 'Timestamp to extract frame (e.g., 00:00:10)', '00:00:01')
    .option('-f, --format <format>', 'Image format (jpg, png, etc.)', 'jpg')
    .action(async (input: string, options: any) => {
      const spinner = ora('Extracting frame...').start();
      try {
        if (!(await checkFFmpeg())) throw new Error('FFmpeg not found.');
        const output = options.output || generateOutputPath(input, 'frame', options.format);
        const args = [
          '-i', input,
          '-ss', options.time,
          '-frames:v', '1',
          '-q:v', '2',
          '-y', output
        ];
        await runFFmpeg(args, options.verbose, logFFmpegOutput);
        spinner.succeed(`Frame extracted to ${output}`);
      } catch (err: any) {
        spinner.fail(err.message);
      }
    });

  // Extract thumbnail subcommand
  extract
    .command('thumbnail <input>')
    .description('Extract a thumbnail image from video file')
    .option('-o, --output <path>', 'Output thumbnail file path')
    .option('-t, --time <timestamp>', 'Timestamp for thumbnail (e.g., 00:00:05)', '00:00:01')
    .option('-f, --format <format>', 'Thumbnail format (jpg, png, etc.)', 'jpg')
    .option('--size <size>', 'Thumbnail size (e.g., 320x180)', '320x180')
    .action(async (input: string, options: any) => {
      const spinner = ora('Extracting thumbnail...').start();
      try {
        if (!(await checkFFmpeg())) throw new Error('FFmpeg not found.');
        const output = options.output || generateOutputPath(input, 'thumbnail', options.format);
        const [width, height] = options.size.split('x');
        const args = [
          '-i', input,
          '-ss', options.time,
          '-vframes', '1',
          '-vf', `scale=${width}:${height}`,
          '-q:v', '2',
          '-y', output
        ];
        await runFFmpeg(args, options.verbose, logFFmpegOutput);
        spinner.succeed(`Thumbnail extracted to ${output}`);
      } catch (err: any) {
        spinner.fail(err.message);
      }
    });
}
