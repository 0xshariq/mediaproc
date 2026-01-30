
import { spawn } from 'child_process';
import { shouldDisplayLine, logFFmpegOutput } from './ffmpegLogger.js';
import { styleFFmpegOutput } from './ffmpeg-output.js';

export interface AudioMetadata {
  duration: number;
  codec: string;
  sampleRate: number;
  channels: number;
  bitrate: number;
  format: string;
  channelLayout?: string;
}

/**
 * Execute ffmpeg command with detailed output and robust error handling
 */
export async function runFFmpeg(
  args: string[],
  verbose = false,
  onOutput?: (line: string, styledLine?: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';
    let allOutput = '';

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      allOutput += output;
      output.split('\n').forEach((line: string) => {
        if (shouldDisplayLine(line) || verbose) {
          const styled = styleFFmpegOutput(line);
          logFFmpegOutput(line);
          if (onOutput) {
            onOutput(line, styled);
          } else {
            if (styled) console.log(styled);
          }
        }
      });
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log(styleFFmpegOutput('FFmpeg finished successfully.'));
        resolve();
      } else {
        stderr.split('\n').forEach((line: string) => {
          if (shouldDisplayLine(line)) {
            logFFmpegOutput(line);
            const styled = styleFFmpegOutput(line);
            if (styled) console.error(styled);
          }
        });
        reject(new Error(`FFmpeg failed with code ${code}\n${stderr}`));
      }
    });

    ffmpeg.on('error', (error) => {
      console.error(styleFFmpegOutput(`Failed to start ffmpeg: ${error.message}`));
      reject(new Error(`Failed to start ffmpeg: ${error.message}`));
    });
  });
}

/**
 * Get audio metadata using ffprobe with detailed output and error reporting
 */
export async function getAudioMetadata(input: string): Promise<AudioMetadata> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      input,
    ]);

    let stdout = '';
    let stderr = '';

    ffprobe.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      output.split('\n').forEach((line: string) => {
        if (shouldDisplayLine(line)) {
          logFFmpegOutput(line);
          const styled = styleFFmpegOutput(line);
          if (styled) console.error(styled);
        }
      });
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        console.error(styleFFmpegOutput(`ffprobe failed with code ${code}`));
        reject(new Error(`ffprobe failed: ${stderr}`));
        return;
      }

      try {
        const data = JSON.parse(stdout);
        const audioStream = data.streams.find((s: any) => s.codec_type === 'audio');

        if (!audioStream) {
          console.error(styleFFmpegOutput('No audio stream found in file.'));
          reject(new Error('No audio stream found'));
          return;
        }

        const metadata: AudioMetadata = {
          duration: parseFloat(data.format.duration) || 0,
          codec: audioStream.codec_name || 'unknown',
          sampleRate: parseInt(audioStream.sample_rate) || 0,
          channels: audioStream.channels || 0,
          bitrate: parseInt(data.format.bit_rate) || parseInt(audioStream.bit_rate) || 0,
          format: data.format.format_name || 'unknown',
          channelLayout: audioStream.channel_layout,
        };

        // Detailed output of metadata
        console.log(styleFFmpegOutput('Audio Metadata:'));
        Object.entries(metadata).forEach(([key, value]) => {
          console.log(styleFFmpegOutput(`  ${key}: ${value}`));
        });

        resolve(metadata);
      } catch (error) {
        console.error(styleFFmpegOutput(`Failed to parse ffprobe output: ${(error as Error).message}`));
        reject(new Error(`Failed to parse ffprobe output: ${(error as Error).message}`));
      }
    });
  });
}

/**
 * Check if ffmpeg and ffprobe are available, with styled output
 */
export async function checkFFmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log(styleFFmpegOutput('FFmpeg is available.'));
        resolve(true);
      } else {
        console.error(styleFFmpegOutput('FFmpeg is NOT available.'));
        resolve(false);
      }
    });
    ffmpeg.on('error', () => {
      console.error(styleFFmpegOutput('FFmpeg is NOT available.'));
      resolve(false);
    });
  });
}

/**
 * Format file size to human-readable string (styled)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format duration to HH:MM:SS (styled)
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

/**
 * Parse time string (HH:MM:SS or seconds) to seconds
 */
export function parseTime(time: string): number {
  if (/^\d+(\.\d+)?$/.test(time)) {
    return parseFloat(time);
  }
  const parts = time.split(':').map(p => parseInt(p));
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parseFloat(time);
}

/**
 * Format bitrate to human-readable string (styled)
 */
export function formatBitrate(bitrate: number): string {
  if (bitrate === 0) return 'unknown';
  const kbps = bitrate / 1000;
  return `${Math.round(kbps)} kbps`;
}
