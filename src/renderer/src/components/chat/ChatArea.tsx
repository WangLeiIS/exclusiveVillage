import { motion } from 'framer-motion';
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
}

export function ChatArea({
  messages,
  loading,
  input,
  onInputChange,
  onSendMessage,
  currentTeam,
  currentAgent,
  apiKeySet,
  currentCwd
}: ChatAreaProps) {
  const { t } = useAppTranslation();

  const getPlaceholder = () => {
    if (!apiKeySet) return t('chat.placeholder.noApiKey');
    if (!currentTeam) return t('chat.placeholder.noTeam');
    if (!currentAgent) return t('chat.placeholder.noAgent');
    if (!currentCwd) return t('cwd.notSet');
    return t('chat.placeholder.default', { agent: currentAgent });
  };

  const showWelcome = !currentTeam || !currentAgent;
  const showEmptyChat = messages.length === 0 && !showWelcome;

  return (
    <motion.main
      className="chat-area"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="messages-container">
        {showWelcome ? (
          <WelcomeState
            currentTeam={currentTeam}
            currentAgent={currentAgent}
            apiKeySet={apiKeySet}
          />
        ) : showEmptyChat ? (
          <WelcomeState
            currentTeam={currentTeam}
            currentAgent={currentAgent}
            apiKeySet={apiKeySet}
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
        placeholder={getPlaceholder()}
        apiKeySet={apiKeySet}
        currentTeam={currentTeam}
        currentAgent={currentAgent}
        currentCwd={currentCwd}
      />
    </motion.main>
  );
}
