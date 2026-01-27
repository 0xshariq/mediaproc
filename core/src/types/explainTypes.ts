import { FileType } from "../utils";

export interface ExplainEffectContext {
  effect: string;
  context: ExplainContext;
}

export interface CommonPhrases {
  // Section headers and static text
  header: string;
  detailsHeader: string;
  summaryHeader: string;
  commandType: string;
  commandCategory: string;
  commandPurpose: string;
  commandInputs: string;
  commandOutputs: string;
  commandFlags: string;
  commandOptions: string;
  commandPerformance: string;
  commandSecurity: string;
  commandDependencies: string;
  commandSideEffects: string;
  commandWarnings: string;
  commandLimitations: string;
  commandExamples: string;
  commandDocs: string;
  commandAuthor: string;
  commandVersion: string;
  commandLastModified: string;
  commandRelated: string;
  contextEnrichmentPrefix: string;
  user: string;
  platform: string;
  mode: string;
  pluginInfoPrefix: string;
  pluginInfoSuffix: string;
  whatWillHappenHeader: string;
  whyChoicesHeader: string;
  resultHeader: string;
  schemaVersionPrefix: string;
  exitCodePrefix: string;
  confidencePrefix: string;
  whatWillNotHappenHeader: string;
  inputsOutputsHeader: string;
  effectsHeader: string;
  technicalWorkflowHeader: string;
  flagsUsedHeader: string;
  errorsHeader: string;
  warningsHeader: string;
  technicalDetailsHeader: string;
  environmentHeader: string;

  // Dynamic effect phrases (functions)
  // --- Enhanced dynamic and user-centric phrases ---
  detectedInputFiles?: (args: { context: ExplainContext }) => string;
  detectedOutputFiles?: (args: { context: ExplainContext }) => string;
  inputTypeDetected?: (args: { context: ExplainContext }) => string;
  outputTypeDetected?: (args: { context: ExplainContext }) => string;
  batchModeActive?: (args: { context: ExplainContext }) => string;
  dryRunMode?: (args: { context: ExplainContext }) => string;
  pluginList?: (args: { context: ExplainContext }) => string;
  estimatedTime?: (args: { context: ExplainContext }) => string;
  userConfirmation?: () => string;
  undoAvailable?: () => string;
  previewAvailable?: () => string;
  resourceUsage?: (args: { context: ExplainContext }) => string;
  advancedOptions?: (args: { context: ExplainContext }) => string;
  safetyChecks?: (args: { context: ExplainContext }) => string;
  fallbackStrategy?: (args: { context: ExplainContext }) => string;
  interactiveMode?: (args: { context: ExplainContext }) => string;
  autoRetry?: (args: { context: ExplainContext }) => string;
  outputSummary?: (args: { context: ExplainContext }) => string;
  environmentInfo?: (args: { context: ExplainContext }) => string;
  userTip?: (args: { context: ExplainContext }) => string;
  inputRead: (args: { context: ExplainContext }) => string;
  outputWrite: (args: { context: ExplainContext }) => string;
  noNetwork: () => string;
  noOriginalModification: () => string;
  dataLocalOnly: () => string;
  noBackgroundTasks: () => string;
  externalTool: (args: { context: ExplainContext }) => string;
  dimensionsChange: (args: { context: ExplainContext }) => string;
  formatConversion: (args: { context: ExplainContext }) => string;
  qualityChange: (args: { context: ExplainContext }) => string;
  metadataPreserved: () => string;
  audioProcessing: (args: { context: ExplainContext }) => string;
  videoProcessing: (args: { context: ExplainContext }) => string;
  documentProcessing: (args: { context: ExplainContext }) => string;
  streamProcessing: (args: { context: ExplainContext }) => string;
  pipelineExecution: (args: { context: ExplainContext }) => string;
  pluginAction: (args: { context: ExplainContext }) => string;
  errorHandling: () => string;
  validation: () => string;
  outputPreview: () => string;
  logging: () => string;
  cleanup: () => string;

  // Summary and warnings
  summarySuccess: string;
  summaryFailure: string;
  summaryPartial: string;
  warningDeprecated: (flag: string) => string;
  warningIgnored: (flag: string) => string;

  // Explain-only summaries and warnings
  explainOnlySummary: string;
  explainOnlySummaryWithWarnings: string;
  explainOnlySummaryWithErrors: string;
  // Tips
  tipDetails: string;
  tipJson: string;
  tipHuman?: string;
  tipOnly?: string;
}
// Shared types for the explain engine

export type ExplainFlagSource = 'user' | 'system' | 'default' | 'deprecated' | 'ignored';

// Enum for explain output format
export enum ExplainMode {
  Human = 'human',
  Details = 'details',
  Json = 'json',
  Audit = 'audit', // coming soon
  Debug = 'debug', // coming soon
  Only = 'only'
}
export interface ExplainDecision {
  key: string;
  value: any;
  reason: string;
  provenance?: ExplainFlagSource;
  omitted?: boolean;
}


export type ExplainFlowStep = { step: string; type: 'static' | 'conditional' };

export interface ExplainContext {
  // Batch processing context (optional)
  batch?: {
    size?: number;
    mode?: string;
    summary?: string;
    [key: string]: any;
  };
  explainVersion?: string;
  schemaVersion?: string; // Tier 3 placeholder
  summary?: string; // Tier 2: summary line
  exitCode?: number; // Tier 3 placeholder
  // Command and plugin info
  command: string;
  plugin?: string;
  commandGroup?: string;
  cliVersion?: string;
  pluginVersion?: string;
  effects?: string[];
  // Context enrichment
  timestamp?: string; // ISO string
  user?: string; // Username or user id
  platform?: string; // OS/platform info
  mode?: ExplainMode; // Output mode (enum)

  // Inputs/outputs
  inputs: {
    type: FileType;
    inputPath: string;
    input?: string;
    count: number;
    files: string[] | Buffer[] | never[]
  };
  outputs?: {
    type?: string;
    outputPath: string;
    output?: string;
    exists?: boolean; 
    isDir?: boolean;
    count?: number;
    summary?: string;
    files?: string[] | Buffer[] | never[]
  };
  plugins?: string[];
  estimate?: string;
  resources?: string;
  advancedOptions?: string[];
  safetyChecks?: string;
  fallback?: string;
  interactive?: boolean;
  autoRetry?: boolean;
  tip?: string;

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
    confidenceScore?: number; // Numeric confidence score for JSON mode
    whatWillNotHappen?: string[];
  };
  explainFlow?: ExplainFlowStep[];
  executionSteps?: string[];

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

  // Optional diagram (ASCII or plugin-provided)
  diagram?: string;
  commandType?: string;
  commandCategory?: string;
  commandPurpose?: string;
  commandInputs?: string;
  commandOutputs?: string;
  commandFlags?: string;
  commandOptions?: string;
  commandPerformance?: string;
  commandSecurity?: string;
  commandDependencies?: string;
  commandSideEffects?: string;
  commandWarnings?: string;
  commandLimitations?: string;
  commandExamples?: string;
  commandDocs?: string;
  commandAuthor?: string;
  commandVersion?: string;
  commandLastModified?: string;
  commandRelated?: string;
}
