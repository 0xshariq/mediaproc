/**
 * Plugin Registry - Maps short names to full package names
 * This allows users to type: mediaproc add image
 * Instead of: mediaproc add @mediaproc/image
 */

export interface PluginRegistryEntry {
  name: string;
  package: string;
  description: string;
  category: 'core' | 'advanced' | 'future-proof';
  type: 'official' | 'community';
  dependencies?: string[];
  systemRequirements?: string[];
  keywords?: string[];
  documentation?: string;
}

export const PLUGIN_REGISTRY: Record<string, PluginRegistryEntry> = {
  // Core Media Plugins
  'image': {
    name: 'image',
    package: '@mediaproc/image',
    description: 'Image processing (resize, convert, filters, effects)',
    category: 'core',
    type: 'official',
    systemRequirements: ['Sharp (auto-installed)'],
    keywords: ['image', 'photo', 'resize', 'convert', 'filter', 'compress'],
    documentation: 'https://docs.mediaproc.io/plugins/image'
  },
  
  'video': {
    name: 'video',
    package: '@mediaproc/video',
    description: 'Video processing (transcode, compress, extract)',
    category: 'core',
    type: 'official',
    systemRequirements: ['FFmpeg'],
    keywords: ['video', 'movie', 'transcode', 'compress', 'extract', 'trim'],
    documentation: 'https://docs.mediaproc.io/plugins/video'
  },
  
  'audio': {
    name: 'audio',
    package: '@mediaproc/audio',
    description: 'Audio processing (convert, normalize, extract)',
    category: 'core',
    type: 'official',
    systemRequirements: ['FFmpeg'],
    keywords: ['audio', 'music', 'sound', 'convert', 'normalize', 'extract'],
    documentation: 'https://docs.mediaproc.io/plugins/audio'
  },
  
  // Document Media (Very Important)
  'document': {
    name: 'document',
    package: '@mediaproc/document',
    description: 'PDF/DOCX/PPTX/EPUB processing, OCR, compression',
    category: 'core',
    type: 'official',
    systemRequirements: ['Ghostscript', 'Tesseract OCR', 'Poppler'],
    keywords: ['pdf', 'document', 'docx', 'ocr', 'compress'],
    documentation: 'https://docs.mediaproc.io/plugins/document'
  },
  
  'doc': {
    name: 'doc',
    package: '@mediaproc/document',
    description: 'Alias for document plugin',
    category: 'core',
    type: 'official',
    keywords: ['pdf', 'document', 'alias']
  },
  
  // Animation & Motion Media
  'animation': {
    name: 'animation',
    package: '@mediaproc/animation',
    description: 'GIF/APNG/WebP animations, Lottie, SVG animations',
    category: 'core',
    type: 'official',
    systemRequirements: ['FFmpeg'],
    keywords: ['gif', 'animation', 'webp', 'lottie', 'animated'],
    documentation: 'https://docs.mediaproc.io/plugins/animation'
  },
  
  'anim': {
    name: 'anim',
    package: '@mediaproc/animation',
    description: 'Alias for animation plugin',
    category: 'core',
    type: 'official',
    keywords: ['animation', 'alias']
  },
  
  // 3D & Spatial Media (Advanced)
  '3d': {
    name: '3d',
    package: '@mediaproc/3d',
    description: '3D models (GLTF, GLB, OBJ), textures, HDRI, AR/VR assets',
    category: 'advanced',
    type: 'official',
    systemRequirements: ['gltf-transform'],
    keywords: ['3d', 'model', 'gltf', 'glb', 'texture', 'ar', 'vr'],
    documentation: 'https://docs.mediaproc.io/plugins/3d'
  },
  
  'spatial': {
    name: 'spatial',
    package: '@mediaproc/3d',
    description: 'Alias for 3d plugin',
    category: 'advanced',
    type: 'official',
    keywords: ['3d', 'spatial', 'alias']
  },
  
  // Metadata-only Processing (Underrated but Powerful)
  'metadata': {
    name: 'metadata',
    package: '@mediaproc/metadata',
    description: 'EXIF cleanup, GPS removal, codec inspection, compliance checks',
    category: 'core',
    type: 'official',
    systemRequirements: ['ExifTool'],
    keywords: ['metadata', 'exif', 'inspect', 'compliance'],
    documentation: 'https://docs.mediaproc.io/plugins/metadata'
  },
  
  'meta': {
    name: 'meta',
    package: '@mediaproc/metadata',
    description: 'Alias for metadata plugin',
    category: 'core',
    type: 'official',
    keywords: ['metadata', 'alias']
  },
  
  'inspect': {
    name: 'inspect',
    package: '@mediaproc/metadata',
    description: 'Alias for metadata plugin',
    category: 'core',
    type: 'official',
    keywords: ['inspect', 'metadata', 'alias']
  },
  
  // Streaming & Packaging Media (Advanced, Industry-Relevant)
  'stream': {
    name: 'stream',
    package: '@mediaproc/stream',
    description: 'HLS/DASH packaging, chunking, encryption, manifests',
    category: 'advanced',
    type: 'official',
    systemRequirements: ['FFmpeg', 'Shaka Packager (optional)'],
    keywords: ['stream', 'hls', 'dash', 'manifest', 'packaging'],
    documentation: 'https://docs.mediaproc.io/plugins/stream'
  },
  
  'streaming': {
    name: 'streaming',
    package: '@mediaproc/stream',
    description: 'Alias for stream plugin',
    category: 'advanced',
    type: 'official',
    keywords: ['streaming', 'alias']
  },
  
  // AI-Assisted Media (Future-Proof)
  'ai': {
    name: 'ai',
    package: '@mediaproc/ai',
    description: 'Auto-captioning, scene detection, face blur, background removal, speech-to-text',
    category: 'future-proof',
    type: 'official',
    systemRequirements: ['TensorFlow/ONNX Runtime (optional)', 'Whisper (optional)'],
    keywords: ['ai', 'ml', 'caption', 'detection', 'blur', 'transcribe'],
    documentation: 'https://docs.mediaproc.io/plugins/ai'
  },
  
  'ml': {
    name: 'ml',
    package: '@mediaproc/ai',
    description: 'Alias for ai plugin',
    category: 'future-proof',
    type: 'official',
    keywords: ['ml', 'ai', 'alias']
  },
  
  // Media Pipelines (Highest Level)
  'pipeline': {
    name: 'pipeline',
    package: '@mediaproc/pipeline',
    description: 'Declarative YAML-based media processing workflows',
    category: 'advanced',
    type: 'official',
    dependencies: ['Can use any installed plugins'],
    keywords: ['pipeline', 'workflow', 'batch', 'yaml'],
    documentation: 'https://docs.mediaproc.io/plugins/pipeline'
  },
};

/**
 * Resolve short name to full package name
 * Handles three types of plugins:
 * 1. Official: @mediaproc/<name> (e.g., @mediaproc/image)
 * 2. Community: mediaproc-<name> (e.g., mediaproc-super-filters)
 * 3. Third-party: any npm package (e.g., my-custom-mediaproc-plugin)
 * @throws {Error} If plugin name is empty or invalid
 */
export function resolvePluginPackage(shortName: string): string {
  // Validate input
  if (!shortName || typeof shortName !== 'string') {
    throw new Error('Plugin name cannot be empty');
  }

  const trimmed = shortName.trim();
  if (!trimmed) {
    throw new Error('Plugin name cannot be empty');
  }

  // Validate characters (basic npm package name validation)
  if (!/^[@\w\-./]+$/.test(trimmed)) {
    throw new Error(`Invalid plugin name: ${trimmed}`);
  }
  
  // Already a full package name - return as-is
  if (trimmed.includes('/') || trimmed.startsWith('mediaproc-')) {
    return trimmed;
  }
  
  // Look up in official registry first
  const entry = PLUGIN_REGISTRY[trimmed.toLowerCase()];
  if (entry) {
    return entry.package;
  }
  
  // Not in registry - could be community or third-party
  // Assume community format: mediaproc-<name>
  return `mediaproc-${trimmed}`;
}

/**
 * Detect plugin type from package name
 * @param packageName - Full package name
 * @returns Plugin type: official, community, or third-party
 */
export function detectPluginType(packageName: string): 'official' | 'community' | 'third-party' {
  if (!packageName || typeof packageName !== 'string') {
    return 'third-party';
  }

  const trimmed = packageName.trim();
  
  if (trimmed.startsWith('@mediaproc/')) {
    return 'official';
  }
  if (trimmed.startsWith('mediaproc-')) {
    return 'community';
  }
  return 'third-party';
}

/**
 * Get all available plugins grouped by category
 */
export function getPluginsByCategory(): Record<string, PluginRegistryEntry[]> {
  const grouped: Record<string, PluginRegistryEntry[]> = {
    core: [],
    advanced: [],
    'future-proof': [],
  };
  
  const seen = new Set<string>();
  
  for (const entry of Object.values(PLUGIN_REGISTRY)) {
    if (!seen.has(entry.package)) {
      grouped[entry.category].push(entry);
      seen.add(entry.package);
    }
  }
  
  return grouped;
}

/**
 * Get all plugins (unique by package)
 */
export function getAllPlugins(): PluginRegistryEntry[] {
  const seen = new Set<string>();
  const plugins: PluginRegistryEntry[] = [];
  
  for (const entry of Object.values(PLUGIN_REGISTRY)) {
    if (!seen.has(entry.package)) {
      plugins.push(entry);
      seen.add(entry.package);
    }
  }
  
  return plugins;
}

/**
 * Search plugins by keyword
 */
export function searchPlugins(keyword: string): PluginRegistryEntry[] {
  const lowerKeyword = keyword.toLowerCase();
  const seen = new Set<string>();
  const results: PluginRegistryEntry[] = [];
  
  for (const entry of Object.values(PLUGIN_REGISTRY)) {
    if (seen.has(entry.package)) continue;
    
    const matchesName = entry.name.toLowerCase().includes(lowerKeyword);
    const matchesDescription = entry.description.toLowerCase().includes(lowerKeyword);
    const matchesKeywords = entry.keywords?.some(k => k.toLowerCase().includes(lowerKeyword));
    
    if (matchesName || matchesDescription || matchesKeywords) {
      results.push(entry);
      seen.add(entry.package);
    }
  }
  
  return results;
}

/**
 * Get plugin entry by package name
 */
export function getPluginEntry(packageName: string): PluginRegistryEntry | undefined {
  for (const entry of Object.values(PLUGIN_REGISTRY)) {
    if (entry.package === packageName) {
      return entry;
    }
  }
  return undefined;
}

/**
 * Check if a plugin exists in registry
 */
export function isValidPlugin(name: string): boolean {
  return name.startsWith('@mediaproc/') || name.toLowerCase() in PLUGIN_REGISTRY;
}

/**
 * Get plugin category
 */
export function getPluginCategory(packageName: string): string | undefined {
  const entry = getPluginEntry(packageName);
  return entry?.category;
}
