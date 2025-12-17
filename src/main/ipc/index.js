/**
 * Centralized IPC handler registration
 * All ipcMain handlers and event wiring in one place
 */

const { ipcMain } = require('electron');
const { uIOhook, UiohookKey } = require('uiohook-napi');
const { getOverlayWindow, setClickThrough } = require('../windows/overlayWindow');
const { showSettingsWindow, closeSettingsWindow } = require('../windows/settingsWindow');
const { loadSettings, saveSettings, resetSettings } = require('../../shared/settingsStore');
const { DEFAULT_SETTINGS } = require('../../shared/defaultSettings');

let totalInputs = 0;
let inputHooksRunning = false;

/**
 * Send input event to overlay renderer
 * @param {string} type - 'keypress' or 'click'
 */
function notifyRenderer(type) {
  totalInputs++;

  const overlayWindow = getOverlayWindow();
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('input-event', {
      type,
      count: totalInputs,
      timestamp: Date.now(),
    });
  }
}

/**
 * Initialize global input hooks using uiohook-napi
 * @param {object} settings - Settings object
 */
function initGlobalInputHooks(settings = DEFAULT_SETTINGS) {
  if (inputHooksRunning) {
    console.log('⚠️ Input hooks already running');
    return;
  }

  const ignoreModifiers = settings.inputHooks?.ignoreModifierKeys ?? true;

  // Listen for keyboard events
  uIOhook.on('keydown', (event) => {
    if (ignoreModifiers) {
      const modifierKeys = [
        UiohookKey.Shift,
        UiohookKey.ShiftRight,
        UiohookKey.Ctrl,
        UiohookKey.CtrlRight,
        UiohookKey.Alt,
        UiohookKey.AltRight,
        UiohookKey.Meta,
        UiohookKey.MetaRight,
      ];

      if (modifierKeys.includes(event.keycode)) {
        return;
      }
    }

    notifyRenderer('keypress');
  });

  // Listen for mouse click events
  uIOhook.on('mousedown', () => {
    notifyRenderer('click');
  });

  try {
    uIOhook.start();
    inputHooksRunning = true;
    console.log('🎮 Global input hooks started');
  } catch (error) {
    console.error('Failed to start global input hooks:', error);
    console.error(
      '⚠️  On macOS, ensure Accessibility permissions are granted in System Preferences'
    );
  }
}

/**
 * Stop global input hooks
 */
function stopGlobalInputHooks() {
  if (!inputHooksRunning) {
    return;
  }

  try {
    uIOhook.stop();
    inputHooksRunning = false;
    console.log('🛑 Global input hooks stopped');
  } catch {
    // Ignore errors during cleanup
  }
}

/**
 * Register all IPC handlers
 */
function registerIPCHandlers() {
  // Settings handlers
  ipcMain.handle('get-settings', () => {
    return loadSettings();
  });

  ipcMain.handle('save-settings', (_event, settings) => {
    const success = saveSettings(settings);
    if (success) {
      // Apply relevant settings immediately
      const overlayWindow = getOverlayWindow();
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        setClickThrough(overlayWindow, settings.clickThrough?.enabled ?? true);
      }
    }
    return success;
  });

  ipcMain.handle('reset-settings', () => {
    return resetSettings();
  });

  // Settings window handlers
  ipcMain.on('show-settings-window', () => {
    showSettingsWindow();
  });

  ipcMain.on('close-settings-window', () => {
    closeSettingsWindow();
  });

  // Input count reset
  ipcMain.on('reset-input-count', () => {
    totalInputs = 0;
  });

  console.log('📡 IPC handlers registered');
}

module.exports = {
  registerIPCHandlers,
  initGlobalInputHooks,
  stopGlobalInputHooks,
  notifyRenderer,
};
