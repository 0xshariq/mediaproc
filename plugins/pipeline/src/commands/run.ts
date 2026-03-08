import { existsSync } from 'fs';
import { resolve } from 'path';
import type { Command } from 'commander';
import { OrbytEngine, WorkflowLoader, type WorkflowResult } from '@orbytautomation/engine';
import { createFormatter, type FormatterType } from '../formatters/createFormatter.js';
import { MediaProcWorkflowValidator } from '../validators/MediaProcWorkflowValidator.js';
import {
  CliEventType,
  type WorkflowStartedEvent,
  type WorkflowCompletedEvent,
  type WorkflowFailedEvent,
  type StepStartedEvent,
  type StepCompletedEvent,
  type StepFailedEvent,
} from '../types/CliEvent.js';
import { createOrbytEngine } from '../utils/orbyt.js';

export function runPipelineCommand(cmd: Command): void {
  cmd
    .command('run <file>')
    .description('Run a MediaProc pipeline from a YAML/JSON workflow file')
    .option('--dry-run', 'Validate and preview without executing steps')
    .option('-v, --var <key=value...>', 'Set workflow input variables (repeatable)')
    .option('--continue-on-error', 'Continue pipeline even if individual steps fail')
    .option('-f, --format <format>', 'Output format (human|json|verbose|null)', 'human')
    .option('--verbose', 'Show detailed per-step output')
    .option('--silent', 'Minimal output')
    .option('--no-color', 'Disable colored output')
    .action(runPipeline);
}

async function runPipeline(
  file: string,
  options: {
    dryRun?: boolean;
    var?: string | string[];
    continueOnError?: boolean;
    format?: string;
    verbose?: boolean;
    silent?: boolean;
    noColor?: boolean;
  },
): Promise<void> {
  // Determine formatter
  let format = (options.format || 'human') as FormatterType;
  if (options.verbose && format === 'human') format = 'verbose';

  const formatter = createFormatter(format, {
    verbose: options.verbose,
    silent: options.silent,
    noColor: options.noColor,
  });

  try {
    // ── Step 1: Resolve file path ───────────────────────────────────────────
    const resolvedPath = resolve(file);
    if (!existsSync(resolvedPath)) {
      formatter.showError(new Error(`Workflow file not found: ${file}`));
      process.exit(1);
    }

    // ── Step 2: Load + orbyt schema/security validation ─────────────────────
    formatter.showInfo(`Loading ${file}...`);
    const workflow = await WorkflowLoader.fromFile(resolvedPath, {
      variables: parseVars(options.var),
    });
    formatter.showInfo(`Loaded: ${workflow.name || file}`);

    // ── Step 3: MediaProc-specific checks ───────────────────────────────────
    const mpErrors = MediaProcWorkflowValidator.validate(workflow);
    if (mpErrors.length > 0) {
      for (const e of mpErrors) {
        formatter.showError(new Error(`[${e.stepId}] ${e.message}${e.hint ? `\n  hint: ${e.hint}` : ''}`));
      }
      process.exit(1);
    }

    // ── Dry-run: stop here ──────────────────────────────────────────────────
    if (options.dryRun) {
      formatter.showInfo('--dry-run: workflow is valid, steps will not be executed');
      process.exit(0);
    }

    // ── Step 4: Execute ─────────────────────────────────────────────────────
    const engine = createOrbytEngine(options.verbose ? 'debug' : 'info');

    // Bridge engine events → formatter
    wireEngineEvents(engine, formatter);

    // Collect declared input defaults so ${inputs.x} resolves even when the
    // user hasn't passed --var x=... on the command line.
    const inputDefaults: Record<string, any> = {};
    const rawInputs = (workflow as any).inputs ?? {};
    for (const [key, def] of Object.entries(rawInputs)) {
      if (def && typeof def === 'object' && 'default' in (def as any)) {
        inputDefaults[key] = (def as any).default;
      }
    }
    const mergedVariables = { ...inputDefaults, ...parseVars(options.var) };

    const result: WorkflowResult = await engine.run(resolvedPath, {
      variables: mergedVariables,
      continueOnError: options.continueOnError,
    });

    formatter.showResult(result);
    process.exit(result.status === 'success' ? 0 : 1);

  } catch (err: any) {
    formatter.showError(err instanceof Error ? err : new Error(String(err)));
    process.exit(1);
  }
}

function wireEngineEvents(engine: OrbytEngine, formatter: ReturnType<typeof createFormatter>): void {
  const bus = engine.getEventBus();

  bus.on('workflow.started', (event: any) => {
    const e: WorkflowStartedEvent = {
      type: CliEventType.WORKFLOW_STARTED,
      timestamp: new Date(event.timestamp),
      workflowName: event.workflowName || 'Pipeline',
      totalSteps: event.totalSteps || 0,
    };
    formatter.onEvent(e);
  });

  bus.on('workflow.completed', (event: any) => {
    const e: WorkflowCompletedEvent = {
      type: CliEventType.WORKFLOW_COMPLETED,
      timestamp: new Date(event.timestamp),
      workflowName: event.workflowName || 'Pipeline',
      status: event.status === 'success' ? 'success' : 'partial',
      duration: event.durationMs || 0,
      successfulSteps: event.successfulSteps || 0,
      failedSteps: event.failedSteps || 0,
      skippedSteps: event.skippedSteps || 0,
    };
    formatter.onEvent(e);
  });

  bus.on('workflow.failed', (event: any) => {
    const e: WorkflowFailedEvent = {
      type: CliEventType.WORKFLOW_FAILED,
      timestamp: new Date(event.timestamp),
      workflowName: event.workflowName || 'Pipeline',
      error: event.error || new Error('Workflow failed'),
      duration: event.durationMs || 0,
    };
    formatter.onEvent(e);
  });

  bus.on('step.started', (event: any) => {
    const e: StepStartedEvent = {
      type: CliEventType.STEP_STARTED,
      timestamp: new Date(event.timestamp),
      stepId: event.stepId,
      stepName: event.stepName || event.stepId,
      adapter: event.adapter || 'mediaproc',
      action: event.action || 'execute',
    };
    formatter.onEvent(e);
  });

  bus.on('step.completed', (event: any) => {
    const e: StepCompletedEvent = {
      type: CliEventType.STEP_COMPLETED,
      timestamp: new Date(event.timestamp),
      stepId: event.stepId,
      stepName: event.stepName || event.stepId,
      duration: event.durationMs || 0,
      output: event.output,
    };
    formatter.onEvent(e);
  });

  bus.on('step.failed', (event: any) => {
    const e: StepFailedEvent = {
      type: CliEventType.STEP_FAILED,
      timestamp: new Date(event.timestamp),
      stepId: event.stepId,
      stepName: event.stepName || event.stepId,
      error: event.error || new Error('Step failed'),
      duration: event.durationMs || 0,
    };
    formatter.onEvent(e);
  });
}

function parseVars(raw?: string | string[]): Record<string, any> {
  if (!raw) return {};
  const pairs = Array.isArray(raw) ? raw : [raw];
  return Object.fromEntries(
    pairs.map(p => {
      const idx = p.indexOf('=');
      return idx > -1 ? [p.slice(0, idx).trim(), p.slice(idx + 1)] : [p.trim(), true];
    }),
  );
}
