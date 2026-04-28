const { ipcMain, dialog } = require('electron');
const { sessionManager } = require('../../agent/SessionManager.js');
const { getLogger } = require('../utils/logger.js');

export function registerCwdHandlers() {
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

  ipcMain.handle('cwd:get-default', async () => {
    try {
      const os = require('os');

      const homeDir = os.homedir();

      let defaultDir = homeDir;
      const currentCwd = process.cwd();
      if (currentCwd && currentCwd !== '/') {
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
}
