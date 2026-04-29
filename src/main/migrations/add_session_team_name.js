const { resolve } = require('path');
const { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync } = require('fs');
const initSqlJs = require('sql.js');

/**
 * 数据库迁移脚本：为sessions表添加team_name字段
 *
 * 迁移内容：
 * 1. 备份现有数据库
 * 2. 添加team_name字段到sessions表
 * 3. 根据数据库路径推断team_name并填充
 * 4. 添加唯一索引约束
 */
class MigrationAddSessionTeamName {
  constructor() {
    this.SQL = null;
    this.agentsDir = process.env.AGENTS_DIR || './agents-data';
    console.log(`[Migration] AGENTS_DIR: ${this.agentsDir}`);
  }

  /**
   * 执行迁移
   */
  async run() {
    console.log('[Migration] Starting migration: add_session_team_name');

    try {
      // 初始化sql.js
      await this.initSqlJs();

      // 查找所有团队数据库
      const teamDbs = await this.findTeamDatabases();
      console.log(`[Migration] Found ${teamDbs.length} team databases`);

      if (teamDbs.length === 0) {
        console.log('[Migration] No databases found to migrate');
        return;
      }

      // 迁移每个数据库
      for (const teamDb of teamDbs) {
        await this.migrateDatabase(teamDb);
      }

      console.log('[Migration] Migration completed successfully');
    } catch (error) {
      console.error('[Migration] Migration failed:', error);
      throw error;
    }
  }

  /**
   * 初始化sql.js
   */
  async initSqlJs() {
    if (this.SQL) return;

    console.log('[Migration] Initializing sql.js');
    this.SQL = await initSqlJs();
  }

  /**
   * 查找所有团队数据库
   */
  async findTeamDatabases() {
    const teamDbs = [];

    // 读取agents目录下的所有子目录
    if (!existsSync(this.agentsDir)) {
      console.log('[Migration] AGENTS_DIR does not exist, skipping migration');
      return [];
    }

    const entries = readdirSync(this.agentsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const teamName = entry.name;
        const dbPath = resolve(this.agentsDir, teamName, 'agents.db');

        if (existsSync(dbPath)) {
          teamDbs.push({ teamName, dbPath });
        }
      }
    }

    return teamDbs;
  }

  /**
   * 迁移单个数据库
   */
  async migrateDatabase(teamDb) {
    const { teamName, dbPath } = teamDb;
    console.log(`[Migration] Migrating database for team: ${teamName}`);

    try {
      // 备份数据库
      const backupPath = await this.backupDatabase(dbPath);
      console.log(`[Migration] Database backed up to: ${backupPath}`);

      // 加载数据库
      const buffer = readFileSync(dbPath);
      const db = new this.SQL.Database(buffer);

      // 检查是否已经迁移过
      if (this.isMigrated(db)) {
        console.log(`[Migration] Database already migrated, skipping: ${teamName}`);
        return;
      }

      // 开始迁移
      this.migrateSessionsTable(db, teamName);

      // 保存数据库
      const data = db.export();
      const outputBuffer = Buffer.from(data);
      writeFileSync(dbPath, outputBuffer);

      console.log(`[Migration] Successfully migrated: ${teamName}`);
    } catch (error) {
      console.error(`[Migration] Failed to migrate ${teamName}:`, error);
      throw error;
    }
  }

  /**
   * 备份数据库
   */
  async backupDatabase(dbPath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupPath = `${dbPath}.backup-${timestamp}`;
    copyFileSync(dbPath, backupPath);
    return backupPath;
  }

  /**
   * 检查数据库是否已经迁移过
   */
  isMigrated(db) {
    try {
      const result = db.exec('PRAGMA table_info(sessions)');

      if (result.length === 0) return false;

      const { columns, values } = result[0];

      // 检查是否有team_name列
      for (const row of values) {
        const columnName = row[1]; // name是第二列
        if (columnName === 'team_name') {
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * 迁移sessions表
   */
  migrateSessionsTable(db, teamName) {
    console.log(`[Migration] Migrating sessions table for team: ${teamName}`);

    try {
      // 1. 检查是否需要添加team_name列
      const tableInfo = db.exec('PRAGMA table_info(sessions)');
      const hasTeamName = tableInfo.length > 0 && tableInfo[0].values.some(row => row[1] === 'team_name');

      if (!hasTeamName) {
        // 1. 添加team_name列
        db.run('ALTER TABLE sessions ADD COLUMN team_name TEXT');
        console.log('[Migration] Added team_name column');

        // 2. 填充team_name值
        db.run(`UPDATE sessions SET team_name = '${teamName}' WHERE team_name IS NULL`);
        console.log(`[Migration] Updated sessions with team_name: ${teamName}`);

        // 3. 创建新表（带唯一约束）
        db.run(`
          CREATE TABLE sessions_new (
            id TEXT PRIMARY KEY,
            team_name TEXT NOT NULL,
            directory_path TEXT NOT NULL,
            title TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            message_count INTEGER DEFAULT 0,
            UNIQUE(team_name, directory_path)
          )
        `);

        // 4. 复制数据到新表
        db.run(`
          INSERT INTO sessions_new (id, team_name, directory_path, title, created_at, updated_at, message_count)
          SELECT id, team_name, directory_path, title, created_at, updated_at, message_count
          FROM sessions
        `);

        // 5. 删除旧表并重命名新表
        db.run('DROP TABLE sessions');
        db.run('ALTER TABLE sessions_new RENAME TO sessions');

        // 6. 重建索引
        db.run('CREATE INDEX IF NOT EXISTS idx_sessions_team ON sessions(team_name)');

        console.log('[Migration] Sessions table migration completed');
      } else {
        console.log('[Migration] team_name column already exists, creating index only');

        // 只需要添加索引
        db.run('CREATE INDEX IF NOT EXISTS idx_sessions_team ON sessions(team_name)');
      }
    } catch (error) {
      console.error('[Migration] Error during sessions table migration:', error.message);

      // 如果是"duplicate column name"错误，说明列已存在，继续
      if (error.message && error.message.includes('duplicate column')) {
        console.log('[Migration] Column already exists, continuing...');
        return;
      }

      throw error;
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const migration = new MigrationAddSessionTeamName();
  migration.run()
    .then(() => {
      console.log('[Migration] Success!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Migration] Failed!', error);
      process.exit(1);
    });
}

module.exports = MigrationAddSessionTeamName;
