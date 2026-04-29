import { useState, useEffect, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { SessionSidebar } from '../components/layout/SessionSidebar';
import { ChatArea } from '../components/chat/ChatArea';
import { TeamModal } from '../components/teams/TeamModal';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

// Hooks
import { useAgentSelection } from '../hooks/useAgentSelection';
import { usePrimaryAgent } from '../hooks/usePrimaryAgent';
import { useTeams } from '../hooks/useTeams';
import { useSessions } from '../hooks/useSessions';
import { useMessageHistory } from '../hooks/useMessageHistory';
import { useChat } from '../hooks/useChat';
import { useAppConfig } from '../hooks/useAppConfig';
import { useWorkspace } from '../hooks/useWorkspace';
import { useSessionAutoManager } from '../hooks/useSessionAutoManager';
import { useChatHandlers } from '../hooks/useChatHandlers';

// Types
import type { AIConfig } from '../types';

interface ChatContainerProps {
  onOpenSettings: () => void;
}

/**
 * 聊天页面容器组件
 * 负责组装所有聊天相关的状态和逻辑
 */
export function ChatContainer({ onOpenSettings }: ChatContainerProps) {
  // ===== 配置管理 =====
  const { apiKeySet } = useAppConfig();

  // ===== Agent 选择状态管理 =====
  const {
    currentTeam,
    isPrimaryAgent,
    selectPrimaryAgent,
    selectTeam,
    getCurrentAgentName,
    canChat
  } = useAgentSelection();

  // ===== 主理人 Agent =====
  const { primaryAgent } = usePrimaryAgent();

  // ===== 团队管理 =====
  const { teams, createTeam, deleteTeam } = useTeams();

  // ===== 会话管理 =====
  const selectionKey = useMemo(() => {
    if (isPrimaryAgent) {
      return '__primary__';
    } else if (currentTeam && currentTeam.trim()) {
      return currentTeam.trim();
    } else {
      console.warn('[ChatContainer] No valid team selected for session management');
      return '__no_team__';
    }
  }, [isPrimaryAgent, currentTeam]);

  const {
    sessions,
    currentSession,
    selectSession,
    createSession,
    deleteSession,
    isLoading: sessionsLoading
  } = useSessions(selectionKey);

  // ===== 消息历史管理 =====
  const { messages, loadHistory, clearMessages, appendMessage, clearHistory } =
    useMessageHistory();

  // ===== 对话管理 =====
  const { loading, sendMessage, addUserMessage, resetChat } = useChat();

  // ===== 工作目录管理 =====
  const { currentCwd, setCurrentCwd, getValidDefaultDirectory } = useWorkspace(
    currentTeam,
    isPrimaryAgent
  );

  // ===== 会话自动管理 =====
  useSessionAutoManager({
    selectionKey,
    sessions,
    sessionsLoading,
    currentSession,
    currentTeam,
    isPrimaryAgent,
    currentCwd,
    selectSession,
    createSession
  });

  // ===== 聊天事件处理器 =====
  const chatHandlers = useChatHandlers({
    currentTeam,
    isPrimaryAgent,
    currentSession,
    currentCwd,
    selectionKey,
    primaryAgent,
    canChat,
    selectSession,
    createSession,
    deleteSession,
    loadHistory,
    clearMessages,
    appendMessage,
    clearHistory,
    sendMessage,
    addUserMessage,
    resetChat,
    selectTeam,
    selectPrimaryAgent,
    createTeam,
    deleteTeam,
    setCurrentCwd,
    getValidDefaultDirectory
  });

  // ===== 状态同步 =====
  // 当选择会话时，加载消息历史并同步 currentCwd
  useEffect(() => {
    if (currentSession) {
      console.log(
        '[ChatContainer] Loading session:',
        currentSession.id,
        'title:',
        currentSession.title
      );
      loadHistory(currentSession.id);

      if (currentSession.directory_path) {
        console.log('[ChatContainer] Syncing directory_path:', currentSession.directory_path);
        setCurrentCwd(currentSession.directory_path);
      }
    } else {
      console.log('[ChatContainer] No session selected, clearing messages');
      clearMessages();
    }
  }, [currentSession, loadHistory, clearMessages, setCurrentCwd]);

  // ===== UI 状态 =====
  const [input, setInput] = useState('');
  const [showTeamModal, setShowTeamModal] = useState(false);

  // ===== 事件处理包装 =====
  const handleSendMessage = () => {
    chatHandlers.handleSendMessage(input, setInput);
  };

  const handleCreateTeam = async (name: string, description: string) => {
    const result = await chatHandlers.handleCreateTeam(name, description);
    if (result.success) {
      setShowTeamModal(false);
    }
  };

  // ===== 渲染 =====
  const currentAgentName = getCurrentAgentName(primaryAgent?.name);

  // 加载状态
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
          onReset={chatHandlers.handleResetChat}
          onOpenSettings={onOpenSettings}
        />

        <div className="main-content">
          <Sidebar
            teams={teams}
            currentSelection={isPrimaryAgent ? 'primary' : currentTeam || ''}
            onTeamSelect={chatHandlers.handleSelectTeam}
            onTeamCreate={() => setShowTeamModal(true)}
            onTeamDelete={chatHandlers.handleDeleteTeam}
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
            onOpenSettings={onOpenSettings}
            isPrimaryAgent={isPrimaryAgent}
          />

          <SessionSidebar
            sessions={sessions}
            currentSession={currentSession?.id || null}
            currentAgentName={currentAgentName}
            onSessionSelect={chatHandlers.handleSessionSelect}
            onSessionCreate={chatHandlers.handleSessionCreate}
            onSessionDelete={chatHandlers.handleSessionDelete}
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
