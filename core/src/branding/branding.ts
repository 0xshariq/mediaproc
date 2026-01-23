import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Get plugin version from package.json
 * @param packageJsonPath - Path to the package json file
 */
export function getVersion(packageJsonPath: string): string {
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * Get CLI version from root package.json
 * @param packageJsonPath - Path to the package json file
 */
export function getCliVersion(packageJsonPath: string): string {
  try {
    // For ES modules, use import.meta.url
    if (typeof import.meta.url !== 'undefined') {
      const currentDir = dirname(fileURLToPath(import.meta.url));
      const packagePath = join(currentDir, packageJsonPath);
      return getVersion(packagePath);
    }
    // Fallback: try from process.cwd()
    const packagePath = join(process.cwd(), packageJsonPath);
    return getVersion(packagePath);
  } catch {
    return '0.6.0'; // Fallback version
  }
}

/**
 * Show CLI branding footer with documentation and GitHub links
 * @param packageJsonPath - Path to main cli's package json
 */
export function showBranding(packageJsonPath: string): void {
  const version = getCliVersion(packageJsonPath);
  console.log('\n' + '─'.repeat(60));
  console.log(`  💙 Powered by MediaProc CLI v${version}`);
  console.log('  📚 Documentation: \x1b[36mhttps://docs-mediaproc.vercel.app/\x1b[0m');
  console.log('  ⭐ Star us: \x1b[36mhttps://github.com/0xshariq/mediaproc\x1b[0m');
  console.log('─'.repeat(60) + '\n');
}

/**
 * Show plugin branding footer with version
 * @param pluginName - Name of the plugin (e.g., 'image', 'video', 'audio')
 * @param pluginPackageJsonPath - Path to plugin's package.json
 */
export function showPluginBranding(pluginName: string, pluginPackageJsonPath: string): void {
  const version = getVersion(pluginPackageJsonPath);
  console.log('\n' + '─'.repeat(60));
  console.log(`  💙 ${pluginName.charAt(0).toUpperCase() + pluginName.slice(1)} Plugin v${version} · Powered by MediaProc`);
  console.log('  📚 Documentation: \x1b[36mhttps://docs-mediaproc.vercel.app/\x1b[0m');
  console.log('  ⭐ Star us: \x1b[36mhttps://github.com/0xshariq/mediaproc\x1b[0m');
  console.log('─'.repeat(60) + '\n');
}

