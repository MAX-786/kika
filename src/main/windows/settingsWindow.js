/**
 * Settings window creation and management
 */

const { BrowserWindow } = require('electron');
const path = require('node:path');

let settingsWindow = null;

/**
 * Creates the settings window
 * @returns {BrowserWindow} The created settings window
 */
function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return settingsWindow;
  }

  settingsWindow = new BrowserWindow({
    width: 420,
    height: 520,
    title: 'Kika Settings',
    resizable: false,
    minimizable: false,
    maximizable: false,

    webPreferences: {
      preload: path.join(__dirname, '../../preload/settings.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, '../../renderer/settings/settings.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  return settingsWindow;
}

/**
 * Show the settings window (create if not exists)
 */
function showSettingsWindow() {
  if (!settingsWindow || settingsWindow.isDestroyed()) {
    createSettingsWindow();
  } else {
    settingsWindow.show();
    settingsWindow.focus();
  }
}

/**
 * Hide the settings window
 */
function hideSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.hide();
  }
}

/**
 * Close the settings window
 */
function closeSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
  }
}

/**
 * Get the current settings window instance
 * @returns {BrowserWindow|null}
 */
function getSettingsWindow() {
  return settingsWindow;
}

module.exports = {
  createSettingsWindow,
  showSettingsWindow,
  hideSettingsWindow,
  closeSettingsWindow,
  getSettingsWindow,
};
