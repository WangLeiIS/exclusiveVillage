import { useState, useEffect } from 'react';
import type { Agent, CreateAgentParams, ApiResponse } from '../types';

export function useAgents(currentTeam: string) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string>('');

  useEffect(() => {
    if (currentTeam) {
      loadAgents(currentTeam);
    } else {
      setAgents([]);
      setCurrentAgent('');
    }
  }, [currentTeam]);

  const loadAgents = async (teamName: string) => {
    const response = await window.electronAPI.listAgents(teamName);
    if (response.success && response.data) {
      setAgents(response.data);
      if (response.data.length > 0 && !currentAgent) {
        setCurrentAgent(response.data[0].name);
      }
    }
  };

  const createAgent = async (params: CreateAgentParams): Promise<ApiResponse> => {
    if (!currentTeam) {
      return { success: false, error: 'No team selected' };
    }

    const response = await window.electronAPI.createAgent(currentTeam, params);
    if (response.success) {
      await loadAgents(currentTeam);
    }
    return response;
  };

  return {
    agents,
    currentAgent,
    setCurrentAgent,
    createAgent,
    refreshAgents: () => currentTeam && loadAgents(currentTeam)
  };
}
