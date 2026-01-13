# Universal Commands

Universal commands work across the entire MediaProc CLI, regardless of which plugins you have installed. These commands provide essential utilities for plugin management, workflow automation, system diagnostics, and productivity features.

## Command Overview

### Plugin Management

- **add** - Install one or more plugins
- **remove** - Remove installed plugins
- **list** - List installed or available plugins
- **validate** - Validate plugin installations
- **update** - Update plugins to latest versions
- **detect** - Auto-detect and recommend plugins for your files

### Workflow & Automation

- **batch** - Manage batch processing queue
- **template** - Save and reuse command templates
- **workspace** - Manage project workspaces with presets
- **watch** - Monitor directories and auto-process files

### Analysis & Statistics

- **history** - View and replay command history
- **stats** - Show usage statistics and analytics
- **compare** - Compare files before/after processing
- **benchmark** - Run performance benchmarks

### Utilities

- **doctor** - Run system diagnostics
- **search** - Search for commands across plugins
- **help** - Display help information

---

## Plugin Management Commands

### add

Install MediaProc plugins from the official registry.

#### Usage

```bash
mediaproc add <plugin-names...>
```

#### Options

- `--verbose` - Show detailed installation logs

#### Examples

```bash
# Install single plugin
mediaproc add image

# Install multiple plugins
mediaproc add image video audio

# Install with verbose output
mediaproc add video --verbose
```

---

### remove

Remove installed plugins from your system.

#### Usage

```bash
mediaproc remove <plugin-names...>
```

#### Examples

```bash
# Remove single plugin
mediaproc remove image

# Remove multiple plugins
mediaproc remove image video audio
```

---

### list

List installed plugins or view commands available in a plugin.

#### Usage

```bash
mediaproc list [plugin-name]
```

#### Examples

```bash
# List all installed plugins
mediaproc list

# List commands in specific plugin
mediaproc list image

# List with detailed info
mediaproc list --verbose
```

---

### validate

Validate plugin installations and check for missing dependencies.

#### Usage

```bash
mediaproc validate [plugin-name]
```

#### Options

- `--fix` - Attempt to fix issues automatically

#### Examples

```bash
# Validate all plugins
mediaproc validate

# Validate specific plugin
mediaproc validate image

# Auto-fix issues
mediaproc validate --fix
```

---

### update

Update plugins to their latest versions.

#### Usage

```bash
mediaproc update [plugin-name]
```

#### Examples

```bash
# Update all plugins
mediaproc update

# Update specific plugin
mediaproc update image
```

---

### detect

Auto-detect file types and recommend appropriate plugins.

#### Usage

```bash
mediaproc detect <directory>
```

#### Examples

```bash
# Analyze current directory
mediaproc detect .

# Analyze specific folder
mediaproc detect ./my-media-files
```

---

## Workflow & Automation Commands

### batch

Manage a queue of batch processing jobs with priority support.

#### Usage

```bash
# Add job to queue
mediaproc batch add <command> [files...] [options]

# List queued jobs
mediaproc batch list

# Start processing queue
mediaproc batch start

# Pause/resume queue
mediaproc batch pause
mediaproc batch resume

# Remove job from queue
mediaproc batch remove <job-id>

# Clear all jobs
mediaproc batch clear
```

#### Options

- `-p, --priority <number>` - Job priority (higher = first, default: 5)
- `--args <args>` - Additional command arguments
- `-w, --workers <number>` - Number of parallel workers (default: 4)

#### Examples

```bash
# Add resize job to queue
mediaproc batch add "image resize" *.jpg --args "-w 800" -p 10

# Add convert job
mediaproc batch add "image convert" photos/ --args "-f webp -q 90"

# Start processing with 8 workers
mediaproc batch start -w 8

# List all jobs
mediaproc batch list

# Remove specific job
mediaproc batch remove job-123
```

---

### template

Save frequently used commands as reusable templates with parameters.

#### Usage

```bash
# Save template
mediaproc template save <name> <command> [options]

# List templates
mediaproc template list

# Run template
mediaproc template run <name> [params...]

# Delete template
mediaproc template delete <name>
```

#### Options

- `-d, --description <text>` - Template description

#### Template Parameters

Use `{param}` syntax in commands to create parameterized templates.

#### Examples

```bash
# Save template with parameters
mediaproc template save web-resize "image resize {input} -w {width} -o {output}" \
  -d "Resize for web"

# List all templates
mediaproc template list

# Run template (will prompt for params)
mediaproc template run web-resize

# Run with inline params
mediaproc template run web-resize photo.jpg 1920 resized.jpg

# Delete template
mediaproc template delete web-resize
```

---

### workspace

Create project-specific workspaces with processing presets and rules.

#### Usage

```bash
# Create workspace
mediaproc workspace create <name> [options]

# List workspaces
mediaproc workspace list

# Load workspace
mediaproc workspace load <name>

# Add rule to workspace
mediaproc workspace rule add <pattern> <command>

# Delete workspace
mediaproc workspace delete <name>
```

#### Options

- `-d, --description <text>` - Workspace description
- `--preset <type>` - Use preset (web, mobile, print, social)

#### Presets

- **web** - Optimized for web delivery (WebP, compression)
- **mobile** - Mobile-friendly sizes and formats
- **print** - High-quality for print production
- **social** - Social media dimensions and formats

#### Examples

```bash
# Create workspace with web preset
mediaproc workspace create my-website --preset web \
  -d "Website image processing"

# Add auto-processing rules
mediaproc workspace rule add "*.jpg" "image optimize -q 85"
mediaproc workspace rule add "*.png" "image convert -f webp"

# Load and use workspace
mediaproc workspace load my-website

# List all workspaces
mediaproc workspace list

# Delete workspace
mediaproc workspace delete my-website
```

---

### watch

Monitor directories for new files and automatically process them.

#### Usage

```bash
mediaproc watch <directory> [options]
```

#### Options

- `--on-image <cmd>` - Command to run on new images
- `--on-video <cmd>` - Command to run on new videos
- `--on-audio <cmd>` - Command to run on new audio files
- `--on-any <cmd>` - Command to run on any new file
- `--ignore <patterns>` - Comma-separated patterns to ignore
- `--recursive` - Watch subdirectories recursively
- `--debounce <ms>` - Debounce delay in milliseconds (default: 1000)

#### Examples

```bash
# Watch for images and auto-optimize
mediaproc watch ./uploads --on-image "image optimize -q 85"

# Watch with multiple rules
mediaproc watch ./media \
  --on-image "image convert -f webp" \
  --on-video "video compress -p medium"

# Watch recursively with ignore patterns
mediaproc watch ./content \
  --recursive \
  --ignore "node_modules,*.tmp,*.log" \
  --on-any "echo 'New file: $FILE'"

# Custom debounce for rapid changes
mediaproc watch ./live-folder --debounce 500 --on-image "image resize -w 1920"
```

---

## Analysis & Statistics Commands

### history

View, search, and replay previously executed commands.

#### Usage

```bash
# Show recent history
mediaproc history [options]

# Replay command
mediaproc history replay <id>

# Search history
mediaproc history search <query>

# Clear history
mediaproc history --clear

# Export history
mediaproc history --export <file>
```

#### Options

- `-n, --limit <number>` - Number of entries to show (default: 20)
- `--clear` - Clear all history
- `--export <file>` - Export history as shell script
- `--json` - Output as JSON

#### Examples

```bash
# Show last 20 commands
mediaproc history

# Show last 50 commands
mediaproc history -n 50

# Search for resize commands
mediaproc history search resize

# Replay command by ID
mediaproc history replay 42

# Export history as script
mediaproc history --export my-workflow.sh

# Clear all history
mediaproc history --clear

# Get JSON output
mediaproc history --json
```

---

### stats

Display usage statistics, analytics, and insights.

#### Usage

```bash
mediaproc stats [options]
```

#### Options

- `-p, --plugin <name>` - Show stats for specific plugin
- `--period <days>` - Time period in days (default: 30)
- `--reset` - Reset all statistics
- `--json` - Output as JSON

#### Metrics Tracked

- Total files processed
- Total processing time
- Storage saved through compression
- Plugin usage frequency
- Command usage patterns
- Success/failure rates
- Performance trends

#### Examples

```bash
# Show overall stats (last 30 days)
mediaproc stats

# Show stats for specific plugin
mediaproc stats --plugin image

# Show stats for custom period
mediaproc stats --period 90

# Reset all statistics
mediaproc stats --reset

# Export stats as JSON
mediaproc stats --json
```

---

### compare

Compare two files to see differences in size, quality, and metadata.

#### Usage

```bash
mediaproc compare <file1> <file2> [options]
```

#### Options

- `--preview` - Show visual preview (images/videos)
- `--detailed` - Show detailed comparison with metadata
- `--json` - Output as JSON

#### Comparison Metrics

- File sizes and reduction percentage
- Dimensions (for images/videos)
- Format and codec information
- Quality metrics
- Metadata differences

#### Examples

```bash
# Basic comparison
mediaproc compare original.jpg optimized.jpg

# Detailed comparison with metadata
mediaproc compare before.mp4 after.mp4 --detailed

# Visual preview
mediaproc compare original.png compressed.png --preview

# JSON output for scripting
mediaproc compare img1.jpg img2.jpg --json
```

---

### benchmark

Run performance benchmarks to test system capabilities.

#### Usage

```bash
mediaproc benchmark [options]
```

#### Options

- `--system` - Benchmark system capabilities
- `--plugin <name>` - Benchmark specific plugin
- `--operation <name>` - Benchmark specific operation
- `--file <path>` - Test file to use
- `--iterations <n>` - Number of iterations (default: 5)
- `--json` - Output as JSON

#### System Benchmarks

- CPU performance
- Memory availability
- Disk I/O speed
- FFmpeg capabilities
- Sharp/libvips performance

#### Examples

```bash
# System benchmark
mediaproc benchmark --system

# Benchmark specific operation
mediaproc benchmark --plugin image --operation resize \
  --file test.jpg --iterations 10

# Compare plugin performance
mediaproc benchmark --plugin video --operation compress \
  --file sample.mp4

# JSON output
mediaproc benchmark --system --json
```

---

## Utility Commands

### doctor

Run comprehensive system diagnostics and health checks.

#### Usage

```bash
mediaproc doctor [options]
```

#### Options

- `--verbose` - Show detailed diagnostic information
- `--fix` - Attempt to fix issues automatically

#### Checks Performed

- ✓ Node.js version compatibility
- ✓ FFmpeg installation and capabilities
- ✓ Sharp/libvips installation
- ✓ Installed plugins validation
- ✓ System resources (CPU, RAM, disk)
- ✓ Dependency conflicts
- ✓ Configuration issues

#### Examples

```bash
# Run basic diagnostics
mediaproc doctor

# Detailed diagnostics
mediaproc doctor --verbose

# Auto-fix detected issues
mediaproc doctor --fix
```

---

### search

Search for commands across all installed plugins using keywords.

#### Usage

```bash
mediaproc search <query> [options]
```

#### Options

- `-p, --plugin <name>` - Search in specific plugin only
- `-l, --limit <number>` - Limit number of results (default: 10)
- `--json` - Output as JSON

#### Search Features

- Fuzzy matching for typos
- Category-based filtering
- Relevance scoring
- Plugin-specific search
- Description matching

#### Examples

```bash
# Search all plugins
mediaproc search resize

# Search in specific plugin
mediaproc search compress --plugin video

# Limit results
mediaproc search convert --limit 5

# JSON output
mediaproc search optimize --json
```

---

### help

Display comprehensive help information.

#### Usage

```bash
# General help
mediaproc help
mediaproc --help

# Command help
mediaproc help <command>
mediaproc <command> --help

# Plugin help
mediaproc <plugin> help
mediaproc <plugin> --help

# Plugin command help
mediaproc <plugin> <command> --help
```

#### Examples

```bash
# Show all commands
mediaproc help

# Show batch command help
mediaproc help batch

# Show image plugin commands
mediaproc image help

# Show specific image command
mediaproc image resize --help
```

---

## Best Practices

### 1. Start with Doctor

Before processing important files, run diagnostics:

```bash
mediaproc doctor
```

### 2. Use Templates for Repetitive Tasks

Save time by creating templates for common workflows:

```bash
mediaproc template save blog-image "image resize {input} -w 1200 -q 90 -o {output}"
```

### 3. Leverage Batch Processing

Queue multiple jobs instead of running them sequentially:

```bash
mediaproc batch add "image optimize" folder1/*.jpg
mediaproc batch add "image optimize" folder2/*.png
mediaproc batch start -w 8
```

### 4. Monitor with Watch

Automate processing for incoming files:

```bash
mediaproc watch ./uploads --on-image "image optimize -q 85"
```

### 5. Track with History and Stats

Learn from your usage patterns:

```bash
mediaproc stats --period 90
mediaproc history search convert
```

### 6. Use Workspaces for Projects

Organize project-specific configurations:

```bash
mediaproc workspace create my-project --preset web
mediaproc workspace load my-project
```

### 7. Compare Before and After

Verify quality vs size tradeoffs:

```bash
mediaproc compare original.jpg compressed.jpg --detailed
```

### 8. Search When Unsure

Find the right command quickly:

```bash
mediaproc search thumbnail
```

---

## Exit Codes

Standard exit codes used throughout MediaProc:

| Code | Meaning            |
| ---- | ------------------ |
| `0`  | Success            |
| `1`  | General error      |
| `2`  | Invalid arguments  |
| `3`  | Plugin not found   |
| `4`  | File not found     |
| `5`  | Permission denied  |
| `6`  | Dependency missing |

---

## Tips & Tricks

### Combine Commands with Shell Pipes

```bash
mediaproc history | grep resize | wc -l
```

### Use JSON for Scripting

```bash
mediaproc stats --json | jq '.totalFiles'
```

### Chain Batch Jobs

```bash
mediaproc batch add "image resize" *.jpg --args "-w 1920"
mediaproc batch add "image optimize" *.jpg --args "-q 85"
mediaproc batch start
```

### Watch Multiple Directories

```bash
mediaproc watch ./folder1 --on-image "image optimize" &
mediaproc watch ./folder2 --on-video "video compress" &
```

### Export and Share Workflows

```bash
mediaproc history --export workflow.sh
# Share workflow.sh with team
```

---

## See Also

- [CLI Overview](./cli-overview.md) - General CLI introduction
- [Plugin System](./plugin-system.md) - Understanding plugins
- [Configuration](./configuration.md) - CLI configuration options
- [Plugin Integration Guide](./plugin-integration-guide.md) - Creating plugins
