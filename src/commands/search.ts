import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

interface SearchResult {
  plugin: string;
  command: string;
  description: string;
  score: number;
}

export const searchCommand = new Command()
  .name('search')
  .description('Search for commands across all installed plugins')
  .argument('<query>', 'Search query')
  .option('-p, --plugin <name>', 'Search in specific plugin only')
  .option('-l, --limit <number>', 'Limit number of results', '10')
  .option('--json', 'Output results as JSON')
  .action(async (query: string, options) => {
    const results = await searchCommands(query, options.plugin);
    const limit = parseInt(options.limit);

    if (results.length === 0) {
      console.log(`\n❌ No commands found matching "${query}"\n`);
      console.log('💡 Try:');
      console.log('   • Using different keywords');
      console.log('   • Checking installed plugins with: mediaproc list');
      console.log('   • Installing more plugins with: mediaproc add <plugin>');
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(results.slice(0, limit), null, 2));
      return;
    }

    console.log(`\n🔍 Search results for "${query}":\n`);
    console.log('━'.repeat(60));

    results.slice(0, limit).forEach((result, index) => {
      console.log(`\n${index + 1}. \x1b[36m${result.plugin} ${result.command}\x1b[0m`);
      console.log(`   ${result.description}`);
      console.log(`   \x1b[90mUsage: mediaproc ${result.plugin} ${result.command} [options]\x1b[0m`);
    });

    console.log('\n' + '━'.repeat(60));
    console.log(`\nShowing ${Math.min(limit, results.length)} of ${results.length} results`);
    
    if (results.length > limit) {
      console.log(`\n💡 Use --limit ${results.length} to see all results`);
    }

    console.log(`\n💡 Get detailed help: \x1b[36mmediaproc <plugin> <command> --help\x1b[0m\n`);
  });

async function searchCommands(query: string, specificPlugin?: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  // Built-in command definitions (in real implementation, this would be loaded from plugins)
  const commandDatabase = getCommandDatabase();

  for (const [plugin, commands] of Object.entries(commandDatabase)) {
    if (specificPlugin && plugin !== specificPlugin) {
      continue;
    }

    for (const [command, description] of Object.entries(commands)) {
      const score = calculateRelevanceScore(
        queryLower,
        queryWords,
        plugin,
        command,
        description
      );

      if (score > 0) {
        results.push({
          plugin,
          command,
          description,
          score
        });
      }
    }
  }

  // Sort by relevance score
  results.sort((a, b) => b.score - a.score);

  return results;
}

function calculateRelevanceScore(
  query: string,
  queryWords: string[],
  plugin: string,
  command: string,
  description: string
): number {
  let score = 0;
  const searchText = `${plugin} ${command} ${description}`.toLowerCase();
  const commandLower = command.toLowerCase();

  // Exact match in command name
  if (commandLower === query) {
    score += 100;
  }

  // Command starts with query
  if (commandLower.startsWith(query)) {
    score += 50;
  }

  // Command contains query
  if (commandLower.includes(query)) {
    score += 30;
  }

  // All query words present
  if (queryWords.every(word => searchText.includes(word))) {
    score += 20;
  }

  // Individual word matches
  queryWords.forEach((word, index) => {
    if (commandLower.includes(word)) {
      score += 10 - index;
    }
    if (description.toLowerCase().includes(word)) {
      score += 5 - index;
    }
  });

  return score;
}

function getCommandDatabase(): Record<string, Record<string, string>> {
  // This is a static database for now. In production, this should be loaded from installed plugins
  return {
    image: {
      resize: 'Resize images to specified dimensions',
      crop: 'Crop images to specified area',
      rotate: 'Rotate images by degrees',
      flip: 'Flip images horizontally or vertically',
      convert: 'Convert images between formats',
      compress: 'Compress images with quality control',
      optimize: 'Optimize images for web',
      blur: 'Apply blur effect to images',
      sharpen: 'Sharpen images',
      grayscale: 'Convert images to grayscale',
      tint: 'Apply color tint to images',
      watermark: 'Add text or image watermarks',
      thumbnail: 'Generate thumbnails',
      brightness: 'Adjust image brightness',
      contrast: 'Adjust image contrast',
      saturation: 'Adjust color saturation',
      hue: 'Adjust color hue',
      normalize: 'Normalize image levels',
      trim: 'Trim edges of images',
      border: 'Add borders to images',
      composite: 'Composite multiple images',
      overlay: 'Overlay images on top of each other',
      mask: 'Apply mask to images',
      extract: 'Extract region from images',
      extend: 'Extend image canvas',
      flatten: 'Flatten image layers',
      negate: 'Negate image colors',
      gamma: 'Apply gamma correction',
      modulate: 'Modulate brightness, saturation, and hue',
      convolve: 'Apply convolution kernel',
      median: 'Apply median filter',
      recomb: 'Recombine color channels'
    },
    video: {
      compress: 'Compress video files',
      transcode: 'Convert video to different codec/format',
      trim: 'Trim video by time range',
      resize: 'Resize video dimensions',
      merge: 'Merge multiple video files',
      extract: 'Extract audio or frames from video'
    },
    audio: {
      convert: 'Convert audio between formats',
      normalize: 'Normalize audio volume',
      trim: 'Trim audio by time',
      merge: 'Merge multiple audio files',
      extract: 'Extract audio from video'
    }
  };
}
