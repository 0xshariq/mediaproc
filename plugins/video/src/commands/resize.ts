import type { Command } from 'commander';
import chalk from 'chalk';
import { stat } from 'fs/promises';
import {
  runFFmpeg,
  getVideoMetadata,
  checkFFmpeg,
  formatFileSize,
} from '../utils/ffmpeg.js';
import { parseInputPaths, resolveOutputPaths, showPluginBranding, createStandardHelp, VIDEO_EXTENSIONS } from '@mediaproc/core';
import { logFFmpegOutput } from '../utils/ffmpegLogger.js';
import ora from 'ora';

export function resizeCommand(videoCmd: Command): void {
  videoCmd
    .command('resize [input]')
    .description('Resize video to specified resolution with quality preservation')
    .option('-s, --scale <scale>', 'Resolution: 360p, 480p, 720p, 1080p, 1440p, 2160p (4K), 4320p (8K), or WxH', '1080p')
    .option('-o, --output <path>', 'Output file or directory path')
    .option('-c, --codec <codec>', 'Video codec: h264, h265, vp9, av1 (default: h264)', 'h264')
    .option('-q, --quality <quality>', 'CRF quality: 0-51, lower is better (default: 23)', parseInt, 23)
    .option('--preset <preset>', 'Encoding preset: ultrafast, fast, medium, slow, veryslow (default: medium)', 'medium')
    .option('-b, --bitrate <bitrate>', 'Target bitrate (e.g., 5M, 10M)')
    .option('-a, --aspect <ratio>', 'Aspect ratio: 16:9, 4:3, 21:9, 1:1')
    .option('--fps <fps>', 'Output frame rate (e.g., 24, 30, 60)', parseInt)
    .option('--format <format>', 'Output format: mp4, mkv, webm, avi')
    .option('--scale-algo <algorithm>', 'Scaling algorithm: bilinear, bicubic, lanczos, spline (default: lanczos)', 'lanczos')
    .option('--deinterlace', 'Deinterlace video (for interlaced sources)')
    .option('--rotate <degrees>', 'Rotate video: 90, 180, 270 degrees', parseInt)
    .option('--flip <direction>', 'Flip video: horizontal, vertical, both')
    .option('--crop <spec>', 'Crop video (width:height:x:y or preset: 16:9, 4:3, 1:1)')
    .option('--threads <n>', 'Number of threads for encoding (default: auto)', parseInt)
    .option('--hw-accel', 'Enable hardware acceleration (GPU)')
    .option('--no-audio', 'Remove audio from output')
    .option('--explain [mode]', 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.')
    .option('--two-pass', 'Use two-pass encoding for better quality')
    .option('--dry-run', 'Preview command without executing')
    .option('-v, --verbose', 'Show detailed FFmpeg output')
    .option('-h, --help', 'Display help for resize command')
    .action(async (input: string | undefined, options: any) => {
      // Show help if requested (before input validation)
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'resize',
          emoji: '🎬',
          description: 'Resize videos to different resolutions while maintaining quality. Supports standard resolutions from 360p to 8K (4320p), custom dimensions, aspect ratios, and various codecs. Can process single files or entire directories.',
          usage: [
            'resize <input> [options]',
            'resize video.mp4 -s 1080p',
            'resize videos/ -s 4K -o output/'
          ],
          options: [
            { flag: '-s, --scale <scale>', description: 'Resolution: 360p, 480p, 720p, 1080p, 1440p, 2160p (4K), 4320p (8K), or WxH' },
            { flag: '-o, --output <path>', description: 'Output file/directory (default: <input>-resized.<ext>)' },
            { flag: '-c, --codec <codec>', description: 'Video codec: h264, h265 (HEVC), vp9, av1 (default: h264)' },
            { flag: '-q, --quality <quality>', description: 'CRF quality 0-51, lower=better (default: 23)' },
            { flag: '--preset <preset>', description: 'Encoding preset: ultrafast, fast, medium, slow, veryslow' },
            { flag: '-b, --bitrate <bitrate>', description: 'Target bitrate (e.g., 5M for 5 Mbps, 10M for 10 Mbps)' },
            { flag: '-a, --aspect <ratio>', description: 'Aspect ratio: 16:9, 4:3, 21:9, 1:1' },
            { flag: '--fps <fps>', description: 'Output frame rate (e.g., 24, 30, 60)' },
            { flag: '--format <format>', description: 'Output format: mp4, mkv, webm, avi' },
            { flag: '--scale-algo <algorithm>', description: 'Scaling algorithm: bilinear, bicubic, lanczos, spline (default: lanczos)' },
            { flag: '--deinterlace', description: 'Deinterlace video (for interlaced sources)' },
            { flag: '--rotate <degrees>', description: 'Rotate video: 90, 180, 270 degrees' },
            { flag: '--flip <direction>', description: 'Flip video: horizontal, vertical, both' },
            { flag: '--crop <spec>', description: 'Crop video (width:height:x:y or preset: 16:9, 4:3, 1:1)' },
            { flag: '--threads <n>', description: 'Number of threads for encoding (default: auto)' },
            { flag: '--hw-accel', description: 'Enable hardware acceleration (GPU)' },
            { flag: '--no-audio', description: 'Remove audio track from output' },
            { flag: '--two-pass', description: 'Enable two-pass encoding for better quality' },
            { flag: '--dry-run', description: 'Preview FFmpeg command without executing' },
            { flag: '--explain [mode]', description: 'Show a detailed explanation of what this command will do, including technical and human-readable output. Modes: human, details, json. Adds context like timestamp, user, and platform.' },
            { flag: '-v, --verbose', description: 'Show detailed FFmpeg output' }
          ],
          examples: [
            { command: 'resize video.mp4 -s 720p', description: 'Resize to 720p HD resolution' },
            { command: 'resize video.mp4 -s 4K -c h265 --preset slow', description: 'Resize to 4K using HEVC with high quality' },
            { command: 'resize video.mp4 -s 1920x1080 -a 16:9', description: 'Resize to Full HD with 16:9 aspect ratio' },
            { command: 'resize videos/ -s 1080p -o output/', description: 'Resize all videos in folder to 1080p' },
            { command: 'resize video.mp4 -s 2160p --fps 60 -b 15M', description: 'Resize to 4K at 60fps with 15Mbps bitrate' },
            { command: 'resize video.mp4 -s 8K -c av1 --two-pass', description: 'Resize to 8K using AV1 codec with two-pass encoding' }
          ],
          additionalSections: [
            {
              title: 'Supported Resolutions',
              items: [
                '360p - 640×360 (Low quality, mobile)',
                '480p - 854×480 (SD quality)',
                '720p - 1280×720 (HD ready)',
                '1080p - 1920×1080 (Full HD)',
                '1440p - 2560×1440 (2K/QHD)',
                '2160p - 3840×2160 (4K/UHD)',
                '4320p - 7680×4320 (8K/UHD)',
                'Custom - WIDTHxHEIGHT (e.g., 1920x1080)'
              ]
            },
            {
              title: 'Codec Recommendations',
              items: [
                'h264 - Best compatibility, fast encoding (recommended)',
                'h265 - 50% better compression than h264, slower encoding',
                'vp9 - WebM format, good for web streaming',
                'av1 - Best compression, very slow encoding, future-proof'
              ]
            },
            {
              title: 'Quality & Bitrate Guidelines',
              items: [
                'CRF 18-23 - High quality (default: 23)',
                'CRF 24-28 - Medium quality',
                'Bitrate: 720p=5M, 1080p=8M, 1440p=16M, 4K=35-45M, 8K=80-100M'
              ]
            }
          ],
          tips: [
            'Use --dry-run to preview the FFmpeg command before executing',
            'For folder input, all videos will be processed with same settings',
            'Two-pass encoding produces better quality but takes twice as long',
            'h265/HEVC provides better quality at lower file sizes than h264',
            'Use slow/veryslow preset for archival, fast/ultrafast for quick previews'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Initializing...').start();

      try {
        // Check ffmpeg
        spinner.text = 'Checking FFmpeg...';
        const ffmpegAvailable = await checkFFmpeg();
        if (!ffmpegAvailable) {
          throw new Error('ffmpeg is not installed or not in PATH');
        }

        // Parse input files
        spinner.text = 'Finding video files...';
        const inputFiles = parseInputPaths(input, VIDEO_EXTENSIONS);

        if (inputFiles.length === 0) {
          spinner.fail(chalk.red('No valid video files found'));
          process.exit(1);
        }

        spinner.succeed(chalk.green(`Found ${inputFiles.length} video file(s) to process`));

        // Scale mapping with 8K support
        const scaleMap: Record<string, { width: number; height: number }> = {
          '144p': { width: 256, height: 144 },
          '240p': { width: 426, height: 240 },
          '360p': { width: 640, height: 360 },
          '480p': { width: 854, height: 480 },
          '720p': { width: 1280, height: 720 },
          '1080p': { width: 1920, height: 1080 },
          '1440p': { width: 2560, height: 1440 },
          '2k': { width: 2560, height: 1440 },
          '2K': { width: 2560, height: 1440 },
          '2160p': { width: 3840, height: 2160 },
          '4k': { width: 3840, height: 2160 },
          '4K': { width: 3840, height: 2160 },
          'uhd': { width: 3840, height: 2160 },
          'UHD': { width: 3840, height: 2160 },
          '4320p': { width: 7680, height: 4320 },
          '8k': { width: 7680, height: 4320 },
          '8K': { width: 7680, height: 4320 },
        };

        // Determine target resolution
        let targetWidth: number;
        let targetHeight: number;

        if (options.scale.includes('x')) {
          // Custom dimensions like 1920x1080
          const [w, h] = options.scale.split('x').map(Number);
          targetWidth = w;
          targetHeight = h;
        } else if (scaleMap[options.scale]) {
          const preset = scaleMap[options.scale];
          targetWidth = preset.width;
          targetHeight = preset.height;
        } else {
          throw new Error(`Invalid scale: ${options.scale}. Use: 360p-8K or WIDTHxHEIGHT`);
        }

        // Ensure even dimensions
        targetWidth = Math.round(targetWidth / 2) * 2;
        targetHeight = Math.round(targetHeight / 2) * 2;

        // Codec mapping
        const codecMap: Record<string, string> = {
          'h264': 'libx264',
          'h265': 'libx265',
          'hevc': 'libx265',
          'vp9': 'libvpx-vp9',
          'av1': 'libaom-av1',
        };
        const videoCodec = codecMap[options.codec] || 'libx264';

        // Resolve output paths
        const outputPaths = resolveOutputPaths(inputFiles, options.output, {
          suffix: `-${targetWidth}x${targetHeight}`,
          newExtension: options.format ? `.${options.format}` : undefined
        });

        console.log(chalk.cyan.bold(`\n🎬 Resizing ${inputFiles.length} video(s) to ${options.scale}\n`));

        // Process each file
        for (let i = 0; i < inputFiles.length; i++) {
          const inputFile = inputFiles[i];
          const outputFile = outputPaths.get(inputFile)!;

          spinner.start(`[${i + 1}/${inputFiles.length}] Analyzing: ${inputFile}`);

          // Get metadata
          const metadata = await getVideoMetadata(inputFile);
          const inputStat = await stat(inputFile);

          // Build filter - ensure dimensions divisible by 2
          let vf = `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2`;

          if (options.aspect) {
            const [w, h] = options.aspect.split(':');
            vf += `,setdar=${w}/${h}`;
          }

          // Build FFmpeg args
          const args = ['-i', inputFile, '-vf', vf, '-c:v', videoCodec];

          // Quality/Bitrate
          if (options.bitrate) {
            args.push('-b:v', options.bitrate);
            if (options.twoPass) {
              args.push('-maxrate', options.bitrate, '-bufsize', `${parseInt(options.bitrate) * 2}`);
            }
          } else {
            args.push('-crf', options.quality.toString());
          }

          args.push('-preset', options.preset);

          // FPS
          if (options.fps) {
            args.push('-r', options.fps.toString());
          }

          // Audio
          if (options.audio === false) {
            args.push('-an');
          } else {
            args.push('-c:a', 'aac', '-b:a', '192k');
          }

          args.push('-y', outputFile);

          // Dry run
          if (options.dryRun) {
            spinner.info(chalk.yellow(`[${i + 1}/${inputFiles.length}] Dry run - would execute:`));
            console.log(chalk.dim('  ffmpeg ' + args.join(' ') + '\n'));
            continue;
          }

          // Execute
          spinner.text = `[${i + 1}/${inputFiles.length}] Resizing: ${inputFile}`;

          await runFFmpeg(args, options.verbose, (line) => {
            if (options.verbose) {
              logFFmpegOutput(line);
            }
          });

          const outputStat = await stat(outputFile);

          spinner.succeed(
            chalk.green(
              `✓ [${i + 1}/${inputFiles.length}] ${metadata.width}x${metadata.height} → ${targetWidth}x${targetHeight} | ` +
              `${formatFileSize(inputStat.size)} → ${formatFileSize(outputStat.size)} | ${chalk.cyan(outputFile)}`
            )
          );
        }

        if (!options.dryRun) {
          console.log(chalk.green.bold(`\n✨ Successfully resized ${inputFiles.length} video(s)!`));
          showPluginBranding('Video', '../../package.json');
        }
      } catch (error) {
        console.error(chalk.red(`\n✗ Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}
