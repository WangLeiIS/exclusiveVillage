import { useState, useEffect, useMemo } from 'react';
import './App.css';
import { useAppTranslation } from './i18n/useTranslation';

// Layout components
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { SessionSidebar } from './components/layout/SessionSidebar';

// Feature components
import { ChatArea } from './components/chat/ChatArea';
import { TeamModal } from './components/teams/TeamModal';
import { SettingsPage } from './pages/SettingsPage';

// UI Components
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Hooks
import { useTeams } from './hooks/useTeams';
import { usePrimaryAgent } from './hooks/usePrimaryAgent';
import { useSessions } from './hooks/useSessions';
import { useMessageHistory } from './hooks/useMessageHistory';
import { useChat } from './hooks/useChat';
import { useAgentSelection } from './hooks/useAgentSelection';

// Utils
import { logSessionSwitch, cleanupSessionState, validateSessionIsolation } from './utils/sessionValidation';

// Types
import type { AIConfig } from './types';

type Page = 'chat' | 'settings';

function App() {
  const { t } = useAppTranslation();
  const [currentPage, setCurrentPage] = useState<Page>('chat');
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [apiKeySet, setApiKeySet] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);

  // 统一的Agent选择状态管理
  const {
    currentTeam,
    isPrimaryAgent,
    selectPrimaryAgent,
    selectTeam,
    getCurrentAgentName,
    canChat
  } = useAgentSelection();

  // 主理人Agent
  const { primaryAgent } = usePrimaryAgent();

  // 团队管理
  const {
    teams,
    createTeam,
    deleteTeam
  } = useTeams();

  // 会话管理 - 使用统一的选择状态
  const selectionKey = useMemo(() => {
    // 确保始终有一个有效的 teamName 用于会话隔离
    if (isPrimaryAgent) {
      return '__primary__'; // 主理人Agent的专用命名空间
    } else if (currentTeam && currentTeam.trim()) {
      return currentTeam.trim(); // 团队Agent的命名空间
    } else {
      // 如果没有选择任何团队，返回一个特殊标识符
      console.warn('[App] No valid team selected for session management');
      return '__no_team__'; // 特殊标识符，表示没有选择团队
    }
  }, [isPrimaryAgent, currentTeam]);

  const {
    sessions,
    currentSession,
    selectSession,
    createSession,
    deleteSession,
    ensureActiveSession,
    autoCreateSession,
    isLoading: sessionsLoading
  } = useSessions(selectionKey);

  // 消息历史管理
  const { messages, loadHistory, appendMessage, clearHistory, clearMessages } = useMessageHistory();

  // 对话管理（保留原有逻辑）
  const {
    loading,
    sendMessage,
    addUserMessage,
    resetChat
  } = useChat();

  // 工作目录状态
  const [currentCwd, setCurrentCwd] = useState<string>('');
  const [input, setInput] = useState<string>('');

  // Effects
  useEffect(() => {
    const checkApiKey = async () => {
      const hasKey = await window.electronAPI.checkApiKey();
      setApiKeySet(hasKey);
    };
    checkApiKey();
  }, []);

  // 加载 AI 配置
  useEffect(() => {
    const loadAIConfig = async () => {
      try {
        const response = await window.electronAPI.getAIConfig();
        if (response.success && response.data) {
          setAiConfig(response.data);
          setApiKeySet(!!response.data.apiKeys[response.data.provider]);
        }
      } catch (error) {
        console.error('加载 AI 配置失败:', error);
      }
    };
    loadAIConfig();
  }, []);

  // 当选择会话时，加载消息历史
  useEffect(() => {
    if (currentSession) {
      console.log('[App] Loading message history for session:', currentSession.id, 'title:', currentSession.title);
      loadHistory(currentSession.id);
    } else {
      console.log('[App] No session selected, clearing messages');
      // 当没有选择会话时，清空消息，确保不同Agent间的消息隔离
      clearMessages();
    }
  }, [currentSession, loadHistory, clearMessages]);

  // 设置默认工作目录
  useEffect(() => {
    const setDefaultCwd = async () => {
      if ((currentTeam || isPrimaryAgent) && !currentCwd) {
        try {
          const response = await window.electronAPI.getDefaultCwd();
          if (response.success && response.data) {
            console.log('设置默认工作目录:', response.data);
            setCurrentCwd(response.data);
          }
        } catch (error) {
          console.error('获取默认目录失败:', error);
        }
      }
    };

    setDefaultCwd();
  }, [currentTeam, isPrimaryAgent, currentCwd]);

  // 自动选择或创建会话 - 当切换agent时
  useEffect(() => {
    const autoSelectOrCreateSession = async () => {
      // 如果没有选择agent，跳过
      if (selectionKey === '__no_team__') {
        return;
      }

      // 如果已经在加载会话，等待加载完成
      if (sessionsLoading) {
        console.log('[App] Sessions loading, waiting...');
        return;
      }

      // 如果已经有当前会话，不需要操作
      if (currentSession) {
        console.log('[App] Already has active session:', currentSession.id);
        return;
      }

      console.log('[App] Auto-selecting session for agent:', selectionKey);

      // 如果有会话列表，选择最近的一个
      if (sessions.length > 0) {
        // 按updated_at排序，选择最近的一个
        const sortedSessions = [...sessions].sort((a, b) => b.updated_at - a.updated_at);
        const mostRecentSession = sortedSessions[0];
        console.log('[App] Auto-selecting most recent session:', mostRecentSession.id, 'title:', mostRecentSession.title);
        await selectSession(mostRecentSession.id);
        return;
      }

      // 如果没有会话，创建一个默认会话
      if (sessions.length === 0 && (currentTeam || isPrimaryAgent)) {
        console.log('[App] No sessions found, creating default session for agent:', selectionKey);

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
            console.warn('[App] Failed to get default CWD, using current directory');
            defaultDirectory = '.';
          }
        }

        console.log('[App] Creating default session with directory:', defaultDirectory);

        // 创建默认会话
        const newSession = await createSession(defaultDirectory);
        if (newSession) {
          console.log('[App] Default session created successfully:', newSession.id);
        } else {
          console.error('[App] Failed to create default session');
        }
      }
    };

    autoSelectOrCreateSession();
  }, [selectionKey, sessions, sessionsLoading, currentSession, currentTeam, isPrimaryAgent, currentCwd, selectSession, createSession]);

  // Event handlers
  const handleSendMessage = async () => {
    if (!canChat()) {
      alert(t('chat.placeholder.noTeam'));
      return;
    }

    // 如果没有设置 CWD，显示选择器（这里暂时简化，使用默认目录）
    if (!currentCwd) {
      setCurrentCwd('.'); // 简化处理，使用当前目录
    }

    // 如果没有活跃会话，自动创建一个
    let activeSession = currentSession;
    if (!activeSession) {
      const newSession = await createSession(currentCwd);
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
      let response;

      if (isPrimaryAgent) {
        // 与主理人Agent对话
        const primaryAgentResponse = await (window as any).electronAPI.primaryAgentChat({
          message: userMessage,
          cwd: currentCwd
        });

        if (primaryAgentResponse.success && primaryAgentResponse.data) {
          // 添加到消息历史
          if (activeSession) {
            await appendMessage(activeSession.id, 'user', userMessage);
            // primaryAgentResponse.data 直接是 { role, content, timestamp } 对象
            await appendMessage(activeSession.id, 'assistant', primaryAgentResponse.data.content);
          }
        } else {
          throw new Error(primaryAgentResponse.error || '发送消息失败');
        }
      } else {
        // 与团队Agent对话
        response = await sendMessage(currentTeam || '', `${currentTeam}-assistant`, userMessage, currentCwd);

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

  const handleCreateTeam = async (name: string, description: string) => {
    const response = await createTeam(name, description);
    if (response.success) {
      setShowTeamModal(false);
      // 自动选择新创建的团队
      selectTeam(name);
    } else {
      alert(`${t('status.error')}: ${response.error}`);
    }
  };

  const handleDeleteTeam = async (name: string) => {
    if (confirm(t('team.deleteConfirm', { name }))) {
      const response = await deleteTeam(name);
      if (response.success) {
        // 如果删除的是当前选择的团队，切换到主理人
        if (currentTeam === name) {
          selectPrimaryAgent();
        }
      } else {
        alert(`${t('status.error')}: ${response.error}`);
      }
    }
  };

  const handleResetChat = async () => {
    if ((!currentTeam && !isPrimaryAgent) || !currentSession) return;

    try {
      if (isPrimaryAgent) {
        await (window as any).electronAPI.primaryAgentReset();
      } else {
        await resetChat(currentTeam || '', `${currentTeam}-assistant`);
      }

      // 清空消息历史
      await clearHistory(isPrimaryAgent ? '__primary__' : currentTeam || '', currentSession.id);
    } catch (error) {
      console.error('重置失败:', error);
      alert(`${t('status.error')}: ${error}`);
    }
  };

  const handleSelectTeam = async (teamName: string | 'primary') => {
    const previousAgent = currentTeam;
    const previousIsPrimary = isPrimaryAgent;

    console.log('[App] Switching agent from:', previousAgent, 'to:', teamName);

    // 使用验证工具记录会话切换
    logSessionSwitch(
      previousAgent || '',
      teamName === 'primary' ? 'primary' : teamName,
      previousIsPrimary,
      teamName === 'primary',
      currentSession?.id || null
    );

    // 清理会话状态，确保完全隔离
    cleanupSessionState();
    clearMessages();

    if (teamName === 'primary') {
      selectPrimaryAgent();
    } else {
      selectTeam(teamName);
    }

    console.log('[App] Agent switch completed, sessions will be reloaded and auto-selected');
  };

  const handleSessionSelect = async (sessionId: string) => {
    console.log('[App] Selecting session:', sessionId, 'for agent:', selectionKey);

    // 验证会话选择是否正确
    const validation = validateSessionIsolation(sessionId, selectionKey, isPrimaryAgent);
    if (!validation.isValid) {
      console.error('[App] Session validation failed:', validation.errors);
      return;
    }

    await selectSession(sessionId);
  };

  const handleSessionCreate = async (directoryPath: string) => {
    console.log('[App] Creating session for agent:', selectionKey, 'in directory:', directoryPath);

    if (selectionKey === '__no_team__') {
      alert('请先选择一个AI助手再创建会话');
      return;
    }

    const newSession = await createSession(directoryPath);
    if (newSession) {
      console.log('[App] Session created successfully:', newSession.id);
    } else {
      console.error('[App] Failed to create session');
    }
  };

  const handleSessionDelete = async (sessionId: string) => {
    console.log('[App] Deleting session:', sessionId, 'for agent:', selectionKey);

    // 验证会话删除是否正确
    const validation = validateSessionIsolation(sessionId, selectionKey, isPrimaryAgent);
    if (!validation.isValid) {
      console.error('[App] Session validation failed before deletion:', validation.errors);
      return;
    }

    await deleteSession(sessionId);
  };

  // 如果在设置页面，显示设置页面
  if (currentPage === 'settings') {
    return (
      <div className="app">
        <SettingsPage
          config={aiConfig}
          onSave={() => {
            // 重新加载配置
            window.electronAPI.getAIConfig().then((response) => {
              if (response.success && response.data) {
                setAiConfig(response.data);
                setApiKeySet(!!response.data.apiKeys[response.data.provider]);
              }
            });
            setCurrentPage('chat');
          }}
          onBack={() => setCurrentPage('chat')}
        />
      </div>
    );
  }

  // 计算当前Agent名称（使用hook中的函数）
  const currentAgentName = getCurrentAgentName(primaryAgent?.name);

  // 如果在加载初始状态，显示加载屏
  if (apiKeySet === null) {
    return (
      <div className="app">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-text-primary mb-4"></div>
            <p className="text-text-tertiary">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <Header
          apiKeySet={apiKeySet}
          onReset={handleResetChat}
          onOpenSettings={() => setCurrentPage('settings')}
        />

        <div className="main-content">
          <Sidebar
            teams={teams}
            currentSelection={isPrimaryAgent ? 'primary' : (currentTeam || '')}
            onTeamSelect={handleSelectTeam}
            onTeamCreate={() => setShowTeamModal(true)}
            onTeamDelete={handleDeleteTeam}
          />

          <ChatArea
            messages={messages}
            loading={loading}
            input={input}
            onInputChange={setInput}
            onSendMessage={handleSendMessage}
            currentTeam={currentTeam || ''}
            currentAgent={currentAgentName}
            apiKeySet={apiKeySet}
            currentCwd={currentCwd}
            onOpenSettings={() => setCurrentPage('settings')}
            isPrimaryAgent={isPrimaryAgent}
          />

          <SessionSidebar
            sessions={sessions}
            currentSession={currentSession?.id || null}
            currentAgentName={currentAgentName}
            onSessionSelect={handleSessionSelect}
            onSessionCreate={handleSessionCreate}
            onSessionDelete={handleSessionDelete}
          />
        </div>

        <TeamModal
          isOpen={showTeamModal}
          onClose={() => setShowTeamModal(false)}
          onSubmit={handleCreateTeam}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;