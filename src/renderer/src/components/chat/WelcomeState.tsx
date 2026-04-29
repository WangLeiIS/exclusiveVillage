import { motion } from 'framer-motion';
import { MessageSquare, AlertCircle, Settings } from 'lucide-react';
import { useAppTranslation } from '../../i18n/useTranslation';

interface WelcomeStateProps {
  currentTeam: string;
  currentAgent: string;
  apiKeySet: boolean;
  onOpenSettings?: () => void;
}

export function WelcomeState({ currentTeam, currentAgent, apiKeySet, onOpenSettings }: WelcomeStateProps) {
  const { t } = useAppTranslation();

  if (!currentTeam || !currentAgent) {
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
      <h2>{t('chat.start')}</h2>
      <p>
        {t('chat.startDesc', { agent: currentAgent })}
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
