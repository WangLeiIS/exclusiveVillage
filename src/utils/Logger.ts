const fs = require('fs');
const path = require('path');

/**
 * 日志级别
 */
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * 简单的日志管理器
 */
class Logger {
  private logsDir: string;
  private currentLogFile: string;
  private aiLogFile: string;
  private initialized: boolean = false;

  constructor() {
    // 延迟初始化，避免干扰Electron加载
    this.logsDir = path.join(process.cwd(), 'logs');
    this.currentLogFile = path.join(this.logsDir, 'app-current.log');
    this.aiLogFile = path.join(this.logsDir, 'ai-current.log');
  }

  /**
   * 延迟初始化
   */
  private lazyInit(): void {
    if (this.initialized) return;

    try {
      // 确保日志目录存在
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }

      // 更新日志文件名为当前日期
      const date = this.getDateString();
      this.currentLogFile = path.join(this.logsDir, `app-${date}.log`);
      this.aiLogFile = path.join(this.logsDir, `ai-${date}.log`);

      this.initialized = true;
    } catch (error) {
      // 静默失败，避免干扰应用启动
      console.error('[Logger] Initialization failed:', error);
    }
  }

  /**
   * 获取当前日期字符串
   */
  private getDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 获取当前时间戳
   */
  private getTimestamp(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: LogLevel, category: string, message: string, data?: any): string {
    const timestamp = this.getTimestamp();
    const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : '';
    return `[${timestamp}] [${level}] [${category}] ${message}${dataStr}`;
  }

  /**
   * 写入日志到文件
   */
  private writeToFile(file: string, message: string): void {
    try {
      this.lazyInit(); // 确保在写入前初始化
      fs.appendFileSync(file, message + '\n', 'utf8');
    } catch (error) {
      console.error('[Logger] Failed to write to file:', error);
    }
  }

  /**
   * 写入普通日志
   */
  private log(level: LogLevel, category: string, message: string, data?: any): void {
    const logMessage = this.formatMessage(level, category, message, data);

    // 输出到控制台
    console.log(logMessage);

    // 写入文件（延迟初始化）
    try {
      this.lazyInit();
      this.writeToFile(this.currentLogFile, logMessage);
    } catch (error) {
      // 静默失败，避免干扰应用运行
    }
  }

  /**
   * 调试日志
   */
  debug(category: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  /**
   * 信息日志
   */
  info(category: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  /**
   * 警告日志
   */
  warn(category: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  /**
   * 错误日志
   */
  error(category: string, message: string, error?: any): void {
    const errorData = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error;
    this.log(LogLevel.ERROR, category, message, errorData);
  }

  /**
   * AI 调用日志（专门记录 AI 交互）
   */
  logAIRequest(teamName: string, agentName: string, userMessage: string, systemPrompt?: string, conversationHistory?: any[]): void {
    const requestData: any = {
      teamName,
      agentName,
      userMessage,
      timestamp: new Date().toISOString()
    };

    // 如果有system prompt，记录下来
    if (systemPrompt) {
      requestData.systemPrompt = systemPrompt;
    }

    // 如果有对话历史，记录下来
    if (conversationHistory && conversationHistory.length > 0) {
      requestData.conversationHistory = conversationHistory.map((msg, index) => ({
        index: index + 1,
        role: msg.role,
        contentPreview: typeof msg.content === 'string' ? msg.content.substring(0, 100) + '...' : '[Complex content]',
        contentLength: typeof msg.content === 'string' ? msg.content.length : 'N/A'
      }));
    }

    const aiLogMessage = this.formatMessage(
      LogLevel.INFO,
      'AI_REQUEST',
      `Team: ${teamName}, Agent: ${agentName}`,
      requestData
    );
    this.writeToFile(this.aiLogFile, aiLogMessage);
    console.log(aiLogMessage);
  }

  logAIResponse(teamName: string, agentName: string, response: string, duration: number): void {
    const aiLogMessage = this.formatMessage(
      LogLevel.INFO,
      'AI_RESPONSE',
      `Team: ${teamName}, Agent: ${agentName}, Duration: ${duration}ms`,
      { response, responseLength: response.length }
    );
    this.writeToFile(this.aiLogFile, aiLogMessage);
    console.log(aiLogMessage);
  }

  logAIError(teamName: string, agentName: string, error: any): void {
    const aiLogMessage = this.formatMessage(
      LogLevel.ERROR,
      'AI_ERROR',
      `Team: ${teamName}, Agent: ${agentName}`,
      error
    );
    this.writeToFile(this.aiLogFile, aiLogMessage);
    console.log(aiLogMessage);
  }

  /**
   * IPC 调用日志
   */
  logIPCCall(channel: string, data?: any): void {
    this.debug('IPC', `Call: ${channel}`, data);
  }

  /**
   * 数据库操作日志
   */
  logDatabase(operation: string, details: string): void {
    this.debug('Database', `${operation}: ${details}`);
  }

  /**
   * 会话管理日志
   */
  logSession(action: string, sessionId: string): void {
    this.info('Session', `${action}: ${sessionId}`);
  }
}

// 导出单例
const logger = new Logger();
module.exports = { logger, Logger };
