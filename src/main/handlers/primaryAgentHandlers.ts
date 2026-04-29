const { ipcMain } = require('electron');
const PrimaryAgentManager = require('../../agent/PrimaryAgentManager');
const { sessionManager } = require('../../agent/SessionManager');

/**
 * 主理人Agent处理器
 */
module.exports = class PrimaryAgentHandlers {
  private primaryAgentManager: any;
  private sessionManager: any;

  constructor() {
    this.primaryAgentManager = new PrimaryAgentManager();
    this.sessionManager = sessionManager;
  }

  /**
   * 注册所有主理人Agent相关的IPC处理器
   */
  registerHandlers() {
    // 获取主理人Agent信息
    ipcMain.handle('primary-agent:get', async () => {
      try {
        console.log('[PrimaryAgentHandlers] Getting primary agent info');

        // 确保主理人Agent已初始化
        const agent = await this.primaryAgentManager.initialize();

        if (!agent) {
          return { success: false, error: 'Primary agent not found' };
        }

        return { success: true, data: agent };
      } catch (error: any) {
        console.error('[PrimaryAgentHandlers] Failed to get primary agent:', error);
        return { success: false, error: error.message };
      }
    });

    // 与主理人Agent对话
    ipcMain.handle('primary-agent:chat', async (event, params: {
      message: string;
      cwd?: string;
    }) => {
      try {
        console.log('[PrimaryAgentHandlers] Chatting with primary agent');

        const { message, cwd } = params;

        // 获取主理人Agent配置
        const agentConfig = this.primaryAgentManager.getConfig();
        const teamName = this.primaryAgentManager.getTeamName();

        // 获取或创建会话
        const agent = await this.sessionManager.getOrCreate(
          teamName,
          agentConfig.name,
          {
            name: agentConfig.displayName,
            role: agentConfig.role,
            systemPrompt: agentConfig.systemPrompt
          },
          cwd || process.cwd()
        );

        // 等待Agent空闲
        while (!agent.isIdle()) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 发送消息并获取回复
        // agent.chat() 返回 { role, content, timestamp }
        const agentResponse = await agent.chat(message);

        return {
          success: true,
          data: agentResponse  // 直接返回 agent.chat() 的结果
        };
      } catch (error: any) {
        console.error('[PrimaryAgentHandlers] Failed to chat with primary agent:', error);
        return { success: false, error: error.message };
      }
    });

    // 获取主理人Agent的对话历史
    ipcMain.handle('primary-agent:history', async () => {
      try {
        console.log('[PrimaryAgentHandlers] Getting primary agent chat history');

        const teamName = this.primaryAgentManager.getTeamName();
        const agentName = this.primaryAgentManager.getConfig().name;

        const agent = await this.sessionManager.getOrCreate(
          teamName,
          agentName,
          {
            name: 'Ren.',
            role: '主理人',
            systemPrompt: this.primaryAgentManager.getConfig().systemPrompt
          },
          process.cwd()
        );

        const history = agent.getHistory();

        return { success: true, data: history };
      } catch (error: any) {
        console.error('[PrimaryAgentHandlers] Failed to get primary agent history:', error);
        return { success: false, error: error.message };
      }
    });

    // 重置主理人Agent的对话
    ipcMain.handle('primary-agent:reset', async () => {
      try {
        console.log('[PrimaryAgentHandlers] Resetting primary agent chat');

        const teamName = this.primaryAgentManager.getTeamName();
        const agentName = this.primaryAgentManager.getConfig().name;

        await this.sessionManager.remove(teamName, agentName);

        return { success: true };
      } catch (error: any) {
        console.error('[PrimaryAgentHandlers] Failed to reset primary agent:', error);
        return { success: false, error: error.message };
      }
    });

    console.log('[PrimaryAgentHandlers] All primary agent handlers registered');
  }

  /**
   * 初始化主理人Agent
   */
  async initialize() {
    try {
      await this.primaryAgentManager.initialize();
      console.log('[PrimaryAgentHandlers] Primary agent initialized successfully');
    } catch (error) {
      console.error('[PrimaryAgentHandlers] Failed to initialize primary agent:', error);
      throw error;
    }
  }
};