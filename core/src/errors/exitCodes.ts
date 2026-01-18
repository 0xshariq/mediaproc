/* -------------------- Exit Codes -------------------- */
/**
 * Exit code ranges (documented contract):
 * * 0       → success
 * * 1–9     → user input / config / validation
 * * 10–19   → filesystem
 * * 20–29   → external tools (ffmpeg, sharp, etc.)
 * * 30–39   → plugin system
 * * 40–49   → internal errors
 * * 130     → user interruption (SIGINT)
 */
export const EXIT_CODES = {
  SUCCESS: 0,

  USER_INPUT: 1,
  VALIDATION: 2,
  CONFIG: 3,
  UNSUPPORTED: 4,
  NOT_IMPLEMENTED: 5,

  FS_ERROR: 10,

  TOOL_ERROR: 20,
  DEPENDENCY_MISSING: 21,

  PLUGIN_ERROR: 30,
  PLUGIN_NOT_FOUND: 31,

  INTERNAL: 40,

  INTERRUPTED: 130,
} as const;