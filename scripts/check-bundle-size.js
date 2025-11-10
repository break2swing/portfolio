#!/usr/bin/env node

/**
 * Script pour vérifier les budgets de performance du bundle
 * Vérifie que les assets et entrypoints respectent les limites définies
 */

const fs = require('fs');
const path = require('path');

const MAX_ASSET_SIZE = 250 * 1024; // 250KB
const MAX_ENTRYPOINT_SIZE = 400 * 1024; // 400KB

const BUILD_DIR = path.join(process.cwd(), 'out');
const NEXT_DIR = path.join(BUILD_DIR, '_next');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function analyzeBundle() {
  console.log('🔍 Analyzing bundle sizes...\n');
  
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  if (!fs.existsSync(NEXT_DIR)) {
    console.error('❌ Next.js build directory not found.');
    process.exit(1);
  }
  
  const allFiles = getAllFiles(NEXT_DIR);
  const jsFiles = allFiles.filter(file => file.endsWith('.js'));
  const cssFiles = allFiles.filter(file => file.endsWith('.css'));
  
  let hasErrors = false;
  const violations = [];
  
  // Analyser les fichiers JS
  console.log('📦 JavaScript files:');
  jsFiles.forEach(file => {
    const size = getFileSize(file);
    const relativePath = path.relative(BUILD_DIR, file);
    
    if (size > MAX_ASSET_SIZE) {
      hasErrors = true;
      violations.push({
        file: relativePath,
        size,
        limit: MAX_ASSET_SIZE,
        type: 'asset',
      });
      console.log(`  ❌ ${relativePath}: ${formatBytes(size)} (exceeds ${formatBytes(MAX_ASSET_SIZE)})`);
    } else {
      console.log(`  ✅ ${relativePath}: ${formatBytes(size)}`);
    }
  });
  
  // Analyser les fichiers CSS
  console.log('\n🎨 CSS files:');
  cssFiles.forEach(file => {
    const size = getFileSize(file);
    const relativePath = path.relative(BUILD_DIR, file);
    
    if (size > MAX_ASSET_SIZE) {
      hasErrors = true;
      violations.push({
        file: relativePath,
        size,
        limit: MAX_ASSET_SIZE,
        type: 'asset',
      });
      console.log(`  ❌ ${relativePath}: ${formatBytes(size)} (exceeds ${formatBytes(MAX_ASSET_SIZE)})`);
    } else {
      console.log(`  ✅ ${relativePath}: ${formatBytes(size)}`);
    }
  });
  
  // Calculer la taille totale des entrypoints (approximation)
  // Les entrypoints sont généralement les fichiers principaux dans _next/static/chunks
  const chunksDir = path.join(NEXT_DIR, 'static', 'chunks');
  if (fs.existsSync(chunksDir)) {
    const chunkFiles = getAllFiles(chunksDir).filter(file => file.endsWith('.js'));
    const mainChunks = chunkFiles.filter(file => {
      const name = path.basename(file);
      // Les chunks principaux commencent généralement par des chiffres ou "main"
      return /^(main|framework|webpack|pages\/_app|pages\/_document)/.test(name) || /^\d+/.test(name);
    });
    
    const totalEntrypointSize = mainChunks.reduce((sum, file) => sum + getFileSize(file), 0);
    
    console.log('\n📊 Entrypoint size (main chunks):');
    if (totalEntrypointSize > MAX_ENTRYPOINT_SIZE) {
      hasErrors = true;
      violations.push({
        file: 'main entrypoints (combined)',
        size: totalEntrypointSize,
        limit: MAX_ENTRYPOINT_SIZE,
        type: 'entrypoint',
      });
      console.log(`  ❌ Total: ${formatBytes(totalEntrypointSize)} (exceeds ${formatBytes(MAX_ENTRYPOINT_SIZE)})`);
    } else {
      console.log(`  ✅ Total: ${formatBytes(totalEntrypointSize)}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (hasErrors) {
    console.log('\n❌ Budget violations detected:');
    violations.forEach(violation => {
      console.log(`  - ${violation.file}: ${formatBytes(violation.size)} > ${formatBytes(violation.limit)}`);
    });
    console.log('\n💡 Consider:');
    console.log('  - Code splitting additional components');
    console.log('  - Lazy loading heavy dependencies');
    console.log('  - Tree-shaking unused code');
    console.log('  - Using dynamic imports for large libraries');
    process.exit(1);
  } else {
    console.log('\n✅ All bundle sizes are within budget!');
    process.exit(0);
  }
}

analyzeBundle();

