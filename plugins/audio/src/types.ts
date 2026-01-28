export type AudioFormats = '.mp3' | '.wav' | '.flac' | '.aac' | '.ogg' | '.m4a' | '.wma' | '.opus' | '.ape' | '.alac' | '.mov' | '.mkv';

export interface AudioOptions {
  input: string;
  output?: string;
  formats?: AudioFormats;
  bitrate?: string;
  sampleRate?: number;
  channels?: number;
  verbose?: boolean;
  dryRun?: boolean;
  explain?: boolean;
  help?: boolean;
}

export interface NormalizeOptions extends AudioOptions {
  target?: number;
}
export interface ConvertOptions extends AudioOptions {
  quality: 'low' | 'medium' | 'high' | 'lossless'
  force?: boolean;
  trim: ''
}
export interface ExtractOptions extends AudioOptions {}
export interface MergeOptions extends AudioOptions {}
export interface TrimOptions extends AudioOptions {}