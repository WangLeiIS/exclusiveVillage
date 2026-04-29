// 获取日志实例（延迟加载）
function getLogger() {
  const { logger } = require('../utils/Logger.js');
  return logger;
}

// 动态导入 ES 模块
let Agent: any;
let getModel: any;
let toolsManagerModule: any;

async function initModules() {
  if (!Agent || !getModel || !toolsManagerModule) {
    // 动态导入 pi-agent-core 和 pi-ai（ES 模块）
    const piAgentCore = await import('@mariozechner/pi-agent-core');
    const piAi = await import('@mariozechner/pi-ai');

    Agent = piAgentCore.Agent;
    getModel = piAi.getModel;

    // 导入本地的 ToolsManager
    toolsManagerModule = require('./ToolsManager.js');
  }
}

module.exports = class SimpleAgent {
  private agent: any;
  private createdAt: number;
  private cwd: string;

  constructor(
    public readonly name: string,
    public readonly role: string,
    systemPrompt?: string
  ) {
    this.createdAt = Date.now();
    this.cwd = '';
  }

  /**
   * 设置工作目录
   */
  setCwd(cwd: string) {
    this.cwd = cwd;
    const logger = getLogger();
    logger.info('SimpleAgent', `CWD set to: ${cwd}`);
  }

  /**
   * 获取工作目录
   */
  getCwd(): string {
    return this.cwd;
  }

  /**
   * 验证工作目录是否存在
   */
  validateCwd(): { valid: boolean; error?: string } {
    if (!this.cwd) {
      return { valid: false, error: '工作目录未设置' };
    }

    const fs = require('fs');

    if (!fs.existsSync(this.cwd)) {
      return { valid: false, error: `工作目录不存在: ${this.cwd}` };
    }

    const stats = fs.statSync(this.cwd);
    if (!stats.isDirectory()) {
      return { valid: false, error: `路径不是目录: ${this.cwd}` };
    }

    return { valid: true };
  }

  /**
   * 初始化 Agent（必须在构造后调用）
   */
  async init(systemPrompt?: string, cwd?: string) {
    // 初始化 ES 模块
    await initModules();

    // 设置工作目录
    if (cwd) {
      this.setCwd(cwd);
    }

    // 验证工作目录
    const validation = this.validateCwd();
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 从 ConfigStore 读取 AI 配置
    const { getConfigStore } = require('../main/utils/ConfigStore.js');
    const configStore = getConfigStore();
    const config = await configStore.get();

    const provider = config.provider;
    const model = config.model;

    // 获取 AI 模型
    const aiModel = getModel(provider, model);

    const logger = getLogger();
    logger.info('SimpleAgent', `Creating agent: ${this.name}`, {
      provider,
      model,
      cwd: this.cwd,
      toolsEnabled: true,
      configSource: 'config-store'
    });

    // 创建工具集
    const tools = toolsManagerModule.ToolsManager.createFullTools(this.cwd);
    logger.info('SimpleAgent', `Loaded ${tools.length} tools`, {
      tools: tools.map((t: any) => t.name)
    });

    // 创建 Agent 实例
    this.agent = new Agent({
      initialState: {
        systemPrompt: systemPrompt || `你是${this.name}，角色是${this.role}。

## 工作目录
当前工作目录: ${this.cwd}

## 可用工具
你现在可以使用以下工具来操作文件系统：
- read_file: 读取文件内容
- write_file: 写入文件内容
- bash: 执行 shell 命令

用户会给你文件操作任务，请使用这些工具来完成。`,
        model: aiModel,
        tools: tools,
        messages: [],
      },
      sessionId: `${this.name}-${Date.now()}`,
      getApiKey: (provider: string) => {
        // 从 ConfigStore 读取 API Key
        const apiKey = config.apiKeys[provider];

        if (!apiKey) {
          throw new Error(`未设置 ${provider} API Key，请在设置页面配置`);
        }

        logger.debug('SimpleAgent', `Using API Key from config: ${provider}`);
        return apiKey;
      },
    });

    // 订阅事件（用于调试）- 记录到日志文件
    this.agent.subscribe((event: any) => {
      logger.debug('SimpleAgent', `Event: ${event.type}`, { eventType: event.type });

      // 记录工具调用
      if (event.type === 'tool_execution_start') {
        logger.info('SimpleAgent', `Tool started: ${event.toolName}`, {
          tool: event.toolName,
          args: event.args
        });
      }

      // 记录工具执行结果
      if (event.type === 'tool_execution_end') {
        logger.info('SimpleAgent', `Tool completed: ${event.toolName}`, {
          tool: event.toolName,
          success: !event.isError
        });
      }
    });
  }

  /**
   * 发送消息并获取回复
   */
  async chat(message: string) {
    if (!this.agent) {
      await this.init();
    }

    const startTime = Date.now();
    const logger = getLogger();

    // 获取完整的对话上下文
    const conversationHistory = this.agent.state.messages || [];
    const systemPrompt = this.agent.state.systemPrompt || '';

    // 记录完整的AI请求（包括system prompt和对话历史）
    logger.logAIRequest(this.name, this.name, message, systemPrompt, conversationHistory);
    logger.debug('SimpleAgent', `Sending message`, { message: message.substring(0, 50) + '...' });

    try {
      // 发送消息
      await this.agent.prompt(message);

      // 等待响应完成（包括工具执行）
      await this.agent.waitForIdle();

      // 提取 AI 回复
      const response = this.getLastAssistantMessage();

      const duration = Date.now() - startTime;

      logger.logAIResponse(this.name, this.name, response, duration);
      logger.debug('SimpleAgent', `Received response`, {
        response: response.substring(0, 50) + '...',
        duration
      });

      return {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('SimpleAgent', 'Chat failed', error);
      throw error;
    }
  }

  /**
   * 获取对话历史
   */
  getHistory() {
    if (!this.agent) {
      return [];
    }

    return this.agent.state.messages
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .map((m: any) => ({
        role: m.role,
        content: this.extractText(m.content),
        timestamp: Date.now(),
      }));
  }

  /**
   * 重置对话
   */
  reset() {
    if (this.agent) {
      const logger = getLogger();
      logger.info('SimpleAgent', 'Resetting conversation');

      const oldCwd = this.cwd;
      this.agent.reset();

      // 重新设置 CWD（因为 reset 会清除状态）
      this.cwd = oldCwd;
    }
  }

  /**
   * 检查 Agent 是否空闲
   */
  isIdle() {
    return this.agent ? !this.agent.state.isStreaming : true;
  }

  /**
   * 获取最后一条助手消息
   */
  private getLastAssistantMessage(): string {
    const messages = this.agent.state.messages;
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || lastMessage.role !== 'assistant') {
      throw new Error('No assistant response found');
    }

    return this.extractText(lastMessage.content);
  }

  /**
   * 从消息内容中提取文本
   */
  private extractText(content: any[]): string {
    if (!Array.isArray(content)) {
      return String(content || '');
    }

    return content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n');
  }

  /**
   * 获取 Agent 年龄（毫秒）
   */
  getAge() {
    return Date.now() - this.createdAt;
  }
};
