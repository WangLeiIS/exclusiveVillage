const { existsSync, readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');
const DatabaseManager = require('../../agent/DatabaseManager');
const PrimaryAgentManager = require('../../agent/PrimaryAgentManager');

/**
 * 数据迁移脚本 v0.2.0
 *
 * 变更内容：
 * 1. 添加sessions表（会话管理）
 * 2. 添加messages表（消息历史）
 * 3. 创建主理人Agent数据库
 * 4. 为现有团队添加vocal agent
 */

const SCHEMA_VERSION = '0.2.0';
const MIGRATION_FILE = '.migration-version';

/**
 * 获取当前schema版本
 */
function getCurrentVersion() {
  try {
    const content = readFileSync(MIGRATION_FILE, 'utf-8');
    return content.trim();
  } catch (error) {
    return null; // 首次运行，没有版本文件
  }
}

/**
 * 保存当前schema版本
 */
function saveCurrentVersion(version) {
  writeFileSync(MIGRATION_FILE, version, 'utf-8');
}

/**
 * 备份数据库
 */
async function backupDatabase(dbPath) {
  const { copyFileSync } = require('fs');
  const backupPath = `${dbPath}.backup-${Date.now()}`;

  try {
    copyFileSync(dbPath, backupPath);
    console.log(`[Migration] Backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error(`[Migration] Backup failed for ${dbPath}:`, error);
    throw error;
  }
}

/**
 * 为团队数据库添加新表
 */
async function addNewTablesToTeam(teamName, dbManager) {
  console.log(`[Migration] Adding new tables to team: ${teamName}`);

  try {
    const db = await dbManager.connect(teamName);

    // 备份数据库
    const dbPath = dbManager.getTeamDbPath(teamName);
    await backupDatabase(dbPath);

    // 添加sessions表
    db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        directory_path TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        message_count INTEGER DEFAULT 0
      );
    `);

    // 添加messages表
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );
    `);

    // 添加索引
    db.run(`CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);`);

    await dbManager.save();
    await dbManager.close();

    console.log(`[Migration] New tables added to team: ${teamName}`);
    return true;
  } catch (error) {
    console.error(`[Migration] Failed to add tables to team ${teamName}:`, error);
    return false;
  }
}

/**
 * 为团队添加vocal agent（如果不存在）
 */
async function ensureVocalAgent(teamName, dbManager) {
  console.log(`[Migration] Ensuring vocal agent for team: ${teamName}`);

  try {
    const db = await dbManager.connect(teamName);

    // 检查是否已有vocal agent
    const result = db.exec('SELECT name FROM agents WHERE is_vocal = 1');

    if (result.length > 0 && result[0].values.length > 0) {
      console.log(`[Migration] Team ${teamName} already has vocal agent`);
      await dbManager.close();
      return true;
    }

    // 创建vocal agent
    db.run(`
      INSERT INTO agents (name, role, class, is_vocal, status, coins, goal_description, team_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      `${teamName}-assistant`,
      '团队助手',
      'assistant',
      1, // is_vocal
      'active',
      0,
      `我是${teamName}团队的AI助手，专注于处理团队相关的任务和协作。`,
      teamName
    ]);

    await dbManager.save();
    await dbManager.close();

    console.log(`[Migration] Vocal agent created for team: ${teamName}`);
    return true;
  } catch (error) {
    console.error(`[Migration] Failed to create vocal agent for team ${teamName}:`, error);
    return false;
  }
}

/**
 * 主迁移函数
 */
async function migrateTo_v0_2_0() {
  console.log('========================================');
  console.log('Starting migration to v0.2.0...');
  console.log('========================================');

  const currentVersion = getCurrentVersion();

  if (currentVersion === SCHEMA_VERSION) {
    console.log('[Migration] Already at v0.2.0, skipping migration');
    return { success: true, message: 'Already at latest version' };
  }

  if (currentVersion && currentVersion > SCHEMA_VERSION) {
    console.warn(`[Migration] Current version ${currentVersion} is newer than ${SCHEMA_VERSION}`);
    return { success: false, error: 'Cannot downgrade schema version' };
  }

  try {
    const dbManager = new DatabaseManager();
    const { teamManager } = require('../../agent/TeamManager');
    const fs = require('fs');

    const results = {
      teamsUpdated: 0,
      teamsFailed: 0,
      primaryAgentCreated: false
    };

    // 1. 获取所有团队
    console.log('\n[Migration] Step 1: Listing all teams...');
    const teams = await teamManager.listTeams();
    console.log(`[Migration] Found ${teams.length} teams`);

    // 排除主理人团队
    const existingTeams = teams.filter(team => team.name !== '__primary__');

    // 2. 为每个团队添加新表和vocal agent
    console.log('\n[Migration] Step 2: Migrating team databases...');
    for (const team of existingTeams) {
      try {
        // 添加新表
        const tablesAdded = await addNewTablesToTeam(team.name, dbManager);
        if (tablesAdded) {
          results.teamsUpdated++;
        }

        // 确保有vocal agent
        await ensureVocalAgent(team.name, dbManager);

      } catch (error) {
        console.error(`[Migration] Failed to migrate team ${team.name}:`, error);
        results.teamsFailed++;
      }
    }

    // 3. 创建主理人Agent
    console.log('\n[Migration] Step 3: Creating primary agent...');
    try {
      const primaryAgentManager = new PrimaryAgentManager();
      await primaryAgentManager.initialize();
      results.primaryAgentCreated = true;
      console.log('[Migration] Primary agent created successfully');
    } catch (error) {
      console.error('[Migration] Failed to create primary agent:', error);
    }

    // 4. 更新版本号
    console.log('\n[Migration] Step 4: Updating schema version...');
    saveCurrentVersion(SCHEMA_VERSION);

    // 5. 输出结果
    console.log('\n========================================');
    console.log('Migration to v0.2.0 completed!');
    console.log('========================================');
    console.log(`Teams updated: ${results.teamsUpdated}`);
    console.log(`Teams failed: ${results.teamsFailed}`);
    console.log(`Primary agent created: ${results.primaryAgentCreated}`);
    console.log('========================================\n');

    return {
      success: results.teamsFailed === 0,
      results,
      version: SCHEMA_VERSION
    };

  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 回滚迁移（如果有备份）
 */
async function rollbackMigration() {
  console.log('[Migration] Rollback not implemented yet');
  // TODO: 实现从备份文件恢复的逻辑
}

// 导出函数
module.exports = {
  migrateTo_v0_2_0,
  rollbackMigration,
  getCurrentVersion,
  SCHEMA_VERSION
};

// 如果直接运行此脚本
if (require.main === module) {
  migrateTo_v0_2_0()
    .then((result) => {
      if (result.success) {
        console.log('✅ Migration completed successfully!');
        process.exit(0);
      } else {
        console.error('❌ Migration failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}