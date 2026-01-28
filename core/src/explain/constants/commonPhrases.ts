import { CommandRelatedOptions, CommonPhrases, ExplainContext } from "../../types/explainTypes.js";
import { detectInputFiles, detectOutputFiles } from '../../utils/file/fileDetection.js';

export const COMMANDS: CommandRelatedOptions = {
    type: 'Command Type:',
    category: 'Command Category:',
    purpose: 'Purpose:',
    inputs: 'Inputs:',
    outputs: 'Outputs:',
    flags: 'Flags:',
    options: 'Options:',
    performance: 'Performance:',
    security: 'Security:',
    dependencies: 'Dependencies:',
    sideEffects: 'Side Effects:',
    warnings: 'Warnings:',
    limitations: 'Limitations:',
    examples: 'Examples:',
    docs: 'Documentation:',
    author: 'Author:',
    version: 'Version:',
    lastModified: 'Last Modified:',
    relatedCommands: 'Related Commands:',
}
// Centralized reusable phrases for explain engine
export const COMMON_PHRASES: CommonPhrases = {
    // --- File detection dynamic phrases ---
    // --- Enhanced dynamic and user-centric phrases ---
    detectedInputFiles: ({ context }: { context: ExplainContext }): string => {
        const detected = detectInputFiles(context.inputs?.inputPath);
        if (detected.count === 0) return `No input files found at ${context.inputs?.inputPath || 'the specified location'}. Please check your path or provide a valid input.`;
        if (detected.count === 1) return `1 ${detected.type !== 'unknown' ? detected.type : 'file'} detected at ${context.inputs?.inputPath}. Ready for processing.`;
        return `${detected.count} ${detected.type !== 'unknown' ? detected.type + ' files' : 'files'} detected at ${context.inputs?.inputPath}. All will be processed.`;
    },
    detectedOutputFiles: ({ context }: { context: ExplainContext }): string => {
        const detected = detectOutputFiles(context.outputs?.outputPath);
        if (!detected.exists) return `No output file or directory found at ${context.outputs?.outputPath || 'the specified location'}. Output will be created.`;
        if (detected.isDir) return `Output directory ready at ${context.outputs?.outputPath} with ${detected.files.length} file${detected.files.length === 1 ? '' : 's'}. Results will be saved here.`;
        return `Output file detected at ${context.outputs?.outputPath}. Results will overwrite this file.`;
    },
    // Section headers and static text for templates
    header: '  EXPLANATION  ',
    detailsHeader: '  EXPLANATION (DETAILS)  ',
    summaryHeader: ' Summary: ',
    contextEnrichmentPrefix: ' Timestamp: ',
    commandRelatedOptions: COMMANDS,
    user: 'User:',
    platform: 'Platform:',
    mode: 'Mode:',
    pluginInfoPrefix: ' This command uses the ',
    pluginInfoSuffix: ' plugin. ',
    whatWillHappenHeader: ' What will happen: ',
    whyChoicesHeader: ' Why these choices were made: ',
    resultHeader: ' Result: ',
    schemaVersionPrefix: '[schemaVersion: ',
    exitCodePrefix: '[exitCode: ',
    confidencePrefix: '[confidence: ',
    whatWillNotHappenHeader: ' What will NOT happen: ',
    inputsOutputsHeader: ' Inputs & Outputs: ',
    effectsHeader: ' Effects & Primitives: ',
    technicalWorkflowHeader: ' Technical Workflow: ',
    flagsUsedHeader: ' Flags Used: ',
    errorsHeader: ' Errors: ',
    warningsHeader: ' Warnings: ',
    technicalDetailsHeader: ' Technical Details: ',
    environmentHeader: ' Environment: ',
    inputRead: ({ context }: { context: ExplainContext }) => `Reading input file "${context?.inputs?.inputPath ?? context?.inputs?.input ?? 'unknown'}" from disk. We'll check the format and make sure it's ready for processing.\n`,
    outputWrite: ({ context }: { context: ExplainContext }) => `Saving results to "${context?.outputs?.outputPath ?? context?.outputs?.output ?? 'unknown'}". Your changes will be written to a new file, leaving the original untouched.\n`,
    noNetwork: () => 'This operation runs fully offline—no network requests, no data leaving your device.\n',
    noOriginalModification: () => 'Your original files remain safe and unchanged. All edits are made to new outputs.\n',
    dataLocalOnly: () => 'All processing happens locally. Your data stays private and never leaves your machine.\n',
    noBackgroundTasks: () => 'No background or hidden tasks will run. Your system resources are used only for this operation.\n',
    externalTool: ({ context }: { context: ExplainContext }) => `Processing will use the external tool: ${context?.technical?.tool ?? 'unknown'}. This may provide advanced features or performance.\n`,
    dimensionsChange: ({ context }: { context: ExplainContext }) => `Resizing: Output will be set to width=${context?.usedFlags?.width?.value ?? '?'} and height=${context?.usedFlags?.height?.value ?? '?'}.\n`,
    formatConversion: ({ context }: { context: ExplainContext }) => `Converting format to ${context?.usedFlags?.format?.value ?? 'unknown'} for compatibility and best results.\n`,
    qualityChange: ({ context }: { context: ExplainContext }) => `Setting quality to ${context?.usedFlags?.quality?.value ?? '?'} for optimal output.\n`,
    metadataPreserved: () => 'Metadata will be copied to the output, so important details are not lost.\n',
    audioProcessing: ({ context }: { context: ExplainContext }) => `Audio effects applied: ${context?.usedFlags?.effects?.value ?? 'none'}.\n`,
    videoProcessing: ({ context }: { context: ExplainContext }) => `Video will use codec: ${context?.usedFlags?.codec?.value ?? 'default'}.\n`,
    documentProcessing: ({ context }: { context: ExplainContext }) => `Document format: ${context?.usedFlags?.format?.value ?? 'default'}.\n`,
    streamProcessing: ({ context }: { context: ExplainContext }) => `Streaming in real-time using protocol: ${context?.usedFlags?.protocol?.value ?? 'default'}.\n`,
    pipelineExecution: ({ context }: { context: ExplainContext }) => `Pipeline: ${Array.isArray((context as any)?.steps) ? (context as any).steps.length : 0} steps will run in sequence, combining multiple plugins for advanced workflows.\n`,
    pluginAction: ({ context }: { context: ExplainContext }) => `Plugin "${context?.plugin ?? 'unknown'}" will handle this action, using its specialized features.\n`,
    errorHandling: () => 'If something goes wrong, errors will be reported clearly and the process will try to recover safely.\n',
    validation: () => 'Inputs will be checked for correctness and safety before processing begins.\n',
    outputPreview: () => 'You’ll get a preview of the output before anything is finalized.\n',
    logging: () => 'A detailed log will be created for this run, so you can review what happened or troubleshoot issues.\n',
    cleanup: () => 'Temporary files and resources will be removed after processing to keep your system clean.\n',
    summarySuccess: 'Explanation completed. Processing will continue.\n',
    summaryFailure: 'Explanation completed. Processing will halt due to errors.\n',
    summaryPartial: 'Explanation completed. Some warnings were noted.\n',
    explainOnlySummary: 'Explanation mode enabled. No changes will be made to files.\n',
    explainOnlySummaryWithWarnings: 'Explanation mode enabled. No changes will be made to files. Warnings were noted.\n',
    explainOnlySummaryWithErrors: 'Explanation mode enabled. No changes will be made to files. Errors were noted.\n',
    warningDeprecated: (flag: string) => `Warning: The flag "${flag}" is deprecated and may be removed in future versions.\n`,
    warningIgnored: (flag: string) => `Warning: The flag "${flag}" was ignored due to incompatibility or redundancy.\n`,
    tipDetails: 'Tip: Use --explain details for a technical breakdown of the operation.\n',
    tipJson: 'Tip: Use --explain json to get a machine-readable explanation.\n',
    tipHuman: 'Tip: Use --explain human for a user-friendly summary.\n',
    tipOnly: 'Tip: Use --explain only to preview changes without modifying files.\n',
};