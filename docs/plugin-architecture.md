# Plugin Architecture

## Overview

MediaProc uses an **on-demand plugin architecture** that gives users complete control over which plugins they install. No plugins are pre-installed or bundled with the CLI.

## Architecture Summary

```
@mediaproc/cli (Universal CLI)
├── Core Commands (always available)
│   ├── convert - Universal file conversion
│   ├── info - File information
│   └── optimize - Optimization suggestions
│
└── Plugins (install on-demand)
    ├── Official Plugins (@mediaproc/*)
    │   ├── @mediaproc/image (mediaproc add image)
    │   ├── @mediaproc/video (mediaproc add video)
    │   ├── @mediaproc/audio (mediaproc add audio)
    │   └── ... 7 more official plugins
    │
    ├── Community Plugins (mediaproc-*)
    │   └── Any npm package starting with mediaproc-
    │
    └── Third-Party Plugins
        └── Any compatible npm package
```

## Official Plugins

### What Are Official Plugins?

Official plugins are **maintained by the MediaProc team** and published under the `@mediaproc/*` namespace. They provide professional-grade media processing capabilities.

### Available Official Plugins:

- **@mediaproc/image** - Image processing (49 commands)
- **@mediaproc/video** - Video processing
- **@mediaproc/audio** - Audio processing
- **@mediaproc/document** - PDF/DOCX processing
- **@mediaproc/animation** - GIF/APNG/WebP animations
- **@mediaproc/3d** - 3D model processing
- **@mediaproc/stream** - HLS/DASH streaming
- **@mediaproc/ai** - AI-powered media processing
- **@mediaproc/metadata** - Metadata management
- **@mediaproc/pipeline** - Workflow automation

### Why Official Plugins?

1. **Quality Assurance** - Professionally maintained and tested
2. **Consistent API** - Follow MediaProc standards
3. **Regular Updates** - Active development and bug fixes
4. **Documentation** - Comprehensive guides and examples
5. **Community Trust** - Backed by the core team

### How to Install:

```bash
# Install CLI (no plugins included)
npm install -g @mediaproc/cli

# Browse available plugins
mediaproc plugins

# Install the plugins you need
mediaproc add image
mediaproc add video
mediaproc add audio

# Now use them
mediaproc image resize photo.jpg -w 1920
mediaproc video transcode movie.mp4
mediaproc list  # Shows installed plugins
```

## Community & Third-Party Plugins

### What Are Community Plugins?

Community plugins are **developed by the community** and follow the naming convention `mediaproc-*`. They extend MediaProc with custom functionality.

### Third-Party Plugins

Any npm package that exports a compatible plugin interface can be used with MediaProc.

### How to Install:

```bash
# Install community plugin
mediaproc add mediaproc-custom-filter

# Install third-party plugin (full package name)
mediaproc add any-compatible-package

# Use them like official plugins
mediaproc custom-filter process input.jpg
```

### Plugin Types:

1. **Official** (@mediaproc/*) - Maintained by core team
2. **Community** (mediaproc-*) - Community-maintained
3. **Third-Party** (any npm package) - Independent packages

### Benefits of On-Demand Architecture:

1. **Lightweight CLI** - Core CLI is minimal (<5MB)
2. **User Control** - Install only what you need
3. **Faster Installation** - No unused dependencies
4. **Extensibility** - Easy to add new plugins
5. **Flexibility** - Mix official, community, and third-party plugins

## Package Dependencies

### Main CLI (package.json)

```json
{
  "name": "@mediaproc/cli",
  "version": "0.2.0",
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^14.0.2",
    "ora": "^8.1.1",
    "execa": "^9.5.2"
  },
  "peerDependencies": {
    "@mediaproc/image": "^1.0.0",
    "@mediaproc/video": "^1.0.0"
  },
  "peerDependenciesMeta": {
    "@mediaproc/image": { "optional": true },
    "@mediaproc/video": { "optional": true }
  }
}
```

**Note:** Plugins are peer dependencies (optional), not direct dependencies. This keeps the CLI lightweight.

### Plugin (plugins/image/package.json)

```json
{
  "name": "@mediaproc/image",
  "dependencies": {
    // NO @mediaproc/cli dependency!
    // Plugins are standalone
    "chalk": "^5.3.0",
    "commander": "^14.0.2",
    "sharp": "^0.34.5"
  },
  "bin": {
    "mediaproc-image": "./bin/cli.js"  // Can run standalone
  }
}
```

## Plugin Independence

### Dual-Mode Operation

Each plugin can work in two ways:

#### 1. With Universal CLI (Recommended)

```bash
npm install -g @mediaproc/cli
mediaproc image resize photo.jpg -w 1920
```

**Benefits:**
- Unified command interface
- Centralized plugin management
- Shared configuration
- Cross-plugin integration

#### 2. Standalone (When needed)

```bash
npm install -g @mediaproc/image
mediaproc-image resize photo.jpg -w 1920
```

**Benefits:**
- Lightweight (only one plugin)
- Faster startup
- Simple distribution
- No CLI overhead

## Plugin Loading Mechanism

### PluginManager Flow

```typescript
class PluginManager {
  // Official plugins registry (for discovery and validation)
  private officialPlugins = [
    '@mediaproc/image',
    '@mediaproc/video',
    '@mediaproc/audio',
    // ... all 10 official plugins
  ];

  // NO auto-loading at startup
  // Plugins are loaded on-demand when user runs 'add' command
  
  async loadPlugin(pluginName: string, program: Command) {
    // Dynamically import and register plugin
    const plugin = await import(pluginName);
    await plugin.register(program);
    this.plugins.set(pluginName, plugin);
  }
}
```

### Discovery Process

1. **Installation Detection**: Scan `package.json` for installed plugins
2. **On-Demand Loading**: Load plugins only when `mediaproc add <plugin>` is run
3. **No Auto-Loading**: CLI starts instantly without loading any plugins
4. **Lazy Registration**: Plugin commands registered only when needed

### Why No Auto-Loading?

1. **Fast Startup** - CLI loads in <100ms
2. **User Control** - Users decide what to load
3. **Clean State** - No unnecessary memory usage
4. **Explicit** - Clear what's installed vs. what's loaded

## User Experience

### First-Time User Journey

```bash
# Step 1: Install CLI (no plugins included)
npm install -g @mediaproc/cli

# Step 2: Browse available plugins
mediaproc plugins
# 📦 Available MediaProc Plugins
# 🎯 Core Media Plugins:
# image        Not installed
# video        Not installed
# audio        Not installed

# Step 3: Install the plugins you need
mediaproc add image
# ✓ Successfully installed @mediaproc/image
# ✓ Plugin configured and ready to use
# ✓ Registered 49 commands

# Step 4: Use installed plugins
mediaproc image resize photo.jpg -w 1920
mediaproc image convert photo.jpg -f webp

# Step 5: Check what's installed
mediaproc list
# 📦 Installed Plugins (1 total, 1 loaded)
# ✨ Official Plugins:
# ✓ image (@mediaproc/image) ★ OFFICIAL
#   Version: 1.0.0

# Step 6: Add more plugins as needed
mediaproc add video
mediaproc add audio

# Step 7: All plugins work together
mediaproc list
# 📦 Installed Plugins (3 total, 3 loaded)
# ✨ Official Plugins:
# ✓ image (@mediaproc/image) ★ OFFICIAL
# ✓ video (@mediaproc/video) ★ OFFICIAL
# ✓ audio (@mediaproc/audio) ★ OFFICIAL
```

## Value Proposition

### Universal CLI Benefits

✅ **Zero Bloat**
- Install only what you need
- Fast CLI startup (<100ms)
- Minimal disk space usage

✅ **Unified Experience**
- Consistent command syntax across all plugins
- Shared configuration and settings
- Integrated documentation

✅ **Easy Extension**
- Add plugins with one command: `mediaproc add <plugin>`
- Centralized management with `mediaproc list`
- No version conflicts

✅ **Professional Workflow**
- Pipeline workflows across plugins
- Batch processing capabilities
- CI/CD automation ready

### Why Users Choose Universal CLI

Instead of:
```bash
# Traditional: Install multiple tools
npm install -g sharp-cli
npm install -g ffmpeg-cli
npm install -g sox-cli

# Learn different syntaxes
sharp resize input.jpg 1920 1080
ffmpeg -i input.mp4 -vcodec h264 output.mp4
sox input.wav output.mp3
```

Users get:
```bash
# Modern: One CLI, on-demand plugins, consistent syntax
npm install -g @mediaproc/cli

# Install what you need
mediaproc add image
mediaproc add video
mediaproc add audio

# Consistent commands across all media types
mediaproc image resize input.jpg -w 1920 -h 1080
mediaproc video transcode input.mp4 --codec h264
mediaproc audio convert input.wav --format mp3
```

## Future Expansion

### Official Plugin Roadmap

```javascript
// Q1 2026: Core Media Processing
Available: [
  '@mediaproc/image',     // ✅ Released v1.0.0
  '@mediaproc/video',     // 🚧 In Development
  '@mediaproc/audio',     // 🚧 In Development
];

// Q2 2026: Document & Animation
Available: [
  '@mediaproc/document',  // PDF, DOCX, OCR
  '@mediaproc/animation', // GIF, APNG, WebP, Lottie
];

// Q3 2026: Advanced Features
Available: [
  '@mediaproc/3d',        // 3D models, GLTF, textures
  '@mediaproc/stream',    // HLS/DASH streaming
  '@mediaproc/metadata',  // EXIF, cleanup
];

// Q4 2026: AI & Automation
Available: [
  '@mediaproc/ai',        // AI enhancements
  '@mediaproc/pipeline',  // Workflow automation
];
```

### Add-on Plugin Ecosystem

```bash
# Official advanced plugins
mediaproc add animation  # GIF, WebP, Lottie
mediaproc add 3d         # 3D model processing
mediaproc add stream     # HLS/DASH streaming
mediaproc add ai         # AI enhancements

# Community plugins
mediaproc add @company/custom-plugin
mediaproc add mediaproc-plugin-social-media
```

## Technical Benefits

### For Plugin Developers

✅ **No Circular Dependencies**
- Plugins don't depend on CLI
- CLI depends on plugins
- Clean dependency tree

✅ **Standalone Distribution**
- Each plugin can be published independently
- Works with or without universal CLI
- Easy to test and develop

✅ **Flexible Integration**
- Standard interface (`register` function)
- Commander.js based
- Type-safe with TypeScript

### For CLI Maintainers

✅ **Lightweight Distribution**
- Core CLI is minimal (<5MB)
- No forced plugin installations
- User controls what gets installed

✅ **Plugin Management**
- Discover installed plugins from package.json
- Track loaded vs. installed state
- Clear plugin lifecycle (install → load → use → unload → remove)

✅ **Flexible Updates**
- Official plugins update independently
- Users choose when to update plugins
- No breaking changes in core CLI

## Summary

The MediaProc on-demand plugin architecture provides:

1. **⚡ Fast Startup** - CLI loads instantly, no plugin overhead
2. **🎯 User Control** - Install only what you need
3. **✨ Official Quality** - 10 professionally-maintained plugins
4. **🌍 Open Ecosystem** - Support for community and third-party plugins
5. **📦 Easy Management** - Simple add/remove/list commands
6. **🔄 Clean Updates** - Independent plugin versioning

**No plugins are pre-installed. You get a lightweight CLI and install the capabilities you need!**
