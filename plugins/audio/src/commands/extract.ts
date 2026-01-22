import type { Command } from 'commander';
import chalk from 'chalk';
import { stat } from 'fs/promises';
import {
  runFFmpeg,
  getAudioMetadata,
  checkFFmpeg,
  formatFileSize,
  formatDuration,
} from '../utils/ffmpeg.js';
import { styleFFmpegOutput, shouldDisplayLine } from '../utils/ffmpeg-output.js';
import { AUDIO_EXTENSIONS, parseInputPaths, resolveOutputPaths, validatePaths, createStandardHelp } from '@mediaproc/core';
import ora from 'ora';

export function extractCommand(audioCmd: Command): void {
  audioCmd
    .command('extract [input]')
    .description('Extract audio from video file')
    .option('-o, --output <path>', 'Output file or directory path')
    .option('-f, --format <format>', 'Output format: mp3, aac, wav, flac, opus, ogg', 'mp3')
    .option('-b, --bitrate <bitrate>', 'Audio bitrate (e.g., 128k, 192k, 320k)', '192k')
    .option('-q, --quality <quality>', 'Quality preset: low, medium, high, lossless', 'medium')
    .option('--sample-rate <rate>', 'Sample rate in Hz (e.g., 44100, 48000)', parseInt)
    .option('--channels <channels>', 'Number of channels: 1 (mono), 2 (stereo)', parseInt)
    .option('--normalize', 'Normalize audio levels (EBU R128 loudness normalization)')
    .option('--volume <db>', 'Adjust output volume in dB (e.g., -3 for -3dB)')
    .option('--fade-in <seconds>', 'Add fade-in effect (seconds)', parseFloat)
    .option('--fade-out <seconds>', 'Add fade-out effect (seconds)', parseFloat)
    .option('--trim <start>:<duration>', 'Trim audio: <start>:<duration> (e.g., 00:01:00:30)')
    .option('--metadata <key=value>', 'Set custom metadata (repeatable)', (val: string, acc: string[] = []) => { acc.push(val); return acc; }, [] as string[])
    .option('--force', 'Overwrite output files without prompt')
    .option('--dry-run', 'Preview command without executing')
    .option('-v, --verbose', 'Show detailed FFmpeg output')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('-h, --help', 'Display help for extract command')
    .action(async (input: string | undefined, options: any) => {
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'extract',
          emoji: '🎵',
          description: 'Extract audio track from video files. Supports multiple output formats and quality presets.',
          usage: [
            'extract <input> [options]',
            'extract video.mp4 -f mp3',
            'extract videos/ -f aac -o audio/'
          ],
          options: [
            { flag: '-o, --output <path>', description: 'Output file/directory path (default: <input>-audio.<ext>)' },
            { flag: '-f, --format <format>', description: 'Output format: mp3, aac, wav, flac, opus, ogg (default: mp3)' },
            { flag: '-b, --bitrate <bitrate>', description: 'Audio bitrate: 128k, 192k, 256k, 320k (default: 192k)' },
            { flag: '-q, --quality <quality>', description: 'Quality preset: low (96k), medium (192k), high (320k), lossless' },
            { flag: '--sample-rate <rate>', description: 'Sample rate: 44100 (CD), 48000 (studio), 96000 (Hi-Res)' },
            { flag: '--channels <channels>', description: 'Audio channels: 1 (mono), 2 (stereo)' },
            { flag: '--normalize', description: 'Normalize audio levels (EBU R128 loudness normalization)' },
            { flag: '--volume <db>', description: 'Adjust output volume in dB (e.g., -3 for -3dB)' },
            { flag: '--fade-in <seconds>', description: 'Add fade-in effect (seconds)' },
            { flag: '--fade-out <seconds>', description: 'Add fade-out effect (seconds)' },
            { flag: '--trim <start>:<duration>', description: 'Trim audio: <start>:<duration> (e.g., 00:01:00:30)' },
            { flag: '--metadata <key=value>', description: 'Set custom metadata (repeatable)' },
            { flag: '--force', description: 'Overwrite output files without prompt' },
            { flag: '--dry-run', description: 'Preview FFmpeg command without executing' },
            { flag: '--explain [mode]', description: 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.' },
            { flag: '-v, --verbose', description: 'Show detailed FFmpeg output and progress' }
          ],
          examples: [
            { command: 'extract video.mp4', description: 'Extract audio as MP3' },
            { command: 'extract video.mp4 -f aac -b 256k', description: 'Extract as high-quality AAC' },
            { command: 'extract video.mkv -f flac -q lossless', description: 'Extract as lossless FLAC' },
            { command: 'extract video.mp4 -f mp3 --channels 1', description: 'Extract as mono MP3' },
            { command: 'extract videos/ -f mp3 -o audio/', description: 'Batch extract from folder' }
          ],
        });
        return;
      }

      try {
        const ffmpegAvailable = await checkFFmpeg();
        if (!ffmpegAvailable) {
          console.error(chalk.red('\n✗ FFmpeg not found. Please install FFmpeg first.'));
          process.exit(1);
        }

        // Accept video formats
        const inputPaths = parseInputPaths(input, AUDIO_EXTENSIONS);
        const { outputPath } = validatePaths(input, options.output, { allowedExtensions: AUDIO_EXTENSIONS });
        const outputPathsMap = resolveOutputPaths(inputPaths, outputPath, {
          suffix: '-audio',
          newExtension: `.${options.format}`
        });
        const outputPaths = Array.from(outputPathsMap.values());

        // Quality presets
        const qualityMap: Record<string, string> = {
          low: '96k',
          medium: '192k',
          high: '320k',
          lossless: 'lossless'
        };

        const targetBitrate = qualityMap[options.quality] || options.bitrate;

        for (let i = 0; i < inputPaths.length; i++) {
          const inputFile = inputPaths[i];
          const outputFile = outputPaths[i];

          console.log(chalk.blue(`\n🎵 Extracting audio from: ${inputFile}`));

          let metadata: any = undefined;
          try {
            metadata = await getAudioMetadata(inputFile);
            console.log(chalk.dim(`Duration: ${formatDuration(metadata.duration)} • ` +
              `Codec: ${metadata.codec} • ` +
              `Sample Rate: ${metadata.sampleRate} Hz`));
          } catch (err) {
            console.log(chalk.dim('Analyzing video file...'));
          }

          // Build FFmpeg args
          const args = ['-i', inputFile, '-vn'];  // -vn = no video
          if (options.force) args.push('-y');

          // Trim
          if (options.trim) {
            const [start, duration] = options.trim.split(':');
            if (start) args.push('-ss', start);
            if (duration) args.push('-t', duration);
          }

          // Codec selection
          const codecMap: Record<string, string> = {
            mp3: 'libmp3lame',
            aac: 'aac',
            flac: 'flac',
            wav: 'pcm_s16le',
            ogg: 'libvorbis',
            opus: 'libopus',
          };
          const codec = codecMap[options.format];
          if (codec) args.push('-c:a', codec);
          if (targetBitrate !== 'lossless') args.push('-b:a', targetBitrate);
          if (options.sampleRate) args.push('-ar', options.sampleRate.toString());
          if (options.channels) args.push('-ac', options.channels.toString());

          // Audio filters
          const filters: string[] = [];
          if (options.normalize) filters.push('loudnorm=I=-16:TP=-1.5:LRA=11');
          if (options.volume) filters.push(`volume=${options.volume}dB`);
          if (options.fadeIn) filters.push(`afade=t=in:st=0:d=${options.fadeIn}`);
          if (options.fadeOut && metadata && metadata.duration) {
            const fadeStart = metadata.duration - options.fadeOut;
            filters.push(`afade=t=out:st=${fadeStart}:d=${options.fadeOut}`);
          }
          if (filters.length > 0) args.push('-af', filters.join(','));

          // Metadata
          if (options.metadata && Array.isArray(options.metadata)) {
            for (const entry of options.metadata) {
              const [key, value] = entry.split('=');
              if (key && value) args.push('-metadata', `${key}=${value}`);
            }
          }

          args.push(outputFile);

          if (options.dryRun) {
            console.log(chalk.yellow('\n[DRY RUN] Would execute:'));
            console.log(chalk.dim(`ffmpeg ${args.join(' ')}`));
            continue;
          }

          const spinner = ora('Extracting audio...').start();

          try {
            await runFFmpeg(
              args,
              options.verbose,
              (line: string) => {
                if (shouldDisplayLine(line, options.verbose)) {
                  console.log(styleFFmpegOutput(line));
                }
              }
            );
            const outputStat = await stat(outputFile);

            spinner.succeed(chalk.green('Extraction complete'));
            console.log(chalk.green(`✓ Output: ${outputFile}`));
            console.log(chalk.dim(`Format: ${options.format.toUpperCase()} • ` +
              `Bitrate: ${targetBitrate} • ` +
              `Size: ${formatFileSize(outputStat.size)}`));
          } catch (error) {
            spinner.fail(chalk.red('Extraction failed'));
            throw error;
          }
        }

        if (inputPaths.length > 1) {
          console.log(chalk.green(`\n✓ Extracted audio from ${inputPaths.length} videos successfully`));
        }
      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
