/**
 * MediaProc Action Resolver
 *
 * Parses a workflow `uses` string in the mediaproc namespace into structured parts.
 *
 * Format:  mediaproc.<plugin>.<command>
 * Example: mediaproc.image.resize
 *           └──────── └────── └──────
 *           component  plugin  command
 *
 * Rules:
 * - Must have exactly 3 dot-separated segments.
 * - First segment must be "mediaproc".
 * - Plugin and command must be non-empty identifiers (a-z, 0-9, hyphens).
 */

export interface MediaProcAction {
  /** Always "mediaproc" */
  component: string;
  /** Plugin name, e.g. "image", "video", "audio" */
  plugin: string;
  /** Command name, e.g. "resize", "transcode", "convert" */
  command: string;
  /** Original raw string, e.g. "mediaproc.image.resize" */
  raw: string;
}

export class MediaProcActionParseError extends Error {
  constructor(
    public readonly raw: string,
    reason: string,
  ) {
    super(`Invalid mediaproc action "${raw}": ${reason}`);
    this.name = 'MediaProcActionParseError';
  }
}

const IDENTIFIER_RE = /^[a-z][a-z0-9-]*$/;

/**
 * Returns true when a `uses` string belongs to the mediaproc namespace.
 * Fast check — no validation of structure.
 */
export function isMediaProcAction(uses: string): boolean {
  return typeof uses === 'string' && uses.startsWith('mediaproc.');
}

/**
 * Parse a fully-qualified mediaproc action string.
 *
 * @throws {MediaProcActionParseError} when the string is malformed.
 */
export function parseMediaProcAction(raw: string): MediaProcAction {
  const parts = raw.split('.');

  if (parts.length !== 3) {
    throw new MediaProcActionParseError(
      raw,
      `expected exactly 3 segments (mediaproc.<plugin>.<command>), got ${parts.length}`,
    );
  }

  const [component, plugin, command] = parts;

  if (component !== 'mediaproc') {
    throw new MediaProcActionParseError(
      raw,
      `first segment must be "mediaproc", got "${component}"`,
    );
  }

  if (!IDENTIFIER_RE.test(plugin)) {
    throw new MediaProcActionParseError(
      raw,
      `plugin name "${plugin}" is not a valid identifier (a-z, 0-9, hyphens, must start with a letter)`,
    );
  }

  if (!IDENTIFIER_RE.test(command)) {
    throw new MediaProcActionParseError(
      raw,
      `command name "${command}" is not a valid identifier (a-z, 0-9, hyphens, must start with a letter)`,
    );
  }

  return { component, plugin, command, raw };
}
