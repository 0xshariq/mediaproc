import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';
import { resolvePluginPackage, PLUGIN_REGISTRY, detectPluginType } from '../plugin-registry.js';
import type { PluginManager } from '../plugin-manager.js';
import { showBranding } from '@mediaproc/core';

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'deno';

/**
 * Detect available package managers
 */
async function detectPackageManager(): Promise<PackageManager> {
  const managers: PackageManager[] = ['pnpm', 'bun', 'yarn', 'npm', 'deno'];

  for (const manager of managers) {
    try {
      await execa(manager, ['--version'], { stdio: 'pipe' });
      return manager;
    } catch {
      continue;
    }
  }

  return 'npm'; // Fallback
}

/**
 * Check if CLI is running from a global installation
 */
async function isGlobalInstall(): Promise<boolean> {
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
        if (pluginManager.getPlugin(pluginName)) {
          ora().succeed(chalk.green(`✓ Plugin ${chalk.cyan(pluginName)} is already loaded`));
          console.log(chalk.dim(`Use: ${chalk.white(`mediaproc ${plugin.replace('@mediaproc/', '')} <command>`)}`));
          return;
        }

        // Try loading if already installed
        try {
          await pluginManager.loadPlugin(pluginName, program);
          ora().succeed(chalk.green(`✓ Plugin ${pluginName} loaded successfully`));
          console.log(chalk.dim(`Use: ${chalk.white(`mediaproc ${plugin.replace('@mediaproc/', '')} <command>`)}`));
          return;
        } catch {
          // Not installed, proceed with installation
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
        const args: string[] = [];

        switch (packageManager) {
          case 'pnpm':
            args.push('add');
            if (installGlobally) args.push('-g');
            else if (options.saveDev) args.push('-D');
            break;
          case 'bun':
            args.push('add');
            if (installGlobally) args.push('-g');
            else if (options.saveDev) args.push('-d');
            break;
          case 'yarn':
            args.push('add');
            if (installGlobally) args.push('global');
            else if (options.saveDev) args.push('--dev');
            break;
          case 'deno':
            // Deno doesn't need traditional installation
            spinner.warn(chalk.yellow('Deno detected - plugins work via npm: specifiers'));
            return;
          default:
            args.push('install');
            if (installGlobally) args.push('-g');
            else if (options.saveDev) args.push('--save-dev');
        }

        args.push(pluginName);

        // Execute
        await execa(packageManager, args, {
          stdio: 'inherit',
          cwd: installGlobally ? undefined : process.cwd()
        });

        spinner.succeed(chalk.green(`✓ Installed ${pluginName}`));

        const scope = installGlobally ? 'globally' : 'locally';
        console.log(chalk.dim(`Installed ${scope} using ${packageManager}`));

        // Load the plugin
        const loadSpinner = ora('Loading plugin...').start();
        try {
          await pluginManager.loadPlugin(pluginName, program);
          loadSpinner.succeed(chalk.green('✓ Plugin loaded and ready'));
          console.log(chalk.dim(`Use: ${chalk.white(`mediaproc ${plugin.replace('@mediaproc/', '')} <command>`)}`));
        } catch (loadError) {
          loadSpinner.warn(chalk.yellow('Plugin installed but needs restart to load'));
          console.log(chalk.dim('Run your command again or restart terminal'));
        }

        // Show example commands
        if (registryEntry) {
          console.log(chalk.dim('\nExample commands:'));
          const shortName = registryEntry.name;

          // Show category-specific examples
          switch (registryEntry.package) {
            case '@mediaproc/image':
              console.log(chalk.dim(`  mediaproc ${shortName} resize photo.jpg -w 800`));
              console.log(chalk.dim(`  mediaproc ${shortName} convert image.png --format webp`));
              break;
            case '@mediaproc/video':
              console.log(chalk.dim(`  mediaproc ${shortName} compress movie.mp4 --quality high`));
              console.log(chalk.dim(`  mediaproc ${shortName} transcode video.avi --format mp4`));
              break;
            case '@mediaproc/audio':
              console.log(chalk.dim(`  mediaproc ${shortName} convert song.wav --format mp3`));
              console.log(chalk.dim(`  mediaproc ${shortName} normalize audio.mp3`));
              break;
            case '@mediaproc/document':
              console.log(chalk.dim(`  mediaproc ${shortName} compress report.pdf --quality ebook`));
              console.log(chalk.dim(`  mediaproc ${shortName} ocr scanned.pdf`));
              break;
            case '@mediaproc/animation':
              console.log(chalk.dim(`  mediaproc ${shortName} gifify video.mp4 --fps 15`));
              break;
            case '@mediaproc/3d':
              console.log(chalk.dim(`  mediaproc ${shortName} optimize model.glb`));
              console.log(chalk.dim(`  mediaproc ${shortName} compress textures/`));
              break;
            case '@mediaproc/metadata':
              console.log(chalk.dim(`  mediaproc ${shortName} inspect video.mp4`));
              console.log(chalk.dim(`  mediaproc ${shortName} strip-metadata image.jpg`));
              break;
            case '@mediaproc/stream':
              console.log(chalk.dim(`  mediaproc ${shortName} pack video.mp4 --hls`));
              break;
            case '@mediaproc/ai':
              console.log(chalk.dim(`  mediaproc ${shortName} blur-faces video.mp4`));
              console.log(chalk.dim(`  mediaproc ${shortName} caption audio.wav`));
              break;
            case '@mediaproc/pipeline':
              console.log(chalk.dim(`  mediaproc ${shortName} run workflow.yaml`));
              break;
          }
        }
        showBranding();
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
