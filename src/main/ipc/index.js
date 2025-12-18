/**
 * Centralized IPC handler registration
 * All ipcMain handlers and event wiring in one place
 */

const { ipcMain } = require('electron');
const { uIOhook, UiohookKey } = require('uiohook-napi');
const {
  getOverlayWindow,
  setClickThrough,
  enableOverlayClickThrough,
  disableOverlayClickThrough,
  repositionOverlay,
  setOverlayOpacity,
} = require('../windows/overlayWindow');
const { showSettingsWindow, closeSettingsWindow, getSettingsWindow } = require('../windows/settingsWindow');
const {
  getSettings,
  updateSettings,
  resetSettings,
} = require('../../shared/settingsStore');
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
  // Settings handlers (new pattern)
  ipcMain.handle('settings:getAll', () => {
    return getSettings();
  });

  ipcMain.handle('settings:update', (_event, partialSettings) => {
    const updatedSettings = updateSettings(partialSettings);

    // Broadcast settings:changed to overlay renderer
    const overlayWindow = getOverlayWindow();
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('settings:changed', updatedSettings);

      // Apply click-through immediately
      setClickThrough(overlayWindow, updatedSettings.clickThroughEnabled);

      // Apply Opacity
      if (updatedSettings.opacity !== undefined) {
        setOverlayOpacity(updatedSettings.opacity);
      }

      // Reposition overlay with new settings (size/position changes)
      repositionOverlay(updatedSettings);
    }

    return updatedSettings;
  });

  // Legacy handlers (for backwards compatibility)
  ipcMain.handle('get-settings', () => {
    return getSettings();
  });

  ipcMain.handle('save-settings', (_event, settings) => {
    // Use updateSettings to MERGE with existing settings (preserves position, etc.)
    const updatedSettings = updateSettings(settings);
    
    const overlayWindow = getOverlayWindow();
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      // Apply click-through immediately
      setClickThrough(overlayWindow, updatedSettings.clickThroughEnabled ?? true);

      // Apply Opacity
      if (updatedSettings.opacity !== undefined) {
        setOverlayOpacity(updatedSettings.opacity);
      }

      // Reposition overlay with new settings (size/position/scale changes)
      repositionOverlay(updatedSettings);

      // Broadcast settings:changed to overlay renderer
      overlayWindow.webContents.send('settings:changed', updatedSettings);

      // Broadcast to settings window for sync
      const settingsWindow = getSettingsWindow();
      if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.webContents.send('settings:changed', updatedSettings);
      }
    }
    return updatedSettings;
  });

  ipcMain.handle('reset-settings', () => {
    const settings = resetSettings();
    
    // Broadcast reset to overlay
    const overlayWindow = getOverlayWindow();
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('settings:changed', settings);
    }
    
    return settings;
  });

  // Settings window handlers
  ipcMain.on('show-settings-window', () => {
    showSettingsWindow();
  });

  ipcMain.on('settings:open', () => {
    showSettingsWindow();
  });

  ipcMain.on('close-settings-window', () => {
    closeSettingsWindow();
  });

  // Overlay click-through handlers
  ipcMain.on('overlay:enable-click-through', () => {
    enableOverlayClickThrough();
  });

  ipcMain.on('overlay:disable-click-through', () => {
    disableOverlayClickThrough();
  });

  // Input count reset
  ipcMain.on('reset-input-count', () => {
    totalInputs = 0;
  });

  // Reset overlay position to bottom center with scale 1.0
  ipcMain.handle('overlay:resetPosition', () => {
    const resetPositionSettings = {
      position: {
        mode: 'preset',
        preset: 'bottomCenter',
      },
      size: {
        scale: 1.0,
      },
    };

    const updatedSettings = updateSettings(resetPositionSettings);

    // Apply changes immediately
    const overlayWindow = getOverlayWindow();
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      repositionOverlay(updatedSettings);
      overlayWindow.webContents.send('settings:changed', updatedSettings);
    }

    return updatedSettings;
  });

  // Handle drag end - save new position to free mode
  ipcMain.on('overlay:dragEnd', () => {
    const overlayWindow = getOverlayWindow();
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      return;
    }

    // Get current window bounds and save to free mode
    const bounds = overlayWindow.getBounds();
    const updatedSettings = updateSettings({
      position: {
        mode: 'free',
        x: bounds.x,
        y: bounds.y,
      },
    });

    console.log(`📍 Position saved: (${bounds.x}, ${bounds.y})`);

    // Broadcast updated settings to overlay renderer
    overlayWindow.webContents.send('settings:changed', updatedSettings);

    // Broadcast to settings window if open
    const settingsWindow = getSettingsWindow();
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('settings:changed', updatedSettings);
    }
  });

  console.log('📡 IPC handlers registered');
}

module.exports = {
  registerIPCHandlers,
  initGlobalInputHooks,
  stopGlobalInputHooks,
  notifyRenderer,
};
