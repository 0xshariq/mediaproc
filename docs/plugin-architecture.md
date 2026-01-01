# Plugin Architecture: Built-in vs Add-on

## Overview

MediaProc uses a hybrid plugin architecture that provides the best of both worlds: **immediate functionality** with built-in plugins and **extensibility** through add-on plugins.

## Architecture Summary

```
@mediaproc/cli (Universal CLI)
├── Built-in Plugins (ship with CLI)
│   └── @mediaproc/image ★ (19 image processing commands)
│
└── Add-on Plugins (install as needed)
    ├── @mediaproc/video (install: mediaproc add video)
    ├── @mediaproc/audio (install: mediaproc add audio)
    ├── @mediaproc/document (install: mediaproc add document)
    └── Third-party plugins (community-developed)
```

## Built-in Plugins

### What Are Built-in Plugins?

Built-in plugins are **pre-installed** with the universal CLI. When users install `@mediaproc/cli`, they automatically get these plugins without any additional installation.

### Currently Built-in:

- **@mediaproc/image** - Professional image processing with 19 commands

### Why Built-in?

1. **Immediate Value** - Users can start working right away
2. **Zero Configuration** - No setup required
3. **Compelling Reason** - Makes users choose universal CLI over standalone plugins
4. **Common Use Cases** - Image processing is universally needed

### How It Works:

```bash
# User installs CLI
npm install -g @mediaproc/cli

# Image plugin is already available!
mediaproc image resize photo.jpg -w 1920
mediaproc image convert photo.jpg -f webp
mediaproc list  # Shows @mediaproc/image ★ BUILT-IN
```

## Add-on Plugins

### What Are Add-on Plugins?

Add-on plugins are **installed on demand** from npm using the `mediaproc add` command. They extend the CLI with additional functionality.

### How to Add Plugins:

```bash
# Install video processing
mediaproc add video

# Install audio processing
mediaproc add audio

# Install document processing
mediaproc add document

# Now use them
mediaproc video transcode input.mp4 -o output.mp4
mediaproc audio convert input.wav -o output.mp3
```

### Why Add-on?

1. **Lightweight** - Users only install what they need
2. **Extensibility** - Easy to add new capabilities
3. **Community** - Third-party developers can publish plugins
4. **Separation of Concerns** - Each plugin has its own dependencies

## Package Dependencies

### Main CLI (packages.json)

```json
{
  "name": "@mediaproc/cli",
  "dependencies": {
    "@mediaproc/image": "workspace:*",  // Built-in plugin
    "chalk": "^5.3.0",
    "commander": "^11.1.0",
    "ora": "^7.0.1"
  }
}
```

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
  // Built-in plugins list
  private builtInPlugins = [
    '@mediaproc/image',
    // Add more as developed
  ];

  async loadPlugins(program: Command) {
    // 1. Load built-in plugins first
    for (const plugin of this.builtInPlugins) {
      await this.loadPlugin(plugin, program, true);
    }

    // 2. Discover user-installed plugins from package.json
    const installed = this.discoverPlugins();

    // 3. Load user-installed plugins (skip if already loaded)
    for (const plugin of installed) {
      if (!this.builtInPlugins.includes(plugin)) {
        await this.loadPlugin(plugin, program, false);
      }
    }
  }
}
```

### Discovery Process

1. **Built-in Plugins**: Loaded from `node_modules/@mediaproc/*` (already installed with CLI)
2. **User Plugins**: Discovered from local `package.json` dependencies
3. **Deduplication**: Skip plugins already loaded as built-in

## User Experience

### First-Time User Journey

```bash
# Step 1: Install CLI
npm install -g @mediaproc/cli

# Step 2: Immediate use (image plugin built-in)
mediaproc list
# 📦 Built-in Plugins (included with CLI):
# ✓ image (@mediaproc/image) ★ BUILT-IN
#   Version: 1.0.0

# Step 3: Use image processing immediately
mediaproc image resize photo.jpg -w 1920
mediaproc image convert photo.jpg -f webp
mediaproc image thumbnail photo.jpg -s 300

# Step 4: Add more plugins as needed
mediaproc add video
mediaproc add audio

# Step 5: All plugins work together
mediaproc list
# 📦 Built-in Plugins:
# ✓ image ★ BUILT-IN
#
# 🔌 User-Installed Plugins:
# ✓ video
# ✓ audio
```

## Value Proposition

### Universal CLI Benefits

✅ **Immediate Productivity**
- Get started with image processing right away
- No plugin installation needed initially
- Pre-configured and tested

✅ **Unified Experience**
- Consistent command syntax
- Shared configuration
- Integrated documentation

✅ **Easy Extension**
- Add plugins with one command
- Centralized management
- No conflicts

✅ **Professional Workflow**
- Pipeline workflows across plugins
- Batch processing
- Automation ready

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
# Modern: One CLI, consistent syntax
npm install -g @mediaproc/cli

# Works immediately + consistent commands
mediaproc image resize input.jpg -w 1920 -h 1080
mediaproc video transcode input.mp4 --codec h264
mediaproc audio convert input.wav --format mp3
```

## Future Expansion

### Planned Built-in Plugins

```javascript
// Phase 1: Essential tools (Q1 2026)
builtInPlugins = [
  '@mediaproc/image',  // ✅ Currently built-in
  '@mediaproc/video',  // Coming Q1 2026
];

// Phase 2: Professional tools (Q2 2026)
builtInPlugins = [
  '@mediaproc/image',
  '@mediaproc/video',
  '@mediaproc/audio',  // Added Q2 2026
];

// Phase 3: Complete suite (Q3 2026)
builtInPlugins = [
  '@mediaproc/image',
  '@mediaproc/video',
  '@mediaproc/audio',
  '@mediaproc/document',  // Added Q3 2026
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

✅ **Controlled Bundling**
- Choose which plugins ship built-in
- Easy to add/remove from built-in list
- Version control

✅ **Plugin Management**
- Discover both built-in and user-installed
- Prevent duplicates
- Clear ownership

✅ **Upgrade Path**
- Built-in plugins update with CLI
- User plugins update independently
- No version conflicts

## Summary

The MediaProc architecture provides:

1. **📦 Built-in Plugins** - Immediate value (image processing ready)
2. **🔌 Add-on Plugins** - Extensibility (add video, audio, etc.)
3. **🔄 Dual-Mode** - Works standalone or unified
4. **🎯 Best UX** - Compelling reason to use universal CLI
5. **⚡ Performance** - Only load what you need
6. **🌍 Ecosystem** - Community can contribute plugins

This makes MediaProc both **immediately useful** and **infinitely extensible**!
