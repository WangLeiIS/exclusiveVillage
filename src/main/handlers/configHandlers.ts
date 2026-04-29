import { ipcMain } from 'electron';
import { getConfigStore, AIProviderConfig } from '../utils/ConfigStore';

/**
 * 注册配置相关的 IPC handlers
 */
export function registerConfigHandlers(): void {
  const configStore = getConfigStore();

  /**
   * 获取当前 AI 配置
   */
  ipcMain.handle('config:get-ai-config', async () => {
    try {
      const config = await configStore.get();
      return {
        success: true,
        data: config,
      };
    } catch (error) {
      console.error('[configHandlers] 获取配置失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取配置失败',
      };
    }
  });

  /**
   * 保存 AI 配置
   */
  ipcMain.handle('config:save-ai-config', async (_event, config: AIProviderConfig) => {
    try {
      const result = await configStore.save(config);
      return result;
    } catch (error) {
      console.error('[configHandlers] 保存配置失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '保存配置失败',
      };
    }
  });

  /**
   * 验证 API Key 格式
   */
  ipcMain.handle('config:validate-api-key', async (_event, provider: string, key: string) => {
    try {
      const result = configStore.validateAPIKey(provider, key);
      return result;
    } catch (error) {
      console.error('[configHandlers] 验证 API Key 失败:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : '验证 API Key 失败',
      };
    }
  });

  /**
   * 重置为默认配置
   */
  ipcMain.handle('config:reset-to-defaults', async () => {
    try {
      const result = await configStore.resetToDefaults();
      return result;
    } catch (error) {
      console.error('[configHandlers] 重置配置失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '重置配置失败',
      };
    }
  });

  /**
   * 检查 API Key 是否已配置
   */
  ipcMain.handle('config:check-api-keys', async () => {
    try {
      const config = await configStore.get();
      const selectedProvider = config.provider;
      const hasKey = !!config.apiKeys[selectedProvider];

      return {
        success: true,
        data: {
          hasKeys: hasKey,
          provider: selectedProvider,
        },
      };
    } catch (error) {
      console.error('[configHandlers] 检查 API Key 失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '检查 API Key 失败',
      };
    }
  });

  console.log('[configHandlers] 配置相关的 IPC handlers 已注册');
}
