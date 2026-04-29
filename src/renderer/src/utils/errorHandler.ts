/**
 * 统一的错误处理工具
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export interface ErrorState {
  hasError: boolean;
  message: string;
  code?: string;
}

/**
 * 处理API响应的错误
 */
export function handleApiResponse<T>(
  response: { success: boolean; data?: T; error?: string },
  defaultValue: T
): T {
  if (response.success && response.data !== undefined) {
    return response.data;
  }

  const errorMessage = response.error || 'Unknown error occurred';
  throw new AppError(errorMessage, 'API_ERROR');
}

/**
 * 安全地执行异步函数，捕获错误并转换为错误状态
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  onError?: (error: Error) => void
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    if (onError) {
      onError(error);
    }
    return { data: null, error };
  }
}

/**
 * 创建用户友好的错误消息
 */
export function getUserFriendlyMessage(error: Error): string {
  if (error instanceof AppError) {
    return error.message;
  }

  // 根据错误类型返回友好的消息
  if (error.message.includes('fetch')) {
    return '网络连接失败，请检查网络设置';
  }

  if (error.message.includes('timeout')) {
    return '请求超时，请稍后重试';
  }

  return `发生错误: ${error.message}`;
}

/**
 * 显示错误提示
 */
export function showErrorAlert(error: Error): void {
  const message = getUserFriendlyMessage(error);
  // 这里可以使用更好的UI通知系统替代alert
  console.error('App Error:', error);
  alert(message);
}