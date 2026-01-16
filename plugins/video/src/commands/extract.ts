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
    .option('--stream <index>', 'Select audio stream index (default: 0)', '0')
    .option('--start <time>', 'Start time (HH:MM:SS or seconds)')
    .option('--duration <time>', 'Duration from start (HH:MM:SS or seconds)')
    .option('--volume <db>', 'Adjust output volume in dB (e.g., -3 for -3dB)')
    .option('--metadata <key=value>', 'Set custom metadata (repeatable)', (val: string, acc: string[] = []) => { acc.push(val); return acc; }, [] as string[])
    .option('--force', 'Overwrite output files without prompt')
    .action(async (input: string, options: any) => {
      const spinner = ora('Extracting audio...').start();
      try {
        if (!(await checkFFmpeg())) throw new Error('FFmpeg not found.');
        const output = options.output || generateOutputPath(input, 'audio', options.format);
        const args = ['-i', input];
        if (options.force) args.push('-y');
        args.push('-vn');
        if (options.stream) args.push('-map', `0:a:${options.stream}`);
        if (options.start) args.push('-ss', options.start);
        if (options.duration) args.push('-t', options.duration);
        args.push('-acodec', options.format);
        args.push('-b:a', options.bitrate);
        // Audio filters
        const filters: string[] = [];
        if (options.volume) filters.push(`volume=${options.volume}dB`);
        if (filters.length > 0) args.push('-af', filters.join(','));
        // Metadata
        if (options.metadata && Array.isArray(options.metadata)) {
          for (const entry of options.metadata) {
            const [key, value] = entry.split('=');
            if (key && value) args.push('-metadata', `${key}=${value}`);
          }
        }
        args.push(output);
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
    .option('--frames <range>', 'Extract multiple frames: <start>:<end>:<step> (e.g., 0:100:10)')
    .option('--vf <filter>', 'Apply custom video filter (repeatable)', (val: string, acc: string[] = []) => { acc.push(val); return acc; }, [] as string[])
    .option('--force', 'Overwrite output files without prompt')
    .action(async (input: string, options: any) => {
      const spinner = ora('Extracting frame(s)...').start();
      try {
        if (!(await checkFFmpeg())) throw new Error('FFmpeg not found.');
        const output = options.output || generateOutputPath(input, 'frame', options.format);
        const args = ['-i', input];
        if (options.force) args.push('-y');
        if (options.time) args.push('-ss', options.time);
        if (options.frames) {
          // e.g., 0:100:10 means start at 0, end at 100, step 10
          const [start, end, step] = options.frames.split(':').map(Number);
          args.push('-vf', `select='not(mod(n\,${step}))',setpts=N/FRAME_RATE/TB`);
          args.push('-frames:v', ((end - start) / step + 1).toString());
        } else {
          args.push('-frames:v', '1');
        }
        if (options.vf && Array.isArray(options.vf) && options.vf.length > 0) {
          for (const filter of options.vf) {
            args.push('-vf', filter);
          }
        }
        args.push('-q:v', '2');
        args.push(output);
        await runFFmpeg(args, options.verbose, logFFmpegOutput);
        spinner.succeed(`Frame(s) extracted to ${output}`);
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
    .option('--quality <q>', 'JPEG/PNG quality (1-31)', '2')
    .option('--vf <filter>', 'Apply custom video filter (repeatable)', (val: string, acc: string[] = []) => { acc.push(val); return acc; }, [] as string[])
    .option('--force', 'Overwrite output files without prompt')
    .action(async (input: string, options: any) => {
      const spinner = ora('Extracting thumbnail...').start();
      try {
        if (!(await checkFFmpeg())) throw new Error('FFmpeg not found.');
        const output = options.output || generateOutputPath(input, 'thumbnail', options.format);
        const [width, height] = options.size.split('x');
        const args = ['-i', input];
        if (options.force) args.push('-y');
        if (options.time) args.push('-ss', options.time);
        args.push('-vframes', '1');
        let vf = `scale=${width}:${height}`;
        if (options.vf && Array.isArray(options.vf) && options.vf.length > 0) {
          vf += ',' + options.vf.join(',');
        }
        args.push('-vf', vf);
        args.push('-q:v', options.quality);
        args.push(output);
        await runFFmpeg(args, options.verbose, logFFmpegOutput);
        spinner.succeed(`Thumbnail extracted to ${output}`);
      } catch (err: any) {
        spinner.fail(err.message);
      }
    });
}
