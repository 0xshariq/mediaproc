#!/usr/bin/env node
import { Command } from 'commander';
import { register } from './register.js';

const program = new Command();
program
  .name('mediaproc-document')
  .description('Document processing CLI (standalone mode)')
  .version('1.0.0');

register(program);
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
