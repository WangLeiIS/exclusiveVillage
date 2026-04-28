require('dotenv').config();

const electron = require('electron');
const app = electron.app;

const { setupAppLifecycle } = require('./windowManager.js');
const { registerChatHandlers } = require('./handlers/chatHandlers.js');
const { registerTeamHandlers } = require('./handlers/teamHandlers.js');
const { registerAgentHandlers } = require('./handlers/agentHandlers.js');
const { registerCwdHandlers } = require('./handlers/cwdHandlers.js');

try {
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

const { logger } = require('../utils/Logger.js');
logger.info('Main', 'Electron main process started', {
  nodeEnv: process.env.NODE_ENV,
  platform: process.platform,
  version: process.version,
});
