export enum ErrorType {
  UserInput = 'UserInput',
  FileSystem = 'FileSystem',
  Tool = 'Tool',
  Unsupported = 'Unsupported',
  Plugin = 'Plugin',
  Internal = 'Internal',
}

export class MediaProcError extends Error {
  type: ErrorType;
  exitCode: number;
  details?: any;

  constructor(message: string, type: ErrorType, exitCode: number, details?: any) {
    super(message);
    this.name = 'MediaProcError';
    this.type = type;
    this.exitCode = exitCode;
    this.details = details;
    Error.captureStackTrace?.(this, MediaProcError);
  }
}

export class UserInputError extends MediaProcError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.UserInput, 1, details);
    this.name = 'UserInputError';
  }
}

export class FileSystemError extends MediaProcError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.FileSystem, 2, details);
    this.name = 'FileSystemError';
  }
}

export class ToolError extends MediaProcError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.Tool, 3, details);
    this.name = 'ToolError';
  }
}

export class UnsupportedError extends MediaProcError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.Unsupported, 4, details);
    this.name = 'UnsupportedError';
  }
}

export class PluginError extends MediaProcError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.Plugin, 5, details);
    this.name = 'PluginError';
  }
}

export class InternalError extends MediaProcError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.Internal, 6, details);
    this.name = 'InternalError';
  }
}
