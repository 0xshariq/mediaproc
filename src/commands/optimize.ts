import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import { extname } from 'path';
import { execa } from 'execa';
import type { PluginManager } from '../plugin-manager.js';
import { resolvePluginPackage } from '../plugin-registry.js';

/**
 * Detect which plugin can handle optimization for a file type
 */
function detectOptimizePlugin(ext: string): { plugin: string; type: string } | null {
  const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'avif', 'heif'];
  const videoExts = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv', 'm4v'];
  const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus'];
  const documentExts = ['pdf', 'docx', 'pptx'];
  const modelExts = ['gltf', 'glb', 'obj'];

  if (imageExts.includes(ext)) return { plugin: 'image', type: 'Image' };
  if (videoExts.includes(ext)) return { plugin: 'video', type: 'Video' };
  if (audioExts.includes(ext)) return { plugin: 'audio', type: 'Audio' };
  if (documentExts.includes(ext)) return { plugin: 'document', type: 'Document' };
  if (modelExts.includes(ext)) return { plugin: '3d', type: '3D Model' };
  
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
 * Universal optimize command - detects file type and optimizes
 */
export function optimizeCommand(program: Command, pluginManager?: PluginManager): void {
  program
    .command('optimize <file>')
    .description('Auto-optimize any media file')
    .option('-o, --output <path>', 'Output path (default: adds .optimized before extension)')
    .option('--aggressive', 'More aggressive optimization (lower quality, smaller size)')
    .option('--lossless', 'Lossless optimization (best quality, moderate size)')
    .option('-v, --verbose', 'Verbose output')
    .action((file: string, options: { output?: string; aggressive?: boolean; lossless?: boolean; verbose?: boolean }) => {
      if (!existsSync(file)) {
        console.error(chalk.red(`✗ File not found: ${file}`));
        process.exit(1);
      }

      const ext = extname(file).toLowerCase().slice(1);

      // Detect media type
      const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'avif', 'heif'];
      const videoExts = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv', 'm4v'];
      const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus'];
      const documentExts = ['pdf', 'docx', 'pptx'];
      const modelExts = ['gltf', 'glb', 'obj'];

      let pluginName = '';
      let mediaType = '';
      let optimizationStrategy = '';
      let commands: string[] = [];

      if (imageExts.includes(ext)) {
        pluginName = 'image';
        mediaType = 'Image';
        
        if (options.lossless) {
          optimizationStrategy = 'Lossless (PNG/WebP lossless)';
          commands = [
            `mediaproc image compress ${file} ${options.output || file.replace(`.${ext}`, `.optimized.${ext}`)} --lossless`,
            `mediaproc image convert ${file} ${options.output || file.replace(`.${ext}`, '.optimized.webp')} --quality 100 --lossless`,
          ];
        } else if (options.aggressive) {
          optimizationStrategy = 'Aggressive (WebP Q70, smaller file size)';
          commands = [
            `mediaproc image compress ${file} ${options.output || file.replace(`.${ext}`, `.optimized.${ext}`)} --quality 70`,
            `mediaproc image convert ${file} ${options.output || file.replace(`.${ext}`, '.optimized.webp')} --quality 70`,
          ];
        } else {
          optimizationStrategy = 'Balanced (WebP Q85, good quality/size ratio)';
          commands = [
            `mediaproc image compress ${file} ${options.output || file.replace(`.${ext}`, `.optimized.${ext}`)} --quality 85`,
            `mediaproc image convert ${file} ${options.output || file.replace(`.${ext}`, '.optimized.webp')} --quality 85`,
          ];
        }
      } else if (videoExts.includes(ext)) {
        pluginName = 'video';
        mediaType = 'Video';
        
        if (options.lossless) {
          optimizationStrategy = 'Lossless (H.265 CRF 0)';
          commands = [
            `mediaproc video compress ${file} ${options.output || file.replace(`.${ext}`, '.optimized.mp4')} --codec h265 --crf 0`,
          ];
        } else if (options.aggressive) {
          optimizationStrategy = 'Aggressive (H.265 CRF 28)';
          commands = [
            `mediaproc video compress ${file} ${options.output || file.replace(`.${ext}`, '.optimized.mp4')} --codec h265 --crf 28`,
          ];
        } else {
          optimizationStrategy = 'Balanced (H.265 CRF 23)';
          commands = [
            `mediaproc video compress ${file} ${options.output || file.replace(`.${ext}`, '.optimized.mp4')} --codec h265 --crf 23`,
          ];
        }
      } else if (audioExts.includes(ext)) {
        pluginName = 'audio';
        mediaType = 'Audio';
        
        if (options.lossless) {
          optimizationStrategy = 'Lossless (FLAC)';
          commands = [
            `mediaproc audio convert ${file} ${options.output || file.replace(`.${ext}`, '.optimized.flac')}`,
          ];
        } else if (options.aggressive) {
          optimizationStrategy = 'Aggressive (Opus 96k)';
          commands = [
            `mediaproc audio convert ${file} ${options.output || file.replace(`.${ext}`, '.optimized.opus')} --bitrate 96k`,
          ];
        } else {
          optimizationStrategy = 'Balanced (Opus 128k)';
          commands = [
            `mediaproc audio convert ${file} ${options.output || file.replace(`.${ext}`, '.optimized.opus')} --bitrate 128k`,
          ];
        }
      } else if (documentExts.includes(ext)) {
        pluginName = 'document';
        mediaType = 'Document';
        optimizationStrategy = 'PDF compression with Ghostscript';
        commands = [
          `mediaproc document compress ${file} ${options.output || file.replace('.pdf', '.optimized.pdf')}`,
        ];
      } else if (modelExts.includes(ext)) {
        pluginName = '3d';
        mediaType = '3D Model';
        
        if (options.lossless) {
          optimizationStrategy = 'Lossless (remove unused data)';
          commands = [
            `mediaproc 3d optimize ${file} ${options.output || file.replace(`.${ext}`, '.optimized.glb')} --lossless`,
          ];
        } else if (options.aggressive) {
          optimizationStrategy = 'Aggressive (Draco + texture compression)';
          commands = [
            `mediaproc 3d optimize ${file} ${options.output || file.replace(`.${ext}`, '.optimized.glb')} --aggressive`,
            `mediaproc 3d compress-textures ${file} ${options.output || file.replace(`.${ext}`, '.optimized.glb')} --format ktx2`,
          ];
        } else {
          optimizationStrategy = 'Balanced (Draco compression)';
          commands = [
            `mediaproc 3d optimize ${file} ${options.output || file.replace(`.${ext}`, '.optimized.glb')}`,
          ];
        }
      } else {
        console.error(chalk.red(`✗ Unsupported file format for optimization: .${ext}`));
        console.log(chalk.yellow('\n💡 Supported formats:'));
        console.log(chalk.dim('  Images:    jpg, png, webp, gif, avif, heif'));
        console.log(chalk.dim('  Videos:    mp4, webm, mkv, avi, mov'));
        console.log(chalk.dim('  Audio:     mp3, wav, ogg, flac, aac'));
        console.log(chalk.dim('  Documents: pdf, docx, pptx'));
        console.log(chalk.dim('  3D Models: gltf, glb, obj'));
        process.exit(1);
      }

      console.log('');
      console.log(chalk.blue(`🎯 ${mediaType} Optimization Strategy`));
      console.log(chalk.dim('─'.repeat(50)));
      console.log(chalk.cyan('File:     ') + file);
      console.log(chalk.cyan('Type:     ') + mediaType);
      console.log(chalk.cyan('Strategy: ') + chalk.yellow(optimizationStrategy));
      console.log('');
      console.log(chalk.yellow('⚡ Recommended command' + (commands.length > 1 ? 's' : '') + ':'));
      commands.forEach((cmd, i) => {
        if (commands.length > 1) {
          console.log(chalk.dim(`   Option ${i + 1}:`));
        }
        console.log(chalk.cyan(`   ${cmd}`));
        if (i < commands.length - 1) console.log('');
      });
      console.log('');
      console.log(chalk.dim(`💡 Install plugin: mediaproc add ${pluginName}`));
      console.log(chalk.dim(`   Then run one of the commands above`));
      console.log('');
      
      // Show size estimates
      if (mediaType === 'Image') {
        console.log(chalk.yellow('📊 Expected savings:'));
        if (options.aggressive) {
          console.log(chalk.dim('   • 60-80% size reduction (WebP Q70)'));
        } else if (options.lossless) {
          console.log(chalk.dim('   • 10-30% size reduction (lossless)'));
        } else {
          console.log(chalk.dim('   • 40-60% size reduction (WebP Q85)'));
        }
        console.log('');
      } else if (mediaType === 'Video') {
        console.log(chalk.yellow('📊 Expected savings:'));
        if (options.aggressive) {
          console.log(chalk.dim('   • 50-70% size reduction (H.265 CRF 28)'));
        } else if (options.lossless) {
          console.log(chalk.dim('   • Variable (lossless encoding)'));
        } else {
          console.log(chalk.dim('   • 30-50% size reduction (H.265 CRF 23)'));
        }
        console.log('');
      }
    });
}
