# MediaProc CLI: The `--explain` Flag

## Overview

The `--explain` flag provides a detailed, user-friendly, and technically robust explanation of what the MediaProc CLI will do before executing any command. It is designed for transparency, education, and debugging, and is extensible for plugin authors.

## Key Principles (2026+)

- **Dynamic, Data-Driven Engine:** Explanations are generated using a layered, primitive-based engine with centralized phrases and context enrichment.
- **Plugin Extensibility:** Plugins can override or extend phrases and inject custom sections using the `getPhrase` function and the plugin phrase registry.
- **Output Safety:** No function source, NaN, null, or undefined values are ever shown in output.
- **Type Safety:** All phrase lookups and context fields are type-checked for reliability and maintainability.
- **Accessibility:** Output is screen-reader friendly and supports accessible color modes.

## Best Practices for Plugin Authors

- **Always use `getPhrase` for all phrase lookups.**
  - Do **not** use `COMMON_PHRASES` directly. This ensures extensibility, plugin override support, and future compatibility.
- **Register plugin phrases** using the plugin phrase registry for overrides or new phrases.
- **Inject custom sections** via the `customSections` field in the explain context.
- **Avoid hardcoding output.** Use phrase functions for all dynamic or context-aware text.
- **Test your plugin's explain output** for all modes (human, details, json) and edge cases.

## Further Improvements (Planned & Ongoing)

1. **Verbosity Levels:** Support for multiple verbosity levels (basic, detailed, technical) via CLI flags or config.
2. **Accessibility:** Ensure all output is screen-reader friendly and supports high-contrast/accessible color modes.
3. **Diagram Rendering:** Implement real diagram rendering (ASCII, SVG, or image) for supported commands.
4. **Plugin Phrase Registry:** Document and enforce plugin phrase override/extension patterns.
5. **Localization:** Add support for multiple languages/locales using getPhrase and phrase registries.
6. **Custom Sections:** Allow plugins to inject custom sections into explanations in a type-safe way.
7. **Explain Context Enrichment:** Add more context fields (e.g., environment, user config, plugin metadata).
8. **Output Safety:** Continue to enforce no function source, NaN, null, or undefined in output.
9. **Testing:** Expand test coverage for plugin overrides, phrase argument edge cases, and output safety.
10. **Docs & Examples:** Provide clear documentation and code samples for plugin authors on extending the explain system.

## Features

- **Auto-detects command context:** Shows command, plugin, CLI/plugin version, input/output paths, and all used flags.
- **Decision provenance:** Explains why each flag/value was chosen, including user, default, omitted, deprecated, and ignored flags.
- **Outcome summary:** Describes the result and side effects of the command.
- **Error and warning reporting:** Lists any detected errors or warnings before execution.
- **Technical details:** Shows library/tool info, performance notes, supported file formats, estimated time, and memory usage.
- **Environment info:** Displays current working directory, OS, Node version, and shell.
- **Execution flow:** Outlines the step-by-step process the CLI will follow.
- **Plugin extensibility:** Supports custom sections for plugin authors to add extra explanation.
- **Multiple output modes:**
  - `human`: Friendly, styled summary for end users.
  - `details`: Technical, verbose output for advanced users and developers.
  - `json`: Raw context for machine use or further processing.

## Example Output

```
EXPLANATION
Plugin: image | CLI Version: 1.2.3 | Plugin Version: 0.9.0

What will happen:
• Set width to 800 (user choice)
• Set format to png (default)
• quality: 90 (default)

Result:
• A new file will be created at output/sample.png
• Input validation is performed to ensure correct file types and dimensions.
• Output paths are resolved and checked for conflicts.
• Image processing is performed using the selected options and flags.
• Results and logs are displayed after processing each file.

Why:
• width was set because you specified it
• format: default
• quality: default

Technical details:
• library: sharp
• tool: mediaproc
• performance: optimized for batch image processing
• fileFormats: jpg, png, webp
• compressionRatio: varies by format and quality
• estimatedTime: depends on input size and options
• memoryUsage: depends on batch size and image dimensions

Environment: cwd=/home/user/project, OS=Linux 5.15.0 (linux), Node=v18.16.0, Shell=/bin/bash
```

## Flag Syntax

You can use the `--explain` flag in two ways:

- `--explain=details` (recommended for scripts and automation)
- `--explain details` (user-friendly, works if your shell and CLI parser support it)
- You can also use `--explain=human` or `--explain human` for the default summary, and `--explain=json` for machine-readable output.

Both forms are supported by MediaProc CLI. The flag value can be provided either as `--explain=value` or as a separate argument after `--explain`.

**Examples:**

```
mediaproc image --input input.jpg --output output.png --width 800 --explain=details
mediaproc image --input input.jpg --output output.png --width 800 --explain details
mediaproc image --input input.jpg --output output.png --width 800 --explain=json
```

For best compatibility in scripts, use the `--explain=value` form.

## Extensibility for Plugin Authors

Plugins can add custom sections to the explanation output using the `customSections` field in the context. This allows for domain-specific or advanced technical notes.

## Usage

Add `--explain` to any MediaProc CLI command:

```
mediaproc image --input input.jpg --output output.png --width 800 --explain
```

## Output Modes and Styling

- **human (default):**
  - Provides a friendly, styled summary for end users.
  - Output is visually separated with a colored boundary box to avoid mixing with command output logs.
  - All undefined or invalid values (like NaN) are shown as `N/A`.

- **details:**
  - Shows a technical, verbose explanation for advanced users and developers.
  - Includes a styled boundary box, full workflow, all flags used, and their default values.
  - Flags with undefined or NaN values are shown as `N/A`.
  - Workflow steps and technical details are clearly listed for transparency.

- **json:**
  - Outputs the raw context as JSON for machine use or further processing.

**Example (details mode):**
```
╔════════════════════════════════════════════════════════════════╗
║                  EXPLANATION (DETAILS)                       ║
╚════════════════════════════════════════════════════════════════╝
Plugin: image | CLI Version: 1.2.3 | Plugin Version: 0.9.0

What will happen:
• Set width to 800 (user choice)
• Set format to png (default)
• quality: N/A (default)

Result:
• A new file will be created at output/sample.png
• Input validation is performed to ensure correct file types and dimensions.
• Output paths are resolved and checked for conflicts.
• Image processing is performed using the selected options and flags.
• Results and logs are displayed after processing each file.

Why:
• width was set because you specified it
• format: default
• quality: default

Flags used:
• width: 800 (user)
• format: png (default)
• quality: N/A (default)

Technical details:
• library: sharp
• tool: mediaproc
• performance: optimized for batch image processing
• fileFormats: jpg, png, webp
• compressionRatio: varies by format and quality
• estimatedTime: depends on input size and options
• memoryUsage: depends on batch size and image dimensions

Execution flow:
• Input validation, output path resolution, image processing, result summary
• All steps are performed in sequence for each input file

Environment: cwd=/home/user/project, OS=Linux 5.15.0 (linux), Node=v18.16.0, Shell=/bin/bash
```

## References

- See [core/src/explainFlag.ts](../core/src/explainFlag.ts) and [core/src/formatters/explainFormatter.ts](../core/src/formatters/explainFormatter.ts) for implementation.
