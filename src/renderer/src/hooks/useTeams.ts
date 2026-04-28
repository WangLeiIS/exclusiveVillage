import { useState, useEffect } from 'react';
import type { Team, ApiResponse } from '../types';

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<string>('');

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    const response = await window.electronAPI.listTeams();
    if (response.success && response.data) {
      setTeams(response.data);
    }
  };

  const createTeam = async (name: string, description: string): Promise<ApiResponse> => {
    const response = await window.electronAPI.createTeam(name, description);
    if (response.success) {
      await loadTeams();
      setCurrentTeam(name);
    }
    return response;
  };

  const deleteTeam = async (name: string): Promise<ApiResponse> => {
    const response = await window.electronAPI.deleteTeam(name);
    if (response.success) {
      setTeams(teams.filter(t => t.name !== name));
      if (currentTeam === name) {
        setCurrentTeam('');
      }
    }
    return response;
  };

  return {
    teams,
    currentTeam,
    setCurrentTeam,
    createTeam,
    deleteTeam,
    refreshTeams: loadTeams
  };
}
