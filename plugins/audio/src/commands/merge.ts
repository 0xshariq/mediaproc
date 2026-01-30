import type { Command } from 'commander';
import chalk from 'chalk';
import { stat, writeFile, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { runFFmpeg, getAudioMetadata, checkFFmpeg, formatFileSize, formatDuration } from '../utils/ffmpeg.js';
import { styleFFmpegOutput, shouldDisplayLine } from '../utils/ffmpeg-output.js';
import { AUDIO_EXTENSIONS, validatePaths, createStandardHelp } from '@mediaproc/core';
import ora from 'ora';
import { MergeOptions } from '../types.js';

export function mergeCommand(audioCmd: Command): void {
  audioCmd
    .command('merge [inputs...]')
    .description('Merge multiple audio files into one')
    .option('-o, --output <path>', 'Output file path (must include extension)', 'merged.mp3')
    .option('--format <format>', 'Output format: mp3, aac, wav, flac, ogg', 'mp3')
    .option('--codec <codec>', 'Specify output audio codec (overrides default for format)')
    .option('--bitrate <bitrate>', 'Output bitrate (e.g., 192k, 320k)', '192k')
    .option('--crossfade <seconds>', 'Crossfade duration between files (seconds)', parseFloat)
    .option('--normalize', 'Normalize audio levels before merging')
    .option('--fade-in <seconds>', 'Add fade-in effect (seconds)', parseFloat)
    .option('--fade-out <seconds>', 'Add fade-out effect (seconds)', parseFloat)
    .option('--remove-silence', 'Remove silence between tracks')
    .option('--metadata <key=value>', 'Set custom metadata (repeatable)', (val: string, acc: string[] = []) => { acc.push(val); return acc; }, [] as string[])
    .option('--dry-run', 'Preview command without executing')
    .option('-v, --verbose', 'Show detailed FFmpeg output')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('-h, --help', 'Display help for merge command')
    .action(async (inputs: string[] | undefined, options: MergeOptions) => {
      if (options.help || !inputs || inputs.length === 0) {
        createStandardHelp({
          commandName: 'merge',
          emoji: '🔗',
          description: 'Concatenate multiple audio files into a single output file. Supports crossfade transitions and automatic audio normalization.',
          usage: [
            'merge <input1> <input2> [input3...] [options]',
            'merge audio1.mp3 audio2.mp3',
            'merge part*.mp3 -o complete.mp3'
          ],
          options: [
            { flag: '-o, --output <path>', description: 'Output file path (default: merged.mp3)' },
            { flag: '--format <format>', description: 'Output format: mp3, aac, wav, flac, ogg (default: mp3)' },
            { flag: '--bitrate <bitrate>', description: 'Output bitrate: 128k, 192k, 256k, 320k (default: 192k)' },
            { flag: '--crossfade <seconds>', description: 'Crossfade duration between files in seconds (0-10)' },
            { flag: '--normalize', description: 'Normalize audio levels before merging for consistent volume' },
            { flag: '--dry-run', description: 'Preview FFmpeg command without executing' },
            { flag: '--explain [mode]', description: 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.' },
            { flag: '-v, --verbose', description: 'Show detailed FFmpeg output and progress' }
          ],
          examples: [
            { command: 'merge audio1.mp3 audio2.mp3 audio3.mp3', description: 'Merge three files' },
            { command: 'merge part*.mp3 -o complete.mp3', description: 'Merge all matching files' },
            { command: 'merge a.mp3 b.mp3 --crossfade 2', description: 'Merge with 2-second crossfade' },
            { command: 'merge *.wav -o output.flac --format flac', description: 'Merge WAVs to FLAC' },
            { command: 'merge a.mp3 b.mp3 --normalize', description: 'Normalize before merging' }
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

        if (inputs.length < 2) {
          console.error(chalk.red('\n✗ Error: At least 2 audio files required for merging'));
          process.exit(1);
        }
        // Require output file with extension and not a directory
        if (!options.output || !/\.[a-zA-Z0-9]+$/.test(options.output)) {
          console.error(chalk.red('\n✗ Error: Output file must include a valid extension (e.g., .mp3, .wav, .flac) and not be a directory.'));
          process.exit(1);
        }
        // Defensive: check if outputPath is a directory (should not be, but extra guard)
        try {
          const outStat = await stat(options.output);
          if (outStat.isDirectory()) {
            console.error(chalk.red('\n✗ Error: Output path must be a file, not a directory.'));
            process.exit(1);
          }
        } catch (e) {
          // If stat fails, assume it's a new file (ok)
        }

        console.log(chalk.blue(`\n🔗 Merging ${inputs.length} audio files...`));

        // Validate all input files
        // Use pathValidator for all input/output logic
        const { inputFiles, outputPath, errors } = validatePaths(inputs.join(','), options.output, { allowedExtensions: AUDIO_EXTENSIONS });
        if (errors.length > 0) {
          errors.forEach(e => console.error(chalk.red(e)));
          process.exit(1);
        }
        if (inputFiles.length < 2) {
          console.error(chalk.red('\n✗ Error: Not enough valid audio files found'));
          process.exit(1);
        }
        // Show input files
        let totalDuration = 0;
        for (const inputFile of inputFiles) {
          const metadata = await getAudioMetadata(inputFile);
          console.log(chalk.dim(`  ${inputFile} (${formatDuration(metadata.duration)})`));
          totalDuration += metadata.duration;
        }
        console.log(chalk.dim(`\nTotal duration: ${formatDuration(totalDuration)}`));
        // Create concat file list
        const concatFile = join(dirname(inputFiles[0]), '.concat-list.txt');
        const concatContent = inputFiles.map(f => `file '${f}'`).join('\n');
        await writeFile(concatFile, concatContent);

        const args = ['-f', 'concat', '-safe', '0', '-i', concatFile, '-y'];

        // Output format/codec selection
        const format = options.format || (outputPath && outputPath.match(/\.([a-zA-Z0-9]+)$/)?.[1].toLowerCase()) || 'mp3';
        const codecMap: Record<string, string> = {
          mp3: 'libmp3lame',
          aac: 'aac',
          flac: 'flac',
          wav: 'pcm_s16le',
          ogg: 'libvorbis',
        };
        let codec = options.codec || codecMap[format as keyof typeof codecMap] || 'libmp3lame';
        if (codec) args.push('-c:a', codec);
        if (options.bitrate) args.push('-b:a', options.bitrate);

        // Audio filter chain
        let filterChain = '';
        // Crossfade
        if (options.crossfade) {
          const filterParts: string[] = [];
          for (let i = 0; i < inputFiles.length - 1; i++) {
            if (i === 0) {
              filterParts.push(`[0:a][1:a]acrossfade=d=${options.crossfade}[a01]`);
            } else {
              filterParts.push(`[a0${i}][${i + 1}:a]acrossfade=d=${options.crossfade}[a0${i + 1}]`);
            }
          }
          args.push('-filter_complex', filterParts.join(';'));
          args.push('-map', `[a0${inputFiles.length - 1}]`);
        }
        // Normalization (if not crossfade)
        if (options.normalize && !options.crossfade) {
          filterChain += (filterChain ? ',' : '') + 'loudnorm=I=-16:TP=-1.5:LRA=11';
        }
        // Fade in/out
        if (options.fadeIn) {
          filterChain += (filterChain ? ',' : '') + `afade=t=in:st=0:d=${options.fadeIn}`;
        }
        if (options.fadeOut && totalDuration) {
          const fadeStart = totalDuration - options.fadeOut;
          filterChain += (filterChain ? ',' : '') + `afade=t=out:st=${fadeStart}:d=${options.fadeOut}`;
        }
        // Silence removal
        if (options.removeSilence) {
          filterChain += (filterChain ? ',' : '') + 'silenceremove=start_periods=1:start_silence=0.1:start_threshold=-50dB';
        }
        if (filterChain && !options.crossfade) {
          args.push('-af', filterChain);
        }
        // Metadata
        if (options.metadata && Array.isArray(options.metadata)) {
          for (const entry of options.metadata) {
            const [key, value] = entry.split('=');
            if (key && value) args.push('-metadata', `${key}=${value}`);
          }
        }
        // Output file
        if (outputPath) {
          args.push(outputPath);
        }

        if (options.dryRun) {
          console.log(chalk.yellow('\n[DRY RUN] Would execute:'));
          console.log(chalk.dim(`ffmpeg ${args.join(' ')}`));
          await unlink(concatFile);
          return;
        }

        const spinner = ora('Merging audio files...').start();

        try {
          await runFFmpeg(
            args,
            options.verbose,
            (line: string) => {
              if (shouldDisplayLine(line, options.verbose ?? false)) {
                console.log(styleFFmpegOutput(line));
              }
            }
          );
          let outputStat;
          if (outputPath) {
            outputStat = await stat(outputPath);
          }

          // Clean up concat file
          await unlink(concatFile);

          spinner.succeed(chalk.green('Merge complete'));
          if (outputPath) {
            console.log(chalk.green(`✓ Output: ${outputPath}`));
            if (outputStat) {
              console.log(chalk.dim(`Duration: ${formatDuration(totalDuration)} • Size: ${formatFileSize(outputStat.size)}`));
            }
          }
        } catch (error) {
          await unlink(concatFile).catch(() => { });
          spinner.fail(chalk.red('Merge failed'));
          // Enhanced error reporting for common ffmpeg concat/decoder issues
          const errObj = error as any;
          const errMsg = (errObj && errObj.message) ? errObj.message : String(error);
          if (/Invalid data found when processing input|Error submitting packet to decoder/i.test(errMsg)) {
            console.error(chalk.yellow('\n⚠️  One or more input files may be corrupted, incompatible, or not suitable for merging.'));
            console.error(chalk.yellow('Please ensure all input files are valid, have the same codec/sample rate/channels, and are not damaged.'));
          } else if (/Unable to choose an output format|Invalid argument|Error opening output file/i.test(errMsg)) {
            console.error(chalk.yellow('\n⚠️  Output path or format may be invalid. Make sure the output file has a valid extension and is not a directory.'));
          }
          throw error;
        }
      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
