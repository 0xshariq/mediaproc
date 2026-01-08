import chalk from 'chalk';

export interface HelpOption {
  flag: string;
  description: string;
}

export interface HelpExample {
  command: string;
  description: string;
}

export interface StandardHelpConfig {
  commandName: string;
  emoji: string;
  description: string;
  usage: string[];
  options: HelpOption[];
  examples: HelpExample[];
}

export function createStandardHelp(config: StandardHelpConfig): void {
  console.log();
  console.log(chalk.bold(`${config.emoji}  mediaproc audio ${config.commandName}`));
  console.log();
  console.log(chalk.dim(config.description));
  console.log();
  
  console.log(chalk.bold('Usage:'));
  config.usage.forEach(usage => {
    console.log(chalk.cyan(`  mediaproc audio ${usage}`));
  });
  console.log();
  
  console.log(chalk.bold('Options:'));
  const maxFlagLength = Math.max(...config.options.map(opt => opt.flag.length));
  config.options.forEach(opt => {
    const padding = ' '.repeat(maxFlagLength - opt.flag.length + 2);
    console.log(chalk.cyan(`  ${opt.flag}`) + padding + chalk.dim(opt.description));
  });
  console.log();
  
  console.log(chalk.bold('Examples:'));
  config.examples.forEach(ex => {
    console.log(chalk.dim(`  # ${ex.description}`));
    console.log(chalk.green(`  ${ex.command}`));
    console.log();
  });
  
  process.exit(0);
}
