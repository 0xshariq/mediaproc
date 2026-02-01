import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile, unlink, stat } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  runFFmpeg,
  getVideoMetadata,
  getStreamInfo,
  checkFFmpeg,
  formatFileSize,
  formatDuration,
} from '../utils/ffmpeg.js';
import { fileExists, resolveOutputPaths, createStandardHelp, VIDEO_EXTENSIONS } from '@mediaproc/core';
import { validatePaths } from '@mediaproc/core';
import { logFFmpegOutput } from '../utils/ffmpegLogger.js';
import { MergeOptions } from '../types.js';

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
    .action(async (inputs: string[], options: MergeOptions) => {
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
        if (!inputs || inputs.length < 2) {
          spinner.fail(chalk.red('At least 2 videos are required for merging'));
          process.exit(1);
        }

        // Centralized input validation using pathValidator
        const { inputFiles, errors } = validatePaths(inputs.join(','), undefined, { allowedExtensions: VIDEO_EXTENSIONS });
        if (errors.length > 0) {
          spinner.fail(chalk.red(errors.join('\n')));
          process.exit(1);
        }
        if (inputFiles.length < 2) {
          spinner.fail(chalk.red('At least 2 valid video files are required for merging'));
          process.exit(1);
        }

        // Check ffmpeg
        const ffmpegAvailable = await checkFFmpeg();
        if (!ffmpegAvailable) {
          spinner.fail(chalk.red('ffmpeg is not installed or not in PATH'));
          process.exit(1);
        }

        spinner.text = 'Analyzing videos...';
        const metadataList: any[] = [];
        const validInputFiles: string[] = [];  // Track only valid files
        const audioStreamInfo: boolean[] = [];  // Track which files have audio
        let totalDuration = 0;
        let totalSize = 0;

        for (let i = 0; i < inputFiles.length; i++) {
          const inputPath = inputFiles[i];
          let metadata;
          let streamInfo;
          try {
            metadata = await getVideoMetadata(inputPath);
            streamInfo = await getStreamInfo(inputPath);
          } catch (metaErr: any) {
            // Make ffprobe failures non-fatal warnings
            console.log(chalk.yellow('\u26a0\ufe0f  Warning:'), `ffprobe failed for ${inputPath}`);
            console.log(chalk.dim(metaErr.message || String(metaErr)));
            console.log(chalk.yellow('This may be due to an unsupported format, incomplete file, or codec issue.'));
            console.log(chalk.yellow('Skipping this file from merge...'));
            continue;
          }
          const fileStat = await stat(inputPath);
          metadataList.push(metadata);
          validInputFiles.push(inputPath);  // Only add if validation passed
          audioStreamInfo.push(streamInfo.hasAudio);  // Track audio presence
          totalDuration += metadata.duration;
          totalSize += fileStat.size;
          console.log(chalk.gray(`   ${validInputFiles.length}. ${inputPath}`));
          console.log(chalk.dim(`      ${metadata.width}x${metadata.height}, ${formatDuration(metadata.duration)}, ${metadata.codec}${streamInfo.hasAudio ? '' : ' (no audio)'}`));
        }

        // Check if we have any valid files after analysis
        if (metadataList.length === 0) {
          spinner.fail(chalk.red('No valid video files to merge'));
          process.exit(1);
        }

        if (metadataList.length < inputFiles.length) {
          console.log(chalk.yellow(`\u26a0\ufe0f  Only ${metadataList.length} of ${inputFiles.length} files are valid for merging`));
        }

        // Require at least 2 valid files to merge
        if (validInputFiles.length < 2) {
          spinner.fail(chalk.red('At least 2 valid video files are required for merging'));
          process.exit(1);
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

        // Centralized output path validation and resolution
        const outputExt = options.formats ? `.${options.formats}` : '.mp4';
        const outputValidation = validatePaths(validInputFiles[0], options.output, { allowedExtensions: VIDEO_EXTENSIONS });
        if (outputValidation.errors.length > 0) {
          spinner.fail(chalk.red(`Output path invalid: ${outputValidation.errors.join(', ')}`));
          process.exit(1);
        }
        const outputMap = resolveOutputPaths([validInputFiles[0]], options.output, { newExtension: outputExt });
        const output = outputMap.get(validInputFiles[0])!;

        // Check if output file already exists
        if (fileExists(output) && !options.dryRun) {
          console.log(chalk.yellow(`⚠️  Output file exists and will be overwritten: ${output}\n`));
        }

        let args: string[];

        if (needsReEncode) {
          // Re-encode mode: use filter_complex with conditional audio handling
          // Determine target resolution (use first video's resolution or largest resolution)
          const targetWidth = Math.max(...metadataList.map(m => m.width));
          const targetHeight = Math.max(...metadataList.map(m => m.height));
          const needsScaling = metadataList.some(m => m.width !== targetWidth || m.height !== targetHeight);
          
          if (needsScaling) {
            console.log(chalk.yellow(`⚠️  Videos have different resolutions - scaling all to ${targetWidth}x${targetHeight}`));
          }

          const hasAnyAudio = audioStreamInfo.some(hasAudio => hasAudio);

          if (hasAnyAudio) {
            // Check if all videos have audio or only some
            const allHaveAudio = audioStreamInfo.every(hasAudio => hasAudio);

            if (allHaveAudio) {
              // All videos have audio - use standard concat with audio and scaling
              args = [];
              validInputFiles.forEach((path: string) => {
                args.push('-i', path);
              });

              if (needsScaling) {
                // Scale videos first, then concat
                const scaleFilters = metadataList.map((_, i) => 
                  `[${i}:v]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`
                ).join(';');
                const concatInputs = metadataList.map((_, i) => `[v${i}][${i}:a]`).join('');
                const filterComplex = `${scaleFilters};${concatInputs}concat=n=${validInputFiles.length}:v=1:a=1[outv][outa]`;
                args.push('-filter_complex', filterComplex, '-map', '[outv]', '-map', '[outa]', '-c:v', 'libx264', '-crf', '23', '-c:a', 'aac', '-y', output);
              } else {
                // No scaling needed
                const filterInputs = validInputFiles.map((_: string, i: number) => `[${i}:v][${i}:a]`).join('');
                const filterComplex = `${filterInputs}concat=n=${validInputFiles.length}:v=1:a=1[outv][outa]`;
                args.push('-filter_complex', filterComplex, '-map', '[outv]', '-map', '[outa]', '-c:v', 'libx264', '-crf', '23', '-c:a', 'aac', '-y', output);
              }
            } else {
              // Mixed: some have audio, some don't - generate silent audio for videos without audio
              console.log(chalk.yellow('⚠️  Some videos have no audio - will add silent audio track'));

              args = [];
              validInputFiles.forEach((path: string) => {
                args.push('-i', path);
              });

              const filterParts: string[] = [];
              const scaleFilters: string[] = [];
              const silentFilters: string[] = [];

              // Build filters for each video
              metadataList.forEach((_, i) => {
                if (needsScaling) {
                  // Scale video
                  scaleFilters.push(`[${i}:v]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`);
                  
                  if (audioStreamInfo[i]) {
                    // Has audio - use scaled video and original audio
                    filterParts.push(`[v${i}][${i}:a]`);
                  } else {
                    // No audio - use scaled video and generate silent audio
                    silentFilters.push(`anullsrc=channel_layout=stereo:sample_rate=44100[silent${i}]`);
                    filterParts.push(`[v${i}][silent${i}]`);
                  }
                } else {
                  // No scaling needed
                  if (audioStreamInfo[i]) {
                    // Has audio - use as-is
                    filterParts.push(`[${i}:v][${i}:a]`);
                  } else {
                    // No audio - generate silent audio
                    silentFilters.push(`anullsrc=channel_layout=stereo:sample_rate=44100[silent${i}]`);
                    filterParts.push(`[${i}:v][silent${i}]`);
                  }
                }
              });

              // Combine all filters
              const allFilters = [...scaleFilters, ...silentFilters].filter(f => f.length > 0);
              const filterComplex = allFilters.length > 0
                ? `${allFilters.join(';')};${filterParts.join('')}concat=n=${validInputFiles.length}:v=1:a=1[outv][outa]`
                : `${filterParts.join('')}concat=n=${validInputFiles.length}:v=1:a=1[outv][outa]`;

              args.push('-filter_complex', filterComplex, '-map', '[outv]', '-map', '[outa]', '-c:v', 'libx264', '-crf', '23', '-c:a', 'aac', '-y', output);
            }
          } else {
            // No videos have audio - video-only concat
            console.log(chalk.yellow('⚠️  All videos have no audio - output will be video-only'));
            
            args = [];
            validInputFiles.forEach((path: string) => {
              args.push('-i', path);
            });

            if (needsScaling) {
              // Scale videos first, then concat
              const scaleFilters = metadataList.map((_, i) => 
                `[${i}:v]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`
              ).join(';');
              const concatInputs = metadataList.map((_, i) => `[v${i}]`).join('');
              const filterComplex = `${scaleFilters};${concatInputs}concat=n=${validInputFiles.length}:v=1:a=0[outv]`;
              args.push('-filter_complex', filterComplex, '-map', '[outv]', '-c:v', 'libx264', '-crf', '23', '-y', output);
            } else {
              // No scaling needed
              const filterInputs = validInputFiles.map((_: string, i: number) => `[${i}:v]`).join('');
              const filterComplex = `${filterInputs}concat=n=${validInputFiles.length}:v=1:a=0[outv]`;
              args.push('-filter_complex', filterComplex, '-map', '[outv]', '-c:v', 'libx264', '-crf', '23', '-y', output);
            }
          }
        } else {
          // Fast concat mode: use concat demuxer (no re-encode)
          // Create concat list file with ONLY valid files
          const listContent = validInputFiles.map((path: string) => `file '${path.replace(/'/g, "'\\''")}'`).join('\n');
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
        console.log(chalk.gray(`   Videos merged: ${validInputFiles.length}`));
        console.log(chalk.gray(`   Total duration: ${formatDuration(totalDuration)}`));
        console.log(chalk.gray(`   Output size: ${formatFileSize(outputStat.size)}`));
        console.log(chalk.dim(`\n   ${output}`));
      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      } finally {
        // Clean up temp file (even on error)
        try {
          await unlink(tempListFile);
        } catch {
          // Ignore cleanup errors
        }
      }
    });
}
