import { spawn } from 'child_process';
import { shouldDisplayLine, logFFmpegOutput } from './ffmpegLogger.js';
import { styleFFmpegOutput } from './ffmpeg-output.js';

// FFmpeg install guidance links (all platforms)
const FFMPEG_GUIDES = [
  { label: 'Official guide', url: 'https://ffmpeg.org/download.html' },
  { label: 'Community guide', url: 'https://github.com/adaptlearning/adapt_authoring/wiki/Installing-FFmpeg' },
  { label: 'Multi-platform guide', url: 'https://github.com/ffmpegwasm/ffmpeg.wasm/blob/main/docs/install.md' },
];

function printFFmpegInstallGuidance() {
  const lines = [
    '✗ FFmpeg or ffprobe not found on your system.',
    'Please install FFmpeg and ffprobe to use video features.',
    ...FFMPEG_GUIDES.map(g => `${g.label}: ${g.url}`),
    'After installation, ensure ffmpeg and ffprobe are available in your PATH.'
  ];
  lines.forEach(line => console.error(styleFFmpegOutput(line)));
}


export interface VideoMetadata {
  duration: number;
  codec: string;
  width: number;
  height: number;
  bitrate: number;
  format: string;
}

/**
 * Check if ffmpeg and ffprobe are available, with styled output
 * If strict=true, both must be present. If strict=false, only ffmpeg is checked.
 */
export async function checkFFmpeg(strict = false): Promise<boolean> {
  // Check ffmpeg
  const ffmpegAvailable = await new Promise<boolean>((resolve) => {
    try {
      const ffmpeg = spawn('ffmpeg', ['-version']);
      ffmpeg.on('close', (code) => resolve(code === 0));
      ffmpeg.on('error', () => resolve(false));
    } catch {
      resolve(false);
    }
  });
  if (!strict) return ffmpegAvailable;
  // Check ffprobe
  const ffprobeAvailable = await new Promise<boolean>((resolve) => {
    try {
      const ffprobe = spawn('ffprobe', ['-version']);
      ffprobe.on('close', (code) => resolve(code === 0));
      ffprobe.on('error', () => resolve(false));
    } catch {
      resolve(false);
    }
  });
  return ffmpegAvailable && ffprobeAvailable;
}


/**
 * Centralized check and guidance for ffmpeg/ffprobe availability
 */
async function ensureFFmpegAvailable(): Promise<boolean> {
  const available = await checkFFmpeg(true);
  if (!available) {
    printFFmpegInstallGuidance();
    return false;
  }
  return true;
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

/**
 * Execute ffmpeg command with detailed output and robust error handling
 */
export async function runFFmpeg(
  args: string[],
  verbose = false,
  onOutput?: (line: string, styledLine?: string) => void
): Promise<void> {
  if (!(await ensureFFmpegAvailable())) return;
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
 * Get video metadata using ffprobe with detailed output and error reporting
 */
export async function getVideoMetadata(input: string): Promise<VideoMetadata> {
  if (!(await ensureFFmpegAvailable())) return Promise.reject(new Error('FFmpeg/ffprobe not installed'));
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
        const videoStream = data.streams.find((s: any) => s.codec_type === 'video');
        if (!videoStream) {
          console.error(styleFFmpegOutput('No video stream found in file.'));
          reject(new Error('No video stream found'));
          return;
        }
        const metadata: VideoMetadata = {
          duration: parseFloat(data.format.duration) || 0,
          codec: videoStream.codec_name || 'unknown',
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          bitrate: parseInt(data.format.bit_rate) || parseInt(videoStream.bit_rate) || 0,
          format: data.format.format_name || 'unknown',
        };
        // Detailed output of metadata
        console.log(styleFFmpegOutput('Video Metadata:'));
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
