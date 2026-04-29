import { contextBridge, ipcRenderer } from 'electron';

/**
 * 暴露给渲染进程的 API
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * 发送消息
   */
  chat: async (
    teamName: string,
    agentName: string,
    message: string,
    cwd: string
  ): Promise<{
    success: boolean;
    data?: { role: string; content: string; timestamp: number };
    error?: string;
  }> => {
    return await ipcRenderer.invoke('chat:send', {
      teamName,
      agentName,
      message,
      cwd,
    });
  },

  /**
   * 获取对话历史
   */
  getHistory: async (
    teamName: string,
    agentName: string
  ): Promise<{
    success: boolean;
    data?: Array<{ role: string; content: string; timestamp: number }>;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('chat:get-history', {
      teamName,
      agentName,
    });
  },

  /**
   * 重置对话
   */
  reset: async (
    teamName: string,
    agentName: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('chat:reset', {
      teamName,
      agentName,
    });
  },

  /**
   * 检查 API Key
   */
  checkApiKey: async (): Promise<boolean> => {
    return await ipcRenderer.invoke('check-api-key');
  },

  /**
   * 获取会话列表
   */
  getSessionList: async (): Promise<{
    success: boolean;
    data?: string[];
  }> => {
    return await ipcRenderer.invoke('sessions:get-list');
  },

  // ============== 团队管理 ==============

  /**
   * 列出所有团队
   */
  listTeams: async (): Promise<{
    success: boolean;
    data?: Array<{
      id: number;
      name: string;
      description: string | null;
      created_at: string;
      agent_count?: number;
    }>;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('teams:list');
  },

  /**
   * 创建团队
   */
  createTeam: async (
    name: string,
    description?: string
  ): Promise<{
    success: boolean;
    data?: { id: number; name: string };
    error?: string;
  }> => {
    return await ipcRenderer.invoke('teams:create', { name, description });
  },

  /**
   * 删除团队
   */
  deleteTeam: async (name: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('teams:delete', { name });
  },

  // ============== Agent 管理 ==============

  /**
   * 列出团队中的 Agent
   */
  listAgents: async (
    teamName: string
  ): Promise<{
    success: boolean;
    data?: Array<{
      id: number;
      name: string;
      role: string;
      class: string;
      status: string;
      is_vocal: boolean;
      coins: number;
      goal_description: string | null;
    }>;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('agents:list', { teamName });
  },

  /**
   * 创建 Agent
   */
  createAgent: async (
    teamName: string,
    agentData: {
      name: string;
      role: string;
      class: string;
      is_vocal: boolean;
      goal_description?: string;
    }
  ): Promise<{
    success: boolean;
    data?: {
      id: number;
      name: string;
      role: string;
      class: string;
      status: string;
      is_vocal: boolean;
      coins: number;
      goal_description: string | null;
    };
    error?: string;
  }> => {
    return await ipcRenderer.invoke('agents:create', {
      teamName,
      ...agentData,
    });
  },

  /**
   * 更新 Agent
   */
  updateAgent: async (
    teamName: string,
    agentName: string,
    updates: {
      role?: string;
      goal_description?: string;
    }
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('agents:update', {
      teamName,
      name: agentName,
      ...updates,
    });
  },

  /**
   * 删除 Agent
   */
  deleteAgent: async (
    teamName: string,
    agentName: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('agents:delete', {
      teamName,
      name: agentName,
    });
  },

  /**
   * 获取单个 Agent
   */
  getAgent: async (
    teamName: string,
    agentName: string
  ): Promise<{
    success: boolean;
    data?: {
      id: number;
      name: string;
      role: string;
      class: string;
      status: string;
      is_vocal: boolean;
      coins: number;
      goal_description: string | null;
    } | null;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('agents:get', {
      teamName,
      name: agentName,
    });
  },

  /**
   * 获取所有团队和 Agent
   */
  getAllTeamsWithAgents: async (): Promise<{
    success: boolean;
    data?: Array<{
      id: number;
      name: string;
      description: string | null;
      created_at: string;
      agents: Array<{
        id: number;
        name: string;
        role: string;
        class: string;
        status: string;
        is_vocal: boolean;
        coins: number;
        goal_description: string | null;
      }>;
    }>;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('teams:get-all');
  },

  // ============== CWD 管理 ==============

  /**
   * 选择工作目录
   */
  selectCwd: async (): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('cwd:select');
  },

  /**
   * 验证工作目录
   */
  validateCwd: async (cwd: string): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('cwd:validate', { cwd });
  },

  /**
   * 获取会话的 CWD
   */
  getSessionCwd: async (
    teamName: string,
    agentName: string
  ): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('cwd:get-session', { teamName, agentName });
  },

  /**
   * 获取默认工作目录
   */
  getDefaultCwd: async (): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('cwd:get-default');
  },

  // ============== AI 配置管理 ==============

  /**
   * 获取 AI 配置
   */
  getAIConfig: async (): Promise<{
    success: boolean;
    data?: {
      provider: 'deepseek' | 'anthropic' | 'openai' | 'google';
      model: string;
      apiKeys: {
        deepseek?: string;
        anthropic?: string;
        openai?: string;
        google?: string;
      };
      lastUpdated: number;
    };
    error?: string;
  }> => {
    return await ipcRenderer.invoke('config:get-ai-config');
  },

  /**
   * 保存 AI 配置
   */
  saveAIConfig: async (
    config: {
      provider: 'deepseek' | 'anthropic' | 'openai' | 'google';
      model: string;
      apiKeys: {
        deepseek?: string;
        anthropic?: string;
        openai?: string;
        google?: string;
      };
      lastUpdated: number;
    }
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('config:save-ai-config', config);
  },

  /**
   * 验证 API Key 格式
   */
  validateAPIKey: async (
    provider: string,
    key: string
  ): Promise<{
    valid: boolean;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('config:validate-api-key', provider, key);
  },

  /**
   * 重置为默认配置
   */
  resetToDefaults: async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('config:reset-to-defaults');
  },

  /**
   * 检查 API Keys 是否已配置
   */
  checkAPIKeysConfigured: async (): Promise<{
    success: boolean;
    data?: { hasKeys: boolean; provider: string };
    error?: string;
  }> => {
    return await ipcRenderer.invoke('config:check-api-keys');
  },

  // ============== 会话管理 ==============

  /**
   * 列出团队的所有会话
   */
  sessionsList: async (
    teamName: string
  ): Promise<{
    success: boolean;
    data?: Array<{
      id: string;
      directory_path: string;
      title: string;
      created_at: number;
      updated_at: number;
      message_count: number;
      team_name: string;
    }>;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('sessions:list', teamName);
  },

  /**
   * 创建新会话
   */
  sessionsCreate: async (
    params: {
      teamName: string;
      directoryPath: string;
      title?: string;
    }
  ): Promise<{
    success: boolean;
    data?: {
      id: string;
      directory_path: string;
      title: string;
      created_at: number;
      updated_at: number;
      message_count: number;
      team_name: string;
    };
    error?: string;
  }> => {
    return await ipcRenderer.invoke('sessions:create', params);
  },

  /**
   * 获取会话详情
   */
  sessionsGet: async (
    sessionId: string
  ): Promise<{
    success: boolean;
    data?: {
      id: string;
      directory_path: string;
      title: string;
      created_at: number;
      updated_at: number;
      message_count: number;
      team_name?: string;
    };
    error?: string;
  }> => {
    return await ipcRenderer.invoke('sessions:get', sessionId);
  },

  /**
   * 更新会话
   */
  sessionsUpdate: async (
    params: {
      sessionId: string;
      title?: string;
      directoryPath?: string;
    }
  ): Promise<{
    success: boolean;
    data?: {
      id: string;
      directory_path: string;
      title: string;
      created_at: number;
      updated_at: number;
      message_count: number;
      team_name?: string;
    };
    error?: string;
  }> => {
    return await ipcRenderer.invoke('sessions:update', params);
  },

  /**
   * 删除会话
   */
  sessionsDelete: async (
    params: {
      teamName: string;
      sessionId: string;
    }
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('sessions:delete', params);
  },

  /**
   * 获取或创建会话（根据目录）
   */
  sessionsGetOrCreate: async (
    params: {
      teamName: string;
      directoryPath: string;
      title?: string;
    }
  ): Promise<{
    success: boolean;
    data?: {
      id: string;
      team_name: string;
      directory_path: string;
      title: string;
      created_at: number;
      updated_at: number;
      message_count: number;
    };
    error?: string;
  }> => {
    return await ipcRenderer.invoke('sessions:get-or-create', params);
  },

  // ============== 消息历史 ==============

  /**
   * 列出会话的所有消息
   */
  messagesList: async (
    sessionId: string
  ): Promise<{
    success: boolean;
    data?: Array<{
      id: number;
      session_id: string;
      role: string;
      content: string;
      timestamp: number;
    }>;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('messages:list', sessionId);
  },

  /**
   * 添加消息到会话
   */
  messagesAppend: async (
    params: {
      sessionId: string;
      role: string;
      content: string;
    }
  ): Promise<{
    success: boolean;
    data?: {
      id: number;
      session_id: string;
      role: string;
      content: string;
      timestamp: number;
    };
    error?: string;
  }> => {
    return await ipcRenderer.invoke('messages:append', params);
  },

  /**
   * 删除消息
   */
  messagesDelete: async (
    params: {
      teamName: string;
      messageId: number;
    }
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('messages:delete', params);
  },

  /**
   * 清空会话消息
   */
  messagesClear: async (
    params: {
      teamName: string;
      sessionId: string;
    }
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('messages:clear', params);
  },

  // ============== 主理人 Agent ==============

  /**
   * 获取主理人Agent信息
   */
  getPrimaryAgent: async (): Promise<{
    success: boolean;
    data?: {
      id: number;
      name: string;
      role: string;
      class: string;
      status: string;
      is_vocal: boolean;
      coins: number;
      goal_description: string | null;
      config?: any;
    };
    error?: string;
  }> => {
    return await ipcRenderer.invoke('primary-agent:get');
  },

  /**
   * 与主理人Agent对话
   */
  primaryAgentChat: async (
    params: {
      message: string;
      cwd?: string;
    }
  ): Promise<{
    success: boolean;
    data?: {
      role: string;
      content: string;
      timestamp: number;
    };
    error?: string;
  }> => {
    return await ipcRenderer.invoke('primary-agent:chat', params);
  },

  /**
   * 获取主理人Agent对话历史
   */
  primaryAgentHistory: async (): Promise<{
    success: boolean;
    data?: Array<{
      role: string;
      content: string;
      timestamp: number;
    }>;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('primary-agent:history');
  },

  /**
   * 重置主理人Agent对话
   */
  primaryAgentReset: async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    return await ipcRenderer.invoke('primary-agent:reset');
  },
});

console.log('[Preload] 预加载脚本已加载');
