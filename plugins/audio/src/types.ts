export interface AudioOptions {
  input: string;
  output?: string;
  format?: 'mp3' | 'aac' | 'wav' | 'flac' | 'ogg';
  bitrate?: string;
  sampleRate?: number;
  channels?: number;
  verbose?: boolean;
  dryRun?: boolean;
  explain?: boolean;
}

export interface NormalizeOptions extends AudioOptions {
  target?: number;
}
