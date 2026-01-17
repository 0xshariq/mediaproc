import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Get version from package.json
 */
function getVersion(packagePath: string): string {
  try {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return packageJson.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * Get CLI version from root package.json
 */
function getCliVersion(): string {
  try {
    // For ES modules, use import.meta.url
    if (typeof import.meta.url !== 'undefined') {
      const currentDir = dirname(fileURLToPath(import.meta.url));
      const packagePath = join(currentDir, '../../package.json');
      return getVersion(packagePath);
    }
    // Fallback: try from process.cwd()
    const packagePath = join(process.cwd(), 'package.json');
    return getVersion(packagePath);
  } catch {
    return '0.6.0'; // Fallback version
  }
}

/**
 * Show CLI branding footer with documentation and GitHub links
 */
export function showBranding(): void {
  const version = getCliVersion();
  console.log('\n' + '─'.repeat(60));
  console.log(`  💙 Powered by MediaProc CLI v${version}`);
  console.log('  📚 Documentation: \x1b[36mhttps://docs-mediaproc.vercel.app/\x1b[0m');
  console.log('  ⭐ Star us: \x1b[36mhttps://github.com/0xshariq/mediaproc-cli\x1b[0m');
  console.log('─'.repeat(60) + '\n');
}

/**
 * Show plugin branding footer with version
 * @param pluginName - Name of the plugin (e.g., 'image', 'video', 'audio')
 * @param pluginPath - Path to plugin's package.json
 */
export function showPluginBranding(pluginName: string, pluginPath: string): void {
  const version = getVersion(pluginPath);
  console.log('\n' + '─'.repeat(60));
  console.log(`  💙 ${pluginName.charAt(0).toUpperCase() + pluginName.slice(1)} Plugin v${version} · Powered by MediaProc`);
  console.log('  📚 Documentation: \x1b[36mhttps://docs-mediaproc.vercel.app/\x1b[0m');
  console.log('  ⭐ Star us: \x1b[36mhttps://github.com/0xshariq/mediaproc-cli\x1b[0m');
  console.log('─'.repeat(60) + '\n');
}

