/**
 * Settings persistence using JSON file
 * Stores settings in user data directory
 */

const fs = require('node:fs');
const path = require('node:path');
const { app } = require('electron');
const { DEFAULT_SETTINGS } = require('./defaultSettings');

const SETTINGS_FILE = 'kika-settings.json';

/**
 * Get the full path to the settings file
 * @returns {string} Absolute path to settings file
 */
function getSettingsPath() {
  return path.join(app.getPath('userData'), SETTINGS_FILE);
}

/**
 * Deep merge two objects
 * @param {object} target - Target object
 * @param {object} source - Source object
 * @returns {object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Load settings from file, merging with defaults
 * @returns {object} Settings object
 */
function loadSettings() {
  try {
    const settingsPath = getSettingsPath();

    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8');
      const userSettings = JSON.parse(data);
      // Merge with defaults to ensure all keys exist
      return deepMerge(DEFAULT_SETTINGS, userSettings);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }

  return { ...DEFAULT_SETTINGS };
}

/**
 * Save settings to file
 * @param {object} settings - Settings object to save
 * @returns {boolean} Success status
 */
function saveSettings(settings) {
  try {
    const settingsPath = getSettingsPath();
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    console.log('💾 Settings saved to:', settingsPath);
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
}

/**
 * Reset settings to defaults
 * @returns {object} Default settings
 */
function resetSettings() {
  saveSettings(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS };
}

module.exports = {
  loadSettings,
  saveSettings,
  resetSettings,
  getSettingsPath,
};
