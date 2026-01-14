# Changelog

All notable changes to MediaProc will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2026-01-14

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
