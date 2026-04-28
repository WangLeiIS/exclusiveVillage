const fs = require('fs');
const path = require('path');

/**
 * 创建 edit 工具（基于文本替换）
 */
export function createEditTool(cwd: string) {
  return {
    name: 'edit',
    label: 'Edit',
    description: '编辑文件：基于精确文本匹配进行一个或多个替换。每个 edit 都是基于原始文件独立匹配的，不能有重叠。',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '文件路径（相对或绝对路径）'
        },
        edits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              oldText: {
                type: 'string',
                description: '要替换的精确文本，必须在文件中唯一'
              },
              newText: {
                type: 'string',
                description: '替换后的文本'
              }
            },
            required: ['oldText', 'newText']
          }
        }
      },
      required: ['path', 'edits']
    },
    execute: async (toolCallId: string, params: any, signal?: AbortSignal) => {
      const filePath = path.resolve(cwd, params.path);

      if (signal?.aborted) {
        throw new Error('Operation aborted');
      }

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // 读取文件内容
      let content = fs.readFileSync(filePath, 'utf-8');

      // 应用所有编辑
      const changes = [];
      for (const edit of params.edits) {
        if (!content.includes(edit.oldText)) {
          throw new Error(`oldText not found in file: "${edit.oldText.substring(0, 50)}..."`);
        }

        // 计算替换次数
        const count = content.split(edit.oldText).length - 1;
        if (count > 1) {
          throw new Error(`oldText appears ${count} times in file, must be unique`);
        }

        // 执行替换
        content = content.replace(edit.oldText, edit.newText);
        changes.push({
          oldText: edit.oldText.substring(0, 50) + (edit.oldText.length > 50 ? '...' : ''),
          newText: edit.newText.substring(0, 50) + (edit.newText.length > 50 ? '...' : '')
        });
      }

      // 写回文件
      fs.writeFileSync(filePath, content, 'utf-8');

      return {
        content: [{ type: 'text', text: `Made ${changes.length} edit(s) to ${filePath}` }],
        details: { path: filePath, changes }
      };
    }
  };
}
