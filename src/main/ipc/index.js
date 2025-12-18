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

// ============================================
// KEY CLASSIFICATION FOR ANIMATION TRIGGERS
// ============================================

/**
 * Left-hand keys (trigger left paw animation)
 * Keys typically pressed with the left hand on QWERTY layout
 */
const LEFT_KEYS = new Set([
  // Letters
  UiohookKey.Q, UiohookKey.W, UiohookKey.E, UiohookKey.R, UiohookKey.T,
  UiohookKey.A, UiohookKey.S, UiohookKey.D, UiohookKey.F, UiohookKey.G,
  UiohookKey.Z, UiohookKey.X, UiohookKey.C, UiohookKey.V, UiohookKey.B,
  // Numbers
  UiohookKey['1'], UiohookKey['2'], UiohookKey['3'], UiohookKey['4'], UiohookKey['5'],
  // Special
  UiohookKey.Backquote,
  // Arrow key left
  UiohookKey.ArrowLeft,
]);

/**
 * Right-hand keys (trigger right paw animation)
 * Keys typically pressed with the right hand on QWERTY layout
 */
const RIGHT_KEYS = new Set([
  // Letters
  UiohookKey.Y, UiohookKey.U, UiohookKey.I, UiohookKey.O, UiohookKey.P,
  UiohookKey.H, UiohookKey.J, UiohookKey.K, UiohookKey.L,
  UiohookKey.N, UiohookKey.M,
  // Numbers
  UiohookKey['6'], UiohookKey['7'], UiohookKey['8'], UiohookKey['9'], UiohookKey['0'],
  // Punctuation and special
  UiohookKey.Minus, UiohookKey.Equal,
  UiohookKey.BracketLeft, UiohookKey.BracketRight, UiohookKey.Backslash,
  UiohookKey.Semicolon, UiohookKey.Quote,
  UiohookKey.Comma, UiohookKey.Period, UiohookKey.Slash,
  UiohookKey.Backspace, UiohookKey.Delete,
  // Arrow key right
  UiohookKey.ArrowRight,
  // Navigation
  UiohookKey.Home, UiohookKey.End, UiohookKey.PageUp, UiohookKey.PageDown, UiohookKey.Insert,
]);

/**
 * Special keys (trigger both paws animation)
 * Large keys, function keys, and modifiers
 */
const BOTH_KEYS = new Set([
  UiohookKey.Space, UiohookKey.Enter, UiohookKey.Tab,
  UiohookKey.CapsLock, UiohookKey.Escape,
  // Function keys
  UiohookKey.F1, UiohookKey.F2, UiohookKey.F3, UiohookKey.F4,
  UiohookKey.F5, UiohookKey.F6, UiohookKey.F7, UiohookKey.F8,
  UiohookKey.F9, UiohookKey.F10, UiohookKey.F11, UiohookKey.F12,
  // Modifiers (all)
  UiohookKey.Shift, UiohookKey.ShiftRight,
  UiohookKey.Ctrl, UiohookKey.CtrlRight,
  UiohookKey.Alt, UiohookKey.AltRight,
  UiohookKey.Meta, UiohookKey.MetaRight,
  // Arrow Keys up/down
  UiohookKey.ArrowUp, UiohookKey.ArrowDown,
]);

/**
 * Classify a keycode into an animation action
 * @param {number} keycode - The key code from uiohook
 * @returns {'left' | 'right' | 'both'} The animation action to trigger
 */
function classifyKeyAction(keycode) {
  if (LEFT_KEYS.has(keycode)) {
    return 'left';
  }
  if (RIGHT_KEYS.has(keycode)) {
    return 'right';
  }
  // Default to 'both' for any unclassified keys (including BOTH_KEYS)
  return 'both';
}

/**
 * Send input event to overlay renderer
 * @param {string} type - 'keypress' or 'click'
 * @param {string} action - 'left', 'right', or 'both' (animation to trigger)
 */
function notifyRenderer(type, action = 'both') {
  totalInputs++;

  const overlayWindow = getOverlayWindow();
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('input-event', {
      type,
      action,
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

    const action = classifyKeyAction(event.keycode);
    notifyRenderer('keypress', action);
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
