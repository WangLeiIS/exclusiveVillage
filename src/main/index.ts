// 加载 .env 文件
require('dotenv').config();

// Electron 模块导入
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const dialog = electron.dialog;

const path = require('path');
const { sessionManager } = require('../agent/SessionManager.js');
const { teamManager } = require('../agent/TeamManager.js');

// 延迟导入日志系统，避免影响Electron加载
let logger: any = null;
function getLogger() {
  if (!logger) {
    const { logger: loggerInstance } = require('../utils/Logger.js');
    logger = loggerInstance;
  }
  return logger;
}

// 禁用硬件加速（可选）
try {
  if (app && app.disableHardwareAcceleration) {
    app.disableHardwareAcceleration();
  }
} catch (error) {
  console.log('Failed to disable hardware acceleration:', error);
}

let mainWindow: any = null;

/**
 * 创建窗口
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 开发模式加载 Vite 服务器
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

/**
 * 准备就绪时创建窗口
 */
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * 所有窗口关闭时退出应用
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============== IPC 处理器 ==============

/**
 * 发送消息
 */
ipcMain.handle(
  'chat:send',
  async (
    _event: any,
    payload: {
      teamName: string;
      agentName: string;
      message: string;
      cwd: string;
    }
  ) => {
    try {
      getLogger().logIPCCall('chat:send', payload);

      const agent = await sessionManager.getOrCreate(
        payload.teamName,
        payload.agentName,
        {
          name: payload.agentName,
          role: 'AI 助手',
          systemPrompt: `你是${payload.agentName}，一个专业的 AI 助手。`,
        },
        payload.cwd
      );

      // 等待 Agent 空闲
      while (!agent.isIdle()) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const response = await agent.chat(payload.message);

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      getLogger().error('chat:send', 'Failed to send message', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
);

/**
 * 获取对话历史
 */
ipcMain.handle(
  'chat:get-history',
  async (
    _event: any,
    payload: { teamName: string; agentName: string }
  ) => {
    try {
      console.log('[IPC] chat:get-history', payload);

      const agent = sessionManager.getOrCreate(
        payload.teamName,
        payload.agentName,
        {
          name: payload.agentName,
          role: 'AI 助手',
        }
      );

      await agent.init();
      const history = agent.getHistory();

      return {
        success: true,
        data: history,
      };
    } catch (error) {
      console.error('[IPC] chat:get-history error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
);

/**
 * 重置对话
 */
ipcMain.handle(
  'chat:reset',
  async (_event: any, payload: { teamName: string; agentName: string }) => {
    try {
      console.log('[IPC] chat:reset', payload);

      sessionManager.remove(payload.teamName, payload.agentName);

      return {
        success: true,
      };
    } catch (error) {
      console.error('[IPC] chat:reset error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
);

/**
 * 检查 API Key
 */
ipcMain.handle('check-api-key', async () => {
  const hasKey = !!(
    process.env.DEEPSEEK_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GOOGLE_API_KEY
  );

  return hasKey;
});

/**
 * 获取会话列表
 */
ipcMain.handle('sessions:get-list', async () => {
  return {
    success: true,
    data: sessionManager.getActiveSessions(),
  };
});

// ============== 团队管理 ==============

/**
 * 列出所有团队
 */
ipcMain.handle('teams:list', async () => {
  try {
    getLogger().logIPCCall('teams:list');
    const teams = await teamManager.listTeams();
    return { success: true, data: teams };
  } catch (error) {
    getLogger().error('teams:list', 'Failed to list teams', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

/**
 * 创建团队
 */
ipcMain.handle(
  'teams:create',
  async (_event: any, payload: { name: string; description?: string }) => {
    try {
      console.log('[IPC] teams:create', payload);
      const team = await teamManager.createTeam(payload.name, payload.description);
      return { success: true, data: team };
    } catch (error) {
      console.error('[IPC] teams:create error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
);

/**
 * 删除团队
 */
ipcMain.handle('teams:delete', async (_event: any, payload: { name: string }) => {
  try {
    console.log('[IPC] teams:delete', payload);
    await teamManager.deleteTeam(payload.name);

    // 清理相关的 Agent 会话
    const sessions = sessionManager.getActiveSessions();
    for (const session of sessions) {
      if (session.startsWith(`${payload.name}:`)) {
        sessionManager.remove(payload.name, session.split(':')[1]);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('[IPC] teams:delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

// ============== Agent 管理 ==============

/**
 * 列出团队中的 Agent
 */
ipcMain.handle(
  'agents:list',
  async (_event: any, payload: { teamName: string }) => {
    try {
      getLogger().logIPCCall('agents:list', payload);
      const agents = await teamManager.listAgents(payload.teamName);
      return { success: true, data: agents };
    } catch (error) {
      getLogger().error('agents:list', 'Failed to list agents', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
);

/**
 * 创建 Agent
 */
ipcMain.handle(
  'agents:create',
  async (
    _event: any,
    payload: {
      teamName: string;
      name: string;
      role: string;
      class: string;
      is_vocal: boolean;
      goal_description?: string;
    }
  ) => {
    try {
      console.log('[IPC] agents:create', payload);
      const agent = await teamManager.createAgent(payload.teamName, {
        name: payload.name,
        role: payload.role,
        class: payload.class,
        is_vocal: payload.is_vocal,
        goal_description: payload.goal_description,
      });
      return { success: true, data: agent };
    } catch (error) {
      console.error('[IPC] agents:create error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
);

/**
 * 更新 Agent
 */
ipcMain.handle(
  'agents:update',
  async (
    _event: any,
    payload: {
      teamName: string;
      name: string;
      role?: string;
      goal_description?: string;
    }
  ) => {
    try {
      console.log('[IPC] agents:update', payload);
      await teamManager.updateAgent(payload.teamName, payload.name, {
        role: payload.role,
        goal_description: payload.goal_description,
      });
      return { success: true };
    } catch (error) {
      console.error('[IPC] agents:update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
);

/**
 * 删除 Agent
 */
ipcMain.handle(
  'agents:delete',
  async (_event: any, payload: { teamName: string; name: string }) => {
    try {
      console.log('[IPC] agents:delete', payload);
      await teamManager.deleteAgent(payload.teamName, payload.name);

      // 清理相关的 Agent 会话
      sessionManager.remove(payload.teamName, payload.name);

      return { success: true };
    } catch (error) {
      console.error('[IPC] agents:delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
);

/**
 * 获取单个 Agent
 */
ipcMain.handle(
  'agents:get',
  async (_event: any, payload: { teamName: string; name: string }) => {
    try {
      console.log('[IPC] agents:get', payload);
      const agent = await teamManager.getAgent(payload.teamName, payload.name);
      return { success: true, data: agent };
    } catch (error) {
      console.error('[IPC] agents:get error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
);

/**
 * 获取所有团队和 Agent
 */
ipcMain.handle('teams:get-all', async () => {
  try {
    console.log('[IPC] teams:get-all');
    const teams = await teamManager.getAllTeamsWithAgents();
    return { success: true, data: teams };
  } catch (error) {
    console.error('[IPC] teams:get-all error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

// ============== CWD 管理 ==============

/**
 * 选择工作目录
 */
ipcMain.handle('cwd:select', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择工作目录',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return {
        success: false,
        error: '用户取消选择',
      };
    }

    const selectedPath = result.filePaths[0];
    getLogger().info('cwd:select', 'Directory selected', { path: selectedPath });

    return {
      success: true,
      data: selectedPath,
    };
  } catch (error) {
    getLogger().error('cwd:select', 'Failed to select directory', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

/**
 * 验证工作目录
 */
ipcMain.handle(
  'cwd:validate',
  async (_event: any, payload: { cwd: string }) => {
    try {
      const fs = require('fs');

      if (!fs.existsSync(payload.cwd)) {
        return {
          success: false,
          error: `目录不存在: ${payload.cwd}`,
        };
      }

      const stats = fs.statSync(payload.cwd);
      if (!stats.isDirectory()) {
        return {
          success: false,
          error: `路径不是目录: ${payload.cwd}`,
        };
      }

      return {
        success: true,
        data: payload.cwd,
      };
    } catch (error) {
      getLogger().error('cwd:validate', 'Failed to validate directory', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
);

/**
 * 获取会话的 CWD
 */
ipcMain.handle(
  'cwd:get-session',
  async (_event: any, payload: { teamName: string; agentName: string }) => {
    try {
      const cwd = sessionManager.getSessionCwd(payload.teamName, payload.agentName);

      return {
        success: true,
        data: cwd,
      };
    } catch (error) {
      getLogger().error('cwd:get-session', 'Failed to get session CWD', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
);

/**
 * 获取默认工作目录
 */
ipcMain.handle('cwd:get-default', async () => {
  try {
    const os = require('os');

    // 获取用户主目录
    const homeDir = os.homedir();

    // 在 Windows 上也可以选择当前项目目录
    let defaultDir = homeDir;
    const currentCwd = process.cwd();
    if (currentCwd && currentCwd !== '/') {
      // 如果当前工作目录有效，也可以作为默认值
      defaultDir = currentCwd;
    }

    getLogger().info('cwd:get-default', 'Default CWD provided', { path: defaultDir });

    return {
      success: true,
      data: defaultDir,
    };
  } catch (error) {
    getLogger().error('cwd:get-default', 'Failed to get default CWD', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

// ============== 调试 ==============

getLogger().info('Main', 'Electron main process started', {
  nodeEnv: process.env.NODE_ENV,
  platform: process.platform,
  version: process.version,
});
