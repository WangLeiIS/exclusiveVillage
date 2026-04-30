const DatabaseManager = require('../DatabaseManager.js');
const { logger } = require('../../utils/Logger.js');

/**
 * 团队 Agent 管理器
 *
 * 负责管理团队内部的 Agent 实例，包括创建、列出、更新和删除 Agent
 */
class TeamAgentManager {
  private dbManager: any;

  constructor() {
    this.dbManager = new DatabaseManager();
    logger.info('TeamAgentManager', 'TeamAgentManager initialized');
  }

  /**
   * 列出团队中的所有 Agent
   */
  async listAgents(teamName: string) {
    logger.info('TeamAgentManager', `Listing agents for team: ${teamName}`);

    const db = await this.dbManager.connect(teamName);
    const result = db.exec('SELECT * FROM agents ORDER BY id');

    const agents = [];

    if (result.length > 0) {
      // sql.js 返回格式: [{ columns: [...], values: [[row1], [row2], ...] }]
      const { values } = result[0];

      for (const row of values) {
        agents.push({
          id: row[0],
          name: row[1],
          role: row[2],
          class: row[3],
          status: row[4],
          is_vocal: row[5] === 1,
          coins: row[6],
          goal_description: row[7],
        });
      }
    }

    logger.info('TeamAgentManager', `Found ${agents.length} agents`);

    await this.dbManager.close();

    return agents;
  }

  /**
   * 创建 Agent
   */
  async createAgent(teamName: string, config: any) {
    logger.info('TeamAgentManager', `Creating agent: ${config.name}`);

    const db = await this.dbManager.connect(teamName);

    const isVocalInt = config.is_vocal ? 1 : 0;

    db.run(
      'INSERT INTO agents (name, role, class, is_vocal, status, coins, goal_description, team_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        config.name,
        config.role,
        config.class,
        isVocalInt,
        'active',
        0,
        config.goal_description || null,
        teamName,
      ]
    );

    // 查询新创建的 Agent
    const result = db.exec(`SELECT * FROM agents WHERE name = '${config.name}'`);

    await this.dbManager.close();

    if (result.length === 0) {
      throw new Error('Failed to create agent');
    }

    const { values } = result[0];
    const row = values[0];

    const agent = {
      id: row[0],
      name: row[1],
      role: row[2],
      class: row[3],
      status: row[4],
      is_vocal: row[5] === 1,
      coins: row[6],
      goal_description: row[7],
    };

    logger.info('TeamAgentManager', `Agent created: ${agent.id}`);
    return agent;
  }

  /**
   * 更新 Agent
   */
  async updateAgent(teamName: string, agentName: string, updates: any) {
    logger.info('TeamAgentManager', `Updating agent: ${agentName}`);

    const db = await this.dbManager.connect(teamName);

    const updatesArray = [];
    const params = [];

    if (updates.role) {
      updatesArray.push('role = ?');
      params.push(updates.role);
    }

    if (updates.goal_description !== undefined) {
      updatesArray.push('goal_description = ?');
      params.push(updates.goal_description);
    }

    if (updatesArray.length === 0) {
      await this.dbManager.close();
      return;
    }

    params.push(agentName);

    const sql = `UPDATE agents SET ${updatesArray.join(', ')} WHERE name = ?`;
    db.run(sql, params);

    await this.dbManager.close();

    logger.info('TeamAgentManager', `Agent updated`);
  }

  /**
   * 删除 Agent
   */
  async deleteAgent(teamName: string, agentName: string) {
    logger.info('TeamAgentManager', `Deleting agent: ${agentName}`);

    const db = await this.dbManager.connect(teamName);

    db.exec(`DELETE FROM agents WHERE name = '${agentName}'`);

    await this.dbManager.close();

    logger.info('TeamAgentManager', `Agent deleted`);
  }

  /**
   * 获取单个 Agent
   */
  async getAgent(teamName: string, agentName: string) {
    logger.info('TeamAgentManager', `Getting agent: ${agentName}`);

    const db = await this.dbManager.connect(teamName);

    const result = db.exec(`SELECT * FROM agents WHERE name = '${agentName}'`);

    await this.dbManager.close();

    if (result.length === 0) {
      return null;
    }

    const { values } = result[0];

    if (values.length === 0) {
      return null;
    }

    const row = values[0];
    return {
      id: row[0],
      name: row[1],
      role: row[2],
      class: row[3],
      status: row[4],
      is_vocal: row[5] === 1,
      coins: row[6],
      goal_description: row[7],
    };
  }

  /**
   * 获取所有团队和 Agent
   */
  async getAllTeamsWithAgents() {
    const { teamManager } = require('./TeamManager.js');
    const teams = await teamManager.listTeams();
    const result = [];

    for (const team of teams) {
      const agents = await this.listAgents(team.name);
      result.push({
        ...team,
        agents,
      });
    }

    return result;
  }
};

// 导出类和单例
const _teamAgentManagerInstance = new TeamAgentManager();
module.exports = { TeamAgentManager, teamAgentManager: _teamAgentManagerInstance };
