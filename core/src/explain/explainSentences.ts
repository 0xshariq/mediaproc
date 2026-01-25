import { COMMON_PHRASES } from '../constants/commonPhrases.js';

export const explainSentences = {
  // Section headers and static text
  header: () => COMMON_PHRASES.header,
  detailsHeader: () => COMMON_PHRASES.detailsHeader,
  summaryHeader: () => COMMON_PHRASES.summaryHeader,
  commandType: () => COMMON_PHRASES.commandType,
  commandCategory: () => COMMON_PHRASES.commandCategory,
  commandPurpose: () => COMMON_PHRASES.commandPurpose,
  commandInputs: () => COMMON_PHRASES.commandInputs,
  commandOutputs: () => COMMON_PHRASES.commandOutputs,
  commandFlags: () => COMMON_PHRASES.commandFlags,
  commandOptions: () => COMMON_PHRASES.commandOptions,
  commandPerformance: () => COMMON_PHRASES.commandPerformance,
  commandSecurity: () => COMMON_PHRASES.commandSecurity,
  commandDependencies: () => COMMON_PHRASES.commandDependencies,
  commandSideEffects: () => COMMON_PHRASES.commandSideEffects,
  commandWarnings: () => COMMON_PHRASES.commandWarnings,
  commandLimitations: () => COMMON_PHRASES.commandLimitations,
  commandExamples: () => COMMON_PHRASES.commandExamples,
  commandDocs: () => COMMON_PHRASES.commandDocs,
  commandAuthor: () => COMMON_PHRASES.commandAuthor,
  commandVersion: () => COMMON_PHRASES.commandVersion,
  commandLastModified: () => COMMON_PHRASES.commandLastModified,
  commandRelated: () => COMMON_PHRASES.commandRelated,
  explainOnly: () => COMMON_PHRASES.explainOnly,
  contextEnrichmentPrefix: () => COMMON_PHRASES.contextEnrichmentPrefix,
  user: () => COMMON_PHRASES.user,
  platform: () => COMMON_PHRASES.platform,
  mode: () => COMMON_PHRASES.mode,
  pluginInfo: (plugin: string) => `${COMMON_PHRASES.pluginInfoPrefix}"${plugin}"${COMMON_PHRASES.pluginInfoSuffix}`,
  whatWillHappenHeader: () => COMMON_PHRASES.whatWillHappenHeader,
  whyChoicesHeader: () => COMMON_PHRASES.whyChoicesHeader,
  resultHeader: () => COMMON_PHRASES.resultHeader,
  schemaVersion: (v: string) => `${COMMON_PHRASES.schemaVersionPrefix}${v}]`,
  exitCode: (code: number) => `${COMMON_PHRASES.exitCodePrefix}${code} // placeholder for future validation logic]`,
  confidence: (conf: string) => `${COMMON_PHRASES.confidencePrefix}${conf} // placeholder for future confidence logic]`,
  whatWillNotHappenHeader: () => COMMON_PHRASES.whatWillNotHappenHeader,
  inputsOutputsHeader: () => COMMON_PHRASES.inputsOutputsHeader,
  effectsHeader: () => COMMON_PHRASES.effectsHeader,
  technicalWorkflowHeader: () => COMMON_PHRASES.technicalWorkflowHeader,
  flagsUsedHeader: () => COMMON_PHRASES.flagsUsedHeader,
  errorsHeader: () => COMMON_PHRASES.errorsHeader,
  warningsHeader: () => COMMON_PHRASES.warningsHeader,
  technicalDetailsHeader: () => COMMON_PHRASES.technicalDetailsHeader,
  environmentHeader: () => COMMON_PHRASES.environmentHeader,
  diagramPlaceholder: () => COMMON_PHRASES.diagramPlaceholder,
  // Dynamic effect phrases
  inputRead: (context: any) => COMMON_PHRASES.inputRead({ context }),
  outputWrite: (context: any) => COMMON_PHRASES.outputWrite({ context }),
  noNetwork: COMMON_PHRASES.noNetwork,
  externalTool: (context: any) => COMMON_PHRASES.externalTool({ context }),
  dimensionsChange: (context: any) => COMMON_PHRASES.dimensionsChange({ context }),
  formatConversion: (context: any) => COMMON_PHRASES.formatConversion({ context }),
  qualityChange: (context: any) => COMMON_PHRASES.qualityChange({ context }),
  metadataPreserved: COMMON_PHRASES.metadataPreserved,
  audioProcessing: (context: any) => COMMON_PHRASES.audioProcessing({ context }),
  videoProcessing: (context: any) => COMMON_PHRASES.videoProcessing({ context }),
  documentProcessing: (context: any) => COMMON_PHRASES.documentProcessing({ context }),
  streamProcessing: (context: any) => COMMON_PHRASES.streamProcessing({ context }),
  pipelineExecution: (context: any) => COMMON_PHRASES.pipelineExecution({ context }),
  pluginAction: (context: any) => COMMON_PHRASES.pluginAction({ context }),
  errorHandling: COMMON_PHRASES.errorHandling,
  validation: COMMON_PHRASES.validation,
  outputPreview: COMMON_PHRASES.outputPreview,
  logging: COMMON_PHRASES.logging,
  cleanup: COMMON_PHRASES.cleanup,
  // Summary and warnings
  summarySuccess: () => COMMON_PHRASES.summarySuccess,
  summaryFailure: () => COMMON_PHRASES.summaryFailure,
  summaryPartial: () => COMMON_PHRASES.summaryPartial,
  warningDeprecated: (flag: string) => COMMON_PHRASES.warningDeprecated(flag),
  warningIgnored: (flag: string) => COMMON_PHRASES.warningIgnored(flag),
  // Tips
  tipDetails: () => COMMON_PHRASES.tipDetails,
  tipJson: () => COMMON_PHRASES.tipJson,
  tipHuman: () => COMMON_PHRASES.tipHuman,
  // Section logic using phrases
  inputContext: (inputPath: string, fileCount: number, fileType: string) =>
    `${COMMON_PHRASES.commandInputs} ${fileCount} ${fileType}${fileCount === 1 ? '' : 's'} from ${inputPath} will be processed.`,
  actions: (actions: string[]) =>
    actions.length > 0
      ? `${COMMON_PHRASES.whatWillHappenHeader}\n${actions.map(a => `• ${a}`).join("\n")}`
      : COMMON_PHRASES.commandPurpose,
  technicalDetails: (details: string[]) =>
    details.length > 0 ? `${COMMON_PHRASES.technicalDetailsHeader} ${details.join(", ")}.` : '',
  executionWorkflow: (steps: string[]) =>
    steps.length > 0
      ? `${COMMON_PHRASES.technicalWorkflowHeader}\n${steps.map((s, i) => `  ${i + 1}. ${s}`).join("\n")}`
      : COMMON_PHRASES.commandPurpose,
  flagsResolved: (flags: { name: string, value: string, source: string }[]) =>
    flags.length > 0
      ? `${COMMON_PHRASES.flagsUsedHeader}\n${flags.map(f => `• ${f.name}: ${f.value} (from ${f.source})`).join("\n")}`
      : COMMON_PHRASES.commandFlags,
  technicalContext: (engine: string, mode: string, count: number, fileType: string) =>
    `${COMMON_PHRASES.commandPerformance} Engine: ${engine}, Mode: ${mode}, Inputs: ${count} ${fileType}${count === 1 ? '' : 's'}.`,
  batchProcessing: (isBatch: boolean) =>
    isBatch
      ? `${COMMON_PHRASES.commandOptions} Batch mode: Each input will be processed independently. Errors in one will not stop others.`
      : '',
  safeguards: (safeguards: string[]) =>
    safeguards.length > 0
      ? `${COMMON_PHRASES.commandSecurity}\n${safeguards.map(s => `• ${s}`).join("\n")}`
      : '',
  summary: (count: number, fileType: string, operation: string, outputPath: string) =>
    `${COMMON_PHRASES.summaryHeader} ${count} ${fileType}${count === 1 ? '' : 's'} will be ${operation} and saved to ${outputPath}.`
};