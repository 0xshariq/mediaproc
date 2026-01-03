import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import type { Command } from 'commander';

/**
 * Detect which package manager is being used
 */
function detectPackageManager(): string {
  try {
    execSync('bun --version', { stdio: 'ignore' });
    return 'bun';
  } catch {}

  try {
    execSync('pnpm --version', { stdio: 'ignore' });
    return 'pnpm';
  } catch {}

  try {
    execSync('yarn --version', { stdio: 'ignore' });
    return 'yarn';
  } catch {}

  return 'npm';
}

/**
 * Update a plugin to the latest version
 */
export function updateCommand(program: Command): void {
  program
    .command('update <plugin>')
    .description('Update a plugin to the latest version')
    .option('-g, --global', 'Update plugin globally')
    .action(async (plugin: string, options: { global?: boolean }) => {
      const spinner = ora('Updating plugin...').start();

      try {
        // Ensure plugin name starts with @mediaproc/
        const pluginName = plugin.startsWith('@mediaproc/')
          ? plugin
          : `@mediaproc/${plugin}`;

        // Detect package manager
        const packageManager = detectPackageManager();
        const isGlobal = options.global;

        spinner.text = `Updating ${chalk.cyan(pluginName)} using ${chalk.blue(packageManager)}...`;

        // Build the update command based on package manager
        let updateCmd: string;
        
        if (packageManager === 'npm') {
          updateCmd = isGlobal
            ? `npm update -g ${pluginName}`
            : `npm update ${pluginName}`;
        } else if (packageManager === 'pnpm') {
          updateCmd = isGlobal
            ? `pnpm update -g ${pluginName}`
            : `pnpm update ${pluginName}`;
        } else if (packageManager === 'yarn') {
          updateCmd = isGlobal
            ? `yarn global upgrade ${pluginName}`
            : `yarn upgrade ${pluginName}`;
        } else if (packageManager === 'bun') {
          updateCmd = isGlobal
            ? `bun update -g ${pluginName}`
            : `bun update ${pluginName}`;
        } else {
          throw new Error('Unknown package manager');
        }

        // Execute the update command
        execSync(updateCmd, { stdio: 'inherit' });

        spinner.succeed(chalk.green(`✓ ${pluginName} updated successfully`));
        console.log(chalk.dim('\nRestart your terminal or run a command to use the updated version.'));

      } catch (error) {
        spinner.fail(chalk.red('Failed to update plugin'));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // Update all plugins command
  program
    .command('update-all')
    .description('Update all installed @mediaproc plugins to the latest version')
    .option('-g, --global', 'Update plugins globally')
    .action(async (options: { global?: boolean }) => {
      const spinner = ora('Finding installed plugins...').start();

      try {
        const packageManager = detectPackageManager();
        const isGlobal = options.global;

        spinner.text = 'Updating all @mediaproc plugins...';

        // Build the update command to update all @mediaproc packages
        let updateCmd: string;
        
        if (packageManager === 'npm') {
          updateCmd = isGlobal
            ? 'npm update -g $(npm list -g --depth=0 --parseable | xargs -n1 basename | grep "^@mediaproc")'
            : 'npm update';
        } else if (packageManager === 'pnpm') {
          updateCmd = isGlobal
            ? 'pnpm update -g "@mediaproc/*"'
            : 'pnpm update "@mediaproc/*"';
        } else if (packageManager === 'yarn') {
          updateCmd = isGlobal
            ? 'yarn global upgrade "@mediaproc/*"'
            : 'yarn upgrade "@mediaproc/*"';
        } else if (packageManager === 'bun') {
          updateCmd = isGlobal
            ? 'bun update -g "@mediaproc/*"'
            : 'bun update "@mediaproc/*"';
        } else {
          throw new Error('Unknown package manager');
        }

        // Execute the update command
        execSync(updateCmd, { stdio: 'inherit' });

        spinner.succeed(chalk.green('✓ All @mediaproc plugins updated successfully'));
        console.log(chalk.dim('\nRestart your terminal or run a command to use the updated versions.'));

      } catch (error) {
        spinner.fail(chalk.red('Failed to update plugins'));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });
}
