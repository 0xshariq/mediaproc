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

// Export all utilities
export * from './branding.js';
export * from './helpFormatter.js';
export * from './pathValidator.js';
export * from './explainFormatter.js';
export * from './supportedExtensions.js';

// Re-export types for convenience
export type {
  HelpOption,
  HelpExample,
  HelpSection,
  CommandHelpConfig
} from './helpFormatter.js';
