/**
 * @mediaproc/core - Core utilities for MediaProc CLI and Plugins
 * 
 * This package contains shared utilities used across MediaProc CLI and all plugins:
 * - Branding utilities for consistent CLI/plugin footers
 * - Help formatters for standardized command help displays
 * - Path validators for robust file/directory handling
 * - Explain formatters for detailed operation explanations
 * - Supported extensions registry
 */

// Branding
export * from './branding/index.js';

// Path Validator
export * from './validators/index.js';

// Utils
export * from './utils/index.js';

// Formatters (Help & Explain)
export * from './formatters/index.js';

// Types & Interfaces (Help & Explain)
export * from './types/index.js';

// Explain System (Templates, Flag, Hook)
export * from './explain/index.js';

// Errors & Exit Codes (Error Classes, Severity, Codes & Global Error Handler)
export * from './errors/index.js';
export * from './handlers/index.js';