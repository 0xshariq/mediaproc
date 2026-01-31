
/**
 * Check if a line should be displayed based on content (video only)
 */
export function shouldDisplayLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // Always show errors and warnings
  if (trimmed.toLowerCase().includes('error') || trimmed.toLowerCase().includes('failed') || trimmed.toLowerCase().includes('warning')) return true;
  // Show progress and status lines always
  if (trimmed.match(/frame=|fps=|time=|speed=/)) return true;
  // Show input/output info
  if (trimmed.startsWith('Input #') || trimmed.startsWith('Output #')) return true;
  return false;
}

/**
 * Log FFmpeg output (video only, plain, no styling)
 */
export function logFFmpegOutput(output: string, verbose = false): void {
  const lines = output.split('\n');
  for (const line of lines) {
    if (shouldDisplayLine(line) || verbose) {
      console.log(line);
    }
  }
}
