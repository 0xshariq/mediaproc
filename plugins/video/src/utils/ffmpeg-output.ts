import chalk from 'chalk';

/**
 * Parse and style FFmpeg output for better readability
 */
export function styleFFmpegOutput(line: string): string {
  line = line.trim();
  
  // Skip empty lines
  if (!line) return '';

  // Error messages (red)
  if (line.includes('Error') || line.includes('error') || line.includes('failed')) {
    return chalk.red(line);
  }

  // Warning messages (yellow)
  if (line.includes('Warning') || line.includes('warning')) {
    return chalk.yellow(line);
  }

  // Progress information (cyan)
  if (line.includes('frame=') || line.includes('fps=') || line.includes('time=') || line.includes('speed=')) {
    // Parse progress line
    const frameMatch = line.match(/frame=\s*(\d+)/);
    const fpsMatch = line.match(/fps=\s*([\d.]+)/);
    const timeMatch = line.match(/time=\s*([\d:\.]+)/);
    const speedMatch = line.match(/speed=\s*([\d.]+x)/);
    const sizeMatch = line.match(/size=\s*(\d+\w+)/);
    const bitrateMatch = line.match(/bitrate=\s*([\d.]+\w+)/);

    let output = chalk.cyan('⚡ Progress: ');
    if (frameMatch) output += chalk.white(`Frame ${frameMatch[1]} `);
    if (fpsMatch) output += chalk.gray(`• ${fpsMatch[1]} fps `);
    if (timeMatch) output += chalk.white(`• ${timeMatch[1]} `);
    if (sizeMatch) output += chalk.gray(`• ${sizeMatch[1]} `);
    if (bitrateMatch) output += chalk.gray(`• ${bitrateMatch[1]} `);
    if (speedMatch) output += chalk.green(`• ${speedMatch[1]}`);
    
    return output;
  }

  // Input/Output file info (blue)
  if (line.includes('Input #') || line.includes('Output #')) {
    return chalk.blue.bold(line);
  }

  // Stream info (magenta)
  if (line.includes('Stream #')) {
    return chalk.magenta(line);
  }

  // Duration and metadata (green)
  if (line.includes('Duration:') || line.includes('Metadata:')) {
    return chalk.green(line);
  }

  // Configuration info (gray)
  if (line.includes('configuration:') || line.includes('libav') || line.includes('built with')) {
    return chalk.gray(line);
  }

  // Success messages (green)
  if (line.includes('successfully') || line.includes('completed')) {
    return chalk.green(line);
  }

  // Default: dim for general info
  return chalk.dim(line);
}

/**
 * Check if line should be displayed based on verbosity
 */
export function shouldDisplayLine(line: string, verbose: boolean): boolean {
  line = line.trim();
  
  if (!line) return false;
  
  // Always show errors and warnings
  if (line.includes('Error') || line.includes('error') || line.includes('Warning') || line.includes('warning')) {
    return true;
  }

  // Always show progress
  if (line.includes('frame=') && line.includes('time=')) {
    return true;
  }

  // Show important info
  if (line.includes('Input #') || line.includes('Output #') || line.includes('Stream #')) {
    return verbose;
  }

  // Show duration and metadata if verbose
  if (line.includes('Duration:') || line.includes('Metadata:')) {
    return verbose;
  }

  // Filter out configuration and build info unless very verbose
  if (line.includes('configuration:') || line.includes('built with')) {
    return false;
  }

  return verbose;
}
