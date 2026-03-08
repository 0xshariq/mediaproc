import {
  BaseAdapter,
  AdapterResultBuilder,
  CLIAdapter,
  type AdapterContext,
  type AdapterResult,
} from '@orbytautomation/engine';
import { parseMediaProcAction, MediaProcActionParseError } from '../core/MediaProcActionResolver.js';

// Shared CLIAdapter instance — handles spawn, timeout, stdout/stderr, and result building
const _cli = new CLIAdapter();

/**
 * MediaProc Adapter
 *
 * Orbyt `BaseAdapter` implementation that handles all `mediaproc.*` actions.
 *
 * When the engine encounters a step like:
 *   uses: mediaproc.image.resize
 *   with:
 *     input: photo.jpg
 *     width: 1920
 *
 * This adapter:
 *  1. Parses the action string into { plugin, command }
 *  2. Translates `with` fields into CLI flags
 *  3. Shells out to `mediaproc <plugin> <command> [flags]`
 *  4. Returns a structured AdapterResult
 *
 * Plugin lifecycle (install/load/update) is handled by the mediaproc CLI.
 * If a plugin is missing, the mediaproc process will exit non-zero and the
 * adapter surfaces that error through the normal AdapterResult failure path.
 *
 * Flag mapping rules (plugin-agnostic):
 *  - input  → positional first argument (no flag)
 *  - output → -o <value>
 *  - All other keys → --<kebab-key> <value>
 *  - Boolean true   → --<key> (no value)
 *  - Boolean false  → omitted
 *  - Arrays         → repeated flag: --<key> <v1> --<key> <v2>
 */
export class MediaProcAdapter extends BaseAdapter {
  readonly name = 'mediaproc';
  readonly version = '1.0.0';
  readonly description = 'MediaProc media-processing adapter — executes mediaproc CLI commands';
  readonly supportedActions = ['mediaproc.*'];
  readonly capabilities = {
    actions: ['mediaproc.*'],
    concurrent: true,
    cacheable: false,
    idempotent: false,
    resources: { filesystem: true },
    cost: 'medium' as const,
  };

  async execute(
    action: string,
    input: Record<string, any>,
    context: AdapterContext,
  ): Promise<AdapterResult> {
    const startTime = Date.now();

    // --- Parse action string -------------------------------------------------
    let parsed;
    try {
      parsed = parseMediaProcAction(action);
    } catch (err) {
      const msg = err instanceof MediaProcActionParseError
        ? err.message
        : `Cannot parse action "${action}"`;
      return new AdapterResultBuilder()
        .duration(Date.now() - startTime)
        .failure({ message: msg })
        .log(msg)
        .build();
    }

    const { plugin, command } = parsed;

    // --- Build CLI args -------------------------------------------------------
    const args = this._buildArgs(plugin, command, input);

    // --- Execute via built-in CLIAdapter -------------------------------------
    return _cli.execute('cli.run', {
      command: 'mediaproc',
      args,
      cwd: context.cwd,
      timeout: context.timeout,
      throwOnError: false,
    }, context);
  }

  // ---------------------------------------------------------------------------
  // Arg builder (plugin-agnostic)
  // ---------------------------------------------------------------------------

  private _buildArgs(plugin: string, command: string, input: Record<string, any>): string[] {
    const args: string[] = [plugin, command];

    // Extract special fields
    const inputPath: string | undefined =
      typeof input.input === 'string' ? input.input : undefined;
    const outputPath: string | undefined =
      typeof input.output === 'string' ? input.output : undefined;

    // input is positional (first after command)
    if (inputPath !== undefined) {
      args.push(inputPath);
    }

    // output gets -o flag
    if (outputPath !== undefined) {
      args.push('-o', outputPath);
    }

    // Everything else → --kebab-key [value]
    for (const [key, value] of Object.entries(input)) {
      if (key === 'input' || key === 'output') continue;
      if (value === undefined || value === null) continue;

      const flag = '--' + this._toKebab(key);

      if (typeof value === 'boolean') {
        if (value) args.push(flag);
        // false → omit
      } else if (Array.isArray(value)) {
        for (const item of value) {
          args.push(flag, String(item));
        }
      } else {
        args.push(flag, String(value));
      }
    }

    return args;
  }

  private _toKebab(camel: string): string {
    return camel.replace(/([A-Z])/g, '-$1').toLowerCase();
  }
}
