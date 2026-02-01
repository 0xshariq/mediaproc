import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import { validatePaths, createStandardHelp, AUDIO_EXTENSIONS } from '@mediaproc/core';
import { checkFFmpeg } from '../utils/ffmpeg.js';
import { writeFile } from 'fs/promises';

interface MetadataOptions {
  json?: boolean;
  output?: string;
  verbose?: boolean;
  help?: boolean;
}

interface ComprehensiveAudioMetadata {
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
    bit_rate?: number;
    sample_rate?: number;
    channels?: number;
    channel_layout?: string;
    duration?: number;
    sample_fmt?: string;
    bits_per_sample?: number;
    tags?: Record<string, any>;
  }>;
}

export function metadataCommand(audioCmd: Command): void {
  audioCmd
    .command('metadata <input>')
    .description('Display comprehensive metadata of audio file(s)')
    .option('--json', 'Export metadata in JSON format')
    .option('-o, --output <path>', 'Output file path for JSON export (only with --json)')
    .option('-v, --verbose', 'Show all technical details')
    .option('-h, --help', 'Display help for metadata command')
    .action(async (input: string, options: MetadataOptions) => {
      if (options.help || !input) {
        createStandardHelp({
          pluginName: 'audio',
          commandName: 'metadata',
          emoji: '📊',
          description: 'Display comprehensive metadata information about audio files. Shows format details, streams, codecs, bitrates, sample rates, durations, channels, and tags. Export to JSON for programmatic use.',
          usage: [
            'metadata <input>',
            'metadata audio.mp3',
            'metadata audio.mp3 --json',
            'metadata audio-files/ --json -o metadata.json'
          ],
          options: [
            { flag: '--json', description: 'Export metadata in JSON format' },
            { flag: '-o, --output <path>', description: 'Output file path for JSON export (only with --json)' },
            { flag: '-v, --verbose', description: 'Show all technical details' },
            { flag: '-h, --help', description: 'Display help for metadata command' }
          ],
          examples: [
            { command: 'metadata audio.mp3', description: 'Display metadata in human-readable format' },
            { command: 'metadata audio.mp3 --json', description: 'Display metadata in JSON format' },
            { command: 'metadata audio.mp3 --json -o meta.json', description: 'Export metadata to JSON file' },
            { command: 'metadata music/', description: 'Show metadata for all audio in directory' },
            { command: 'metadata audio.flac -v', description: 'Show verbose technical details' }
          ],
          additionalSections: [
            {
              title: 'Metadata Information',
              items: [
                'Format details: container format, duration, bitrate, file size',
                'Audio streams: codec, sample rate, channels, bitrate',
                'Tags: title, artist, album, genre, year, etc.',
                'Technical details: sample format, bits per sample'
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
          allowedExtensions: AUDIO_EXTENSIONS,
        });

        if (errors.length > 0) {
          spinner.fail(chalk.red(errors.join('\n')));
          process.exit(1);
        }

        if (inputFiles.length === 0) {
          spinner.fail(chalk.red('No valid audio files found'));
          process.exit(1);
        }

        spinner.succeed(chalk.green(`Found ${inputFiles.length} audio file(s)`));

        const allMetadata: ComprehensiveAudioMetadata[] = [];

        for (const inputFile of inputFiles) {
          const fileSpinner = ora(chalk.cyan(`Analyzing ${inputFile}...`)).start();

          try {
            const metadata = await getComprehensiveAudioMetadata(inputFile);
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

        console.log(chalk.green.bold(`\n✨ Successfully analyzed ${inputFiles.length} audio file(s)!`));
      } catch (error) {
        spinner.fail(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}

async function getComprehensiveAudioMetadata(inputFile: string): Promise<ComprehensiveAudioMetadata> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
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
        const metadata: ComprehensiveAudioMetadata = {
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
            bit_rate: stream.bit_rate ? parseInt(stream.bit_rate) : undefined,
            sample_rate: stream.sample_rate ? parseInt(stream.sample_rate) : undefined,
            channels: stream.channels,
            channel_layout: stream.channel_layout,
            duration: stream.duration ? parseFloat(stream.duration) : undefined,
            sample_fmt: stream.sample_fmt,
            bits_per_sample: stream.bits_per_sample,
            tags: stream.tags || {},
          })),
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

function displayHumanReadableMetadata(metadata: ComprehensiveAudioMetadata, verbose: boolean): void {
  console.log(chalk.cyan.bold(`\n📊 Metadata for: ${chalk.white(metadata.file)}`));
  console.log(chalk.gray('═'.repeat(80)));

  // Format Information
  console.log(chalk.yellow.bold('\n📦 Format Information:'));
  console.log(chalk.gray(`  Format: ${metadata.format.format_long_name} (${metadata.format.format_name})`));
  console.log(chalk.gray(`  Duration: ${formatDuration(metadata.format.duration)}`));
  console.log(chalk.gray(`  File Size: ${formatFileSize(metadata.format.size)}`));
  console.log(chalk.gray(`  Bitrate: ${formatBitrate(metadata.format.bit_rate)}`));

  // Tags
  if (Object.keys(metadata.format.tags || {}).length > 0) {
    console.log(chalk.yellow.bold('\n🏷️  Tags:'));
    const importantTags = ['title', 'artist', 'album', 'album_artist', 'date', 'genre', 'track', 'disc'];
    const tags = metadata.format.tags || {};

    importantTags.forEach(tag => {
      if (tags[tag]) {
        console.log(chalk.gray(`  ${capitalize(tag)}: ${tags[tag]}`));
      }
    });

    if (verbose) {
      const otherTags = Object.keys(tags).filter(k => !importantTags.includes(k.toLowerCase()));
      if (otherTags.length > 0) {
        console.log(chalk.yellow('\n  Additional Tags:'));
        otherTags.forEach(key => {
          console.log(chalk.gray(`    ${key}: ${tags[key]}`));
        });
      }
    }
  }

  // Audio Streams
  const audioStreams = metadata.streams.filter(s => s.codec_type === 'audio');
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
      if (verbose && stream.sample_fmt) {
        console.log(chalk.gray(`    Sample Format: ${stream.sample_fmt}`));
      }
      if (verbose && stream.bits_per_sample) {
        console.log(chalk.gray(`    Bits Per Sample: ${stream.bits_per_sample}`));
      }
      if (verbose && Object.keys(stream.tags || {}).length > 0) {
        console.log(chalk.gray('    Stream Tags:'));
        Object.entries(stream.tags || {}).forEach(([key, value]) => {
          console.log(chalk.gray(`      ${key}: ${value}`));
        });
      }
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

function capitalize(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
