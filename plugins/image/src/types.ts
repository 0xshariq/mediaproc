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
  left?: number;
  top?: number;
}

export interface ResizeOptions extends ImageOptions {
  maintainAspectRatio?: boolean;
  position?: string;
  background?: string;
  kernel?: string;
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
  opacity?: number;
}

export interface ExtractOptions extends ImageOptions {
  channel?: 'red' | 'green' | 'blue' | 'alpha';
}

export interface BorderOptions extends ImageOptions {
  color?: string;
}

export interface TextOptions extends ImageOptions {
  text: string;
  font?: string;
  size?: number;
  color?: string;
  gravity?: 'center' | 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
}

export interface StatsOptions extends ImageOptions {
  detailed?: boolean;
  histogram?: boolean;
}

export interface ClaheOptions extends ImageOptions {
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
