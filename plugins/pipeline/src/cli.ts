#!/usr/bin/env node
import { Command } from 'commander';
import { LoggerManager } from '@orbytautomation/engine';
import { LogLevel } from '@dev-ecosystem/core';
import { version } from './register.js';
import { showPluginBranding } from '@mediaproc/core';
import { runPipelineCommand } from './commands/run.js';
import { validatePipelineCommand } from './commands/validate.js';
import { explainPipelineCommand } from './commands/explain.js';

async function main(): Promise<void> {
  // Initialize LoggerManager early so CliLogger is usable before the engine starts
  if (!LoggerManager.isReady()) {
    LoggerManager.initialize({
      level: LogLevel.FATAL,
      format: 'text',
      colors: true,
      timestamp: true,
      source: 'MediaProcPipeline',
      structuredEvents: false,
      category: 'system' as any,
    });
  }

  const program = new Command();
  program.name('mediaproc-pipeline').description('Standalone mode').version(version);

  runPipelineCommand(program);
  validatePipelineCommand(program);
  explainPipelineCommand(program);

  program.hook('postAction', () => {
    showPluginBranding('Pipeline');
  });

  await program.parseAsync(process.argv);

  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

