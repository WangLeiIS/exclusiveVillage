import { useEffect } from 'react';

/**
 * 自动管理会话的创建和选择
 * 当切换 Agent 时自动选择最近会话或创建默认会话
 */
export function useSessionAutoManager(args: UseSessionAutoManagerArgs) {
  const {
    selectionKey,
    sessions,
    sessionsLoading,
    currentSession,
    currentTeam,
    isPrimaryAgent,
    currentCwd,
    selectSession,
    createSession
  } = args;

  useEffect(() => {
    const autoSelectOrCreateSession = async () => {
      // 如果没有选择agent，跳过
      if (selectionKey === '__no_team__') {
        return;
      }

      // 如果已经在加载会话，等待加载完成
      if (sessionsLoading) {
        console.log('[useSessionAutoManager] Sessions loading, waiting...');
        return;
      }

      // 如果已经有当前会话，不需要操作
      if (currentSession) {
        console.log('[useSessionAutoManager] Already has active session:', currentSession.id);
        return;
      }

      console.log('[useSessionAutoManager] Auto-selecting session for agent:', selectionKey);

      // 如果有会话列表，选择最近的一个
      if (sessions.length > 0) {
        const sortedSessions = [...sessions].sort((a, b) => b.updated_at - a.updated_at);
        const mostRecentSession = sortedSessions[0];
        console.log(
          '[useSessionAutoManager] Auto-selecting most recent session:',
          mostRecentSession.id,
          'title:',
          mostRecentSession.title
        );
        await selectSession(mostRecentSession.id);
        return;
      }

      // 如果没有会话，创建一个默认会话
      if (sessions.length === 0 && (currentTeam || isPrimaryAgent)) {
        console.log(
          '[useSessionAutoManager] No sessions found, creating default session for agent:',
          selectionKey
        );

        // 获取默认工作目录
        let defaultDirectory = currentCwd;
        if (!defaultDirectory) {
          try {
            const cwdResponse = await window.electronAPI.getDefaultCwd();
            if (cwdResponse.success && cwdResponse.data) {
              defaultDirectory = cwdResponse.data;
            } else {
              defaultDirectory = '.';
            }
          } catch (error) {
            console.warn('[useSessionAutoManager] Failed to get default CWD, using current directory');
            defaultDirectory = '.';
          }
        }

        console.log('[useSessionAutoManager] Creating default session with directory:', defaultDirectory);

        // 创建默认会话
        const newSession = await createSession(defaultDirectory);
        if (newSession) {
          console.log('[useSessionAutoManager] Default session created successfully:', newSession.id);
        } else {
          console.error('[useSessionAutoManager] Failed to create default session');
        }
      }
    };

    autoSelectOrCreateSession();
  }, [
    selectionKey,
    sessions,
    sessionsLoading,
    currentSession,
    currentTeam,
    isPrimaryAgent,
    currentCwd,
    selectSession,
    createSession
  ]);
}

interface UseSessionAutoManagerArgs {
  selectionKey: string;
  sessions: any[];
  sessionsLoading: boolean;
  currentSession: any;
  currentTeam: string | null;
  isPrimaryAgent: boolean;
  currentCwd: string;
  selectSession: (sessionId: string) => Promise<void>;
  createSession: (directoryPath: string) => Promise<any>;
}
