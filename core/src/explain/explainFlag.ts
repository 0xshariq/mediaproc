
import chalk from 'chalk';
import { explainFormatter } from '../formatters/explainFormatter.js';
import { getCliVersion, getVersion } from '../branding/branding.js';
import { ExplainContext, ExplainMode } from '../types/explainTypes.js';
import os from 'os';
import fs from 'fs';
import path from 'path';


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
  mode = ExplainMode.Human,
}: {
  command: any;
  args?: Record<string, any>;
  options?: Record<string, any>;
  inputKeys?: string[];
  outputKeys?: string[];
  mode?: ExplainMode;
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
  let explainOnly = false;
  if (typeof options.explain === 'string') {
    explainValue = options.explain;
    if (explainValue === 'only') explainOnly = true;
  } else if (Array.isArray(args._) && args._.length > 0) {
    // Check for --explain details as positional
    const idx = args._.findIndex((v: any) => v === 'explain');
    if (idx !== -1 && args._[idx + 1]) {
      explainValue = args._[idx + 1];
      if (explainValue === 'only') explainOnly = true;
    }
  }
  if (explainValue === 'details') {
    mode = ExplainMode.Details;
  } else if (explainValue === 'json') {
    mode = ExplainMode.Json;
  } else if (explainValue === 'human') {
    mode = ExplainMode.Human;
  } else if (explainValue) {
    // fallback for unknown explain values
    console.warn(chalk.yellow(`warn: unknown explain mode "${explainValue}", falling back to "human"`));
    mode = ExplainMode.Human;
  }
  // Gather all possible flags from command (Commander.js API)
  const usedFlags: Record<string, { value: any; source: 'user' | 'system' | 'default' }> = {};
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
    schemaVersion: '1.0', // Tier 3 placeholder
    command: commandName,
    plugin: command?.parent?.name?.() || undefined,
    cliVersion,
    pluginVersion,
    // Context enrichment
    timestamp: new Date().toISOString(),
    user: process.env.USER || process.env.USERNAME || 'unknown',
    platform: `${os.platform()} ${os.arch()}`,
    mode,
    summary: outputPath
      ? `Resize/Process file(s) and write result to ${outputPath}`
      : `Operation will complete (no output path specified)`,
    inputs: { inputPath, outputPath, ...allInputs },
    outputs: Object.keys(allOutputs).length > 0 ? allOutputs : undefined,
    usedFlags,
    omittedFlags: Object.keys(omittedFlags).length > 0 ? omittedFlags : undefined,
    decisions: Object.entries(usedFlags).map(([key, v]) => ({
      key,
      value: v.value,
      reason: v.source === 'user' ? 'user specified' : (v.source === 'default' ? 'default' : 'system'),
      provenance: v.source,
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
      confidence: 'high', // Tier 4 placeholder
      whatWillNotHappen: [ // Tier 4 placeholder
        'Original files will not be modified',
        'No network requests will be made'
      ]
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
    explainOnly,
    technical: {
      library: 'sharp',
      tool: 'mediaproc',
      performance: 'optimized for batch image processing',
      fileFormats: ['jpg', 'png', 'webp'],
      compressionRatio: 'varies by format and quality',
      estimatedTime: 'depends on input size and options',
      memoryUsage: 'depends on batch size and image dimensions',
    },
    exitCode: 0, // Tier 3 placeholder
  };

  // Print explanation only
  const explanation = explainFormatter(context, mode);
  if (mode === ExplainMode.Json) {
    // Add a styled header for JSON output
    console.log(chalk.bold.bgBlueBright.white(' EXPLANATION (JSON) '));
    // Write JSON to file in output/explain/
    const timestamp = context.timestamp?.replace(/[:.]/g, '-') || Date.now().toString();
    const outDir = path.resolve(process.cwd(), 'output', 'explain');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outFile = path.join(outDir, `explain-${timestamp}.json`);
    fs.writeFileSync(outFile, JSON.stringify(context, null, 2), 'utf-8');
    console.log(chalk.green(`Explanation JSON written to: ${outFile}`));
    // Also print a preview to the console
    console.log(chalk.gray(JSON.stringify(context, null, 2)));
  } else {
    console.log(explanation);
  }
}
