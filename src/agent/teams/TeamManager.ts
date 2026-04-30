const DatabaseManager = require('../DatabaseManager.js');
const { logger } = require('../../utils/Logger.js');

/**
 * 团队管理器
 *
 * 负责团队的生命周期管理，包括创建、列出和删除团队
 */
class TeamManager {
  private dbManager: any;

  constructor() {
    this.dbManager = new DatabaseManager();
    logger.info('TeamManager', 'TeamManager initialized');
  }

  /**
   * 列出所有团队
   */
  async listTeams() {
    const fs = await import('fs');
    const path = await import('path');

    const teamsDir = this.dbManager.getAgentsDir();
    const teams = [];

    // 扫描 agents-dir 目录
    if (fs.existsSync(teamsDir)) {
      const entries = fs.readdirSync(teamsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const teamName = entry.name;
          const dbPath = path.join(teamsDir, teamName, 'agents.db');

          if (fs.existsSync(dbPath)) {
            try {
              const db = await this.dbManager.connect(teamName);

              // 获取 Agent 数量
              const agentResult = db.exec('SELECT COUNT(*) as count FROM agents');
              const agentCount = agentResult.length > 0 ? agentResult[0].values[0][0] : 0;

              teams.push({
                id: teamName,
                name: teamName,
                description: null,
                agent_count: agentCount,
              });

              await this.dbManager.close();
            } catch (error) {
              logger.error('TeamManager', `Failed to read team: ${teamName}`, error);
            }
          }
        }
      }
    }

    return teams;
  }

  /**
   * 创建团队
   */
  async createTeam(name: string, description?: string) {
    logger.info('TeamManager', `Creating team: ${name}`);

    // 连接数据库（会自动创建）
    await this.dbManager.connect(name);
    await this.dbManager.close();

    // 自动创建vocal agent - 委托给 TeamAgentManager
    const { teamAgentManager } = require('./TeamAgentManager.js');
    try {
      await teamAgentManager.createAgent(name, {
        name: `${name}-assistant`,
        role: '团队助手',
        class: 'assistant',
        isVocal: true,
        goalDescription: `我是${name}团队的AI助手，专注于处理团队相关的任务和协作。`
      });
      logger.info('TeamManager', `Auto-created vocal agent for team: ${name}`);
    } catch (error) {
      logger.error('TeamManager', `Failed to create vocal agent for team: ${name}`, error);
      // 不阻止团队创建，只记录错误
    }

    logger.info('TeamManager', `Team created: ${name}`);
    return { name, description };
  }

  /**
   * 删除团队
   */
  async deleteTeam(name: string) {
    logger.info('TeamManager', `Deleting team: ${name}`);

    const fs = await import('fs');
    const path = await import('path');

    const teamPath = path.join(this.dbManager.getAgentsDir(), name);

    if (fs.existsSync(teamPath)) {
      // 删除整个团队目录
      fs.rmSync(teamPath, { recursive: true, force: true });
      logger.info('TeamManager', `Team deleted: ${name}`);
    } else {
      throw new Error(`Team does not exist: ${name}`);
    }
  }
};

// 导出类和单例
const _teamManagerInstance = new TeamManager();
module.exports = { TeamManager, teamManager: _teamManagerInstance };
