const { contextBridge } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Add your IPC methods here as needed
  // Example:
  // sendMessage: (channel, data) => ipcRenderer.send(channel, data),
  // onMessage: (channel, callback) => ipcRenderer.on(channel, callback),
  platform: process.platform,
});
