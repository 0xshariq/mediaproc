/**
 * MediaProc Workflow Validator
 *
 * Runs mediaproc-specific validation checks on a parsed workflow
 * AFTER WorkflowLoader.fromFile() has completed (so orbyt syntax + schema are clean).
 *
 * Checks:
 *  1. Action string — must follow mediaproc.<plugin>.<command> format
 *  2. Input path only — delegated to validatePaths() from @mediaproc/core
 *     (output path checks are intentionally skipped in this validator)
 *
 * Plugin presence and command availability are NOT checked here — the mediaproc
 * CLI handles plugin lifecycle (install, load, update) via `mediaproc add/remove/update`.
 *
 * Usage:
 *   const errors = MediaProcWorkflowValidator.validate(workflow);
 *   MediaProcWorkflowValidator.validateOrThrow(workflow); // throws on first error
 */

import type { ParsedWorkflow } from '@orbytautomation/engine';
import { validatePaths } from '@mediaproc/core';
import { isMediaProcAction, parseMediaProcAction, MediaProcActionParseError } from '../core/MediaProcActionResolver.js';

// ---------------------------------------------------------------------------
// Public result types
// ---------------------------------------------------------------------------

export type ValidationErrorKind =
    | 'action-parse'
    | 'input-not-found'
    | 'input-no-files';

export interface WorkflowValidationError {
    kind: ValidationErrorKind;
    stepId: string;
    message: string;
    hint?: string;
}

const TEMPLATE_MARKERS = ['${', '{{'];

/**
 * MediaProc Workflow Validator
 *
 * Runs mediaproc-specific validation checks on a parsed workflow
 * AFTER WorkflowLoader.fromFile() has completed (so orbyt syntax + schema are clean).
 *
 * Checks:
 *  1. Action string — must follow mediaproc.<plugin>.<command> format
 *  2. Input path only — delegated to validatePaths() from @mediaproc/core
 *     (output path checks are intentionally skipped in this validator)
 *
 * Plugin presence and command availability are NOT checked here — the mediaproc
 * CLI handles plugin lifecycle (install, load, update) via `mediaproc add/remove/update`.
 *
 * Usage:
 *   const errors = MediaProcWorkflowValidator.validate(workflow);
 *   MediaProcWorkflowValidator.validateOrThrow(workflow); // throws on first error
 */
export class MediaProcWorkflowValidator {
    /**
     * Validate all mediaproc steps in a parsed workflow.
     * Returns all errors found (does not stop at first).
     */
    static validate(workflow: ParsedWorkflow): WorkflowValidationError[] {
        const errors: WorkflowValidationError[] = [];

        for (const step of workflow.steps) {
            if (!isMediaProcAction(step.action)) continue;

            // --- 1. Action string parse -------------------------------------------
            try {
                parseMediaProcAction(step.action);
            } catch (err) {
                errors.push({
                    kind: 'action-parse',
                    stepId: step.id,
                    message: err instanceof MediaProcActionParseError
                        ? err.message
                        : `Could not parse action "${step.action}"`,
                    hint: 'Action must follow the format: mediaproc.<plugin>.<command>',
                });
                continue; // nothing else to check if we can't parse
            }

            // --- 2. Input path validation -----------------------------------------
            const pathErrors = this.validateInputPath(step.id, step.input as Record<string, unknown> | undefined);
            errors.push(...pathErrors);
        }

        return errors;
    }

    /**
     * Validate and throw on the first error found.
     *
     * @throws {Error} containing all error messages joined by newlines
     */
    static validateOrThrow(workflow: ParsedWorkflow): void {
        const errors = this.validate(workflow);
        if (errors.length === 0) return;

        const message = errors
            .map(e => {
                const hint = e.hint ? `\n  hint: ${e.hint}` : '';
                return `[${e.stepId}] ${e.message}${hint}`;
            })
            .join('\n');

        throw new Error(`MediaProc workflow validation failed:\n${message}`);
    }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    private static validateInputPath(
        stepId: string,
        input: Record<string, unknown> | undefined,
    ): WorkflowValidationError[] {
        const errors: WorkflowValidationError[] = [];

        const inputValue = this.readInputPath(input);

        // Skip validation entirely if input is missing or is a template expression
        // (runtime variables are resolved later by the execution context).
        if (!inputValue || this.isTemplateExpression(inputValue)) return errors;

        // Validate input path only. Output path checks are intentionally excluded
        // because command-level path handling resolves output creation/writability.
        let pathErrors: string[] = [];
        try {
            ({ errors: pathErrors } = validatePaths(inputValue, undefined));
        } catch (error) {
            errors.push({
                kind: 'input-not-found',
                stepId,
                message: `Input validation failed for "${inputValue}": ${error instanceof Error ? error.message : String(error)}`,
                hint: 'Ensure the input path is valid and accessible.',
            });
            return errors;
        }

        const uniqueErrors = this.unique(pathErrors);

        for (const msg of uniqueErrors) {
            const kind = this.classifyPathError(msg);

            errors.push({
                kind,
                stepId,
                message: `Input validation failed for "${inputValue}": ${msg}`,
                hint: kind === 'input-not-found'
                    ? 'Ensure the input file or directory exists and is readable.'
                    : 'Ensure the input directory contains supported media files.',
            });
        }

        return errors;
    }

    private static readInputPath(input: Record<string, unknown> | undefined): string | undefined {
        const value = input?.input;
        return typeof value === 'string' ? value : undefined;
    }

    private static isTemplateExpression(value: string): boolean {
        return TEMPLATE_MARKERS.some((marker) => value.includes(marker));
    }

    private static classifyPathError(message: string): ValidationErrorKind {
        const normalized = message.toLowerCase();
        if (
            normalized.includes('not found') ||
            normalized.includes('does not exist') ||
            normalized.includes('enoent') ||
            normalized.includes('no such file')
        ) {
            return 'input-not-found';
        }

        return 'input-no-files';
    }

    private static unique(values: string[]): string[] {
        return Array.from(new Set(values));
    }
}
