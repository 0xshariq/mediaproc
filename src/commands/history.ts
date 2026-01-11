import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface HistoryEntry {
  id: number;
  timestamp: number;
  command: string;
  args: string[];
  cwd: string;
  success: boolean;
  duration?: number;
}

const HISTORY_FILE = path.join(os.homedir(), '.mediaproc', 'history.json');
const MAX_HISTORY_ENTRIES = 1000;

export const historyCommand = new Command()
  .name('history')
  .description('Show command history and replay previous commands')
  .option('-n, --limit <number>', 'Number of entries to show', '20')
  .option('--clear', 'Clear history')
  .option('--export <file>', 'Export history as shell script')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    if (options.clear) {
      clearHistory();
      console.log('✓ History cleared');
      return;
    }

    if (options.export) {
      exportHistory(options.export);
      console.log(`✓ History exported to ${options.export}`);
      return;
    }

    const history = loadHistory();
    const limit = parseInt(options.limit);

    if (history.length === 0) {
      console.log('\n📝 No command history yet\n');
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(history.slice(-limit), null, 2));
      return;
    }

    displayHistory(history, limit);
  });

// Add replay subcommand
historyCommand
  .command('replay')
  .description('Replay a command from history')
  .argument('<id>', 'History entry ID')
  .action(async (id: string) => {
    const history = loadHistory();
    const entryId = parseInt(id);
    const entry = history.find(e => e.id === entryId);

    if (!entry) {
      console.log(`\n❌ No history entry found with ID ${id}\n`);
      return;
    }

    console.log(`\n🔄 Replaying command ${id}:`);
    console.log(`   ${entry.command} ${entry.args.join(' ')}\n`);

    // In a real implementation, this would actually execute the command
    console.log('⚠️  Note: Command replay requires full implementation');
    console.log(`   Run manually: mediaproc ${entry.command} ${entry.args.join(' ')}\n`);
  });

// Add search subcommand
historyCommand
  .command('search')
  .description('Search command history')
  .argument('<query>', 'Search query')
  .action(async (query: string) => {
    const history = loadHistory();
    const queryLower = query.toLowerCase();

    const matches = history.filter(entry => {
      const searchText = `${entry.command} ${entry.args.join(' ')}`.toLowerCase();
      return searchText.includes(queryLower);
    });

    if (matches.length === 0) {
      console.log(`\n❌ No commands found matching "${query}"\n`);
      return;
    }

    console.log(`\n🔍 Found ${matches.length} matching commands:\n`);
    displayHistory(matches, matches.length);
  });

// Add stats subcommand
historyCommand
  .command('stats')
  .description('Show history statistics')
  .action(async () => {
    const history = loadHistory();

    if (history.length === 0) {
      console.log('\n📊 No history data available\n');
      return;
    }

    const commandCounts: Record<string, number> = {};
    const successCount = history.filter(e => e.success).length;
    const failCount = history.length - successCount;

    history.forEach(entry => {
      commandCounts[entry.command] = (commandCounts[entry.command] || 0) + 1;
    });

    const sortedCommands = Object.entries(commandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    console.log('\n📊 History Statistics\n');
    console.log('━'.repeat(50));
    console.log(`\nTotal commands: ${history.length}`);
    console.log(`Success rate: ${((successCount / history.length) * 100).toFixed(1)}%`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failCount}`);

    console.log('\n📈 Most used commands:\n');
    sortedCommands.forEach(([command, count], index) => {
      const bar = '▓'.repeat(Math.ceil((count / sortedCommands[0][1]) * 20));
      console.log(`${index + 1}. ${command.padEnd(15)} ${bar} ${count}`);
    });

    // Calculate average duration if available
    const withDuration = history.filter(e => e.duration !== undefined);
    if (withDuration.length > 0) {
      const avgDuration = withDuration.reduce((sum, e) => sum + (e.duration || 0), 0) / withDuration.length;
      console.log(`\n⏱️  Average duration: ${(avgDuration / 1000).toFixed(2)}s`);
    }

    console.log('\n' + '━'.repeat(50) + '\n');
  });

function loadHistory(): HistoryEntry[] {
  try {
    ensureHistoryDirectory();
    
    if (!fs.existsSync(HISTORY_FILE)) {
      return [];
    }

    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
}

export function getHistory(): HistoryEntry[] {
  return loadHistory();
}

export function saveHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
  try {
    ensureHistoryDirectory();
    
    const history = loadHistory();
    const newEntry: HistoryEntry = {
      ...entry,
      id: history.length > 0 ? Math.max(...history.map(e => e.id)) + 1 : 1,
      timestamp: Date.now()
    };

    history.push(newEntry);

    // Keep only last MAX_HISTORY_ENTRIES
    const trimmedHistory = history.slice(-MAX_HISTORY_ENTRIES);

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmedHistory, null, 2));
  } catch (error) {
    // Silently fail - history is not critical
  }
}

function clearHistory(): void {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      fs.unlinkSync(HISTORY_FILE);
    }
  } catch (error) {
    console.error('Error clearing history:', error);
  }
}

function exportHistory(filename: string): void {
  const history = loadHistory();
  const script = history
    .map(entry => `# ${new Date(entry.timestamp).toLocaleString()}`)
    .map((comment, index) => `${comment}\nmediaproc ${history[index].command} ${history[index].args.join(' ')}`)
    .join('\n\n');

  fs.writeFileSync(filename, `#!/bin/bash\n\n${script}\n`);
  fs.chmodSync(filename, '755');
}

function displayHistory(history: HistoryEntry[], limit: number): void {
  console.log('\n📝 Command History\n');
  console.log('━'.repeat(70));

  const entries = history.slice(-limit).reverse();

  entries.forEach(entry => {
    const status = entry.success ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    const time = formatTimestamp(entry.timestamp);
    const duration = entry.duration ? `(${(entry.duration / 1000).toFixed(2)}s)` : '';
    
    console.log(`\n${status} \x1b[36m#${entry.id}\x1b[0m ${time} ${duration}`);
    console.log(`   mediaproc ${entry.command} ${entry.args.join(' ')}`);
    console.log(`   \x1b[90mDirectory: ${entry.cwd}\x1b[0m`);
  });

  console.log('\n' + '━'.repeat(70));
  console.log(`\nShowing last ${Math.min(limit, history.length)} of ${history.length} commands`);
  console.log('\n💡 Commands:');
  console.log('   mediaproc history replay <id>  - Replay a command');
  console.log('   mediaproc history search <q>   - Search history');
  console.log('   mediaproc history stats        - Show statistics');
  console.log('   mediaproc history --export <f> - Export as script\n');
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

function ensureHistoryDirectory(): void {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
