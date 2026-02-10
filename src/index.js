#!/usr/bin/env node

/**
 * ATM (AI Token Manager CLI)
 * A command-line tool for AI developers to centrally manage and quickly switch
 * between multi-vendor AI Tokens and API URLs
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// ============================================
// Configuration Constants
// ============================================
const APP_NAME = 'ATM';
const APP_FULL_NAME = 'AI Token Manager CLI';
const CONFIG_DIR = path.join(os.homedir(), '.atm');
const MODELS_DIR = path.join(CONFIG_DIR, 'models');
const CURRENT_FILE = path.join(CONFIG_DIR, 'current');
const INDEX_FILE = path.join(CONFIG_DIR, 'models.json');
const SCANNED_FLAG_FILE = path.join(CONFIG_DIR, '.scanned');

const PLATFORM = os.platform();
const IS_WINDOWS = PLATFORM === 'win32';
const IS_MAC = PLATFORM === 'darwin';
const IS_LINUX = PLATFORM === 'linux';

// ============================================
// UI Style Definitions (Cloud Code Style)
// ============================================
const UI = {
  // Color codes
  colors: {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
    
    // Foreground colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    
    // Background colors
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m'
  },
  
  // Icons
  icons: {
    rocket: '🚀',
    folder: '📁',
    file: '📄',
    gear: '⚙️',
    check: '✓',
    cross: '✗',
    arrow: '➜',
    bullet: '•',
    star: '★',
    heart: '♥',
    info: 'ℹ',
    warning: '⚠',
    error: '✖',
    success: '✔',
    pending: '◐',
    search: '🔍',
    scan: '📡',
    token: '🔑',
    model: '🤖',
    cloud: '☁',
    database: '🗄',
    settings: '⚙',
    add: '+',
    remove: '-',
    edit: '✎',
    sync: '🔄',
    exit: '→'
  },
  
  // Border characters
  border: {
    horizontal: '─',
    vertical: '│',
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    leftT: '├',
    rightT: '┤',
    topT: '┬',
    bottomT: '┴',
    cross: '┼'
  }
};

// Style helper functions
function style(text, ...styles) {
  let result = text;
  styles.forEach(s => {
    if (UI.colors[s]) {
      result = UI.colors[s] + result + UI.colors.reset;
    }
  });
  return result;
}

function icon(name) {
  return UI.icons[name] || '';
}

// ============================================
// UI Components
// ============================================

function printHeader() {
  const width = 60;
  const title = `${APP_NAME}`;
  const subtitle = `${APP_FULL_NAME}`;
  
  console.clear();
  console.log('');
  console.log(style(UI.border.topLeft + UI.border.horizontal.repeat(width - 2) + UI.border.topRight, 'cyan', 'bright'));
  console.log(style(UI.border.vertical + ' '.repeat((width - 2 - title.length) / 2) + title + ' '.repeat((width - 2 - title.length + 1) / 2) + UI.border.vertical, 'cyan', 'bright'));
  console.log(style(UI.border.vertical + ' '.repeat((width - 2 - subtitle.length) / 2) + style(subtitle, 'dim') + ' '.repeat((width - 2 - subtitle.length + 1) / 2) + UI.border.vertical, 'cyan'));
  console.log(style(UI.border.leftT + UI.border.horizontal.repeat(width - 2) + UI.border.rightT, 'cyan', 'dim'));
  console.log(style(UI.border.vertical + `  ${icon('cloud')}  Platform: ${PLATFORM.padEnd(15)}  ${icon('database')}  Config: ~/.tmc`.padEnd(width - 2) + UI.border.vertical, 'white'));
  console.log(style(UI.border.bottomLeft + UI.border.horizontal.repeat(width - 2) + UI.border.bottomRight, 'cyan', 'dim'));
  console.log('');
}

function printSection(title) {
  console.log('');
  console.log(style(`  ${icon('bullet')} ${title}`, 'cyan', 'bright'));
  console.log(style(`  ${UI.border.horizontal.repeat(50)}`, 'dim'));
}

function printMenuItem(key, label, description = '') {
  const keyStr = style(`[${key}]`, 'green', 'bright');
  const labelStr = style(label.padEnd(15), 'white', 'bright');
  const descStr = description ? style(description, 'dim') : '';
  console.log(`  ${keyStr} ${labelStr} ${descStr}`);
}

function printSuccess(message) {
  console.log(style(`  ${icon('success')} ${message}`, 'green'));
}

function printError(message) {
  console.log(style(`  ${icon('error')} ${message}`, 'red'));
}

function printInfo(message) {
  console.log(style(`  ${icon('info')} ${message}`, 'blue'));
}

function printWarning(message) {
  console.log(style(`  ${icon('warning')} ${message}`, 'yellow'));
}

function printModelCard(model, index) {
  const isActive = isModelActive(model.id);
  const statusIcon = isActive ? style(icon('success'), 'green') : style(icon('bullet'), 'dim');
  const nameStr = style(model.name, isActive ? 'green' : 'white', 'bright');
  const providerStr = style(model.provider, 'cyan');
  const modelStr = style(model.model, 'dim');
  
  console.log(`  ${statusIcon} ${style(`${index}.`, 'dim')} ${nameStr}`);
  console.log(`     ${style('├─', 'dim')} Provider: ${providerStr}`);
  console.log(`     ${style('├─', 'dim')} Model: ${modelStr}`);
  console.log(`     ${style('└─', 'dim')} URL: ${style(model.url, 'dim')}`);
  console.log('');
}

function printDivider() {
  console.log(style(`  ${UI.border.horizontal.repeat(56)}`, 'dim'));
}

// ============================================
// Readline Interface
// ============================================
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, answer => resolve(answer.trim()));
  });
}

// ============================================
// Security Validation
// ============================================
function isValidModelId(modelId) {
  const validIdPattern = /^[a-zA-Z0-9_-]+$/;
  return validIdPattern.test(modelId);
}

function getSafeModelPath(modelId) {
  if (!isValidModelId(modelId)) {
    throw new Error(`无效的模型ID: ${modelId}`);
  }
  const modelPath = path.join(MODELS_DIR, `${modelId}.json`);
  const resolvedPath = path.resolve(modelPath);
  const resolvedModelsDir = path.resolve(MODELS_DIR);
  if (!resolvedPath.startsWith(resolvedModelsDir)) {
    throw new Error('路径遍历攻击检测！');
  }
  return modelPath;
}

// ============================================
// 配置管理
// ============================================
function ensureConfig() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }
  if (!fs.existsSync(INDEX_FILE)) {
    fs.writeFileSync(INDEX_FILE, JSON.stringify([], null, 2));
  }
}

function loadModelIndex() {
  ensureConfig();
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveModelIndex(index) {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

function loadModel(modelId) {
  try {
    const modelPath = getSafeModelPath(modelId);
    if (!fs.existsSync(modelPath)) return null;
    return JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
  } catch (err) {
    printError(`Failed to load model: ${err.message}`);
    return null;
  }
}

function saveModel(model) {
  try {
    const modelPath = getSafeModelPath(model.id);
    fs.writeFileSync(modelPath, JSON.stringify(model, null, 2));
  } catch (err) {
    printError(`保存模型失败: ${err.message}`);
    throw err;
  }
}

function deleteModelFile(modelId) {
  try {
    const modelPath = getSafeModelPath(modelId);
    if (fs.existsSync(modelPath)) {
      fs.unlinkSync(modelPath);
    }
  } catch (err) {
    printError(`Failed to delete model: ${err.message}`);
  }
}

function isModelActive(modelId) {
  if (!fs.existsSync(CURRENT_FILE)) return false;
  try {
    const content = fs.readFileSync(CURRENT_FILE, 'utf-8');
    // 简单检查：看current文件中是否包含该模型的特征
    const model = loadModel(modelId);
    if (!model) return false;
    return content.includes(model.model) || content.includes(model.url);
  } catch {
    return false;
  }
}

// ============================================
// Local Model Scanning
// ============================================
function hasBeenScanned() {
  return fs.existsSync(SCANNED_FLAG_FILE);
}

function markAsScanned() {
  fs.writeFileSync(SCANNED_FLAG_FILE, new Date().toISOString());
}

function scanLocalModels() {
  printSection('Scanning Local Environment');
  printInfo('Scanning for existing model configurations...');
  
  const models = [];
  const homeDir = os.homedir();
  
  // Scan common configuration file locations
  const scanPaths = [
    { path: path.join(homeDir, '.claude'), name: 'Claude' },
    { path: path.join(homeDir, '.anthropic'), name: 'Anthropic' },
    { path: path.join(homeDir, '.openai'), name: 'OpenAI' },
    { path: path.join(homeDir, '.config', 'claude'), name: 'Claude Config' },
  ];
  
  // Scan environment variables
  const envModels = scanEnvironmentVariables();
  if (envModels.length > 0) {
    printInfo(`Found ${envModels.length} model(s) from environment variables`);
    models.push(...envModels);
  }
  
  // Scan configuration directories
  scanPaths.forEach(scanPath => {
    if (fs.existsSync(scanPath.path)) {
      printInfo(`Found config directory: ${scanPath.name}`);
      const detectedModels = scanConfigDirectory(scanPath.path, scanPath.name);
      models.push(...detectedModels);
    }
  });
  
  // Remove duplicates
  const uniqueModels = removeDuplicateModels(models);
  
  if (uniqueModels.length > 0) {
    printSuccess(`Discovered ${uniqueModels.length} unique model(s)`);
    
    // 一次性写入本地配置
    uniqueModels.forEach(model => {
      saveModel(model);
    });
    
    // 更新索引
    const index = uniqueModels.map(m => ({ id: m.id, name: m.name }));
    saveModelIndex(index);
    
    printSuccess('Models saved to local configuration');
  } else {
    printWarning('No existing models found in local environment');
  }
  
  // 标记已扫描
  markAsScanned();
  
  return uniqueModels;
}

function scanEnvironmentVariables() {
  const models = [];
  
  // 检查常见的环境变量
  const envChecks = [
    { 
      url: process.env.ANTHROPIC_BASE_URL,
      token: process.env.ANTHROPIC_AUTH_TOKEN,
      model: process.env.ANTHROPIC_MODEL,
      provider: 'Anthropic'
    },
    {
      url: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
      token: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      provider: 'OpenAI'
    },
    {
      url: process.env.MEITUAN_API_URL || 'https://api.longcat.chat/anthropic',
      token: process.env.MEITUAN_API_KEY,
      model: process.env.MEITUAN_MODEL || 'LongCat-Flash-Chat',
      provider: 'Meituan'
    }
  ];
  
  envChecks.forEach((env, idx) => {
    if (env.token) {
      models.push({
        id: `env-${env.provider.toLowerCase().replace(/\s+/g, '-')}-${idx}`,
        name: `${env.provider} (${env.model})`,
        provider: env.provider,
        url: env.url,
        model: env.model,
        token: env.token,
        source: 'environment',
        createdAt: new Date().toISOString()
      });
    }
  });
  
  return models;
}

function scanConfigDirectory(dirPath, providerName) {
  const models = [];
  
  try {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile() && (file.endsWith('.json') || file.endsWith('.env'))) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const detected = parseConfigContent(content, providerName, file);
          if (detected) {
            models.push(detected);
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    });
  } catch (e) {
    // Ignore read errors
  }
  
  return models;
}

function parseConfigContent(content, provider, filename) {
  // 尝试解析JSON
  try {
    const json = JSON.parse(content);
    if (json.apiKey || json.token || json.api_key) {
      return {
        id: `scanned-${provider.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name: `${provider} (from ${filename})`,
        provider: provider,
        url: json.baseUrl || json.url || json.apiUrl || 'https://api.anthropic.com/v1',
        model: json.model || 'claude-3-sonnet-20240229',
        token: json.apiKey || json.token || json.api_key,
        source: 'scanned',
        createdAt: new Date().toISOString()
      };
    }
  } catch {
    // 不是JSON，尝试解析ENV格式
    const lines = content.split('\n');
    let url, token, model;
    
    lines.forEach(line => {
      if (line.includes('ANTHROPIC_BASE_URL=') || line.includes('API_URL=')) {
        url = line.split('=')[1]?.trim().replace(/["']/g, '');
      }
      if (line.includes('ANTHROPIC_AUTH_TOKEN=') || line.includes('API_KEY=') || line.includes('TOKEN=')) {
        token = line.split('=')[1]?.trim().replace(/["']/g, '');
      }
      if (line.includes('ANTHROPIC_MODEL=') || line.includes('MODEL=')) {
        model = line.split('=')[1]?.trim().replace(/["']/g, '');
      }
    });
    
    if (token) {
      return {
        id: `scanned-${provider.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name: `${provider} (from ${filename})`,
        provider: provider,
        url: url || 'https://api.anthropic.com/v1',
        model: model || 'claude-3-sonnet-20240229',
        token: token,
        source: 'scanned',
        createdAt: new Date().toISOString()
      };
    }
  }
  
  return null;
}

function removeDuplicateModels(models) {
  const seen = new Set();
  return models.filter(model => {
    const key = `${model.provider}-${model.token.substring(0, 10)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============================================
// Shell 转义
// ============================================
function escapeShellValue(value) {
  if (!value) return '';
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
}

function escapeBatchValue(value) {
  if (!value) return '';
  return value
    .replace(/\^/g, '^^')
    .replace(/&/g, '^&')
    .replace(/</g, '^<')
    .replace(/>/g, '^>')
    .replace(/\|/g, '^|');
}

function generateCurrentContent(model) {
  const url = escapeShellValue(model.url || '');
  const token = escapeShellValue(model.token || '');
  const modelName = escapeShellValue(model.model || '');
  
  if (IS_WINDOWS) {
    const winUrl = escapeBatchValue(model.url || '');
    const winToken = escapeBatchValue(model.token || '');
    const winModel = escapeBatchValue(model.model || '');
    return `@echo off
REM TMC Environment Variables
set ANTHROPIC_BASE_URL=${winUrl}
set ANTHROPIC_AUTH_TOKEN=${winToken}
set ANTHROPIC_MODEL=${winModel}
`;
  } else {
    return `# TMC Environment Variables
# Generated at ${new Date().toISOString()}
export ANTHROPIC_BASE_URL="${url}"
export ANTHROPIC_AUTH_TOKEN="${token}"
export ANTHROPIC_MODEL="${modelName}"
`;
  }
}

function getActivateCommand() {
  if (IS_WINDOWS) {
    return style(`  ${CURRENT_FILE}`, 'cyan');
  } else {
    return style(`  source ${CURRENT_FILE}`, 'cyan');
  }
}

function getShellConfigPath() {
  if (IS_WINDOWS) {
    const psProfileDir = path.join(os.homedir(), 'Documents', 'PowerShell');
    return path.join(psProfileDir, 'Microsoft.PowerShell_profile.ps1');
  } else {
    const shell = process.env.SHELL || '';
    if (shell.includes('zsh')) {
      return path.join(os.homedir(), '.zshrc');
    }
    return path.join(os.homedir(), '.bashrc');
  }
}

function updateCurrentFile(model) {
  const content = generateCurrentContent(model);
  fs.writeFileSync(CURRENT_FILE, content);
  if (!IS_WINDOWS) {
    try {
      fs.chmodSync(CURRENT_FILE, 0o644);
    } catch (e) {}
  }
}

// ============================================
// Feature Modules
// ============================================

function listModels() {
  printSection('Model Registry');
  
  const index = loadModelIndex();
  if (index.length === 0) {
    printWarning('No models configured');
    printInfo('Use option [2] to add a new model');
    return;
  }
  
  printInfo(`${index.length} model(s) found in local registry`);
  console.log('');
  
  index.forEach((item, i) => {
    const model = loadModel(item.id);
    if (model) {
      printModelCard(model, i + 1);
    }
  });
}

async function addModel() {
  printSection('Add New Model');
  
  printInfo('Enter model details:');
  console.log('');
  
  const name = await question(style('  Model Name: ', 'cyan'));
  if (!name) {
    printError('Model name is required');
    return;
  }
  
  const provider = await question(style('  Provider: ', 'cyan'));
  const url = await question(style('  API URL: ', 'cyan'));
  if (!url) {
    printError('API URL is required');
    return;
  }
  
  const modelType = await question(style('  Model ID: ', 'cyan'));
  if (!modelType) {
    printError('Model ID is required');
    return;
  }
  
  const token = await question(style('  API Token: ', 'cyan'));
  if (!token) {
    printError('API Token is required');
    return;
  }
  
  const id = `manual-${Date.now()}`;
  const model = {
    id,
    name: name,
    provider: provider || 'Custom',
    url: url,
    model: modelType,
    token: token,
    source: 'manual',
    createdAt: new Date().toISOString()
  };
  
  saveModel(model);
  
  const index = loadModelIndex();
  index.push({ id: model.id, name: model.name });
  saveModelIndex(index);
  
  console.log('');
  printSuccess(`Model "${model.name}" added successfully`);
}

async function switchModel() {
  printSection('Switch Active Model');
  
  const index = loadModelIndex();
  if (index.length === 0) {
    printWarning('No models available');
    printInfo('Add a model first using option [2]');
    return;
  }
  
  printInfo('Select model to activate:');
  console.log('');
  
  index.forEach((item, i) => {
    const model = loadModel(item.id);
    if (model) {
      const isActive = isModelActive(model.id);
      const marker = isActive ? style('●', 'green') : style('○', 'dim');
      console.log(`  ${marker} ${style(`${i + 1}.`, 'dim')} ${style(model.name, isActive ? 'green' : 'white')}`);
    }
  });
  
  console.log('');
  const choice = await question(style('  Enter number: ', 'cyan'));
  const idx = parseInt(choice) - 1;
  
  if (idx < 0 || idx >= index.length) {
    printError('Invalid selection');
    return;
  }
  
  const selected = index[idx];
  const model = loadModel(selected.id);
  
  if (!model) {
    printError('Model configuration not found');
    return;
  }
  
  updateCurrentFile(model);
  
  console.log('');
  printSuccess(`Activated: ${model.name}`);
  printInfo(`Provider: ${model.provider}`);
  printInfo(`Model: ${model.model}`);
  
  console.log('');
  printSection('Activation Command');
  console.log(getActivateCommand());
  
  if (!IS_WINDOWS) {
    console.log('');
    printInfo('To make permanent, add to your shell profile:');
    console.log(style(`  echo 'source ${CURRENT_FILE}' >> ${getShellConfigPath()}`, 'dim'));
  }
}

async function deleteModel() {
  printSection('Remove Model');
  
  const index = loadModelIndex();
  if (index.length === 0) {
    printWarning('No models to remove');
    return;
  }
  
  printInfo('Select model to remove:');
  console.log('');
  
  index.forEach((item, i) => {
    console.log(`  ${style(`${i + 1}.`, 'dim')} ${item.name}`);
  });
  
  console.log('');
  const choice = await question(style('  Enter number: ', 'cyan'));
  const idx = parseInt(choice) - 1;
  
  if (idx < 0 || idx >= index.length) {
    printError('Invalid selection');
    return;
  }
  
  const selected = index[idx];
  console.log('');
  const confirm = await question(style(`  Confirm removal of "${selected.name}"? (y/N): `, 'yellow'));
  
  if (confirm.toLowerCase() === 'y') {
    deleteModelFile(selected.id);
    index.splice(idx, 1);
    saveModelIndex(index);
    printSuccess('Model removed successfully');
  } else {
    printInfo('Operation cancelled');
  }
}

function showCurrent() {
  printSection('Current Environment');
  
  const hasBaseUrl = !!process.env.ANTHROPIC_BASE_URL;
  const hasToken = !!process.env.ANTHROPIC_AUTH_TOKEN;
  const hasModel = !!process.env.ANTHROPIC_MODEL;
  
  console.log(`  ${hasBaseUrl ? style('✓', 'green') : style('✗', 'dim')} ANTHROPIC_BASE_URL: ${hasBaseUrl ? style(process.env.ANTHROPIC_BASE_URL, 'green') : style('not set', 'dim')}`);
  console.log(`  ${hasToken ? style('✓', 'green') : style('✗', 'dim')} ANTHROPIC_AUTH_TOKEN: ${hasToken ? style('********', 'green') : style('not set', 'dim')}`);
  console.log(`  ${hasModel ? style('✓', 'green') : style('✗', 'dim')} ANTHROPIC_MODEL: ${hasModel ? style(process.env.ANTHROPIC_MODEL, 'green') : style('not set', 'dim')}`);
  
  if (fs.existsSync(CURRENT_FILE)) {
    console.log('');
    printInfo(`Configuration file: ${CURRENT_FILE}`);
    const content = fs.readFileSync(CURRENT_FILE, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    if (lines.length > 0) {
      console.log('');
      console.log(style('  Preview:', 'dim'));
      lines.forEach(line => {
        console.log(`    ${style(line, 'dim')}`);
      });
    }
  }
}

async function initConfig() {
  printSection('Initialize Configuration');
  
  ensureConfig();
  
  printSuccess('Configuration directory created');
  console.log(`  ${style('Path:', 'dim')} ${CONFIG_DIR}`);
  console.log(`  ${style('Models:', 'dim')} ${MODELS_DIR}`);
  console.log(`  ${style('Index:', 'dim')} ${INDEX_FILE}`);
  
  console.log('');
  printInfo('Use option [2] to add your first model');
}

async function rescanModels() {
  printSection('Rescan Local Environment');
  
  printWarning('This will scan for new models in your environment');
  const confirm = await question(style('  Continue? (y/N): ', 'yellow'));
  
  if (confirm.toLowerCase() === 'y') {
    // 删除扫描标记，强制重新扫描
    if (fs.existsSync(SCANNED_FLAG_FILE)) {
      fs.unlinkSync(SCANNED_FLAG_FILE);
    }
    
    const models = scanLocalModels();
    
    if (models.length > 0) {
      console.log('');
      printSuccess(`Found and saved ${models.length} model(s)`);
    }
  } else {
    printInfo('Scan cancelled');
  }
}

// ============================================
// 主菜单
// ============================================
async function showMainMenu() {
  printDivider();
  console.log('');
  printMenuItem('1', 'List Models', 'View all configured models');
  printMenuItem('2', 'Add Model', 'Add a new model configuration');
  printMenuItem('3', 'Switch Model', 'Activate a different model');
  printMenuItem('4', 'Delete Model', 'Remove a model configuration');
  printMenuItem('5', 'Environment', 'View current environment variables');
  printMenuItem('6', 'Initialize', 'Create configuration directory');
  printMenuItem('7', 'Rescan', 'Rescan local environment for models');
  printMenuItem('0', 'Exit', 'Quit TMC');
  console.log('');
  printDivider();
}

// ============================================
// 主函数
// ============================================
async function main() {
  // First launch scan
  if (!hasBeenScanned()) {
    printHeader();
    scanLocalModels();
    await question(style('\n  Press Enter to continue...', 'dim'));
  }
  
  while (true) {
    printHeader();
    await showMainMenu();
    
    const choice = await question(style('\n  Select option: ', 'cyan', 'bright'));
    
    switch (choice) {
      case '1':
        listModels();
        await question(style('\n  Press Enter to continue...', 'dim'));
        break;
      case '2':
        await addModel();
        await question(style('\n  Press Enter to continue...', 'dim'));
        break;
      case '3':
        await switchModel();
        await question(style('\n  Press Enter to continue...', 'dim'));
        break;
      case '4':
        await deleteModel();
        await question(style('\n  Press Enter to continue...', 'dim'));
        break;
      case '5':
        showCurrent();
        await question(style('\n  Press Enter to continue...', 'dim'));
        break;
      case '6':
        await initConfig();
        await question(style('\n  Press Enter to continue...', 'dim'));
        break;
      case '7':
        await rescanModels();
        await question(style('\n  Press Enter to continue...', 'dim'));
        break;
      case '0':
        console.clear();
        printHeader();
        printSuccess('Thank you for using TMC!');
        console.log('');
        rl.close();
        return;
      default:
        printError('Invalid option');
        await question(style('\n  Press Enter to continue...', 'dim'));
    }
  }
}

// Start
main().catch(err => {
  console.error(style(`\n  ${icon('error')} Fatal error:`, 'red'), err.message);
  process.exit(1);
});
