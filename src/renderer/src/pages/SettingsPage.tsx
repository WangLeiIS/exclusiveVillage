import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Trash2, Check, X, Globe } from 'lucide-react';
import { useAppTranslation } from '../i18n/useTranslation';
import { AIProviderConfig, PROVIDERS, AIProvider } from '../types/config';

interface SettingsPageProps {
  config: AIProviderConfig | null;
  onSave: () => void;
  onBack: () => void;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export function SettingsPage({ config: initialConfig, onSave, onBack }: SettingsPageProps) {
  const { t, changeLanguage, getCurrentLanguage } = useAppTranslation();

  const languages: LanguageOption[] = [
    { code: 'zh-CN', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'en-US', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  ];

  const [currentLanguage, setCurrentLanguage] = useState<string>(getCurrentLanguage());
  const [config, setConfig] = useState<AIProviderConfig>(
    initialConfig || {
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
      apiKeys: {},
      lastUpdated: 0,
    }
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const handleProviderChange = (provider: AIProvider) => {
    setConfig((prev) => ({
      ...prev,
      provider,
      model: PROVIDERS[provider].defaultModel,
    }));
    setValidationErrors((prev) => {
      const { provider: _, ...rest } = prev;
      return rest;
    });
  };

  const handleModelChange = (model: string) => {
    setConfig((prev) => ({
      ...prev,
      model: model.trim(),
    }));
    setValidationErrors((prev) => {
      const { model, ...rest } = prev;
      return rest;
    });
  };

  const handleApiKeyChange = (key: string) => {
    setConfig((prev) => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [prev.provider]: key.trim() || undefined,
      },
    }));
    setValidationErrors((prev) => {
      const { apiKey, ...rest } = prev;
      return rest;
    });
  };

  const handleClearApiKey = () => {
    setConfig((prev) => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [prev.provider]: undefined,
      },
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!config.model || config.model.trim() === '') {
      errors.model = t('settings.validation.modelRequired');
    }

    if (!config.apiKeys[config.provider]) {
      errors.apiKey = t('settings.validation.apiKeyRequired', { provider: config.provider });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setSaveStatus('error');
      setStatusMessage(t('settings.validation.invalid'));
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const result = await window.electronAPI.saveAIConfig(config);

      if (result.success) {
        setSaveStatus('success');
        setStatusMessage(t('settings.saved'));
        setTimeout(() => {
          onSave();
        }, 1000);
      } else {
        setSaveStatus('error');
        setStatusMessage(result.error || t('settings.saveFailed'));
      }
    } catch (error) {
      setSaveStatus('error');
      setStatusMessage(t('settings.saveFailed'));
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const maskKey = (key: string | undefined): string => {
    if (!key) return '';
    return key.length > 8 ? '•'.repeat(16) : '•'.repeat(key.length);
  };

  return (
    <motion.div
      className="settings-page"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="settings-header">
        <h1>{t('settings.title')}</h1>
      </div>

      <div className="settings-content">
        <div className="form-section">
          <div className="form-row-inline">
            <div className="section-title">
              <Globe size={18} />
              <span>{t('settings.language')}</span>
            </div>
            <div className="select-wrapper">
              <select
                className="form-select"
                value={currentLanguage}
                onChange={(e) => {
                  setCurrentLanguage(e.target.value);
                  changeLanguage(e.target.value);
                }}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-title">
            <Globe size={18} />
            <span>{t('settings.aiProvider')}</span>
          </div>

          <div className="form-group">
            <label className="form-label">{t('settings.provider')}</label>
            <div className="select-wrapper">
              <select
                className="form-select"
                value={config.provider}
                onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
              >
                {(Object.entries(PROVIDERS) as [AIProvider, typeof PROVIDERS[AIProvider]][]).map(
                  ([id, info]) => (
                    <option key={id} value={id}>
                      {info.name} - {info.description}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('settings.model')}</label>
            <input
              type="text"
              className={`form-input ${validationErrors.model ? 'error' : ''}`}
              value={config.model}
              onChange={(e) => handleModelChange(e.target.value)}
              placeholder={PROVIDERS[config.provider].defaultModel}
            />
            {validationErrors.model && (
              <div className="error-message">{validationErrors.model}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">{t('settings.apiKey')}</label>
            <div className="input-with-actions">
              <input
                type={showApiKey ? 'text' : 'password'}
                className={`form-input ${validationErrors.apiKey ? 'error' : ''}`}
                value={showApiKey ? (config.apiKeys[config.provider] || '') : maskKey(config.apiKeys[config.provider])}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder={PROVIDERS[config.provider].keyPlaceholder}
              />
              <div className="input-actions">
                <motion.button
                  type="button"
                  className="btn-icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title={showApiKey ? t('settings.hide') : t('settings.show')}
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </motion.button>
                {config.apiKeys[config.provider] && (
                  <motion.button
                    type="button"
                    className="btn-icon btn-danger"
                    onClick={handleClearApiKey}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={t('settings.clear')}
                  >
                    <Trash2 size={18} />
                  </motion.button>
                )}
              </div>
            </div>
            {validationErrors.apiKey && (
              <div className="error-message">{validationErrors.apiKey}</div>
            )}
          </div>
        </div>
      </div>

      <div className="settings-footer">
        <div className="footer-left">
          <motion.button
            className="btn-back"
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="icon" />
            <span>{t('settings.back')}</span>
          </motion.button>

          <motion.button
            className="btn-save"
            onClick={handleSave}
            disabled={isSaving}
            whileHover={{ scale: isSaving ? 1 : 1.02 }}
            whileTap={{ scale: isSaving ? 1 : 0.98 }}
          >
            {isSaving ? (
              <>
                <div className="spinner" />
                <span>{t('settings.saving')}</span>
              </>
            ) : (
              <>
                <Check size={18} />
                <span>{t('settings.save')}</span>
              </>
            )}
          </motion.button>

          <AnimatePresence mode="wait">
            {saveStatus !== 'idle' && (
              <motion.div
                key={saveStatus}
                className={`save-status ${saveStatus}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {saveStatus === 'success' && <Check size={18} />}
                {saveStatus === 'error' && <X size={18} />}
                <span>{statusMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
