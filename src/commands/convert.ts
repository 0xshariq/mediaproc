import { Command } from 'commander';
import chalk from 'chalk';
import { extname } from 'path';
import { existsSync } from 'fs';

/**
 * Universal convert command - auto-detects file type and suggests appropriate plugin
 */
export function convertCommand(program: Command): void {
  program
    .command('convert <input> <output>')
    .description('Universal converter - auto-detects file type and converts')
    .option('-q, --quality <number>', 'Quality (1-100)', '85')
    .option('-f, --force', 'Overwrite existing output file')
    .option('-v, --verbose', 'Verbose output')
    .action((input: string, output: string, options: { quality?: string; force?: boolean; verbose?: boolean }) => {
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

      // Detect media type and suggest plugin
      const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'avif', 'heif', 'svg'];
      const videoExts = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv', 'm4v', 'mpg', 'mpeg'];
      const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus'];
      const documentExts = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'epub'];
      const modelExts = ['gltf', 'glb', 'obj', 'fbx', 'usdz'];

      let pluginName = '';
      let mediaType = '';

      if (imageExts.includes(inputExt) || imageExts.includes(outputExt)) {
        pluginName = 'image';
        mediaType = 'image';
      } else if (videoExts.includes(inputExt) || videoExts.includes(outputExt)) {
        pluginName = 'video';
        mediaType = 'video';
      } else if (audioExts.includes(inputExt) || audioExts.includes(outputExt)) {
        pluginName = 'audio';
        mediaType = 'audio';
      } else if (documentExts.includes(inputExt) || documentExts.includes(outputExt)) {
        pluginName = 'document';
        mediaType = 'document';
      } else if (modelExts.includes(inputExt) || modelExts.includes(outputExt)) {
        pluginName = '3d';
        mediaType = '3D model';
      } else {
        console.error(chalk.red(`✗ Unsupported file format: ${inputExt} → ${outputExt}`));
        console.log(chalk.yellow('\n💡 Supported formats:'));
        console.log(chalk.dim('  Images:    jpg, png, webp, gif, avif, heif, svg'));
        console.log(chalk.dim('  Videos:    mp4, webm, mkv, avi, mov'));
        console.log(chalk.dim('  Audio:     mp3, wav, ogg, flac, aac'));
        console.log(chalk.dim('  Documents: pdf, docx, pptx, epub'));
        console.log(chalk.dim('  3D Models: gltf, glb, obj, fbx'));
        process.exit(1);
      }

      console.log(chalk.blue(`🎯 Detected ${mediaType} conversion`));
      console.log(chalk.dim(`   ${inputExt.toUpperCase()} → ${outputExt.toUpperCase()}`));
      console.log('');
      console.log(chalk.yellow(`⚡ Quick command:`));
      console.log(chalk.cyan(`   mediaproc ${pluginName} convert ${input} ${output} --quality ${options.quality || 85}`));
      console.log('');
      console.log(chalk.dim(`💡 Install plugin: mediaproc add ${pluginName}`));
      console.log(chalk.dim(`   Then run the command above`));
    });
}
