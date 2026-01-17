import { explainFormatter, ExplainFormat } from './formatters/explainFormatter.js';
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

  // Build ExplainContext
  const context: ExplainContext = {
    command: commandName,
    inputs: { inputPath, outputPath },
    usedFlags,
    decisions: Object.entries(usedFlags).map(([key, v]) => ({
      key,
      value: v.value,
      reason: v.source === 'user' ? 'user specified' : 'default',
    })),
    outcome: {
      result: outputPath ? `A new file will be created at ${outputPath}` : 'Operation will complete',
      sideEffects: [],
    },
  };

  // Print explanation only
  const explanation = explainFormatter(context, format);
  if (format === 'json') {
    console.log(JSON.stringify(explanation, null, 2));
  } else {
    console.log(explanation);
  }
}
