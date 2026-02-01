// Package manager utilities
export {
  detectPackageManager,
  isGlobalInstall,
  isPluginGlobal,
  buildInstallArgs,
  buildUninstallArgs,
  type PackageManager
} from './package-manager.js';

// Plugin helper utilities
export {
  verifyPluginInstallation,
  loadPluginSafe,
  isPluginLoaded,
  formatPluginName,
  getPluginCommand,
  isValidPluginName,
  getPluginExamples
} from './plugin-helpers.js';

// Plugin management (API, Manager, Registry)
export * from './plugins/index.js';
