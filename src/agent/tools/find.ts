const fs = require('fs');
const path = require('path');

/**
 * 创建 find 工具（查找文件）
 */
export function createFindTool(cwd: string) {
  return {
    name: 'find',
    label: 'Find',
    description: '使用 glob 模式查找文件，如 *.ts, **/*.json, src/**/*.spec.ts',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Glob 模式，如 *.ts, **/*.json, src/**/*.spec.ts'
        },
        searchPath: {
          type: 'string',
          description: '搜索目录（默认：当前目录）'
        },
        limit: {
          type: 'number',
          description: '最大结果数（默认：1000）'
        }
      },
      required: ['pattern']
    },
    execute: async (toolCallId: string, params: any, signal?: AbortSignal) => {
      const searchPath = params.searchPath ? path.resolve(cwd, params.searchPath) : cwd;
      const limit = params.limit || 1000;

      if (signal?.aborted) {
        throw new Error('Operation aborted');
      }

      if (!fs.existsSync(searchPath)) {
        throw new Error(`Search path not found: ${searchPath}`);
      }

      const results: string[] = [];

      // 递归搜索文件
      const searchDir = (dir: string, baseDir: string) => {
        try {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const fullPath = path.join(dir, file);
            const relPath = path.relative(baseDir, fullPath);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory() && !file.startsWith('.')) {
              searchDir(fullPath, baseDir);
            } else if (stat.isFile()) {
              // 检查是否匹配 glob 模式
              if (matchGlob(relPath, params.pattern)) {
                results.push(relPath);
                if (results.length >= limit) {
                  return;
                }
              }
            }
          }
        } catch (e) {
          // 跳过无权限的目录
        }
      };

      // 简单的 glob 匹配函数
      function matchGlob(filePath: string, pattern: string): boolean {
        // 转换 glob 模式为正则表达式
        let regexPattern = pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.');

        // 处理 ** (匹配多级目录)
        regexPattern = '^' + regexPattern.replace(/\*\*/g, '.*') + '$';

        try {
          const regex = new RegExp(regexPattern);
          return regex.test(filePath);
        } catch (e) {
          return false;
        }
      }

      searchDir(searchPath, cwd);

      // 格式化结果
      let result = results.length > 0
        ? results.join('\n')
        : `No files found matching pattern: ${params.pattern}`;

      if (results.length >= limit) {
        result += `\n[Results limited to ${limit} files]`;
      }

      return {
        content: [{ type: 'text', text: result }],
        details: { count: results.length, pattern: params.pattern }
      };
    }
  };
}
