import { existsSync } from 'fs';
import { resolve } from 'path';
import type { Command } from 'commander';
import { WorkflowLoader } from '@orbytautomation/engine';
import { createFormatter, type FormatterType } from '../formatters/createFormatter.js';
import { MediaProcWorkflowValidator } from '../validators/MediaProcWorkflowValidator.js';

export function validatePipelineCommand(cmd: Command): void {
  cmd
    .command('validate <file>')
    .description('Validate a MediaProc pipeline workflow without executing it')
    .option('-f, --format <format>', 'Output format (human|json|verbose|null)', 'human')
    .option('--verbose', 'Show per-step summary after validation')
    .option('--silent', 'Minimal output')
    .option('--no-color', 'Disable colored output')
    .action(validatePipeline);
}

async function validatePipeline(
  file: string,
  options: {
    format?: string;
    verbose?: boolean;
    silent?: boolean;
    noColor?: boolean;
  },
): Promise<void> {
  let format = (options.format || 'human') as FormatterType;
  if (options.verbose && format === 'human') format = 'verbose';

  const formatter = createFormatter(format, {
    verbose: options.verbose,
    silent: options.silent,
    noColor: options.noColor,
  });

  try {
    // ── Step 1: Resolve file ────────────────────────────────────────────────
    const resolvedPath = resolve(file);
    if (!existsSync(resolvedPath)) {
      formatter.showError(new Error(`Workflow file not found: ${file}`));
      process.exit(1);
    }

    // ── Step 2: Load + full orbyt schema/security validation ──────────────────
    // WorkflowLoader.validate() takes a file path and does parse + validate in one pass.
    // Using engine.validate(parsedWorkflow) would re-run the schema checker on the
    // already-parsed object, causing false "Unknown field" errors.
    formatter.showInfo(`Loading ${file}...`);
    const workflow = await WorkflowLoader.validate(resolvedPath);
    formatter.showInfo(`Loaded: ${workflow.name || file}`);

    // ── Step 3: MediaProc-specific checks (full error list) ─────────────────
    const mpErrors = MediaProcWorkflowValidator.validate(workflow);
    if (mpErrors.length > 0) {
      formatter.showError(
        new Error(`${mpErrors.length} MediaProc validation error${mpErrors.length > 1 ? 's' : ''} found`),
      );
      for (const e of mpErrors) {
        formatter.showError(new Error(`[${e.stepId}] ${e.message}${e.hint ? `\n  hint: ${e.hint}` : ''}`));
      }
      process.exit(1);
    }

    // ── Summary ─────────────────────────────────────────────────────────────
    formatter.showInfo('✔ Workflow is valid and ready to run');

    if (options.verbose) {
      formatter.showInfo(`Steps: ${workflow.steps.length}`);
      for (const step of workflow.steps) {
        formatter.showInfo(
          `  · ${step.id}${step.name ? `  ${step.name}` : ''}  ${step.action}`,
        );
      }
    }

    process.exit(0);

  } catch (err: any) {
    formatter.showError(err instanceof Error ? err : new Error(String(err)));
    process.exit(1);
  }
}
