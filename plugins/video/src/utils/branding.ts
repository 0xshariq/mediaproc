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
 * Get plugin version from package.json
 */
function getPluginVersion(): string {
  try {
    if (typeof import.meta.url !== 'undefined') {
      const currentDir = dirname(fileURLToPath(import.meta.url));
      const packagePath = join(currentDir, '../../package.json');
      return getVersion(packagePath);
    }
    const packagePath = join(process.cwd(), 'package.json');
    return getVersion(packagePath);
  } catch {
    return '0.0.0';
  }
}

/**
 * Show plugin branding footer
 * @param pluginName - Name of the plugin (e.g., 'Image', 'Video', 'Audio')
 */
export function showPluginBranding(pluginName: string): void {
  const version = getPluginVersion();
  console.log('\n' + '─'.repeat(60));
  console.log(`  💙 ${pluginName} Plugin v${version} · Powered by MediaProc`);
  console.log('  📚 Documentation: \x1b[36mhttps://docs-mediaproc.vercel.app/\x1b[0m');
  console.log('  ⭐ Star us: \x1b[36mhttps://github.com/0xshariq/mediaproc-cli\x1b[0m');
  console.log('─'.repeat(60) + '\n');
}
