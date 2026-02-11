# ATM (AI Token Manager CLI)

> A command-line tool for AI developers to centrally manage and quickly switch between multi-vendor AI Tokens and API URLs

English | [中文](#中文文档)

---

## Overview

ATM (AI Token Manager CLI) is a command-line tool designed for AI developers. It provides one-stop centralized management and quick switching of multi-vendor AI Tokens and API URLs. With simple commands, you can achieve one-click scheduling of AI key resources, eliminating the hassle of scattered configuration across multiple platforms and streamlining the AI development workflow.

## Features

✅ **Auto Scan** - Automatically scans local environment for existing model configurations on startup  
✅ **Zero Built-in Models** - No built-in model library, completely based on local configuration  
✅ **Modern CLI Interface** - Cloud Code style interactive experience  
✅ **Cross-Platform** - Supports macOS, Linux, Windows  
✅ **Secure** - Path traversal protection, shell injection protection  

## Installation

```bash
# Global installation
npm install -g @autoworld/atm

# Or use npx
npx @autoworld/atm

# Or run from source
git clone https://github.com/ylzhang/ATM.git
cd ATM
npm install
npm start
```

## Quick Start

### First Launch

When you run ATM for the first time, it will automatically scan your local environment:

```bash
atm
```

Scan scope includes:
- Environment variables (`ANTHROPIC_*`, `OPENAI_*`, `MEITUAN_*`)
- Configuration directories (`~/.claude`, `~/.anthropic`, `~/.openai`)
- JSON and ENV format configuration files

### Add Model Manually

```bash
# Select [2] Add Model
# Follow prompts to enter:
#   - Model Name: Model display name
#   - Provider: Provider name
#   - API URL: API endpoint URL
#   - Model ID: Model identifier
#   - API Token: API key
```

### Switch Models

```bash
# Select [3] Switch Model
# Choose the model to activate
# Execute the displayed activation command to apply configuration
```

### Apply Configuration

**macOS/Linux:**
```bash
source ~/.atm/current
```

**Windows:**
```powershell
~/.atm/current
```

## Project Structure

```
atm/
├── src/
│   └── index.js          # Source code
├── test/
│   ├── functional.test.js # Functional tests
│   └── security.test.js   # Security tests
├── scripts/
│   └── build.js          # Build script
├── dist/                 # Build output directory
├── package.json
└── README.md
```

## Configuration Directory

```
~/.atm/
├── models/               # Model configuration directory
│   ├── {model-id}.json   # Individual model file
│   └── ...
├── current               # Currently active model (pointer file)
├── models.json           # Model index list
└── .scanned              # Scan flag file
```

### Model File Format

```json
{
  "id": "manual-1234567890",
  "name": "My Model",
  "provider": "Custom",
  "url": "https://api.example.com/v1",
  "model": "model-name",
  "token": "sk-xxx",
  "source": "manual",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

## Development

### Run Tests

```bash
# Run all tests
npm test

# Run functional tests only
npm run test:functional

# Run security tests only
npm run test:security
```

### Build Package

```bash
# Build and minify code
npm run build

# Clean build artifacts
npm run clean
```

### Publish

```bash
# Test and build
npm run prepublishOnly

# Publish to npm
cd dist && npm publish
```

## CLI Menu

```
╭────────────────────────────────────────────────────────╮
│                          ATM                           │
│           AI Token Manager CLI                         │
├────────────────────────────────────────────────────────┤
│  ☁  Platform: darwin          🗄  Config: ~/.atm       │
╰────────────────────────────────────────────────────────╯

  ────────────────────────────────────────────────────────

  [1] List Models      View all configured models
  [2] Add Model        Add a new model configuration
  [3] Switch Model     Activate a different model
  [4] Delete Model     Remove a model configuration
  [5] Environment      View current environment variables
  [6] Initialize       Create configuration directory
  [7] Rescan           Rescan local environment for models
  [0] Exit             Quit ATM

  ────────────────────────────────────────────────────────

  Select option:
```

## How It Works

1. **First Launch Scan**
   - Check for `~/.atm/.scanned` flag file
   - If not scanned, automatically scan environment variables and config files
   - Write discovered models to `~/.atm/models/`
   - Create scan flag file

2. **Add Model**
   - User manually inputs model information
   - Save to `~/.atm/models/{id}.json`
   - Update `~/.atm/models.json` index

3. **Switch Model**
   - Read selected model configuration
   - Write to `~/.atm/current` file
   - User executes `source ~/.atm/current` to apply

## Security Features

- **Path Traversal Protection**: Model IDs only allow `a-zA-Z0-9_-`
- **Shell Injection Protection**: Escapes `"`, `` ` ``, `$`, `\`
- **Windows Batch Protection**: Escapes `^`, `&`, `<`, `>`, `|`

---

# 中文文档

## 概述

ATM (AI Token Manager CLI) 是一款面向 AI 开发者的命令行 Token 管理工具，专注一站式搞定多厂商 AI Token、接口 URL 的集中管理与快速切换，通过极简指令实现 AI 密钥资源的一键调度，告别多平台密钥、接口配置分散繁琐的问题，高效简化 AI 开发中的 Token 资源管理流程。

## 特点

✅ **自动扫描** - 启动时自动扫描本地环境中的模型配置  
✅ **零内置模型** - 不从内置库加载，完全基于本地配置  
✅ **现代 CLI 界面** - Cloud Code 风格的交互体验  
✅ **跨平台** - 支持 macOS、Linux、Windows  
✅ **安全** - 路径遍历防护、Shell 注入防护  

## 安装

```bash
# 全局安装
npm install -g atm

# 或使用 npx
npx atm

# 或从源码运行
npm install
npm start
```

## 快速开始

### 首次启动

首次运行 ATM 时，会自动扫描您的本地环境：

```bash
atm
```

扫描范围包括：
- 环境变量 (`ANTHROPIC_*`, `OPENAI_*`, `MEITUAN_*`)
- 配置文件目录 (`~/.claude`, `~/.anthropic`, `~/.openai`)
- JSON 和 ENV 格式的配置文件

### 手动添加模型

```bash
# 选择 [2] Add Model
# 按提示输入：
#   - Model Name: 模型显示名称
#   - Provider: 提供商名称
#   - API URL: API 接口地址
#   - Model ID: 模型标识符
#   - API Token: API 密钥
```

### 切换模型

```bash
# 选择 [3] Switch Model
# 选择要激活的模型
# 执行显示的激活命令使配置生效
```

### 生效配置

**macOS/Linux:**
```bash
source ~/.atm/current
```

**Windows:**
```powershell
~/.atm/current
```

## 配置目录

```
~/.atm/
├── models/               # 模型配置目录
│   ├── {model-id}.json   # 单个模型文件
│   └── ...
├── current               # 当前激活的模型（指针文件）
├── models.json           # 模型索引列表
└── .scanned              # 扫描标记文件
```

## 工作原理

1. **首次启动扫描**
   - 检查 `~/.atm/.scanned` 标记文件
   - 如未扫描，自动扫描环境变量和配置文件
   - 将发现的模型写入 `~/.atm/models/`
   - 创建扫描标记文件

2. **添加模型**
   - 用户手动输入模型信息
   - 保存到 `~/.atm/models/{id}.json`
   - 更新 `~/.atm/models.json` 索引

3. **切换模型**
   - 读取选中的模型配置
   - 写入 `~/.atm/current` 文件
   - 用户执行 `source ~/.atm/current` 生效

## 安全特性

- **路径遍历防护**: 模型 ID 只允许 `a-zA-Z0-9_-`
- **Shell 注入防护**: 转义 `"`, `` ` ``, `$`, `\`
- **Windows Batch 防护**: 转义 `^`, `&`, `<`, `>`, `|`
