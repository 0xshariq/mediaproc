// Plugin API types and interfaces
export * from './api.js';

// Plugin Manager
export { PluginManager, pluginManager, getPluginNameForCommand } from './manager.js';

// Plugin Registry
export {
  resolvePluginPackage,
  detectPluginType,
  getPluginsByCategory,
  getAllPlugins,
  searchPlugins,
  getPluginEntry,
  isValidPlugin,
  getPluginCategory,
  PLUGIN_REGISTRY,
  type PluginRegistryEntry
} from './registry.js';
