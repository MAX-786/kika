/**
 * Kika Overlay - Main Process Entry Point
 * Thin entry that orchestrates window creation, IPC, and input hooks
 */

const { app, BrowserWindow } = require('electron');
const { createOverlayWindow } = require('./windows/overlayWindow');
const { registerIPCHandlers, initGlobalInputHooks, stopGlobalInputHooks } = require('./ipc');
const { loadSettings } = require('../shared/settingsStore');

// Wait for app to be ready before creating windows
app.whenReady().then(() => {
  const settings = loadSettings();

  // Register all IPC handlers first
  registerIPCHandlers();

  // Create the overlay window
  createOverlayWindow(settings);

  // Initialize global input hooks
  if (settings.inputHooks?.enabled !== false) {
    initGlobalInputHooks(settings);
  }

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createOverlayWindow(settings);
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up hooks on quit
app.on('will-quit', () => {
  stopGlobalInputHooks();
});
