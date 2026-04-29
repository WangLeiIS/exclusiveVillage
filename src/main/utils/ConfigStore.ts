import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

/**
 * AI 供应商配置接口
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
 * 默认配置
 */
const DEFAULT_CONFIG: AIProviderConfig = {
  provider: 'deepseek',
  model: 'deepseek-v4-flash',
  apiKeys: {},
  lastUpdated: 0,
};

/**
 * 配置存储管理类（单例模式）
 */
class ConfigStoreClass {
  private configPath: string;
  private config: AIProviderConfig | null = null;
  private initialized: boolean = false;

  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'ai-config.json');
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ConfigStoreClass {
    if (!global.configStoreInstance) {
      global.configStoreInstance = new ConfigStoreClass();
    }
    return global.configStoreInstance;
  }

  /**
   * 初始化配置（首次调用时自动执行）
   */
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 确保 userData 目录存在
    const userDataDir = path.dirname(this.configPath);
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }

    // 加载配置
    await this.loadConfig();
    this.initialized = true;
  }

  /**
   * 从文件加载配置
   */
  private async loadConfig(): Promise<void> {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        const parsed = JSON.parse(data);

        // 验证配置格式
        if (this.validateConfig(parsed)) {
          this.config = parsed;
          console.log('[ConfigStore] 配置已加载:', this.configPath);
        } else {
          console.warn('[ConfigStore] 配置格式无效，使用默认配置');
          this.config = { ...DEFAULT_CONFIG };
        }
      } else {
        // 配置文件不存在，创建默认配置
        console.log('[ConfigStore] 配置文件不存在，创建默认配置');
        this.config = { ...DEFAULT_CONFIG };
        await this.saveConfig();
      }
    } catch (error) {
      console.error('[ConfigStore] 加载配置失败:', error);
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  /**
   * 保存配置到文件
   */
  private async saveConfig(): Promise<void> {
    try {
      // 更新时间戳
      if (this.config) {
        this.config.lastUpdated = Date.now();
      }

      // 原子写入：先写入临时文件，然后重命名
      const tempPath = this.configPath + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(this.config, null, 2), 'utf-8');

      // 重命名临时文件为正式文件
      fs.renameSync(tempPath, this.configPath);

      console.log('[ConfigStore] 配置已保存:', this.configPath);
    } catch (error) {
      console.error('[ConfigStore] 保存配置失败:', error);
      throw error;
    }
  }

  /**
   * 验证配置格式
   */
  private validateConfig(config: any): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }

    // 验证 provider
    const validProviders = ['deepseek', 'anthropic', 'openai', 'google'];
    if (!config.provider || !validProviders.includes(config.provider)) {
      return false;
    }

    // 验证 model
    if (typeof config.model !== 'string' || config.model.trim() === '') {
      return false;
    }

    // 验证 apiKeys
    if (!config.apiKeys || typeof config.apiKeys !== 'object') {
      return false;
    }

    // 验证 lastUpdated
    if (typeof config.lastUpdated !== 'number') {
      return false;
    }

    return true;
  }

  /**
   * 获取配置（公共方法）
   */
  async get(): Promise<AIProviderConfig> {
    await this.initialize();
    return this.config!;
  }

  /**
   * 保存配置（公共方法）
   */
  async save(config: AIProviderConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // 验证配置
      if (!this.validateConfig(config)) {
        return {
          success: false,
          error: '配置格式无效',
        };
      }

      // 验证选中的供应商是否有 API Key
      const selectedProvider = config.provider;
      if (!config.apiKeys[selectedProvider]) {
        return {
          success: false,
          error: `未为选中的提供商 (${selectedProvider}) 配置 API Key`,
        };
      }

      await this.initialize();
      this.config = config;
      await this.saveConfig();

      return { success: true };
    } catch (error) {
      console.error('[ConfigStore] 保存配置失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 验证 API Key 格式
   */
  validateAPIKey(provider: string, key: string): { valid: boolean; error?: string } {
    if (!key || key.trim() === '') {
      return {
        valid: false,
        error: 'API Key 不能为空',
      };
    }

    const trimmedKey = key.trim();

    // 根据供应商验证格式
    switch (provider) {
      case 'deepseek':
        if (!trimmedKey.startsWith('sk-')) {
          return {
            valid: false,
            error: 'DeepSeek API Key 应以 sk- 开头',
          };
        }
        break;

      case 'anthropic':
        if (!trimmedKey.startsWith('sk-ant-')) {
          return {
            valid: false,
            error: 'Anthropic API Key 应以 sk-ant- 开头',
          };
        }
        break;

      case 'openai':
        if (!trimmedKey.startsWith('sk-')) {
          return {
            valid: false,
            error: 'OpenAI API Key 应以 sk- 开头',
          };
        }
        break;

      case 'google':
        // Google API Key 格式较宽松，只需非空
        if (trimmedKey.length < 10) {
          return {
            valid: false,
            error: 'Google API Key 长度不足',
          };
        }
        break;

      default:
        return {
          valid: false,
          error: '未知的供应商',
        };
    }

    return { valid: true };
  }

  /**
   * 重置为默认配置
   */
  async resetToDefaults(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initialize();
      this.config = { ...DEFAULT_CONFIG };
      await this.saveConfig();

      return { success: true };
    } catch (error) {
      console.error('[ConfigStore] 重置配置失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }
}

// 声明全局变量类型
declare global {
  var configStoreInstance: ConfigStoreClass;
}

// 导出单例获取函数
export function getConfigStore(): ConfigStoreClass {
  return ConfigStoreClass.getInstance();
}

export default ConfigStoreClass;
