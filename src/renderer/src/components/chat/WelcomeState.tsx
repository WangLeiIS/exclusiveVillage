import { motion } from 'framer-motion';
import { MessageSquare, AlertCircle, Settings } from 'lucide-react';
import { useAppTranslation } from '../../i18n/useTranslation';

interface WelcomeStateProps {
  currentTeam: string;
  currentAgent: string;
  apiKeySet: boolean;
  onOpenSettings?: () => void;
  isPrimaryAgent?: boolean; // 新增：是否是主理人Agent
}

export function WelcomeState({ currentTeam, currentAgent, apiKeySet, onOpenSettings, isPrimaryAgent = false }: WelcomeStateProps) {
  const { t } = useAppTranslation();

  // 修复逻辑：当选择了主理人Agent或有团队和Agent时，显示对话界面
  const shouldShowWelcome = !isPrimaryAgent && (!currentTeam || !currentAgent);

  if (shouldShowWelcome) {
    return (
      <motion.div
        className="welcome-state"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="welcome-icon">
          <MessageSquare />
        </div>
        <h2>{t('chat.welcome')}</h2>
        <p>{t('chat.welcomeDesc')}</p>
        {!apiKeySet && (
          <div className="warning-banner">
            <AlertCircle />
            <span>{t('chat.apiKeyWarning')}</span>
            {onOpenSettings && (
              <motion.button
                className="warning-action-btn"
                onClick={onOpenSettings}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="btn-icon" />
                <span>{t('header.settings')}</span>
              </motion.button>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="empty-chat"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="empty-chat-icon">
        <MessageSquare />
      </div>
      <h2>{isPrimaryAgent ? '你好，我是任我行' : t('chat.start')}</h2>
      <p>
        {isPrimaryAgent
          ? '我是全能型AI主理人，可以协助你处理各种任务。请随时开始对话！'
          : t('chat.startDesc', { agent: currentAgent })
        }
      </p>
      {!apiKeySet && (
        <div className="warning-banner">
          <AlertCircle />
          <span>{t('chat.apiKeyWarning')}</span>
          {onOpenSettings && (
            <motion.button
              className="warning-action-btn"
              onClick={onOpenSettings}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="btn-icon" />
              <span>{t('header.settings')}</span>
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
}
