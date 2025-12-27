# Configuration Guide

## Overview

MediaProc uses a hierarchical configuration system that supports global, project-level, and command-specific settings.

## Configuration File

### Location

MediaProc looks for configuration in this order:

1. `./mediaproc.config.json` (project root)
2. `~/.config/mediaproc/config.json` (user config)
3. `/etc/mediaproc/config.json` (system config)

### Creating Configuration

Initialize a config file in your project:

```bash
mediaproc init
```

This creates `mediaproc.config.json`:

```json
{
  "version": "1.0",
  "defaultQuality": 80,
  "concurrency": 4,
  "outputDir": "./output",
  "plugins": {
    "image": {
      "defaultFormat": "webp",
      "compressionLevel": 9
    },
    "video": {
      "codec": "h264",
      "preset": "medium"
    }
  },
  "pipeline": {
    "continueOnError": false,
    "logLevel": "info"
  }
}
```

## Configuration Options

### Global Settings

```json
{
  "version": "1.0",
  "defaultQuality": 80,
  "concurrency": 4,
  "outputDir": "./output",
  "tempDir": "/tmp/mediaproc",
  "logLevel": "info",
  "colorOutput": true
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `version` | string | "1.0" | Config file version |
| `defaultQuality` | number | 80 | Default quality (1-100) |
| `concurrency` | number | 4 | Parallel operations |
| `outputDir` | string | "./output" | Output directory |
| `tempDir` | string | OS temp | Temporary files |
| `logLevel` | string | "info" | Logging level |
| `colorOutput` | boolean | true | Colored terminal output |

### Plugin-Specific Settings

#### Image Plugin

```json
{
  "plugins": {
    "image": {
      "defaultFormat": "webp",
      "compressionLevel": 9,
      "quality": 80,
      "stripMetadata": false,
      "preserveAspectRatio": true,
      "resizeMode": "contain"
    }
  }
}
```

#### Video Plugin

```json
{
  "plugins": {
    "video": {
      "codec": "h264",
      "preset": "medium",
      "crf": 23,
      "audioCodec": "aac",
      "audioBitrate": "128k",
      "fps": 30
    }
  }
}
```

#### Audio Plugin

```json
{
  "plugins": {
    "audio": {
      "format": "mp3",
      "bitrate": "192k",
      "sampleRate": 44100,
      "channels": 2,
      "normalize": true
    }
  }
}
```

## Managing Configuration

### View Configuration

```bash
# Show all settings
mediaproc config show

# Show specific setting
mediaproc config show plugins.image.defaultFormat
```

### Set Configuration

```bash
# Set a value
mediaproc config set defaultQuality 90

# Set nested value
mediaproc config set plugins.video.codec h265
```

### Reset Configuration

```bash
# Reset to defaults
mediaproc init --reset
```

## Environment Variables

Override configuration with environment variables:

```bash
# Override quality
MEDIAPROC_QUALITY=90 mediaproc image resize photo.jpg

# Override output directory
MEDIAPROC_OUTPUT_DIR=/tmp mediaproc video compress video.mp4

# Override log level
MEDIAPROC_LOG_LEVEL=debug mediaproc audio convert track.wav
```

Environment variable format: `MEDIAPROC_<SETTING_NAME>`

## Command-Line Overrides

Command options take highest priority:

```bash
# Config says quality: 80
# This command uses quality: 95
mediaproc image convert input.jpg --quality 95
```

## Pipeline Configuration

Define complex workflows in YAML or JSON:

```yaml
# workflow.yaml
name: "Optimize Images"
description: "Batch image optimization"

steps:
  - plugin: image
    command: resize
    options:
      width: 1920
      height: 1080
      fit: contain
  
  - plugin: image
    command: convert
    options:
      format: webp
      quality: 85
  
  - plugin: image
    command: optimize
    options:
      level: 9
```

Run pipeline:

```bash
mediaproc run workflow.yaml --input images/
```

## Configuration Schema

Validate your config file:

```bash
mediaproc config validate
```

## Best Practices

1. **Version Control**: Commit `mediaproc.config.json` to git
2. **Environment-Specific**: Use `.env` files for different environments
3. **Secrets**: Never commit API keys or credentials
4. **Documentation**: Comment complex configurations
5. **Validation**: Validate config before deployment
6. **Defaults**: Set sensible defaults for your team
7. **Override Sparingly**: Use command options for one-off changes

## Examples

### Web Development Project

```json
{
  "outputDir": "./public/assets",
  "plugins": {
    "image": {
      "defaultFormat": "webp",
      "quality": 85,
      "stripMetadata": true
    },
    "video": {
      "codec": "h264",
      "preset": "fast"
    }
  }
}
```

### Video Production

```json
{
  "concurrency": 8,
  "outputDir": "./rendered",
  "plugins": {
    "video": {
      "codec": "prores",
      "preset": "hq",
      "audioCodec": "pcm_s24le"
    }
  }
}
```

### CI/CD Pipeline

```json
{
  "logLevel": "error",
  "colorOutput": false,
  "concurrency": 2,
  "plugins": {
    "image": {
      "quality": 90,
      "stripMetadata": true
    }
  },
  "pipeline": {
    "continueOnError": false
  }
}
```
