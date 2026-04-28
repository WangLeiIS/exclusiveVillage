const fs = require('fs');
const path = require('path');

/**
 * 创建 write_file 工具
 */
export function createWriteFileTool(cwd: string) {
  return {
    name: 'write_file',
    label: 'Write File',
    description: '写入文件内容。如果文件存在则覆盖，不存在则创建。',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '文件路径（相对或绝对路径）'
        },
        content: {
          type: 'string',
          description: '要写入的内容'
        }
      },
      required: ['path', 'content']
    },
    execute: async (toolCallId: string, params: any, signal?: AbortSignal) => {
      const filePath = path.resolve(cwd, params.path);

      if (signal?.aborted) {
        throw new Error('Operation aborted');
      }

      // 确保目录存在
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, params.content, 'utf-8');

      return {
        content: [{ type: 'text', text: `File written: ${filePath}` }],
        details: { path: filePath, size: params.content.length }
      };
    }
  };
}
