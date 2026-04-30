import { contextBridge, ipcRenderer } from 'electron';

try {
  // ==================== 聊天相关 API ====================
  const chatAPI = {
    chat: async (
      teamName: string,
      agentName: string,
      message: string,
      cwd: string,
      userSessionId?: string
    ) => {
      return await ipcRenderer.invoke('chat:send', {
        teamName,
        agentName,
        message,
        cwd,
        userSessionId,
      });
    },

    getHistory: async (teamName: string, agentName: string) => {
      return await ipcRenderer.invoke('chat:get-history', {
        teamName,
        agentName,
      });
    },

    reset: async (teamName: string, agentName: string) => {
      return await ipcRenderer.invoke('chat:reset', {
        teamName,
        agentName,
      });
    },

    checkApiKey: async () => {
      return await ipcRenderer.invoke('check-api-key');
    },

    getSessionList: async () => {
      return await ipcRenderer.invoke('sessions:get-list');
    },
  };

  // ==================== 团队管理 API ====================
  const teamsAPI = {
    listTeams: async () => {
      return await ipcRenderer.invoke('teams:list');
    },

    createTeam: async (name: string, description?: string) => {
      return await ipcRenderer.invoke('teams:create', { name, description });
    },

    deleteTeam: async (name: string) => {
      return await ipcRenderer.invoke('teams:delete', { name });
    },

    getAllTeamsWithAgents: async () => {
      return await ipcRenderer.invoke('teams:get-all');
    },
  };

  // ==================== Agent 管理 API ====================
  const agentsAPI = {
    listAgents: async (teamName: string) => {
      return await ipcRenderer.invoke('agents:list', { teamName });
    },

    createAgent: async (teamName: string, agentData: any) => {
      return await ipcRenderer.invoke('agents:create', {
        teamName,
        ...agentData,
      });
    },

    updateAgent: async (teamName: string, agentName: string, updates: any) => {
      return await ipcRenderer.invoke('agents:update', {
        teamName,
        name: agentName,
        ...updates,
      });
    },

    deleteAgent: async (teamName: string, agentName: string) => {
      return await ipcRenderer.invoke('agents:delete', {
        teamName,
        name: agentName,
      });
    },

    getAgent: async (teamName: string, agentName: string) => {
      return await ipcRenderer.invoke('agents:get', {
        teamName,
        name: agentName,
      });
    },
  };

  // ==================== 会话管理 API ====================
  const sessionsAPI = {
    sessionsList: async (teamName: string) => {
      return await ipcRenderer.invoke('sessions:list', teamName);
    },

    sessionsCreate: async (params: any) => {
      return await ipcRenderer.invoke('sessions:create', params);
    },

    sessionsGet: async (sessionId: string) => {
      return await ipcRenderer.invoke('sessions:get', sessionId);
    },

    sessionsUpdate: async (params: any) => {
      return await ipcRenderer.invoke('sessions:update', params);
    },

    sessionsDelete: async (params: any) => {
      return await ipcRenderer.invoke('sessions:delete', params);
    },

    sessionsGetOrCreate: async (params: any) => {
      return await ipcRenderer.invoke('sessions:get-or-create', params);
    },
  };

  // ==================== 消息历史 API ====================
  const messagesAPI = {
    messagesList: async (sessionId: string) => {
      return await ipcRenderer.invoke('messages:list', sessionId);
    },

    messagesAppend: async (params: any) => {
      return await ipcRenderer.invoke('messages:append', params);
    },

    messagesDelete: async (params: any) => {
      return await ipcRenderer.invoke('messages:delete', params);
    },

    messagesClear: async (params: any) => {
      return await ipcRenderer.invoke('messages:clear', params);
    },
  };

  // ==================== AI 配置管理 API ====================
  const configAPI = {
    getAIConfig: async () => {
      return await ipcRenderer.invoke('config:get-ai-config');
    },

    saveAIConfig: async (config: any) => {
      return await ipcRenderer.invoke('config:save-ai-config', config);
    },

    validateAPIKey: async (provider: string, key: string) => {
      return await ipcRenderer.invoke('config:validate-api-key', provider, key);
    },

    resetToDefaults: async () => {
      return await ipcRenderer.invoke('config:reset-to-defaults');
    },

    checkAPIKeysConfigured: async () => {
      return await ipcRenderer.invoke('config:check-api-keys');
    },
  };

  // ==================== CWD 管理 API ====================
  const cwdAPI = {
    selectCwd: async () => {
      return await ipcRenderer.invoke('cwd:select');
    },

    validateCwd: async (cwd: string) => {
      return await ipcRenderer.invoke('cwd:validate', { cwd });
    },

    getSessionCwd: async (teamName: string, agentName: string) => {
      return await ipcRenderer.invoke('cwd:get-session', { teamName, agentName });
    },

    getDefaultCwd: async () => {
      return await ipcRenderer.invoke('cwd:get-default');
    },
  };

  // ==================== 主理人 Agent API ====================
  const primaryAgentAPI = {
    getPrimaryAgent: async () => {
      return await ipcRenderer.invoke('primary-agent:get');
    },

    primaryAgentChat: async (params: any) => {
      return await ipcRenderer.invoke('primary-agent:chat', params);
    },

    primaryAgentHistory: async () => {
      return await ipcRenderer.invoke('primary-agent:history');
    },

    primaryAgentReset: async () => {
      return await ipcRenderer.invoke('primary-agent:reset');
    },
  };

  // 合并所有API
  const electronAPI = {
    ...chatAPI,
    ...teamsAPI,
    ...agentsAPI,
    ...sessionsAPI,
    ...messagesAPI,
    ...configAPI,
    ...cwdAPI,
    ...primaryAgentAPI,
  };

  // 暴露到渲染进程
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);

} catch (error) {
  console.error('[Preload] 加载失败:', error);
}
