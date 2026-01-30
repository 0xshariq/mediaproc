/**
 * Enhanced branding utilities for MediaProc.
 * No version logic, just a beautiful, informative message.
 */

const SLOGAN = 'Automate, Analyze, Create. All your media, one CLI.';
const DOCS_URL = 'https://docs-mediaproc.vercel.app/';
const GITHUB_URL = 'https://github.com/0xshariq/mediaproc';
const DISCORD_URL = 'https://discord.gg/Pp7pRs7sJA';
const ABOUT = 'MediaProc is an open-source, cross-platform CLI toolkit for processing, transforming, and automating media workflows. Built for creators, developers, and teams who want powerful tools with simple commands.';

function printBrandingHeader(title: string) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  💙 ${title}`);
  console.log(`  🏷️  ${SLOGAN}`);
  console.log('═'.repeat(60));
}

function printBrandingFooter() {
  console.log(`  📚 Documentation: \x1b[36m${DOCS_URL}\x1b[0m`);
  console.log(`  ⭐ Star us: \x1b[36m${GITHUB_URL}\x1b[0m`);
  console.log(`  💬 Join our Discord: \x1b[36m${DISCORD_URL}\x1b[0m`);
  console.log('═'.repeat(60));
  console.log(`  ℹ️  ${ABOUT}`);
  console.log('═'.repeat(60) + '\n');
}

/**
 * Show CLI branding footer with enhanced message
 */
export function showBranding(): void {
  printBrandingHeader('Powered by MediaProc CLI');
  printBrandingFooter();
}

/**
 * Show plugin branding footer with enhanced message
 * @param pluginName - Name of the plugin (e.g., 'image', 'video', 'audio')
 */
export function showPluginBranding(pluginName: string): void {
  const displayName = pluginName.charAt(0).toUpperCase() + pluginName.slice(1);
  printBrandingHeader(`${displayName} Plugin · Powered by MediaProc`);
  printBrandingFooter();
}

