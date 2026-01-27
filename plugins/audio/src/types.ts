import { AUDIO_EXTENSIONS } from '@mediaproc/core';

export type AudioFormats = keyof typeof AUDIO_EXTENSIONS;

export interface AudioOptions {
  input: string;
  output?: string;
  format?: AudioFormats;
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
