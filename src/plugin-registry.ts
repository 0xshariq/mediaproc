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
  dependencies?: string[];
  systemRequirements?: string[];
}

export const PLUGIN_REGISTRY: Record<string, PluginRegistryEntry> = {
  // Core Media Plugins
  'image': {
    name: 'image',
    package: '@mediaproc/image',
    description: 'Image processing (resize, convert, filters, effects)',
    category: 'core',
    systemRequirements: ['Sharp (auto-installed)'],
  },
  
  'video': {
    name: 'video',
    package: '@mediaproc/video',
    description: 'Video processing (transcode, compress, extract)',
    category: 'core',
    systemRequirements: ['FFmpeg'],
  },
  
  'audio': {
    name: 'audio',
    package: '@mediaproc/audio',
    description: 'Audio processing (convert, normalize, extract)',
    category: 'core',
    systemRequirements: ['FFmpeg'],
  },
  
  // Document Media (Very Important)
  'document': {
    name: 'document',
    package: '@mediaproc/document',
    description: 'PDF/DOCX/PPTX/EPUB processing, OCR, compression',
    category: 'core',
    systemRequirements: ['Ghostscript', 'Tesseract OCR', 'Poppler'],
  },
  
  'doc': {
    name: 'doc',
    package: '@mediaproc/document',
    description: 'Alias for document plugin',
    category: 'core',
  },
  
  // Animation & Motion Media
  'animation': {
    name: 'animation',
    package: '@mediaproc/animation',
    description: 'GIF/APNG/WebP animations, Lottie, SVG animations',
    category: 'core',
    systemRequirements: ['FFmpeg'],
  },
  
  'anim': {
    name: 'anim',
    package: '@mediaproc/animation',
    description: 'Alias for animation plugin',
    category: 'core',
  },
  
  // 3D & Spatial Media (Advanced)
  '3d': {
    name: '3d',
    package: '@mediaproc/3d',
    description: '3D models (GLTF, GLB, OBJ), textures, HDRI, AR/VR assets',
    category: 'advanced',
    systemRequirements: ['gltf-transform'],
  },
  
  'spatial': {
    name: 'spatial',
    package: '@mediaproc/3d',
    description: 'Alias for 3d plugin',
    category: 'advanced',
  },
  
  // Metadata-only Processing (Underrated but Powerful)
  'metadata': {
    name: 'metadata',
    package: '@mediaproc/metadata',
    description: 'EXIF cleanup, GPS removal, codec inspection, compliance checks',
    category: 'core',
    systemRequirements: ['ExifTool'],
  },
  
  'meta': {
    name: 'meta',
    package: '@mediaproc/metadata',
    description: 'Alias for metadata plugin',
    category: 'core',
  },
  
  'inspect': {
    name: 'inspect',
    package: '@mediaproc/metadata',
    description: 'Alias for metadata plugin',
    category: 'core',
  },
  
  // Streaming & Packaging Media (Advanced, Industry-Relevant)
  'stream': {
    name: 'stream',
    package: '@mediaproc/stream',
    description: 'HLS/DASH packaging, chunking, encryption, manifests',
    category: 'advanced',
    systemRequirements: ['FFmpeg', 'Shaka Packager (optional)'],
  },
  
  'streaming': {
    name: 'streaming',
    package: '@mediaproc/stream',
    description: 'Alias for stream plugin',
    category: 'advanced',
  },
  
  // AI-Assisted Media (Future-Proof)
  'ai': {
    name: 'ai',
    package: '@mediaproc/ai',
    description: 'Auto-captioning, scene detection, face blur, background removal, speech-to-text',
    category: 'future-proof',
    systemRequirements: ['TensorFlow/ONNX Runtime (optional)', 'Whisper (optional)'],
  },
  
  'ml': {
    name: 'ml',
    package: '@mediaproc/ai',
    description: 'Alias for ai plugin',
    category: 'future-proof',
  },
  
  // Media Pipelines (Highest Level)
  'pipeline': {
    name: 'pipeline',
    package: '@mediaproc/pipeline',
    description: 'Declarative YAML-based media processing workflows',
    category: 'advanced',
    dependencies: ['Can use any installed plugins'],
  },
};

/**
 * Resolve short name to full package name
 */
export function resolvePluginPackage(shortName: string): string {
  // If already full package name, return as-is
  if (shortName.startsWith('@mediaproc/')) {
    return shortName;
  }
  
  // Look up in registry
  const entry = PLUGIN_REGISTRY[shortName.toLowerCase()];
  if (!entry) {
    throw new Error(
      `Unknown plugin: ${shortName}\nRun 'mediaproc plugins' to see available plugins`
    );
  }
  
  return entry.package;
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
 * Check if a plugin exists in registry
 */
export function isValidPlugin(name: string): boolean {
  return name.startsWith('@mediaproc/') || name.toLowerCase() in PLUGIN_REGISTRY;
}
