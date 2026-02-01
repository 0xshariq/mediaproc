import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';
import type { Command } from 'commander';
import {
  type PluginManager,
  resolvePluginPackage,
  detectPluginType,
  detectPackageManager,
  buildInstallArgs,
  verifyPluginInstallation
} from '../utils/index.js';

/**
 * Get plugin type badge for display
 */
function getPluginTypeBadge(type: 'official' | 'community' | 'third-party'): string {
  switch (type) {
    case 'official':
      return chalk.blue('★ OFFICIAL');
    case 'community':
      return chalk.green('🌐 COMMUNITY');
    case 'third-party':
      return chalk.yellow('📦 THIRD-PARTY');
  }
}

/**
 * Get current installed version of a package
 */
async function getInstalledVersion(packageName: string, isGlobal: boolean): Promise<string | null> {
  try {
    const packageManager = await detectPackageManager();
    let cmd: string[];

    if (packageManager === 'npm') {
      cmd = ['list', packageName, '--depth=0', '--json'];
      if (isGlobal) cmd.splice(1, 0, '-g');
    } else if (packageManager === 'pnpm') {
      cmd = ['list', packageName, '--depth=0', '--json'];
      if (isGlobal) cmd.splice(1, 0, '-g');
    } else if (packageManager === 'yarn') {
      if (isGlobal) {
        cmd = ['global', 'list', '--pattern', packageName, '--json'];
      } else {
        cmd = ['list', '--pattern', packageName, '--json'];
      }
    } else if (packageManager === 'bun') {
      cmd = ['pm', 'ls', packageName, '--json'];
      if (isGlobal) cmd.push('--global');
    } else {
      return null;
    }

    const { stdout } = await execa(packageManager, cmd, { reject: false });
    const data = JSON.parse(stdout);
    
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
export function updateCommand(program: Command, pluginManager: PluginManager): void {
  const updateCmd = program
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
        const packageManager = await detectPackageManager();
        const isGlobal = options.global || false;
        const targetVersion = options.version || 'latest';

        if (options.verbose) {
          spinner.info(chalk.dim(`Package manager: ${packageManager}`));
        }

        // Update specific plugin
        if (plugin) {
          // Resolve plugin name
          const pluginPackage = resolvePluginPackage(plugin);
          const pluginType = detectPluginType(pluginPackage);
          
          spinner.text = `Detecting plugin type for ${chalk.cyan(plugin)}...`;
          
          if (options.verbose) {
            spinner.info(chalk.dim(`Plugin type: ${getPluginTypeBadge(pluginType)}`));
            spinner.info(chalk.dim(`Package name: ${pluginPackage}`));
          }

          // Get current version
          const currentVersion = await getInstalledVersion(pluginPackage, isGlobal);
          
          if (currentVersion && options.verbose) {
            spinner.info(chalk.dim(`Current version: ${currentVersion}`));
          }

          spinner.text = `Updating ${chalk.cyan(plugin)} ${getPluginTypeBadge(pluginType)}...`;

          // Build the update command
          const versionSpec = targetVersion === 'latest' ? pluginPackage : `${pluginPackage}@${targetVersion}`;
          const updateArgs = buildInstallArgs(packageManager, [versionSpec], {
            global: isGlobal
          });

          if (options.verbose) {
            spinner.info(chalk.dim(`Running: ${packageManager} ${updateArgs.join(' ')}`));
          }

          // Execute the update command
          await execa(packageManager, updateArgs, { 
            stdio: options.verbose ? 'inherit' : 'pipe',
            reject: true
          });

          // Verify installation
          const installed = await verifyPluginInstallation(pluginPackage, isGlobal);
          if (!installed) {
            throw new Error(`Failed to verify ${pluginPackage} installation`);
          }

          // Get new version
          const newVersion = await getInstalledVersion(pluginPackage, isGlobal);

          // Reload the plugin if it was already loaded
          const loadedPlugin = pluginManager.getPlugin(plugin);
          if (loadedPlugin) {
            spinner.text = `Reloading ${chalk.cyan(plugin)}...`;
            await pluginManager.reloadPlugin(plugin, updateCmd.parent!);
            if (options.verbose) {
              spinner.info(chalk.dim('Plugin reloaded successfully'));
            }
          }
          
          spinner.succeed(
            chalk.green(`✓ ${plugin} ${getPluginTypeBadge(pluginType)} updated successfully`) +
            (currentVersion && newVersion ? chalk.dim(` (${currentVersion} → ${newVersion})`) : '')
          );

        } else {
          // Update all loaded plugins
          spinner.text = 'Finding all loaded MediaProc plugins...';

          const loadedPlugins = pluginManager.getLoadedPlugins();
          
          if (loadedPlugins.length === 0) {
            spinner.info(chalk.yellow('No plugins currently loaded'));
            return;
          }

          if (options.verbose) {
            spinner.info(chalk.dim(`Found ${loadedPlugins.length} loaded plugin(s)`));
          }

          const updateResults: Array<{ name: string; success: boolean; error?: string }> = [];

          // Update each loaded plugin
          for (const pluginName of loadedPlugins) {
            try {
              const pluginPackage = resolvePluginPackage(pluginName);
              const pluginType = detectPluginType(pluginPackage);

              spinner.text = `Updating ${chalk.cyan(pluginName)} ${getPluginTypeBadge(pluginType)}...`;

              const currentVersion = await getInstalledVersion(pluginPackage, isGlobal);
              
              const updateArgs = buildInstallArgs(packageManager, [pluginPackage], {
                global: isGlobal
              });
              
              await execa(packageManager, updateArgs, { 
                stdio: 'pipe',
                reject: true
              });

              const installed = await verifyPluginInstallation(pluginPackage, isGlobal);
              if (!installed) {
                throw new Error('Verification failed');
              }

              const newVersion = await getInstalledVersion(pluginPackage, isGlobal);
              
              // Reload the plugin
              await pluginManager.reloadPlugin(pluginName, updateCmd.parent!);

              if (options.verbose) {
                spinner.info(
                  chalk.green(`✓ ${pluginName}`) +
                  (currentVersion && newVersion ? chalk.dim(` (${currentVersion} → ${newVersion})`) : '')
                );
              }

              updateResults.push({ name: pluginName, success: true });
            } catch (error) {
              updateResults.push({ 
                name: pluginName, 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error'
              });

              if (options.verbose) {
                spinner.warn(chalk.yellow(`⚠ ${pluginName} update failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
              }
            }
          }

          // Summary
          const successful = updateResults.filter(r => r.success).length;
          const failed = updateResults.filter(r => !r.success).length;

          if (failed === 0) {
            spinner.succeed(chalk.green(`✓ All ${successful} plugin(s) updated successfully`));
          } else {
            spinner.warn(chalk.yellow(`⚠ Updated ${successful}/${loadedPlugins.length} plugin(s)`));
            
            if (options.verbose) {
              console.log(chalk.red('\nFailed updates:'));
              updateResults.filter(r => !r.success).forEach(r => {
                console.log(chalk.red(`  × ${r.name}: ${r.error}`));
              });
            }
          }
        }

        console.log(chalk.dim('\n💡 Tip: Updated plugins are now active. No restart needed.'));
      } catch (error) {
        spinner.fail(chalk.red('Failed to update plugin(s)'));
        if (error instanceof Error) {
          console.error(chalk.red(`Error: ${error.message}`));
        }
        process.exit(1);
      }
    });
}
