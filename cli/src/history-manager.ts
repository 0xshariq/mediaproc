
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getPluginNameForCommand } from './plugin-manager.js';

export interface HistoryEntry {
    id: number;
    timestamp: number;
    command: string;
    plugin: string;
    flags: Record<string, any>;
    args: string[];
    inputPath?: string;
    outputPath?: string;
    cwd: string;
    success: boolean;
    duration?: number;
}

const HISTORY_FILE = path.join(os.homedir(), '.mediaproc', 'history.json');
const MAX_HISTORY_ENTRIES = 1000;

export class HistoryManager {
    loadHistory(): HistoryEntry[] {
        try {
            this.ensureHistoryDirectory();
            if (!fs.existsSync(HISTORY_FILE)) return [];
            const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    saveHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp' | 'plugin'>): void {
        try {
            this.ensureHistoryDirectory();
            const history = this.loadHistory();
            const plugin = getPluginNameForCommand(entry.command);
            const newEntry: HistoryEntry = {
                ...entry,
                plugin,
                id: history.length > 0 ? Math.max(...history.map(e => e.id)) + 1 : 1,
                timestamp: Date.now(),
            };
            history.push(newEntry);
            const trimmed = history.slice(-MAX_HISTORY_ENTRIES);
            fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2));
        } catch { }
    }

    clearHistory(): void {
        try {
            if (fs.existsSync(HISTORY_FILE)) fs.unlinkSync(HISTORY_FILE);
        } catch { }
    }

    ensureHistoryDirectory(): void {
        const dir = path.dirname(HISTORY_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
    // Display history entries in a user-friendly way
    displayHistory(history: HistoryEntry[], limit: number): void {
        console.log('\n📝 Your MediaProc Command Usage\n');
        console.log('━'.repeat(70));
        const entries = history.slice(-limit).reverse();
        entries.forEach(entry => {
            const status = entry.success ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
            const plugin = entry.plugin || getPluginNameForCommand(entry.command);
            const flags = entry.flags ? Object.entries(entry.flags).map(([k, v]) => `--${k}=${v}`).join(' ') : '';
            const input = entry.inputPath ? `\x1b[90minput: ${entry.inputPath}\x1b[0m` : '';
            const output = entry.outputPath ? `\x1b[90moutput: ${entry.outputPath}\x1b[0m` : '';
            console.log(`\n${status} mediaproc ${entry.command} ${entry.args.join(' ')} ${flags} \x1b[90m[plugin: ${plugin}]\x1b[0m ${input} ${output}`);
        });
        console.log('\n' + '━'.repeat(70));
        console.log(`\nShowing last ${Math.min(limit, history.length)} of ${history.length} commands`);
        console.log('\n💡 Commands:');
        console.log('   mediaproc history replay <id>  - Replay a command');
        console.log('   mediaproc history search <q>   - Search history');
        console.log('   mediaproc history stats        - Show statistics');
        console.log('   mediaproc history --export     - Export sanitized summary\n');
    }

    // Summarize history for export: only command names, counts, plugin names
    summarizeHistory(history: HistoryEntry[]) {
        const summary: { commands: Record<string, { count: number, plugin: string }> } = { commands: {} };
        for (const entry of history) {
            const cmd = entry.command;
            const plugin = entry.plugin || getPluginNameForCommand(cmd);
            if (!summary.commands[cmd]) {
                summary.commands[cmd] = { count: 0, plugin };
            }
            summary.commands[cmd].count++;
        }
        return summary;
    }
}
