import { ipcMain } from 'electron';
import { getConfigStore, AIProviderConfig } from '../utils/ConfigStore';
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
 * 注册配置相关的 IPC handlers
 */
export function registerConfigHandlers(): void {
  const configStore = getConfigStore();

  /**
   * 获取当前 AI 配置
   */
  ipcMain.handle('config:get-ai-config', async () => {
    logToFile('[configHandlers] 收到获取配置请求');
    try {
      const config = await configStore.get();
      logToFile('[configHandlers] 获取配置成功, provider:', config.provider);
      return {
        success: true,
        data: config,
      };
    } catch (error) {
      logToFile('[configHandlers] 获取配置失败:', error);
      logToFile('[configHandlers] 错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
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
    logToFile('[configHandlers] 收到保存配置请求');
    logToFile('[configHandlers] 接收到的配置数据:', config);

    try {
      logToFile('[configHandlers] 调用 configStore.save()');
      const result = await configStore.save(config);
      logToFile('[configHandlers] configStore.save() 返回结果:', result);

      if (result.success) {
        logToFile('[configHandlers] 配置保存成功');
      } else {
        logToFile('[configHandlers] 配置保存失败, 错误:', result.error);
      }

      return result;
    } catch (error) {
      logToFile('[configHandlers] 保存配置时发生异常');
      logToFile('[configHandlers] 错误详情:', error);
      logToFile('[configHandlers] 错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
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
      logToFile('[configHandlers] 验证 API Key 失败:', error);
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
      logToFile('[configHandlers] 重置配置失败:', error);
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
      logToFile('[configHandlers] 检查 API Key 失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '检查 API Key 失败',
      };
    }
  });

  logToFile('[configHandlers] 配置相关的 IPC handlers 已注册');
}
