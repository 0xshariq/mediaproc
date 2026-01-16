import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface Template {
  name: string;
  command: string;
  description: string;
  parameters: string[];
  createdAt: number;
}

const TEMPLATES_FILE = path.join(os.homedir(), '.mediaproc', 'templates.json');

export const templateCommand = new Command()
  .name('template')
  .description('Manage command templates')
  .action(() => {
    templateCommand.help();
  });

// Save template
templateCommand
  .command('save')
  .description('Save command as template')
  .argument('<name>', 'Template name')
  .argument('<command>', 'Command template (use {param} for parameters)')
  .option('-d, --description <text>', 'Template description')
  .action(async (name: string, command: string, options) => {
    const templates = loadTemplates();

    if (templates[name]) {
      console.log(`\n⚠️  Template "${name}" already exists. Use --force to overwrite\n`);
      return;
    }

    // Extract parameters from command (anything in {braces})
    const params = command.match(/\{([^}]+)\}/g)?.map(p => p.slice(1, -1)) || [];

    templates[name] = {
      name,
      command,
      description: options.description || '',
      parameters: params,
      createdAt: Date.now()
    };

    saveTemplates(templates);

    console.log(`\n✓ Template "${name}" saved\n`);
    console.log(`Command: ${command}`);
    if (params.length > 0) {
      console.log(`Parameters: ${params.join(', ')}`);
    }
    console.log('');
  });

// Run template
templateCommand
  .command('run')
  .description('Run a saved template')
  .argument('<name>', 'Template name')
  .argument('[args...]', 'Template arguments (key=value)')
  .action(async (name: string, args: string[]) => {
    const templates = loadTemplates();
    const template = templates[name];

    if (!template) {
      console.log(`\n❌ Template "${name}" not found\n`);
      console.log('💡 List templates with: mediaproc template list\n');
      return;
    }

    // Parse arguments
    const params: Record<string, string> = {};
    args.forEach(arg => {
      const [key, value] = arg.split('=');
      if (key && value) {
        params[key] = value;
      }
    });

    // Replace parameters in command
    let command = template.command;
    template.parameters.forEach(param => {
      if (!params[param]) {
        console.log(`\n❌ Missing required parameter: ${param}\n`);
        process.exit(1);
      }
      command = command.replace(`{${param}}`, params[param]);
    });

    console.log(`\n🚀 Running template "${name}":\n`);
    console.log(`   ${command}\n`);
    console.log('⚠️  Note: Actual command execution requires full implementation\n');
    console.log(`Run manually: mediaproc ${command}\n`);
  });

// List templates
templateCommand
  .command('list')
  .description('List all saved templates')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const templates = loadTemplates();
    const templateList = Object.values(templates);

    if (templateList.length === 0) {
      console.log('\n📦 No templates saved\n');
      console.log('💡 Save a template with: mediaproc template save <name> <command>\n');
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(templateList, null, 2));
      return;
    }

    console.log('\n📋 Saved Templates\n');
    console.log('━'.repeat(70));

    templateList.forEach((template, index) => {
      console.log(`\n${index + 1}. \x1b[36m${template.name}\x1b[0m`);
      if (template.description) {
        console.log(`   ${template.description}`);
      }
      console.log(`   Command: ${template.command}`);
      if (template.parameters.length > 0) {
        console.log(`   Parameters: ${template.parameters.join(', ')}`);
      }
      console.log(`   Created: ${new Date(template.createdAt).toLocaleDateString()}`);
    });

    console.log('\n' + '━'.repeat(70));
    console.log('\n💡 Run a template: mediaproc template run <name> [args]\n');
  });

// Delete template
templateCommand
  .command('delete')
  .description('Delete a saved template')
  .argument('<name>', 'Template name')
  .action(async (name: string) => {
    const templates = loadTemplates();

    if (!templates[name]) {
      console.log(`\n❌ Template "${name}" not found\n`);
      return;
    }

    delete templates[name];
    saveTemplates(templates);

    console.log(`\n✓ Template "${name}" deleted\n`);
  });

// Show template details
templateCommand
  .command('show')
  .description('Show template details')
  .argument('<name>', 'Template name')
  .action(async (name: string) => {
    const templates = loadTemplates();
    const template = templates[name];

    if (!template) {
      console.log(`\n❌ Template "${name}" not found\n`);
      return;
    }

    console.log('\n📄 Template Details\n');
    console.log('━'.repeat(60));
    console.log(`\nName: ${template.name}`);
    if (template.description) {
      console.log(`Description: ${template.description}`);
    }
    console.log(`Command: ${template.command}`);
    
    if (template.parameters.length > 0) {
      console.log('\nParameters:');
      template.parameters.forEach(param => {
        console.log(`  • ${param}`);
      });

      console.log('\nExample usage:');
      const exampleArgs = template.parameters.map(p => `${p}=value`).join(' ');
      console.log(`  mediaproc template run ${template.name} ${exampleArgs}`);
    }

    console.log('\n' + '━'.repeat(60) + '\n');
  });

function loadTemplates(): Record<string, Template> {
  try {
    ensureTemplatesDirectory();

    if (!fs.existsSync(TEMPLATES_FILE)) {
      return {};
    }

    const data = fs.readFileSync(TEMPLATES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

function saveTemplates(templates: Record<string, Template>): void {
  try {
    ensureTemplatesDirectory();
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2));
  } catch (error) {
    console.error('Error saving templates:', error);
  }
}

function ensureTemplatesDirectory(): void {
  const dir = path.dirname(TEMPLATES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
