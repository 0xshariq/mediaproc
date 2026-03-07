/**
 * MediaProc Workflow Validator
 *
 * Runs mediaproc-specific validation checks on a parsed workflow
 * AFTER WorkflowLoader.fromFile() has completed (so orbyt syntax + schema are clean).
 *
 * Checks:
 *  1. Action string — must follow mediaproc.<plugin>.<command> format
 *  2. Input path   — must exist (file or directory with media files)
 *  3. Output path  — parent directory must be writable if it exists
 *
 * Plugin presence and command availability are NOT checked here — the mediaproc
 * CLI handles plugin lifecycle (install, load, update) via `mediaproc add/remove/update`.
 *
 * Usage:
 *   const errors = MediaProcWorkflowValidator.validate(workflow);
 *   MediaProcWorkflowValidator.validateOrThrow(workflow); // throws on first error
 */

import type { ParsedWorkflow } from '@orbytautomation/engine';
import { parseInputPaths, fileExists } from '@mediaproc/core';
import { isMediaProcAction, parseMediaProcAction, MediaProcActionParseError } from '../core/MediaProcActionResolver.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

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

        // 4. Input path check
        if (inputValue) {
            // Skip template expressions like ${ inputs.image_path }
            if (!inputValue.includes('${')) {
                const resolved = path.resolve(inputValue);
                const isFile = fileExists(resolved);
                const isDir = !isFile && fs.existsSync(resolved) && fs.statSync(resolved).isDirectory();

                if (!isFile && !isDir) {
                    errors.push({
                        kind: 'input-not-found',
                        stepId,
                        message: `Input path does not exist: "${inputValue}"`,
                        hint: 'Ensure the file or directory exists before running the workflow.',
                    });
                } else if (isDir) {
                    // Directory: check it contains processable media files
                    const files = parseInputPaths(inputValue);
                    if (files.length === 0) {
                        errors.push({
                            kind: 'input-no-files',
                            stepId,
                            message: `No supported media files found in directory: "${inputValue}"`,
                            hint: 'Ensure the directory contains image, video, or audio files.',
                        });
                    }
                }
            }
        }

        // 5. Output path check
        if (outputValue && !outputValue.includes('${')) {
            const resolved = path.resolve(outputValue);
            const outputExt = path.extname(resolved);
            // Parent dir for files, resolved itself for directories
            const dirToCheck = outputExt ? path.dirname(resolved) : resolved;

            if (fs.existsSync(dirToCheck)) {
                try {
                    fs.accessSync(dirToCheck, fs.constants.W_OK);
                } catch {
                    errors.push({
                        kind: 'output-not-writable',
                        stepId,
                        message: `Output directory is not writable: "${dirToCheck}"`,
                        hint: 'Check filesystem permissions for the output location.',
                    });
                }
            }
            // If the dir doesn't exist yet that's fine — the adapter will create it.
        }

        return errors;
    }
}
