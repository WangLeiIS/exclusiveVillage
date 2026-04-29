const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');
const DatabaseManager = require('./DatabaseManager');

/**
 * 主理人Agent配置
 */
const PRIMARY_AGENT_CONFIG = {
  id: 'ren-wo-xing',
  name: '任我行',
  displayName: 'Ren.',
  role: '主理人',
  class: 'primary',
  isVocal: true,
  isUser: false,
  systemPrompt: `你是任我行（Ren.），一个全能型AI主理人，负责整个系统的统筹管理。

你的核心职责：
1. **系统导航**：帮助用户理解和使用整个系统的功能
2. **任务协调**：协调不同团队的专业Agent，确保任务高效完成
3. **问题诊断**：快速分析用户问题，判断应该由哪个团队或专业Agent处理
4. **全局视角**：从系统整体角度提供建议和解决方案

你的特点：
- 具备全局视野，了解所有团队和Agent的专业领域
- 擅长分析和规划，能将复杂任务分解为可执行步骤
- 友善专业，既是得力助手也是可靠顾问
- 学习能力强，能快速适应新需求和环境

工作原则：
- 优先考虑用户的整体目标和长期利益
- 当涉及专业领域时，主动建议相关团队的Agent
- 保持客观中立，为用户提供最佳建议
- 持续学习和优化，提升系统的整体效率`,
  coins: 1000,
  goalDescription: '全能型AI主理人，负责系统统筹、任务协调和全局规划'
};

/**
 * 主理人Agent管理器
 *
 * 负责管理主理人Agent的独立数据库和配置
 */
module.exports = class PrimaryAgentManager {
  private dbManager: any;
  private PRIMARY_TEAM_NAME: string;

  constructor() {
    this.dbManager = new DatabaseManager();
    this.PRIMARY_TEAM_NAME = '__primary__';
  }

  /**
   * 初始化主理人Agent
   */
  async initialize() {
    console.log('[PrimaryAgent] Initializing primary agent...');

    try {
      // 确保主理人数据库存在
      await this.ensureDatabase();

      // 检查主理人Agent是否存在
      const agent = await this.getPrimaryAgent();

      if (!agent) {
        console.log('[PrimaryAgent] Creating primary agent...');
        await this.createPrimaryAgent();
      } else {
        console.log('[PrimaryAgent] Primary agent already exists');
      }

      return await this.getPrimaryAgent();
    } catch (error) {
      console.error('[PrimaryAgent] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * 确保主理人数据库存在
   */
  async ensureDatabase() {
    const dbPath = this.dbManager.getTeamDbPath(this.PRIMARY_TEAM_NAME);

    if (!existsSync(dbPath)) {
      console.log(`[PrimaryAgent] Creating primary agent database: ${dbPath}`);

      // 创建主理人目录
      const primaryDir = resolve(this.dbManager.getAgentsDir(), this.PRIMARY_TEAM_NAME);
      if (!existsSync(primaryDir)) {
        mkdirSync(primaryDir, { recursive: true });
      }

      // 连接并初始化数据库
      await this.dbManager.connect(this.PRIMARY_TEAM_NAME);
    } else {
      // 连接现有数据库
      await this.dbManager.connect(this.PRIMARY_TEAM_NAME);
    }
  }

  /**
   * 创建主理人Agent
   */
  async createPrimaryAgent() {
    const sql = `
      INSERT INTO agents (name, role, class, status, is_vocal, is_user, coins, goal_description, team_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.dbManager.run(this.PRIMARY_TEAM_NAME, sql, [
      PRIMARY_AGENT_CONFIG.name,
      PRIMARY_AGENT_CONFIG.role,
      PRIMARY_AGENT_CONFIG.class,
      'active',
      PRIMARY_AGENT_CONFIG.isVocal ? 1 : 0,
      PRIMARY_AGENT_CONFIG.isUser ? 1 : 0,
      PRIMARY_AGENT_CONFIG.coins,
      PRIMARY_AGENT_CONFIG.goalDescription,
      this.PRIMARY_TEAM_NAME
    ]);

    console.log('[PrimaryAgent] Primary agent created successfully');
  }

  /**
   * 获取主理人Agent信息
   */
  async getPrimaryAgent() {
    const sql = 'SELECT * FROM agents WHERE class = ? LIMIT 1';
    const results = await this.dbManager.query(this.PRIMARY_TEAM_NAME, sql, ['primary']);

    if (results.length === 0) {
      return null;
    }

    const agent = results[0];

    // 转换字段类型
    return {
      ...agent,
      is_vocal: Boolean(agent.is_vocal),
      is_user: Boolean(agent.is_user),
      config: PRIMARY_AGENT_CONFIG
    };
  }

  /**
   * 获取主理人Agent的配置
   */
  getConfig() {
    return PRIMARY_AGENT_CONFIG;
  }

  /**
   * 获取主理人团队名称（用于数据库操作）
   */
  getTeamName() {
    return this.PRIMARY_TEAM_NAME;
  }

  /**
   * 更新主理人Agent信息
   */
  async updatePrimaryAgent(updates) {
    const allowedFields = ['role', 'goal_description', 'coins'];
    const updatesArray = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updatesArray.push(`${key} = ?`);
      }
    }

    if (updatesArray.length === 0) {
      return;
    }

    const sql = `UPDATE agents SET ${updatesArray.join(', ')} WHERE class = ?`;
    const params = [...Object.values(updates), 'primary'];

    await this.dbManager.run(this.PRIMARY_TEAM_NAME, sql, params);
    console.log('[PrimaryAgent] Primary agent updated');
  }
};