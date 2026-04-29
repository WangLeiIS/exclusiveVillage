import { useState, useEffect } from 'react';
import type { AIConfig } from '../types';

/**
 * 管理 AI 配置和 API 密钥状态
 * @returns AI 配置状态和加载函数
 */
export function useAppConfig() {
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [apiKeySet, setApiKeySet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 检查 API 密钥是否已设置
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const hasKey = await window.electronAPI.checkApiKey();
        setApiKeySet(hasKey);
      } catch (error) {
        console.error('[useAppConfig] 检查 API 密钥失败:', error);
        setApiKeySet(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkApiKey();
  }, []);

  // 加载 AI 配置
  useEffect(() => {
    const loadAIConfig = async () => {
      try {
        const response = await window.electronAPI.getAIConfig();
        if (response.success && response.data) {
          setAiConfig(response.data);
          setApiKeySet(!!response.data.apiKeys[response.data.provider]);
        }
      } catch (error) {
        console.error('[useAppConfig] 加载 AI 配置失败:', error);
      }
    };

    loadAIConfig();
  }, []);

  // 重新加载配置（用于设置保存后）
  const reloadConfig = async () => {
    try {
      const response = await window.electronAPI.getAIConfig();
      if (response.success && response.data) {
        setAiConfig(response.data);
        setApiKeySet(!!response.data.apiKeys[response.data.provider]);
      }
    } catch (error) {
      console.error('[useAppConfig] 重新加载配置失败:', error);
    }
  };

  return {
    aiConfig,
    apiKeySet,
    isLoading,
    reloadConfig
  };
}
