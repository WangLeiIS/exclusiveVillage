const { resolve } = require('path');
const { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } = require('fs');
const initSqlJs = require('sql.js');
const { logger } = require('../utils/Logger');

/**
 * 数据库管理器
 *
 * 负责管理团队和 Agent 的 SQLite 数据库
 */
module.exports = class DatabaseManager {
  private db: any = null;
  private SQL: any = null;
  private dbPath!: string;
  private agentsDir: string;

  constructor(agentsDir?: string) {
    // 加载 AGENTS_DIR 配置
    this.agentsDir = agentsDir || process.env.AGENTS_DIR || './agents-data';
    logger.debug('Database', `AGENTS_DIR: ${this.agentsDir}`);

    // 确保目录存在
    this.ensureDirectory(this.agentsDir);
  }

  /**
   * 获取 agents 目录
   */
  getAgentsDir(): string {
    return this.agentsDir;
  }

  /**
   * 获取 metadata 目录（预置数据目录）
   */
  getMetadataDir(): string {
    // 在开发环境中，metadata 在项目根目录
    // 在打包后的应用中，metadata 在 resources 目录
    const isDev = process.env.NODE_ENV === 'development' && process.defaultApp;

    let metadataDir: string;
    if (isDev) {
      metadataDir = resolve(process.cwd(), 'metadata');
    } else {
      // 生产环境：metadata 在 resources/metadata
      const resourcesPath = process.resourcesPath;
      metadataDir = resolve(resourcesPath, 'metadata');
    }

    logger.debug('Database', `Environment: ${isDev ? 'development' : 'production'}`);
    logger.debug('Database', `Metadata directory: ${metadataDir}`);
    logger.debug('Database', `Process resourcesPath: ${process.resourcesPath}`);
    logger.debug('Database', `Process cwd: ${process.cwd()}`);
    logger.debug('Database', `process.defaultApp: ${process.defaultApp}`);
    logger.debug('Database', `process.env.NODE_ENV: ${process.env.NODE_ENV}`);

    return metadataDir;
  }

  /**
   * 从 metadata 复制预置数据库到运行时目录
   */
  async copyPresetDatabase(teamName: string): Promise<boolean> {
    const metadataDbPath = resolve(this.getMetadataDir(), teamName, 'agents.db');

    // 检查预置数据库是否存在
    if (!existsSync(metadataDbPath)) {
      logger.error('Database', `Preset database not found: ${metadataDbPath}`);
      return false;
    }

    // 确保运行时团队目录存在
    const runtimeTeamDir = resolve(this.agentsDir, teamName);
    this.ensureDirectory(runtimeTeamDir);

    // 复制预置数据库
    const runtimeDbPath = this.getTeamDbPath(teamName);
    logger.info('Database', `Copying preset database: ${metadataDbPath} -> ${runtimeDbPath}`);
    copyFileSync(metadataDbPath, runtimeDbPath);
    logger.info('Database', 'Preset database copied successfully');

    return true;
  }

  /**
   * 获取团队数据库路径
   */
  getTeamDbPath(teamName: string): string {
    return resolve(this.agentsDir, teamName, 'agents.db');
  }

  /**
   * 检查团队是否存在
   */
  teamExists(teamName: string): boolean {
    const dbPath = this.getTeamDbPath(teamName);
    return existsSync(dbPath);
  }

  /**
   * 初始化 sql.js
   */
  async initSqlJs(): Promise<void> {
    if (this.SQL) return;

    logger.debug('Database', 'Initializing sql.js');
    this.SQL = await initSqlJs();
  }

  /**
   * 连接到团队数据库
   */
  async connect(teamName: string): Promise<any> {
    await this.initSqlJs();

    const dbPath = this.getTeamDbPath(teamName);
    this.dbPath = dbPath;

    logger.debug('Database', `Connecting to database: ${dbPath}`);

    // 确保团队目录存在
    const teamDir = resolve(this.agentsDir, teamName);
    this.ensureDirectory(teamDir);

    // 检查数据库是否存在
    if (!existsSync(dbPath)) {
      // 首次安装：从 metadata 复制预置数据库
      logger.info('Database', `First time use, copying preset database for: ${teamName}`);
      const success = await this.copyPresetDatabase(teamName);

      if (!success) {
        throw new Error(`Failed to copy preset database for team: ${teamName}`);
      }
    }

    // 从文件加载数据库
    const buffer = readFileSync(dbPath);
    this.db = new this.SQL.Database(buffer);
    logger.info('Database', `Loaded database: ${dbPath}`);

    return this.db;
  }

  /**
   * 保存数据库到文件
   */
  async save(): Promise<void> {
    if (!this.db) return;

    const data = this.db.export();
    const buffer = Buffer.from(data);
    writeFileSync(this.dbPath, buffer);
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.save();
      this.db.close();
      this.db = null;
    }
  }

  /**
   * 获取数据库实例（用于查询）
   */
  async getDatabase(teamName: string): Promise<any> {
    if (this.db && this.getTeamDbPath(teamName) === this.dbPath) {
      return this.db;
    }

    return await this.connect(teamName);
  }

  /**
   * 确保目录存在
   */
  private ensureDirectory(dir: string): void {
    if (!existsSync(dir)) {
      logger.debug('Database', `Creating directory: ${dir}`);
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 执行查询
   */
  async query(teamName: string, sql: string, params: any[] = []): Promise<any[]> {
    const db = await this.getDatabase(teamName);

    // sql.js 不支持参数绑定，需要手动替换
    let processedSql = sql;
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      let value: string;

      if (param === null || param === undefined) {
        value = 'NULL';
      } else if (typeof param === 'number') {
        value = String(param);
      } else {
        // 转义单引号
        value = `'${String(param).replace(/'/g, "''")}'`;
      }

      // 替换第一个 ? 占位符
      processedSql = processedSql.replace(/\?/, value);
    }

    const results = db.exec(processedSql);

    if (results.length === 0) return [];

    const { columns, values } = results[0];
    return values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }

  /**
   * 执行更新
   */
  async run(teamName: string, sql: string, params: any[] = []): Promise<void> {
    const db = await this.getDatabase(teamName);

    // 同样的参数替换逻辑
    let processedSql = sql;
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      let value: string;

      if (param === null || param === undefined) {
        value = 'NULL';
      } else if (typeof param === 'number') {
        value = String(param);
      } else {
        value = `'${String(param).replace(/'/g, "''")}'`;
      }

      processedSql = processedSql.replace(/\?/, value);
    }

    db.run(processedSql);
    await this.save();
  }
}
