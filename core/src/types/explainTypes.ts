// Shared types for the explain engine

export type ExplainFlagSource = 'user' | 'system' | 'default' | 'deprecated' | 'ignored';

// Enum for explain output format
export enum ExplainMode {
  Human = 'human',
  Details = 'details',
  Json = 'json',
}
export interface ExplainDecision {
  key: string;
  value: any;
  reason: string;
  provenance?: ExplainFlagSource;
  omitted?: boolean;
}


export interface ExplainContext {
  schemaVersion?: string; // Tier 3 placeholder
  summary?: string; // Tier 2: summary line
  exitCode?: number; // Tier 3 placeholder
  // If true, this is an explain-only run (no command execution)
  explainOnly?: boolean;
  // Command and plugin info
  command: string;
  plugin?: string;
  commandGroup?: string;
  cliVersion?: string;
  pluginVersion?: string;

  // Context enrichment
  timestamp?: string; // ISO string
  user?: string; // Username or user id
  platform?: string; // OS/platform info
  mode?: ExplainMode; // Output mode (enum)

  // Inputs/outputs
  inputs: {
    [key: string]: any;
  };
  outputs?: {
    [key: string]: any;
  };

  // Flags and provenance
  usedFlags: {
    [flag: string]: { value: any; source: ExplainFlagSource };
  };
  omittedFlags?: {
    [flag: string]: { defaultValue: any; source: ExplainFlagSource };
  };
  inferred?: {
    [key: string]: any;
  };
  deprecatedFlags?: string[];
  ignoredFlags?: string[];

  // Decisions and flow
  decisions: ExplainDecision[];
  outcome: {
    result: string;
    sideEffects?: string[];
    errors?: string[];
    warnings?: string[];
    confidence?: string; // Tier 4 placeholder
    whatWillNotHappen?: string[]; // Tier 4 placeholder
  };
  explainFlow?: string[];

  // Environment info
  environment?: {
    cwd?: string;
    os?: string;
    nodeVersion?: string;
    shell?: string;
  };

  // Advanced technical details
  technical?: {
    library?: string;
    tool?: string;
    performance?: string;
    fileFormats?: string[];
    compressionRatio?: string;
    estimatedTime?: string;
    memoryUsage?: string;
  };

  // Extensibility for plugin authors
  customSections?: Array<{ title: string; items: string[] }>;
}
