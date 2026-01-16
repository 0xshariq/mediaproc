import type { Command } from 'commander';
import chalk from 'chalk';
import { stat } from 'fs/promises';
import ora from 'ora';
import {
  runFFmpeg,
  getVideoMetadata,
  checkFFmpeg,
  formatFileSize,
} from '../utils/ffmpeg.js';
import { parseInputPaths, resolveOutputPaths, createStandardHelp, showPluginBranding } from '@mediaproc/core';
import { logFFmpegOutput } from '../utils/ffmpegLogger.js';

export function compressCommand(videoCmd: Command): void {
  videoCmd
    .command('compress [input]')
    .description('Compress video files to reduce file size while maintaining quality')
    .option('-o, --output <path>', 'Output file or directory path')
    .option('-q, --quality <quality>', 'Quality preset: low, medium, high, extreme (default: medium)', 'medium')
    .option('-c, --codec <codec>', 'Video codec: h264, h265, vp9, av1 (default: h264)', 'h264')
    .option('--crf <crf>', 'CRF value (0-51, lower=better quality)', parseInt)
    .option('--preset <preset>', 'Encoding preset: ultrafast, fast, medium, slow, veryslow (default: medium)', 'medium')
    .option('-b, --bitrate <bitrate>', 'Target bitrate (e.g., 2M, 5M)')
    .option('--min-bitrate <bitrate>', 'Minimum bitrate (e.g., 1M)')
    .option('--max-bitrate <bitrate>', 'Maximum bitrate (e.g., 8M)')
    .option('--audio-bitrate <bitrate>', 'Audio bitrate (default: 128k)', '128k')
    .option('--audio-codec <codec>', 'Audio codec: aac, mp3, opus (default: aac)', 'aac')
    .option('--format <format>', 'Output format: mp4, mkv, webm (default: mp4)', 'mp4')
    .option('--optimize-for <target>', 'Optimize for: web, streaming, archive, mobile')
    .option('--resize <scale>', 'Also resize during compression (e.g., 720p, 1080p)')
    .option('--threads <n>', 'Number of threads for encoding (default: auto)', parseInt)
    .option('--hw-accel', 'Enable hardware acceleration (GPU)')
    .option('--strip-metadata', 'Remove all metadata from output')
    .option('--two-pass', 'Use two-pass encoding for better quality')
    .option('--dry-run', 'Preview command without executing')
    .option('-v, --verbose', 'Show detailed FFmpeg output')
    .option('--explain', 'Explain the proper flow of this command in detail (Coming Soon...)')
    .option('-h, --help', 'Display help for compress command')
    .action(async (input: string | undefined, options: any) => {
      // Show help if requested (before input validation)
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'compress',
          emoji: '🗜️',
          description: 'Compress video files to reduce file size while maintaining visual quality. Uses modern codecs and smart compression techniques to achieve optimal file sizes. Can process single files or entire directories.',
          usage: [
            'compress <input> [options]',
            'compress video.mp4 -q medium',
            'compress videos/ -q high -o compressed/'
          ],
          options: [
            { flag: '-o, --output <path>', description: 'Output file/directory (default: <input>-compressed.<ext>)' },
            { flag: '-q, --quality <quality>', description: 'Preset: low, medium, high, extreme (default: medium)' },
            { flag: '-c, --codec <codec>', description: 'Codec: h264, h265 (HEVC), vp9, av1 (default: h264)' },
            { flag: '--crf <crf>', description: 'CRF value 0-51, lower=better (overrides quality preset)' },
            { flag: '--preset <preset>', description: 'Encoding: ultrafast, fast, medium, slow, veryslow' },
            { flag: '-b, --bitrate <bitrate>', description: 'Target bitrate (e.g., 2M, 5M)' },
            { flag: '--min-bitrate <bitrate>', description: 'Minimum bitrate (e.g., 1M)' },
            { flag: '--max-bitrate <bitrate>', description: 'Maximum bitrate (e.g., 8M)' },
            { flag: '--audio-bitrate <bitrate>', description: 'Audio bitrate (default: 128k)' },
            { flag: '--audio-codec <codec>', description: 'Audio codec: aac, mp3, opus (default: aac)' },
            { flag: '--format <format>', description: 'Output format: mp4, mkv, webm (default: mp4)' },
            { flag: '--optimize-for <target>', description: 'Optimize for: web, streaming, archive, mobile' },
            { flag: '--resize <scale>', description: 'Also resize during compression (e.g., 720p, 1080p)' },
            { flag: '--threads <n>', description: 'Number of threads for encoding (default: auto)' },
            { flag: '--hw-accel', description: 'Enable hardware acceleration (GPU)' },
            { flag: '--strip-metadata', description: 'Remove all metadata from output' },
            { flag: '--two-pass', description: 'Enable two-pass encoding for better quality' },
            { flag: '--dry-run', description: 'Preview FFmpeg command without executing' },
            { flag: '--explain', description: 'Explain what is happening behind the scene in proper flow and in detail (Coming Soon...)' },
            { flag: '-v, --verbose', description: 'Show detailed FFmpeg output' }
          ],
          examples: [
            { command: 'compress video.mp4', description: 'Compress with default medium quality' },
            { command: 'compress video.mp4 -q high -c h265', description: 'High quality compression with HEVC' },
            { command: 'compress large.mp4 -q extreme --preset slow', description: 'Maximum compression with slow encoding' },
            { command: 'compress videos/ -q medium -o output/', description: 'Compress all videos in folder' },
            { command: 'compress video.mp4 -c av1 --two-pass', description: 'Use AV1 codec with two-pass encoding' },
            { command: 'compress video.mp4 -b 2M --audio-bitrate 96k', description: 'Compress to specific bitrates' }
          ],
          additionalSections: [
            {
              title: 'Quality Presets',
              items: [
                'low - CRF 28, ~60% size reduction, noticeable quality loss',
                'medium - CRF 23, ~40% size reduction, minimal quality loss',
                'high - CRF 20, ~30% size reduction, near-identical quality',
                'extreme - CRF 18, ~20% size reduction, visually lossless'
              ]
            },
            {
              title: 'Codec Recommendations',
              items: [
                'h264 - Best compatibility, fast, good compression',
                'h265 - 50% better compression than h264, slower',
                'vp9 - Good for web, free codec, similar to h265',
                'av1 - Best compression, very slow, future-proof'
              ]
            }
          ],
          tips: [
            'Use h265 for best quality-to-size ratio with good compatibility',
            'Two-pass encoding produces better quality but takes twice as long',
            'For folder compression, all videos will use the same settings',
            'Use --dry-run to preview the compression settings before processing'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Processing compression...').start();

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

        // Resolve output paths
        const outputPaths = resolveOutputPaths(inputFiles, options.output, {
          suffix: '-compressed',
          newExtension: `.${options.format || 'mp4'}`
        });

        // Determine CRF based on quality preset
        const qualityCRF: Record<string, number> = {
          low: 28,
          medium: 23,
          high: 20,
          extreme: 18,
        };
        const quality = options.quality || 'medium';
        const crf = options.crf ?? qualityCRF[quality] ?? 23;

        // Codec mapping
        const codecMap: Record<string, string> = {
          'h264': 'libx264',
          'h265': 'libx265',
          'hevc': 'libx265',
          'vp9': 'libvpx-vp9',
          'av1': 'libaom-av1',
        };
        const codec = codecMap[options.codec] || 'libx264';

        // Process each file
        for (let i = 0; i < inputFiles.length; i++) {
          const inputFile = inputFiles[i];
          const outputFile = outputPaths.get(inputFile)!;

          spinner.text = `Processing ${i + 1}/${inputFiles.length}: ${inputFile}`;

          // Get input metadata
          const metadata = await getVideoMetadata(inputFile);
          const inputStat = await stat(inputFile);

          if (options.verbose) {
            console.log(chalk.dim(`  Duration: ${metadata.duration}s, Resolution: ${metadata.width}x${metadata.height}`));
          }

          // Build ffmpeg arguments
          const args = ['-i', inputFile];

          // Video codec settings
          args.push('-c:v', codec);

          if (options.bitrate) {
            args.push('-b:v', options.bitrate);
          } else {
            args.push('-crf', crf.toString());
          }

          args.push('-preset', options.preset || 'medium');

          // Audio settings
          args.push('-c:a', 'aac', '-b:a', options.audioBitrate || '128k');

          // Output file
          args.push('-y', outputFile);

          // Show command if dry-run
          if (options.dryRun) {
            console.log(chalk.cyan('\nFFmpeg command:'));
            console.log(chalk.gray('ffmpeg ' + args.join(' ')));
            console.log();
            continue;
          }
          if (options.explain) {
            console.log(chalk.gray('Explain mode is not yet available.'))
            console.log(chalk.cyan('Planned for v0.8.x.'))
          }

          // Run compression
          await runFFmpeg(args, options.verbose, (line) => {
            if (options.verbose) {
              logFFmpegOutput(line);
            }
          });

          // Get output file size
          const outputStat = await stat(outputFile);
          const reduction = ((1 - outputStat.size / inputStat.size) * 100).toFixed(1);

          spinner.succeed(
            chalk.green(
              `✓ [${i + 1}/${inputFiles.length}] Compressed ${formatFileSize(inputStat.size)} → ${formatFileSize(outputStat.size)} (${reduction}% reduction)\n` +
              chalk.dim(`   ${outputFile}`)
            )
          );
        }

        if (!options.dryRun) {
          console.log(chalk.green.bold(`\n✨ Successfully compressed ${inputFiles.length} video(s)!`));
          showPluginBranding('Video', '../../package.json');
        }
      } catch (error) {
        spinner.fail(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
