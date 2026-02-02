# Changelog

All notable changes to MediaProc will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## Package Versions

MediaProc is organized as a monorepo with the following packages:

- **@mediaproc/core** - Core utilities shared across CLI and plugins
- **@mediaproc/cli** - Main CLI application (previously versioned as root package)
- **@mediaproc/image** - Image processing plugin
- **@mediaproc/video** - Video processing plugin
- **@mediaproc/audio** - Audio processing plugin
- **@mediaproc/document** - Document processing plugin
- **@mediaproc/animation** - Animation processing plugin
- **@mediaproc/3d** - 3D model processing plugin
- **@mediaproc/stream** - Stream processing plugin
- **@mediaproc/ai** - AI-powered processing plugin
- **@mediaproc/metadata** - Metadata extraction plugin
- **@mediaproc/pipeline** - Pipeline processing plugin

---

## [@mediaproc/cli@1.0.0] - 2026-02-02

### 🎉 First Stable Release

First stable release of MediaProc — a modular, cross-platform media processing CLI.

### Highlights

- **Plugin-based architecture** - Modular design with standalone and CLI-integrated plugin support
- **47 image commands** - Comprehensive image processing capabilities with Sharp
- **Stable audio & video plugins** - 8 video and 6 audio commands powered by FFmpeg
- **Advanced --explain flag** - Command transparency with human, detailed, and JSON output modes
- **Improved validation** - Better error handling and path validation across all commands
- **Cleaner core structure** - Refactored codebase with improved type safety and maintainability

### Core Features

#### Plugin System

- ✅ Dynamic plugin loading and registration
- ✅ Standalone plugin execution support
- ✅ Plugin version management
- ✅ Consistent command interface across all plugins

#### Image Plugin (47 commands)

- ✅ Basic operations: resize, crop, rotate, flip, convert
- ✅ Filters: blur, sharpen, grayscale, sepia, tint, negate
- ✅ Advanced: affine, boolean, convolve, threshold
- ✅ Morphology: erode, dilate, flatten, unflatten
- ✅ Effects: vignette, watermark, mirror, gamma
- ✅ Optimization: compress, optimize, thumbnail
- ✅ Metadata: view, export, remove

#### Video Plugin (8 commands)

- ✅ compress, transcode, trim, resize
- ✅ merge, extract, metadata, info

#### Audio Plugin (6 commands)

- ✅ convert, normalize, trim
- ✅ merge, extract, metadata

### Developer Experience

- **Help System** - Plugin-agnostic help formatter with emoji-rich output
- **Type Safety** - Full TypeScript support with strict null checks
- **ES Modules** - Modern JavaScript module system
- **Testing** - Vitest-based test suite (expanding)

### Breaking Changes

- Version flag changed from `-v` to `-V` to avoid conflicts with verbose flags
- Input arguments are now optional to support `--help` flag properly
- Improved error messages for missing required arguments

### Known Issues

- Some commands may show inconsistent help formatting (being addressed)
- TypeScript build may show test-related warnings (non-blocking)

### What's Next

v1.0 focuses on **stability and foundation**. Future releases will add:

- Document processing plugin
- Workflow automation features
- Plugin marketplace
- Advanced AI-powered features

Core CLI commands will remain free forever. Automation and large-scale workflows may be introduced as paid features to support long-term development.

---

## [@mediaproc/core@1.9.0] - 2026-01-27

### Added

- New audit and debug explain templates (placeholders, "coming soon").
- Support for new explain modes in CLI output.
- Improved, DRY, and type-safe human and details explain templates.

### Changed

- Refactored explain output system for maintainability and clarity.
- Centralized file detection logic and removed duplicate code in phrases and templates.
- Modernized CLI output styling and improved phrasing for user-friendliness.

### Fixed

- Removed all references to non-existent properties in explain templates.
- Ensured all explain output is robust, actionable, and error-free.

---

## [@mediaproc/core@1.7.0] - 2026-01-25

### Added

- Major improvements to the Explain Flag output system:
  - Centralized phrasing and output logic for all explain templates.
  - Dual-layer effects and merged execution steps for clearer, more accurate explanations.
  - Unified flag display, command context, and batch insight in both human and details templates.
  - Expanded "What Will Not Happen" section with robust handling of all entry types.
  - Improved summary line and output consistency.
  - Systematic implementation of all missing features from EXPLAIN_FLAG_IMPLEMENTATION.md.
  - Comprehensive automated Vitest test coverage for all explain output features and edge cases.

### Changed

- Refactored explain templates for maintainability, safety, and user-friendliness.
- Updated types and context to support new explain features (batch, executionSteps, etc.).
- Improved error handling and output safety for all explain-related commands.

### Fixed

- Fixed runtime errors in explain output templates (e.g., whatWillNotHappen section).
- Ensured all automated tests pass and output is robust to edge cases.

---

## [@mediaproc/core@1.4.0], [@mediaproc/cli@0.8.0] - 2026-01-18

### Added

- **Explain Flag System Improvements:**
  - Human and Details templates now guarantee no function source, NaN, null, or undefined is ever displayed—these are always shown as [function] or N/A for safety.
  - Output is more robust, readable, and safe for all CLI and plugin commands.
  - All output is sanitized and context-enriched (timestamp, user, platform, mode).
  - Improved test coverage for output safety and formatting.

### Changed

- **Template Rendering:**
  - Human template now matches test and user expectations for output (plain or boxed as required, always safe values).
  - Details template uses the same value-safety logic as human template.

### Fixed

- **Output Safety:**
  - No function source, NaN, null, or undefined is ever shown in any explain output.
  - All output is consistent and safe for end users and developers.

---

### Added

**🚀 Explain Flag System Overhaul**

- **Context Enrichment:**
  - The ExplainContext now includes timestamp, user, platform, and mode (ExplainMode enum) for every explain output.
  - Output is more transparent and traceable for both users and developers.

- **ExplainMode Enum:**
  - Replaces previous format string with a robust enum (Human, Details, Json) for output mode.
  - All logic, templates, and types updated for extensibility and clarity.

- **Custom Sections & Extensibility:**
  - ExplainContext supports customSections for plugin authors and advanced use cases.
  - Designed for future extensibility without breaking changes.

- **Improved Templates:**
  - Human and Details templates now show enriched context (timestamp, user, platform, mode).
  - Details template groups flags by source (user, default, system) and provides a technical workflow.

- **Unit Tests:**
  - Added comprehensive Vitest test coverage for explainFlag logic and templates.
  - Tests verify context enrichment, mode handling, and template rendering.

### Changed

- **Refactored explainFlag logic** to use ExplainMode and populate all new context fields.
- **Updated all explain-related types and templates** for consistency and developer experience.
- **Project structure:** All explain logic, templates, and types are now cleanly exported and tested.

### Fixed

- **Test runner integration:**
  - Added Vitest scripts and fixed test files for ESM/TypeScript compatibility.
  - Removed legacy test runner issues and ensured all tests pass in workspace setup.
- **Node_modules sharing:**
  - Documented and enforced pnpm workspace best practices for single node_modules usage across all packages and plugins.

### Notes

- This release is fully backward compatible for all CLI and plugin consumers.
- All previous logs and changelog entries are preserved below.

## [@mediaproc/core@1.0.0] - 2026-01-16

### Added

**🎉 First Release - Core Utilities Package**

Created `@mediaproc/core` package to centralize common utilities used across CLI and all plugins:

#### Core Utilities

- ✨ **Branding System** - Dynamic version display and branding
  - `showBranding()` - Display CLI version, docs URL, and GitHub link
  - `showPluginBranding(pluginName)` - Display plugin-specific branding
  - `getCliVersion()` - Dynamically read version from package.json
  - Automatic version detection using `import.meta.url`
  - No hardcoded versions - always reads from package.json

- ✨ **Help Formatter** - Consistent help text formatting
  - `displayHelp(config)` - Display formatted help for commands
  - Supports command examples, options, and descriptions
  - Color-coded output with proper alignment
  - Consistent help text across all plugins

- ✨ **Path Validator** - File and directory path validation
  - `validateAndResolvePaths(inputs, options)` - Validate input paths
  - `resolveOutputPath(input, output, format)` - Resolve output paths
  - Support for files, directories, and glob patterns
  - Error handling with descriptive messages

- ✨ **Explain Formatter** - Detailed command explanations
  - `showExplanation(config)` - Display detailed command info
  - Formatted output for `--explain` flag
  - Technical details about command operations
  - Performance considerations and tips

- ✨ **Supported Extensions** - File extension definitions
  - Image formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`, `.tiff`, `.bmp`, `.svg`
  - Video formats: `.mp4`, `.avi`, `.mov`, `.mkv`, `.webm`, `.flv`, `.wmv`, `.m4v`
  - Audio formats: `.mp3`, `.wav`, `.aac`, `.flac`, `.ogg`, `.m4a`, `.wma`, `.opus`
  - Centralized format support across all plugins

#### Package Configuration

- 📦 **Modern Package Setup**
  - ES Modules with proper exports map
  - TypeScript definitions included
  - Individual utility exports for tree-shaking
  - Optimized build output in `dist/` folder

- 📚 **Complete Documentation**
  - Comprehensive README with usage examples
  - API documentation for all utilities
  - Integration guide for plugins
  - Migration guide from old structure

#### Monorepo Architecture

- 🏗️ **Proper Package Structure**
  - Moved common code from CLI and plugins to core
  - Updated all plugins to use `@mediaproc/core` dependency
  - Removed duplicate utility files from plugins
  - Centralized version management

- 🔧 **Build System**
  - Separate tsconfig for core package
  - Independent build process
  - TypeScript strict mode enabled
  - Proper rootDir configuration

### Changed

- 🔄 **Plugin Dependencies** - Updated all official plugins
  - Image plugin now depends on `@mediaproc/core@^1.0.0`
  - Video plugin now depends on `@mediaproc/core@^1.0.0`
  - Audio plugin now depends on `@mediaproc/core@^1.0.0`
  - All plugins use centralized utilities

- 🔄 **Import Paths** - Standardized imports across codebase
  - Old: `import { showBranding } from '../utils/branding'`
  - New: `import { showBranding } from '@mediaproc/core'`
  - Cleaner imports with package namespacing

### Removed

- 🗑️ **Duplicate Files** - Cleaned up redundant utility files
  - Removed `utils/branding.ts` from CLI and all plugins
  - Removed `utils/helpFormatter.ts` from plugins
  - Removed `utils/pathValidator.ts` from plugins
  - Removed `utils/explainFormatter.ts` from plugins
  - Single source of truth in `@mediaproc/core`

### Technical Details

**Package Information:**

- Package: `@mediaproc/core`
- Version: `1.0.0`
- License: MIT
- Node.js: >= 18.0.0
- TypeScript: ^5.3.3
- Published: npm registry

**Why Version 1.0.0?**

- Stable API for core utilities
- Breaking change from previous architecture
- Foundation for MediaProc v1.0 release
- Production-ready code quality
- Comprehensive test coverage (planned)

---

## [@mediaproc/cli@0.7.0] - 2026-01-14

> **Note:** Previous versions (0.1.0 - 0.6.0) were released as the root package before the monorepo structure. Starting from 0.7.0, the CLI is a separate `@mediaproc/cli` package.

### Added

### Added

#### Documentation

- ✨ **Universal Commands Documentation** - Comprehensive guide for all CLI commands
  - Created `/docs/universal-commands.md` with 13+ universal commands
  - Updated web docs `/web/content/cli/universal-commands.mdx` with interactive components
  - Organized commands into 4 categories:
    - Plugin Management (add, remove, list, validate, update, detect)
    - Workflow & Automation (batch, template, workspace, watch)
    - Analysis & Statistics (history, stats, compare, benchmark)
    - Utilities (doctor, search, help)
  - Added best practices, examples, and workflow guides
  - Included exit codes reference and advanced usage tips

#### CLI Features

- ✨ **CLI Branding System** - Dynamic version display across all commands
  - Created `/src/utils/branding.ts` with dynamic version detection
  - Reads version from `package.json` automatically using `import.meta.url`
  - Added `showBranding()` footer to CLI commands:
    - doctor, search, history (all actions), batch, stats, compare, template, workspace, watch, benchmark
  - Displays MediaProc version, docs URL, and GitHub link
  - Styled with separators for clean output

- ✨ **Plugin Branding System** - Consistent branding for plugin commands
  - Created branding utilities in image, video, and audio plugins
  - Added `showPluginBranding()` to plugin commands:
    - Image: resize, convert, crop
    - Video: compress, trim
    - Audio: convert, normalize
  - Shows plugin name + version with "Powered by MediaProc" footer

#### Web Documentation

- ✨ **Enhanced Search Functionality** - Fixed and improved search component
  - Shows all pages on open (Ctrl+K / Cmd+K)
  - Real-time filtering as you type
  - Fuzzy search with relevance scoring
  - Keyboard navigation support (arrows, Enter, Escape)
  - Proper Next.js Link integration for navigation
  - Fixed onClick handler structure for proper routing

- ✨ **Improved "On This Page" Navigation** - Compact and clean TOC
  - Reduced line height matching LangChain style
  - Tighter spacing (`space-y-0.5`, `py-1`, `py-0.5`)
  - Added `leading-tight` for compact text
  - Better visual hierarchy for H2 and H3 headings

### Improved

#### Documentation Structure

- 📚 **Root README Enhancements**
  - Organized documentation section into logical categories
  - Added references to all `/docs` folder markdown files:
    - Getting Started section
    - Plugin Development section (5 guides)
    - Architecture & Design section (2 docs)
    - Project Guidelines section (3 docs)
  - Updated documentation website URL to `https://docs-mediaproc.vercel.app`

- 📚 **Web Documentation**
  - Refactored root README from 1530 lines to ~320 lines (79% reduction)
  - Transformed web README to Next.js development guide
  - Added interactive grid cards for quick reference in universal commands
  - Color-coded sections with borders and callouts
  - Linked "See Also" cards for better navigation

### Fixed

- 🐛 **TypeScript Compilation Errors**
  - Fixed async return type in `benchmark.ts` (Promise<void>)
  - Removed unused imports across multiple command files
  - Fixed variable access before declaration in Search component
  - Resolved cascading render warning in useEffect

- 🐛 **Search Component Issues**
  - Fixed search not initializing when modal opens
  - Fixed onClick handler on Link component preventing navigation
  - Moved onClick to div wrapper for proper routing
  - Added setTimeout to avoid cascading renders in useEffect

### Changed

- 🔄 **Version Management** - All version references now dynamic
  - CLI version pulled from root `package.json` (0.7.0)
  - Plugin versions pulled from respective `package.json` files
  - No more hardcoded version strings to update manually

## [0.5.2]

### Added

- ✨ `mediaproc delete` command - Delete/uninstall plugins with confirmation
  - Delete plugin: `mediaproc delete <plugin>`
  - Auto-detects plugin types (official, community, third-party)
  - Auto-detects installation scope (global/local)
  - Confirmation prompt before deletion (skip with `--yes`)
  - Shows plugin type badges (★ OFFICIAL, ◆ COMMUNITY, ◇ THIRD-PARTY)
  - Supports all package managers (npm, pnpm, yarn, bun)
  - Alias: `mediaproc uninstall <plugin>`
  - Verbose mode: `--verbose` flag for detailed output
- ✨ `mediaproc update` command - Update plugins to latest or specific versions
  - Update all plugins: `mediaproc update`
  - Update specific plugin: `mediaproc update <plugin>`
  - Update to specific version: `mediaproc update <plugin> --version 1.2.3`
  - Auto-detects plugin types (official, community, third-party)
  - Auto-detects installation scope (global/local)
  - Shows version changes with plugin type badges (★ OFFICIAL, ◆ COMMUNITY, ◇ THIRD-PARTY)
  - Supports all package managers (npm, pnpm, yarn, bun, deno)
  - Verbose mode: `--verbose` flag for detailed output

### Improved

- 🔄 Path handling in image plugin
  - Supports single file: `image.jpg`
  - Supports multiple files: `img1.jpg,img2.jpg`
  - Supports directories: `input-images/`
  - Explicit output file paths: `-o output.jpg`
  - Output directories: `-o output/`
- 📚 Updated documentation with update command examples

### Architecture

- ✅ Designed plugin-based architecture
- ✅ Implemented plugin discovery and loading system
- ✅ Created plugin registry with short name mapping
- ✅ Built core CLI framework with Commander.js

### Plugins (Scaffolded)

- ✅ Image plugin structure (10 commands)
- ✅ Video plugin structure (6 commands)
- ✅ Audio plugin structure (5 commands)
- ✅ Document plugin structure (5 commands)
- ✅ Animation plugin structure (2 commands)
- ✅ 3D plugin structure (4 commands)
- ✅ Metadata plugin structure (4 commands)
- ✅ Stream plugin structure (3 commands)
- ✅ AI plugin structure (4 commands)
- ✅ Pipeline plugin structure (2 commands)

### Core Commands

- ✅ `add` - Install plugins with auto-detection
- ✅ `remove` - Uninstall plugins
- ✅ `delete` - Delete/uninstall plugins with confirmation
- ✅ `update` - Update plugins to latest or specific versions
- ✅ `list` - List installed plugins
- ✅ `plugins` - Show plugin catalog
- ✅ `run` - Execute pipelines
- ✅ `validate` - Validate media files

### Documentation

- ✅ Plugin system architecture guide
- ✅ Upcoming features roadmap
- ✅ Contributing guidelines
- ✅ Security policy
- ✅ Code of conduct
- ✅ Third-party plugin standards

### Infrastructure

- ✅ TypeScript with strict mode
- ✅ pnpm workspace monorepo
- ✅ Modular project structure
- ✅ Plugin independence (standalone or integrated)

## [0.1.0] - 2025-12-27

### Added

- Initial project structure
- Core CLI framework
- Plugin system architecture
- 10 plugin packages (scaffolded)
- Comprehensive documentation
- Community guidelines

### Status

🚧 **Planning & Development Phase**

- Architecture complete
- Implementation in progress
- Expected beta: Q2 2026

---

## Release Types

- **Major (X.0.0)**: Breaking changes, major features
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, minor improvements

## Categories

- **Added**: New features
- **Changed**: Changes to existing features
- **Deprecated**: Features marked for removal
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
