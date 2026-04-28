import { useAppTranslation } from '../../i18n/useTranslation';
import { Languages, Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { getCurrentLanguage, changeLanguage } = useAppTranslation();

  const languages = [
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
  ];

  const currentLang = getCurrentLanguage();

  return (
    <div className="language-switcher">
      <button
        className="lang-button"
        onClick={() => changeLanguage(currentLang === 'zh-CN' ? 'en-US' : 'zh-CN')}
        title={currentLang === 'zh-CN' ? 'Switch to English' : '切换到中文'}
      >
        <Globe className="lang-icon" />
        <span className="lang-text">
          {currentLang === 'zh-CN' ? 'EN' : '中'}
        </span>
      </button>
    </div>
  );
}
