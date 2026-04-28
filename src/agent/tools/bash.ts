const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * 创建 bash 工具
 */
export function createBashTool(cwd: string) {
  return {
    name: 'bash',
    label: 'Bash',
    description: '执行 shell 命令。在当前工作目录中执行。',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: '要执行的命令'
        }
      },
      required: ['command']
    },
    execute: async (toolCallId: string, params: any, signal?: AbortSignal) => {
      if (signal?.aborted) {
        throw new Error('Operation aborted');
      }

      try {
        const { stdout, stderr } = await execAsync(params.command, {
          cwd: cwd,
          timeout: 30000, // 30秒超时
          maxBuffer: 1024 * 1024 * 10 // 10MB 缓冲区
        });

        let output = stdout || '';
        if (stderr) {
          output += output ? '\n' + stderr : stderr;
        }

        return {
          content: [{ type: 'text', text: output || 'Command executed successfully (no output)' }],
          details: { command: params.command, exitCode: 0 }
        };
      } catch (error: any) {
        const errorMessage = error.stderr || error.message || 'Command failed';
        return {
          content: [{ type: 'text', text: `Error: ${errorMessage}` }],
          details: { command: params.command, exitCode: error.code || 1 },
          isError: true
        };
      }
    }
  };
}
