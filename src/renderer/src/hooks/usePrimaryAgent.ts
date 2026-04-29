import { useState, useEffect } from 'react';

interface PrimaryAgent {
  id: number;
  name: string;
  role: string;
  class: string;
  status: string;
  is_vocal: boolean;
  coins: number;
  goal_description: string | null;
  config?: any;
}

interface UsePrimaryAgentReturn {
  primaryAgent: PrimaryAgent | null;
  isLoading: boolean;
  error: string | null;
  chat: (message: string, cwd?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  getHistory: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
  reset: () => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

export function usePrimaryAgent(): UsePrimaryAgentReturn {
  const [primaryAgent, setPrimaryAgent] = useState<PrimaryAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载主理人Agent信息
  const loadPrimaryAgent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await window.electronAPI.getPrimaryAgent();

      if (response.success && response.data) {
        setPrimaryAgent(response.data);
      } else {
        setError(response.error || 'Failed to load primary agent');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load primary agent');
    } finally {
      setIsLoading(false);
    }
  };

  // 与主理人Agent对话
  const chat = async (message: string, cwd?: string) => {
    try {
      setError(null);

      if (!primaryAgent) {
        return { success: false, error: 'Primary agent not loaded' };
      }

      const response = await window.electronAPI.primaryAgentChat({
        message,
        cwd: cwd || process.cwd?.() || '.'
      });

      if (!response.success) {
        setError(response.error || 'Failed to chat with primary agent');
      }

      return response;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to chat with primary agent';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // 获取对话历史
  const getHistory = async () => {
    try {
      setError(null);

      const response = await window.electronAPI.primaryAgentHistory();

      if (!response.success) {
        setError(response.error || 'Failed to get chat history');
      }

      return response;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to get chat history';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // 重置对话
  const reset = async () => {
    try {
      setError(null);

      const response = await window.electronAPI.primaryAgentReset();

      if (!response.success) {
        setError(response.error || 'Failed to reset chat');
      }

      return response;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to reset chat';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // 刷新主理人Agent信息
  const refresh = async () => {
    await loadPrimaryAgent();
  };

  // 组件挂载时加载主理人Agent
  useEffect(() => {
    loadPrimaryAgent();
  }, []);

  return {
    primaryAgent,
    isLoading,
    error,
    chat,
    getHistory,
    reset,
    refresh
  };
}