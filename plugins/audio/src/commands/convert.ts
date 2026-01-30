import type { Command } from 'commander';
import chalk from 'chalk';
import { stat } from 'fs/promises';
import { runFFmpeg, getAudioMetadata, checkFFmpeg, formatFileSize, formatDuration } from '../utils/ffmpeg.js';
import { styleFFmpegOutput, shouldDisplayLine } from '../utils/ffmpeg-output.js';
import { parseInputPaths, resolveOutputPaths, validatePaths, createStandardHelp, AUDIO_EXTENSIONS } from '@mediaproc/core';
import ora from 'ora';
import { ConvertOptions } from '../types.js';

export function convertCommand(audioCmd: Command): void {
  audioCmd
    .command('convert [input]')
    .description('Convert audio files between different formats')
    .option('-o, --output <path>', 'Output file or directory path')
    .option('-f, --format <format>', 'Output format: mp3, aac, wav, flac, ogg, opus, m4a', 'mp3')
    .option('-b, --bitrate <bitrate>', 'Audio bitrate (e.g., 128k, 192k, 320k)', '192k')
    .option('-s, --sample-rate <rate>', 'Sample rate in Hz (e.g., 44100, 48000)', parseInt)
    .option('-c, --channels <channels>', 'Number of channels: 1 (mono), 2 (stereo)', parseInt)
    .option('-q, --quality <quality>', 'Quality preset: low, medium, high, lossless', 'medium')
    .option('--codec <codec>', 'Audio codec override (libmp3lame, aac, flac, libvorbis, libopus)')
    .option('--normalize', 'Normalize audio levels (EBU R128 loudness normalization)')
    .option('--volume <db>', 'Adjust output volume in dB (e.g., -3 for -3dB)')
    .option('--fade-in <seconds>', 'Add fade-in effect (seconds)', parseFloat)
    .option('--fade-out <seconds>', 'Add fade-out effect (seconds)', parseFloat)
    .option('--trim <start>:<duration>', 'Trim audio: <start>:<duration> (e.g., 00:01:00:30)')
    .option('--metadata <key=value>', 'Set custom metadata (repeatable)', (val: string, acc: string[] = []) => { acc.push(val); return acc; }, [] as string[])
    .option('--force', 'Overwrite output files without prompt')
    .option('--dry-run', 'Preview command without executing')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('-v, --verbose', 'Show detailed FFmpeg output')
    .option('-h, --help', 'Display help for convert command')
    .action(async (input: string | undefined, options: ConvertOptions) => {
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'convert',
          emoji: '🔄',
          description: 'Convert audio files between formats (MP3, AAC, WAV, FLAC, OGG, Opus). Supports quality presets, bitrate control, and sample rate adjustment.',
          usage: [
            'convert <input> [options]',
            'convert audio.wav -f mp3',
            'convert audio-files/ -f aac -o output/'
          ],
          options: [
            { flag: '-o, --output <path>', description: 'Output file/directory path (default: <input>-converted.<ext>)' },
            { flag: '-f, --format <format>', description: 'Output format: mp3, aac, wav, flac, ogg, opus, m4a (default: mp3)' },
            { flag: '-b, --bitrate <bitrate>', description: 'Audio bitrate: 128k, 192k, 256k, 320k (default: 192k)' },
            { flag: '-s, --sample-rate <rate>', description: 'Sample rate: 44100 (CD quality), 48000 (studio), 96000 (Hi-Res)' },
            { flag: '-c, --channels <channels>', description: 'Audio channels: 1 (mono), 2 (stereo)' },
            { flag: '-q, --quality <quality>', description: 'Quality preset: low (96k), medium (192k), high (320k), lossless' },
            { flag: '--codec <codec>', description: 'Codec override: libmp3lame, aac, flac, libvorbis, libopus' },
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
            { command: 'convert audio.wav -f mp3', description: 'Convert WAV to MP3' },
            { command: 'convert audio.mp3 -f flac -q lossless', description: 'Convert to lossless FLAC' },
            { command: 'convert audio.flac -f mp3 -b 320k', description: 'Convert FLAC to high-quality MP3' },
            { command: 'convert audio.mp3 -f aac -b 128k', description: 'Convert to AAC with specific bitrate' },
            { command: 'convert audio.wav -f mp3 -s 48000', description: 'Convert with specific sample rate' },
            { command: 'convert folder/ -f mp3 -o output/', description: 'Batch convert all audio files in folder' }
          ],
        });
        return;
      }

      try {
        // Check FFmpeg availability
        const ffmpegAvailable = await checkFFmpeg();
        if (!ffmpegAvailable) {
          console.error(chalk.red('\n✗ FFmpeg not found. Please install FFmpeg first.'));
          process.exit(1);
        }

        // Parse and validate input/output paths
        const inputPaths = parseInputPaths(input, AUDIO_EXTENSIONS);
        const { outputPath } = validatePaths(input, options.output, { allowedExtensions: AUDIO_EXTENSIONS });
        const outputFormat = options.format || 'mp3';
        const outputPathsMap = resolveOutputPaths(inputPaths, outputPath, {
          suffix: '-converted',
          newExtension: `.${outputFormat}`
        });
        const outputPaths = Array.from(outputPathsMap.values());

        // Quality presets
        const qualityMap: Record<string, string> = {
          low: '96k',
          medium: '192k',
          high: '320k',
          lossless: 'lossless'
        };

        const targetBitrate = (options.quality && qualityMap[options.quality]) || options.bitrate || '192k';

        // Process each file
        for (let i = 0; i < inputPaths.length; i++) {
          const inputFile = inputPaths[i];
          const outputFile = outputPaths[i];

          console.log(chalk.blue(`\n🔄 Converting: ${inputFile}`));

          // Get metadata
          const metadata = await getAudioMetadata(inputFile);
          const inputStat = await stat(inputFile);

          console.log(chalk.dim(`Duration: ${formatDuration(metadata.duration)} • ` +
            `Sample Rate: ${metadata.sampleRate} Hz • ` +
            `Channels: ${metadata.channels}`));

          // Build FFmpeg args
          const args = ['-i', inputFile];
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
            m4a: 'aac',
            flac: 'flac',
            wav: 'pcm_s16le',
            ogg: 'libvorbis',
            opus: 'libopus',
          };
          const codec = options.codec || (options.format && codecMap[options.format]);
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

          // Dry run
          if (options.dryRun) {
            console.log(chalk.yellow('\n[DRY RUN] Would execute:'));
            console.log(chalk.dim(`ffmpeg ${args.join(' ')}`));
            continue;
          };


          // Execute conversion
          const spinner = ora('Converting...').start();

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

            spinner.succeed(chalk.green('Conversion complete'));
            console.log(chalk.green(`✓ Output: ${outputFile}`));
            console.log(chalk.dim(`Size: ${formatFileSize(inputStat.size)} → ${formatFileSize(outputStat.size)}`));
          } catch (error) {
            spinner.fail(chalk.red('Conversion failed'));
            throw error;
          }
        }

        if (inputPaths.length > 1) {
          console.log(chalk.green(`\n✓ Converted ${inputPaths.length} files successfully`));
        }

      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
