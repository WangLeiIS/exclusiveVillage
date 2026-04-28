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
});

console.log('[Preload] 预加载脚本已加载');
