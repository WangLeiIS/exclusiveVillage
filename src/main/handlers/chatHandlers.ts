const { ipcMain } = require('electron');
const { sessionManager } = require('../../agent/SessionManager.js');
const { getLogger } = require('../utils/logger.js');

export function registerChatHandlers() {
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

  ipcMain.handle('check-api-key', async () => {
    const hasKey = !!(
      process.env.DEEPSEEK_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GOOGLE_API_KEY
    );

    return hasKey;
  });

  ipcMain.handle('sessions:get-list', async () => {
    return {
      success: true,
      data: sessionManager.getActiveSessions(),
    };
  });
}
