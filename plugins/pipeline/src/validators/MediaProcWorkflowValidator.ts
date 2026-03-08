/**
 * MediaProc Workflow Validator
 *
 * Runs mediaproc-specific validation checks on a parsed workflow
 * AFTER WorkflowLoader.fromFile() has completed (so orbyt syntax + schema are clean).
 *
 * Checks:
 *  1. Action string — must follow mediaproc.<plugin>.<command> format
 *  2. Input/output paths — delegated to validatePaths() from @mediaproc/core
 *     (input must exist with supported media files; output writability checked if present)
 *
 * Plugin presence and command availability are NOT checked here — the mediaproc
 * CLI handles plugin lifecycle (install, load, update) via `mediaproc add/remove/update`.
 *
 * Usage:
 *   const errors = MediaProcWorkflowValidator.validate(workflow);
 *   MediaProcWorkflowValidator.validateOrThrow(workflow); // throws on first error
 */

import type { ParsedWorkflow } from '@orbytautomation/engine';
import { validatePaths, fileExists } from '@mediaproc/core';
import { isMediaProcAction, parseMediaProcAction, MediaProcActionParseError } from '../core/MediaProcActionResolver.js';

// ---------------------------------------------------------------------------
// Public result types
// ---------------------------------------------------------------------------

export type ValidationErrorKind =
    | 'action-parse'
    | 'input-not-found'
    | 'input-no-files'
    | 'output-not-writable';

export interface WorkflowValidationError {
    kind: ValidationErrorKind;
    stepId: string;
    message: string;
    hint?: string;
}

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

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

            // --- 2 & 3. Path validation -------------------------------------------
            const pathErrors = this._validatePaths(step.id, step.input);
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

    private static _validatePaths(
        stepId: string,
        input: Record<string, any>,
    ): WorkflowValidationError[] {
        const errors: WorkflowValidationError[] = [];

        const inputValue: string | undefined =
            typeof input?.input === 'string' ? input.input : undefined;
        const outputValue: string | undefined =
            typeof input?.output === 'string' ? input.output : undefined;

        // Skip validation entirely if input is missing or is a template expression
        if (!inputValue || inputValue.includes('${')) return errors;

        // Pass undefined for output when it's a template or not specified —
        // output dirs that don't exist yet are fine (validatePaths / resolveOutputPaths create them).
        const safeOutput = outputValue && !outputValue.includes('${')
            ? outputValue
            : undefined;

        const { errors: pathErrors } = validatePaths(inputValue, safeOutput);

        for (const msg of pathErrors) {
            if (msg.includes('not writable') || msg.includes('Cannot specify a file output')) {
                errors.push({
                    kind: 'output-not-writable',
                    stepId,
                    message: msg,
                    hint: 'Check filesystem permissions for the output location.',
                });
            } else {
                // "No valid files found" — input path missing or has no supported media files
                const isFile = fileExists(inputValue);
                errors.push({
                    kind: isFile ? 'input-no-files' : 'input-not-found',
                    stepId,
                    message: isFile
                        ? `No supported media files found in: "${inputValue}"`
                        : `Input path does not exist or contains no media: "${inputValue}"`,
                    hint: isFile
                        ? 'Ensure the directory contains image, video, or audio files.'
                        : 'Ensure the file or directory exists before running the workflow.',
                });
            }
        }

        return errors;
    }
}
