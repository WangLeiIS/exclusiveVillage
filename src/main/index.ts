require('dotenv').config();

const electron = require('electron');
const { app, BrowserWindow } = electron;

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

// Logger
const { logger } = require('../utils/Logger.js');

// 单实例锁 - 确保只运行一个应用实例
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  logger.warn('SingleInstance', 'Another instance is already running, quitting...');
  app.quit();
} else {
  app.on('second-instance', () => {
    logger.info('SingleInstance', 'Second instance detected, focusing main window');
    // 当运行第二个实例时，聚焦到当前窗口
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const win = windows[0];
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

try {
  if (app && app.disableHardwareAcceleration) {
    app.disableHardwareAcceleration();
  }
} catch (error) {
  logger.warn('HardwareAcceleration', 'Failed to disable hardware acceleration', { error });
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
  logger.error('PrimaryAgent', 'Failed to initialize primary agent', { error });
});

// 数据迁移
try {
  app.whenReady().then(async () => {
    logger.info('App', 'Checking for data migration...');
    try {
      const migrationResult = await migrateTo_v0_2_0();
      if (migrationResult.success) {
        logger.info('App', 'Data migration completed successfully');
      } else {
        logger.warn('App', 'Data migration failed', { error: migrationResult.error });
      }
    } catch (error) {
      logger.error('App', 'Data migration error', { error });
    }
  });
} catch (error) {
  logger.error('App', 'Failed to setup app lifecycle', { error });
}

logger.info('Main', 'Electron main process started', {
  nodeEnv: process.env.NODE_ENV,
  platform: process.platform,
  version: process.version,
});
