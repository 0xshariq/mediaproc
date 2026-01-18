// Shared types for the explain engine

export type ExplainFlagSource = 'user' | 'system' | 'default' | 'deprecated' | 'ignored';
export interface ExplainDecision {
  key: string;
  value: any;
  reason: string;
  provenance?: ExplainFlagSource;
  omitted?: boolean;
}


export interface ExplainContext {
  // Command and plugin info
  command: string;
  plugin?: string;
  commandGroup?: string;
  cliVersion?: string;
  pluginVersion?: string;

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
