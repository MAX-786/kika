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
  openSettings: () => {
    ipcRenderer.send('settings:open');
  },

  // Enable click-through (clicks pass through to desktop)
  enableClickThrough: () => {
    ipcRenderer.send('overlay:enable-click-through');
  },

  // Disable click-through (overlay captures clicks)
  disableClickThrough: () => {
    ipcRenderer.send('overlay:disable-click-through');
  },

  // Get all settings
  getSettings: () => {
    return ipcRenderer.invoke('settings:getAll');
  },

  // Update settings (partial merge)
  updateSettings: (partialSettings) => {
    return ipcRenderer.invoke('settings:update', partialSettings);
  },

  // Listen for settings changes from main process
  onSettingsChanged: (callback) => {
    ipcRenderer.on('settings:changed', (_event, settings) => {
      callback(settings);
    });
  },

  // Remove settings change listener
  removeSettingsChangedListener: () => {
    ipcRenderer.removeAllListeners('settings:changed');
  },

  // Notify main process that drag ended (to save position)
  notifyDragEnd: () => {
    ipcRenderer.send('overlay:dragEnd');
  },
});
