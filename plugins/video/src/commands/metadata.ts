import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import { validatePaths, createStandardHelp, VIDEO_EXTENSIONS } from '@mediaproc/core';
import { checkFFmpeg } from '../utils/ffmpeg.js';
import { writeFile } from 'fs/promises';

interface MetadataOptions {
  json?: boolean;
  output?: string;
  verbose?: boolean;
  help?: boolean;
}

interface ComprehensiveMetadata {
  file: string;
  format: {
    filename: string;
    format_name: string;
    format_long_name: string;
    duration: number;
    size: number;
    bit_rate: number;
    tags?: Record<string, any>;
  };
  streams: Array<{
    index: number;
    codec_name: string;
    codec_long_name: string;
    codec_type: string;
    codec_tag_string: string;
    width?: number;
    height?: number;
    bit_rate?: number;
    sample_rate?: number;
    channels?: number;
    channel_layout?: string;
    duration?: number;
    avg_frame_rate?: string;
    r_frame_rate?: string;
    time_base?: string;
    display_aspect_ratio?: string;
    sample_aspect_ratio?: string;
    pix_fmt?: string;
    profile?: string;
    level?: number;
    tags?: Record<string, any>;
  }>;
  chapters?: Array<{
    id: number;
    time_base: string;
    start: number;
    end: number;
    tags?: Record<string, any>;
  }>;
}

export function metadataCommand(videoCmd: Command): void {
  videoCmd
    .command('metadata <input>')
    .description('Display comprehensive metadata of video file(s)')
    .option('--json', 'Export metadata in JSON format')
    .option('-o, --output <path>', 'Output file path for JSON export (only with --json)')
    .option('-v, --verbose', 'Show all technical details')
    .option('-h, --help', 'Display help for metadata command')
    .action(async (input: string, options: MetadataOptions) => {
      if (options.help || !input) {
        createStandardHelp({
          commandName: 'metadata',
          emoji: '📊',
          description: 'Display comprehensive metadata information about video files. Shows format details, streams (video/audio/subtitle), codecs, bitrates, durations, dimensions, and more. Export to JSON for programmatic use.',
          usage: [
            'metadata <input>',
            'metadata video.mp4',
            'metadata video.mp4 --json',
            'metadata videos/ --json -o metadata.json'
          ],
          options: [
            { flag: '--json', description: 'Export metadata in JSON format' },
            { flag: '-o, --output <path>', description: 'Output file path for JSON export (only with --json)' },
            { flag: '-v, --verbose', description: 'Show all technical details' },
            { flag: '-h, --help', description: 'Display help for metadata command' }
          ],
          examples: [
            { command: 'metadata video.mp4', description: 'Display metadata in human-readable format' },
            { command: 'metadata video.mp4 --json', description: 'Display metadata in JSON format' },
            { command: 'metadata video.mp4 --json -o meta.json', description: 'Export metadata to JSON file' },
            { command: 'metadata videos/', description: 'Show metadata for all videos in directory' },
            { command: 'metadata video.mp4 -v', description: 'Show verbose technical details' }
          ],
          additionalSections: [
            {
              title: 'Metadata Information',
              items: [
                'Format details: container format, duration, bitrate, file size',
                'Video streams: codec, resolution, frame rate, pixel format, aspect ratio',
                'Audio streams: codec, sample rate, channels, bitrate',
                'Subtitle streams: format and language',
                'Chapters and metadata tags'
              ]
            }
          ],
          tips: [
            'Use --json for programmatic access to metadata',
            'Export to file with -o flag for batch processing',
            'Process multiple files at once with directory input',
            'Use -v flag to see all available technical details'
          ]
        });
        process.exit(0);
      }

      const spinner = ora('Processing metadata...').start();

      try {
        // Check ffmpeg/ffprobe
        const ffmpegAvailable = await checkFFmpeg(true);
        if (!ffmpegAvailable) {
          spinner.fail(chalk.red('ffmpeg/ffprobe is not installed or not in PATH'));
          process.exit(1);
        }

        // Validate input paths
        const { inputFiles, errors } = validatePaths(input, undefined, {
          allowedExtensions: VIDEO_EXTENSIONS,
        });

        if (errors.length > 0) {
          spinner.fail(chalk.red(errors.join('\n')));
          process.exit(1);
        }

        if (inputFiles.length === 0) {
          spinner.fail(chalk.red('No valid video files found'));
          process.exit(1);
        }

        spinner.succeed(chalk.green(`Found ${inputFiles.length} video file(s)`));

        const allMetadata: ComprehensiveMetadata[] = [];

        for (const inputFile of inputFiles) {
          const fileSpinner = ora(chalk.cyan(`Analyzing ${inputFile}...`)).start();

          try {
            const metadata = await getComprehensiveMetadata(inputFile);
            allMetadata.push(metadata);

            if (options.json) {
              fileSpinner.succeed(chalk.green(`✓ Analyzed ${inputFile}`));
            } else {
              fileSpinner.succeed();
              displayHumanReadableMetadata(metadata, options.verbose || false);
            }
          } catch (err: any) {
            fileSpinner.fail(chalk.red(`Failed to analyze ${inputFile}: ${err.message}`));
          }
        }

        // JSON output
        if (options.json) {
          const jsonOutput = JSON.stringify(allMetadata.length === 1 ? allMetadata[0] : allMetadata, null, 2);
          
          if (options.output) {
            await writeFile(options.output, jsonOutput, 'utf-8');
            console.log(chalk.green(`\n✓ Metadata exported to ${options.output}`));
          } else {
            console.log(chalk.cyan('\n📊 Metadata (JSON):\n'));
            console.log(jsonOutput);
          }
        }

        console.log(chalk.green.bold(`\n✨ Successfully analyzed ${inputFiles.length} video file(s)!`));
      } catch (error) {
        spinner.fail(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}

async function getComprehensiveMetadata(inputFile: string): Promise<ComprehensiveMetadata> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      '-show_chapters',
      inputFile,
    ]);

    let stdout = '';
    let stderr = '';

    ffprobe.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed: ${stderr}`));
        return;
      }

      try {
        const data = JSON.parse(stdout);
        const metadata: ComprehensiveMetadata = {
          file: inputFile,
          format: {
            filename: data.format.filename || inputFile,
            format_name: data.format.format_name || 'unknown',
            format_long_name: data.format.format_long_name || 'unknown',
            duration: parseFloat(data.format.duration) || 0,
            size: parseInt(data.format.size) || 0,
            bit_rate: parseInt(data.format.bit_rate) || 0,
            tags: data.format.tags || {},
          },
          streams: data.streams.map((stream: any) => ({
            index: stream.index,
            codec_name: stream.codec_name || 'unknown',
            codec_long_name: stream.codec_long_name || 'unknown',
            codec_type: stream.codec_type || 'unknown',
            codec_tag_string: stream.codec_tag_string || '',
            width: stream.width,
            height: stream.height,
            bit_rate: stream.bit_rate ? parseInt(stream.bit_rate) : undefined,
            sample_rate: stream.sample_rate,
            channels: stream.channels,
            channel_layout: stream.channel_layout,
            duration: stream.duration ? parseFloat(stream.duration) : undefined,
            avg_frame_rate: stream.avg_frame_rate,
            r_frame_rate: stream.r_frame_rate,
            time_base: stream.time_base,
            display_aspect_ratio: stream.display_aspect_ratio,
            sample_aspect_ratio: stream.sample_aspect_ratio,
            pix_fmt: stream.pix_fmt,
            profile: stream.profile,
            level: stream.level,
            tags: stream.tags || {},
          })),
          chapters: data.chapters || [],
        };

        resolve(metadata);
      } catch (error) {
        reject(new Error(`Failed to parse ffprobe output: ${(error as Error).message}`));
      }
    });

    // Handle spawn error to prevent memory leaks
    ffprobe.on('error', (error) => {
      reject(new Error(`Failed to start ffprobe: ${error.message}`));
    });
  });
}

function displayHumanReadableMetadata(metadata: ComprehensiveMetadata, verbose: boolean): void {
  console.log(chalk.cyan.bold(`\n📊 Metadata for: ${chalk.white(metadata.file)}`));
  console.log(chalk.gray('═'.repeat(80)));

  // Format Information
  console.log(chalk.yellow.bold('\n📦 Format Information:'));
  console.log(chalk.gray(`  Format: ${metadata.format.format_long_name} (${metadata.format.format_name})`));
  console.log(chalk.gray(`  Duration: ${formatDuration(metadata.format.duration)}`));
  console.log(chalk.gray(`  File Size: ${formatFileSize(metadata.format.size)}`));
  console.log(chalk.gray(`  Bitrate: ${formatBitrate(metadata.format.bit_rate)}`));

  if (verbose && Object.keys(metadata.format.tags || {}).length > 0) {
    console.log(chalk.yellow('\n  Tags:'));
    Object.entries(metadata.format.tags || {}).forEach(([key, value]) => {
      console.log(chalk.gray(`    ${key}: ${value}`));
    });
  }

  // Streams
  const videoStreams = metadata.streams.filter(s => s.codec_type === 'video');
  const audioStreams = metadata.streams.filter(s => s.codec_type === 'audio');
  const subtitleStreams = metadata.streams.filter(s => s.codec_type === 'subtitle');

  // Video Streams
  if (videoStreams.length > 0) {
    console.log(chalk.yellow.bold('\n🎬 Video Streams:'));
    videoStreams.forEach((stream, idx) => {
      console.log(chalk.cyan(`  Stream #${stream.index} (Video ${idx + 1}):`));
      console.log(chalk.gray(`    Codec: ${stream.codec_long_name} (${stream.codec_name})`));
      if (stream.width && stream.height) {
        console.log(chalk.gray(`    Resolution: ${stream.width}x${stream.height}`));
      }
      if (stream.display_aspect_ratio) {
        console.log(chalk.gray(`    Aspect Ratio: ${stream.display_aspect_ratio}`));
      }
      if (stream.avg_frame_rate) {
        const fps = eval(stream.avg_frame_rate);
        console.log(chalk.gray(`    Frame Rate: ${fps.toFixed(2)} fps`));
      }
      if (stream.pix_fmt) {
        console.log(chalk.gray(`    Pixel Format: ${stream.pix_fmt}`));
      }
      if (stream.bit_rate) {
        console.log(chalk.gray(`    Bitrate: ${formatBitrate(stream.bit_rate)}`));
      }
      if (verbose && stream.profile) {
        console.log(chalk.gray(`    Profile: ${stream.profile}`));
      }
      if (verbose && stream.level) {
        console.log(chalk.gray(`    Level: ${stream.level}`));
      }
    });
  }

  // Audio Streams
  if (audioStreams.length > 0) {
    console.log(chalk.yellow.bold('\n🎵 Audio Streams:'));
    audioStreams.forEach((stream, idx) => {
      console.log(chalk.cyan(`  Stream #${stream.index} (Audio ${idx + 1}):`));
      console.log(chalk.gray(`    Codec: ${stream.codec_long_name} (${stream.codec_name})`));
      if (stream.sample_rate) {
        console.log(chalk.gray(`    Sample Rate: ${stream.sample_rate} Hz`));
      }
      if (stream.channels) {
        console.log(chalk.gray(`    Channels: ${stream.channels} (${stream.channel_layout || 'unknown'})`));
      }
      if (stream.bit_rate) {
        console.log(chalk.gray(`    Bitrate: ${formatBitrate(stream.bit_rate)}`));
      }
      if (verbose && Object.keys(stream.tags || {}).length > 0) {
        console.log(chalk.gray('    Tags:'));
        Object.entries(stream.tags || {}).forEach(([key, value]) => {
          console.log(chalk.gray(`      ${key}: ${value}`));
        });
      }
    });
  }

  // Subtitle Streams
  if (subtitleStreams.length > 0) {
    console.log(chalk.yellow.bold('\n💬 Subtitle Streams:'));
    subtitleStreams.forEach((stream, idx) => {
      console.log(chalk.cyan(`  Stream #${stream.index} (Subtitle ${idx + 1}):`));
      console.log(chalk.gray(`    Codec: ${stream.codec_long_name} (${stream.codec_name})`));
      if (stream.tags?.language) {
        console.log(chalk.gray(`    Language: ${stream.tags.language}`));
      }
    });
  }

  // Chapters
  if (metadata.chapters && metadata.chapters.length > 0) {
    console.log(chalk.yellow.bold('\n📑 Chapters:'));
    metadata.chapters.forEach((chapter, idx) => {
      const title = chapter.tags?.title || `Chapter ${idx + 1}`;
      console.log(chalk.cyan(`  ${title}`));
      console.log(chalk.gray(`    Start: ${formatDuration(chapter.start)} | End: ${formatDuration(chapter.end)}`));
    });
  }

  console.log(chalk.gray('\n' + '═'.repeat(80)));
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatBitrate(bitrate: number): string {
  if (bitrate === 0) return 'unknown';
  const kbps = bitrate / 1000;
  if (kbps >= 1000) {
    return `${(kbps / 1000).toFixed(2)} Mbps`;
  }
  return `${Math.round(kbps)} kbps`;
}
