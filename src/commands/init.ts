import { Command } from 'commander';
import chalk from 'chalk';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export function initCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize a mediaproc project with config file')
    .option('--pipeline', 'Initialize with pipeline config')
    .action((options: { pipeline?: boolean }) => {
      const configPath = join(process.cwd(), 'mediaproc.config.json');
      
      if (existsSync(configPath)) {
        console.log(chalk.yellow('⚠️  mediaproc.config.json already exists'));
        process.exit(1);
      }
      
      const config = options.pipeline ? {
        version: '1.0',
        plugins: [],
        pipelines: {
          example: {
            name: 'Example Pipeline',
            steps: [
              {
                plugin: 'image',
                command: 'resize',
                options: { width: 1920, height: 1080 }
              },
              {
                plugin: 'image',
                command: 'convert',
                options: { format: 'webp', quality: 85 }
              }
            ]
          }
        }
      } : {
        version: '1.0',
        plugins: [],
        defaults: {
          image: {
            quality: 90,
            format: 'webp'
          },
          video: {
            codec: 'h264',
            preset: 'medium'
          }
        }
      };
      
      writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      console.log(chalk.green('✓ Created mediaproc.config.json'));
      console.log(chalk.dim('\nNext steps:'));
      console.log(chalk.dim('  1. Install plugins: mediaproc add image'));
      console.log(chalk.dim('  2. Customize config in mediaproc.config.json'));
      console.log(chalk.dim('  3. Run commands: mediaproc image resize photo.jpg'));
    });
}
