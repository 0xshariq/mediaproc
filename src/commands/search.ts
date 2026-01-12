import { Command } from 'commander';
import { showBranding } from '../utils/branding';

interface SearchResult {
  plugin: string;
  command: string;
  description: string;
  score: number;
  category?: string;
}

export const searchCommand = new Command()
  .name('search')
  .description('Search for commands across all installed plugins')
  .argument('<query>', 'Search query')
  .option('-p, --plugin <name>', 'Search in specific plugin only')
  .option('-l, --limit <number>', 'Limit number of results', '10')
  .option('--json', 'Output results as JSON')
  .action(async (query: string, options) => {
    try {
      const results = await searchCommands(query, options.plugin);
      const limit = parseInt(options.limit);

      if (results.length === 0) {
        console.log(`\n❌ No commands found matching "${query}"\n`);
        console.log('💡 Tips:');
        console.log('   • Try different keywords (e.g., "resize", "convert", "compress")');
        console.log('   • Check installed plugins: \x1b[36mmediaproc list\x1b[0m');
        console.log('   • Install more plugins: \x1b[36mmediaproc add <plugin>\x1b[0m');
        console.log('   • View all available commands: \x1b[36mmediaproc <plugin> --help\x1b[0m');
        
        showBranding();
        return;
      }

      if (options.json) {
        console.log(JSON.stringify(results.slice(0, limit), null, 2));
        return;
      }

      // Display results in a nice table format
      console.log(`\n🔍 Found ${results.length} command${results.length > 1 ? 's' : ''} matching "${query}"\n`);
      console.log('┌' + '─'.repeat(78) + '┐');

      results.slice(0, limit).forEach((result, index) => {
        const number = `${index + 1}.`.padEnd(3);
        const pluginCmd = `${result.plugin} ${result.command}`;
        const category = result.category ? ` [${result.category}]` : '';
        
        console.log(`│ ${number} \x1b[1m\x1b[36m${pluginCmd}\x1b[0m${category}`);
        console.log(`│     ${result.description}`);
        console.log(`│     \x1b[90mUsage: mediaproc ${result.plugin} ${result.command} [options]\x1b[0m`);
        
        if (index < Math.min(limit, results.length) - 1) {
          console.log('│' + ' '.repeat(78) + '│');
        }
      });

      console.log('└' + '─'.repeat(78) + '┘');
      
      if (results.length > limit) {
        console.log(`\n📊 Showing top ${limit} results (${results.length} total)`);
        console.log(`   Use \x1b[36m--limit ${results.length}\x1b[0m to see all results`);
      }

      console.log(`\n💡 Get detailed help: \x1b[36mmediaproc <plugin> <command> --help\x1b[0m`);
      
      showBranding();
    } catch (error) {
      console.error(`\n❌ Search failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      showBranding();
      process.exit(1);
    }
  });

async function searchCommands(query: string, specificPlugin?: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);

  // Get command database (static for now, will be dynamic with real plugins later)
  const commandDatabase = getCommandDatabase();

  // Search through all plugins and commands
  for (const [plugin, commands] of Object.entries(commandDatabase)) {
    if (specificPlugin && plugin !== specificPlugin) {
      continue;
    }

    for (const [command, info] of Object.entries(commands)) {
      const score = calculateRelevanceScore(
        queryLower,
        queryWords,
        plugin,
        command,
        info.description,
        info.category
      );

      if (score > 0) {
        results.push({
          plugin,
          command,
          description: info.description,
          category: info.category,
          score
        });
      }
    }
  }

  // Sort by relevance score (highest first)
  results.sort((a, b) => b.score - a.score);

  return results;
}

function calculateRelevanceScore(
  query: string,
  queryWords: string[],
  plugin: string,
  command: string,
  description: string,
  category?: string
): number {
  let score = 0;
  const searchText = `${plugin} ${command} ${description} ${category || ''}`.toLowerCase();
  const commandLower = command.toLowerCase();
  const descriptionLower = description.toLowerCase();

  // Exact match in command name (highest priority)
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

  // Description contains exact query
  if (descriptionLower.includes(query)) {
    score += 25;
  }

  // All query words present in searchable text
  if (queryWords.every(word => searchText.includes(word))) {
    score += 20;
  }

  // Individual word matches (with decreasing importance)
  queryWords.forEach((word, index) => {
    const wordWeight = 10 / (index + 1); // First word more important
    
    if (commandLower.includes(word)) {
      score += wordWeight * 2;
    }
    if (descriptionLower.includes(word)) {
      score += wordWeight;
    }
    if (plugin.toLowerCase().includes(word)) {
      score += wordWeight * 1.5;
    }
  });

  return score;
}

function getCommandDatabase(): Record<string, Record<string, { description: string; category?: string }>> {
  // This is a comprehensive static database. In production, this should be loaded from installed plugins
  return {
    image: {
      // Transform Commands
      resize: { description: 'Resize images to specified dimensions', category: 'Transform' },
      crop: { description: 'Crop images to specified area', category: 'Transform' },
      rotate: { description: 'Rotate images by degrees', category: 'Transform' },
      flip: { description: 'Flip images horizontally or vertically', category: 'Transform' },
      trim: { description: 'Trim edges of images automatically', category: 'Transform' },
      extend: { description: 'Extend image canvas with background', category: 'Transform' },
      extract: { description: 'Extract region from images', category: 'Transform' },
      
      // Format Commands
      convert: { description: 'Convert images between formats (JPG, PNG, WebP, AVIF)', category: 'Format' },
      compress: { description: 'Compress images with quality control', category: 'Format' },
      optimize: { description: 'Optimize images for web delivery', category: 'Format' },
      
      // Effect Commands
      blur: { description: 'Apply gaussian blur effect to images', category: 'Effects' },
      sharpen: { description: 'Sharpen images for clarity', category: 'Effects' },
      grayscale: { description: 'Convert images to grayscale/black and white', category: 'Effects' },
      tint: { description: 'Apply color tint overlay to images', category: 'Effects' },
      negate: { description: 'Invert/negate image colors', category: 'Effects' },
      normalize: { description: 'Normalize image levels and contrast', category: 'Effects' },
      median: { description: 'Apply median filter for noise reduction', category: 'Effects' },
      
      // Adjustment Commands
      brightness: { description: 'Adjust image brightness levels', category: 'Adjustments' },
      contrast: { description: 'Adjust image contrast', category: 'Adjustments' },
      saturation: { description: 'Adjust color saturation intensity', category: 'Adjustments' },
      hue: { description: 'Adjust color hue/tone', category: 'Adjustments' },
      gamma: { description: 'Apply gamma correction to images', category: 'Adjustments' },
      modulate: { description: 'Modulate brightness, saturation, and hue together', category: 'Adjustments' },
      
      // Composition Commands
      watermark: { description: 'Add text or image watermarks', category: 'Composition' },
      thumbnail: { description: 'Generate thumbnails with smart cropping', category: 'Composition' },
      border: { description: 'Add decorative borders to images', category: 'Composition' },
      composite: { description: 'Composite/layer multiple images together', category: 'Composition' },
      overlay: { description: 'Overlay images on top of each other with blending', category: 'Composition' },
      mask: { description: 'Apply alpha mask to images', category: 'Composition' },
      flatten: { description: 'Flatten transparent image layers', category: 'Composition' },
      
      // Advanced Commands
      convolve: { description: 'Apply custom convolution kernel filter', category: 'Advanced' },
      recomb: { description: 'Recombine and remix color channels', category: 'Advanced' },
      metadata: { description: 'View or edit image EXIF metadata', category: 'Advanced' },
      histogram: { description: 'Generate image histogram data', category: 'Advanced' },
      stats: { description: 'Get detailed image statistics', category: 'Advanced' },
    },
    video: {
      compress: { description: 'Compress video files with quality presets', category: 'Processing' },
      transcode: { description: 'Convert video to different codec/format (H.264, H.265, VP9)', category: 'Processing' },
      trim: { description: 'Trim/cut video by time range or duration', category: 'Editing' },
      resize: { description: 'Resize video dimensions and resolution', category: 'Transform' },
      merge: { description: 'Merge/concatenate multiple video files', category: 'Editing' },
      extract: { description: 'Extract audio track or video frames', category: 'Extraction' },
      subtitle: { description: 'Add or extract video subtitles', category: 'Editing' },
      thumbnail: { description: 'Generate video thumbnail at timestamp', category: 'Extraction' },
      metadata: { description: 'View or edit video metadata', category: 'Info' },
    },
    audio: {
      convert: { description: 'Convert audio between formats (MP3, AAC, WAV, FLAC)', category: 'Processing' },
      normalize: { description: 'Normalize audio volume levels', category: 'Processing' },
      trim: { description: 'Trim audio by time range', category: 'Editing' },
      merge: { description: 'Merge multiple audio files into one', category: 'Editing' },
      extract: { description: 'Extract audio from video files', category: 'Extraction' },
      fade: { description: 'Apply fade in/out effects', category: 'Effects' },
      volume: { description: 'Adjust audio volume levels', category: 'Adjustments' },
      metadata: { description: 'View or edit audio metadata/tags', category: 'Info' },
    }
  };
}
