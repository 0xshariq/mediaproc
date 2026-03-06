import {
  MediaProcError,
  ErrorSeverity,
  isMediaProcError,
  ExitCodes,
} from '../errors/index.js';

type ErrorHandlerOptions = {
  debug?: boolean;
};

export class GlobalErrorHandler {
  static handle(err: unknown, options: ErrorHandlerOptions = {}): never {
    const debug = options.debug ?? false;

    if (isMediaProcError(err)) {
      this.printMediaProcError(err, debug);
      process.exit(err.exitCode);
    }

    // Unknown error fallback (bug)
    this.printUnknownError(err, debug);
    process.exit(ExitCodes.INTERNAL_ERROR);
  }

  private static printMediaProcError(err: MediaProcError, debug: boolean) {
    const prefix =
      err.severity === ErrorSeverity.LOW    ? 'info:'  :
      err.severity === ErrorSeverity.MEDIUM ? 'warn:'  :
      'error:';

    console.error(`${prefix} ${err.message}`);

    if (err.hint) {
      console.error(`hint: ${err.hint}`);
    }

    if (debug) {
      console.error('');
      console.error('--- debug ---');
      console.error(`code: ${err.code}`);
      console.error(`type: ${err.type}`);
      console.error(`source: ${err.source}`);
      console.error(`severity: ${err.severity}`);
      console.error(`exitCode: ${err.exitCode}`);

      if (err.details) {
        console.error('details:', err.details);
      }

      if (err.stack) {
        console.error(err.stack);
      }
    }
  }

  private static printUnknownError(err: unknown, debug: boolean) {
    console.error('error: an unexpected internal error occurred');

    if (debug) {
      console.error('');
      console.error('--- debug ---');
      console.error(err);
    }
  }
}
