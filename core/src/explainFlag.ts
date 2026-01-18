import chalk from 'chalk';
import { explainFormatter, ExplainFormat } from './formatters/explainFormatter.js';
import { getCliVersion, getVersion } from './branding/branding.js';
import { ExplainContext } from './types/explainTypes.js';
import os from 'os';


/**
 * explainFlag - Automatically gathers command context, prints explanation, then runs the handler.
 * @param params - { commandName, args, options, handler }
 */
export function explainFlag({
  command,
  args = {},
  options = {},
  inputKeys = ['input', 'inputPath'],
  outputKeys = ['output', 'outputPath', 'o'],
  format = 'human',
}: {
  command: any;
  args?: Record<string, any>;
  options?: Record<string, any>;
  inputKeys?: string[];
  outputKeys?: string[];
  format?: ExplainFormat;
}) {
  // Auto-detect command name
  const commandName = command?.name?.() || command?._name || 'unknown';
  const environment = {
    cwd: process.cwd(),
    os: `${os.type()} ${os.release()} (${os.platform()})`,
    nodeVersion: process.version,
    shell: process.env.SHELL || process.env.TERM || 'unknown',
  };
  // Detect input/output paths and gather all input/output arguments
  let inputPath = '';
  let outputPath = '';
  let allInputs: Record<string, any> = {};
  let allOutputs: Record<string, any> = {};
  for (const k of inputKeys) {
    if (args[k]) { inputPath = args[k]; allInputs[k] = args[k]; }
    if (options[k]) { inputPath = options[k]; allInputs[k] = options[k]; }
  }
  for (const k of outputKeys) {
    if (args[k]) { outputPath = args[k]; allOutputs[k] = args[k]; }
    if (options[k]) { outputPath = options[k]; allOutputs[k] = options[k]; }
  }

  // Gather used flags
  let explainValue: string | undefined = undefined;
  if (typeof options.explain === 'string') {
    explainValue = options.explain;
  } else if (Array.isArray(args._) && args._.length > 0) {
    // Check for --explain details as positional
    const idx = args._.findIndex((v: any) => v === 'explain');
    if (idx !== -1 && args._[idx + 1]) {
      explainValue = args._[idx + 1];
    }
  }
  if (explainValue === 'details' || explainValue === 'json' || explainValue === 'human') {
    format = explainValue;
  } else if (explainValue) {
    // fallback for unknown explain values
    console.warn(chalk.yellow(`Unknown explain format: ${explainValue}, using 'human' mode.`));
    format = 'human';
  }
  // Gather all possible flags from command (Commander.js API)
  const usedFlags: Record<string, { value: any; source: 'user' | 'system' | 'default' } > = {};
  const omittedFlags: Record<string, { defaultValue: any; source: 'default' }> = {};
  if (command && typeof command.options === 'object') {
    for (const opt of command.options) {
      const flagName = opt.attributeName || opt.long?.replace(/^--/, '') || opt.short?.replace(/^-/, '');
      if (!flagName) continue;
      let userValue = options[flagName];
      // Handle boolean flags
      if (typeof userValue === 'boolean') userValue = userValue ? 'enabled' : 'disabled';
      // Handle array flags
      if (Array.isArray(userValue)) userValue = userValue.join(', ');
      if (userValue !== undefined) {
        usedFlags[flagName] = { value: userValue, source: 'user' };
      } else if (Object.prototype.hasOwnProperty.call(opt, 'defaultValue')) {
        let defVal = opt.defaultValue;
        if (typeof defVal === 'boolean') defVal = defVal ? 'enabled' : 'disabled';
        if (Array.isArray(defVal)) defVal = defVal.join(', ');
        usedFlags[flagName] = { value: defVal, source: 'default' };
        omittedFlags[flagName] = { defaultValue: defVal, source: 'default' };
      } else {
        usedFlags[flagName] = { value: undefined, source: 'system' };
      }
    }
  } else {
    for (const [key, value] of Object.entries(options)) {
      if (key === 'explain') continue;
      let val = value;
      if (typeof val === 'boolean') val = val ? 'enabled' : 'disabled';
      if (Array.isArray(val)) val = val.join(', ');
      usedFlags[key] = { value: val, source: val !== undefined ? 'user' : 'system' };
    }
  }

  // Build ExplainContext with plugin/command info and version
  // Get CLI and plugin version using branding utilities
  let cliVersion: string | undefined = undefined;
  let pluginVersion: string | undefined = undefined;
  try {
    cliVersion = getCliVersion();
    // Try to get plugin version from parent command's package.json if available
    if (command?.parent?.name?.()) {
      // Assume plugin package.json is at ../../plugins/<plugin>/package.json
      const pluginName = command.parent.name();
      const pluginPath = `../../plugins/${pluginName}/package.json`;
      pluginVersion = getVersion(pluginPath);
    }
  } catch (error) {
    console.error(chalk.red('Error retrieving version information:'), error);
  }

  const context: ExplainContext = {
    command: commandName,
    plugin: command?.parent?.name?.() || undefined,
    cliVersion,
    pluginVersion,
    inputs: { inputPath, outputPath, ...allInputs },
    outputs: Object.keys(allOutputs).length > 0 ? allOutputs : undefined,
    usedFlags,
    omittedFlags: Object.keys(omittedFlags).length > 0 ? omittedFlags : undefined,
    decisions: Object.entries(usedFlags).map(([key, v]) => ({
      key,
      value: v.value,
      reason: v.source === 'user' ? 'user specified' : (v.source === 'default' ? 'default' : 'system'),
    })),
    outcome: {
      result: outputPath ? `A new file will be created at ${outputPath}` : 'Operation will complete',
      sideEffects: [
        'Input validation is performed to ensure correct file types and dimensions.',
        'Output paths are resolved and checked for conflicts.',
        'Image processing is performed using the selected options and flags.',
        'Results and logs are displayed after processing each file.'
      ],
      errors: [], // Placeholder for error reporting
      warnings: [], // Placeholder for warning reporting
    },
    explainFlow: [
      '1. Parse and validate all user-provided flags and arguments.',
      '2. Check input and output paths for validity and existence.',
      '3. Prepare configuration for image processing (width, height, quality, etc.).',
      '4. For each input file, process and apply transformations.',
      '5. Save output files and display results.',
      '6. Show summary and any errors encountered.'
    ],
    environment,
    technical: {
      library: 'sharp',
      tool: 'mediaproc',
      performance: 'optimized for batch image processing',
      fileFormats: ['jpg', 'png', 'webp'],
      compressionRatio: 'varies by format and quality',
      estimatedTime: 'depends on input size and options',
      memoryUsage: 'depends on batch size and image dimensions',
    },
  };

  // Print explanation only
  const explanation = explainFormatter(context, format);
  if (format === 'json') {
    // Add a styled header for JSON output
    // Print JSON with a clear header
    console.log(chalk.bold.bgBlueBright.white(' EXPLANATION (JSON) '));
    console.log(chalk.gray(JSON.stringify(explanation, null, 2)));
  } else {
    console.log(explanation);
  }
}
