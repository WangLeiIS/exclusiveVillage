import { motion } from 'framer-motion';
import { Zap, RefreshCw } from 'lucide-react';
import { StatusIndicator } from '../ui/StatusIndicator';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { useAppTranslation } from '../../i18n/useTranslation';

interface HeaderProps {
  apiKeySet: boolean;
  onReset: () => void;
}

export function Header({ apiKeySet, onReset }: HeaderProps) {
  const { t } = useAppTranslation();

  return (
    <motion.header
      className="header"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
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
        <LanguageSwitcher />
        <motion.button
          className="btn-reset"
          onClick={onReset}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw className="btn-icon" />
          <span>{t('header.resetChat')}</span>
        </motion.button>
      </div>
    </motion.header>
  );
}
