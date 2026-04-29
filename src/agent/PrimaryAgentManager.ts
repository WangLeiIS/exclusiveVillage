const DatabaseManager = require('./DatabaseManager');
const { logger } = require('../utils/Logger');

/**
 * 主理人Agent配置（硬编码部分）
 */
const PRIMARY_AGENT_CONFIG = {
  displayName: 'Ren.',
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
- 持续学习和优化，提升系统的整体效率`
};

/**
 * 主理人Agent管理器
 *
 * 负责管理主理人Agent的独立数据库
 */
module.exports = class PrimaryAgentManager {
  private dbManager: any;
  private PRIMARY_TEAM_NAME: string;
  private cachedConfig: any = null;

  constructor() {
    this.dbManager = new DatabaseManager();
    this.PRIMARY_TEAM_NAME = '__primary__';
  }

  /**
   * 初始化主理人Agent
   */
  async initialize() {
    logger.info('PrimaryAgent', 'Initializing primary agent...');

    try {
      // 连接到主理人数据库（如果首次使用，会自动从 metadata 复制）
      await this.dbManager.connect(this.PRIMARY_TEAM_NAME);

      // 获取主理人Agent信息
      const agent = await this.getPrimaryAgent();

      if (agent) {
        logger.info('PrimaryAgent', 'Primary agent loaded successfully');
        // 缓存配置数据
        this.cachedConfig = {
          name: agent.name,
          displayName: PRIMARY_AGENT_CONFIG.displayName,
          role: agent.role,
          class: agent.class,
          systemPrompt: PRIMARY_AGENT_CONFIG.systemPrompt,
          isVocal: agent.is_vocal,
          isUser: agent.is_user,
          coins: agent.coins,
          goalDescription: agent.goal_description,
          teamName: agent.team_name
        };
      } else {
        logger.error('PrimaryAgent', 'Primary agent not found in database');
        throw new Error('Primary agent not found in database');
      }

      return agent;
    } catch (error) {
      logger.error('PrimaryAgent', 'Initialization failed', error);
      throw error;
    }
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
      is_user: Boolean(agent.is_user)
    };
  }

  /**
   * 获取主理人团队名称（用于数据库操作）
   */
  getTeamName() {
    return this.PRIMARY_TEAM_NAME;
  }

  /**
   * 获取主理人Agent的配置
   * 注意：这是一个同步方法，返回初始化时缓存的配置数据
   */
  getConfig() {
    if (!this.cachedConfig) {
      // 如果还没有初始化，返回基础配置
      return {
        ...PRIMARY_AGENT_CONFIG,
        name: '任我行',
        role: '主理人',
        class: 'primary'
      };
    }

    return this.cachedConfig;
  }

  /**
   * 更新主理人Agent信息
   */
  async updatePrimaryAgent(updates: any) {
    const allowedFields = ['role', 'goal_description', 'coins'];
    const updatesArray = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updatesArray.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (updatesArray.length === 0) {
      return;
    }

    const sql = `UPDATE agents SET ${updatesArray.join(', ')} WHERE class = ?`;
    params.push('primary');

    await this.dbManager.run(this.PRIMARY_TEAM_NAME, sql, params);
    logger.info('PrimaryAgent', 'Primary agent updated');
  }
};