const { ipcMain } = require('electron');
const DatabaseManager = require('../../agent/DatabaseManager');

/**
 * 会话管理处理器
 */
module.exports = class SessionHandlers {
  private dbManager: any;

  constructor() {
    this.dbManager = new DatabaseManager();
  }

  /**
   * 注册所有会话相关的IPC处理器
   */
  registerHandlers() {
    // 列出团队的所有会话
    ipcMain.handle('sessions:list', async (_event: any, teamName: string) => {
      try {
        console.log(`[SessionHandlers] Listing sessions for team: ${teamName}`);
        const sessions = await this.listSessions(teamName);
        return { success: true, data: sessions };
      } catch (error: any) {
        console.error('[SessionHandlers] Failed to list sessions:', error);
        return { success: false, error: error.message };
      }
    });

    // 创建新会话
    ipcMain.handle('sessions:create', async (_event: any, params: {
      teamName: string;
      directoryPath: string;
      title?: string;
    }) => {
      try {
        console.log(`[SessionHandlers] Creating session for team: ${params.teamName}`);
        const session = await this.createSession(params);
        return { success: true, data: session };
      } catch (error: any) {
        console.error('[SessionHandlers] Failed to create session:', error);
        return { success: false, error: error.message };
      }
    });

    // 获取或创建会话（根据目录）
    ipcMain.handle('sessions:get-or-create', async (_event: any, params: {
      teamName: string;
      directoryPath: string;
      title?: string;
    }) => {
      try {
        console.log(`[SessionHandlers] Getting or creating session for directory: ${params.directoryPath}`);
        const session = await this.getOrCreateSessionForDirectory(params);
        return { success: true, data: session };
      } catch (error: any) {
        console.error('[SessionHandlers] Failed to get or create session:', error);
        return { success: false, error: error.message };
      }
    });

    // 获取会话详情
    ipcMain.handle('sessions:get', async (_event: any, sessionId: string) => {
      try {
        console.log(`[SessionHandlers] Getting session: ${sessionId}`);
        const session = await this.getSession(sessionId);
        if (!session) {
          return { success: false, error: 'Session not found' };
        }
        return { success: true, data: session };
      } catch (error: any) {
        console.error('[SessionHandlers] Failed to get session:', error);
        return { success: false, error: error.message };
      }
    });

    // 更新会话
    ipcMain.handle('sessions:update', async (_event: any, params: {
      sessionId: string;
      title?: string;
      directoryPath?: string;
    }) => {
      try {
        console.log(`[SessionHandlers] Updating session: ${params.sessionId}`);
        const session = await this.updateSession(params);
        return { success: true, data: session };
      } catch (error: any) {
        console.error('[SessionHandlers] Failed to update session:', error);
        return { success: false, error: error.message };
      }
    });

    // 删除会话
    ipcMain.handle('sessions:delete', async (_event: any, params: {
      teamName: string;
      sessionId: string;
    }) => {
      try {
        console.log(`[SessionHandlers] Deleting session: ${params.sessionId}`);
        await this.deleteSession(params.teamName, params.sessionId);
        return { success: true };
      } catch (error: any) {
        console.error('[SessionHandlers] Failed to delete session:', error);
        return { success: false, error: error.message };
      }
    });

    console.log('[SessionHandlers] All session handlers registered');
  }

  /**
   * 列出团队的所有会话
   */
  async listSessions(teamName: string) {
    const db = await this.dbManager.connect(teamName);

    try {
      const result = db.exec('SELECT * FROM sessions ORDER BY updated_at DESC');

      if (result.length === 0) {
        return [];
      }

      const { values } = result[0];
      return values.map((row: any[]) => ({
        id: row[0],
        team_name: row[1],
        directory_path: row[2],
        title: row[3],
        created_at: row[4],
        updated_at: row[5],
        message_count: row[6]
      }));
    } finally {
      await this.dbManager.close();
    }
  }

  /**
   * 创建新会话
   */
  async createSession(params: {
    teamName: string;
    directoryPath: string;
    title?: string;
  }) {
    const { teamName, directoryPath, title } = params;

    // 生成会话ID
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    // 使用目录路径的基础名称作为标题
    const sessionTitle = title || this.extractDirectoryName(directoryPath);

    const db = await this.dbManager.connect(teamName);

    try {
      db.run(`
        INSERT INTO sessions (id, team_name, directory_path, title, created_at, updated_at, message_count)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [sessionId, teamName, directoryPath, sessionTitle, now, now, 0]);

      await this.dbManager.save();

      // 返回创建的会话
      return {
        id: sessionId,
        team_name: teamName,
        directory_path: directoryPath,
        title: sessionTitle,
        created_at: now,
        updated_at: now,
        message_count: 0
      };
    } finally {
      await this.dbManager.close();
    }
  }

  /**
   * 为指定目录获取或创建会话（实现"一个目录一个会话"的核心逻辑）
   */
  async getOrCreateSessionForDirectory(params: {
    teamName: string;
    directoryPath: string;
    title?: string;
  }) {
    const { teamName, directoryPath, title } = params;

    const db = await this.dbManager.connect(teamName);

    try {
      // 首先尝试查找现有会话
      const result = db.exec(`
        SELECT * FROM sessions WHERE directory_path = '${directoryPath}'
      `);

      if (result.length > 0 && result[0].values.length > 0) {
        // 会话已存在，返回现有会话
        const row = result[0].values[0];
        console.log(`[SessionHandlers] Found existing session for directory: ${directoryPath}`);

        return {
          id: row[0],
          team_name: row[1],
          directory_path: row[2],
          title: row[3],
          created_at: row[4],
          updated_at: row[5],
          message_count: row[6]
        };
      }

      // 会话不存在，创建新会话
      console.log(`[SessionHandlers] Creating new session for directory: ${directoryPath}`);
      return await this.createSession(params);
    } finally {
      await this.dbManager.close();
    }
  }

  /**
   * 获取会话详情
   */
  async getSession(sessionId: string) {
    // 由于sessionId格式包含时间戳，我们需要从会话ID中提取团队名称
    // 或者修改设计，在会话ID中包含团队名称
    // 暂时使用简单的方法：查询所有团队的会话
    const { teamManager } = require('../../agent/teams/TeamManager.js');
    const teams = await teamManager.listTeams();

    for (const team of teams) {
      try {
        const db = await this.dbManager.connect(team.name);
        const result = db.exec(`SELECT * FROM sessions WHERE id = '${sessionId}'`);

        if (result.length > 0 && result[0].values.length > 0) {
          const row = result[0].values[0];
          await this.dbManager.close();

          return {
            id: row[0],
            team_name: row[1],
            directory_path: row[2],
            title: row[3],
            created_at: row[4],
            updated_at: row[5],
            message_count: row[6]
          };
        }

        await this.dbManager.close();
      } catch (error) {
        console.error(`[SessionHandlers] Error checking team ${team.name}:`, error);
      }
    }

    return null;
  }

  /**
   * 更新会话
   */
  async updateSession(params: {
    sessionId: string;
    title?: string;
    directoryPath?: string;
  }) {
    const session = await this.getSession(params.sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    // 从session中获取团队名称
    const { team_name } = session as any;
    const db = await this.dbManager.connect(team_name);

    try {
      const updatesArray = [];
      const paramsArray = [];

      if (params.title) {
        updatesArray.push('title = ?');
        paramsArray.push(params.title);
      }

      if (params.directoryPath) {
        updatesArray.push('directory_path = ?');
        paramsArray.push(params.directoryPath);
      }

      if (updatesArray.length === 0) {
        return session;
      }

      // 添加更新时间
      updatesArray.push('updated_at = ?');
      paramsArray.push(Date.now());
      paramsArray.push(params.sessionId);

      const sql = `UPDATE sessions SET ${updatesArray.join(', ')} WHERE id = ?`;
      db.run(sql, paramsArray);

      await this.dbManager.save();

      // 返回更新后的会话
      return await this.getSession(params.sessionId);
    } finally {
      await this.dbManager.close();
    }
  }

  /**
   * 删除会话
   */
  async deleteSession(teamName: string, sessionId: string) {
    const db = await this.dbManager.connect(teamName);

    try {
      // 由于有外键约束，删除会话会自动删除关联的消息
      db.exec(`DELETE FROM sessions WHERE id = '${sessionId}'`);
      await this.dbManager.save();
    } finally {
      await this.dbManager.close();
    }
  }

  /**
   * 从目录路径提取目录名称
   */
  extractDirectoryName(path: string): string {
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1] || path;
  }
};