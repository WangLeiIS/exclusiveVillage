const { resolve } = require('path');;
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');;
const initSqlJs = require('sql.js');

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
    console.log(`[Database] AGENTS_DIR: ${this.agentsDir}`);

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

    console.log('[Database] Initializing sql.js');
    this.SQL = await initSqlJs();
  }

  /**
   * 连接到团队数据库
   */
  async connect(teamName: string): Promise<any> {
    await this.initSqlJs();

    const dbPath = this.getTeamDbPath(teamName);
    this.dbPath = dbPath;

    console.log(`[Database] Connecting to database: ${dbPath}`);

    // 确保团队目录存在
    const teamDir = resolve(this.agentsDir, teamName);
    this.ensureDirectory(teamDir);

    // 如果数据库不存在，创建并初始化
    if (!existsSync(dbPath)) {
      console.log(`[Database] Creating new database: ${dbPath}`);
      this.db = new this.SQL.Database();
      await this.initSchema(teamName);
      await this.save();
    } else {
      // 从文件加载数据库
      const buffer = readFileSync(dbPath);
      this.db = new this.SQL.Database(buffer);
      console.log(`[Database] Loading existing database: ${dbPath}`);
    }

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
   * 初始化数据库表结构
   */
  private async initSchema(teamName: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log(`[Database] Initializing schema for: ${teamName}`);

    const statements = [
      // Agent 表
      `CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        class TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        is_vocal INTEGER DEFAULT 0,
        is_user INTEGER DEFAULT 0,
        coins INTEGER DEFAULT 0,
        goal_description TEXT,
        team_name TEXT NOT NULL
      );`,

      // 创建索引
      `CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);`,
      `CREATE INDEX IF NOT EXISTS idx_agents_team ON agents(team_name);`,
    ];

    for (const statement of statements) {
      try {
        this.db.run(statement);
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.warn('[Database] SQL warning:', error.message);
        }
      }
    }

    console.log('[Database] Schema initialized');
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
      console.log(`[Database] Creating directory: ${dir}`);
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
