import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { extname } from 'path';
import { existsSync } from 'fs';
import { execa } from 'execa';
import type { PluginManager } from '../plugin-manager.js';
import { resolvePluginPackage } from '../plugin-registry.js';

/**
 * Detect which plugin can handle a file type
 */
function detectPlugin(ext: string): { plugin: string; type: string } | null {
  const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'avif', 'heif', 'svg'];
  const videoExts = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv', 'm4v', 'mpg', 'mpeg'];
  const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus'];
  const documentExts = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'epub'];
  const modelExts = ['gltf', 'glb', 'obj', 'fbx', 'usdz'];

  if (imageExts.includes(ext)) return { plugin: 'image', type: 'image' };
  if (videoExts.includes(ext)) return { plugin: 'video', type: 'video' };
  if (audioExts.includes(ext)) return { plugin: 'audio', type: 'audio' };
  if (documentExts.includes(ext)) return { plugin: 'document', type: 'document' };
  if (modelExts.includes(ext)) return { plugin: '3d', type: '3D model' };
  
  return null;
}

/**
 * Ensure plugin is installed and loaded
 * Uses ora for spinners and execa for package installation
 */
async function ensurePlugin(pluginName: string, pluginManager: PluginManager, program: Command): Promise<boolean> {
  const pluginPackage = resolvePluginPackage(pluginName);
  
  // Check if already loaded
  if (pluginManager.isPluginLoaded(pluginPackage)) {
    return true;
  }
  
  const spinner = ora(`Checking ${chalk.cyan(pluginName)} plugin...`).start();
  
  // Check if installed but not loaded
  if (pluginManager.isPluginInstalled(pluginPackage)) {
    spinner.text = `Loading ${chalk.cyan(pluginPackage)}...`;
    try {
      await pluginManager.loadPlugin(pluginPackage, program);
      spinner.succeed(chalk.green(`✓ Loaded ${pluginName} plugin`));
      return true;
    } catch (error) {
      spinner.fail(chalk.red(`Failed to load ${pluginName} plugin`));
      console.error(chalk.dim(error instanceof Error ? error.message : String(error)));
      return false;
    }
  }
  
  // Not installed - need to install it
  spinner.text = `Installing ${chalk.cyan(pluginPackage)}...`;
  
  try {
    // Determine package manager
    let packageManager = 'pnpm';
    try {
      await execa('pnpm', ['--version'], { stdio: 'pipe' });
    } catch {
      packageManager = 'npm';
    }
    
    // Install the plugin
    const args = [packageManager === 'pnpm' ? 'add' : 'install', pluginPackage];
    await execa(packageManager, args, { 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    spinner.text = `Loading ${chalk.cyan(pluginPackage)}...`;
    
    // Load the plugin
    await pluginManager.loadPlugin(pluginPackage, program);
    
    spinner.succeed(chalk.green(`✓ Installed and loaded ${pluginName} plugin`));
    return true;
  } catch (error) {
    spinner.fail(chalk.red(`Failed to install ${pluginName} plugin`));
    console.error(chalk.dim(error instanceof Error ? error.message : String(error)));
    console.log(chalk.yellow(`\n💡 Try manually: ${chalk.white(`mediaproc add ${pluginName}`)}`));
    return false;
  }
}

/**
 * Universal convert command - auto-detects file type, installs plugin if needed, and converts
 */
export function convertCommand(program: Command, pluginManager?: PluginManager): void {
  program
    .command('convert <input> <output>')
    .description('Universal converter - auto-detects file type and converts')
    .option('-q, --quality <number>', 'Quality (1-100)', '85')
    .option('-f, --force', 'Overwrite existing output file')
    .option('-v, --verbose', 'Verbose output')
    .action(async (input: string, output: string, options: { quality?: string; force?: boolean; verbose?: boolean }) => {
      if (!existsSync(input)) {
        console.error(chalk.red(`✗ Input file not found: ${input}`));
        process.exit(1);
      }

      if (existsSync(output) && !options.force) {
        console.error(chalk.red(`✗ Output file already exists: ${output}`));
        console.log(chalk.dim('Use --force to overwrite'));
        process.exit(1);
      }

      const inputExt = extname(input).toLowerCase().slice(1);
      const outputExt = extname(output).toLowerCase().slice(1);

      // Detect which plugin to use
      const inputPlugin = detectPlugin(inputExt);
      const outputPlugin = detectPlugin(outputExt);
      
      if (!inputPlugin && !outputPlugin) {
        console.error(chalk.red(`✗ Unsupported file format: ${inputExt} → ${outputExt}`));
        console.log(chalk.yellow('\n💡 Supported formats:'));
        console.log(chalk.dim('  Images:    jpg, png, webp, gif, avif, heif, svg'));
        console.log(chalk.dim('  Videos:    mp4, webm, mkv, avi, mov'));
        console.log(chalk.dim('  Audio:     mp3, wav, ogg, flac, aac'));
        console.log(chalk.dim('  Documents: pdf, docx, pptx, epub'));
        console.log(chalk.dim('  3D Models: gltf, glb, obj, fbx'));
        process.exit(1);
      }
      
      const plugin = inputPlugin || outputPlugin;
      if (!plugin) {
        console.error(chalk.red('Could not detect plugin'));
        process.exit(1);
      }

      console.log(chalk.blue(`🎯 Detected ${plugin.type} conversion: ${inputExt.toUpperCase()} → ${outputExt.toUpperCase()}`));

      // Ensure plugin is installed (will call add command if needed)
      if (!pluginManager) {
        console.error(chalk.red('Plugin manager not available'));
        process.exit(1);
      }

      const pluginReady = await ensurePlugin(plugin.plugin, pluginManager, program);
      if (!pluginReady) {
        console.error(chalk.red(`\n✗ Failed to load ${plugin.plugin} plugin`));
        console.log(chalk.dim(`Try manually: mediaproc add ${plugin.plugin}`));
        process.exit(1);
      }

      // Now execute the conversion using the loaded plugin
      console.log(chalk.green(`\n✓ Plugin ready, converting...`));
      
      try {
        const pluginCmd = program.commands.find(cmd => cmd.name() === plugin.plugin);
        if (!pluginCmd) {
          console.error(chalk.red(`Plugin command not found: ${plugin.plugin}`));
          process.exit(1);
        }
        
        // Execute: mediaproc <plugin> convert <input> <output> --quality <q>
        const args = ['convert', input, output];
        if (options.quality) {
          args.push('--quality', options.quality);
        }
        if (options.force) {
          args.push('--force');
        }
        if (options.verbose) {
          args.push('--verbose');
        }
        
        await pluginCmd.parseAsync(args, { from: 'user' });
      } catch (error) {
        console.error(chalk.red('Conversion failed'));
        if (options.verbose && error instanceof Error) {
          console.error(chalk.dim(error.message));
        }
        process.exit(1);
      }
    });
}
