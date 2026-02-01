import { execa } from 'execa';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'deno';

/**
 * Detect available package managers
 * Checks in preferred order: pnpm > bun > yarn > npm > deno
 * @returns Detected package manager, defaults to 'npm' if none found
 */
export async function detectPackageManager(): Promise<PackageManager> {
  const managers: PackageManager[] = ['pnpm', 'bun', 'yarn', 'npm', 'deno'];

  for (const manager of managers) {
    try {
      // Set timeout to avoid hanging on slow systems
      const { stdout } = await execa(manager, ['--version'], { 
        stdio: 'pipe',
        timeout: 5000,
        reject: false
      });
      
      // Verify we got valid output
      if (stdout && stdout.trim()) {
        return manager;
      }
    } catch (error) {
      // Continue to next manager if this one fails
      continue;
    }
  }

  // Always fallback to npm (should be available on most systems)
  return 'npm';
}

/**
 * Check if CLI is running from a global installation
 */
export async function isGlobalInstall(): Promise<boolean> {
  const execPath = process.argv[1];

  // Check common global paths
  const globalPaths = [
    '/usr/local',
    '/usr/lib',
    '/.nvm/',
    '/.npm-global/',
    '/.npm/',
    '/AppData/Roaming/npm',
    '/pnpm-global/',
    '/.bun/install/global',
    '/.yarn/global'
  ];

  if (globalPaths.some(p => execPath.includes(p))) {
    return true;
  }

  return false;
}

/**
 * Check if a plugin is installed globally
 * @param pluginName - Full plugin package name
 * @returns true if plugin is installed globally, false otherwise
 */
export async function isPluginGlobal(pluginName: string): Promise<boolean> {
  if (!pluginName || typeof pluginName !== 'string') {
    return false;
  }

  const trimmed = pluginName.trim();
  if (!trimmed) {
    return false;
  }

  // Try npm list -g
  try {
    const { stdout } = await execa('npm', ['list', '-g', '--depth=0', trimmed], {
      stdio: 'pipe',
      reject: false,
      timeout: 10000
    });
    if (stdout && stdout.includes(trimmed)) {
      return true;
    }
  } catch { 
    // Continue to next check
  }

  // Try pnpm list -g
  try {
    const { stdout } = await execa('pnpm', ['list', '-g', '--depth=0', trimmed], {
      stdio: 'pipe',
      reject: false,
      timeout: 10000
    });
    if (stdout && stdout.includes(trimmed)) {
      return true;
    }
  } catch { 
    // Continue to next check
  }

  // Try yarn global list
  try {
    const { stdout } = await execa('yarn', ['global', 'list'], {
      stdio: 'pipe',
      reject: false,
      timeout: 10000
    });
    if (stdout && stdout.includes(trimmed)) {
      return true;
    }
  } catch { 
    // All checks failed
  }

  return false;
}

/**
 * Build package manager installation arguments
 * @param packageManager - The package manager to use
 * @param pluginNames - Plugin name(s) to install (string or array)
 * @param options - Installation options
 */
export function buildInstallArgs(
  packageManager: PackageManager,
  pluginNames: string | string[],
  options: {
    global?: boolean;
    saveDev?: boolean;
  } = {}
): string[] {
  const args: string[] = [];
  const names = Array.isArray(pluginNames) ? pluginNames : [pluginNames];

  switch (packageManager) {
    case 'pnpm':
      args.push('add');
      if (options.global) args.push('-g');
      else if (options.saveDev) args.push('-D');
      break;
    case 'bun':
      args.push('add');
      if (options.global) args.push('-g');
      else if (options.saveDev) args.push('-d');
      break;
    case 'yarn':
      if (options.global) {
        args.push('global', 'add');
      } else {
        args.push('add');
        if (options.saveDev) args.push('--dev');
      }
      break;
    case 'deno':
      // Deno doesn't need traditional installation
      return [];
    default: // npm
      args.push('install');
      if (options.global) args.push('-g');
      else if (options.saveDev) args.push('--save-dev');
  }

  args.push(...names);
  return args;
}

/**
 * Build package manager uninstall arguments
 * @param packageManager - The package manager to use
 * @param pluginNames - Plugin name(s) to uninstall (string or array)
 * @param options - Uninstallation options
 */
export function buildUninstallArgs(
  packageManager: PackageManager,
  pluginNames: string | string[],
  options: {
    global?: boolean;
  } = {}
): string[] {
  const args: string[] = [];
  const names = Array.isArray(pluginNames) ? pluginNames : [pluginNames];

  switch (packageManager) {
    case 'pnpm':
      args.push('remove');
      if (options.global) args.push('-g');
      break;
    case 'yarn':
      if (options.global) {
        args.push('global', 'remove');
      } else {
        args.push('remove');
      }
      break;
    case 'bun':
      args.push('remove');
      if (options.global) args.push('-g');
      break;
    case 'deno':
      // Deno doesn't have traditional uninstall
      return [];
    default: // npm
      args.push('uninstall');
      if (options.global) args.push('-g');
  }

  args.push(...names);
  return args;
}
