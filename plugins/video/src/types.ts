
export type VideoFormats = '.mp4' |
  '.avi' |
  '.mkv' |
  '.mov' |
  '.webm' |
  '.flv' |
  '.wmv' |
  '.mpg' |
  '.mpeg' |
  '.m4v' |
  '.3gp' |
  '.f4v' |
  '.ts' |
  '.mts' |
  '.m2ts'

export interface VideoOptions {
  input: string;
  output?: string;
  codec?: 'h264' | 'h265' | 'hevc' | 'vp9' | 'av1';
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  crf?: number;
  bitrate?: string;
  fps?: number;
  verbose?: boolean;
  dryRun?: boolean;
  formats?: VideoFormats;
  // Resize-specific options
  scale?: '480p' | '720p' | '1080p' | '1440p' | '4k';
  width?: number;
  height?: number;
  aspect?: boolean;
  // Trim-specific options
  start?: string;
  duration?: string;
  end?: string;
  fast?: boolean;
  explain?: boolean;
  help?: boolean;
}
export interface ConvertOptions extends VideoOptions {
  noAudio?: boolean;
  audioCodec?: string;
}

export interface CompressOptions extends VideoOptions {
  quality?: 'low' | 'medium' | 'high';
  audioBitrate?: string;
}

export interface TranscodeOptions extends VideoOptions {
  audioCodec?: string;
  audioBitrate?: string;
}

export interface ExtractOptions extends VideoOptions {
  start?: string;
  end?: string;
  format?: 'jpg' | 'png' | 'avif';
  fps?: number;
  quality?: number;
}

export interface TrimOptions extends VideoOptions {
  start: string;
  end: string;
}

export interface ResizeOptions extends VideoOptions {
  width: number;
  height: number;
  maintainAspectRatio?: boolean;
  scale: string;
}

export interface MergeOptions extends VideoOptions {
  inputs: string[];
}