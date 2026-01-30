
import chalk from 'chalk';

/**
 * Style FFmpeg output line with appropriate colors and formatting
 */
export function styleFFmpegOutput(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return '';

  // Progress updates (frame=, fps=, time=, speed=)
  if (trimmed.match(/frame=|fps=|time=|speed=/)) {
    // Parse progress line for richer output
    const frameMatch = trimmed.match(/frame=\s*(\d+)/);
    const fpsMatch = trimmed.match(/fps=\s*([\d.]+)/);
    const timeMatch = trimmed.match(/time=\s*([\d:\.]+)/);
    const speedMatch = trimmed.match(/speed=\s*([\d.]+x)/);
    const sizeMatch = trimmed.match(/size=\s*(\d+\w+)/);
    const bitrateMatch = trimmed.match(/bitrate=\s*([\d.]+\w+)/);
    let output = chalk.cyan.bold('⏳ Progress: ');
    if (frameMatch) output += chalk.white(`Frame ${frameMatch[1]} `);
    if (fpsMatch) output += chalk.gray(`• ${fpsMatch[1]} fps `);
    if (timeMatch) output += chalk.white(`• ${timeMatch[1]} `);
    if (sizeMatch) output += chalk.gray(`• ${sizeMatch[1]} `);
    if (bitrateMatch) output += chalk.gray(`• ${bitrateMatch[1]} `);
    if (speedMatch) output += chalk.green(`• ${speedMatch[1]}`);
    return output;
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
 * Check if a line should be displayed based on verbosity and content
 */
export function shouldDisplayLine(line: string, verbose: boolean): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // Always show errors and warnings
  if (trimmed.toLowerCase().includes('error') || trimmed.toLowerCase().includes('failed') || trimmed.toLowerCase().includes('warning')) return true;
  // Show progress and status lines always
  if (trimmed.match(/frame=|fps=|time=|speed=/)) return true;
  // Show input/output info
  if (trimmed.startsWith('Input #') || trimmed.startsWith('Output #')) return true;
  // Show if verbose
  return verbose;
}

/**
 * Log FFmpeg output with styling and filtering
 */
export function logFFmpegOutput(output: string, verbose = false): void {
  const lines = output.split('\n');
  for (const line of lines) {
    if (shouldDisplayLine(line, verbose)) {
      console.log(styleFFmpegOutput(line));
    }
  }
}
