export interface VideoOptions {
  input: string;
  output?: string;
  codec?: 'h264' | 'h265' | 'vp9' | 'av1';
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  crf?: number;
  bitrate?: string;
  fps?: number;
  verbose?: boolean;
  dryRun?: boolean;
}

export interface CompressOptions extends VideoOptions {
  quality?: 'low' | 'medium' | 'high';
}

export interface TranscodeOptions extends VideoOptions {
  format?: 'mp4' | 'webm' | 'mkv' | 'avi';
}

export interface ExtractOptions {
  input: string;
  output?: string;
  start?: string;
  end?: string;
  format?: 'jpg' | 'png';
  fps?: number;
}
