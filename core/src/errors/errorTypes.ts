/* ============================================================
 * MediaProc Error System (v1.0-ready)
 * ============================================================
 */

import { EXIT_CODES } from "./exitCodes.js";

/* -------------------- Error Type -------------------- */
export enum ErrorType {
  UserInput = 'UserInput',
  Validation = 'Validation',
  Config = 'Config',
  Unsupported = 'Unsupported',
  NotImplemented = 'NotImplemented',

  FileSystem = 'FileSystem',
  Tool = 'Tool',
  Dependency = 'Dependency',

  Plugin = 'Plugin',
  Internal = 'Internal',

  Cancelled = 'Cancelled',
}

/* -------------------- Error Severity -------------------- */
export enum ErrorSeverity {
  Info = 'Info',
  Warning = 'Warning',
  Error = 'Error',
  Fatal = 'Fatal',
}

/* -------------------- Error Source -------------------- */
export enum ErrorSource {
  User = 'User',
  MediaProc = 'MediaProc',
  Plugin = 'Plugin',
  ExternalTool = 'ExternalTool',
  System = 'System',
}

/* -------------------- Base Error -------------------- */
export class MediaProcError extends Error {
  readonly type: ErrorType;
  readonly exitCode: number;
  readonly severity: ErrorSeverity;
  readonly source: ErrorSource;
  readonly retryable?: boolean;
  readonly details?: unknown;
  readonly hint?: string;

  constructor(options: {
    message: string;
    type: ErrorType;
    exitCode: number;
    severity?: ErrorSeverity;
    source?: ErrorSource;
    retryable?: boolean;
    details?: unknown;
    hint?: string;
  }) {
    super(options.message);
    this.name = 'MediaProcError';

    this.type = options.type;
    this.exitCode = options.exitCode;
    this.severity = options.severity ?? ErrorSeverity.Error;
    this.source = options.source ?? ErrorSource.MediaProc;
    this.retryable = options.retryable;
    this.details = options.details;
    this.hint = options.hint;

    Error.captureStackTrace?.(this, MediaProcError);
  }
}

/* -------------------- User / Validation -------------------- */
export class UserInputError extends MediaProcError {
  constructor(message: string, details?: unknown, hint?: string) {
    super({
      message,
      type: ErrorType.UserInput,
      exitCode: EXIT_CODES.USER_INPUT,
      severity: ErrorSeverity.Warning,
      source: ErrorSource.User,
      details,
      hint,
    });
    this.name = 'UserInputError';
  }
}

export class ValidationError extends MediaProcError {
  constructor(message: string, details?: unknown, hint?: string) {
    super({
      message,
      type: ErrorType.Validation,
      exitCode: EXIT_CODES.VALIDATION,
      severity: ErrorSeverity.Warning,
      source: ErrorSource.User,
      details,
      hint,
    });
    this.name = 'ValidationError';
  }
}

export class ConfigError extends MediaProcError {
  constructor(message: string, details?: unknown, hint?: string) {
    super({
      message,
      type: ErrorType.Config,
      exitCode: EXIT_CODES.CONFIG,
      severity: ErrorSeverity.Error,
      source: ErrorSource.User,
      details,
      hint,
    });
    this.name = 'ConfigError';
  }
}

export class UnsupportedError extends MediaProcError {
  constructor(message: string, details?: unknown, hint?: string) {
    super({
      message,
      type: ErrorType.Unsupported,
      exitCode: EXIT_CODES.UNSUPPORTED,
      severity: ErrorSeverity.Error,
      source: ErrorSource.User,
      details,
      hint,
    });
    this.name = 'UnsupportedError';
  }
}

export class NotImplementedError extends MediaProcError {
  constructor(message = 'This feature is not implemented yet', details?: unknown) {
    super({
      message,
      type: ErrorType.NotImplemented,
      exitCode: EXIT_CODES.NOT_IMPLEMENTED,
      severity: ErrorSeverity.Info,
      source: ErrorSource.MediaProc,
      details,
    });
    this.name = 'NotImplementedError';
  }
}

/* -------------------- File System -------------------- */
export class FileSystemError extends MediaProcError {
  constructor(message: string, details?: unknown, retryable = false) {
    super({
      message,
      type: ErrorType.FileSystem,
      exitCode: EXIT_CODES.FS_ERROR,
      severity: ErrorSeverity.Error,
      source: ErrorSource.System,
      retryable,
      details,
    });
    this.name = 'FileSystemError';
  }
}

/* -------------------- External Tools -------------------- */
export class ToolError extends MediaProcError {
  constructor(message: string, details?: unknown, retryable = false) {
    super({
      message,
      type: ErrorType.Tool,
      exitCode: EXIT_CODES.TOOL_ERROR,
      severity: ErrorSeverity.Fatal,
      source: ErrorSource.ExternalTool,
      retryable,
      details,
    });
    this.name = 'ToolError';
  }
}

export class DependencyError extends MediaProcError {
  constructor(message: string, details?: unknown, hint?: string) {
    super({
      message,
      type: ErrorType.Dependency,
      exitCode: EXIT_CODES.DEPENDENCY_MISSING,
      severity: ErrorSeverity.Fatal,
      source: ErrorSource.ExternalTool,
      details,
      hint,
    });
    this.name = 'DependencyError';
  }
}

/* -------------------- Plugin -------------------- */
export class PluginError extends MediaProcError {
  constructor(message: string, details?: unknown) {
    super({
      message,
      type: ErrorType.Plugin,
      exitCode: EXIT_CODES.PLUGIN_ERROR,
      severity: ErrorSeverity.Error,
      source: ErrorSource.Plugin,
      details,
    });
    this.name = 'PluginError';
  }
}

export class PluginNotFoundError extends MediaProcError {
  constructor(message: string, details?: unknown) {
    super({
      message,
      type: ErrorType.Plugin,
      exitCode: EXIT_CODES.PLUGIN_NOT_FOUND,
      severity: ErrorSeverity.Fatal,
      source: ErrorSource.Plugin,
      details,
    });
    this.name = 'PluginNotFoundError';
  }
}

/* -------------------- Cancelled -------------------- */
export class CancelledError extends MediaProcError {
  constructor(message = 'Operation cancelled by user') {
    super({
      message,
      type: ErrorType.Cancelled,
      exitCode: EXIT_CODES.INTERRUPTED,
      severity: ErrorSeverity.Info,
      source: ErrorSource.User,
    });
    this.name = 'CancelledError';
  }
}

/* -------------------- Internal -------------------- */
export class InternalError extends MediaProcError {
  constructor(message: string, details?: unknown) {
    super({
      message,
      type: ErrorType.Internal,
      exitCode: EXIT_CODES.INTERNAL,
      severity: ErrorSeverity.Fatal,
      source: ErrorSource.MediaProc,
      details,
    });
    this.name = 'InternalError';
  }
}

/* -------------------- Type Guard -------------------- */
export function isMediaProcError(err: unknown): err is MediaProcError {
  return err instanceof MediaProcError;
}