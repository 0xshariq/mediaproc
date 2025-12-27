export interface ImageOptions {
  input: string;
  output?: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpg' | 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' | 'gif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  verbose?: boolean;
  dryRun?: boolean;
}

export interface ResizeOptions extends ImageOptions {
  maintainAspectRatio?: boolean;
}

export interface ConvertOptions extends ImageOptions {
  format: 'jpg' | 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' | 'gif';
}

export interface FilterOptions extends ImageOptions {
  grayscale?: boolean;
  blur?: number;
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
