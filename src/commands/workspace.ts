import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

interface WorkspaceConfig {
  name: string;
  description: string;
  presets: Record<string, any>;
  rules: WorkspaceRule[];
  createdAt: number;
  lastUsed: number;
}

interface WorkspaceRule {
  pattern: string;
  command: string;
  args: Record<string, any>;
}

const WORKSPACE_DIR = '.mediaproc';

export const workspaceCommand = new Command()
  .name('workspace')
  .description('Manage project workspaces and batch processing rules')
  .action(() => {
    workspaceCommand.help();
  });

// Create workspace
workspaceCommand
  .command('create')
  .description('Create a new workspace')
  .argument('<name>', 'Workspace name')
  .option('-d, --description <text>', 'Workspace description')
  .option('--preset <type>', 'Use preset (web, mobile, print, social)')
  .action(async (name: string, options) => {
    if (fs.existsSync(path.join(WORKSPACE_DIR, `${name}.json`))) {
      console.log(`\n⚠️  Workspace "${name}" already exists\n`);
      return;
    }

    const config: WorkspaceConfig = {
      name,
      description: options.description || '',
      presets: getPresets(options.preset),
      rules: [],
      createdAt: Date.now(),
      lastUsed: Date.now()
    };

    ensureWorkspaceDirectory();
    fs.writeFileSync(
      path.join(WORKSPACE_DIR, `${name}.json`),
      JSON.stringify(config, null, 2)
    );

    console.log(`\n✓ Workspace "${name}" created\n`);
    if (options.preset) {
      console.log(`Using ${options.preset} preset settings`);
    }
    console.log('');
  });

// Use workspace
workspaceCommand
  .command('use')
  .description('Set active workspace')
  .argument('<name>', 'Workspace name')
  .action(async (name: string) => {
    const workspacePath = path.join(WORKSPACE_DIR, `${name}.json`);
    
    if (!fs.existsSync(workspacePath)) {
      console.log(`\n❌ Workspace "${name}" not found\n`);
      return;
    }

    const config: WorkspaceConfig = JSON.parse(fs.readFileSync(workspacePath, 'utf-8'));
    config.lastUsed = Date.now();
    fs.writeFileSync(workspacePath, JSON.stringify(config, null, 2));

    // Set as active workspace
    fs.writeFileSync(
      path.join(WORKSPACE_DIR, 'active.txt'),
      name
    );

    console.log(`\n✓ Workspace "${name}" is now active\n`);
  });

// List workspaces
workspaceCommand
  .command('list')
  .description('List all workspaces')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const workspaces = listWorkspaces();

    if (workspaces.length === 0) {
      console.log('\n📦 No workspaces created\n');
      console.log('💡 Create one with: mediaproc workspace create <name>\n');
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(workspaces, null, 2));
      return;
    }

    const active = getActiveWorkspace();

    console.log('\n📁 Workspaces\n');
    console.log('━'.repeat(60));

    workspaces.forEach((ws, index) => {
      const isActive = ws.name === active;
      const indicator = isActive ? '\x1b[32m●\x1b[0m' : ' ';
      
      console.log(`\n${indicator} ${index + 1}. \x1b[36m${ws.name}\x1b[0m${isActive ? ' (active)' : ''}`);
      if (ws.description) {
        console.log(`   ${ws.description}`);
      }
      console.log(`   Rules: ${ws.rules.length}`);
      console.log(`   Last used: ${new Date(ws.lastUsed).toLocaleDateString()}`);
    });

    console.log('\n' + '━'.repeat(60) + '\n');
  });

// Add rule
workspaceCommand
  .command('add-rule')
  .description('Add processing rule to workspace')
  .argument('<workspace>', 'Workspace name')
  .option('--pattern <pattern>', 'File pattern (e.g., "*.jpg")', '*')
  .option('--command <cmd>', 'Command to run', 'image optimize')
  .option('--args <json>', 'Command arguments as JSON')
  .action(async (workspace: string, options) => {
    const workspacePath = path.join(WORKSPACE_DIR, `${workspace}.json`);
    
    if (!fs.existsSync(workspacePath)) {
      console.log(`\n❌ Workspace "${workspace}" not found\n`);
      return;
    }

    const config: WorkspaceConfig = JSON.parse(fs.readFileSync(workspacePath, 'utf-8'));
    
    const rule: WorkspaceRule = {
      pattern: options.pattern,
      command: options.command,
      args: options.args ? JSON.parse(options.args) : {}
    };

    config.rules.push(rule);
    fs.writeFileSync(workspacePath, JSON.stringify(config, null, 2));

    console.log(`\n✓ Rule added to workspace "${workspace}"\n`);
    console.log(`Pattern: ${rule.pattern}`);
    console.log(`Command: ${rule.command}\n`);
  });

// Process with workspace
workspaceCommand
  .command('process')
  .description('Process files using workspace rules')
  .argument('<directory>', 'Directory to process')
  .option('--workspace <name>', 'Workspace to use (defaults to active)')
  .option('--dry-run', 'Show what would be processed without executing')
  .action(async (directory: string, options) => {
    const workspaceName = options.workspace || getActiveWorkspace();
    
    if (!workspaceName) {
      console.log('\n❌ No active workspace. Set one with: mediaproc workspace use <name>\n');
      return;
    }

    const workspacePath = path.join(WORKSPACE_DIR, `${workspaceName}.json`);
    const config: WorkspaceConfig = JSON.parse(fs.readFileSync(workspacePath, 'utf-8'));

    console.log(`\n🚀 Processing with workspace "${workspaceName}"\n`);
    console.log(`Directory: ${directory}`);
    console.log(`Rules: ${config.rules.length}\n`);

    if (options.dryRun) {
      console.log('📄 Dry run - showing what would be processed:\n');
      config.rules.forEach((rule, index) => {
        console.log(`${index + 1}. Pattern: ${rule.pattern}`);
        console.log(`   Command: mediaproc ${rule.command}`);
      });
      console.log('');
    } else {
      console.log('⚠️  Note: Actual processing requires full implementation\n');
    }
  });

// Delete workspace
workspaceCommand
  .command('delete')
  .description('Delete a workspace')
  .argument('<name>', 'Workspace name')
  .action(async (name: string) => {
    const workspacePath = path.join(WORKSPACE_DIR, `${name}.json`);
    
    if (!fs.existsSync(workspacePath)) {
      console.log(`\n❌ Workspace "${name}" not found\n`);
      return;
    }

    fs.unlinkSync(workspacePath);
    console.log(`\n✓ Workspace "${name}" deleted\n`);
  });

function ensureWorkspaceDirectory(): void {
  if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
  }
}

function listWorkspaces(): WorkspaceConfig[] {
  if (!fs.existsSync(WORKSPACE_DIR)) {
    return [];
  }

  const files = fs.readdirSync(WORKSPACE_DIR)
    .filter(f => f.endsWith('.json') && f !== 'workspace.json');

  return files.map(f => {
    const data = fs.readFileSync(path.join(WORKSPACE_DIR, f), 'utf-8');
    return JSON.parse(data);
  });
}

function getActiveWorkspace(): string | null {
  const activePath = path.join(WORKSPACE_DIR, 'active.txt');
  if (fs.existsSync(activePath)) {
    return fs.readFileSync(activePath, 'utf-8').trim();
  }
  return null;
}

function getPresets(preset?: string): Record<string, any> {
  const presets: Record<string, any> = {
    web: {
      image: { format: 'webp', quality: 85, maxWidth: 1920 },
      video: { codec: 'h264', quality: 'medium' }
    },
    mobile: {
      image: { format: 'webp', quality: 80, maxWidth: 1080 },
      video: { codec: 'h264', quality: 'low', maxWidth: 720 }
    },
    print: {
      image: { format: 'tiff', quality: 100, dpi: 300 }
    },
    social: {
      image: { format: 'jpg', quality: 90, maxWidth: 1200 },
      video: { codec: 'h264', quality: 'high', maxDuration: 60 }
    }
  };

  return preset ? presets[preset] || {} : {};
}
