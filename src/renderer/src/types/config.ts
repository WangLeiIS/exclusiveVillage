/**
 * AI 供应商配置类型
 */
export interface AIProviderConfig {
  provider: 'deepseek' | 'anthropic' | 'openai' | 'google';
  model: string;
  apiKeys: {
    deepseek?: string;
    anthropic?: string;
    openai?: string;
    google?: string;
  };
  lastUpdated: number;
}

/**
 * AI 供应商类型
 */
export type AIProvider = AIProviderConfig['provider'];

/**
 * 供应商信息
 */
export interface ProviderInfo {
  id: AIProvider;
  name: string;
  description: string;
  defaultModel: string;
  keyPrefix: string;
  keyPlaceholder: string;
}

/**
 * 支持的供应商列表
 */
export const PROVIDERS: Record<AIProvider, ProviderInfo> = {
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek (推荐)',
    defaultModel: 'deepseek-v4-flash',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Anthropic (Claude)',
    defaultModel: 'claude-3-5-sonnet-20241022',
    keyPrefix: 'sk-ant-',
    keyPlaceholder: 'sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'OpenAI (GPT)',
    defaultModel: 'gpt-4o',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
  google: {
    id: 'google',
    name: 'Google',
    description: 'Google (Gemini)',
    defaultModel: 'gemini-2.0-flash-exp',
    keyPrefix: '',
    keyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
};
