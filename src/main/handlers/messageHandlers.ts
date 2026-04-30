const { ipcMain } = require('electron');
const DatabaseManager = require('../../agent/DatabaseManager');

/**
 * 消息历史处理器
 */
module.exports = class MessageHandlers {
  private dbManager: any;

  constructor() {
    this.dbManager = new DatabaseManager();
  }

  /**
   * 注册所有消息相关的IPC处理器
   */
  registerHandlers() {
    // 列出会话的所有消息
    ipcMain.handle('messages:list', async (event, sessionId: string) => {
      try {
        console.log(`[MessageHandlers] Listing messages for session: ${sessionId}`);
        const messages = await this.listMessages(sessionId);
        return { success: true, data: messages };
      } catch (error: any) {
        console.error('[MessageHandlers] Failed to list messages:', error);
        return { success: false, error: error.message };
      }
    });

    // 添加消息到会话
    ipcMain.handle('messages:append', async (event, params: {
      sessionId: string;
      role: string;
      content: string;
    }) => {
      try {
        console.log(`[MessageHandlers] Appending message to session: ${params.sessionId}`);
        const message = await this.appendMessage(params);
        return { success: true, data: message };
      } catch (error: any) {
        console.error('[MessageHandlers] Failed to append message:', error);
        return { success: false, error: error.message };
      }
    });

    // 删除消息
    ipcMain.handle('messages:delete', async (event, params: {
      teamName: string;
      messageId: number;
    }) => {
      try {
        console.log(`[MessageHandlers] Deleting message: ${params.messageId}`);
        await this.deleteMessage(params.teamName, params.messageId);
        return { success: true };
      } catch (error: any) {
        console.error('[MessageHandlers] Failed to delete message:', error);
        return { success: false, error: error.message };
      }
    });

    // 清空会话消息
    ipcMain.handle('messages:clear', async (event, params: {
      teamName: string;
      sessionId: string;
    }) => {
      try {
        console.log(`[MessageHandlers] Clearing messages for session: ${params.sessionId}`);
        await this.clearMessages(params.teamName, params.sessionId);
        return { success: true };
      } catch (error: any) {
        console.error('[MessageHandlers] Failed to clear messages:', error);
        return { success: false, error: error.message };
      }
    });

    console.log('[MessageHandlers] All message handlers registered');
  }

  /**
   * 列出会话的所有消息
   */
  async listMessages(sessionId: string) {
    // 需要找到会话所属的团队
    const { teamManager } = require('../../agent/teams/TeamManager.js');
    const teams = await teamManager.listTeams();

    for (const team of teams) {
      try {
        const db = await this.dbManager.connect(team.name);
        const result = db.exec(`SELECT * FROM messages WHERE session_id = '${sessionId}' ORDER BY timestamp ASC`);

        if (result.length > 0) {
          const { values } = result[0];
          await this.dbManager.close();

          return values.map((row: any[]) => ({
            id: row[0],
            session_id: row[1],
            role: row[2],
            content: row[3],
            timestamp: row[4]
          }));
        }

        await this.dbManager.close();
      } catch (error) {
        console.error(`[MessageHandlers] Error checking team ${team.name}:`, error);
      }
    }

    return [];
  }

  /**
   * 添加消息到会话
   */
  async appendMessage(params: {
    sessionId: string;
    role: string;
    content: string;
  }) {
    // 首先找到会话所属的团队
    const { teamManager } = require('../../agent/teams/TeamManager.js');
    const teams = await teamManager.listTeams();

    for (const team of teams) {
      try {
        const db = await this.dbManager.connect(team.name);
        const sessionCheck = db.exec(`SELECT id FROM sessions WHERE id = '${params.sessionId}'`);

        if (sessionCheck.length > 0 && sessionCheck[0].values.length > 0) {
          const now = Date.now();

          // 插入消息 - 使用 DatabaseManager 的 run 方法来正确处理参数
          await this.dbManager.run(team.name, `
            INSERT INTO messages (session_id, role, content, timestamp)
            VALUES (?, ?, ?, ?)
          `, [params.sessionId, params.role, params.content, now]);

          // 更新会话的消息计数和更新时间
          await this.dbManager.run(team.name, `
            UPDATE sessions
            SET message_count = message_count + 1, updated_at = ?
            WHERE id = ?
          `, [now, params.sessionId]);

          // 获取插入的消息
          const insertedResult = db.exec(`
            SELECT * FROM messages WHERE id = (SELECT MAX(id) FROM messages)
          `);

          await this.dbManager.close();

          if (insertedResult.length > 0) {
            const row = insertedResult[0].values[0];
            return {
              id: row[0],
              session_id: row[1],
              role: row[2],
              content: row[3],
              timestamp: row[4]
            };
          }

          return {
            session_id: params.sessionId,
            role: params.role,
            content: params.content,
            timestamp: now
          };
        }

        await this.dbManager.close();
      } catch (error) {
        console.error(`[MessageHandlers] Error checking team ${team.name}:`, error);
      }
    }

    throw new Error('Session not found');
  }

  /**
   * 删除消息
   */
  async deleteMessage(teamName: string, messageId: number) {
    const db = await this.dbManager.connect(teamName);

    try {
      // 先获取消息所属的会话ID
      const result = db.exec(`SELECT session_id FROM messages WHERE id = ${messageId}`);

      if (result.length > 0 && result[0].values.length > 0) {
        const sessionId = result[0].values[0][0];

        // 删除消息
        db.exec(`DELETE FROM messages WHERE id = ${messageId}`);

        // 更新会话的消息计数 - 使用 DatabaseManager 的 run 方法
        await this.dbManager.run(teamName, `
          UPDATE sessions
          SET message_count = message_count - 1
          WHERE id = ?
        `, [sessionId]);
      }
    } finally {
      await this.dbManager.close();
    }
  }

  /**
   * 清空会话的所有消息
   */
  async clearMessages(teamName: string, sessionId: string) {
    const db = await this.dbManager.connect(teamName);

    try {
      // 删除会话的所有消息
      db.exec(`DELETE FROM messages WHERE session_id = '${sessionId}'`);

      // 重置会话的消息计数 - 使用 DatabaseManager 的 run 方法
      await this.dbManager.run(teamName, `
        UPDATE sessions
        SET message_count = 0, updated_at = ?
        WHERE id = ?
      `, [Date.now(), sessionId]);
    } finally {
      await this.dbManager.close();
    }
  }
};