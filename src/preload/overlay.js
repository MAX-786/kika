/**
 * Preload script for overlay window
 * Exposes IPC methods to renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

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

  // Open settings window
  showSettings: () => {
    ipcRenderer.send('show-settings-window');
  },
});
