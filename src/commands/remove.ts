import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';
import type { PluginManager } from '../plugin-manager.js';

/**
 * Check if a plugin is installed globally
 */
async function isPluginGlobal(pluginName: string): Promise<boolean> {
  try {
    // Try npm list -g
    const { stdout } = await execa('npm', ['list', '-g', '--depth=0', pluginName], { 
      stdio: 'pipe',
      reject: false 
    });
    return stdout.includes(pluginName);
  } catch {}
  
  try {
    // Try pnpm list -g
    const { stdout } = await execa('pnpm', ['list', '-g', '--depth=0', pluginName], { 
      stdio: 'pipe',
      reject: false 
    });
    return stdout.includes(pluginName);
  } catch {}
  
  return false;
}

export function removeCommand(program: Command, pluginManager: PluginManager): void {
  program
    .command('remove <plugin>')
    .alias('rm')
    .description('Uninstall a mediaproc plugin')
    .option('-g, --global', 'Force global uninstall')
    .option('-l, --local', 'Force local uninstall')
    .action(async (plugin: string, options: { global?: boolean; local?: boolean }) => {
      const spinner = ora(`Removing ${chalk.cyan(plugin)}...`).start();

      try {
        // Ensure plugin name is properly formatted
        const pluginName = plugin.startsWith('@mediaproc/') 
          ? plugin 
          : `@mediaproc/${plugin}`;
        
        // Check if plugin is loaded and is marked as built-in (shouldn't happen, but safety check)
        const pluginInstance = pluginManager.getPlugin(pluginName);
        if (pluginInstance?.isBuiltIn) {
          spinner.fail(chalk.red(`Cannot remove plugin: ${chalk.cyan(plugin)}`));
          console.log(chalk.dim('This plugin is marked as built-in and cannot be removed'));
          process.exit(1);
        }

        // Check if plugin is currently loaded
        const wasLoaded = pluginManager.isPluginLoaded(pluginName);
        if (wasLoaded) {
          spinner.info(chalk.dim(`Unloading plugin ${pluginName}...`));
          pluginManager.unloadPlugin(pluginName);
          spinner.start(`Removing ${chalk.cyan(pluginName)}...`);
        }

        // Determine installation scope
        let uninstallGlobally = false;
        if (options.global) {
          uninstallGlobally = true;
        } else if (options.local) {
          uninstallGlobally = false;
        } else {
          // Auto-detect: check if plugin is installed globally
          spinner.text = 'Detecting installation scope...';
          uninstallGlobally = await isPluginGlobal(pluginName);
          spinner.text = `Removing ${chalk.cyan(pluginName)}${uninstallGlobally ? ' (global)' : ' (local)'}...`;
        }

        // Determine package manager (prefer pnpm, fallback to npm)
        let packageManager = 'pnpm';
        try {
          await execa('pnpm', ['--version'], { stdio: 'pipe' });
        } catch {
          packageManager = 'npm';
        }

        // Build uninstall command
        const args: string[] = [];
        if (packageManager === 'pnpm') {
          args.push('remove');
          if (uninstallGlobally) args.push('-g');
        } else {
          args.push('uninstall');
          if (uninstallGlobally) args.push('-g');
        }
        args.push(pluginName);
        
        // Set working directory for local uninstalls
        const uninstallOptions: any = {
          stdio: 'pipe',
          reject: false
        };
        
        if (!uninstallGlobally) {
          uninstallOptions.cwd = process.cwd();
        }
        
        await execa(packageManager, args, uninstallOptions);

        const scope = uninstallGlobally ? 'globally' : 'locally';
        spinner.succeed(chalk.green(`✓ Successfully removed ${pluginName} (${scope})`));
        
        // Update config to remove from installed and loaded
        const configManager = pluginManager.getConfigManager();
        configManager.removeInstalledPlugin(pluginName);
        
        if (wasLoaded) {
          console.log(chalk.green('✓ Plugin unloaded and cleaned up'));
        }
        
        console.log(chalk.dim(`\nPlugin has been completely removed ${scope}`));
        console.log(chalk.dim('View remaining plugins: ') + chalk.white('mediaproc list'));

      } catch (error) {
        spinner.fail(chalk.red(`Failed to remove ${plugin}`));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(errorMessage));
        process.exit(1);
      }
    });
}
