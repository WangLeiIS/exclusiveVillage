const DatabaseManager = require('./DatabaseManager.js');
const { logger } = require('../utils/Logger.js');

/**
 * 团队和 Agent 管理器
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
              console.error(`[TeamManager] Failed to read team: ${teamName}`, error);
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
    console.log(`[TeamManager] Creating team: ${name}`);

    // 连接数据库（会自动创建）
    await this.dbManager.connect(name);
    await this.dbManager.close();

    // 自动创建vocal agent
    try {
      await this.createAgent(name, {
        name: `${name}-assistant`,
        role: '团队助手',
        class: 'assistant',
        isVocal: true,
        goalDescription: `我是${name}团队的AI助手，专注于处理团队相关的任务和协作。`
      });
      console.log(`[TeamManager] Auto-created vocal agent for team: ${name}`);
    } catch (error) {
      console.error(`[TeamManager] Failed to create vocal agent for team: ${name}`, error);
      // 不阻止团队创建，只记录错误
    }

    console.log(`[TeamManager] Team created: ${name}`);
    return { name, description };
  }

  /**
   * 删除团队
   */
  async deleteTeam(name: string) {
    console.log(`[TeamManager] Deleting team: ${name}`);

    const fs = await import('fs');
    const path = await import('path');

    const teamPath = path.join(this.dbManager.getAgentsDir(), name);

    if (fs.existsSync(teamPath)) {
      // 删除整个团队目录
      fs.rmSync(teamPath, { recursive: true, force: true });
      console.log(`[TeamManager] Team deleted: ${name}`);
    } else {
      throw new Error(`Team does not exist: ${name}`);
    }
  }

  /**
   * 列出团队中的所有 Agent
   */
  async listAgents(teamName: string) {
    console.log(`[TeamManager] Listing agents for team: ${teamName}`);

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

    console.log(`[TeamManager] Found ${agents.length} agents`);

    await this.dbManager.close();

    return agents;
  }

  /**
   * 创建 Agent
   */
  async createAgent(teamName: string, config: any) {
    console.log(`[TeamManager] Creating agent: ${config.name}`);

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

    console.log(`[TeamManager] Agent created: ${agent.id}`);
    return agent;
  }

  /**
   * 更新 Agent
   */
  async updateAgent(teamName: string, agentName: string, updates: any) {
    console.log(`[TeamManager] Updating agent: ${agentName}`);

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

    console.log(`[TeamManager] Agent updated`);
  }

  /**
   * 删除 Agent
   */
  async deleteAgent(teamName: string, agentName: string) {
    console.log(`[TeamManager] Deleting agent: ${agentName}`);

    const db = await this.dbManager.connect(teamName);

    db.exec(`DELETE FROM agents WHERE name = '${agentName}'`);

    await this.dbManager.close();

    console.log(`[TeamManager] Agent deleted`);
  }

  /**
   * 获取单个 Agent
   */
  async getAgent(teamName: string, agentName: string) {
    console.log(`[TeamManager] Getting agent: ${agentName}`);

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
    const teams = await this.listTeams();
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
const _teamManagerInstance = new TeamManager();
module.exports = { TeamManager, teamManager: _teamManagerInstance };
