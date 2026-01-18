# @mediaproc/core

> Core utilities for MediaProc CLI and Plugins

[![Version](https://img.shields.io/npm/v/@mediaproc/core.svg)](https://www.npmjs.com/package/@mediaproc/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

This package contains shared utilities used across MediaProc CLI and all plugins, ensuring consistency and reducing code duplication.

## 📦 Installation (Don't need to install directly, this package will install automatically with cli and plugins)

```bash
# For plugin developers
npm install @mediaproc/core

# or
pnpm add @mediaproc/core

# or
yarn add @mediaproc/core
```

## 🎯 What's Included

### 1. Branding Utilities

Consistent CLI/plugin footers with version information and links.

```typescript
import { showBranding, showPluginBranding } from "@mediaproc/core";

// Show CLI branding
showBranding();
// Output:
// ────────────────────────────────────────────────────────────
//   💙 Powered by MediaProc CLI v0.6.0
//   📚 Documentation: https://docs-mediaproc.vercel.app/
//   ⭐ Star us: https://github.com/0xshariq/mediaproc-cli
// ────────────────────────────────────────────────────────────

// Show plugin branding (automatically detects version)
showPluginBranding("Image", "path/to/package.json");
// Output:
// ────────────────────────────────────────────────────────────
//   💎 Image Plugin v1.3.3 · Powered by MediaProc
//   📚 Documentation: https://docs-mediaproc.vercel.app/
//   ⭐ Star us: https://github.com/0xshariq/mediaproc-cli
// ────────────────────────────────────────────────────────────
```

### 2. Help Formatter

Standardized, beautiful help displays for commands.

```typescript
import { displayCommandHelp } from "@mediaproc/core";

displayCommandHelp({
  commandName: "resize",
  description:
    "Resize images to specified dimensions while maintaining aspect ratio",
  usage: [
    "resize <input> [options]",
    "resize <input> -w 1920 -h 1080",
    "resize folder/*.jpg -w 800",
  ],
  options: [
    { flag: "-w, --width <number>", description: "Target width in pixels" },
    { flag: "-h, --height <number>", description: "Target height in pixels" },
    {
      flag: "-f, --fit <mode>",
      description: "Fit mode: cover, contain, fill, inside, outside",
    },
  ],
  examples: [
    {
      command: "resize photo.jpg -w 1920",
      description: "Resize to 1920px wide, auto height",
    },
    {
      command: "resize img.png -w 800 -h 600 --fit cover",
      description: "Resize and crop to exact size",
    },
  ],
  notes: [
    "Maintains aspect ratio by default",
    "Supports all major image formats (JPEG, PNG, WebP, AVIF, TIFF)",
    "Use --fit option to control resize behavior",
  ],
  tips: [
    "Use -w only to maintain aspect ratio",
    "Combine with --quality for web optimization",
  ],
});
```

### 3. Path Validator

Robust file and directory path validation and resolution.

```typescript
import {
  validateAndResolvePath,
  validateInputPath,
  validateOutputPath,
  ensureOutputDirectory,
  isDirectory,
  isSupportedImageFormat,
} from "@mediaproc/core";

// Validate and resolve input path
const inputPath = validateAndResolvePath("./images/photo.jpg", "input");
// Returns: '/absolute/path/to/images/photo.jpg'
// Throws error if file doesn't exist

// Validate output path (creates directories if needed)
const outputPath = validateOutputPath("./output/resized.jpg");

// Check if path is a directory
if (isDirectory("./images")) {
  console.log("It's a directory!");
}

// Validate image format
if (isSupportedImageFormat("photo.jpg")) {
  console.log("Supported format!");
}
```

### 4. Explain Formatter

Detailed operation explanations when `--explain` flag is used.

```typescript
import { explainOperation } from "@mediaproc/core";

// Show detailed explanation of what will happen
if (options.explain) {
  explainOperation({
    operation: "resize",
    parameters: {
      width: 1920,
      height: 1080,
      fit: "cover",
    },
    inputFiles: ["photo1.jpg", "photo2.jpg"],
    outputPath: "./output",
    details: [
      "Images will be resized to exactly 1920x1080 pixels",
      "Aspect ratio will be maintained by cropping (fit: cover)",
      "Original files will not be modified",
      "Output files will be saved to ./output directory",
    ],
  });
  return; // Exit before actual processing
}
```

### 5. Supported Extensions

Registry of supported file extensions for various media types.

```typescript
import {
  SUPPORTED_IMAGE_FORMATS,
  SUPPORTED_VIDEO_FORMATS,
  SUPPORTED_AUDIO_FORMATS,
  isSupportedImageFormat,
  isSupportedVideoFormat,
} from "@mediaproc/core";

console.log(SUPPORTED_IMAGE_FORMATS);
// ['jpg', 'jpeg', 'png', 'webp', 'avif', 'tiff', 'gif', 'svg']

console.log(SUPPORTED_VIDEO_FORMATS);
// ['mp4', 'webm', 'avi', 'mkv', 'mov']

console.log(SUPPORTED_AUDIO_FORMATS);
// ['mp3', 'aac', 'wav', 'flac', 'ogg', 'opus']
```

## 📚 API Reference

### Branding

#### `showBranding(): void`

Displays CLI branding footer with version, documentation, and GitHub links.

#### `showPluginBranding(pluginName: string, pluginPath?: string): void`

Displays plugin-specific branding with plugin version and MediaProc attribution.

- `pluginName` - Display name of the plugin (e.g., 'Image', 'Video', 'Audio')
- `pluginPath` - Optional custom path to plugin's package.json (auto-detected if omitted)

### Help Formatter

#### `displayCommandHelp(config: CommandHelpConfig): void`

Displays formatted help information for a command.

**CommandHelpConfig:**

```typescript
interface CommandHelpConfig {
  commandName: string; // Command name
  description: string; // Short description
  usage: string | string[]; // Usage examples
  options: HelpOption[]; // Command options
  examples: HelpExample[]; // Usage examples
  sections?: HelpSection[]; // Additional custom sections
  notes?: string[]; // Important notes
  tips?: string[]; // Pro tips
  warnings?: string[]; // Warnings
  seeAlso?: string[]; // Related commands
}
```

### Path Validator

#### `validateAndResolvePath(path: string, type: 'input' | 'output'): string`

Validates and resolves a file path to absolute path.

- Throws error if input file doesn't exist
- Creates parent directories for output paths
- Returns absolute path

#### `validateInputPath(path: string): string`

Validates that input path exists and is accessible.

#### `validateOutputPath(path: string): string`

Validates output path and creates parent directories if needed.

#### `ensureOutputDirectory(dirPath: string): void`

Creates directory and all parent directories if they don't exist.

#### `isDirectory(path: string): boolean`

Checks if path is a directory.

#### `isSupportedImageFormat(filePath: string): boolean`

Checks if file has supported image extension.

### Explain Formatter

#### `explainOperation(config: ExplainConfig): void`

Displays detailed explanation of what an operation will do.

**ExplainConfig:**

```typescript
interface ExplainConfig {
  operation: string; // Operation name
  parameters: Record<string, any>; // Operation parameters
  inputFiles: string[]; // Input files
  outputPath?: string; // Output path
  details: string[]; // Detailed explanation steps
}
```

### Supported Extensions

#### Constants

- `SUPPORTED_IMAGE_FORMATS: string[]` - Array of supported image extensions
- `SUPPORTED_VIDEO_FORMATS: string[]` - Array of supported video extensions
- `SUPPORTED_AUDIO_FORMATS: string[]` - Array of supported audio extensions

#### Functions

- `isSupportedImageFormat(filePath: string): boolean`
- `isSupportedVideoFormat(filePath: string): boolean`
- `isSupportedAudioFormat(filePath: string): boolean`

## 🔧 Usage in Plugins

### Example: Image Plugin Command

```typescript
import { Command } from "commander";
import {
  showPluginBranding,
  displayCommandHelp,
  validateAndResolvePath,
  explainOperation,
} from "@mediaproc/core";

export function resizeCommand(imageCmd: Command): void {
  imageCmd
    .command("resize")
    .description("Resize images to specified dimensions")
    .argument("<input>", "Input image file")
    .option("-w, --width <number>", "Target width")
    .option("-h, --height <number>", "Target height")
    .option("--explain", "Show what will happen without processing")
    .action(async (input: string, options) => {
      // Show help if requested
      if (options.help) {
        displayCommandHelp({
          commandName: "resize",
          description: "Resize images to specified dimensions",
          usage: ["resize <input> -w <width> -h <height>"],
          options: [
            { flag: "-w, --width <number>", description: "Target width" },
            { flag: "-h, --height <number>", description: "Target height" },
          ],
          examples: [
            {
              command: "resize photo.jpg -w 1920",
              description: "Resize to 1920px wide",
            },
          ],
        });
        return;
      }

      // Validate input path
      const inputPath = validateAndResolvePath(input, "input");

      // Show explanation if requested
      if (options.explain) {
        explainOperation({
          operation: "resize",
          parameters: { width: options.width, height: options.height },
          inputFiles: [inputPath],
          details: [
            `Image will be resized to ${options.width}x${options.height}`,
            "Aspect ratio will be maintained",
            "Output will be saved with same format",
          ],
        });
        return;
      }

      // Actual processing logic here
      console.log("✓ Image resized successfully");

      // Show branding footer
      showPluginBranding("Image");
    });
}
```

## 🏗️ Architecture

The core package is designed to be:

- **Lightweight** - Only essential utilities, no heavy dependencies
- **Type-safe** - Full TypeScript support with exported types
- **Tree-shakeable** - ES modules with granular exports
- **Zero-config** - Works out of the box with sensible defaults
- **Extensible** - Easy to add new utilities as needed

## 📦 Package Structure

```
@mediaproc/core/
├── dist/                   # Compiled JavaScript + TypeScript definitions
│   ├── index.js           # Main entry point
│   ├── index.d.ts         # Type definitions
│   ├── branding.js
│   ├── branding.d.ts
│   ├── helpFormatter.js
│   ├── helpFormatter.d.ts
│   ├── pathValidator.js
│   ├── pathValidator.d.ts
│   ├── explainFormatter.js
│   ├── explainFormatter.d.ts
│   ├── supportedExtensions.js
│   └── supportedExtensions.d.ts
├── src/                   # TypeScript source files
│   ├── index.ts
│   ├── branding.ts
│   ├── helpFormatter.ts
│   ├── pathValidator.ts
│   ├── explainFormatter.ts
│   └── supportedExtensions.ts
├── package.json
├── tsconfig.json
└── README.md
```

## 🔗 Related Packages

- [@mediaproc/cli](https://www.npmjs.com/package/@mediaproc/cli) - Main CLI tool
- [@mediaproc/image](https://www.npmjs.com/package/@mediaproc/image) - Image processing plugin
- [@mediaproc/video](https://www.npmjs.com/package/@mediaproc/video) - Video processing plugin
- [@mediaproc/audio](https://www.npmjs.com/package/@mediaproc/audio) - Audio processing plugin

## 📝 License

MIT © [0xshariq](https://github.com/0xshariq)

## 🔗 Links

- **Documentation:** [https://docs-mediaproc.vercel.app](https://docs-mediaproc.vercel.app)
- **GitHub:** [https://github.com/0xshariq/mediaproc-cli](https://github.com/0xshariq/mediaproc-cli)
- **Issues:** [https://github.com/0xshariq/mediaproc-cli/issues](https://github.com/0xshariq/mediaproc-cli/issues)

---

<div align="center">

**Built with ❤️ for the MediaProc ecosystem**

</div>
