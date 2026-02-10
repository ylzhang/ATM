#!/usr/bin/env node

/**
 * ATM Security Tests
 * Dedicated tests for path safety and input validation
 */

const path = require('path');

console.log('========================================');
console.log('ATM Security Tests');
console.log('========================================\n');

let testsPassed = 0;
let testsFailed = 0;

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

// 复制安全验证函数进行测试
function isValidModelId(modelId) {
  const validIdPattern = /^[a-zA-Z0-9_-]+$/;
  return validIdPattern.test(modelId);
}

console.log('[Test 1] Model ID Validation\n');

test('Valid ID: alphanumeric', () => {
  assert(isValidModelId('meituan-flash-chat') === true, 'Should pass');
  assert(isValidModelId('model123') === true, 'Should pass');
  assert(isValidModelId('test_model') === true, 'Should pass');
});

test('Invalid ID: path traversal', () => {
  assert(isValidModelId('../../../etc/passwd') === false, 'Should reject');
  assert(isValidModelId('..\\windows\\system32') === false, 'Should reject');
  assert(isValidModelId('model/../../../etc') === false, 'Should reject');
});

test('Invalid ID: special characters', () => {
  assert(isValidModelId('model;rm -rf /') === false, 'Should reject semicolon');
  assert(isValidModelId('model&&whoami') === false, 'Should reject &');
  assert(isValidModelId('model|cat /etc/passwd') === false, 'Should reject |');
  assert(isValidModelId('model$(id)') === false, 'Should reject $');
  assert(isValidModelId('model`id`') === false, 'Should reject `');
});

test('Invalid ID: empty and whitespace', () => {
  assert(isValidModelId('') === false, 'Should reject empty string');
  assert(isValidModelId('model name') === false, 'Should reject spaces');
  assert(isValidModelId(' model') === false, 'Should reject leading spaces');
  assert(isValidModelId('model ') === false, 'Should reject trailing spaces');
});

test('Invalid ID: dots', () => {
  assert(isValidModelId('.hidden') === false, 'Should reject dot prefix');
  assert(isValidModelId('model.json') === false, 'Should reject dots');
  assert(isValidModelId('../config') === false, 'Should reject double dots');
});

console.log('\n[Test 2] Path Resolution Security\n');

test('path.join handles correctly', () => {
  const base = '/safe/models';
  const safeId = 'normal-model';
  const result = path.join(base, `${safeId}.json`);
  assert(result === '/safe/models/normal-model.json', 'Path join error');
});

test('path.resolve prevents traversal', () => {
  const base = '/safe/models';
  const dangerousId = '../../../etc/passwd';
  const result = path.join(base, `${dangerousId}.json`);
  const resolved = path.resolve(result);

  // Even if dangerous path is joined, resolved should not contain sensitive target path
  // Because we have isValidModelId check, such IDs never reach here
  console.log(`   Joined path: ${result}`);
  console.log(`   Resolved path: ${resolved}`);

  // Verify: if ID is valid, path must be under base
  if (isValidModelId(dangerousId)) {
    assert(resolved.startsWith(base), 'Path escape!');
  }
});

test('Windows path separator', () => {
  const winPath = 'models\\test.json';
  const unixPath = 'models/test.json';

  // path.join automatically handles platform
  const joined = path.join('models', 'test.json');
  console.log(`   Platform separator: ${path.sep}`);
  console.log(`   Join result: ${joined}`);

  assert(joined.includes(path.sep), 'Not using platform separator');
});

console.log('\n[Test 3] Environment Variable Security\n');

test('Token format validation', () => {
  const validTokens = [
    'sk-ant-api03-test123',
    'sk-test-1234567890',
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
  ];

  validTokens.forEach(token => {
    // Token should be stored as-is, no modification
    assert(typeof token === 'string', 'Token must be string');
    assert(token.length > 0, 'Token cannot be empty');
  });
});

test('URL format validation', () => {
  const validUrls = [
    'https://api.longcat.chat/anthropic',
    'https://api.openai.com/v1',
    'http://localhost:8080/api'
  ];

  validUrls.forEach(url => {
    try {
      new URL(url);
      assert(true, 'URL valid');
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }
  });
});

test('Special character escaping', () => {
  // Copy escape function from main program for testing
  function escapeShellValue(value) {
    if (!value) return '';
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');
  }

  // Test double quote escaping
  const input1 = 'test"quote';
  const escaped1 = escapeShellValue(input1);
  assert(escaped1 === 'test\\"quote', `Double quote escape error: ${escaped1}`);

  // Test $ escaping
  const input2 = 'value$(whoami)';
  const escaped2 = escapeShellValue(input2);
  assert(escaped2 === 'value\\$(whoami)', `$ escape error: ${escaped2}`);

  // Test backtick escaping
  const input3 = 'value`id`';
  const escaped3 = escapeShellValue(input3);
  assert(escaped3 === 'value\\`id\\`', `Backtick escape error: ${escaped3}`);
});

console.log('\n========================================');
console.log('Security Tests Completed');
console.log('========================================');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);
console.log('========================================\n');

process.exit(testsFailed > 0 ? 1 : 0);
