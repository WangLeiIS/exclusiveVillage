import { useTranslation } from 'react-i18next';

export function useAppTranslation() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const getCurrentLanguage = () => {
    return i18n.language;
  };

  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    currentLanguage: i18n.language,
  };
}
