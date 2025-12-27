export interface DocumentOptions {
  input: string;
  output?: string;
  verbose?: boolean;
  dryRun?: boolean;
}

export interface CompressOptions extends DocumentOptions {
  quality?: 'screen' | 'ebook' | 'printer' | 'prepress';
}

export interface ExtractOptions extends DocumentOptions {
  pages?: string;
  format?: 'text' | 'images';
}

export interface OCROptions extends DocumentOptions {
  language?: string;
  outputFormat?: 'text' | 'pdf';
}
