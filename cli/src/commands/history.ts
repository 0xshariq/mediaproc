import { Command } from 'commander';
import { HistoryManager } from '../utils/history-manager.js';

const historyManager = new HistoryManager();

export const historyCommand = new Command()
  .name('history')
  .description('Show your personal MediaProc command usage history')
  .option('-n, --limit <number>', 'Number of entries to show', '20')
  .option('--clear', 'Clear history')
  .option('--export', 'Export sanitized usage summary as JSON')
  .action(async (options) => {
    if (options.clear) {
      historyManager.clearHistory();
      console.log('✓ History cleared');
      return;
    }

    const history = historyManager.loadHistory();
    const limit = parseInt(options.limit);

    if (options.export) {
      const summary = historyManager.summarizeHistory(history);
      const exportFile = 'history-summary.json';
      require('fs').writeFileSync(exportFile, JSON.stringify(summary, null, 2));
      console.log(`\n✓ History summary exported to ${exportFile}`);
      console.log('\nTip: You can help improve MediaProc by sharing anonymized usage insights.');
      console.log('Your data is never sent automatically.');
      console.log('Use: mediaproc history --export');
      return;
    }

    if (history.length === 0) {
      console.log('\n📝 No command history yet');
      return;
    }

    historyManager.displayHistory(history, limit);
    // Gentle, optional tip
    console.log('\nTip:');
    console.log('You can help improve MediaProc by sharing anonymized usage insights.');
    console.log('Your data is never sent automatically.');
    console.log('Use: mediaproc history --export');

  });

// Add replay subcommand
historyCommand
  .command('replay')
  .description('Replay a command from history')
  .argument('<id>', 'History entry ID')
  .action(async (id: string) => {
    const history = historyManager.loadHistory();
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
    console.log(`   Run manually: mediaproc ${entry.command} ${entry.args.join(' ')}`);
  });

// Add search subcommand
historyCommand
  .command('search')
  .description('Search command history')
  .argument('<query>', 'Search query')
  .action(async (query: string) => {
    const history = historyManager.loadHistory();
    const queryLower = query.toLowerCase();

    const matches = history.filter(entry => {
      const searchText = `${entry.command} ${entry.args.join(' ')}`.toLowerCase();
      return searchText.includes(queryLower);
    });

    if (matches.length === 0) {
      console.log('\nNo matching history entries found.');
      return;
    }

    console.log(`\nTotal matching history entries: ${matches.length}`);
    historyManager.summarizeHistory(matches);
  });
