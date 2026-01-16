import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { showBranding } from '@mediaproc/core';

interface BatchJob {
  id: string;
  command: string;
  args: string[];
  files: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  priority: number;
}

interface BatchQueue {
  jobs: BatchJob[];
  status: 'idle' | 'running' | 'paused';
  workers: number;
}

const BATCH_FILE = path.join(os.homedir(), '.mediaproc', 'batch-queue.json');

export const batchCommand = new Command()
  .name('batch')
  .description('Manage batch processing queue')
  .action(() => {
    batchCommand.help();
  });

// Add job to queue
batchCommand
  .command('add')
  .description('Add job to batch queue')
  .argument('<command>', 'Command to run (e.g., "image resize")')
  .argument('[files...]', 'Files or glob patterns')
  .option('-p, --priority <number>', 'Job priority (higher = first)', '5')
  .option('--args <args>', 'Additional command arguments')
  .action(async (command: string, files: string[], options) => {
    const job: BatchJob = {
      id: generateJobId(),
      command,
      args: options.args ? options.args.split(' ') : [],
      files: files.length > 0 ? files : ['*'],
      status: 'pending',
      createdAt: Date.now(),
      progress: {
        total: files.length || 0,
        completed: 0,
        failed: 0
      },
      priority: parseInt(options.priority)
    };

    const queue = loadQueue();
    queue.jobs.push(job);
    saveQueue(queue);

    console.log(`\n✓ Job added to queue: ${job.id}`);
    console.log(`  Command: mediaproc ${command} ${job.args.join(' ')}`);
    console.log(`  Files: ${job.files.join(', ')}`);
    console.log(`  Priority: ${job.priority}\n`);
    showBranding();
  });

// Start processing queue
batchCommand
  .command('start')
  .description('Start processing batch queue')
  .option('-w, --workers <number>', 'Number of parallel workers', '4')
  .action(async (options) => {
    const queue = loadQueue();

    if (queue.jobs.length === 0) {
      console.log('\n📦 Batch queue is empty\n');
      console.log('💡 Add jobs with: mediaproc batch add <command> [files]\n');
      return;
    }

    if (queue.status === 'running') {
      console.log('\n⚠️  Batch queue is already running\n');
      return;
    }

    const workers = parseInt(options.workers);
    queue.workers = workers;
    queue.status = 'running';
    saveQueue(queue);

    console.log(`\n🚀 Starting batch processor with ${workers} workers\n`);
    console.log('━'.repeat(60));

    displayQueueStatus(queue);

    console.log('\n💡 Commands:');
    console.log('   mediaproc batch status  - Check progress');
    console.log('   mediaproc batch pause   - Pause processing');
    console.log('   mediaproc batch cancel  - Cancel all jobs\n');

    // In real implementation, this would spawn workers and process jobs
    console.log('⚠️  Note: Actual job processing requires full implementation\n');
    showBranding();
  });

// Show queue status
batchCommand
  .command('status')
  .description('Show batch queue status')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const queue = loadQueue();

    if (options.json) {
      console.log(JSON.stringify(queue, null, 2));
      return;
    }

    console.log('\n📊 Batch Queue Status\n');
    console.log('━'.repeat(60));

    displayQueueStatus(queue);

    console.log('\n');
    showBranding();
  });

// Pause queue
batchCommand
  .command('pause')
  .description('Pause batch processing')
  .action(async () => {
    const queue = loadQueue();

    if (queue.status !== 'running') {
      console.log('\n⚠️  Batch queue is not running\n');
      return;
    }

    queue.status = 'paused';
    saveQueue(queue);

    console.log('\n⏸️  Batch queue paused\n');
    console.log('💡 Resume with: mediaproc batch resume\n');
    showBranding();
  });

// Resume queue
batchCommand
  .command('resume')
  .description('Resume batch processing')
  .action(async () => {
    const queue = loadQueue();

    if (queue.status !== 'paused') {
      console.log('\n⚠️  Batch queue is not paused\n');
      return;
    }

    queue.status = 'running';
    saveQueue(queue);

    console.log('\n▶️  Batch queue resumed\n');
    showBranding();
  });

// Cancel all jobs
batchCommand
  .command('cancel')
  .description('Cancel all jobs in queue')
  .option('--job <id>', 'Cancel specific job')
  .action(async (options) => {
    const queue = loadQueue();

    if (options.job) {
      const index = queue.jobs.findIndex(j => j.id === options.job);
      if (index === -1) {
        console.log(`\n❌ Job ${options.job} not found\n`);
        return;
      }
      queue.jobs.splice(index, 1);
      saveQueue(queue);
      console.log(`\n✓ Job ${options.job} cancelled\n`);
    } else {
      queue.jobs = [];
      queue.status = 'idle';
      saveQueue(queue);
      console.log('\n✓ All jobs cancelled\n');
      showBranding();
    }
  });

// List all jobs
batchCommand
  .command('list')
  .description('List all jobs in queue')
  .option('--status <status>', 'Filter by status')
  .action(async (options) => {
    const queue = loadQueue();

    let jobs = queue.jobs;
    if (options.status) {
      jobs = jobs.filter(j => j.status === options.status);
    }

    if (jobs.length === 0) {
      console.log('\n📦 No jobs in queue\n');
      return;
    }

    console.log('\n📋 Batch Jobs\n');
    console.log('━'.repeat(70));

    jobs.forEach(job => {
      const statusIcon = getStatusIcon(job.status);
      const progress = job.progress.total > 0
        ? `${job.progress.completed}/${job.progress.total}`
        : 'N/A';

      console.log(`\n${statusIcon} \x1b[36m${job.id}\x1b[0m (Priority: ${job.priority})`);
      console.log(`   Command: mediaproc ${job.command} ${job.args.join(' ')}`);
      console.log(`   Files: ${job.files.join(', ')}`);
      console.log(`   Progress: ${progress} completed, ${job.progress.failed} failed`);
      console.log(`   Created: ${new Date(job.createdAt).toLocaleString()}`);
    });

    console.log('\n' + '━'.repeat(70) + '\n');
    showBranding();
  });

// Clear completed jobs
batchCommand
  .command('clear')
  .description('Clear completed and failed jobs')
  .action(async () => {
    const queue = loadQueue();
    const before = queue.jobs.length;

    queue.jobs = queue.jobs.filter(j => j.status === 'pending' || j.status === 'running');
    saveQueue(queue);

    const removed = before - queue.jobs.length;
    console.log(`\n✓ Cleared ${removed} completed/failed jobs\n`);
    showBranding();
  });

function loadQueue(): BatchQueue {
  try {
    ensureBatchDirectory();

    if (!fs.existsSync(BATCH_FILE)) {
      return {
        jobs: [],
        status: 'idle',
        workers: 4
      };
    }

    const data = fs.readFileSync(BATCH_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {
      jobs: [],
      status: 'idle',
      workers: 4
    };
  }
}

function saveQueue(queue: BatchQueue): void {
  try {
    ensureBatchDirectory();
    fs.writeFileSync(BATCH_FILE, JSON.stringify(queue, null, 2));
  } catch (error) {
    console.error('Error saving queue:', error);
  }
}

function displayQueueStatus(queue: BatchQueue): void {
  const totalJobs = queue.jobs.length;
  const pending = queue.jobs.filter(j => j.status === 'pending').length;
  const running = queue.jobs.filter(j => j.status === 'running').length;
  const completed = queue.jobs.filter(j => j.status === 'completed').length;
  const failed = queue.jobs.filter(j => j.status === 'failed').length;

  const totalFiles = queue.jobs.reduce((sum, j) => sum + j.progress.total, 0);
  const completedFiles = queue.jobs.reduce((sum, j) => sum + j.progress.completed, 0);
  const failedFiles = queue.jobs.reduce((sum, j) => sum + j.progress.failed, 0);

  console.log(`\nQueue Status: ${getQueueStatusColor(queue.status)}${queue.status.toUpperCase()}\x1b[0m`);
  console.log(`Workers: ${queue.workers}`);

  console.log(`\nJobs: ${totalJobs} total`);
  console.log(`  Pending: ${pending}`);
  console.log(`  Running: ${running}`);
  console.log(`  Completed: ${completed}`);
  console.log(`  Failed: ${failed}`);

  if (totalFiles > 0) {
    const progress = (completedFiles / totalFiles) * 100;
    const barLength = 30;
    const filled = Math.floor((progress / 100) * barLength);
    const bar = '▓'.repeat(filled) + '░'.repeat(barLength - filled);

    console.log(`\nFiles: ${completedFiles}/${totalFiles} (${progress.toFixed(1)}%)`);
    console.log(`[${bar}]`);

    if (failedFiles > 0) {
      console.log(`Failed: ${failedFiles}`);
    }
  }
}

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    pending: '⏳',
    running: '🔄',
    completed: '✓',
    failed: '✗',
    paused: '⏸️'
  };
  return icons[status] || '●';
}

function getQueueStatusColor(status: string): string {
  const colors: Record<string, string> = {
    idle: '\x1b[90m',
    running: '\x1b[32m',
    paused: '\x1b[33m'
  };
  return colors[status] || '';
}

function generateJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function ensureBatchDirectory(): void {
  const dir = path.dirname(BATCH_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
