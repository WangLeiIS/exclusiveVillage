import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// 文件日志函数
function logToFile(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  const dataMessage = data ? `${JSON.stringify(data, null, 2)}\n` : '';

  const logPath = path.join(app.getPath('userData'), 'config-debug.log');
  try {
    fs.appendFileSync(logPath, logMessage + dataMessage);
  } catch (error) {
    // 如果写日志失败，至少输出到console
    console.log(message, data);
  }

  // 同时输出到console
  console.log(message, data);
}

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
      logToFile('[ConfigStore] loadConfig: 开始加载配置');
      logToFile('[ConfigStore] loadConfig: 配置路径:', this.configPath);

      if (fs.existsSync(this.configPath)) {
        logToFile('[ConfigStore] loadConfig: 配置文件存在，开始读取');
        const data = fs.readFileSync(this.configPath, 'utf-8');
        logToFile('[ConfigStore] loadConfig: 文件读取成功，数据长度:', data.length);

        const parsed = JSON.parse(data);
        logToFile('[ConfigStore] loadConfig: JSON解析成功');
        logToFile('[ConfigStore] loadConfig: 解析后的配置:', JSON.stringify(parsed, null, 2));

        // 验证配置格式
        logToFile('[ConfigStore] loadConfig: 开始验证配置格式');
        if (this.validateConfig(parsed)) {
          this.config = parsed;
          logToFile('[ConfigStore] loadConfig: 配置格式验证通过，配置已加载');
          logToFile('[ConfigStore] loadConfig: 当前provider:', this.config?.provider);
        } else {
          logToFile('[ConfigStore] loadConfig: 配置格式无效，使用默认配置');
          this.config = { ...DEFAULT_CONFIG };
        }
      } else {
        // 配置文件不存在，创建默认配置
        logToFile('[ConfigStore] loadConfig: 配置文件不存在，创建默认配置');
        logToFile('[ConfigStore] loadConfig: 默认配置:', JSON.stringify(DEFAULT_CONFIG, null, 2));
        this.config = { ...DEFAULT_CONFIG };
        await this.saveConfig();
      }
    } catch (error) {
      logToFile('[ConfigStore] loadConfig: 加载配置失败');
      logToFile('[ConfigStore] loadConfig: 错误详情:', error);
      logToFile('[ConfigStore] loadConfig: 错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
      logToFile('[ConfigStore] loadConfig: 使用默认配置');
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  /**
   * 保存配置到文件
   */
  private async saveConfig(): Promise<void> {
    try {
      logToFile('[ConfigStore] saveConfig: 开始保存配置到文件');
      logToFile('[ConfigStore] saveConfig: 配置路径:', this.configPath);

      // 更新时间戳
      if (this.config) {
        const oldTimestamp = this.config.lastUpdated;
        this.config.lastUpdated = Date.now();
        logToFile('[ConfigStore] saveConfig: 更新时间戳', { from: oldTimestamp, to: this.config.lastUpdated });
      }

      // 检查目录是否存在
      const userDataDir = path.dirname(this.configPath);
      logToFile('[ConfigStore] saveConfig: 检查目录是否存在:', userDataDir);
      if (!fs.existsSync(userDataDir)) {
        logToFile('[ConfigStore] saveConfig: 目录不存在，创建目录');
        fs.mkdirSync(userDataDir, { recursive: true });
      }

      // 原子写入：先写入临时文件，然后重命名
      const tempPath = this.configPath + '.tmp';
      logToFile('[ConfigStore] saveConfig: 创建临时文件:', tempPath);

      const configJson = JSON.stringify(this.config, null, 2);
      logToFile('[ConfigStore] saveConfig: 配置JSON长度:', configJson.length);

      fs.writeFileSync(tempPath, configJson, 'utf-8');
      logToFile('[ConfigStore] saveConfig: 临时文件写入成功');

      // 重命名临时文件为正式文件
      fs.renameSync(tempPath, this.configPath);
      logToFile('[ConfigStore] saveConfig: 文件重命名成功');

      // 验证文件是否真的存在
      const fileExists = fs.existsSync(this.configPath);
      logToFile('[ConfigStore] saveConfig: 验证文件存在:', fileExists);

      if (fileExists) {
        const stats = fs.statSync(this.configPath);
        logToFile('[ConfigStore] saveConfig: 文件大小:', { size: stats.size, unit: 'bytes' });
      }

      logToFile('[ConfigStore] 配置已保存:', this.configPath);
    } catch (error) {
      logToFile('[ConfigStore] saveConfig: 保存配置失败');
      logToFile('[ConfigStore] saveConfig: 错误详情:', error);
      logToFile('[ConfigStore] saveConfig: 错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
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
    logToFile('[ConfigStore] 开始保存配置, 配置路径:', this.configPath);
    logToFile('[ConfigStore] 接收到的配置:', config);

    try {
      // 验证配置
      logToFile('[ConfigStore] 开始验证配置格式');
      if (!this.validateConfig(config)) {
        logToFile('[ConfigStore] 配置格式验证失败');
        return {
          success: false,
          error: '配置格式无效',
        };
      }
      logToFile('[ConfigStore] 配置格式验证通过');

      // 验证选中的供应商是否有 API Key
      const selectedProvider = config.provider;
      logToFile('[ConfigStore] 当前选中的提供商:', selectedProvider);
      logToFile('[ConfigStore] API Keys 状态:', Object.keys(config.apiKeys).map(key => `${key}: ${!!config.apiKeys[key as keyof typeof config.apiKeys]}`));

      if (!config.apiKeys[selectedProvider]) {
        logToFile('[ConfigStore] 选中的提供商缺少 API Key:', selectedProvider);
        return {
          success: false,
          error: `未为选中的提供商 (${selectedProvider}) 配置 API Key`,
        };
      }
      logToFile('[ConfigStore] API Key 验证通过');

      // 初始化并保存
      logToFile('[ConfigStore] 开始初始化配置存储');
      await this.initialize();
      logToFile('[ConfigStore] 配置存储初始化完成');

      this.config = config;
      logToFile('[ConfigStore] 配置已设置到内存');

      logToFile('[ConfigStore] 开始保存配置到文件');
      await this.saveConfig();
      logToFile('[ConfigStore] 配置已成功保存到文件');

      return { success: true };
    } catch (error) {
      logToFile('[ConfigStore] 保存配置失败, 错误详情:', error);
      logToFile('[ConfigStore] 错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
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
      logToFile('[ConfigStore] 重置配置失败:', error);
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
