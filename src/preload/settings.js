/**
 * Preload script for settings window
 * Exposes settings-related IPC methods to renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Get current settings
  getSettings: () => {
    return ipcRenderer.invoke('get-settings');
  },

  // Save settings
  saveSettings: (settings) => {
    return ipcRenderer.invoke('save-settings', settings);
  },

  // Reset settings to defaults
  resetSettings: () => {
    return ipcRenderer.invoke('reset-settings');
  },

  // Close settings window
  closeSettings: () => {
    ipcRenderer.send('close-settings-window');
  },
});
