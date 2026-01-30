import type { Command } from 'commander';
import chalk from 'chalk';
import { stat } from 'fs/promises';
import { runFFmpeg, getAudioMetadata, checkFFmpeg, formatFileSize, formatDuration } from '../utils/ffmpeg.js';
import { styleFFmpegOutput, shouldDisplayLine } from '../utils/ffmpeg-output.js';
import { AUDIO_EXTENSIONS, validatePaths, resolveOutputPaths, createStandardHelp } from '@mediaproc/core';
import ora from 'ora';
import { NormalizeOptions } from '../types.js';

export function normalizeCommand(audioCmd: Command): void {
  audioCmd
    .command('normalize [input]')
    .description('Normalize audio levels to consistent loudness')
    .option('-o, --output <path>', 'Output file or directory path')
    .option('-t, --target <lufs>', 'Target loudness in LUFS (default: -16)', parseInt, -16)
    .option('-l, --max-level <db>', 'Maximum true peak in dB (default: -1.5)', parseFloat, -1.5)
    .option('-m, --method <method>', 'Normalization method: loudnorm (EBU R128), peak', 'loudnorm')
    .option('--format <format>', 'Output format (default: same as input)')
    .option('--dry-run', 'Preview command without executing')
    .option('-v, --verbose', 'Show detailed FFmpeg output')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('-h, --help', 'Display help for normalize command')
    .action(async function (input: string | undefined, options: NormalizeOptions) {
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'normalize',
          emoji: '📊',
          description: 'Normalize audio levels using EBU R128 loudness normalization standard. Ensures consistent volume across different audio files.',
          usage: [
            'normalize <input> [options]',
            'normalize audio.mp3',
            'normalize audio-files/ -o output/'
          ],
          options: [
            { flag: '-o, --output <path>', description: 'Output file/directory path (default: <input>-normalized.<ext>)' },
            { flag: '-t, --target <lufs>', description: 'Target loudness: -16 (broadcast), -23 (streaming), -14 (podcasts)' },
            { flag: '-l, --max-level <db>', description: 'Maximum true peak in dB to prevent clipping (default: -1.5)' },
            { flag: '-m, --method <method>', description: 'Normalization method: loudnorm (EBU R128 standard), peak' },
            { flag: '--format <format>', description: 'Output format: mp3, aac, wav, flac (default: same as input)' },
            { flag: '--dry-run', description: 'Preview FFmpeg command without executing' },
            { flag: '--explain [mode]', description: 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.' },
            { flag: '-v, --verbose', description: 'Show detailed FFmpeg output and progress' }
          ],
          examples: [
            { command: 'normalize audio.mp3', description: 'Normalize to -16 LUFS (broadcast standard)' },
            { command: 'normalize audio.mp3 -t -23', description: 'Normalize to -23 LUFS (streaming standard)' },
            { command: 'normalize loud-audio.wav -t -16 -l -1.0', description: 'Normalize with custom peak limit' },
            { command: 'normalize audio.mp3 -m peak', description: 'Use simple peak normalization' },
            { command: 'normalize folder/ -o output/', description: 'Batch normalize all audio files' }
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

        const { inputFiles, outputPath, errors } = validatePaths(input, options.output, { allowedExtensions: AUDIO_EXTENSIONS });
        if (errors.length > 0) {
          errors.forEach(e => console.error(chalk.red(e)));
          process.exit(1);
        }
        const suffix = options.format ? `-normalized.${options.format}` : '-normalized';
        const outputPathsMap = resolveOutputPaths(inputFiles, outputPath, { suffix });
        const outputPaths = Array.from(outputPathsMap.values());

        for (let i = 0; i < inputFiles.length; i++) {
          const inputFile = inputFiles[i];
          const outputFile = outputPaths[i];

          console.log(chalk.blue(`\n📊 Normalizing: ${inputFile}`));

          const metadata = await getAudioMetadata(inputFile);
          const inputStat = await stat(inputFile);

          console.log(chalk.dim(`Duration: ${formatDuration(metadata.duration)} • ` +
            `Sample Rate: ${metadata.sampleRate} Hz • ` +
            `Channels: ${metadata.channels}`));

          const args = ['-i', inputFile, '-y'];

          let filterApplied = false;
          if (options.method === 'loudnorm') {
            args.push(
              '-af',
              `loudnorm=I=${options.target}:TP=${options.maxLevel}:LRA=11:print_format=summary`
            );
            filterApplied = true;
          } else if (options.method === 'peak') {
            args.push('-af', 'volume=0dB');
            filterApplied = true;
          }

          // Determine output format and codec
          let outFormat: import('../types.js').AudioFormats | undefined = options.format;
          if (!outFormat) {
            const extMatch = outputFile.match(/\.([a-zA-Z0-9]+)$/);
            outFormat = extMatch && [
              'mp3','wav','flac','aac','ogg','m4a','wma','opus','ape','alac','mov','mkv'
            ].includes(extMatch[1].toLowerCase())
              ? extMatch[1].toLowerCase() as import('../types.js').AudioFormats
              : undefined;
          }

          // Prevent filter+streamcopy: show error if user tries to use filters with stream copy
          if (filterApplied) {
            if (outFormat === 'mp3') {
              args.push('-c:a', 'libmp3lame');
            } else if (outFormat === 'aac' || outFormat === 'm4a') {
              args.push('-c:a', 'aac');
            } else if (outFormat === 'flac') {
              args.push('-c:a', 'flac');
            } else if (outFormat === 'wav') {
              args.push('-c:a', 'pcm_s16le');
            } else {
              args.push('-c:a', 'libmp3lame'); // Default to mp3 codec for safety
            }
          } else {
            // No filter: safe to streamcopy
            // But if user tries to add a filter (e.g. via method=peak) and also requests stream copy, show error
            if (options.method === 'peak' || options.method === 'loudnorm') {
              // Defensive: should not happen, but catch any logic error
              console.error(chalk.red('\n✗ Error: Cannot use normalization filters with stream copy. Please remove normalization options or use a supported codec.'));
              process.exit(1);
            }
            args.push('-c:a', 'copy');
          }

          args.push(outputFile);

          if (options.dryRun) {
            console.log(chalk.yellow('\n[DRY RUN] Would execute:'));
            console.log(chalk.dim(`ffmpeg ${args.join(' ')}`));
            continue;
          }

          const spinner = ora('Normalizing...').start();

          try {
            await runFFmpeg(
              args,
              options.verbose ?? false,
              (line: string) => {
                if (shouldDisplayLine(line, options.verbose ?? false)) {
                  console.log(styleFFmpegOutput(line));
                }
              }
            );
            const outputStat = await stat(outputFile);

            spinner.succeed(chalk.green('Normalization complete'));
            console.log(chalk.green(`✓ Output: ${outputFile}`));
            console.log(chalk.dim(`Target: ${options.target} LUFS • Peak limit: ${options.maxLevel} dB`));
            console.log(chalk.dim(`Size: ${formatFileSize(inputStat.size)} → ${formatFileSize(outputStat.size)}`));
          } catch (error) {
            spinner.fail(chalk.red('Normalization failed'));
            throw error;
          }
        }

        if (inputFiles.length > 1) {
          console.log(chalk.green(`\n✓ Normalized ${inputFiles.length} files successfully`));
        }

      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
