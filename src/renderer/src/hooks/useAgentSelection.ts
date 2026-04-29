import { useState, useCallback, useMemo } from 'react';
import type { AgentSelection, Team } from '../types';

interface UseAgentSelectionReturn {
  selection: AgentSelection;
  currentTeam: string | null;
  isPrimaryAgent: boolean;
  selectPrimaryAgent: () => void;
  selectTeam: (teamName: string) => void;
  getCurrentAgentName: (primaryAgentName?: string) => string;
  canChat: () => boolean;
}

export function useAgentSelection(initialTeam?: string): UseAgentSelectionReturn {
  const [selection, setSelection] = useState<AgentSelection>(() => {
    if (initialTeam) {
      return { type: 'team', teamName: initialTeam };
    }
    return { type: 'primary' };
  });

  const currentTeam = useMemo(() => {
    return selection.type === 'team' ? selection.teamName || null : null;
  }, [selection]);

  const isPrimaryAgent = useMemo(() => {
    return selection.type === 'primary';
  }, [selection]);

  const selectPrimaryAgent = useCallback(() => {
    setSelection({ type: 'primary' });
  }, []);

  const selectTeam = useCallback((teamName: string) => {
    setSelection({ type: 'team', teamName });
  }, []);

  const getCurrentAgentName = useCallback((primaryAgentName?: string) => {
    if (selection.type === 'primary') {
      return primaryAgentName || '任我行';
    }
    return selection.teamName ? `${selection.teamName}-assistant` : '';
  }, [selection]);

  const canChat = useCallback(() => {
    if (selection.type === 'primary') {
      return true; // 主理人Agent总是可以对话
    }
    return !!selection.teamName;
  }, [selection]);

  return {
    selection,
    currentTeam,
    isPrimaryAgent,
    selectPrimaryAgent,
    selectTeam,
    getCurrentAgentName,
    canChat
  };
}