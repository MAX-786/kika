/**
 * Kika Overlay - Main Process Entry Point
 * Thin entry that orchestrates window creation, IPC, and input hooks
 */

const { app, BrowserWindow, globalShortcut } = require('electron');
const { createOverlayWindow } = require('./windows/overlayWindow');
const { showSettingsWindow } = require('./windows/settingsWindow');
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

  // Register global keyboard shortcut to open settings
  // Cmd+Option+K on macOS, Ctrl+Alt+K on Windows/Linux
  const shortcut = process.platform === 'darwin' ? 'Command+Option+K' : 'Control+Alt+K';
  globalShortcut.register(shortcut, () => {
    console.log('⌨️ Settings shortcut pressed');
    showSettingsWindow();
  });
  console.log(`⌨️ Settings shortcut registered: ${shortcut}`);

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

// Clean up hooks and shortcuts on quit
app.on('will-quit', () => {
  stopGlobalInputHooks();
  globalShortcut.unregisterAll();
});
