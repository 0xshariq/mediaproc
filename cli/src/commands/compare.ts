import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

interface FileComparison {
  file1: string;
  file2: string;
  size1: number;
  size2: number;
  sizeDiff: number;
  sizeReduction: number;
  dimensions1?: { width: number; height: number };
  dimensions2?: { width: number; height: number };
}

export const compareCommand = new Command()
  .name('compare')
  .description('Compare two files or before/after processing')
  .argument('<file1>', 'First file path')
  .argument('<file2>', 'Second file path')
  .option('--preview', 'Show visual preview (images/videos)')
  .option('--detailed', 'Show detailed comparison')
  .option('--json', 'Output as JSON')
  .action(async (file1: string, file2: string, options) => {
    if (!fs.existsSync(file1)) {
      console.log(`\n❌ File not found: ${file1}\n`);
      return;
    }

    if (!fs.existsSync(file2)) {
      console.log(`\n❌ File not found: ${file2}\n`);
      return;
    }

    const comparison = await compareFiles(file1, file2, options.detailed);

    if (options.json) {
      console.log(JSON.stringify(comparison, null, 2));
      return;
    }

    displayComparison(comparison, options.detailed);

    if (options.preview) {
      console.log('\n⚠️  Visual preview requires full implementation\n');
    }
  });

async function compareFiles(file1: string, file2: string, detailed: boolean): Promise<FileComparison> {
  const stats1 = fs.statSync(file1);
  const stats2 = fs.statSync(file2);

  const sizeDiff = stats2.size - stats1.size;
  const sizeReduction = ((1 - (stats2.size / stats1.size)) * 100);

  const comparison: FileComparison = {
    file1: path.basename(file1),
    file2: path.basename(file2),
    size1: stats1.size,
    size2: stats2.size,
    sizeDiff,
    sizeReduction
  };

  // For images, we could extract dimensions using sharp
  // This would require adding sharp as a dependency
  if (detailed && isImageFile(file1)) {
    // comparison.dimensions1 = await getImageDimensions(file1);
    // comparison.dimensions2 = await getImageDimensions(file2);
  }

  return comparison;
}

function displayComparison(comparison: FileComparison, detailed: boolean): void {
  console.log('\n📊 File Comparison\n');
  console.log('━'.repeat(60));

  console.log('\n📁 Files:');
  console.log(`   Original: ${comparison.file1}`);
  console.log(`   Processed: ${comparison.file2}`);

  console.log('\n📏 Size:');
  console.log(`   Original:  ${formatBytes(comparison.size1)}`);
  console.log(`   Processed: ${formatBytes(comparison.size2)}`);

  if (comparison.sizeDiff < 0) {
    const saved = Math.abs(comparison.sizeDiff);
    console.log(`   \x1b[32m✓ Saved:    ${formatBytes(saved)} (${comparison.sizeReduction.toFixed(1)}% reduction)\x1b[0m`);
  } else if (comparison.sizeDiff > 0) {
    console.log(`   \x1b[33m⚠ Increase: ${formatBytes(comparison.sizeDiff)} (${Math.abs(comparison.sizeReduction).toFixed(1)}% larger)\x1b[0m`);
  } else {
    console.log(`   = Same size`);
  }

  if (comparison.dimensions1 && comparison.dimensions2) {
    console.log('\n📐 Dimensions:');
    console.log(`   Original:  ${comparison.dimensions1.width}x${comparison.dimensions1.height}`);
    console.log(`   Processed: ${comparison.dimensions2.width}x${comparison.dimensions2.height}`);
  }

  if (detailed) {
    console.log('\n📋 Additional Info:');
    console.log(`   Original path:  ${comparison.file1}`);
    console.log(`   Processed path: ${comparison.file2}`);
  }

  console.log('\n' + '━'.repeat(60));

  if (comparison.sizeReduction > 0) {
    console.log('\n✅ Processing resulted in smaller file size\n');
  } else if (comparison.sizeReduction < 0) {
    console.log('\n⚠️  Processing resulted in larger file size\n');
  }
}

function isImageFile(file: string): boolean {
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.avif'];
  return imageExts.includes(path.extname(file).toLowerCase());
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}
