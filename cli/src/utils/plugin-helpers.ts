import type { Command } from 'commander';
import type { PluginManager } from './plugins/manager.js';

/**
 * Verify plugin is installed and can be imported
 * @param pluginName - Full plugin package name
 * @param isGlobal - Optional flag to check global installation
 */
export async function verifyPluginInstallation(
  pluginName: string,
  isGlobal?: boolean
): Promise<boolean> {
  try {
    // Try importing the plugin
    await import(pluginName);
    return true;
  } catch (importError) {
    // If import fails and we're checking global, verify via package manager
    if (isGlobal !== undefined) {
      try {
        const { execa } = await import('execa');
        const { stdout } = await execa('npm', ['list', '-g', '--depth=0', pluginName], {
          stdio: 'pipe',
          reject: false
        });
        return stdout.includes(pluginName);
      } catch {
        return false;
      }
    }
    return false;
  }
}

/**
 * Load plugin with error handling
 * @param pluginName - Full plugin package name
 * @param program - Commander program instance
 * @param pluginManager - Plugin manager instance
 */
export async function loadPluginSafe(
  pluginName: string,
  program: Command,
  pluginManager: PluginManager
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already loaded
    if (pluginManager.getPlugin(pluginName)) {
      return { success: true };
    }

    // Attempt to load
    await pluginManager.loadPlugin(pluginName, program);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's a "module not found" error
    if (errorMessage.includes('Cannot find module') || errorMessage.includes('MODULE_NOT_FOUND')) {
      return { 
        success: false, 
        error: 'Plugin not installed. Please install it first.' 
      };
    }
    
    // Return the actual error
    return { success: false, error: errorMessage };
  }
}

/**
 * Check if plugin is already loaded
 */
export function isPluginLoaded(pluginName: string, pluginManager: PluginManager): boolean {
  return pluginManager.getPlugin(pluginName) !== undefined;
}

/**
 * Format plugin name for display (remove @mediaproc/ prefix)
 */
export function formatPluginName(pluginName: string): string {
  return pluginName.replace('@mediaproc/', '').replace('mediaproc-', '');
}

/**
 * Resolve plugin command name (e.g., 'image' from '@mediaproc/image')
 */
export function getPluginCommand(pluginName: string): string {
  if (pluginName.startsWith('@mediaproc/')) {
    return pluginName.replace('@mediaproc/', '');
  }
  if (pluginName.startsWith('mediaproc-')) {
    return pluginName.replace('mediaproc-', '');
  }
  return pluginName;
}

/**
 * Validate plugin name format
 */
export function isValidPluginName(pluginName: string): boolean {
  // Must be scoped (@mediaproc/), community (mediaproc-), or valid npm package name
  const scopedRegex = /^@[\w-]+\/[\w-]+$/;
  const communityRegex = /^mediaproc-[\w-]+$/;
  const npmRegex = /^[\w-]+$/;

  return (
    scopedRegex.test(pluginName) ||
    communityRegex.test(pluginName) ||
    npmRegex.test(pluginName)
  );
}

/**
 * Get plugin examples by package name
 */
export function getPluginExamples(packageName: string): string[] {
  const examples: Record<string, string[]> = {
    '@mediaproc/image': [
      'resize photo.jpg -w 800',
      'convert image.png --format webp',
      'grayscale photo.jpg',
      'compress image.png --quality 80'
    ],
    '@mediaproc/video': [
      'compress movie.mp4 --quality high',
      'transcode video.avi --format mp4',
      'trim video.mp4 -s 00:00:10 -e 00:01:00',
      'resize video.mp4 -s 720p'
    ],
    '@mediaproc/audio': [
      'convert song.wav --format mp3',
      'normalize audio.mp3',
      'trim music.mp3 -s 30 -d 60',
      'extract video.mp4 --format flac'
    ],
    '@mediaproc/document': [
      'compress report.pdf --quality ebook',
      'ocr scanned.pdf',
      'convert document.docx --format pdf'
    ],
    '@mediaproc/animation': [
      'gifify video.mp4 --fps 15',
      'optimize animation.gif',
      'convert video.mp4 --format webp'
    ],
    '@mediaproc/3d': [
      'optimize model.glb',
      'compress textures/',
      'convert model.obj --format glb'
    ],
    '@mediaproc/metadata': [
      'inspect video.mp4',
      'strip-metadata image.jpg',
      'extract audio.mp3'
    ],
    '@mediaproc/stream': [
      'pack video.mp4 --hls',
      'encrypt video.mp4 --drm',
      'manifest playlist.m3u8'
    ],
    '@mediaproc/ai': [
      'blur-faces video.mp4',
      'caption audio.wav',
      'detect-scenes video.mp4'
    ],
    '@mediaproc/pipeline': [
      'run workflow.yaml',
      'validate pipeline.yaml',
      'execute batch-process.yaml'
    ]
  };

  return examples[packageName] || [];
}
