
import chalk from 'chalk';
import { explainFormatter } from './formatters/explainFormatter.js';
import { ExplainContext, ExplainMode } from '../types/explainTypes.js';
import { detectInputFiles, detectOutputFiles, FileType } from '../utils/file/fileDetection.js';

import os from 'os';
import fs from 'fs';
import path from 'path';
import { explainSentences } from './phrases/explainSentences.js';


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
  // Must remove from human and details mode not from json mode
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
  // Gather input/output paths from args/options
  for (const k of inputKeys) {
    if (args[k]) { inputPath = args[k]; allInputs[k] = args[k]; }
    if (options[k]) { inputPath = options[k]; allInputs[k] = options[k]; }
  }
  for (const k of outputKeys) {
    if (args[k]) { outputPath = args[k]; allOutputs[k] = args[k]; }
    if (options[k]) { outputPath = options[k]; allOutputs[k] = options[k]; }
  }
  // Use fileDetection utilities for input/output
  let inputDetection = inputPath ? detectInputFiles(inputPath) : { type: 'unknown', count: 0, files: [] };
  let outputDetection = outputPath ? detectOutputFiles(outputPath) : { exists: false, isDir: false, files: [] };

  // Gather used flags
  let explainValue: string | undefined = undefined;
  if (typeof options.explain === 'string') {
    explainValue = options.explain;
    if (explainValue === 'only') mode = ExplainMode.Only;
  } else if (Array.isArray(args._) && args._.length > 0) {
    // Check for --explain details as positional
    const idx = args._.findIndex((v: any) => v === 'explain');
    if (idx !== -1 && args._[idx + 1]) {
      explainValue = args._[idx + 1];
      if (explainValue === 'only') mode = ExplainMode.Only;
    }
  }
  if (explainValue === 'details') {
    mode = ExplainMode.Details;
  } else if (explainValue === 'json') {
    mode = ExplainMode.Json;
  } else if (explainValue === 'human') {
    mode = ExplainMode.Human;
  } else if (explainValue === 'audit') {
    mode = ExplainMode.Audit;
  } else if (explainValue === 'debug') {
    mode = ExplainMode.Debug;
  } else if (explainValue === 'only') {
    mode = ExplainMode.Only;
  }
  else {
    // fallback for unknown explain values
    console.warn(chalk.yellow(`warn: unknown explain mode "${explainValue}", falling back to "human"`));
    mode = ExplainMode.Human;
  }
  // Gather all possible flags from command (Commander.js API)
  const usedFlags: Record<string, { value: any; source: 'user' | 'system' | 'default' }> = {};
  const omittedFlags: Record<string, { defaultValue: any; source: 'default' }> = {};
  if (command && typeof command.options === 'object') {
    for (const opt of command.options) {
      let flagName: string | undefined;
      if (typeof opt.attributeName === 'function') {
        try {
          const attr = opt.attributeName();
          flagName = typeof attr === 'string' ? attr : undefined;
        } catch {
          flagName = undefined;
        }
      } else if (typeof opt.attributeName === 'string') {
        flagName = opt.attributeName;
      } else {
        flagName = opt.long?.replace(/^--/, '') || opt.short?.replace(/^-/, '');
      }
      // Only allow string flag names, skip if not a string
      if (!flagName || typeof flagName !== 'string') continue;
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

  // Build ExplainContext with plugin/command info (no version logic)
  let plugin: string | undefined = undefined;
  if (command?.parent?.name?.()) {
    plugin = command.parent.name();
  }

  // Step 1: Add effects/primitives to context (plugin-aware, generic fallback)
  const effects: string[] = [];
  if (inputPath) {
    effects.push(explainSentences.inputRead({ context: { inputPath, plugin } }));
    effects.push(explainSentences.detectedInputFiles({
      context: {
        inputs: {
          inputPath
        },
        plugin
      }
    }));
  }
  if (outputPath) {
    effects.push(explainSentences.outputWrite({ context: { outputPath, plugin } }));
    effects.push(explainSentences.detectedOutputFiles({
      context: {
        outputs: {
          outputPath
        },
        plugin
      }
    }));
  }
  if (usedFlags['width'] || usedFlags['height']) effects.push(explainSentences.dimensionsChange({ context: { usedFlags, plugin } }));
  if (usedFlags['quality']) effects.push(explainSentences.qualityChange({ context: { usedFlags, plugin } }));
  if (usedFlags['format']) effects.push(explainSentences.formatConversion({ context: { usedFlags, plugin } }));
  if (usedFlags['metadata']) effects.push(explainSentences.metadataPreserved());
  if (usedFlags['tool'] || command?.parent?.name?.()) effects.push(explainSentences.externalTool({ context: { usedFlags, plugin } }));
  if (usedFlags['noNetwork']) effects.push(explainSentences.noNetwork());
  // Add more effects for other plugin types as needed

  // Dynamic outcome and flow using enhanced sentences
  const sideEffects: string[] = [];
  if (usedFlags['noNetwork']) sideEffects.push(explainSentences.noNetwork());
  if (usedFlags['metadata']) sideEffects.push(explainSentences.metadataPreserved());
  if (usedFlags['validation']) sideEffects.push(explainSentences.validation());
  if (usedFlags['logging']) sideEffects.push(explainSentences.logging());
  if (usedFlags['cleanup']) sideEffects.push(explainSentences.cleanup());

  // Tag explainFlow steps as static or conditional for DETAILS mode
  type ExplainFlowStep = { step: string; type: 'static' | 'conditional' };
  const explainFlow: ExplainFlowStep[] = [
    { step: explainSentences.validation(), type: 'static' },
    { step: explainSentences.commandInputs(), type: 'static' },
    { step: explainSentences.commandOptions(), type: 'static' },
    { step: explainSentences.commandPurpose(), type: 'conditional' },
    { step: explainSentences.logging(), type: 'static' },
    { step: explainSentences.cleanup(), type: 'static' },
    { step: explainSentences.summarySuccess(), type: 'static' }
  ];

  // Technical details (plugin-agnostic)
  const technical: Record<string, any> = {
    tool: command?.parent?.name?.() || 'unknown',
    library: options.library || 'unknown',
    performance: options.performance || 'optimized for batch processing',
    fileFormats: options.fileFormats || []
  };
  // Only add advanced fields if they are present and not empty
  if (options.compressionRatio != null && options.compressionRatio !== '') {
    technical.compressionRatio = options.compressionRatio;
  }
  if (options.estimatedTime != null && options.estimatedTime !== '') {
    technical.estimatedTime = options.estimatedTime;
  }
  if (options.memoryUsage != null && options.memoryUsage !== '') {
    technical.memoryUsage = options.memoryUsage;
  }

  let context: ExplainContext = {
    explainVersion: '1.0',
    schemaVersion: '1.0',
    command: commandName,
    plugin: plugin ?? undefined,
    timestamp: new Date().toISOString(),
    user: process.env.USER || process.env.USERNAME || undefined,
    platform: `${os.platform()} ${os.arch()}`,
    mode,
    summary: '', // will set below
    inputs: {
      inputPath,
      type: inputDetection.type as FileType,
      count: inputDetection.count,
      files: inputDetection.files,
      ...allInputs,
    },
    outputs: {
      outputPath,
      exists: outputDetection.exists,
      isDir: outputDetection.isDir,
      count: outputDetection.files.length,
      files: outputDetection.files,
      ...allOutputs
    },
    usedFlags,
    omittedFlags: Object.keys(omittedFlags).length > 0 ? omittedFlags : undefined,
    decisions: Object.entries(usedFlags).map(([key, v]) => ({
      key,
      value: v.value,
      reason: v.source === 'user' ? 'user specified' : (v.source === 'default' ? 'default' : 'system'),
      provenance: v.source,
    })),
    effects,
    outcome: {
      result: '', // will set below
      sideEffects: sideEffects.length > 0 ? sideEffects : undefined,
      errors: [],
      warnings: [],
      confidence: 'high',
      confidenceScore: 0.95,
      whatWillNotHappen: [explainSentences.noNetwork(), '\n', explainSentences.noOriginalModification(), '\n', explainSentences.dataLocalOnly(), '\n', explainSentences.noBackgroundTasks()],
    },
    explainFlow,
    environment,
    technical,
    exitCode: 0,
  };

  // Now set summary and result using the full context
  if (mode === ExplainMode.Only) {
    context.summary = explainSentences.explainOnlySummary();
    context.outcome.result = explainSentences.explainOnlySummary();
  } else if (inputPath && outputPath) {
    context.summary = `${explainSentences.inputRead({ context })} ${explainSentences.outputWrite({ context })}`;
    context.outcome.result = explainSentences.outputWrite({ context });
  } else if (inputPath) {
    context.summary = explainSentences.inputRead({ context });
    context.outcome.result = explainSentences.inputRead({ context });
  } else if (outputPath) {
    context.summary = explainSentences.outputWrite({ context });
    context.outcome.result = explainSentences.outputWrite({ context });
  } else {
    context.summary = explainSentences.summarySuccess();
    context.outcome.result = explainSentences.summarySuccess();
  }

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
