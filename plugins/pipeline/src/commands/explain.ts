import { existsSync } from 'fs';
import { resolve } from 'path';
import type { Command } from 'commander';
import { WorkflowLoader, type ExecutionExplanation } from '@orbytautomation/engine';
import { createExplainFormatter, type ExplainFormatterType } from '../formatters/explain/createExplainFormatter.js';
import type { ExplainFormatter } from '../formatters/Formatter.js';
import type { CliExplainOptions } from '../types/CliExplainOptions.js';
import { MediaProcWorkflowValidator } from '../validators/MediaProcWorkflowValidator.js';
import { createOrbytEngine } from '../utils/orbyt.js';

export function explainPipelineCommand(cmd: Command): void {
    cmd
        .command('explain <file>')
        .description('Explain what the engine will do without executing the pipeline')
        .option('-f, --format <format>', 'Output format (human|json|verbose)', 'human')
        .option('--graph', 'Show ASCII dependency graph')
        .option('--verbose', 'Show detailed configuration')
        .option('--silent', 'Minimal output')
        .option('--no-color', 'Disable colored output')
        .action(explainPipeline);
}

async function explainPipeline(
    file: string,
    options: CliExplainOptions,
): Promise<void> {
    const engine = createOrbytEngine('silent');

    // Determine explain formatter
    let format = (options.format || 'human') as ExplainFormatterType;
    if (options.verbose && format === 'human') format = 'verbose';

    const formatter = createExplainFormatter(format, options);

    try {
        // ── Step 1: Resolve file ────────────────────────────────────────────────
        const resolvedPath = resolve(file);
        if (!existsSync(resolvedPath)) {
            formatter.showError(new Error(`Workflow file not found: ${file}`));
            process.exit(1);
        }

        // ── Step 2: Load + orbyt schema/security validation ─────────────────────
        const workflow = await WorkflowLoader.fromFile(resolvedPath);

        // ── Step 3: MediaProc-specific checks ───────────────────────────────────
        const mpErrors = MediaProcWorkflowValidator.validate(workflow);
        if (mpErrors.length > 0) {
            for (const e of mpErrors) {
                formatter.showError(new Error(`[${e.stepId}] ${e.message}${e.hint ? `\n  hint: ${e.hint}` : ''}`));
            }
            process.exit(1);
        }

        // ── Step 4: Get execution explanation from engine ───────────────────────
        // Engine is created silent so its internal logs don't leak into
        // the formatted plan output — the formatter handles all display.
        const explanation = await engine.explain(workflow);

        // ── Step 5: Cycle check ─────────────────────────────────────────────────
        if (explanation.hasCycles) {
            formatter.showError(new Error('✖ Circular dependencies detected!'));
            if (explanation.cycles && explanation.cycles.length > 0) {
                explanation.cycles.forEach((cycle, idx) => {
                    formatter.showError(new Error(`  ${idx + 1}. ${cycle.join(' → ')}`));
                });
            }
            process.exit(2);
        }

        // ── Step 6: Render ──────────────────────────────────────────────────────
        if (options.graph) {
            showGraph(explanation, formatter);
        } else {
            formatter.showExplanation(explanation);
        }

        process.exit(0);

    } catch (err: any) {
        formatter.showError(new Error(`✖ Failed to explain pipeline: ${file}`));
        formatter.showError(err instanceof Error ? err : new Error(String(err)));
        process.exit(1);
    }
}

function showGraph(explanation: ExecutionExplanation, formatter: ExplainFormatter): void {
    formatter.showInfo(`\n▶ Pipeline: ${explanation.workflowName || 'unnamed'}\n`);
    formatter.showInfo('Dependency Graph:\n');

    const stepMap = new Map(explanation.steps.map(s => [s.id, s]));
    const visited = new Set<string>();
    const roots = explanation.steps.filter(s => !s.needs || s.needs.length === 0);

    function printNode(stepId: string, indent = '', isLast = true): void {
        if (visited.has(stepId)) return;
        visited.add(stepId);

        const step = stepMap.get(stepId);
        if (!step) return;

        const connector = isLast ? '└─' : '├─';
        formatter.showInfo(`${indent}${connector} ${step.name || step.id}  (${step.uses})`);

        const children = explanation.steps.filter(s => s.needs && s.needs.includes(stepId));
        const childIndent = indent + (isLast ? '   ' : '│  ');
        children.forEach((child, idx) => {
            printNode(child.id, childIndent, idx === children.length - 1);
        });
    }

    roots.forEach((root, idx) => {
        printNode(root.id, '', idx === roots.length - 1);
    });
}
