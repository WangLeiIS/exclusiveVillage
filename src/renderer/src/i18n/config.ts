import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入翻译资源
import zh_CN from './locales/zh-CN.json';
import en_US from './locales/en-US.json';

const initI18n = async () => {
  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        'zh-CN': {
          translation: zh_CN,
        },
        'en-US': {
          translation: en_US,
        },
      },
      lng: 'zh-CN', // 默认语言
      fallbackLng: 'zh-CN',
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
      interpolation: {
        escapeValue: false,
      },
    });

  return i18n;
};

export default initI18n;
