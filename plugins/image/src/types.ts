export type ImageFormats = 'jpg' |
  'jpeg' |
  'png' |
  'bmp' |
  'webp' |
  'tiff' |
  'tif' |
  'svg' |
  'ico' |
  'heic' |
  'heif' |
  'avif'
export interface ImageOptions {
  input: string;
  output?: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormats;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  verbose?: boolean;
  dryRun?: boolean;
  explain?: boolean;
  help?: boolean;
}

export interface ResizeOptions extends ImageOptions {
  maintainAspectRatio?: boolean;
  position?: string;
  background?: string;
  kernel?: string;
  help?: boolean;
}

export interface ConvertOptions extends ImageOptions {
  progressive?: boolean;
  compression?: number;
}

export interface CompositeOptions extends ImageOptions {
  overlay: string;
  gravity?: 'center' | 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
  blend?: 'over' | 'in' | 'out' | 'atop' | 'dest' | 'dest-over' | 'dest-in' | 'dest-out' | 'dest-atop' | 'xor' | 'add' | 'saturate' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
  tile?: boolean;
  premultiplied?: boolean;
  left?: number;
  top?: number;
  opacity?: number;
}

export interface ExtractOptions extends ImageOptions {
  channel?: 'red' | 'green' | 'blue' | 'alpha';
  left?: number;
  top?: number;
  width?: number;
  height?: number;
}

export interface BorderOptions extends ImageOptions {
  width?: number;
  height?: number;
  color?: string;
}

export interface TextOptions extends ImageOptions {
  text: string;
  font?: string;
  size?: number;
  color?: string;
  gravity?: 'center' | 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
  top?: number;
  left?: number;
}

export interface StatsOptions extends ImageOptions {
  input: string;
  detailed?: boolean;
  histogram?: boolean;
  verbose?: boolean;
}

export interface ClaheOptions extends ImageOptions {
  width?: number;
  height?: number;
  maxSlope?: number;
}

export interface ConvolveOptions extends ImageOptions {
  kernel: number[][];
  scale?: number;
  offset?: number;
}

export interface FilterOptions extends ImageOptions {
  grayscale?: boolean;
  blur?: number;
  sigma?: number;
  sharpen?: boolean;
  normalize?: boolean;
  negate?: boolean;
  help?: boolean;
}

export interface AdjustOptions extends ImageOptions {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
}

export interface EffectOptions extends ImageOptions {
  sepia?: boolean;
  posterize?: number;
  pixelate?: number;
}
