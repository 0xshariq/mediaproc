
export type VideoFormats =
  | 'mp4'
  | 'avi'
  | 'mkv'
  | 'mov'
  | 'webm'
  | 'flv'
  | 'wmv'
  | 'mpg'
  | 'mpeg'
  | 'm4v'
  | '3gp'
  | '3g2'
  | 'f4v'
  | 'ts'
  | 'mts'
  | 'm2ts'
  | 'vob'
  | 'ogv'
  | 'divx'
  | 'asf'
  | 'rm'
  | 'rmvb';

// All common options for video commands
export interface InVideoOptions {
  input?: string;
  output?: string;
  formats?: VideoFormats;
  codec?: 'h264' | 'h265' | 'hevc' | 'vp9' | 'av1';
  audioCodec?: string;
  audioBitrate?: string;
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  crf?: number;
  bitrate?: string;
  fps?: number;
  verbose?: boolean;
  dryRun?: boolean;
  threads?: number;
  hwAccel?: boolean;
  quality?: number | 'low' | 'medium' | 'high';
  scale?: string; // e.g. '720p', '1920x1080'
  width?: number;
  height?: number;
  aspect?: string; // e.g. '16:9'
  twoPass?: boolean;
  audio?: boolean;
  fast?: boolean;
  explain?: boolean;
  help?: boolean;
  // For trim/extract
  start?: string;
  end?: string;
  duration?: string;
  // For merge
  reEncode?: boolean;
}

export interface ConvertOptions extends InVideoOptions {
  noAudio?: boolean;
}

export interface CompressOptions extends InVideoOptions {
  // quality can be string or number
  quality?: 'low' | 'medium' | 'high' | number;
}

export interface TranscodeOptions extends InVideoOptions {}

export interface ExtractOptions extends InVideoOptions {
  format?: 'jpg' | 'png' | 'avif';
}

export interface TrimOptions extends InVideoOptions {
  start: string;
  end: string;
}

export interface ResizeOptions extends InVideoOptions {
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
}

export interface MergeOptions extends InVideoOptions {
  inputs: string[];
}