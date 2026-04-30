const electron = require('electron');
const path = require('path');

let mainWindow: any = null;

export function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    // 生产模式下也自动打开开发者工具用于调试
    mainWindow.webContents.openDevTools();
  }

  // 添加快捷键 F12 打开/关闭开发者工具
  mainWindow.webContents.on('before-input-event', (_event: any, input: any) => {
    if (input.key === 'F12') {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    }
    // Ctrl+Shift+I 也打开开发者工具
    if (input.control && input.shift && input.key === 'i') {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    }
  });
}

export function setupAppLifecycle() {
  electron.app.whenReady().then(() => {
    // Remove the default menu bar
    electron.Menu.setApplicationMenu(null);
    createWindow();

    electron.app.on('activate', () => {
      if (electron.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  electron.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      electron.app.quit();
    }
  });
}

export { mainWindow };
