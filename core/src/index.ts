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

export * from './branding/branding.js';
export * from './validators/pathValidator.js';
export * from './utils/supportedExtensions.js';
export * from './formatters/helpFormatter.js';
export * from './types/helpTypes.js';
export * from './types/explainTypes.js';
export * from './formatters/explainFormatter.js';
export * from './explain/templates/explainHumanTemplate.js';
export * from './explain/templates/explainDetailsTemplate.js';
export * from './explain/explainFlag.js';
export * from './explain/hook/explainPreActionHook.js';
export * from './errors/errorTypes.js';
export * from './errors/exitCodes.js';