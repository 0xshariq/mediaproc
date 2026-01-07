/**
 * FFmpeg Output Logger - Styled output for better readability
 */

import chalk from 'chalk';

/**
 * Check if a line should be displayed based on content
 */
export function shouldDisplayLine(line: string): boolean {
  const trimmed = line.trim();
  
  // Skip empty lines
  if (!trimmed) return false;
  
  // Skip configuration lines
  if (trimmed.startsWith('ffmpeg version') ||
      trimmed.startsWith('built with') ||
      trimmed.startsWith('configuration:') ||
      trimmed.startsWith('lib')) {
    return false;
  }
  
  // Show important progress and status lines
  return true;
}

/**
 * Style FFmpeg output line with appropriate colors and formatting
 */
export function styleFFmpegOutput(line: string): string {
  const trimmed = line.trim();
  
  // Progress updates (frame=, fps=, time=)
  if (trimmed.match(/frame=|fps=|time=|speed=/)) {
    return chalk.cyan(trimmed);
  }
  
  // Input file info
  if (trimmed.startsWith('Input #') || trimmed.includes('Duration:') || trimmed.includes('Stream #')) {
    return chalk.blue(trimmed);
  }
  
  // Output file info
  if (trimmed.startsWith('Output #')) {
    return chalk.green(trimmed);
  }
  
  // Warnings
  if (trimmed.toLowerCase().includes('warning')) {
    return chalk.yellow(trimmed);
  }
  
  // Errors
  if (trimmed.toLowerCase().includes('error') || trimmed.toLowerCase().includes('failed')) {
    return chalk.red(trimmed);
  }
  
  // Success messages
  if (trimmed.includes('successfully') || trimmed.includes('complete')) {
    return chalk.green(trimmed);
  }
  
  // Default gray for other lines
  return chalk.gray(trimmed);
}

/**
 * Log FFmpeg output with styling
 */
export function logFFmpegOutput(output: string): void {
  const lines = output.split('\n');
  
  for (const line of lines) {
    if (shouldDisplayLine(line)) {
      console.log(styleFFmpegOutput(line));
    }
  }
}
