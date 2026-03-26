# @mediaproc/pipeline

Declarative YAML workflow runner for MediaProc, built on top of the Orbyt engine.

This plugin provides:

- pipeline execution for one or multiple workflow files
- schema and MediaProc-specific validation
- execution plan explanation (including optional dependency graph)
- multiple output formats for CLI and automation usage

## What This Plugin Does

The pipeline plugin wraps Orbyt workflow execution and adds MediaProc-specific behavior:

- creates an engine with `MediaProcAdapter` pre-registered
- validates workflow actions in `mediaproc.<plugin>.<command>` format
- validates input paths for MediaProc steps
- supports execution modes for multi-workflow runs:
 	- `sequential`
 	- `parallel`
 	- `mixed`

## Commands

The plugin exposes three commands:

- `run <file>`
- `validate <file>`
- `explain <file>`

`<file>` supports a single YAML path or comma-separated paths for `run`.

### run

Execute one or more pipelines.

```bash
mediaproc-pipeline run ./workflows/image.yaml
mediaproc-pipeline run ./a.yaml,./b.yaml --mode parallel --max-concurrency 4
```

Options:

- `--dry-run` validate and preview without executing steps
- `-v, --var <key=value...>` set workflow input variables (repeatable)
- `--continue-on-error` continue when individual steps fail
- `--mode <mode>` `sequential|parallel|mixed`
- `--max-concurrency <n>` limit parallel workflows
- `--mixed-batch-size <n>` workflows per wave in mixed mode
- `-f, --format <format>` `human|json|verbose|null`
- `--verbose` detailed per-step output
- `--silent` minimal output
- `--no-color` disable ANSI colors

### validate

Validate pipeline syntax and MediaProc constraints without execution.

```bash
mediaproc-pipeline validate ./workflows/image.yaml
```

Options:

- `-f, --format <format>` `human|json|verbose|null`
- `--verbose` show per-step validation summary
- `--silent` minimal output
- `--no-color` disable ANSI colors

### explain

Show execution plan and dependency interpretation without running steps.

```bash
mediaproc-pipeline explain ./workflows/image.yaml
mediaproc-pipeline explain ./workflows/image.yaml --graph
```

Options:

- `-f, --format <format>` `human|json|verbose`
- `--graph` print ASCII dependency graph
- `--verbose` detailed plan/config output
- `--silent` minimal output
- `--no-color` disable ANSI colors

## Example Workflow

```yaml
name: image-pipeline
version: "1.0"

inputs:
 inputDir:
  type: string
  default: ./input

steps:
 - id: optimize
  action: mediaproc.image.optimize
  input:
   input: ${inputs.inputDir}

 - id: convert
  action: mediaproc.image.convert
  needs: [optimize]
  input:
   input: ${inputs.inputDir}
```

Run with variables:

```bash
mediaproc-pipeline run ./workflows/image.yaml --var inputDir=./assets
```

## Output Formats

- `human`: default readable CLI output
- `verbose`: detailed workflow and step event stream
- `json`: machine-friendly structured output
- `null`: suppresses formatted output (useful for scripts)

## Plugin Registration (Embedded Mode)

When used as a plugin inside a parent CLI, `register(program)` attaches:

- `pipeline run`
- `pipeline validate`
- `pipeline explain`

Standalone mode (`mediaproc-pipeline`) exposes the same command set without the `pipeline` prefix.

## Architecture Notes

- Engine creation: `createOrbytEngine()` registers `MediaProcAdapter`.
- Validation path:
 	- Orbyt workflow/schema validation
 	- MediaProc workflow validator (action format + input path checks)
- Event bridging:
 	- Orbyt workflow/step events are mapped into CLI formatter events.

## Troubleshooting

- `Workflow file not found`: verify relative/absolute path passed to command.
- `Action parse` errors: ensure action uses `mediaproc.<plugin>.<command>`.
- Input path validation failures: ensure input exists and is readable.
- Circular dependency on `explain`: fix `needs` relationships between steps.
