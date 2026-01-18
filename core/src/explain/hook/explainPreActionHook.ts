
import type { Command } from 'commander';
import { explainFlag } from '../explainFlag.js';

/**
 * Global preAction hook for Commander.js to support --explain and --explain=only.
 * Prints explanation before command runs. If --explain=only, exits after explanation.
 */
export function explainPreActionHook(thisCmd: Command, actionCmd?: Command): void {
  // Commander passes the command instance as 'thisCmd', and the subcommand as 'actionCmd'.
  // We'll use 'actionCmd' if available (for subcommands), otherwise 'thisCmd'.
  const cmd: Command = actionCmd || thisCmd;
  const opts = cmd.opts ? cmd.opts() : {};
  // Gather positional arguments if available (Commander stores them in cmd.args or cmd._args)
  let positionalArgs: Record<string, any> = {};
  if (Array.isArray((cmd as any).args) && (cmd as any).args.length > 0) {
    positionalArgs = { _: (cmd as any).args };
  }
  // Support --explain, --explain=details, --explain=only, etc.
  if (opts.explain) {
    explainFlag({
      command: cmd,
      args: positionalArgs,
      options: opts,
    });
    // If --explain=only, do not execute the command
    if (opts.explain === 'only') {
      process.exit(0);
    }
  }
}
