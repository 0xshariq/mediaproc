/**
 * Interface for command help options
 */
export interface HelpOption {
  flag: string;
  description: string;
}

/**
 * Interface for command help examples
 */
export interface HelpExample {
  command: string;
  description: string;
}

/**
 * Interface for help section
 */
export interface HelpSection {
  title: string;
  items: string[];
}

/**
 * Interface for command help configuration
 */
export interface CommandHelpConfig {
  commandName: string;
  emoji: string;
  description: string;
  usage: string[];
  options: HelpOption[];
  examples: HelpExample[];
  additionalSections?: HelpSection[];
  tips?: string[];
  notes?: string[];
}