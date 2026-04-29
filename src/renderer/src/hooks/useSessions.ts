import { useState, useEffect, useCallback } from 'react';
import type { Session } from '../types';

interface UseSessionsReturn {
  sessions: Session[];
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
  loadSessions: () => Promise<void>;
  createSession: (directoryPath: string, title?: string) => Promise<Session | null>;
  selectSession: (sessionId: string) => Promise<void>;
  updateSession: (sessionId: string, updates: { title?: string; directoryPath?: string }) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  refresh: () => Promise<void>;
  autoCreateSession: (directoryPath: string, title?: string) => Promise<Session | null>;
  ensureActiveSession: (defaultDirectory?: string) => Promise<void>;
  switchToDirectory: (directoryPath: string) => Promise<void>;
}

export function useSessions(teamName: string | 'primary'): UseSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载会话列表
  const loadSessions = useCallback(async () => {
    if (!teamName) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await window.electronAPI.sessionsList(teamName);

      if (response.success && response.data) {
        setSessions(response.data);
      } else {
        setError(response.error || 'Failed to load sessions');
        setSessions([]);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load sessions';
      setError(errorMsg);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [teamName]);

  // 创建新会话
  const createSession = useCallback(async (directoryPath: string, title?: string) => {
    if (!teamName) {
      setError('Team name is required');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await window.electronAPI.sessionsCreate({
        teamName,
        directoryPath,
        title
      });

      if (response.success && response.data) {
        // 重新加载会话列表
        await loadSessions();
        // 自动选择新创建的会话
        setCurrentSession(response.data);
        return response.data;
      } else {
        setError(response.error || 'Failed to create session');
        return null;
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create session';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [teamName, loadSessions]);

  // 选择会话
  const selectSession = useCallback(async (sessionId: string) => {
    try {
      setError(null);

      const response = await window.electronAPI.sessionsGet(sessionId);

      if (response.success && response.data) {
        setCurrentSession(response.data);
      } else {
        setError(response.error || 'Failed to select session');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to select session';
      setError(errorMsg);
    }
  }, []);

  // 更新会话
  const updateSession = useCallback(async (sessionId: string, updates: { title?: string; directoryPath?: string }) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await window.electronAPI.sessionsUpdate({
        sessionId,
        ...updates
      });

      if (response.success) {
        // 重新加载会话列表
        await loadSessions();
        // 如果更新的是当前会话，也更新当前会话状态
        if (currentSession?.id === sessionId) {
          await selectSession(sessionId);
        }
      } else {
        setError(response.error || 'Failed to update session');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update session';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, loadSessions, selectSession]);

  // 删除会话
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!teamName) {
      setError('Team name is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await window.electronAPI.sessionsDelete({
        teamName,
        sessionId
      });

      if (response.success) {
        // 如果删除的是当前会话，清空当前会话
        if (currentSession?.id === sessionId) {
          setCurrentSession(null);
        }
        // 重新加载会话列表
        await loadSessions();
      } else {
        setError(response.error || 'Failed to delete session');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete session';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [teamName, currentSession, loadSessions]);

  // 刷新会话列表
  const refresh = useCallback(async () => {
    await loadSessions();
  }, [loadSessions]);

  // 为指定目录获取或创建会话（核心方法）
  const autoCreateSession = useCallback(async (directoryPath: string, title?: string) => {
    if (!teamName) {
      setError('Team name is required');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await window.electronAPI.sessionsGetOrCreate({
        teamName,
        directoryPath,
        title
      });

      if (response.success && response.data) {
        // 重新加载会话列表
        await loadSessions();
        // 自动选择会话
        setCurrentSession(response.data);
        return response.data;
      } else {
        setError(response.error || 'Failed to get or create session');
        return null;
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to get or create session';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [teamName, loadSessions]);

  // 确保有活动会话（如果没有则使用默认目录创建）
  const ensureActiveSession = useCallback(async (defaultDirectory?: string) => {
    // 如果已经有活动会话，直接返回
    if (currentSession) {
      console.log('[useSessions] Already has active session:', currentSession.id);
      return;
    }

    // 如果没有默认目录，尝试获取系统默认目录
    let targetDirectory = defaultDirectory;
    if (!targetDirectory) {
      try {
        const cwdResponse = await window.electronAPI.getDefaultCwd();
        if (cwdResponse.success && cwdResponse.data) {
          targetDirectory = cwdResponse.data;
        } else {
          targetDirectory = '.';
        }
      } catch (error) {
        console.warn('[useSessions] Failed to get default CWD, using current directory');
        targetDirectory = '.';
      }
    }

    console.log('[useSessions] Ensuring active session for directory:', targetDirectory);

    // 自动创建或获取会话
    await autoCreateSession(targetDirectory);
  }, [currentSession, autoCreateSession]);

  // 切换到指定目录的会话
  const switchToDirectory = useCallback(async (directoryPath: string) => {
    console.log('[useSessions] Switching to directory:', directoryPath);

    // 检查是否已有该目录的会话
    const existingSession = sessions.find(s => s.directory_path === directoryPath);

    if (existingSession) {
      // 已有会话，直接切换
      console.log('[useSessions] Found existing session:', existingSession.id);
      await selectSession(existingSession.id);
    } else {
      // 没有会话，自动创建
      console.log('[useSessions] No existing session, creating new one');
      await autoCreateSession(directoryPath);
    }
  }, [sessions, selectSession, autoCreateSession]);

  // 当teamName变化时，重新加载会话列表
  useEffect(() => {
    console.log(`[useSessions] TeamName changed to: "${teamName}", reloading sessions`);
    loadSessions();
    // 清空当前选中的会话，确保Agent切换时的会话隔离
    setCurrentSession(null);
  }, [teamName]); // 依赖 teamName，而不是 loadSessions

  return {
    sessions,
    currentSession,
    isLoading,
    error,
    loadSessions,
    createSession,
    selectSession,
    updateSession,
    deleteSession,
    refresh,
    autoCreateSession,
    ensureActiveSession,
    switchToDirectory
  };
}