import { useState, useEffect } from 'react';
import './App.css';
import { useAppTranslation } from './i18n/useTranslation';

// Layout components
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// Feature components
import { ChatArea } from './components/chat/ChatArea';
import { TeamModal } from './components/teams/TeamModal';
import { AgentModal } from './components/agents/AgentModal';
import { CwdSelector } from './components/chat/CwdSelector';
import { SettingsPage } from './pages/SettingsPage';

// Types
import { AIProviderConfig } from './types/config';

// Hooks
import { useTeams } from './hooks/useTeams';
import { useAgents } from './hooks/useAgents';
import { useChat } from './hooks/useChat';

type Page = 'chat' | 'settings';

function App() {
  const { t } = useAppTranslation();
  const [currentPage, setCurrentPage] = useState<Page>('chat');
  const [aiConfig, setAiConfig] = useState<AIProviderConfig | null>(null);
  const [apiKeySet, setApiKeySet] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showCwdSelector, setShowCwdSelector] = useState(false);
  const [currentCwd, setCurrentCwd] = useState<string>('');

  // Custom hooks
  const {
    teams,
    currentTeam,
    setCurrentTeam,
    createTeam,
    deleteTeam
  } = useTeams();

  const {
    agents,
    currentAgent,
    setCurrentAgent,
    createAgent
  } = useAgents(currentTeam);

  const {
    messages,
    loading,
    sendMessage,
    addUserMessage,
    resetChat
  } = useChat();

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

  // 当选择 Agent 时，自动设置默认 CWD
  useEffect(() => {
    const setDefaultCwd = async () => {
      if (currentAgent && !currentCwd) {
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
  }, [currentAgent]);

  // Event handlers
  const handleSendMessage = async () => {
    if (!currentTeam || !currentAgent) {
      alert(t('chat.placeholder.noTeam') + ' & ' + t('chat.placeholder.noAgent'));
      return;
    }

    // 如果没有设置 CWD，显示选择器
    if (!currentCwd) {
      setShowCwdSelector(true);
      return;
    }

    const userMessage = input;
    setInput('');
    addUserMessage(userMessage);

    await sendMessage(currentTeam, currentAgent, userMessage, currentCwd);
  };

  const [input, setInput] = useState('');

  const handleCreateTeam = async (name: string, description: string) => {
    const response = await createTeam(name, description);
    if (response.success) {
      setShowTeamModal(false);
    } else {
      alert(`${t('status.error')}: ${response.error}`);
    }
  };

  const handleDeleteTeam = async (name: string) => {
    if (confirm(t('team.deleteConfirm', { name }))) {
      const response = await deleteTeam(name);
      if (response.success) {
        setCurrentTeam('');
        setInput('');
      } else {
        alert(`${t('status.error')}: ${response.error}`);
      }
    }
  };

  const handleCreateAgent = async (params: {
    name: string;
    role: string;
    className: string;
    isVocal: boolean;
    goalDescription: string;
  }) => {
    const response = await createAgent(params);
    if (response.success) {
      setShowAgentModal(false);
    } else {
      alert(`${t('status.error')}: ${response.error}`);
    }
  };

  const handleResetChat = async () => {
    if (!currentTeam || !currentAgent) return;

    try {
      await resetChat(currentTeam, currentAgent);
      // 重置后不自动清除 CWD，用户可能想重新开始对话
    } catch (error) {
      console.error('重置失败:', error);
      alert(`${t('status.error')}: ${error}`);
    }
  };

  const handleCwdConfirm = (cwd: string) => {
    setCurrentCwd(cwd);
    // CWD 确认后，如果用户已经输入了消息，自动发送
    if (input.trim()) {
      const userMessage = input;
      setInput('');
      addUserMessage(userMessage);
      sendMessage(currentTeam, currentAgent, userMessage, cwd);
    }
  };

  const handleAgentSelect = (agentName: string) => {
    setCurrentAgent(agentName);
    // 切换 Agent 时，清除 CWD，让用户重新选择
    setCurrentCwd('');
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

  return (
    <div className="app">
      <Header
        apiKeySet={apiKeySet}
        onReset={handleResetChat}
        onOpenSettings={() => setCurrentPage('settings')}
      />

      <div className="main-content">
        <Sidebar
          teams={teams}
          currentTeam={currentTeam}
          onTeamSelect={setCurrentTeam}
          onTeamCreate={() => setShowTeamModal(true)}
          onTeamDelete={handleDeleteTeam}
          agents={agents}
          currentAgent={currentAgent}
          onAgentSelect={handleAgentSelect}
          onAgentCreate={() => setShowAgentModal(true)}
        />

        <ChatArea
          messages={messages}
          loading={loading}
          input={input}
          onInputChange={setInput}
          onSendMessage={handleSendMessage}
          currentTeam={currentTeam}
          currentAgent={currentAgent}
          apiKeySet={apiKeySet}
          currentCwd={currentCwd}
        />
      </div>

      <TeamModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        onSubmit={handleCreateTeam}
      />

      <AgentModal
        isOpen={showAgentModal}
        onClose={() => setShowAgentModal(false)}
        onSubmit={handleCreateAgent}
      />

      <CwdSelector
        isOpen={showCwdSelector}
        onClose={() => setShowCwdSelector(false)}
        onConfirm={handleCwdConfirm}
        currentTeam={currentTeam}
        currentAgent={currentAgent}
      />
    </div>
  );
}

export default App;
