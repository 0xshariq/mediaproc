import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import type { Command } from 'commander';
import { showBranding } from '@mediaproc/core';

/**
 * Plugin type detection
 */
type PluginType = 'official' | 'community' | 'third-party';

interface PluginInfo {
  name: string;
  type: PluginType;
  displayName: string;
}

/**
 * Detect plugin type and return full package name
 */
function detectPluginInfo(plugin: string): PluginInfo {
  // Official plugin (@mediaproc/*)
  if (plugin.startsWith('@mediaproc/')) {
    return {
      name: plugin,
      type: 'official',
      displayName: plugin.replace('@mediaproc/', ''),
    };
  }

  // Community plugin (mediaproc-*)
  if (plugin.startsWith('mediaproc-')) {
    return {
      name: plugin,
      type: 'community',
      displayName: plugin,
    };
  }

  // Check if it's a short name for official plugin
  if (!plugin.includes('/') && !plugin.includes('-')) {
    return {
      name: `@mediaproc/${plugin}`,
      type: 'official',
      displayName: plugin,
    };
  }

  // Third-party plugin (any other package)
  return {
    name: plugin,
    type: 'third-party',
    displayName: plugin,
  };
}

/**
 * Get plugin type badge for display
 */
function getPluginTypeBadge(type: PluginType): string {
  switch (type) {
    case 'official':
      return chalk.blue('★ OFFICIAL');
    case 'community':
      return chalk.green('◆ COMMUNITY');
    case 'third-party':
      return chalk.yellow('◇ THIRD-PARTY');
  }
}

/**
 * Detect which package manager is being used
 */
function detectPackageManager(): string {
  try {
    execSync('bun --version', { stdio: 'ignore' });
    return 'bun';
  } catch {}

  try {
    execSync('pnpm --version', { stdio: 'ignore' });
    return 'pnpm';
  } catch {}

  try {
    execSync('yarn --version', { stdio: 'ignore' });
    return 'yarn';
  } catch {}

  return 'npm';
}

/**
 * Get current installed version of a package
 */
function getInstalledVersion(packageName: string, isGlobal: boolean): string | null {
  try {
    const packageManager = detectPackageManager();
    let cmd: string;

    if (packageManager === 'npm') {
      cmd = isGlobal
        ? `npm list -g ${packageName} --depth=0 --json`
        : `npm list ${packageName} --depth=0 --json`;
    } else if (packageManager === 'pnpm') {
      cmd = isGlobal
        ? `pnpm list -g ${packageName} --depth=0 --json`
        : `pnpm list ${packageName} --depth=0 --json`;
    } else if (packageManager === 'yarn') {
      cmd = isGlobal
        ? `yarn global list --pattern ${packageName} --json`
        : `yarn list --pattern ${packageName} --json`;
    } else {
      return null;
    }

    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    const data = JSON.parse(output);
    
    if (data.dependencies && data.dependencies[packageName]) {
      return data.dependencies[packageName].version;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Update a plugin to the latest version or specific version
 */
export function updateCommand(program: Command): void {
  program
    .command('update [plugin]')
    .description('Update plugin(s) to the latest or specific version')
    .option('-g, --global', 'Update plugin globally')
    .option('-v, --version <version>', 'Update to specific version (e.g., 1.2.3, latest)')
    .option('--verbose', 'Show detailed output')
    .action(async (plugin: string | undefined, options: { 
      global?: boolean; 
      version?: string;
      verbose?: boolean;
    }) => {
      const spinner = ora('Starting update...').start();

      try {
        const packageManager = detectPackageManager();
        const isGlobal = options.global;
        const targetVersion = options.version || 'latest';

        if (options.verbose) {
          spinner.info(chalk.dim(`Package manager: ${packageManager}`));
        }

        // Update specific plugin
        if (plugin) {
          const pluginInfo = detectPluginInfo(plugin);
          
          spinner.text = `Detecting plugin type for ${chalk.cyan(pluginInfo.displayName)}...`;
          
          if (options.verbose) {
            spinner.info(chalk.dim(`Plugin type: ${getPluginTypeBadge(pluginInfo.type)}`));
            spinner.info(chalk.dim(`Package name: ${pluginInfo.name}`));
          }

          // Get current version
          const currentVersion = getInstalledVersion(pluginInfo.name, isGlobal || false);
          
          if (currentVersion && options.verbose) {
            spinner.info(chalk.dim(`Current version: ${currentVersion}`));
          }

          spinner.text = `Updating ${chalk.cyan(pluginInfo.displayName)} ${getPluginTypeBadge(pluginInfo.type)}...`;

          // Build the update command
          const versionSpec = targetVersion === 'latest' ? pluginInfo.name : `${pluginInfo.name}@${targetVersion}`;
          let updateCmd: string;
          
          if (packageManager === 'npm') {
            updateCmd = isGlobal
              ? `npm install -g ${versionSpec}`
              : `npm install ${versionSpec}`;
          } else if (packageManager === 'pnpm') {
            updateCmd = isGlobal
              ? `pnpm add -g ${versionSpec}`
              : `pnpm add ${versionSpec}`;
          } else if (packageManager === 'yarn') {
            updateCmd = isGlobal
              ? `yarn global add ${versionSpec}`
              : `yarn add ${versionSpec}`;
          } else if (packageManager === 'bun') {
            updateCmd = isGlobal
              ? `bun add -g ${versionSpec}`
              : `bun add ${versionSpec}`;
          } else {
            throw new Error('Unknown package manager');
          }

          if (options.verbose) {
            spinner.info(chalk.dim(`Running: ${updateCmd}`));
          }

          // Execute the update command
          execSync(updateCmd, { stdio: options.verbose ? 'inherit' : 'ignore' });

          // Get new version
          const newVersion = getInstalledVersion(pluginInfo.name, isGlobal || false);
          
          spinner.succeed(
            chalk.green(`✓ ${pluginInfo.displayName} ${getPluginTypeBadge(pluginInfo.type)} updated successfully`) +
            (currentVersion && newVersion ? chalk.dim(` (${currentVersion} → ${newVersion})`) : '')
          );

        } else {
          // Update all plugins
          spinner.text = 'Finding all installed MediaProc plugins...';

          if (options.verbose) {
            spinner.info(chalk.dim('Scanning for official, community, and third-party plugins...'));
          }

          // Build update command for all @mediaproc packages
          let updateCmd: string;
          
          if (packageManager === 'npm') {
            updateCmd = isGlobal
              ? 'npm update -g $(npm list -g --depth=0 --parseable 2>/dev/null | xargs -n1 basename 2>/dev/null | grep -E "^@mediaproc|^mediaproc-")'
              : 'npm update';
          } else if (packageManager === 'pnpm') {
            updateCmd = isGlobal
              ? 'pnpm update -g "@mediaproc/*" "mediaproc-*"'
              : 'pnpm update "@mediaproc/*" "mediaproc-*"';
          } else if (packageManager === 'yarn') {
            updateCmd = isGlobal
              ? 'yarn global upgrade'
              : 'yarn upgrade';
          } else if (packageManager === 'bun') {
            updateCmd = isGlobal
              ? 'bun update -g'
              : 'bun update';
          } else {
            throw new Error('Unknown package manager');
          }

          if (options.verbose) {
            spinner.info(chalk.dim(`Running: ${updateCmd}`));
          }

          spinner.text = 'Updating all plugins...';
          execSync(updateCmd, { stdio: options.verbose ? 'inherit' : 'ignore' });

          spinner.succeed(chalk.green('✓ All MediaProc plugins updated successfully'));
        }

        console.log(chalk.dim('\n💡 Tip: Run a command to use the updated version, or restart your terminal.'));
        showBranding();
      } catch (error) {
        spinner.fail(chalk.red('Failed to update plugin(s)'));
        if (error instanceof Error) {
          console.error(chalk.red(`Error: ${error.message}`));
        }
        process.exit(1);
      }
    });
}
