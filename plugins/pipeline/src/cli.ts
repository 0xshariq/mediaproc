#!/usr/bin/env node
import { Command } from 'commander';
import { version } from './register.js';
import { showPluginBranding } from '@mediaproc/core';
import { runPipelineCommand } from './commands/run.js';
import { validatePipelineCommand } from './commands/validate.js';
import { explainPipelineCommand } from './commands/explain.js';

async function main(): Promise<void> {
  // LoggerManager is initialized by OrbytEngine at the correct log level.
  // A premature FATAL-level init here would silence all engine logs by winning
  // the singleton race before the engine's own initialize() call runs.

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

