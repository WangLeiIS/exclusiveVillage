const SimpleAgent = require('./SimpleAgent.js');
const { logger } = require('../utils/Logger.js');

/**
 * Agent 会话信息
 */
interface SessionInfo {
  agent: any;
  createdAt: number;
  cwd: string;
}

/**
 * Agent 会话管理器
 *
 * 管理多个 Agent 实例的生命周期
 */
class AgentSessionManager {
  private sessions = new Map<string, SessionInfo>();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30分钟

  /**
   * 获取或创建 Agent 会话
   *
   * 修复：添加 userSessionId 参数，确保每个用户会话都有独立的 Agent 实例
   *
   * @param teamName - 团队名称
   * @param agentName - Agent 名称
   * @param config - Agent 配置
   * @param cwd - 工作目录
   * @param userSessionId - 用户会话 ID（从数据库 sessions 表的 id 字段）
   */
  async getOrCreate(
    teamName: string,
    agentName: string,
    config: any,
    cwd: string,
    userSessionId?: string  // 新增参数
  ): Promise<any> {
    // 修复：使用 userSessionId 作为 key 的一部分，确保每个会话独立
    // 如果没有提供 userSessionId，回退到旧的行为（不推荐）
    const sessionId = userSessionId
      ? this.getSessionId(teamName, agentName, userSessionId)
      : this.getSessionId(teamName, agentName);

    // 检查是否已存在
    const existing = this.sessions.get(sessionId);
    if (existing) {
      // 如果 CWD 不同，更新 CWD
      if (existing.cwd !== cwd) {
        logger.logSession('更新会话 CWD', sessionId, { oldCwd: existing.cwd, newCwd: cwd });
        existing.agent.setCwd(cwd);
        existing.cwd = cwd;
        // 验证 CWD 是否成功设置
        const validation = existing.agent.validateCwd();
        if (!validation.valid) {
          logger.logSession('CWD 验证失败', sessionId, { error: validation.error });
        } else {
          logger.logSession('CWD 验证成功', sessionId, { cwd: existing.cwd });
        }
      } else {
        logger.logSession('复用现有会话', sessionId, { cwd });
      }
      return existing.agent;
    }

    // 创建新 Agent
    logger.logSession('创建新会话', sessionId, { cwd });
    const agent = new SimpleAgent(
      config.name,
      config.role,
      config.systemPrompt
    );

    // 初始化 Agent（传入 CWD）
    await agent.init(config.systemPrompt, cwd);

    const sessionInfo: SessionInfo = {
      agent,
      createdAt: Date.now(),
      cwd,
    };

    this.sessions.set(sessionId, sessionInfo);

    return agent;
  }

  /**
   * 移除会话
   */
  remove(teamName: string, agentName: string): void {
    const sessionId = this.getSessionId(teamName, agentName);
    this.sessions.delete(sessionId);
    logger.logSession('移除会话', sessionId);
  }

  /**
   * 清理过期会话
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [sessionId, sessionInfo] of this.sessions) {
      const age = sessionInfo.createdAt;

      if (now - age > this.SESSION_TIMEOUT) {
        console.log(`[SessionManager] 清理过期会话: ${sessionId}`);
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[SessionManager] 清理了 ${cleaned} 个过期会话`);
    }

    return cleaned;
  }

  /**
   * 获取所有活跃会话
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * 获取会话数量
  */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * 获取会话的 CWD
   */
  getSessionCwd(teamName: string, agentName: string): string | undefined {
    const sessionId = this.getSessionId(teamName, agentName);
    const sessionInfo = this.sessions.get(sessionId);
    return sessionInfo?.cwd;
  }

  /**
   * 生成会话 ID
   *
   * 修复：添加 userSessionId 参数，确保每个用户会话都有唯一的 key
   */
  private getSessionId(teamName: string, agentName: string, userSessionId?: string): string {
    if (userSessionId) {
      // 格式: teamName:agentName:userSessionId
      return `${teamName}:${agentName}:${userSessionId}`;
    }
    // 向后兼容：旧格式
    return `${teamName}:${agentName}`;
  }
}

// 全局单例
const _sessionManager = new AgentSessionManager();

// 定期清理过期会话（每5分钟）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = _sessionManager.cleanup();
    if (cleaned > 0) {
      console.log(`[SessionManager] 定期清理: 移除了 ${cleaned} 个会话`);
    }
  }, 5 * 60 * 1000);
}

// 导出类和单例
module.exports = { AgentSessionManager, sessionManager: _sessionManager };
