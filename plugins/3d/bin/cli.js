#!/usr/bin/env node
import('../dist/cli.js').catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
