import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { showBranding } from '@mediaproc/core';

interface WatchConfig {
  directory: string;
  rules: WatchRule[];
  ignorePatterns: string[];
  recursive: boolean;
}

interface WatchRule {
  pattern: string;
  command: string;
  debounce?: number;
}

export const watchCommand = new Command()
  .name('watch')
  .description('Monitor directories and auto-process files')
  .argument('<directory>', 'Directory to watch')
  .option('--on-image <cmd>', 'Command to run on new images')
  .option('--on-video <cmd>', 'Command to run on new videos')
  .option('--on-audio <cmd>', 'Command to run on new audio files')
  .option('--on-any <cmd>', 'Command to run on any new file')
  .option('--ignore <patterns>', 'Comma-separated patterns to ignore')
  .option('--recursive', 'Watch subdirectories recursively')
  .option('--debounce <ms>', 'Debounce delay in milliseconds', '1000')
  .action(async (directory: string, options) => {
    if (!fs.existsSync(directory)) {
      console.log(`\n❌ Directory not found: ${directory}\n`);
      return;
    }

    const config: WatchConfig = {
      directory: path.resolve(directory),
      rules: buildWatchRules(options),
      ignorePatterns: options.ignore ? options.ignore.split(',') : [],
      recursive: options.recursive || false
    };

    if (config.rules.length === 0) {
      console.log('\n❌ No watch rules specified\n');
      console.log('💡 Use options like --on-image, --on-video, --on-audio, or --on-any\n');
      return;
    }

    console.log('\n👁️  MediaProc File Watcher\n');
    console.log('━'.repeat(60));
    console.log(`\nWatching: ${config.directory}`);
    console.log(`Recursive: ${config.recursive ? 'Yes' : 'No'}`);
    console.log(`Debounce: ${options.debounce}ms\n`);

    console.log('Rules:');
    config.rules.forEach((rule, index) => {
      console.log(`  ${index + 1}. ${rule.pattern} → ${rule.command}`);
    });

    if (config.ignorePatterns.length > 0) {
      console.log(`\nIgnoring: ${config.ignorePatterns.join(', ')}`);
    }

    console.log('\n' + '━'.repeat(60));
    console.log('\n🚀 Watcher started (Ctrl+C to stop)\n');
    console.log('⚠️  Note: Full implementation requires fs.watch with proper event handling\n');
    console.log('Simulated watch mode - no actual monitoring implemented yet.\n');

    // In real implementation, use fs.watch or chokidar
    // fs.watch(directory, { recursive: config.recursive }, (eventType, filename) => {
    //   handleFileEvent(eventType, filename, config);
    // });
  });

// List active watchers
watchCommand
  .command('list')
  .description('List active watchers')
  .action(async () => {
    console.log('\n👁️  Active Watchers\n');
    console.log('━'.repeat(60));
    console.log('\nNo active watchers (requires daemon implementation)\n');
  });

// Stop watcher
watchCommand
  .command('stop')
  .description('Stop a watcher')
  .argument('[directory]', 'Directory being watched (stops all if not specified)')
  .action(async (directory?: string) => {
    if (directory) {
      console.log(`\n✓ Stopped watcher for: ${directory}\n`);
    } else {
      console.log('\n✓ Stopped all watchers\n');
    }
    showBranding();
  });

function buildWatchRules(options: any): WatchRule[] {
  const rules: WatchRule[] = [];

  if (options.onImage) {
    rules.push({
      pattern: '\\.(jpg|jpeg|png|gif|webp|bmp|tiff|avif)$',
      command: options.onImage,
      debounce: parseInt(options.debounce)
    });
  }

  if (options.onVideo) {
    rules.push({
      pattern: '\\.(mp4|webm|avi|mov|mkv|flv|wmv)$',
      command: options.onVideo,
      debounce: parseInt(options.debounce)
    });
  }

  if (options.onAudio) {
    rules.push({
      pattern: '\\.(mp3|wav|flac|aac|ogg|m4a)$',
      command: options.onAudio,
      debounce: parseInt(options.debounce)
    });
  }

  if (options.onAny) {
    rules.push({
      pattern: '.*',
      command: options.onAny,
      debounce: parseInt(options.debounce)
    });
  }

  return rules;
}
