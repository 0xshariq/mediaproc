import { Command } from 'commander';
import { showBranding } from '@mediaproc/core';
import { HistoryManager } from '../history-manager.js';

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
      showBranding();
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
      showBranding();
      return;
    }

    if (history.length === 0) {
      console.log('\n📝 No command history yet');
      showBranding();
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

    showBranding();
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
    // Removed legacy helper functions
    // The displayHistory and summarizeHistory functions have been removed
    // as they are no longer needed. HistoryManager methods are now used instead.

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

    console.log('\n' + '─'.repeat(50));

    showBranding();
  });
