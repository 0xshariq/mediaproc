import type { Command } from 'commander';
import chalk from 'chalk';
import { runFFmpeg, checkFFmpeg } from '../utils/ffmpeg.js';
import { parseInputPaths, resolveOutputPaths, showPluginBranding, createStandardHelp } from '@mediaproc/core';
import ora from 'ora';
import { logFFmpegOutput } from '../utils/ffmpegLogger.js';

export function extractCommand(videoCmd: Command): void {
  const extract = videoCmd.command('extract').description('Extract audio, frames, or thumbnails from video');

  // Extract audio subcommand
  extract
    .command('audio <input>')
    .description('Extract audio from video file')
    .option('-o, --output <path>', 'Output audio file or directory path')
    .option('-f, --format <format>', 'Audio format (mp3, wav, etc.)', 'mp3')
    .option('-b, --bitrate <bitrate>', 'Audio bitrate (e.g., 192k)', '192k')
    .option('--stream <index>', 'Select audio stream index (default: 0)', '0')
    .option('--start <time>', 'Start time (HH:MM:SS or seconds)')
    .option('--duration <time>', 'Duration from start (HH:MM:SS or seconds)')
    .option('--volume <db>', 'Adjust output volume in dB (e.g., -3 for -3dB)')
    .option('--metadata <key=value>', 'Set custom metadata (repeatable)', (val: string, acc: string[] = []) => { acc.push(val); return acc; }, [] as string[])
    .option('--force', 'Overwrite output files without prompt')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('--help', 'Display help for extract audio command')
    .action(async (input: string, options: any) => {
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'extract audio',
          emoji: '🎵',
          description: 'Extract audio from video files with advanced options.',
          usage: ['extract audio <input> [options]'],
          options: [
            { flag: '-o, --output <path>', description: 'Output file/directory path' },
            { flag: '-f, --format <format>', description: 'Audio format (mp3, wav, etc.)' },
            { flag: '-b, --bitrate <bitrate>', description: 'Audio bitrate (e.g., 192k)' },
            { flag: '--stream <index>', description: 'Select audio stream index' },
            { flag: '--start <time>', description: 'Start time (HH:MM:SS or seconds)' },
            { flag: '--duration <time>', description: 'Duration from start (HH:MM:SS or seconds)' },
            { flag: '--volume <db>', description: 'Adjust output volume in dB' },
            { flag: '--explain [mode]', description: 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.' },
            { flag: '--metadata <key=value>', description: 'Set custom metadata (repeatable)' },
            { flag: '--force', description: 'Overwrite output files without prompt' },
            { flag: '--help', description: 'Display help for extract audio command' }
          ],
          examples: [
            { command: 'extract audio video.mp4', description: 'Extract audio from video.mp4 as mp3' },
            { command: 'extract audio video.mp4 -o out.wav -f wav', description: 'Extract as WAV format' },
            { command: 'extract audio video.mp4 --bitrate 256k', description: 'Set audio bitrate to 256k' },
            { command: 'extract audio video.mp4 --stream 1', description: 'Extract second audio stream' }
          ]
        });
        return;
      }
      const inputPaths = await parseInputPaths(input, ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg', '.3gp']);
      const outputPathsMap = resolveOutputPaths(inputPaths, options.output, { suffix: '-audio', newExtension: options.format });
      const outputPaths = Array.from(outputPathsMap.values());
      for (let i = 0; i < inputPaths.length; i++) {
        const inputFile = inputPaths[i];
        const outputFile = outputPaths[i];
        const spinner = ora(chalk.cyan(`Extracting audio from ${inputFile}`)).start();
        try {
          if (!(await checkFFmpeg())) throw new Error(chalk.red('FFmpeg not found.'));
          const args = ['-i', inputFile];
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
          args.push(outputFile);
          await runFFmpeg(args, options.verbose, logFFmpegOutput);
          spinner.succeed(chalk.green.bold(`✓ Audio extracted to ${outputFile}`));
        } catch (err: any) {
          spinner.fail(chalk.red.bold(`✗ ${err.message}`));
        }
      }
      showPluginBranding('Video', '../../package.json');
    });

  // Extract frame subcommand
  extract
    .command('frame <input>')
    .description('Extract a single frame from video file')
    .option('-o, --output <path>', 'Output image file or directory path')
    .option('-t, --time <timestamp>', 'Timestamp to extract frame (e.g., 00:00:10)', '00:00:01')
    .option('-f, --format <format>', 'Image format (jpg, png, etc.)', 'jpg')
    .option('--frames <range>', 'Extract multiple frames: <start>:<end>:<step> (e.g., 0:100:10)')
    .option('--vf <filter>', 'Apply custom video filter (repeatable)', (val: string, acc: string[] = []) => { acc.push(val); return acc; }, [] as string[])
    .option('--force', 'Overwrite output files without prompt')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('--help', 'Display help for extract frame command')
    .action(async function (input: string, options: any) {
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'extract frame',
          emoji: '🖼️',
          description: 'Extract frames from video files with advanced options.',
          usage: ['extract frame <input> [options]'],
          options: [
            { flag: '-o, --output <path>', description: 'Output file/directory path' },
            { flag: '-t, --time <timestamp>', description: 'Timestamp to extract frame' },
            { flag: '-f, --format <format>', description: 'Image format (jpg, png, etc.)' },
            { flag: '--frames <range>', description: 'Extract multiple frames: <start>:<end>:<step>' },
            { flag: '--explain', description: 'Explain what is happening behind the scene in proper flow and in detail.' },
            { flag: '--vf <filter>', description: 'Apply custom video filter (repeatable)' },
            { flag: '--force', description: 'Overwrite output files without prompt' },
            { flag: '--help', description: 'Display help for extract frame command' }
          ],
          examples: [
            { command: 'extract frame video.mp4', description: 'Extract default frame at 00:00:01' },
            { command: 'extract frame video.mp4 -t 00:00:10', description: 'Extract frame at 10 seconds' },
            { command: 'extract frame video.mp4 --frames 0:100:10', description: 'Extract every 10th frame from 0 to 100' },
            { command: 'extract frame video.mp4 --vf "crop=320:240"', description: 'Apply crop filter to frame' }
          ]
        });
        return;
      }
      const inputPaths = await parseInputPaths(input, ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg', '.3gp']);
      const outputPathsMap = resolveOutputPaths(inputPaths, options.output, { suffix: '-frame', newExtension: options.format });
      const outputPaths = Array.from(outputPathsMap.values());
      for (let i = 0; i < inputPaths.length; i++) {
        const inputFile = inputPaths[i];
        const outputFile = outputPaths[i];
        const spinner = ora(chalk.cyan(`Extracting frame(s) from ${inputFile}`)).start();
        try {
          if (!(await checkFFmpeg())) throw new Error(chalk.red('FFmpeg not found.'));
          const args = ['-i', inputFile];
          if (options.force) args.push('-y');
          if (options.time) args.push('-ss', options.time);
          if (options.frames) {
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
          args.push(outputFile);
          await runFFmpeg(args, options.verbose, logFFmpegOutput);
          spinner.succeed(chalk.green.bold(`✓ Frame(s) extracted to ${outputFile}`));
        } catch (err: any) {
          spinner.fail(chalk.red.bold(`✗ ${err.message}`));
        }
      }
      showPluginBranding('Video', '../../package.json');
    });

  // Extract thumbnail subcommand
  extract
    .command('thumbnail <input>')
    .description('Extract a thumbnail image from video file')
    .option('-o, --output <path>', 'Output thumbnail file or directory path')
    .option('-t, --time <timestamp>', 'Timestamp for thumbnail (e.g., 00:00:05)', '00:00:01')
    .option('-f, --format <format>', 'Thumbnail format (jpg, png, etc.)', 'jpg')
    .option('--size <size>', 'Thumbnail size (e.g., 320x180)', '320x180')
    .option('--quality <q>', 'JPEG/PNG quality (1-31)', '2')
    .option('--vf <filter>', 'Apply custom video filter (repeatable)', (val: string, acc: string[] = []) => { acc.push(val); return acc; }, [] as string[])
    .option('--force', 'Overwrite output files without prompt')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('--help', 'Display help for extract thumbnail command')
    .action(async function (input: string, options: any) {
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'extract thumbnail',
          emoji: '🖼️',
          description: 'Extract thumbnails from video files with advanced options.',
          usage: ['extract thumbnail <input> [options]'],
          options: [
            { flag: '-o, --output <path>', description: 'Output file/directory path' },
            { flag: '-t, --time <timestamp>', description: 'Timestamp for thumbnail' },
            { flag: '-f, --format <format>', description: 'Thumbnail format (jpg, png, etc.)' },
            { flag: '--size <size>', description: 'Thumbnail size (e.g., 320x180)' },
            { flag: '--quality <q>', description: 'JPEG/PNG quality (1-31)' },
            { flag: '--vf <filter>', description: 'Apply custom video filter (repeatable)' },
            { flag: '--explain', description: 'Explain what is happening behind the scene in proper flow and in detail.' },
            { flag: '--force', description: 'Overwrite output files without prompt' },
            { flag: '--help', description: 'Display help for extract thumbnail command' }
          ],
          examples: [
            { command: 'extract thumbnail video.mp4', description: 'Extract default thumbnail at 00:00:01' },
            { command: 'extract thumbnail video.mp4 -t 00:00:05', description: 'Extract thumbnail at 5 seconds' },
            { command: 'extract thumbnail video.mp4 --size 640x360', description: 'Set thumbnail size to 640x360' },
            { command: 'extract thumbnail video.mp4 --quality 5', description: 'Set JPEG/PNG quality to 5' }
          ]
        });
        return;
      }
      const inputPaths = await parseInputPaths(input, ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg', '.3gp']);
      const outputPathsMap = resolveOutputPaths(inputPaths, options.output, { suffix: '-thumbnail', newExtension: options.format });
      const outputPaths = Array.from(outputPathsMap.values());
      for (let i = 0; i < inputPaths.length; i++) {
        const inputFile = inputPaths[i];
        const outputFile = outputPaths[i];
        const spinner = ora(chalk.cyan(`Extracting thumbnail from ${inputFile}`)).start();
        try {
          if (!(await checkFFmpeg())) throw new Error(chalk.red('FFmpeg not found.'));
          const [width, height] = options.size.split('x');
          const args = ['-i', inputFile];
          if (options.force) args.push('-y');
          if (options.time) args.push('-ss', options.time);
          args.push('-vframes', '1');
          let vf = `scale=${width}:${height}`;
          if (options.vf && Array.isArray(options.vf) && options.vf.length > 0) {
            vf += ',' + options.vf.join(',');
          }
          args.push('-vf', vf);
          args.push('-q:v', options.quality);
          args.push(outputFile);
          await runFFmpeg(args, options.verbose, logFFmpegOutput);
          spinner.succeed(chalk.green.bold(`✓ Thumbnail extracted to ${outputFile}`));
        } catch (err: any) {
          spinner.fail(chalk.red.bold(`✗ ${err.message}`));
        }
      }
      showPluginBranding('Video', '../../package.json');
    });
}
