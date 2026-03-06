#!/usr/bin/env node
import { Command } from 'commander';
import { register, version } from './register.js';

const program = new Command();
program.name('mediaproc-pipeline').description('Standalone mode').version(version);
register(program);
program.parse(process.argv);
if (!process.argv.slice(2).length) program.outputHelp();
