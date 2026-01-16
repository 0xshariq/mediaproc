import { Command } from 'commander';
import * as os from 'os';

interface BenchmarkResult {
  operation: string;
  duration: number;
  throughput?: number;
  memoryUsed: number;
}

export const benchmarkCommand = new Command()
  .name('benchmark')
  .description('Run performance benchmarks')
  .option('--system', 'Benchmark system capabilities')
  .option('--plugin <name>', 'Benchmark specific plugin')
  .option('--operation <name>', 'Benchmark specific operation')
  .option('--file <path>', 'Test file to use for benchmarking')
  .option('--iterations <n>', 'Number of iterations', '5')
  .option('--json', 'Output as JSON')
  .action(async (options): Promise<void> => {
    if (options.system) {
      await runSystemBenchmark(options.json);
      return;
    }

    if (options.plugin && options.operation) {
      await runOperationBenchmark(options.plugin, options.operation, options.file, parseInt(options.iterations), options.json);
      return;
    }

    console.log('\n⚠️  Please specify --system or --plugin + --operation\n');
    benchmarkCommand.help();
  });

async function runSystemBenchmark(json: boolean): Promise<void> {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const platform = os.platform();
  const arch = os.arch();

  const sysInfo = {
    cpu: {
      model: cpus[0].model,
      cores: cpus.length,
      speed: cpus[0].speed
    },
    memory: {
      total: totalMem,
      free: freeMem,
      used: totalMem - freeMem
    },
    platform,
    arch
  };

  if (json) {
    console.log(JSON.stringify(sysInfo, null, 2));
    return;
  }

  console.log('\n📊 System Benchmark\n');
  console.log('━'.repeat(60));

  console.log('\n💻 CPU:');
  console.log(`   Model: ${sysInfo.cpu.model}`);
  console.log(`   Cores: ${sysInfo.cpu.cores}`);
  console.log(`   Speed: ${sysInfo.cpu.speed} MHz`);

  console.log('\n📦 Memory:');
  console.log(`   Total: ${formatBytes(sysInfo.memory.total)}`);
  console.log(`   Free:  ${formatBytes(sysInfo.memory.free)}`);
  console.log(`   Used:  ${formatBytes(sysInfo.memory.used)}`);

  console.log('\n💻 System:');
  console.log(`   Platform: ${sysInfo.platform}`);
  console.log(`   Architecture: ${sysInfo.arch}`);

  console.log('\n💡 Recommendations:');
  
  const recommendedWorkers = Math.max(1, sysInfo.cpu.cores - 2);
  console.log(`   Recommended workers: ${recommendedWorkers}`);
  
  if (sysInfo.memory.free < 1024 * 1024 * 1024) {
    console.log(`   ⚠️  Low memory - consider closing other apps`);
  }

  if (sysInfo.cpu.cores >= 8) {
    console.log(`   ✓ Great for parallel processing`);
  }

  console.log('\n' + '━'.repeat(60) + '\n');
}

async function runOperationBenchmark(
  plugin: string,
  operation: string,
  file: string | undefined,
  iterations: number,
  json: boolean
): Promise<void> {
  console.log(`\n📏 Benchmarking ${plugin} ${operation}\n`);
  console.log('━'.repeat(60));

  if (!file) {
    console.log('\n❌ No test file specified. Use --file <path>\n');
    return;
  }

  console.log(`\nTest file: ${file}`);
  console.log(`Iterations: ${iterations}\n`);
  console.log('⚠️  Note: Actual benchmarking requires full plugin implementation\n');

  // Simulated results
  const results: BenchmarkResult[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const duration = 200 + Math.random() * 100; // Simulated
    const memoryUsed = process.memoryUsage().heapUsed;
    
    results.push({
      operation: `${plugin} ${operation}`,
      duration,
      memoryUsed
    });
  }

  if (json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // Calculate statistics
  const durations = results.map(r => r.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);

  console.log('📊 Results:\n');
  console.log(`   Average: ${avgDuration.toFixed(2)}ms`);
  console.log(`   Min:     ${minDuration.toFixed(2)}ms`);
  console.log(`   Max:     ${maxDuration.toFixed(2)}ms`);
  console.log(`   Std Dev: ${calculateStdDev(durations).toFixed(2)}ms`);

  console.log('\n' + '━'.repeat(60) + '\n');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}

function calculateStdDev(numbers: number[]): number {
  const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squareDiffs = numbers.map(n => Math.pow(n - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
}
