import { useState, useEffect, useCallback } from 'react';
import type { Message } from '../types';

interface StoredMessage {
  id: number;
  session_id: string;
  role: string;
  content: string;
  timestamp: number;
}

interface UseMessageHistoryReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  loadHistory: (sessionId: string) => Promise<void>;
  appendMessage: (sessionId: string, role: string, content: string) => Promise<void>;
  clearHistory: (teamName: string, sessionId: string) => Promise<void>;
  clearMessages: () => void;
  refresh: (sessionId: string) => Promise<void>;
}

export function useMessageHistory(): UseMessageHistoryReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载会话的消息历史
  const loadHistory = useCallback(async (sessionId: string) => {
    if (!sessionId) {
      setMessages([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await window.electronAPI.messagesList(sessionId);

      if (response.success && response.data) {
        // 转换存储的消息格式为应用使用的格式
        const formattedMessages: Message[] = response.data.map((msg: StoredMessage) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: msg.timestamp
        }));

        setMessages(formattedMessages);
      } else {
        setError(response.error || 'Failed to load message history');
        setMessages([]);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load message history';
      setError(errorMsg);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 添加消息到历史
  const appendMessage = useCallback(async (sessionId: string, role: string, content: string) => {
    if (!sessionId) {
      setError('Session ID is required');
      return;
    }

    try {
      setError(null);

      const response = await window.electronAPI.messagesAppend({
        sessionId,
        role,
        content
      });

      if (response.success) {
        // 重新加载消息历史以获取最新状态
        await loadHistory(sessionId);
      } else {
        setError(response.error || 'Failed to append message');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to append message';
      setError(errorMsg);
    }
  }, [loadHistory]);

  // 清空会话消息
  const clearHistory = useCallback(async (teamName: string, sessionId: string) => {
    if (!teamName || !sessionId) {
      setError('Team name and session ID are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await window.electronAPI.messagesClear({
        teamName,
        sessionId
      });

      if (response.success) {
        setMessages([]);
      } else {
        setError(response.error || 'Failed to clear message history');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to clear message history';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 刷新消息历史
  const refresh = useCallback(async (sessionId: string) => {
    await loadHistory(sessionId);
  }, [loadHistory]);

  // 清空消息显示
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    loadHistory,
    appendMessage,
    clearHistory,
    clearMessages,
    refresh
  };
}