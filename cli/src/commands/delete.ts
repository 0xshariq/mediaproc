import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import type { Command } from 'commander';
import { PluginManager } from '../plugin-manager';
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
function detectPluginInfo(plugin: string, pluginManager: PluginManager): PluginInfo {
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

  // Check if it's a short name for official plugin using plugin manager
  if (!plugin.includes('/') && !plugin.includes('-')) {
    const fullName = `${pluginManager.getPluginPrefix()}${plugin}`;
    return {
      name: fullName,
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
  } catch { }

  try {
    execSync('pnpm --version', { stdio: 'ignore' });
    return 'pnpm';
  } catch { }

  try {
    execSync('yarn --version', { stdio: 'ignore' });
    return 'yarn';
  } catch { }

  try {
    execSync('deno --version', { stdio: 'ignore' });
    return 'deno';
  } catch { }

  return 'npm';
}

/**
 * Check if plugin is installed
 */
function isPluginInstalled(packageName: string, isGlobal: boolean): boolean {
  try {
    const packageManager = detectPackageManager();
    let cmd: string;

    if (packageManager === 'npm') {
      cmd = isGlobal
        ? `npm list -g ${packageName} --depth=0`
        : `npm list ${packageName} --depth=0`;
    } else if (packageManager === 'pnpm') {
      cmd = isGlobal
        ? `pnpm list -g ${packageName} --depth=0`
        : `pnpm list ${packageName} --depth=0`;
    } else if (packageManager === 'yarn') {
      cmd = isGlobal
        ? `yarn global list --pattern ${packageName}`
        : `yarn list --pattern ${packageName}`;
    } else if (packageManager === 'bun') {
      cmd = isGlobal
        ? `bun pm ls -g | grep ${packageName}`
        : `bun pm ls | grep ${packageName}`;
    } else if (packageManager === 'deno') {
      // Deno doesn't have traditional global/local installs
      return false;
    } else {
      return false;
    }

    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete/remove a plugin
 */
export function deleteCommand(program: Command, pluginManager: PluginManager): void {
  program
    .command('delete <plugin>')
    .alias('uninstall')
    .description('Delete/uninstall a plugin')
    .option('-g, --global', 'Delete plugin globally')
    .option('-l, --local', 'Delete plugin locally')
    .option('--verbose', 'Show detailed output')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (plugin: string, options: {
      global?: boolean;
      local?: boolean;
      verbose?: boolean;
      yes?: boolean;
    }) => {
      const spinner = ora('Starting deletion...').start();

      try {
        const pluginInfo = detectPluginInfo(plugin, pluginManager);
        const packageManager = detectPackageManager();

        if (options.verbose) {
          spinner.info(chalk.dim(`Package manager: ${packageManager}`));
        }

        spinner.text = `Detecting plugin type for ${chalk.cyan(pluginInfo.displayName)}...`;

        // Verify plugin type using plugin manager
        const isOfficial = pluginManager.isOfficialPlugin(pluginInfo.name);
        if (options.verbose) {
          spinner.info(chalk.dim(`Plugin type: ${getPluginTypeBadge(pluginInfo.type)}`));
          spinner.info(chalk.dim(`Package name: ${pluginInfo.name}`));
          spinner.info(chalk.dim(`Official plugin: ${isOfficial ? 'Yes' : 'No'}`));
        }

        // Determine installation scope
        let isGlobal = false;
        if (options.global) {
          isGlobal = true;
        } else if (options.local) {
          isGlobal = false;
        } else {
          // Auto-detect installation scope
          spinner.text = 'Detecting installation scope...';
          const installedGlobally = isPluginInstalled(pluginInfo.name, true);
          const installedLocally = isPluginInstalled(pluginInfo.name, false);

          if (installedGlobally && installedLocally) {
            spinner.fail(chalk.yellow('⚠ Plugin found in both global and local scope'));
            console.log(chalk.dim('Please specify:'));
            console.log(chalk.white('  mediaproc delete ' + plugin + ' --global') + chalk.dim('  # Delete globally'));
            console.log(chalk.white('  mediaproc delete ' + plugin + ' --local') + chalk.dim('   # Delete locally'));
            process.exit(1);
          } else if (installedGlobally) {
            isGlobal = true;
          } else if (installedLocally) {
            isGlobal = false;
          } else {
            spinner.fail(chalk.red(`✗ Plugin ${chalk.cyan(pluginInfo.displayName)} is not installed`));
            console.log(chalk.dim('\nCheck installed plugins: ') + chalk.white('mediaproc list'));
            process.exit(1);
          }
        }

        const scope = isGlobal ? 'globally' : 'locally';
        spinner.succeed(chalk.green(`✓ Found ${pluginInfo.displayName} ${getPluginTypeBadge(pluginInfo.type)} installed ${scope}`));

        // Confirmation (unless --yes flag is provided)
        if (!options.yes) {
          console.log(chalk.yellow('\n⚠ You are about to delete:'));
          console.log(chalk.white(`  Plugin: ${pluginInfo.name} ${getPluginTypeBadge(pluginInfo.type)}`));
          console.log(chalk.white(`  Scope: ${scope}`));
          console.log(chalk.dim('\nPress Ctrl+C to cancel, or run with --yes to skip confirmation\n'));

          // Wait 2 seconds for user to cancel
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        spinner.start(`Deleting ${chalk.cyan(pluginInfo.displayName)} ${getPluginTypeBadge(pluginInfo.type)} (${scope})...`);

        // Build the delete command
        let deleteCmd: string;

        if (packageManager === 'npm') {
          deleteCmd = isGlobal
            ? `npm uninstall -g ${pluginInfo.name}`
            : `npm uninstall ${pluginInfo.name}`;
        } else if (packageManager === 'pnpm') {
          deleteCmd = isGlobal
            ? `pnpm remove -g ${pluginInfo.name}`
            : `pnpm remove ${pluginInfo.name}`;
        } else if (packageManager === 'yarn') {
          deleteCmd = isGlobal
            ? `yarn global remove ${pluginInfo.name}`
            : `yarn remove ${pluginInfo.name}`;
        } else if (packageManager === 'bun') {
          deleteCmd = isGlobal
            ? `bun remove -g ${pluginInfo.name}`
            : `bun remove ${pluginInfo.name}`;
        } else if (packageManager === 'deno') {
          spinner.fail(chalk.red('Deno package management is not supported for plugin deletion'));
          process.exit(1);
        } else {
          throw new Error('Unknown package manager');
        }

        if (options.verbose) {
          spinner.info(chalk.dim(`Running: ${deleteCmd}`));
        }

        // Execute the delete command
        execSync(deleteCmd, {
          stdio: options.verbose ? 'inherit' : 'ignore',
          cwd: isGlobal ? undefined : process.cwd()
        });

        // Unload plugin from memory if it was loaded
        if (pluginManager.getLoadedPlugins().includes(pluginInfo.name)) {
          pluginManager.unloadPlugin(pluginInfo.name);
          if (options.verbose) {
            spinner.info(chalk.dim(`Unloaded ${pluginInfo.name} from memory`));
          }
        }

        spinner.succeed(
          chalk.green(`✓ ${pluginInfo.displayName} ${getPluginTypeBadge(pluginInfo.type)} deleted successfully (${scope})`)
        );

        console.log(chalk.dim('\n💡 View remaining plugins: ') + chalk.white('mediaproc list'));
        showBranding();
      } catch (error) {
        spinner.fail(chalk.red('Failed to delete plugin'));
        if (error instanceof Error) {
          console.error(chalk.red(`Error: ${error.message}`));
        }
        process.exit(1);
      }
    });
}
