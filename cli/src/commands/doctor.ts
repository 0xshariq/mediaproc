import { Command } from 'commander';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  suggestion?: string;
}

export const doctorCommand = new Command()
  .name('doctor')
  .description('Run system diagnostics and health checks')
  .option('--verbose', 'Show detailed diagnostic information')
  .option('--fix', 'Attempt to fix issues automatically')
  .action(async (options) => {
    console.log('\n🔍 MediaProc System Diagnostics\n');
    console.log('━'.repeat(50));

    const results: DiagnosticResult[] = [];

    // Check Node.js version
    results.push(await checkNodeVersion());

    // Check FFmpeg
    results.push(await checkFFmpeg());

    // Check Sharp/libvips
    results.push(await checkSharp());

    // Check installed plugins
    results.push(await checkPlugins());

    // Check system resources
    results.push(await checkSystemResources());

    // Check for conflicts
    results.push(await checkConflicts());

    // Display results
    console.log('\n📊 Diagnostic Results:\n');
    
    let passCount = 0;
    let warnCount = 0;
    let failCount = 0;

    results.forEach((result) => {
      const icon = result.status === 'pass' ? '✓' : result.status === 'warn' ? '⚠' : '✗';
      const color = result.status === 'pass' ? '\x1b[32m' : result.status === 'warn' ? '\x1b[33m' : '\x1b[31m';
      
      console.log(`${color}${icon} ${result.name}\x1b[0m`);
      console.log(`  ${result.message}`);
      
      if (result.suggestion) {
        console.log(`  💡 ${result.suggestion}`);
      }
      console.log('');

      if (result.status === 'pass') passCount++;
      else if (result.status === 'warn') warnCount++;
      else failCount++;
    });

    // Summary
    console.log('━'.repeat(50));
    console.log(`\n📈 Summary: ${passCount} passed, ${warnCount} warnings, ${failCount} failed\n`);

    if (failCount > 0) {
      console.log('❌ Some critical issues found. Please resolve them before using MediaProc.');
      process.exit(1);
    } else if (warnCount > 0) {
      console.log('⚠️  Some warnings found. MediaProc should work, but consider fixing warnings.');
    } else {
      console.log('✅ All checks passed! MediaProc is ready to use.');
    }

    if (options.verbose) {
      console.log('\n📝 Detailed Information:');
      console.log(`   Node.js: ${process.version}`);
      console.log(`   Platform: ${process.platform}`);
      console.log(`   Architecture: ${process.arch}`);
      console.log(`   Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB used`);
    }
  });

async function checkNodeVersion(): Promise<DiagnosticResult> {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);

  if (major >= 18) {
    return {
      name: 'Node.js Version',
      status: 'pass',
      message: `${version} (compatible)`
    };
  } else if (major >= 16) {
    return {
      name: 'Node.js Version',
      status: 'warn',
      message: `${version} (works but upgrade recommended)`,
      suggestion: 'Upgrade to Node.js 18+ for best performance'
    };
  } else {
    return {
      name: 'Node.js Version',
      status: 'fail',
      message: `${version} (incompatible)`,
      suggestion: 'Please upgrade to Node.js 18 or higher'
    };
  }
}

async function checkFFmpeg(): Promise<DiagnosticResult> {
  try {
    const { stdout } = await execAsync('ffmpeg -version');
    const version = stdout.split('\n')[0].match(/ffmpeg version (\S+)/)?.[1] || 'unknown';
    
    return {
      name: 'FFmpeg',
      status: 'pass',
      message: `Version ${version} installed`
    };
  } catch (error) {
    return {
      name: 'FFmpeg',
      status: 'fail',
      message: 'Not installed',
      suggestion: 'Install FFmpeg: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)'
    };
  }
}

async function checkSharp(): Promise<DiagnosticResult> {
  try {
    require('sharp');
    return {
      name: 'Sharp (Image Processing)',
      status: 'pass',
      message: 'Installed and working'
    };
  } catch (error) {
    return {
      name: 'Sharp (Image Processing)',
      status: 'warn',
      message: 'Not found',
      suggestion: 'Install with: npm install -g sharp (optional but recommended for image processing)'
    };
  }
}

async function checkPlugins(): Promise<DiagnosticResult> {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return {
        name: 'Installed Plugins',
        status: 'warn',
        message: 'No package.json found',
        suggestion: 'Run commands from a project directory or install plugins globally'
      };
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const mediaprocPlugins = Object.keys(deps).filter(dep => dep.startsWith('@mediaproc/'));
    
    if (mediaprocPlugins.length === 0) {
      return {
        name: 'Installed Plugins',
        status: 'warn',
        message: 'No plugins found',
        suggestion: 'Install plugins with: mediaproc add <plugin-name>'
      };
    }

    return {
      name: 'Installed Plugins',
      status: 'pass',
      message: `${mediaprocPlugins.length} plugin(s) installed: ${mediaprocPlugins.map(p => p.replace('@mediaproc/', '')).join(', ')}`
    };
  } catch (error) {
    return {
      name: 'Installed Plugins',
      status: 'warn',
      message: 'Could not check plugins',
      suggestion: 'Ensure you have proper permissions'
    };
  }
}

async function checkSystemResources(): Promise<DiagnosticResult> {
  const totalMem = require('os').totalmem();
  const freeMem = require('os').freemem();
  const cpus = require('os').cpus().length;

  const totalGB = (totalMem / 1024 / 1024 / 1024).toFixed(1);
  const freeGB = (freeMem / 1024 / 1024 / 1024).toFixed(1);

  if (freeMem < 1024 * 1024 * 1024) { // Less than 1GB free
    return {
      name: 'System Resources',
      status: 'warn',
      message: `${cpus} CPU cores, ${freeGB}GB/${totalGB}GB RAM available`,
      suggestion: 'Low memory. Consider closing other applications for better performance'
    };
  }

  return {
    name: 'System Resources',
    status: 'pass',
    message: `${cpus} CPU cores, ${freeGB}GB/${totalGB}GB RAM available`
  };
}

async function checkConflicts(): Promise<DiagnosticResult> {
  // Check for common conflicts
  const conflicts: string[] = [];

  // Check for multiple sharp versions
  try {
    const { stdout } = await execAsync('npm ls sharp 2>/dev/null || true');
    const sharpMatches = stdout.match(/sharp@/g);
    if (sharpMatches && sharpMatches.length > 1) {
      conflicts.push('Multiple Sharp versions detected');
    }
  } catch (error) {
    // Ignore errors
  }

  if (conflicts.length > 0) {
    return {
      name: 'Dependency Conflicts',
      status: 'warn',
      message: conflicts.join(', '),
      suggestion: 'Run: npm dedupe to resolve conflicts'
    };
  }

  return {
    name: 'Dependency Conflicts',
    status: 'pass',
    message: 'No conflicts detected'
  };
}
