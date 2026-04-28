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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
