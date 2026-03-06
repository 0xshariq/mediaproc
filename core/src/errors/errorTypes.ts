/* ============================================================
 * MediaProc Error System
 *
 * Uses BaseError, ErrorType, ErrorSeverity, ExitCodes, and
 * MediaProcErrorCodes from @dev-ecosystem/core.
 * ErrorSource is mediaproc-local (no ecosystem equivalent).
 * ============================================================
 */

import {
  BaseError,
  ErrorType,
  ErrorSeverity,
  ExitCodes,
  MediaProcErrorCodes,
} from '@dev-ecosystem/core';

// Re-export ecosystem types so @mediaproc/core consumers don't need
// to import from @dev-ecosystem/core for basic error handling.
export { ErrorType, ErrorSeverity, ExitCodes, MediaProcErrorCodes };
export type { MediaProcErrorCode } from '@dev-ecosystem/core';

/* -------------------- Error Source (mediaproc-local) -------------------- */
export enum ErrorSource {
  User = 'User',
  MediaProc = 'MediaProc',
  Plugin = 'Plugin',
  ExternalTool = 'ExternalTool',
  System = 'System',
}

/* -------------------- MediaProcError (abstract base) -------------------- */
// Extends ecosystem BaseError and adds hint, details, source fields via context.
// All concrete classes declare their code/exitCode/type/severity as readonly fields.
export abstract class MediaProcError extends BaseError {
  override readonly component = 'mediaproc';

  /** Optional user-facing hint stored in context */
  get hint(): string | undefined {
    return this.context?.['hint'] as string | undefined;
  }

  /** Optional error details stored in context */
  get details(): unknown {
    return this.context?.['details'];
  }

  /** Origin of the error stored in context */
  get source(): ErrorSource {
    return (this.context?.['source'] as ErrorSource) ?? ErrorSource.MediaProc;
  }
}

/* -------------------- User / Validation -------------------- */
export class UserInputError extends MediaProcError {
  readonly type = ErrorType.USER;
  readonly code = MediaProcErrorCodes.GENERAL_INPUT_INVALID;
  readonly exitCode = ExitCodes.INVALID_INPUT;
  override readonly severity = ErrorSeverity.MEDIUM;

  constructor(message: string, details?: unknown, hint?: string) {
    super(message, { details, hint, source: ErrorSource.User });
    this.name = 'UserInputError';
  }
}

export class ValidationError extends MediaProcError {
  readonly type = ErrorType.USER;
  readonly code = MediaProcErrorCodes.GENERAL_VALIDATION_FAILED;
  readonly exitCode = ExitCodes.VALIDATION_FAILED;
  override readonly severity = ErrorSeverity.MEDIUM;

  constructor(message: string, details?: unknown, hint?: string) {
    super(message, { details, hint, source: ErrorSource.User });
    this.name = 'ValidationError';
  }
}

export class ConfigError extends MediaProcError {
  readonly type = ErrorType.CONFIG;
  readonly code = MediaProcErrorCodes.GENERAL_CONFIG_INVALID;
  readonly exitCode = ExitCodes.INVALID_CONFIG;
  override readonly severity = ErrorSeverity.HIGH;

  constructor(message: string, details?: unknown, hint?: string) {
    super(message, { details, hint, source: ErrorSource.User });
    this.name = 'ConfigError';
  }
}

export class UnsupportedError extends MediaProcError {
  readonly type = ErrorType.USER;
  readonly code = MediaProcErrorCodes.GENERAL_UNSUPPORTED;
  readonly exitCode = ExitCodes.INVALID_FORMAT;
  override readonly severity = ErrorSeverity.HIGH;

  constructor(message: string, details?: unknown, hint?: string) {
    super(message, { details, hint, source: ErrorSource.User });
    this.name = 'UnsupportedError';
  }
}

export class NotImplementedError extends MediaProcError {
  readonly type = ErrorType.INTERNAL;
  readonly code = MediaProcErrorCodes.GENERAL_NOT_IMPLEMENTED;
  readonly exitCode = ExitCodes.BUG_DETECTED;
  override readonly severity = ErrorSeverity.MEDIUM;

  constructor(message = 'This feature is not implemented yet', details?: unknown) {
    super(message, { details, source: ErrorSource.MediaProc });
    this.name = 'NotImplementedError';
  }
}

/* -------------------- File System -------------------- */
export class FileSystemError extends MediaProcError {
  readonly type = ErrorType.SYSTEM;
  readonly code = MediaProcErrorCodes.GENERAL_FILESYSTEM_ERROR;
  readonly exitCode = ExitCodes.FILESYSTEM_ERROR;
  override readonly severity = ErrorSeverity.HIGH;

  constructor(message: string, details?: unknown) {
    super(message, { details, source: ErrorSource.System });
    this.name = 'FileSystemError';
  }
}

/* -------------------- External Tools -------------------- */
export class ToolError extends MediaProcError {
  readonly type = ErrorType.EXECUTION;
  readonly code = MediaProcErrorCodes.GENERAL_TOOL_ERROR;
  readonly exitCode = ExitCodes.ADAPTER_FAILED;
  override readonly severity = ErrorSeverity.CRITICAL;

  constructor(message: string, details?: unknown) {
    super(message, { details, source: ErrorSource.ExternalTool });
    this.name = 'ToolError';
  }
}

export class DependencyError extends MediaProcError {
  readonly type = ErrorType.CONFIG;
  readonly code = MediaProcErrorCodes.GENERAL_DEPENDENCY_MISSING;
  readonly exitCode = ExitCodes.MISSING_DEPENDENCY;
  override readonly severity = ErrorSeverity.CRITICAL;

  constructor(message: string, details?: unknown, hint?: string) {
    super(message, { details, hint, source: ErrorSource.ExternalTool });
    this.name = 'DependencyError';
  }
}

/* -------------------- Plugin -------------------- */
export class PluginError extends MediaProcError {
  readonly type = ErrorType.EXECUTION;
  readonly code = MediaProcErrorCodes.GENERAL_PLUGIN_ERROR;
  readonly exitCode = ExitCodes.PLUGIN_FAILED;
  override readonly severity = ErrorSeverity.HIGH;

  constructor(message: string, details?: unknown) {
    super(message, { details, source: ErrorSource.Plugin });
    this.name = 'PluginError';
  }
}

export class PluginNotFoundError extends MediaProcError {
  readonly type = ErrorType.EXECUTION;
  readonly code = MediaProcErrorCodes.GENERAL_PLUGIN_NOT_FOUND;
  readonly exitCode = ExitCodes.PLUGIN_FAILED;
  override readonly severity = ErrorSeverity.CRITICAL;

  constructor(message: string, details?: unknown) {
    super(message, { details, source: ErrorSource.Plugin });
    this.name = 'PluginNotFoundError';
  }
}

/* -------------------- Cancelled -------------------- */
export class CancelledError extends MediaProcError {
  readonly type = ErrorType.EXECUTION;
  readonly code = MediaProcErrorCodes.GENERAL_CANCELLED;
  readonly exitCode = ExitCodes.WORKFLOW_FAILED;
  override readonly severity = ErrorSeverity.LOW;

  constructor(message = 'Operation cancelled by user') {
    super(message, { source: ErrorSource.User });
    this.name = 'CancelledError';
  }
}

/* -------------------- Internal -------------------- */
export class InternalError extends MediaProcError {
  readonly type = ErrorType.INTERNAL;
  readonly code = MediaProcErrorCodes.GENERAL_INTERNAL_ERROR;
  readonly exitCode = ExitCodes.INTERNAL_ERROR;
  override readonly severity = ErrorSeverity.CRITICAL;

  constructor(message: string, details?: unknown) {
    super(message, { details, source: ErrorSource.MediaProc });
    this.name = 'InternalError';
  }
}

/* -------------------- Type Guard -------------------- */
export function isMediaProcError(err: unknown): err is MediaProcError {
  return err instanceof MediaProcError;
}