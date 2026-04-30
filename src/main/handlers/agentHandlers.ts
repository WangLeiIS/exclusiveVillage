const { ipcMain } = require('electron');
const { teamAgentManager } = require('../../agent/teams/TeamAgentManager.js');
const { sessionManager } = require('../../agent/SessionManager.js');
const { getLogger } = require('../utils/logger.js');

export function registerAgentHandlers() {
  ipcMain.handle(
    'agents:list',
    async (_event: any, payload: { teamName: string }) => {
      try {
        getLogger().logIPCCall('agents:list', payload);
        const agents = await teamAgentManager.listAgents(payload.teamName);
        return { success: true, data: agents };
      } catch (error) {
        getLogger().error('agents:list', 'Failed to list agents', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  ipcMain.handle(
    'agents:create',
    async (
      _event: any,
      payload: {
        teamName: string;
        name: string;
        role: string;
        class: string;
        is_vocal: boolean;
        goal_description?: string;
      }
    ) => {
      try {
        console.log('[IPC] agents:create', payload);
        const agent = await teamAgentManager.createAgent(payload.teamName, {
          name: payload.name,
          role: payload.role,
          class: payload.class,
          is_vocal: payload.is_vocal,
          goal_description: payload.goal_description,
        });
        return { success: true, data: agent };
      } catch (error) {
        console.error('[IPC] agents:create error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  ipcMain.handle(
    'agents:update',
    async (
      _event: any,
      payload: {
        teamName: string;
        name: string;
        role?: string;
        goal_description?: string;
      }
    ) => {
      try {
        console.log('[IPC] agents:update', payload);
        await teamAgentManager.updateAgent(payload.teamName, payload.name, {
          role: payload.role,
          goal_description: payload.goal_description,
        });
        return { success: true };
      } catch (error) {
        console.error('[IPC] agents:update error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  ipcMain.handle(
    'agents:delete',
    async (_event: any, payload: { teamName: string; name: string }) => {
      try {
        console.log('[IPC] agents:delete', payload);
        await teamAgentManager.deleteAgent(payload.teamName, payload.name);

        sessionManager.remove(payload.teamName, payload.name);

        return { success: true };
      } catch (error) {
        console.error('[IPC] agents:delete error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  ipcMain.handle(
    'agents:get',
    async (_event: any, payload: { teamName: string; name: string }) => {
      try {
        console.log('[IPC] agents:get', payload);
        const agent = await teamAgentManager.getAgent(payload.teamName, payload.name);
        return { success: true, data: agent };
      } catch (error) {
        console.error('[IPC] agents:get error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );
}
