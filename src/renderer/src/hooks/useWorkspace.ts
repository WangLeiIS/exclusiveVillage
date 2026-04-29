import { useState, useEffect } from 'react';

/**
 * 管理工作目录状态和默认目录设置
 * @param currentTeam - 当前团队名称
 * @param isPrimaryAgent - 是否为主理人 Agent
 */
export function useWorkspace(currentTeam: string | null, isPrimaryAgent: boolean) {
  const [currentCwd, setCurrentCwd] = useState<string>('');

  // 设置默认工作目录
  useEffect(() => {
    const setDefaultCwd = async () => {
      // 只在选择了 Agent 且没有设置工作目录时执行
      if ((currentTeam || isPrimaryAgent) && !currentCwd) {
        try {
          const response = await window.electronAPI.getDefaultCwd();
          if (response.success && response.data) {
            const cwd = response.data.trim();

            // 确保不是打包目录
            if (isValidWorkingDirectory(cwd)) {
              console.log('[useWorkspace] 设置默认工作目录:', cwd);
              setCurrentCwd(cwd);
            } else {
              // 如果返回的是打包目录，使用用户主目录
              const homeDir = process.env.HOME || process.env.USERPROFILE || '';
              console.log('[useWorkspace] 检测到打包目录，使用用户主目录:', homeDir);
              setCurrentCwd(homeDir);
            }
          }
        } catch (error) {
          console.error('[useWorkspace] 获取默认目录失败:', error);
          // 使用用户主目录作为最后的备选
          const homeDir = process.env.HOME || process.env.USERPROFILE || '';
          setCurrentCwd(homeDir);
        }
      }
    };

    setDefaultCwd();
  }, [currentTeam, isPrimaryAgent, currentCwd]);

  // 获取有效的默认目录（用于创建新会话等场景）
  const getValidDefaultDirectory = async (): Promise<string> => {
    // 如果当前已有有效目录，直接返回
    if (currentCwd && isValidWorkingDirectory(currentCwd)) {
      return currentCwd;
    }

    // 否则尝试获取系统默认目录
    try {
      const response = await window.electronAPI.getDefaultCwd();
      if (response.success && response.data && isValidWorkingDirectory(response.data)) {
        return response.data;
      }
    } catch (error) {
      console.warn('[useWorkspace] 获取默认目录失败，使用当前目录');
    }

    // 最后的备选：返回用户主目录
    return process.env.HOME || process.env.USERPROFILE || '.';
  };

  return {
    currentCwd,
    setCurrentCwd,
    getValidDefaultDirectory
  };
}

/**
 * 验证目录是否为有效的工作目录（非打包目录）
 */
function isValidWorkingDirectory(cwd: string): boolean {
  const invalidPatterns = ['win-unpacked', 'mac-arm64', 'linux-unpacked', 'app.asar'];
  return cwd && !invalidPatterns.some(pattern => cwd.includes(pattern));
}
