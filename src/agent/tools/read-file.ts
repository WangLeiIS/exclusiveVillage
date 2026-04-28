const fs = require('fs');
const path = require('path');

/**
 * 创建 read_file 工具
 */
export function createReadFileTool(cwd: string) {
  return {
    name: 'read_file',
    label: 'Read File',
    description: '读取文件内容。支持文本文件，会自动截断过大的文件。',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '文件路径（相对或绝对路径）'
        },
        offset: {
          type: 'number',
          description: '起始行号（从1开始，可选）'
        },
        limit: {
          type: 'number',
          description: '最大读取行数（可选）'
        }
      },
      required: ['path']
    },
    execute: async (toolCallId: string, params: any, signal?: AbortSignal) => {
      const filePath = path.resolve(cwd, params.path);

      if (signal?.aborted) {
        throw new Error('Operation aborted');
      }

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      let content = fs.readFileSync(filePath, 'utf-8');
      let lines = content.split('\n');

      // 应用 offset
      const startLine = params.offset ? Math.max(0, params.offset - 1) : 0;
      if (startLine >= lines.length) {
        throw new Error(`Offset ${params.offset} is beyond end of file (${lines.length} lines)`);
      }

      // 应用 limit
      if (params.limit) {
        const endLine = Math.min(startLine + params.limit, lines.length);
        lines = lines.slice(startLine, endLine);

        if (startLine + params.limit < lines.length) {
          const remaining = lines.length - (startLine + params.limit);
          content = lines.join('\n') + `\n\n[${remaining} more lines in file. Use offset=${startLine + params.limit + 1} to continue.]`;
        } else {
          content = lines.join('\n');
        }
      } else {
        lines = lines.slice(startLine);
        content = lines.join('\n');
      }

      // 限制大小（最大 100KB）
      const maxSize = 100 * 1024;
      if (content.length > maxSize) {
        content = content.substring(0, maxSize) + `\n\n[Content truncated due to size. File is too large.]`;
      }

      return {
        content: [{ type: 'text', text: content }],
        details: { path: filePath, size: content.length }
      };
    }
  };
}
