const fs = require('fs');
const path = require('path');

/**
 * 创建 grep 工具（搜索文件内容）
 */
export function createGrepTool(cwd: string) {
  return {
    name: 'grep',
    label: 'Grep',
    description: '在文件中搜索文本模式。支持正则表达式和字面量搜索。',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: '搜索模式（正则表达式或字面量字符串）'
        },
        path: {
          type: 'string',
          description: '要搜索的目录或文件（默认：当前目录）'
        },
        glob: {
          type: 'string',
          description: '文件过滤器，如 *.ts 或 **/*.spec.ts'
        },
        ignoreCase: {
          type: 'boolean',
          description: '不区分大小写搜索（默认：false）'
        },
        literal: {
          type: 'boolean',
          description: '将模式视为字面量字符串而非正则表达式（默认：false）'
        },
        context: {
          type: 'number',
          description: '在每个匹配前后显示的行数（默认：0）'
        },
        limit: {
          type: 'number',
          description: '返回的最大匹配数（默认：100）'
        }
      },
      required: ['pattern']
    },
    execute: async (toolCallId: string, params: any, signal?: AbortSignal) => {
      const searchPath = params.path ? path.resolve(cwd, params.path) : cwd;
      const limit = params.limit || 100;
      const contextLines = params.context || 0;

      if (signal?.aborted) {
        throw new Error('Operation aborted');
      }

      // 构建搜索路径
      const targetPath = fs.existsSync(searchPath) ? searchPath : cwd;

      // 使用 Node.js 的 glob 和文件读取
      const glob = params.glob || '**/*';
      const matches: any[] = [];

      // 简化的 glob 实现（只支持 *.ext 格式）
      const pattern = glob.replace(/\*\*/g, '**').replace(/\*/g, '.*');
      const regex = new RegExp(pattern);

      // 递归搜索文件
      const searchDir = (dir: string, baseDir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const relPath = path.relative(baseDir, fullPath);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !file.startsWith('.')) {
            searchDir(fullPath, baseDir);
          } else if (stat.isFile() && regex.test(relPath)) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              const lines = content.split('\n');

              // 构建正则表达式
              let searchRegex: RegExp;
              try {
                const flags = params.ignoreCase ? 'gi' : 'g';
                searchRegex = params.literal
                  ? new RegExp(params.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
                  : new RegExp(params.pattern, flags);
              } catch (e) {
                throw new Error(`Invalid regex pattern: ${params.pattern}`);
              }

              // 搜索匹配
              for (let i = 0; i < lines.length; i++) {
                if (searchRegex.test(lines[i])) {
                  const start = Math.max(0, i - contextLines);
                  const end = Math.min(lines.length - 1, i + contextLines);
                  const matchLines = lines.slice(start, end + 1);

                  matches.push({
                    file: path.relative(cwd, fullPath),
                    line: i + 1,
                    content: matchLines.map((line: string, idx: number) => ({
                      line: start + idx + 1,
                      text: line,
                      isMatch: idx === i - start
                    }))
                  });

                  if (matches.length >= limit) {
                    break;
                  }
                }
              }

              if (matches.length >= limit) {
                break;
              }
            } catch (e) {
              // 跳过无法读取的文件（可能是二进制文件）
            }
          }
        }
      };

      searchDir(targetPath, cwd);

      // 格式化结果
      let result = '';
      matches.forEach((match: any) => {
        result += `\n${match.file}:${match.line}\n`;
        match.content.forEach((line: any) => {
          const prefix = line.isMatch ? '>' : ' ';
          result += ` ${prefix} ${line.line}: ${line.text}\n`;
        });
      });

      if (matches.length === 0) {
        result = `No matches found for pattern: ${params.pattern}`;
      } else if (matches.length >= limit) {
        result += `\n[Results limited to ${limit} matches]`;
      }

      return {
        content: [{ type: 'text', text: result.trim() }],
        details: { matchCount: matches.length, pattern: params.pattern }
      };
    }
  };
}
