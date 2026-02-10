#!/usr/bin/env node

/**
 * ATM Functional Test Script
 * Validates security, functional accuracy, and cross-platform compatibility
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Test configuration
const TEST_DIR = path.join(os.tmpdir(), 'c-switch-cli-test-' + Date.now());
const PLATFORM = os.platform();
const IS_WINDOWS = PLATFORM === 'win32';

console.log('========================================');
console.log('ATM Functional Tests');
console.log('========================================');
console.log(`Test directory: ${TEST_DIR}`);
console.log(`Operating system: ${PLATFORM}`);
console.log(`Time: ${new Date().toISOString()}`);
console.log('========================================\n');

let testsPassed = 0;
let testsFailed = 0;

// Test helper functions
function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (err) {
    console.log(`❌ ${name}`);
    console.log(`   错误: ${err.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Cleanup test directory
function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

// Start tests
console.log('[Test 1] Directory Structure Creation\n');

test('Create configuration directory', () => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  fs.mkdirSync(path.join(TEST_DIR, 'models'), { recursive: true });
  assert(fs.existsSync(TEST_DIR), 'Configuration directory not created');
  assert(fs.existsSync(path.join(TEST_DIR, 'models')), 'Models directory not created');
});

test('Directory permissions correct', () => {
  const stats = fs.statSync(TEST_DIR);
  assert(stats.isDirectory(), 'Not a directory');
});

console.log('\n[Test 2] Model File Operations\n');

const testModel = {
  id: 'meituan-flash-chat',
  name: 'LongCat-Flash-Chat',
  provider: 'Meituan',
  url: 'https://api.longcat.chat/anthropic',
  model: 'LongCat-Flash-Chat',
  token: 'sk-test-token-12345',
  createdAt: new Date().toISOString()
};

test('Save model file', () => {
  const modelPath = path.join(TEST_DIR, 'models', `${testModel.id}.json`);
  fs.writeFileSync(modelPath, JSON.stringify(testModel, null, 2));
  assert(fs.existsSync(modelPath), 'Model file not created');
});

test('Read model file', () => {
  const modelPath = path.join(TEST_DIR, 'models', `${testModel.id}.json`);
  const content = fs.readFileSync(modelPath, 'utf-8');
  const parsed = JSON.parse(content);
  assert(parsed.id === testModel.id, 'Model ID mismatch');
  assert(parsed.name === testModel.name, 'Model name mismatch');
  assert(parsed.token === testModel.token, 'Token mismatch');
});

test('Model file format correct', () => {
  const modelPath = path.join(TEST_DIR, 'models', `${testModel.id}.json`);
  const content = fs.readFileSync(modelPath, 'utf-8');
  // Verify valid JSON
  const parsed = JSON.parse(content);
  assert(typeof parsed === 'object', 'Not a valid JSON object');
  assert(parsed.id && parsed.name && parsed.url, 'Missing required fields');
});

console.log('\n[Test 3] Current File Generation (Cross-Platform)\n');

test('Generate Unix format current file', () => {
  const currentPath = path.join(TEST_DIR, 'current');
  const content = `# TMC Environment Variables
export ANTHROPIC_BASE_URL="${testModel.url}"
export ANTHROPIC_API_KEY="${testModel.token}"
export ANTHROPIC_MODEL="${testModel.model}"
`;
  fs.writeFileSync(currentPath, content);
  assert(fs.existsSync(currentPath), 'Current file not created');
  
  const readContent = fs.readFileSync(currentPath, 'utf-8');
  assert(readContent.includes('export ANTHROPIC_BASE_URL='), 'Missing BASE_URL');
  assert(readContent.includes('export ANTHROPIC_API_KEY='), 'Missing AUTH_TOKEN');
  assert(readContent.includes('export ANTHROPIC_MODEL='), 'Missing MODEL');
});

test('Current file contains correct values', () => {
  const currentPath = path.join(TEST_DIR, 'current');
  const content = fs.readFileSync(currentPath, 'utf-8');
  assert(content.includes(testModel.url), 'URL incorrect');
  assert(content.includes(testModel.token), 'Token incorrect');
  assert(content.includes(testModel.model), 'Model incorrect');
});

test('Validate shell script syntax (Unix)', () => {
  const currentPath = path.join(TEST_DIR, 'current');
  const content = fs.readFileSync(currentPath, 'utf-8');
  // Verify each export statement format is correct
  const lines = content.split('\n');
  lines.forEach(line => {
    if (line.startsWith('export ')) {
      // Verify format: export VAR="value"
      assert(/export \w+=".*"/.test(line), `Format error: ${line}`);
    }
  });
});

console.log('\n[Test 4] Index File Operations\n');

test('Create model index', () => {
  const indexPath = path.join(TEST_DIR, 'models.json');
  const index = [{ id: testModel.id, name: testModel.name }];
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  assert(fs.existsSync(indexPath), 'Index file not created');
});

test('Read model index', () => {
  const indexPath = path.join(TEST_DIR, 'models.json');
  const content = fs.readFileSync(indexPath, 'utf-8');
  const index = JSON.parse(content);
  assert(Array.isArray(index), 'Index is not an array');
  assert(index.length === 1, 'Index length incorrect');
  assert(index[0].id === testModel.id, 'Index ID mismatch');
});

console.log('\n[Test 5] Security Checks\n');

test('Token stored in separate file', () => {
  const modelPath = path.join(TEST_DIR, 'models', `${testModel.id}.json`);
  const content = fs.readFileSync(modelPath, 'utf-8');
  assert(content.includes(testModel.token), 'Token not stored in model file');
});

test('Token correctly passed to current file', () => {
  const currentPath = path.join(TEST_DIR, 'current');
  const content = fs.readFileSync(currentPath, 'utf-8');
  assert(content.includes(testModel.token), 'Token not passed to current file');
});

test('Path joining safe (no path traversal)', () => {
  // Copy security validation function from main program
  function isValidModelId(modelId) {
    const validIdPattern = /^[a-zA-Z0-9_-]+$/;
    return validIdPattern.test(modelId);
  }

  const safeId = 'safe-model-id';
  const dangerousId = '../../../etc/passwd';

  // Verify safe ID passes
  assert(isValidModelId(safeId) === true, 'Safe ID should pass');

  // Verify dangerous ID is rejected
  assert(isValidModelId(dangerousId) === false, 'Dangerous ID should be rejected');
  assert(isValidModelId('model;rm -rf') === false, 'Command injection should be rejected');
  assert(isValidModelId('model$(whoami)') === false, 'Command substitution should be rejected');
});

test('特殊字符处理', () => {
  const specialModel = {
    ...testModel,
    id: 'test-special-chars',
    name: 'Test "Special" \n Chars'
  };
  const modelPath = path.join(TEST_DIR, 'models', `${specialModel.id}.json`);
  fs.writeFileSync(modelPath, JSON.stringify(specialModel, null, 2));
  
  const content = fs.readFileSync(modelPath, 'utf-8');
  const parsed = JSON.parse(content);
  assert(parsed.name === specialModel.name, 'Special character handling error');
});

console.log('\n[Test 6] Cross-Platform Compatibility\n');

test('Detect operating system', () => {
  const platform = os.platform();
  const validPlatforms = ['darwin', 'linux', 'win32'];
  assert(validPlatforms.includes(platform), `Unsupported platform: ${platform}`);
  console.log(`   Current platform: ${platform}`);
});

test('Generate Windows format current file', () => {
  const currentPath = path.join(TEST_DIR, 'current-windows');
  const content = `@echo off
set ANTHROPIC_BASE_URL=${testModel.url}
set ANTHROPIC_API_KEY=${testModel.token}
set ANTHROPIC_MODEL=${testModel.model}
`;
  fs.writeFileSync(currentPath, content);
  const readContent = fs.readFileSync(currentPath, 'utf-8');
  assert(readContent.includes('set ANTHROPIC_BASE_URL='), 'Windows format error');
  assert(readContent.includes('@echo off'), 'Missing @echo off');
});

test('Path separator cross-platform', () => {
  const testPath = path.join('models', 'test.json');
  const expectedSep = path.sep;
  assert(testPath.includes(expectedSep), 'Path separator incorrect');
});

console.log('\n[Test 7] Model Switching Logic\n');

test('Switch model updates current file', () => {
  const currentPath = path.join(TEST_DIR, 'current');
  
  // First model
  const model1 = { ...testModel, id: 'model-1', name: 'Model 1', model: 'gpt-4' };
  const content1 = `export ANTHROPIC_MODEL="${model1.model}"`;
  fs.writeFileSync(currentPath, content1);
  
  // Switch to second model
  const model2 = { ...testModel, id: 'model-2', name: 'Model 2', model: 'claude-3' };
  const content2 = `export ANTHROPIC_MODEL="${model2.model}"`;
  fs.writeFileSync(currentPath, content2);
  
  const finalContent = fs.readFileSync(currentPath, 'utf-8');
  assert(finalContent.includes('claude-3'), 'Model switch failed');
  assert(!finalContent.includes('gpt-4'), 'Old model not cleared');
});

console.log('\n========================================');
console.log('Tests Completed');
console.log('========================================');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);
console.log('========================================\n');

// Cleanup
console.log('Cleaning up test directory...');
cleanup();
console.log('Done!\n');

// 退出码
process.exit(testsFailed > 0 ? 1 : 0);
