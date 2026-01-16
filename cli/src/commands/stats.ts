import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getHistory } from './history.js';

const STATS_FILE = path.join(os.homedir(), '.mediaproc', 'stats.json');

interface Stats {
  totalFiles: number;
  totalTime: number;
  storageSaved: number;
  pluginUsage: Record<string, number>;
  commandUsage: Record<string, number>;
  successRate: number;
  lastUpdated: number;
}

export const statsCommand = new Command()
  .name('stats')
  .description('Show MediaProc usage statistics')
  .option('-p, --plugin <name>', 'Show stats for specific plugin')
  .option('--period <days>', 'Time period in days', '30')
  .option('--reset', 'Reset all statistics')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    if (options.reset) {
      resetStats();
      console.log('\n✓ Statistics reset\n');
      return;
    }

    const stats = calculateStats(parseInt(options.period));

    if (options.json) {
      console.log(JSON.stringify(stats, null, 2));
      return;
    }

    if (options.plugin) {
      displayPluginStats(options.plugin, stats);
    } else {
      displayOverallStats(stats, parseInt(options.period));
    }
  });

function calculateStats(days: number): Stats {
  const history = getHistory();
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  
  const recentHistory = history.filter(entry => entry.timestamp >= cutoff);

  const pluginUsage: Record<string, number> = {};
  const commandUsage: Record<string, number> = {};
  let totalTime = 0;
  let successCount = 0;

  recentHistory.forEach(entry => {
    const plugin = entry.command.split(' ')[0];
    pluginUsage[plugin] = (pluginUsage[plugin] || 0) + 1;
    commandUsage[entry.command] = (commandUsage[entry.command] || 0) + 1;
    
    if (entry.duration) {
      totalTime += entry.duration;
    }
    
    if (entry.success) {
      successCount++;
    }
  });

  return {
    totalFiles: recentHistory.length,
    totalTime,
    storageSaved: 0, // Would need to track this separately
    pluginUsage,
    commandUsage,
    successRate: recentHistory.length > 0 ? (successCount / recentHistory.length) * 100 : 0,
    lastUpdated: Date.now()
  };
}

function displayOverallStats(stats: Stats, days: number): void {
  console.log('\n📊 MediaProc Statistics\n');
  console.log('━'.repeat(60));
  console.log(`\nPeriod: Last ${days} days\n`);
  
  console.log('📈 Overview:');
  console.log(`   Total files processed: ${stats.totalFiles.toLocaleString()}`);
  console.log(`   Success rate: ${stats.successRate.toFixed(1)}%`);
  console.log(`   Total processing time: ${formatDuration(stats.totalTime)}`);
  
  if (stats.totalFiles > 0) {
    console.log(`   Average per file: ${formatDuration(stats.totalTime / stats.totalFiles)}`);
  }

  if (stats.storageSaved > 0) {
    console.log(`   Storage saved: ${formatBytes(stats.storageSaved)}`);
  }

  // Plugin usage
  const topPlugins = Object.entries(stats.pluginUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topPlugins.length > 0) {
    console.log('\n🔌 Most Used Plugins:\n');
    topPlugins.forEach(([plugin, count], index) => {
      const percentage = (count / stats.totalFiles) * 100;
      const bar = '▓'.repeat(Math.ceil(percentage / 5));
      console.log(`${index + 1}. ${plugin.padEnd(15)} ${bar} ${count} (${percentage.toFixed(1)}%)`);
    });
  }

  // Command usage
  const topCommands = Object.entries(stats.commandUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topCommands.length > 0) {
    console.log('\n⚡ Most Used Commands:\n');
    topCommands.forEach(([command, count], index) => {
      console.log(`${index + 1}. ${command.padEnd(25)} ${count} uses`);
    });
  }

  console.log('\n' + '━'.repeat(60));
  console.log('\n💡 Commands:');
  console.log('   mediaproc stats --plugin <name>  - Plugin-specific stats');
  console.log('   mediaproc stats --period <days>  - Change time period');
  console.log('   mediaproc stats --reset          - Reset statistics\n');
}

function displayPluginStats(plugin: string, stats: Stats): void {
  const pluginCount = stats.pluginUsage[plugin] || 0;

  if (pluginCount === 0) {
    console.log(`\n❌ No usage data for plugin "${plugin}"\n`);
    return;
  }

  console.log(`\n📊 ${plugin.charAt(0).toUpperCase() + plugin.slice(1)} Plugin Statistics\n`);
  console.log('━'.repeat(60));
  
  console.log(`\nTotal uses: ${pluginCount}`);
  console.log(`Percentage of total: ${((pluginCount / stats.totalFiles) * 100).toFixed(1)}%`);

  // Commands for this plugin
  const pluginCommands = Object.entries(stats.commandUsage)
    .filter(([cmd]) => cmd.startsWith(plugin))
    .sort((a, b) => b[1] - a[1]);

  if (pluginCommands.length > 0) {
    console.log('\n⚡ Command Usage:\n');
    pluginCommands.forEach(([command, count], index) => {
      const commandName = command.replace(`${plugin} `, '');
      const percentage = (count / pluginCount) * 100;
      console.log(`${index + 1}. ${commandName.padEnd(20)} ${count} (${percentage.toFixed(1)}%)`);
    });
  }

  console.log('\n' + '━'.repeat(60) + '\n');
}

function resetStats(): void {
  try {
    if (fs.existsSync(STATS_FILE)) {
      fs.unlinkSync(STATS_FILE);
    }
  } catch (error) {
    console.error('Error resetting stats:', error);
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}
