/**
 * Electron API 类型声明
 */
interface ElectronAPI {
  /**
   * 发送消息
   */
  chat: (
    teamName: string,
    agentName: string,
    message: string,
    cwd: string
  ) => Promise<{
    success: boolean;
    data?: {
      role: 'user' | 'assistant';
      content: string;
      timestamp: number;
    };
    error?: string;
  }>;

  /**
   * 获取对话历史
   */
  getHistory: (
    teamName: string,
    agentName: string
  ) => Promise<{
    success: boolean;
    data?: Array<{
      role: string;
      content: string;
      timestamp: number;
    }>;
    error?: string;
  }>;

  /**
   * 重置对话
   */
  reset: (
    teamName: string,
    agentName: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * 检查 API Key
   */
  checkApiKey: () => Promise<boolean>;

  /**
   * 获取会话列表
   */
  getSessionList: () => Promise<{
    success: boolean;
    data?: string[];
  }>;

  // ============== CWD 管理 ==============

  /**
   * 选择工作目录
   */
  selectCwd: () => Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }>;

  /**
   * 验证工作目录
   */
  validateCwd: (cwd: string) => Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }>;

  /**
   * 获取会话的 CWD
   */
  getSessionCwd: (
    teamName: string,
    agentName: string
  ) => Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }>;

  /**
   * 获取默认工作目录
   */
  getDefaultCwd: () => Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }>;

  // ============== AI 配置管理 ==============

  /**
   * 获取 AI 配置
   */
  getAIConfig: () => Promise<{
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
  }>;

  /**
   * 保存 AI 配置
   */
  saveAIConfig: (config: {
    provider: 'deepseek' | 'anthropic' | 'openai' | 'google';
    model: string;
    apiKeys: {
      deepseek?: string;
      anthropic?: string;
      openai?: string;
      google?: string;
    };
    lastUpdated: number;
  }) => Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * 验证 API Key 格式
   */
  validateAPIKey: (provider: string, key: string) => Promise<{
    valid: boolean;
    error?: string;
  }>;

  /**
   * 重置为默认配置
   */
  resetToDefaults: () => Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * 检查 API Keys 是否已配置
   */
  checkAPIKeysConfigured: () => Promise<{
    success: boolean;
    data?: { hasKeys: boolean; provider: string };
    error?: string;
  }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
