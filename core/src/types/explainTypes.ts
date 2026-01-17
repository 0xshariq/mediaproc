// Shared types for the explain engine

export type ExplainFlagSource = 'user' | 'system';

export interface ExplainDecision {
  key: string;
  value: any;
  reason: string;
}

export interface ExplainContext {
  command: string;
  inputs: {
    [key: string]: any;
  };
  usedFlags: {
    [flag: string]: { value: any; source: ExplainFlagSource };
  };
  inferred?: {
    [key: string]: any;
  };
  decisions: ExplainDecision[];
  outcome: {
    result: string;
    sideEffects?: string[];
  };
}
