import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { statSync, existsSync } from 'fs';
import { resolve, extname, basename } from 'path';
import { execa } from 'execa';
import type { PluginManager } from '../plugin-manager.js';
import { resolvePluginPackage } from '../plugin-registry.js';

/**
 * Detect which plugin can provide detailed info for a file type
 */
function detectInfoPlugin(ext: string): { plugin: string; type: string; icon: string } | null {
  const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'avif', 'heif', 'svg'];
  const videoExts = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv', 'm4v', 'mpg', 'mpeg'];
  const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus'];
  const documentExts = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'epub'];
  const modelExts = ['gltf', 'glb', 'obj', 'fbx', 'usdz'];

  if (imageExts.includes(ext)) return { plugin: 'image', type: 'Image', icon: '🖼️' };
  if (videoExts.includes(ext)) return { plugin: 'video', type: 'Video', icon: '🎬' };
  if (audioExts.includes(ext)) return { plugin: 'audio', type: 'Audio', icon: '🎵' };
  if (documentExts.includes(ext)) return { plugin: 'document', type: 'Document', icon: '📄' };
  if (modelExts.includes(ext)) return { plugin: '3d', type: '3D Model', icon: '🎨' };
  
  return null;
}

/**
 * Ensure plugin is installed and loaded
 */
async function ensurePlugin(pluginName: string, pluginManager: PluginManager, program: Command): Promise<boolean> {
  const pluginPackage = resolvePluginPackage(pluginName);
  
  if (pluginManager.isPluginLoaded(pluginPackage)) {
    return true;
  }
  
  const spinner = ora(`Checking ${chalk.cyan(pluginName)} plugin...`).start();
  
  if (pluginManager.isPluginInstalled(pluginPackage)) {
    spinner.text = `Loading ${chalk.cyan(pluginPackage)}...`;
    try {
      await pluginManager.loadPlugin(pluginPackage, program);
      spinner.succeed(chalk.green(`✓ Loaded ${pluginName} plugin`));
      return true;
    } catch (error) {
      spinner.fail(chalk.red(`Failed to load ${pluginName}`));
      return false;
    }
  }
  
  spinner.text = `Installing ${chalk.cyan(pluginPackage)}...`;
  
  try {
    let packageManager = 'pnpm';
    try {
      await execa('pnpm', ['--version'], { stdio: 'pipe' });
    } catch {
      packageManager = 'npm';
    }
    
    const args = [packageManager === 'pnpm' ? 'add' : 'install', pluginPackage];
    await execa(packageManager, args, { stdio: 'pipe', cwd: process.cwd() });
    
    spinner.text = `Loading ${chalk.cyan(pluginPackage)}...`;
    await pluginManager.loadPlugin(pluginPackage, program);
    
    spinner.succeed(chalk.green(`✓ Installed and loaded ${pluginName} plugin`));
    return true;
  } catch (error) {
    spinner.fail(chalk.red(`Failed to install ${pluginName}`));
    return false;
  }
}

/**
 * Universal info command - shows file information and detailed plugin info if available
 */
export function infoCommand(program: Command, pluginManager?: PluginManager): void {
  program
    .command('info <file>')
    .description('Show file information for any media type')
    .option('--json', 'Output as JSON')
    .action((file: string, options: { json?: boolean }) => {
      if (!existsSync(file)) {
        console.error(chalk.red(`✗ File not found: ${file}`));
        process.exit(1);
      }

      const absolutePath = resolve(file);
      const ext = extname(file).toLowerCase().slice(1);
      const name = basename(file);
      const stats = statSync(file);
      const sizeInBytes = stats.size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
      const modified = stats.mtime.toLocaleString();
      const created = stats.birthtime.toLocaleString();

      // Detect media type
      const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'avif', 'heif', 'svg'];
      const videoExts = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv', 'm4v', 'mpg', 'mpeg'];
      const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus'];
      const documentExts = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'epub'];
      const modelExts = ['gltf', 'glb', 'obj', 'fbx', 'usdz'];

      let mediaType = 'Unknown';
      let suggestedPlugin = '';
      let icon = '📄';

      if (imageExts.includes(ext)) {
        mediaType = 'Image';
        suggestedPlugin = 'image';
        icon = '🖼️';
      } else if (videoExts.includes(ext)) {
        mediaType = 'Video';
        suggestedPlugin = 'video';
        icon = '🎬';
      } else if (audioExts.includes(ext)) {
        mediaType = 'Audio';
        suggestedPlugin = 'audio';
        icon = '🎵';
      } else if (documentExts.includes(ext)) {
        mediaType = 'Document';
        suggestedPlugin = 'document';
        icon = '📄';
      } else if (modelExts.includes(ext)) {
        mediaType = '3D Model';
        suggestedPlugin = '3d';
        icon = '🎨';
      }

      if (options.json) {
        const info = {
          name,
          path: absolutePath,
          type: mediaType,
          extension: ext,
          size: {
            bytes: sizeInBytes,
            kb: parseFloat(sizeInKB),
            mb: parseFloat(sizeInMB),
          },
          dates: {
            created,
            modified,
          },
          suggestedPlugin,
        };
        console.log(JSON.stringify(info, null, 2));
      } else {
        console.log('');
        console.log(chalk.bold(`${icon} File Information`));
        console.log(chalk.dim('─'.repeat(50)));
        console.log(chalk.cyan('Name:         ') + name);
        console.log(chalk.cyan('Type:         ') + chalk.yellow(mediaType) + chalk.dim(` (.${ext})`));
        console.log(chalk.cyan('Size:         ') + `${sizeInMB} MB ${chalk.dim(`(${sizeInKB} KB, ${sizeInBytes} bytes)`)}`);
        console.log(chalk.cyan('Path:         ') + chalk.dim(absolutePath));
        console.log(chalk.cyan('Created:      ') + created);
        console.log(chalk.cyan('Modified:     ') + modified);
        console.log('');

        if (suggestedPlugin) {
          console.log(chalk.yellow('💡 Get detailed info with:'));
          console.log(chalk.cyan(`   mediaproc ${suggestedPlugin} info ${file}`));
          console.log('');
          console.log(chalk.dim(`   Install plugin: mediaproc add ${suggestedPlugin}`));
        } else {
          console.log(chalk.yellow('⚠️  Unknown media type - no plugin available'));
        }
        console.log('');
      }
    });
}
