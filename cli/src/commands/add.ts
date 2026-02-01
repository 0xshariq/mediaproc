import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';
import {
  resolvePluginPackage,
  PLUGIN_REGISTRY,
  detectPluginType,
  type PluginManager,
  detectPackageManager,
  isGlobalInstall,
  buildInstallArgs,
  verifyPluginInstallation,
  loadPluginSafe,
  isPluginLoaded,
  getPluginCommand,
  getPluginExamples
} from '../utils/index.js';

export function addCommand(program: Command, pluginManager: PluginManager): void {
  program
    .command('add <plugin>')
    .alias('install')
    .description('Install a mediaproc plugin')
    .option('-g, --global', 'Force global installation')
    .option('-l, --local', 'Force local installation')
    .option('--save-dev', 'Save as dev dependency (local only)')
    .action(async (plugin: string, options: { global?: boolean; local?: boolean; saveDev?: boolean }) => {
      try {
        // Resolve plugin name
        const pluginName = resolvePluginPackage(plugin);
        const registryEntry = Object.values(PLUGIN_REGISTRY).find(e => e.package === pluginName);

        // Check if already loaded
        if (isPluginLoaded(pluginName, pluginManager)) {
          ora().succeed(chalk.green(`✓ Plugin ${chalk.cyan(pluginName)} is already loaded`));
          console.log(chalk.dim(`Use: ${chalk.white(`mediaproc ${getPluginCommand(pluginName)} <command>`)}`));
          return;
        }

        // Try loading if already installed
        const initialLoadResult = await loadPluginSafe(pluginName, program, pluginManager);
        if (initialLoadResult.success) {
          ora().succeed(chalk.green(`✓ Plugin ${pluginName} loaded successfully`));
          console.log(chalk.dim(`Use: ${chalk.white(`mediaproc ${getPluginCommand(pluginName)} <command>`)}`));
          return;
        }

        const spinner = ora(`Installing ${chalk.cyan(pluginName)}...`).start();

        // Detect plugin type
        const pluginType = detectPluginType(pluginName);
        const typeLabel = pluginType === 'official' ? chalk.blue('★ OFFICIAL')
          : pluginType === 'community' ? chalk.green('🌐 COMMUNITY')
            : chalk.yellow('📦 THIRD-PARTY');

        // Show plugin info
        if (registryEntry) {
          spinner.info(chalk.dim(`Type: ${typeLabel}`));
          spinner.info(chalk.dim(`Description: ${registryEntry.description}`));
          if (registryEntry.systemRequirements && registryEntry.systemRequirements.length > 0) {
            spinner.info(chalk.yellow(`System requirements: ${registryEntry.systemRequirements.join(', ')}`));
          }
        } else {
          // Not in registry - show type
          spinner.info(chalk.dim(`Type: ${typeLabel}`));
          if (pluginType === 'third-party') {
            spinner.info(chalk.yellow(`Warning: Third-party plugin not in official registry`));
          }
        }
        spinner.start(`Installing ${chalk.cyan(pluginName)}...`);

        // Determine scope
        let installGlobally = options.global ? true : options.local ? false : await isGlobalInstall();

        // Detect package manager
        const packageManager = await detectPackageManager();

        // Build command args
        const args = buildInstallArgs(packageManager, [pluginName], {
          global: installGlobally,
          saveDev: options.saveDev
        });

        // Handle Deno
        if (args.length === 0 && packageManager === 'deno') {
          spinner.warn(chalk.yellow('Deno detected - plugins work via npm: specifiers'));
          return;
        }

        // Execute installation with proper error handling
        try {
          await execa(packageManager, args, {
            stdio: 'inherit',
            cwd: installGlobally ? undefined : process.cwd(),
            timeout: 120000 // 2 minute timeout
          });
        } catch (installError) {
          spinner.fail(chalk.red(`Failed to install ${pluginName}`));
          const errorMessage = installError instanceof Error ? installError.message : String(installError);
          console.error(chalk.red(errorMessage));
          
          // Provide helpful troubleshooting tips
          if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
            console.log(chalk.yellow('\n💡 Try running with sudo or check file permissions'));
          } else if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
            console.log(chalk.yellow('\n💡 Network timeout - check your internet connection and try again'));
          } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
            console.log(chalk.yellow(`\n💡 Package "${pluginName}" not found - check the name and try again`));
          }
          
          process.exit(1);
        }

        spinner.succeed(chalk.green(`✓ Installed ${pluginName}`));

        const scope = installGlobally ? 'globally' : 'locally';
        console.log(chalk.dim(`Installed ${scope} using ${packageManager}`));

        // Verify installation before loading
        const isInstalled = await verifyPluginInstallation(pluginName);
        if (!isInstalled) {
          console.log(chalk.yellow('\n⚠️  Plugin installed but may require terminal restart'));
          console.log(chalk.dim('Try running your command again or restart terminal'));
          return;
        }

        // Load the plugin
        const loadSpinner = ora('Loading plugin...').start();
        const loadResult = await loadPluginSafe(pluginName, program, pluginManager);
        
        if (loadResult.success) {
          loadSpinner.succeed(chalk.green('✓ Plugin loaded and ready'));
          console.log(chalk.dim(`Use: ${chalk.white(`mediaproc ${getPluginCommand(pluginName)} <command>`)}`));
        } else {
          loadSpinner.warn(chalk.yellow('Plugin installed but needs restart to load'));
          console.log(chalk.dim('Run your command again or restart terminal'));
        }

        // Show example commands
        if (registryEntry) {
          const examples = getPluginExamples(registryEntry.package);
          if (examples.length > 0) {
            console.log(chalk.dim('\nExample commands:'));
            const shortName = getPluginCommand(pluginName);
            examples.slice(0, 3).forEach(example => {
              console.log(chalk.dim(`  mediaproc ${shortName} ${example}`));
            });
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('Unknown plugin')) {
          console.error(chalk.red(`\n${error.message}`));
        } else {
          console.error(chalk.red(`\nFailed to install ${plugin}`));
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(chalk.red(errorMessage));
        }
        process.exit(1);
      }
    });
}
