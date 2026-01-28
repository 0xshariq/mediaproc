import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  AUDIO_EXTENSIONS,
  DOCUMENT_EXTENSIONS,
  ANIMATION_EXTENSIONS,
  THREED_EXTENSIONS
} from '../../constants/supportedExtensions.js';

export type FileType = 'image' | 'video' | 'audio' | 'document' | 'animation' | '3d' | 'unknown';

const EXTENSION_MAP: Record<FileType, string[]> = {
  image: IMAGE_EXTENSIONS,
  video: VIDEO_EXTENSIONS,
  audio: AUDIO_EXTENSIONS,
  document: DOCUMENT_EXTENSIONS,
  animation: ANIMATION_EXTENSIONS,
  '3d': THREED_EXTENSIONS,
  unknown: []
};

export function detectFileType(filePath: string): FileType {
  const ext = path.extname(filePath).toLowerCase();
  for (const [type, arr] of Object.entries(EXTENSION_MAP)) {
    if (arr.includes(ext)) return type as FileType;
  }
  return 'unknown';
}

export function detectInputFiles(inputPath: string): { type: FileType; count: number; files: string[] } {
  if (!fs.existsSync(inputPath)) return { type: 'unknown', count: 0, files: [] };
  const stat = fs.statSync(inputPath);
  let files: string[] = [];
  if (stat.isDirectory()) {
    files = fs.readdirSync(inputPath)
      .map(f => path.join(inputPath, f))
      .filter(f => fs.statSync(f).isFile());
  } else if (stat.isFile()) {
    files = [inputPath];
  }
  let detectedType: FileType = 'unknown';
  if (files.length > 0) {
    detectedType = detectFileType(files[0]);
  }
  return { type: detectedType, count: files.length, files };
}

export function detectOutputFiles(outputPath: string | undefined): { exists: boolean; isDir: boolean; files: string[] } {
  if (!fs.existsSync(outputPath ? outputPath : '')) return { exists: false, isDir: false, files: [] };
  const stat = fs.statSync(outputPath ? outputPath : '');
  if (stat.isDirectory()) {
    const files = fs.readdirSync(outputPath ? outputPath : '')
      .map(f => path.join(outputPath ? outputPath : '', f))
      .filter(f => fs.statSync(f).isFile());
    return { exists: true, isDir: true, files };
  } else if (stat.isFile()) {
    return { exists: true, isDir: false, files: [outputPath ? outputPath : ''] };
  }
  return { exists: false, isDir: false, files: [] };
}
