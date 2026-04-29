import { useAppTranslation } from '../i18n/useTranslation';
import {
  logSessionSwitch,
  cleanupSessionState,
  validateSessionIsolation
} from '../utils/sessionValidation';

/**
 * 聊天相关事件处理器集合
 */
export function useChatHandlers(args: ChatHandlersArgs) {
  const { t } = useAppTranslation();

  const {
    // State
    currentTeam,
    isPrimaryAgent,
    currentSession,
    currentCwd,
    selectionKey,
    primaryAgent,
    canChat,
    // Session & Chat operations
    selectSession,
    createSession,
    deleteSession,
    loadHistory,
    clearMessages,
    appendMessage,
    clearHistory,
    // Chat operations
    sendMessage,
    addUserMessage,
    resetChat,
    // Team operations
    selectTeam,
    selectPrimaryAgent,
    createTeam,
    deleteTeam,
    // Workspace
    setCurrentCwd,
    getValidDefaultDirectory
  } = args;

  /**
   * 发送消息处理
   */
  const handleSendMessage = async (input: string, setInput: (value: string) => void) => {
    if (!canChat()) {
      alert(t('chat.placeholder.noTeam'));
      return;
    }

    // 优先使用 currentSession.directory_path
    let effectiveCwd = currentCwd;

    if (currentSession && currentSession.directory_path) {
      effectiveCwd = currentSession.directory_path;
      console.log('[handleSendMessage] Using session directory_path:', effectiveCwd);
    }

    // 验证 CWD
    if (!effectiveCwd || !effectiveCwd.trim()) {
      try {
        const response = await window.electronAPI.getDefaultCwd();
        if (response.success && response.data && response.data.trim()) {
          effectiveCwd = response.data;
          setCurrentCwd(response.data);
        } else {
          const homeDir = process.env.HOME || process.env.USERPROFILE || '';
          effectiveCwd = homeDir;
          setCurrentCwd(homeDir);
        }
      } catch (error) {
        console.error('获取默认目录失败:', error);
        const homeDir = process.env.HOME || process.env.USERPROFILE || '';
        effectiveCwd = homeDir;
        setCurrentCwd(homeDir);
      }
      alert('请先选择工作目录');
      return;
    }

    // 确保有活跃会话
    let activeSession = currentSession;
    if (!activeSession) {
      const newSession = await createSession(effectiveCwd);
      if (newSession) {
        activeSession = newSession;
      } else {
        alert('无法创建会话，请稍后重试');
        return;
      }
    }

    const userMessage = input;
    setInput('');
    addUserMessage(userMessage);

    try {
      if (isPrimaryAgent) {
        // 与主理人Agent对话
        const primaryAgentResponse = await (window as any).electronAPI.primaryAgentChat({
          message: userMessage,
          cwd: effectiveCwd,
          userSessionId: activeSession?.id
        });

        if (primaryAgentResponse.success && primaryAgentResponse.data) {
          if (activeSession) {
            await appendMessage(activeSession.id, 'user', userMessage);
            await appendMessage(activeSession.id, 'assistant', primaryAgentResponse.data.content);
          }
        } else {
          throw new Error(primaryAgentResponse.error || '发送消息失败');
        }
      } else {
        // 与团队Agent对话
        const response = await sendMessage(
          currentTeam || '',
          `${currentTeam}-assistant`,
          userMessage,
          effectiveCwd,
          activeSession?.id
        );

        if (activeSession) {
          await appendMessage(activeSession.id, 'user', userMessage);
          if (response && response.data) {
            await appendMessage(activeSession.id, 'assistant', response.data.content);
          }
        }
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      alert(`${t('status.error')}: ${error}`);
    }
  };

  /**
   * 重置对话处理
   */
  const handleResetChat = async () => {
    if ((!currentTeam && !isPrimaryAgent) || !currentSession) return;

    try {
      if (isPrimaryAgent) {
        await (window as any).electronAPI.primaryAgentReset();
      } else {
        await resetChat(currentTeam || '', `${currentTeam}-assistant`);
      }

      await clearHistory(isPrimaryAgent ? '__primary__' : currentTeam || '', currentSession.id);
    } catch (error) {
      console.error('重置失败:', error);
      alert(`${t('status.error')}: ${error}`);
    }
  };

  /**
   * Agent 切换处理
   */
  const handleSelectTeam = async (teamName: string | 'primary') => {
    const previousAgent = currentTeam;
    const previousIsPrimary = isPrimaryAgent;

    console.log('[handleSelectTeam] Switching agent from:', previousAgent, 'to:', teamName);

    // 记录会话切换
    logSessionSwitch(
      previousAgent || '',
      teamName === 'primary' ? 'primary' : teamName,
      previousIsPrimary,
      teamName === 'primary',
      currentSession?.id || null
    );

    // 清理会话状态
    cleanupSessionState();
    clearMessages();

    if (teamName === 'primary') {
      selectPrimaryAgent();
    } else {
      selectTeam(teamName);
    }

    console.log('[handleSelectTeam] Agent switch completed');
  };

  /**
   * 会话选择处理
   */
  const handleSessionSelect = async (sessionId: string) => {
    console.log('[handleSessionSelect] Selecting session:', sessionId, 'for agent:', selectionKey);

    // 验证会话隔离
    const validation = validateSessionIsolation(sessionId, selectionKey, isPrimaryAgent);
    if (!validation.isValid) {
      console.error('[handleSessionSelect] Session validation failed:', validation.errors);
      return;
    }

    await selectSession(sessionId);
  };

  /**
   * 会话创建处理
   */
  const handleSessionCreate = async (directoryPath: string) => {
    console.log('[handleSessionCreate] Creating session for agent:', selectionKey, 'in directory:', directoryPath);

    if (selectionKey === '__no_team__') {
      alert('请先选择一个AI助手再创建会话');
      return;
    }

    const newSession = await createSession(directoryPath);
    if (newSession) {
      console.log('[handleSessionCreate] Session created successfully:', newSession.id);
    } else {
      console.error('[handleSessionCreate] Failed to create session');
    }
  };

  /**
   * 会话删除处理
   */
  const handleSessionDelete = async (sessionId: string) => {
    console.log('[handleSessionDelete] Deleting session:', sessionId, 'for agent:', selectionKey);

    // 验证会话删除
    const validation = validateSessionIsolation(sessionId, selectionKey, isPrimaryAgent);
    if (!validation.isValid) {
      console.error('[handleSessionDelete] Session validation failed:', validation.errors);
      return;
    }

    await deleteSession(sessionId);
  };

  /**
   * 创建团队处理
   */
  const handleCreateTeam = async (name: string, description: string) => {
    const response = await createTeam(name, description);
    if (response.success) {
      // 自动选择新创建的团队
      selectTeam(name);
      return { success: true };
    } else {
      alert(`${t('status.error')}: ${response.error}`);
      return { success: false, error: response.error };
    }
  };

  /**
   * 删除团队处理
   */
  const handleDeleteTeam = async (name: string) => {
    if (!confirm(t('team.deleteConfirm', { name }))) {
      return { success: false, error: 'User cancelled' };
    }

    const response = await deleteTeam(name);
    if (response.success) {
      // 如果删除的是当前选择的团队，切换到主理人
      if (currentTeam === name) {
        selectPrimaryAgent();
      }
      return { success: true };
    } else {
      alert(`${t('status.error')}: ${response.error}`);
      return { success: false, error: response.error };
    }
  };

  return {
    handleSendMessage,
    handleResetChat,
    handleSelectTeam,
    handleSessionSelect,
    handleSessionCreate,
    handleSessionDelete,
    handleCreateTeam,
    handleDeleteTeam
  };
}

interface ChatHandlersArgs {
  // State
  currentTeam: string | null;
  isPrimaryAgent: boolean;
  currentSession: any;
  currentCwd: string;
  selectionKey: string;
  primaryAgent: any;
  canChat: () => boolean;

  // Session operations
  selectSession: (sessionId: string) => Promise<void>;
  createSession: (directoryPath: string) => Promise<any>;
  deleteSession: (sessionId: string) => Promise<void>;
  loadHistory: (sessionId: string) => void;
  clearMessages: () => void;
  appendMessage: (sessionId: string, role: string, content: string) => Promise<void>;
  clearHistory: (agentKey: string, sessionId: string) => Promise<void>;

  // Chat operations
  sendMessage: any;
  addUserMessage: (message: string) => void;
  resetChat: any;

  // Team operations
  selectTeam: (teamName: string) => void;
  selectPrimaryAgent: () => void;
  createTeam: (name: string, description: string) => Promise<any>;
  deleteTeam: (name: string) => Promise<any>;

  // Workspace
  setCurrentCwd: (cwd: string) => void;
  getValidDefaultDirectory: () => Promise<string>;
}
