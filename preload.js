const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Listen for global input events from main process
  onInputEvent: (callback) => {
    ipcRenderer.on('input-event', (_event, data) => {
      callback(data);
    });
  },

  // Remove input event listener
  removeInputEventListener: () => {
    ipcRenderer.removeAllListeners('input-event');
  },
});
