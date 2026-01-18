import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile, unlink, stat } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  runFFmpeg,
  getVideoMetadata,
  checkFFmpeg,
  formatFileSize,
  formatDuration,
} from '../utils/ffmpeg.js';
import { fileExists, validatePaths, resolveOutputPaths, createStandardHelp, showPluginBranding } from '@mediaproc/core';
import { logFFmpegOutput } from '../utils/ffmpegLogger.js';

export function mergeCommand(videoCmd: Command): void {
  videoCmd
    .command('merge <inputs...>')
    .description('Merge multiple video files into a single video')
    .option('-o, --output <path>', 'Output file path (default: merged.mp4)', 'merged.mp4')
    .option('--re-encode', 'Re-encode videos (slower but handles different formats/codecs)')
    .option('--transition <type>', 'Transition effect: fade, wipe, dissolve, none (default: none)', 'none')
    .option('--transition-duration <seconds>', 'Transition duration in seconds (default: 1)', parseFloat, 1)
    .option('-c, --codec <codec>', 'Video codec for re-encoding: h264, h265, vp9 (default: h264)', 'h264')
    .option('--quality <crf>', 'CRF quality if re-encoding (default: 23)', parseInt, 23)
    .option('--scale <resolution>', 'Scale all videos to same resolution (e.g., 1080p)')
    .option('--audio-track <n>', 'Select audio track from videos (1-based, default: 1)', parseInt, 1)
    .option('--audio-codec <codec>', 'Audio codec: aac, mp3, opus (default: aac)', 'aac')
    .option('--normalize-audio', 'Normalize audio levels across videos')
    .option('--format <format>', 'Output format: mp4, mkv, avi, webm (default: mp4)', 'mp4')
    .option('--dry-run', 'Preview command without executing')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('-v, --verbose', 'Show detailed FFmpeg output')
    .option('-h, --help', 'Display help for merge command')
    .action(async (inputs: string[], options: any) => {
      if (options.help || !inputs) {
        createStandardHelp({
          commandName: 'merge',
          emoji: '🔗',
          description: 'Merge multiple video files into a single video. Supports fast concatenation (same format) or re-encoding (different formats). Can merge videos from different sources with automatic format conversion.',
          usage: [
            'merge <video1> <video2> [video3...] [options]',
            'merge video1.mp4 video2.mp4 video3.mp4',
            'merge part*.mp4 -o complete.mp4'
          ],
          options: [
            { flag: '-o, --output <path>', description: 'Output file path (default: merged.mp4)' },
            { flag: '--re-encode', description: 'Re-encode videos (handles different formats/codecs)' },
            { flag: '--transition <type>', description: 'Transition effect: fade, wipe, dissolve, none (default: none)' },
            { flag: '--transition-duration <seconds>', description: 'Transition duration in seconds (default: 1)' },
            { flag: '-c, --codec <codec>', description: 'Video codec for re-encoding: h264, h265, vp9' },
            { flag: '--quality <crf>', description: 'CRF quality if re-encoding (default: 23)' },
            { flag: '--scale <resolution>', description: 'Scale all videos to same resolution (e.g., 1080p)' },
            { flag: '--audio-track <n>', description: 'Select audio track from videos (1-based, default: 1)' },
            { flag: '--audio-codec <codec>', description: 'Audio codec: aac, mp3, opus (default: aac)' },
            { flag: '--normalize-audio', description: 'Normalize audio levels across videos' },
            { flag: '--format <format>', description: 'Output format: mp4, mkv, avi, webm (default: mp4)' },
            { flag: '--dry-run', description: 'Preview FFmpeg command without executing' },
            { flag: '--explain [mode]', description: 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.' },
            { flag: '-v, --verbose', description: 'Show detailed FFmpeg output' }
          ],
          examples: [
            { command: 'merge video1.mp4 video2.mp4 video3.mp4', description: 'Merge three videos quickly (same format)' },
            { command: 'merge part1.mp4 part2.mov part3.avi --re-encode', description: 'Merge different format videos with re-encoding' },
            { command: 'merge *.mp4 -o complete.mp4', description: 'Merge all MP4 files in current directory' },
            { command: 'merge video1.mp4 video2.mp4 -c h265 --re-encode', description: 'Merge and compress with HEVC codec' },
            { command: 'merge clip*.mp4 -o final.mkv --format mkv', description: 'Merge to MKV format' }
          ],
          additionalSections: [
            {
              title: 'Merge Methods',
              items: [
                'Fast Concatenation - No re-encoding, very fast, requires same codec/format',
                'Re-encoding - Slower but handles any format/codec combination',
                'Auto Detection - Automatically chooses best method based on input files'
              ]
            },
            {
              title: 'Requirements',
              items: [
                'All videos must have the same resolution for best results',
                'Audio tracks will be merged in order',
                'At least 2 videos required for merging',
                'Videos are merged in the order specified'
              ]
            }
          ],
          tips: [
            'Use fast concatenation (no --re-encode) when all videos have same format',
            'Use --re-encode when merging different formats or codecs',
            'Sort input files numerically if using wildcards: part1, part2, etc.',
            'Check video compatibility with --dry-run before long merges'
          ]
        });
        process.exit(0);
      }
      const tempListFile = join(tmpdir(), `mediaproc-merge-${Date.now()}.txt`);
      const spinner = ora('Processing video merge...').start();

      try {
        if (inputs.length < 2) {
          spinner.fail(chalk.red('At least 2 videos are required for merging'));
          process.exit(1);
        }

        // Check ffmpeg
        const ffmpegAvailable = await checkFFmpeg();
        if (!ffmpegAvailable) {
          spinner.fail(chalk.red('ffmpeg is not installed or not in PATH'));
          process.exit(1);
        }

        spinner.text = 'Analyzing videos...';
        const inputPaths: string[] = [];
        const metadataList: any[] = [];
        let totalDuration = 0;
        let totalSize = 0;

        for (let i = 0; i < inputs.length; i++) {
          const validation = validatePaths(inputs[i], undefined);
          if (validation.errors.length > 0) {
            throw new Error(`Input ${i + 1}: ${validation.errors.join(', ')}`);
          }
          const inputPath = validation.inputFiles[0];

          // Check if input file exists
          if (!(fileExists(inputPath))) {
            throw new Error(`Input ${i + 1} does not exist: ${inputPath}`);
          }

          inputPaths.push(inputPath);

          const metadata = await getVideoMetadata(inputPath);
          const fileStat = await stat(inputPath);

          metadataList.push(metadata);
          totalDuration += metadata.duration;
          totalSize += fileStat.size;

          console.log(chalk.gray(`   ${i + 1}. ${inputs[i]}`));
          console.log(chalk.dim(`      ${metadata.width}x${metadata.height}, ${formatDuration(metadata.duration)}, ${metadata.codec}`));
        }

        console.log();
        console.log(chalk.gray(`   Total duration: ${formatDuration(totalDuration)}`));
        console.log(chalk.gray(`   Total size: ${formatFileSize(totalSize)}`));
        console.log();

        // Check if all videos have same resolution/codec
        const firstMeta = metadataList[0];
        const needsReEncode = options.reEncode || metadataList.some((m) => m.width !== firstMeta.width || m.height !== firstMeta.height || m.codec !== firstMeta.codec);

        if (needsReEncode && !options.reEncode) {
          console.log(chalk.yellow('⚠️  Videos have different formats/resolutions'));
          console.log(chalk.yellow('   Will re-encode for compatibility (slower)'));
          console.log(chalk.dim('   Use --re-encode to skip this warning\n'));
        }

        // Validate and resolve output path
        const outputValidation = validatePaths(inputPaths[0], options.output, {
          newExtension: '.mp4'
        });
        if (outputValidation.errors.length > 0) {
          throw new Error(`Output path invalid: ${outputValidation.errors.join(', ')}`);
        }

        const outputMap = resolveOutputPaths([inputPaths[0]], options.output, {
          newExtension: '.mp4'
        });
        const output = outputMap.get(inputPaths[0])!;

        // Check if output file already exists
        if (fileExists(output) && !options.dryRun) {
          console.log(chalk.yellow(`⚠️  Output file exists and will be overwritten: ${output}\n`));
        }

        let args: string[];

        if (needsReEncode) {
          // Re-encode mode: use filter_complex
          const filterInputs = inputPaths.map((_, i) => `[${i}:v][${i}:a]`).join('');
          const filterComplex = `${filterInputs}concat=n=${inputPaths.length}:v=1:a=1[outv][outa]`;

          args = [];
          inputPaths.forEach((path) => {
            args.push('-i', path);
          });
          args.push('-filter_complex', filterComplex, '-map', '[outv]', '-map', '[outa]', '-c:v', 'libx264', '-crf', '23', '-c:a', 'aac', '-y', output);
        } else {
          // Fast concat mode: use concat demuxer (no re-encode)
          // Create concat list file
          const listContent = inputPaths.map((path) => `file '${path.replace(/'/g, "'\\''")}'`).join('\n');
          await writeFile(tempListFile, listContent);

          args = ['-f', 'concat', '-safe', '0', '-i', tempListFile, '-c', 'copy', '-y', output];
        }

        if (options.dryRun) {
          console.log(chalk.yellow('🏃 Dry run mode - no files will be created\n'));
          console.log(chalk.dim('Method:'));
          console.log(chalk.gray(`   ${needsReEncode ? 'Re-encode (compatible)' : 'Fast concat (stream copy)'}`));
          console.log(chalk.dim('\nCommand:'));
          console.log(chalk.gray(`  ffmpeg ${args.join(' ')}\n`));
          console.log(chalk.green('✓ Dry run complete'));
          showPluginBranding('Video', '../../package.json');
          return;
        }

        // Run merge
        console.log(chalk.dim(`🔗 Merging videos (${needsReEncode ? 're-encoding' : 'fast mode'})...`));
        if (options.verbose) {
          console.log(chalk.dim(`ffmpeg ${args.join(' ')}\n`));
        }

        await runFFmpeg(args, options.verbose, (line) => {
          if (options.verbose) {
            logFFmpegOutput(line);
          }
        });

        // Get output file size
        const outputStat = await stat(output);

        console.log();
        console.log(chalk.green.bold('✓ Merging Complete!\n'));
        console.log(chalk.gray(`   Videos merged: ${inputs.length}`));
        console.log(chalk.gray(`   Total duration: ${formatDuration(totalDuration)}`));
        console.log(chalk.gray(`   Output size: ${formatFileSize(outputStat.size)}`));
        console.log(chalk.dim(`\n   ${output}`));
        showPluginBranding('Video', '../../package.json');
      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      } finally {
        // Clean up temp file
        try {
          await unlink(tempListFile);
        } catch {
          // Ignore cleanup errors
        }
      }
    });
}
