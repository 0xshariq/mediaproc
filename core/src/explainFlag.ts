import chalk from 'chalk';
import { explainFormatter, ExplainFormat } from './formatters/explainFormatter.js';
import { getCliVersion, getVersion } from './branding/branding.js';
import { ExplainContext } from './types/explainTypes.js';

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

  // Detect input/output paths
  let inputPath = '';
  let outputPath = '';
  for (const k of inputKeys) {
    if (args[k]) inputPath = args[k];
    if (options[k]) inputPath = options[k];
  }
  for (const k of outputKeys) {
    if (args[k]) outputPath = args[k];
    if (options[k]) outputPath = options[k];
  }

  // Gather used flags
  const usedFlags: Record<string, { value: any; source: 'user' | 'system' }> = {};
  for (const [key, value] of Object.entries(options)) {
    if (key === 'explain') continue;
    usedFlags[key] = { value, source: value !== undefined ? 'user' : 'system' };
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
  } catch {}

  const context: ExplainContext = {
    command: commandName,
    plugin: command?.parent?.name?.() || undefined,
    cliVersion,
    pluginVersion,
    inputs: { inputPath, outputPath },
    usedFlags,
    decisions: Object.entries(usedFlags).map(([key, v]) => ({
      key,
      value: v.value,
      reason: v.source === 'user' ? 'user specified' : 'default',
    })),
    outcome: {
      result: outputPath ? `A new file will be created at ${outputPath}` : 'Operation will complete',
      sideEffects: [
        'Input validation is performed to ensure correct file types and dimensions.',
        'Output paths are resolved and checked for conflicts.',
        'Image processing is performed using the selected options and flags.',
        'Results and logs are displayed after processing each file.'
      ],
    },
    explainFlow: [
      '1. Parse and validate all user-provided flags and arguments.',
      '2. Check input and output paths for validity and existence.',
      '3. Prepare configuration for image processing (width, height, quality, etc.).',
      '4. For each input file, process and apply transformations.',
      '5. Save output files and display results.',
      '6. Show summary and any errors encountered.'
    ]
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
