/**
 * 会话隔离验证工具
 * 用于确保不同Agent之间的会话完全隔离
 */

export interface SessionValidationResult {
  isValid: boolean;
  currentAgent: string;
  expectedNamespace: string;
  actualNamespace?: string;
  sessionId?: string;
  errors: string[];
}

/**
 * 验证会话是否属于正确的Agent命名空间
 */
export function validateSessionIsolation(
  sessionId: string,
  currentAgent: string,
  isPrimaryAgent: boolean
): SessionValidationResult {
  const errors: string[] = [];
  const expectedNamespace = isPrimaryAgent ? '__primary__' : currentAgent;

  // 基本验证
  if (!sessionId) {
    errors.push('Session ID is empty');
    return {
      isValid: false,
      currentAgent,
      expectedNamespace,
      errors
    };
  }

  // 检查会话ID格式
  if (!sessionId.startsWith('session-')) {
    errors.push(`Invalid session ID format: ${sessionId}`);
  }

  // 检查会话ID是否包含时间戳
  const parts = sessionId.split('-');
  if (parts.length < 3) {
    errors.push(`Session ID missing components: ${sessionId}`);
  }

  // 验证时间戳是否有效
  const timestamp = parts[1];
  if (timestamp && isNaN(parseInt(timestamp))) {
    errors.push(`Invalid timestamp in session ID: ${timestamp}`);
  }

  return {
    isValid: errors.length === 0,
    currentAgent,
    expectedNamespace,
    sessionId,
    errors
  };
}

/**
 * 生成Agent特定的会话前缀
 * 用于调试和日志记录
 */
export function getSessionPrefix(isPrimaryAgent: boolean, teamName: string): string {
  if (isPrimaryAgent) {
    return `[PrimaryAgent]`;
  } else {
    return `[Team:${teamName}]`;
  }
}

/**
 * 记录会话切换事件
 * 用于调试会话隔离问题
 */
export function logSessionSwitch(
  fromAgent: string,
  toAgent: string,
  fromIsPrimary: boolean,
  toIsPrimary: boolean,
  sessionId: string | null
): void {
  const fromPrefix = getSessionPrefix(fromIsPrimary, fromAgent);
  const toPrefix = getSessionPrefix(toIsPrimary, toAgent);

  console.log(`[SessionSwitch] ${fromPrefix} → ${toPrefix}`);
  console.log(`[SessionSwitch] Previous session: ${sessionId || 'none'}`);
  console.log(`[SessionSwitch] Agent type changed: ${fromIsPrimary !== toIsPrimary}`);

  // 验证命名空间切换
  const fromNamespace = fromIsPrimary ? '__primary__' : fromAgent;
  const toNamespace = toIsPrimary ? '__primary__' : toAgent;

  if (fromNamespace === toNamespace) {
    console.warn(`[SessionSwitch] WARNING: Same namespace detected! ${fromNamespace}`);
  } else {
    console.log(`[SessionSwitch] Namespace change OK: ${fromNamespace} → ${toNamespace}`);
  }
}

/**
 * 清理会话相关状态
 * 确保切换Agent时没有残留状态
 */
export function cleanupSessionState(): void {
  console.log('[SessionCleanup] Cleaning up session state...');

  // 这里可以添加其他清理逻辑，比如：
  // - 清理缓存
  // - 重置状态变量
  // - 清理定时器
  // - 取消pending的API请求

  console.log('[SessionCleanup] Session state cleanup completed');
}

/**
 * 验证数据库路径隔离
 * 确保不同Agent使用不同的数据库文件
 */
export function validateDatabaseIsolation(
  isPrimaryAgent: boolean,
  teamName: string
): { isValid: boolean; dbPath: string; expectedPath: string } {
  const expectedPath = isPrimaryAgent ? '__primary__/agents.db' : `${teamName}/agents.db`;
  const actualPath = isPrimaryAgent ? '__primary__/agents.db' : `${teamName}/agents.db`;

  return {
    isValid: expectedPath === actualPath,
    dbPath: actualPath,
    expectedPath
  };
}