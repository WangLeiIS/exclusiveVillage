require('dotenv').config();

const electron = require('electron');
// 临时注释掉单实例锁功能，因为Electron 30可能有兼容性问题
// const { app, BrowserWindow } = electron;

// 处理其他CommonJS模块
const { setupAppLifecycle } = require('./windowManager.js');
const { registerChatHandlers } = require('./handlers/chatHandlers.js');
const { registerTeamHandlers } = require('./handlers/teamHandlers.js');
const { registerAgentHandlers } = require('./handlers/agentHandlers.js');
const { registerCwdHandlers } = require('./handlers/cwdHandlers.js');
const { registerConfigHandlers } = require('./handlers/configHandlers.js');
const SessionHandlersClass = require('./handlers/sessionHandlers.js');
const MessageHandlersClass = require('./handlers/messageHandlers.js');
const PrimaryAgentHandlersClass = require('./handlers/primaryAgentHandlers.js');

// 数据迁移
const { migrateTo_v0_2_0 } = require('./migrations/migrateTo_v0.2.0');

// 临时禁用单实例锁来调试Electron模块导入问题
// TODO: 升级Electron版本或找到正确的导入方式后重新启用
/*
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // 当运行第二个实例时，聚焦到当前窗口
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const win = windows[0];
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}
*/

try {
  const { app } = electron;
  if (app && app.disableHardwareAcceleration) {
    app.disableHardwareAcceleration();
  }
} catch (error) {
  console.log('Failed to disable hardware acceleration:', error);
}

setupAppLifecycle();
registerChatHandlers();
registerTeamHandlers();
registerAgentHandlers();
registerCwdHandlers();
registerConfigHandlers();

// 注册新的handlers
const sessionHandlers = new SessionHandlersClass();
sessionHandlers.registerHandlers();

const messageHandlers = new MessageHandlersClass();
messageHandlers.registerHandlers();

const primaryAgentHandlers = new PrimaryAgentHandlersClass();
primaryAgentHandlers.registerHandlers();

// 初始化主理人Agent
primaryAgentHandlers.initialize().catch((error: Error) => {
  console.error('Failed to initialize primary agent:', error);
});

// 数据迁移
try {
  const { app } = electron;
  app.whenReady().then(async () => {
    console.log('[App] Checking for data migration...');
    try {
      const migrationResult = await migrateTo_v0_2_0();
      if (migrationResult.success) {
        console.log('[App] Data migration completed successfully');
      } else {
        console.warn('[App] Data migration failed:', migrationResult.error);
      }
    } catch (error) {
      console.error('[App] Data migration error:', error);
    }
  });
} catch (error) {
  console.error('Failed to setup app lifecycle:', error);
}

const { logger } = require('../utils/Logger.js');
logger.info('Main', 'Electron main process started', {
  nodeEnv: process.env.NODE_ENV,
  platform: process.platform,
  version: process.version,
});
