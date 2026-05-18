#!/usr/bin/env node

/**
 * Documentation Build Script
 * 
 * This script copies documentation from the docs/ directory to public/docs/
 * for in-app viewing while maintaining a single source of truth.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const DOCS_SOURCE = path.join(__dirname, '..', 'docs');
const DOCS_TARGET = path.join(__dirname, '..', 'public', 'docs');

console.log('📚 Building documentation for in-app viewing...');

// Ensure target directory exists
if (!fs.existsSync(DOCS_TARGET)) {
  fs.mkdirSync(DOCS_TARGET, { recursive: true });
}

// Function to copy directory recursively
function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`⚠️  Source directory does not exist: ${src}`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied: ${path.relative(DOCS_SOURCE, srcPath)}`);
    }
  }
}

// Copy all documentation
try {
  copyDirectory(DOCS_SOURCE, DOCS_TARGET);
  console.log('✅ Documentation build completed successfully!');
  console.log(`📁 Documentation copied to: ${DOCS_TARGET}`);
} catch (error) {
  console.error('❌ Error building documentation:', error);
  process.exit(1);
}

