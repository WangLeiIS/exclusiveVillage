const { ipcMain } = require('electron');
const { teamManager } = require('../../agent/teams/TeamManager.js');
const { teamAgentManager } = require('../../agent/teams/TeamAgentManager.js');
const { sessionManager } = require('../../agent/SessionManager.js');
const { getLogger } = require('../utils/logger.js');

export function registerTeamHandlers() {
  ipcMain.handle('teams:list', async () => {
    try {
      getLogger().logIPCCall('teams:list');
      const teams = await teamManager.listTeams();
      return { success: true, data: teams };
    } catch (error) {
      getLogger().error('teams:list', 'Failed to list teams', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle(
    'teams:create',
    async (_event: any, payload: { name: string; description?: string }) => {
      try {
        console.log('[IPC] teams:create', payload);
        const team = await teamManager.createTeam(payload.name, payload.description);
        return { success: true, data: team };
      } catch (error) {
        console.error('[IPC] teams:create error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  ipcMain.handle('teams:delete', async (_event: any, payload: { name: string }) => {
    try {
      console.log('[IPC] teams:delete', payload);
      await teamManager.deleteTeam(payload.name);

      const sessions = sessionManager.getActiveSessions();
      for (const session of sessions) {
        if (session.startsWith(`${payload.name}:`)) {
          sessionManager.remove(payload.name, session.split(':')[1]);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('[IPC] teams:delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle('teams:get-all', async () => {
    try {
      console.log('[IPC] teams:get-all');
      const teams = await teamAgentManager.getAllTeamsWithAgents();
      return { success: true, data: teams };
    } catch (error) {
      console.error('[IPC] teams:get-all error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
}
