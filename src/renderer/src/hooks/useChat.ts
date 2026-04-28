import { useState } from 'react';
import type { Message, ApiResponse } from '../types';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (
    teamName: string,
    agentName: string,
    content: string,
    cwd: string
  ): Promise<ApiResponse<Message>> => {
    setLoading(true);
    try {
      const response = await window.electronAPI.chat(teamName, agentName, content, cwd);

      if (response.success && response.data) {
        setMessages(prev => [...prev, response.data!]);
      } else {
        throw new Error(response.error || 'Send failed');
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: Date.now()
      }]);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      role: 'user',
      content,
      timestamp: Date.now()
    }]);
  };

  const resetChat = async (teamName: string, agentName: string) => {
    try {
      await window.electronAPI.reset(teamName, agentName);
      setMessages([]);
    } catch (error) {
      console.error('Reset failed:', error);
      throw error;
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    addUserMessage,
    resetChat
  };
}
