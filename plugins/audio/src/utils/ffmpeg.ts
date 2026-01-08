import { spawn } from 'child_process';

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
 * Execute ffmpeg command
 */
export async function runFFmpeg(
  args: string[], 
  verbose = false, 
  onOutput?: (line: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      
      if (onOutput) {
        output.split('\n').forEach((line: string) => {
          if (line.trim()) {
            onOutput(line);
          }
        });
      } else if (verbose) {
        process.stderr.write(data);
      }
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg failed with code ${code}\n${stderr}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(new Error(`Failed to start ffmpeg: ${error.message}`));
    });
  });
}

/**
 * Get audio metadata using ffprobe
 */
export async function getAudioMetadata(input: string): Promise<AudioMetadata> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v',
      'quiet',
      '-print_format',
      'json',
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
      stderr += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed: ${stderr}`));
        return;
      }

      try {
        const data = JSON.parse(stdout);
        const audioStream = data.streams.find((s: any) => s.codec_type === 'audio');

        if (!audioStream) {
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

        resolve(metadata);
      } catch (error) {
        reject(new Error(`Failed to parse ffprobe output: ${(error as Error).message}`));
      }
    });
  });
}

/**
 * Check if ffmpeg and ffprobe are available
 */
export async function checkFFmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    ffmpeg.on('close', (code) => {
      resolve(code === 0);
    });
    ffmpeg.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format duration to HH:MM:SS
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
 * Format bitrate to human-readable string
 */
export function formatBitrate(bitrate: number): string {
  if (bitrate === 0) return 'unknown';
  const kbps = bitrate / 1000;
  return `${Math.round(kbps)} kbps`;
}
