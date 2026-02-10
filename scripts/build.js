#!/usr/bin/env node

/**
 * ATM Build Script
 * Minifies code and packages to dist directory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(__dirname, '..', 'src');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const PACKAGE_JSON = path.join(__dirname, '..', 'package.json');

console.log('========================================');
console.log('ATM Build Script');
console.log('========================================\n');

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// 读取源代码
const srcFile = path.join(SRC_DIR, 'index.js');
if (!fs.existsSync(srcFile)) {
  console.error('❌ Source code not found:', srcFile);
  process.exit(1);
}

let code = fs.readFileSync(srcFile, 'utf-8');
console.log('📖 Reading source code:', srcFile);
console.log(`   Original size: ${code.length} bytes\n`);

// 压缩代码
function minifyCode(source) {
  return source
    // 移除多行注释 /* */
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // 移除单行注释 //
    .replace(/\/\/.*$/gm, '')
    // 移除空行
    .replace(/^\s*\n/gm, '')
    // 压缩多余空白
    .replace(/\s+/g, ' ')
    // 移除行首行尾空格
    .replace(/^\s+|\s+$/g, '');
}

console.log('🔧 Minifying code...');
const minified = minifyCode(code);
console.log(`   Minified size: ${minified.length} bytes`);
console.log(`   Compression ratio: ${((1 - minified.length / code.length) * 100).toFixed(1)}%\n`);

// 写入压缩后的文件
const distFile = path.join(DIST_DIR, 'atm.min.js');
fs.writeFileSync(distFile, minified);
console.log('✅ Writing minified file:', distFile);

// Create executable file (add shebang)
const executableFile = path.join(DIST_DIR, 'atm');
const executableContent = '#!/usr/bin/env node\n' + minified;
fs.writeFileSync(executableFile, executableContent);
fs.chmodSync(executableFile, 0o755);
console.log('✅ Creating executable:', executableFile);

// Copy package.json to dist
const distPackageJson = path.join(DIST_DIR, 'package.json');
const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));

// Update package.json paths
const distPkg = {
  ...pkg,
  main: 'atm.min.js',
  bin: {
    'atm': './atm'
  },
  scripts: {
    start: 'node atm.min.js'
  },
  devDependencies: undefined,
  files: [
    'atm',
    'atm.min.js',
    'package.json',
    'README.md'
  ]
};

delete distPkg.devDependencies;
fs.writeFileSync(distPackageJson, JSON.stringify(distPkg, null, 2));
console.log('✅ Creating package.json:', distPackageJson);

// Copy README
const readmeSrc = path.join(__dirname, '..', 'README.md');
const readmeDist = path.join(DIST_DIR, 'README.md');
if (fs.existsSync(readmeSrc)) {
  fs.copyFileSync(readmeSrc, readmeDist);
  console.log('✅ Copying README.md');
}

// Create tar.gz archive
console.log('\n📦 Creating archive...');
const version = pkg.version;
const tarName = `atm-${version}.tar.gz`;
const tarPath = path.join(__dirname, '..', tarName);

try {
  // Use tar command to create archive
  execSync(`tar -czf "${tarPath}" -C "${DIST_DIR}" .`, {
    cwd: __dirname,
    stdio: 'ignore'
  });
  console.log('✅ Created archive:', tarPath);

  // Get archive size
  const stats = fs.statSync(tarPath);
  console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
} catch (err) {
  console.log('⚠️  Failed to create archive:', err.message);
}

console.log('\n========================================');
console.log('Build Complete!');
console.log('========================================');
console.log('\nOutput files:');
console.log(`  📄 ${path.relative(process.cwd(), distFile)}`);
console.log(`  🔧 ${path.relative(process.cwd(), executableFile)}`);
console.log(`  📋 ${path.relative(process.cwd(), distPackageJson)}`);
if (fs.existsSync(tarPath)) {
  console.log(`  📦 ${path.relative(process.cwd(), tarPath)}`);
}
console.log('\nPublish command:');
console.log('  cd dist && npm publish');
console.log('========================================\n');
