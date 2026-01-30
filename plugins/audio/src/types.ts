
export type AudioFormats = 'mp3' | 'wav' | 'flac' | 'aac' | 'ogg' | 'm4a' | 'wma' | 'opus' | 'ape' | 'alac' | 'mov' | 'mkv';

// Common options for all audio commands
export interface AudioOptions {
  input?: string;
  output?: string;
  format?: AudioFormats;
  bitrate?: string;
  sampleRate?: number;
  channels?: number;
  verbose?: boolean;
  dryRun?: boolean;
  explain?: boolean;
  help?: boolean;
  force?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'lossless';
  codec?: string;
  normalize?: boolean;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  trim?: string;
  metadata?: string[];
}

export interface ConvertOptions extends AudioOptions {
  // All options are inherited from AudioOptions
}

export interface ExtractOptions extends AudioOptions {
  // All options are inherited from AudioOptions
}

export interface MergeOptions extends AudioOptions {
  inputs?: string[];
  crossfade?: number;
  removeSilence?: boolean;
}

export interface NormalizeOptions extends AudioOptions {
  target?: number;
  maxLevel?: number;
  method?: 'loudnorm' | 'peak';
}

export interface TrimOptions extends AudioOptions {
  start?: string;
  end?: string;
  duration?: string;
  fast?: boolean;
}