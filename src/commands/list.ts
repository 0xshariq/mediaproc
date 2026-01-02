import { Command } from 'commander';
import chalk from 'chalk';
import { detectPluginType } from '../plugin-registry.js';
import type { PluginManager } from '../plugin-manager.js';

export function listCommand(program: Command, pluginManager: PluginManager): void {
  program
    .command('list')
    .alias('ls')
    .description('List installed mediaproc plugins')
    .action(() => {
      const loadedPlugins = pluginManager.getLoadedPlugins();
      const installedPlugins = pluginManager.getInstalledPlugins();
      
      // Find plugins that are installed but not loaded
      const notLoaded = installedPlugins.filter(p => !loadedPlugins.includes(p));

      if (loadedPlugins.length === 0 && installedPlugins.length === 0) {
        console.log(chalk.yellow('No plugins installed yet'));
        console.log(chalk.dim('\n💡 Get started by installing a plugin:'));
        console.log(chalk.cyan('  mediaproc add image') + chalk.dim('    # Image processing'));
        console.log(chalk.cyan('  mediaproc add video') + chalk.dim('    # Video processing'));
        console.log(chalk.cyan('  mediaproc add audio') + chalk.dim('    # Audio processing'));
        console.log(chalk.dim('\nView all available plugins: ') + chalk.white('mediaproc plugins'));
        return;
      }

      console.log(chalk.bold(`\n📦 Installed Plugins (${installedPlugins.length} total, ${loadedPlugins.length} loaded)\n`));

      // Separate official, community, and third-party plugins (from loaded list)
      const official = loadedPlugins.filter(p => {
        const type = detectPluginType(p);
        return type === 'official';
      });
      const community = loadedPlugins.filter(p => {
        const type = detectPluginType(p);
        return type === 'community';
      });
      const thirdParty = loadedPlugins.filter(p => {
        const type = detectPluginType(p);
        return type === 'third-party';
      });

      // Show official plugins
      if (official.length > 0) {
        console.log(chalk.bold('\u2728 Official Plugins:\n'));
        
        official.forEach((pluginName, index) => {
          const shortName = pluginName.replace('@mediaproc/', '');
          const plugin = pluginManager.getPlugin(pluginName);
          
          console.log(`${chalk.green('✓')} ${chalk.cyan(shortName)} ${chalk.dim(`(${pluginName})`)} ${chalk.blue('★ OFFICIAL')}`);
          
          if (plugin) {
            console.log(chalk.dim(`  Version: ${plugin.version || 'unknown'}`));
          }
          
          if (index < official.length - 1) {
            console.log('');
          }
        });
      }

      // Show community plugins
      if (community.length > 0) {
        console.log(chalk.bold('\n🌐 Community Plugins:\n'));
        
        community.forEach((pluginName, index) => {
          const shortName = pluginName.replace('mediaproc-', '');
          const plugin = pluginManager.getPlugin(pluginName);
          
          console.log(`${chalk.green('✓')} ${chalk.cyan(shortName)} ${chalk.dim(`(${pluginName})`)}`);
          
          if (plugin) {
            console.log(chalk.dim(`  Version: ${plugin.version || 'unknown'}`));
          }
          
          if (index < community.length - 1) {
            console.log('');
          }
        });
      }

      // Show third-party plugins
      if (thirdParty.length > 0) {
        console.log(chalk.bold('\n📦 Third-Party Plugins:\n'));
        
        thirdParty.forEach((pluginName, index) => {
          const plugin = pluginManager.getPlugin(pluginName);
          
          console.log(`${chalk.green('✓')} ${chalk.cyan(pluginName)}`);
          
          if (plugin) {
            console.log(chalk.dim(`  Version: ${plugin.version || 'unknown'}`));
          }
          
          if (index < thirdParty.length - 1) {
            console.log('');
          }
        });
      }

      // Show plugins that are installed but not loaded
      if (notLoaded.length > 0) {
        console.log(chalk.bold('\n⚠️  Installed but Not Loaded:\n'));
        console.log(chalk.yellow('These plugins are in package.json but not loaded. Restart CLI or run "mediaproc add <plugin>" to load them.\n'));
        
        notLoaded.forEach((pluginName, index) => {
          const shortName = pluginName.replace('@mediaproc/', '').replace('mediaproc-', '');
          console.log(`${chalk.yellow('○')} ${chalk.dim(shortName)} ${chalk.dim(`(${pluginName})`)}`);
          console.log(chalk.dim(`  Load: ${chalk.white(`mediaproc add ${shortName}`)}`));
          
          if (index < notLoaded.length - 1) {
            console.log('');
          }
        });
      }

      console.log(chalk.dim('\n💡 Plugin types:'));
      console.log(chalk.dim('   ✨ Official: @mediaproc/* packages'));
      console.log(chalk.dim('   🌐 Community: mediaproc-* packages'));
      console.log(chalk.dim('   📦 Third-party: Other npm packages'));
      console.log(chalk.dim('\n📥 Install more: ') + chalk.white('mediaproc add <plugin-name>'));
      console.log(chalk.dim('   Remove: ') + chalk.white('mediaproc remove <plugin-name>'));
      console.log(chalk.dim('   Browse all: ') + chalk.white('mediaproc plugins'));
      console.log('');
    });
}
