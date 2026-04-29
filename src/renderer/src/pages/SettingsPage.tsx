import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Trash2, Check, X } from 'lucide-react';
import { useAppTranslation } from '../i18n/useTranslation';
import { AIProviderConfig, PROVIDERS, AIProvider } from '../types/config';

interface SettingsPageProps {
  config: AIProviderConfig | null;
  onSave: () => void;
  onBack: () => void;
}

export function SettingsPage({ config: initialConfig, onSave, onBack }: SettingsPageProps) {
  const { t } = useAppTranslation();
  const [config, setConfig] = useState<AIProviderConfig>(
    initialConfig || {
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
      apiKeys: {},
      lastUpdated: 0,
    }
  );
  const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({
    deepseek: false,
    anthropic: false,
    openai: false,
    google: false,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // 当初始配置变化时更新表单
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  // 选择供应商
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

  // 修改模型名称
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

  // 修改 API Key
  const handleApiKeyChange = (provider: AIProvider, key: string) => {
    setConfig((prev) => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [provider]: key.trim() || undefined,
      },
    }));
    // 清除 API Key 相关的验证错误
    setValidationErrors((prev) => {
      const { apiKey, ...rest } = prev;
      return rest;
    });
  };

  // 清除 API Key
  const handleClearApiKey = (provider: AIProvider) => {
    setConfig((prev) => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [provider]: undefined,
      },
    }));
  };

  // 切换密钥显示/隐藏
  const toggleKeyVisibility = (provider: AIProvider) => {
    setShowKeys((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  // 验证表单
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // 验证模型名称
    if (!config.model || config.model.trim() === '') {
      errors.model = t('settings.validation.modelRequired');
    }

    // 验证选中的供应商是否有 API Key
    const selectedProvider = config.provider;
    if (!config.apiKeys[selectedProvider]) {
      errors.apiKey = t('settings.validation.apiKeyRequired', { provider: selectedProvider });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 保存配置
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
      console.error('保存配置失败:', error);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // 遮挡 API Key
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
      {/* Header */}
      <div className="settings-header">
        <motion.button
          className="btn-back"
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="icon" />
          <span>{t('settings.back')}</span>
        </motion.button>
        <h1>{t('settings.title')}</h1>
      </div>

      {/* Content */}
      <div className="settings-content">
        {/* AI 提供商选择 */}
        <div className="form-group">
          <label className="form-label">{t('settings.provider')}</label>
          <div className="provider-selector">
            {(Object.entries(PROVIDERS) as [AIProvider, typeof PROVIDERS[AIProvider]][]).map(
              ([id, info]) => (
                <motion.button
                  key={id}
                  className={`provider-option ${config.provider === id ? 'active' : ''}`}
                  onClick={() => handleProviderChange(id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="provider-info">
                    <div className="provider-name">{info.name}</div>
                    <div className="provider-description">{info.description}</div>
                  </div>
                  {config.provider === id && <Check className="check-icon" />}
                </motion.button>
              )
            )}
          </div>
        </div>

        {/* 模型名称 */}
        <div className="form-group">
          <label className="form-label">{t('settings.model')}</label>
          <input
            type="text"
            className={`form-input ${validationErrors.model ? 'error' : ''}`}
            value={config.model}
            onChange={(e) => handleModelChange(e.target.value)}
            placeholder={PROVIDERS[config.provider].defaultModel}
          />
          {validationErrors.model && <div className="error-message">{validationErrors.model}</div>}
        </div>

        {/* API Keys */}
        <div className="form-group">
          <label className="form-label">{t('settings.apiKeys')}</label>
          <div className="api-keys-container">
            {(Object.entries(PROVIDERS) as [AIProvider, typeof PROVIDERS[AIProvider]][]).map(
              ([id, info]) => (
                <div key={id} className="api-key-item">
                  <div className="api-key-label">
                    <span className="provider-name">{info.name}</span>
                    {config.provider === id && config.apiKeys[id] && (
                      <span className="current-badge">{t('settings.current')}</span>
                    )}
                  </div>
                  <div className="api-key-input-group">
                    <input
                      type={showKeys[id] ? 'text' : 'password'}
                      className={`form-input ${validationErrors.apiKey && config.provider === id && !config.apiKeys[id] ? 'error' : ''}`}
                      value={showKeys[id] ? (config.apiKeys[id] || '') : maskKey(config.apiKeys[id])}
                      onChange={(e) => handleApiKeyChange(id, e.target.value)}
                      placeholder={info.keyPlaceholder}
                    />
                    <motion.button
                      className="btn-icon"
                      onClick={() => toggleKeyVisibility(id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title={showKeys[id] ? t('settings.hide') : t('settings.show')}
                    >
                      {showKeys[id] ? <EyeOff size={18} /> : <Eye size={18} />}
                    </motion.button>
                    {config.apiKeys[id] && (
                      <motion.button
                        className="btn-icon btn-danger"
                        onClick={() => handleClearApiKey(id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title={t('settings.clear')}
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    )}
                  </div>
                  {config.provider === id && !config.apiKeys[id] && validationErrors.apiKey && (
                    <div className="error-message">{validationErrors.apiKey}</div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="settings-footer">
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
      </div>
    </motion.div>
  );
}
