/**
 * 工具管理器
 *
 * 为 Agent 提供工具支持，基于当前工作目录（CWD）
 * 所有工具实现都从 ./tools 目录导入
 */

const {
  createReadFileTool,
  createWriteFileTool,
  createEditTool,
  createGrepTool,
  createFindTool,
  createBashTool
} = require('./tools/index.js');

class ToolsManager {

  /**
   * 创建基础工具集（只读）
   */
  static createReadOnlyTools(cwd: string) {
    const tools = [];

    try {
      tools.push(createReadFileTool(cwd));
      console.log(`[ToolsManager] Created read_file tool for cwd: ${cwd}`);
    } catch (error) {
      console.error('[ToolsManager] Failed to create read_file tool:', error);
    }

    return tools;
  }

  /**
   * 创建完整工具集
   */
  static createFullTools(cwd: string) {
    const tools = [];

    try {
      tools.push(createReadFileTool(cwd));
      console.log(`[ToolsManager] Created read_file tool for cwd: ${cwd}`);
    } catch (error) {
      console.error('[ToolsManager] Failed to create read_file tool:', error);
    }

    try {
      tools.push(createWriteFileTool(cwd));
      console.log(`[ToolsManager] Created write_file tool for cwd: ${cwd}`);
    } catch (error) {
      console.error('[ToolsManager] Failed to create write_file tool:', error);
    }

    try {
      tools.push(createEditTool(cwd));
      console.log(`[ToolsManager] Created edit tool for cwd: ${cwd}`);
    } catch (error) {
      console.error('[ToolsManager] Failed to create edit tool:', error);
    }

    try {
      tools.push(createGrepTool(cwd));
      console.log(`[ToolsManager] Created grep tool for cwd: ${cwd}`);
    } catch (error) {
      console.error('[ToolsManager] Failed to create grep tool:', error);
    }

    try {
      tools.push(createFindTool(cwd));
      console.log(`[ToolsManager] Created find tool for cwd: ${cwd}`);
    } catch (error) {
      console.error('[ToolsManager] Failed to create find tool:', error);
    }

    try {
      tools.push(createBashTool(cwd));
      console.log(`[ToolsManager] Created bash tool for cwd: ${cwd}`);
    } catch (error) {
      console.error('[ToolsManager] Failed to create bash tool:', error);
    }

    return tools;
  }

  /**
   * 获取工具列表摘要
   */
  static getToolsSummary(tools: any[]): string {
    return tools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n');
  }
}

module.exports = { ToolsManager };
