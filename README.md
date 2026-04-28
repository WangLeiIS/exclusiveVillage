# OpenVillage Desktop (独家村)

<div align="center">

**AI 智能工作空间 | AI Agent Workspace**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/electron-30.0.0-blue.svg)](https://electronjs.org/)
[![React](https://img.shields.io/badge/react-19.2.5-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.7.3-blue.svg)](https://www.typescriptlang.org/)

</div>

## 🏠 项目介绍

**OpenVillage (独家村)** 是一个现代化的 AI 智能工作空间，让您能够创建和管理多个 AI Agent，在不同项目间自由切换，构建专属的 AI 辅助团队。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API Key

编辑 `.env` 文件：

```env
AI_PROVIDER=deepseek
AI_MODEL=deepseek-v4-flash
DEEPSEEK_API_KEY=sk-your-key-here
```

### 3. 启动开发服务器

```bash
npm run dev
```

这会启动：
- Vite 开发服务器（前端）
- Electron 主进程

## 📁 项目结构

```
src/
├── agent/              # Agent 封装
│   ├── SimpleAgent.ts
│   └── SessionManager.ts
├── main/               # Electron 主进程
│   └── index.ts
├── preload/            # 预加载脚本
│   └── index.ts
└── renderer/           # React 前端
    ├── src/
    │   ├── App.tsx
    │   ├── App.css
    │   ├── main.tsx
    │   └── index.css
    └── index.html
```

## 🔑 核心特性

- ✅ **简单的 pi-mono 集成**（仅 200 行代码）
- ✅ **会话管理**（自动清理过期会话）
- ✅ **类型安全**（TypeScript 全栈）
- ✅ **易于调试**（Chrome DevTools）

## 📊 与 Tauri 方案对比

| 维度 | Tauri 方案 | Electron 方案 |
|---|---|---|
| 代码量 | ~500 行 | ~200 行 |
| 开发时间 | 3-5 天 | 0.5 天 |
| 调试难度 | 困难 | 简单 |

## 🎯 API 使用示例

### 发送消息

```typescript
const response = await window.electronAPI.chat(
  'default-team',
  'default-agent',
  '你好'
);

console.log(response.content);
```

### 获取历史

```typescript
const history = await window.electronAPI.getHistory(
  'default-team',
  'default-agent'
);

console.log(history);
```

### 重置对话

```typescript
await window.electronAPI.reset('default-team', 'default-agent');
```

## 📝 开发说明

### 添加新的 IPC 命令

1. 在 `src/main/index.ts` 中添加处理器：

```typescript
ipcMain.handle('my-command', async (_, payload) => {
  return { success: true, data: 'result' };
});
```

2. 在 `src/preload/index.ts` 中暴露给渲染进程：

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  myCommand: async (arg: string) => {
    return await ipcRenderer.invoke('my-command', arg);
  },
});
```

3. 在 React 中调用：

```typescript
const result = await window.electronAPI.myCommand('hello');
```

## 🐛 故障排查

### 问题：Agent 没有响应

**检查 API Key**：
```bash
# 确认 .env 文件中有 DEEPSEEK_API_KEY
cat .env
```

**查看日志**：
- 主进程日志：终端输出
- 渲染进程日志：Chrome DevTools Console

### 问题：模块找不到

```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

## 📚 相关文档

- [pi-mono 框架评估](../../docs/pi-mono-evaluation.md)
- [简化集成指南](../../docs/simplified-integration-guide.md)
- [技术栈对比](../../docs/tech-stack-evaluation.md)

## 📄 License

MIT
