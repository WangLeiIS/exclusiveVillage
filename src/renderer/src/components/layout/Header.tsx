import { motion } from 'framer-motion';
import { Zap, RefreshCw, Settings, Globe } from 'lucide-react';
import { StatusIndicator } from '../ui/StatusIndicator';
import { useAppTranslation } from '../../i18n/useTranslation';

interface HeaderProps {
  apiKeySet: boolean;
  onReset: () => void;
  onOpenSettings: () => void;
}

export function Header({ apiKeySet, onReset, onOpenSettings }: HeaderProps) {
  const { t, language, setLanguage } = useAppTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <motion.header
      className="header"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="header-left">
        <div className="logo">
          <Zap className="logo-icon" />
          <span className="logo-text">{t('app.name')}</span>
        </div>
        <div className="header-divider"></div>
        <StatusIndicator
          status={apiKeySet ? 'success' : 'error'}
          successText={t('header.apiKeyConfigured')}
          errorText={t('header.apiKeyNotConfigured')}
        />
      </div>

      <div className="header-right">
        <div className="header-actions">
          <motion.button
            className="header-btn"
            onClick={toggleLanguage}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            title={t('header.language')}
          >
            <Globe className="header-btn-icon" />
            <span className="header-btn-text">{language === 'en' ? 'EN' : '中文'}</span>
          </motion.button>

          <motion.button
            className="header-btn"
            onClick={onOpenSettings}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            title={t('header.settings')}
          >
            <Settings className="header-btn-icon" />
            <span className="header-btn-text">{t('header.settings')}</span>
          </motion.button>

          <motion.button
            className="header-btn header-btn-primary"
            onClick={onReset}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            title={t('header.resetChat')}
          >
            <RefreshCw className="header-btn-icon" />
            <span className="header-btn-text">{t('header.resetChat')}</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
