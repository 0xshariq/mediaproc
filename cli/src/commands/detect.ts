import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { extname } from 'path';
import { showBranding } from '@mediaproc/core';

/**
 * Detect media file type and suggest appropriate plugin
 */
export function detectCommand(program: Command): void {
    program
        .command('detect <file>')
        .description('Detect media file type and suggest appropriate plugin')
        .option('-v, --verbose', 'Show detailed file information')
        .action((file: string, options: { verbose?: boolean }) => {
            if (!existsSync(file)) {
                console.error(chalk.red(`✗ File not found: ${file}`));
                process.exit(1);
            }

            const ext = extname(file).toLowerCase().slice(1);

            // Media type mappings
            const mediaTypes: Record<string, { type: string; plugin: string; color: string }> = {
                // Images
                jpg: { type: 'Image', plugin: 'image', color: 'cyan' },
                jpeg: { type: 'Image', plugin: 'image', color: 'cyan' },
                png: { type: 'Image', plugin: 'image', color: 'cyan' },
                webp: { type: 'Image', plugin: 'image', color: 'cyan' },
                gif: { type: 'Image', plugin: 'image', color: 'cyan' },
                bmp: { type: 'Image', plugin: 'image', color: 'cyan' },
                tiff: { type: 'Image', plugin: 'image', color: 'cyan' },
                avif: { type: 'Image', plugin: 'image', color: 'cyan' },
                svg: { type: 'Image', plugin: 'image', color: 'cyan' },

                // Videos
                mp4: { type: 'Video', plugin: 'video', color: 'magenta' },
                webm: { type: 'Video', plugin: 'video', color: 'magenta' },
                mkv: { type: 'Video', plugin: 'video', color: 'magenta' },
                avi: { type: 'Video', plugin: 'video', color: 'magenta' },
                mov: { type: 'Video', plugin: 'video', color: 'magenta' },
                flv: { type: 'Video', plugin: 'video', color: 'magenta' },
                wmv: { type: 'Video', plugin: 'video', color: 'magenta' },
                m4v: { type: 'Video', plugin: 'video', color: 'magenta' },

                // Audio
                mp3: { type: 'Audio', plugin: 'audio', color: 'green' },
                wav: { type: 'Audio', plugin: 'audio', color: 'green' },
                ogg: { type: 'Audio', plugin: 'audio', color: 'green' },
                flac: { type: 'Audio', plugin: 'audio', color: 'green' },
                aac: { type: 'Audio', plugin: 'audio', color: 'green' },
                m4a: { type: 'Audio', plugin: 'audio', color: 'green' },
                opus: { type: 'Audio', plugin: 'audio', color: 'green' },

                // Documents
                pdf: { type: 'Document', plugin: 'document', color: 'yellow' },
                docx: { type: 'Document', plugin: 'document', color: 'yellow' },
                pptx: { type: 'Document', plugin: 'document', color: 'yellow' },
                txt: { type: 'Document', plugin: 'document', color: 'yellow' },
                md: { type: 'Document', plugin: 'document', color: 'yellow' },
            };

            const detected = mediaTypes[ext];

            if (!detected) {
                console.log(chalk.yellow(`⚠ Unknown file type: ${ext}`));
                console.log(chalk.dim('\\nNo plugin suggestions available.'));
                return;
            }

            const colorFn = chalk[detected.color as keyof typeof chalk] as (text: string) => string;

            console.log(chalk.bold('\\n📁 File Detection Result:\\n'));
            console.log(`File: ${chalk.cyan(file)}`);
            console.log(`Type: ${colorFn(detected.type)}`);
            console.log(`Extension: ${chalk.dim(ext)}`);

            console.log(chalk.bold('\\n💡 Suggested Plugin:\\n'));
            console.log(`Plugin: ${chalk.green(`@mediaproc/${detected.plugin}`)}`);
            console.log(`Install: ${chalk.dim(`mediaproc add ${detected.plugin}`)}`);

            console.log(chalk.bold('\\n🚀 Quick Commands:\\n'));
            console.log(chalk.dim(`# View available commands for this file type:`));
            console.log(chalk.cyan(`mediaproc ${detected.plugin} --help`));

            if (options.verbose) {
                console.log(chalk.bold('\\n📊 Available Operations:\\n'));

                if (detected.type === 'Image') {
                    console.log(chalk.dim('• resize, convert, compress, optimize, crop, rotate'));
                    console.log(chalk.dim('• blur, sharpen, grayscale, watermark, thumbnail'));
                } else if (detected.type === 'Video') {
                    console.log(chalk.dim('• compress, transcode, trim, resize, merge, extract'));
                } else if (detected.type === 'Audio') {
                    console.log(chalk.dim('• convert, normalize, merge, extract, trim'));
                } else if (detected.type === 'Document') {
                    console.log(chalk.dim('• convert, compress, merge, extract'));
                }
            }

            console.log('');
            showBranding();
        });
}
