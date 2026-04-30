import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Folder } from 'lucide-react';
import { WelcomeState } from './WelcomeState';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useAppTranslation } from '../../i18n/useTranslation';
import type { Message } from '../../types';

interface ChatAreaProps {
  messages: Message[];
  loading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  currentTeam: string;
  currentAgent: string;
  apiKeySet: boolean;
  currentCwd: string;
  onOpenSettings?: () => void;
  // 主理人Agent标识
  isPrimaryAgent?: boolean;
}

function ChatAreaComponent({
  messages,
  loading,
  input,
  onInputChange,
  onSendMessage,
  currentTeam,
  currentAgent,
  apiKeySet,
  currentCwd,
  onOpenSettings,
  isPrimaryAgent = false
}: ChatAreaProps) {
  const { t } = useAppTranslation();

  // 使用useMemo优化placeholder计算
  const placeholder = useMemo(() => {
    if (!apiKeySet) return t('chat.placeholder.noApiKey');
    if (!currentTeam && !isPrimaryAgent) return t('chat.placeholder.noTeam');
    if (!currentAgent && !isPrimaryAgent) return t('chat.placeholder.noAgent');
    if (!currentCwd) return t('cwd.notSet');
    return isPrimaryAgent ? '与任我行对话...' : t('chat.placeholder.default', { agent: currentAgent });
  }, [apiKeySet, currentTeam, currentAgent, currentCwd, isPrimaryAgent, t]);

  const showWelcome = !isPrimaryAgent && (!currentTeam || !currentAgent);
  const showEmptyChat = messages.length === 0 && !showWelcome;

  return (
    <motion.main
      className="chat-area"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* 工作目录 */}
      {currentCwd && (
        <motion.div
          className="cwd-indicator cwd-indicator-top"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Folder size={14} />
          <span className="cwd-path">{currentCwd}</span>
        </motion.div>
      )}

      {/* 主消息区域 */}
      <div className="messages-section">
        <div className="messages-container">
          {showWelcome ? (
            <WelcomeState
              currentTeam={currentTeam}
              currentAgent={currentAgent}
              apiKeySet={apiKeySet}
              onOpenSettings={onOpenSettings}
              isPrimaryAgent={false}
            />
          ) : showEmptyChat ? (
            <WelcomeState
              currentTeam={currentTeam}
              currentAgent={currentAgent}
              apiKeySet={apiKeySet}
              onOpenSettings={onOpenSettings}
              isPrimaryAgent={isPrimaryAgent}
            />
          ) : (
            <MessageList
              messages={messages}
              loading={loading}
              agentName={currentAgent}
            />
          )}
        </div>

        <ChatInput
          value={input}
          onChange={onInputChange}
          onSend={onSendMessage}
          disabled={loading}
          placeholder={placeholder}
          apiKeySet={apiKeySet}
          currentTeam={currentTeam}
          currentAgent={currentAgent}
          isPrimaryAgent={isPrimaryAgent}
        />
      </div>
    </motion.main>
  );
}

// 使用React.memo优化性能，只在props真正变化时重新渲染
export const ChatArea = memo(ChatAreaComponent, (prevProps, nextProps) => {
  return (
    prevProps.messages === nextProps.messages &&
    prevProps.loading === nextProps.loading &&
    prevProps.input === nextProps.input &&
    prevProps.currentTeam === nextProps.currentTeam &&
    prevProps.currentAgent === nextProps.currentAgent &&
    prevProps.apiKeySet === nextProps.apiKeySet &&
    prevProps.currentCwd === nextProps.currentCwd &&
    prevProps.isPrimaryAgent === nextProps.isPrimaryAgent
  );
});
