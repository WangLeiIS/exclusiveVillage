import { motion } from 'framer-motion';
import { Zap, Settings } from 'lucide-react';
import { useAppTranslation } from '../../i18n/useTranslation';

interface HeaderProps {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  const { t } = useAppTranslation();

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
      </div>

      <div className="header-right">
        <div className="header-actions">
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
        </div>
      </div>
    </motion.header>
  );
}
