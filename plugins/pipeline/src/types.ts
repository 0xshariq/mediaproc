export interface PipelineConfig {
  version: string;
  steps: PipelineStep[];
}
export interface PipelineStep {
  plugin: string;
  command: string;
  options?: Record<string, any>;
}
