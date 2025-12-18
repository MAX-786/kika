/**
 * Settings persistence using JSON file
 * Stores settings in user data directory
 */

const fs = require('node:fs');
const path = require('node:path');
const { app } = require('electron');
const { DEFAULT_SETTINGS } = require('./defaultSettings');

const SETTINGS_FILE = 'kika-settings.json';

// In-memory cache of current settings
let cachedSettings = null;

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
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      key in target &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Validate settings object
 * @param {object} settings - Settings to validate
 * @returns {object} Validated settings with defaults for invalid values
 */
function validateSettings(settings) {
  const validated = deepMerge(DEFAULT_SETTINGS, settings);

  // Validate position mode
  if (!['preset', 'free'].includes(validated.position.mode)) {
    validated.position.mode = DEFAULT_SETTINGS.position.mode;
  }

  // Validate position preset
  const validPresets = ['bottomCenter', 'bottomLeft', 'bottomRight', 'topLeft', 'topRight'];
  if (!validPresets.includes(validated.position.preset)) {
    validated.position.preset = DEFAULT_SETTINGS.position.preset;
  }

  // Validate scale (0.5 to 5)
  if (typeof validated.size.scale !== 'number' || validated.size.scale < 0.5 || validated.size.scale > 5) {
    validated.size.scale = DEFAULT_SETTINGS.size.scale;
  }

  // Validate booleans
  if (typeof validated.clickThroughEnabled !== 'boolean') {
    validated.clickThroughEnabled = DEFAULT_SETTINGS.clickThroughEnabled;
  }
  if (typeof validated.draggableWhenNotClickThrough !== 'boolean') {
    validated.draggableWhenNotClickThrough = DEFAULT_SETTINGS.draggableWhenNotClickThrough;
  }
  if (typeof validated.locked !== 'boolean') {
    validated.locked = DEFAULT_SETTINGS.locked;
  }
  if (typeof validated.visibleOnAllWorkspaces !== 'boolean') {
    validated.visibleOnAllWorkspaces = DEFAULT_SETTINGS.visibleOnAllWorkspaces;
  }
  if (typeof validated.overlayAboveFullscreen !== 'boolean') {
    validated.overlayAboveFullscreen = DEFAULT_SETTINGS.overlayAboveFullscreen;
  }

  return validated;
}

/**
 * Load settings from file, merging with defaults
 * @returns {object} Settings object
 */
function loadSettings() {
  if (cachedSettings) {
    return cachedSettings;
  }

  try {
    const settingsPath = getSettingsPath();

    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8');
      const userSettings = JSON.parse(data);
      cachedSettings = validateSettings(userSettings);
      console.log('📋 Settings loaded from:', settingsPath);
      return cachedSettings;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }

  cachedSettings = { ...DEFAULT_SETTINGS };
  return cachedSettings;
}

/**
 * Get all current settings
 * @returns {object} Current settings object
 */
function getSettings() {
  return loadSettings();
}

/**
 * Save settings to file
 * @param {object} settings - Settings object to save
 * @returns {boolean} Success status
 */
function saveSettings(settings) {
  try {
    const validated = validateSettings(settings);
    const settingsPath = getSettingsPath();
    fs.writeFileSync(settingsPath, JSON.stringify(validated, null, 2), 'utf-8');
    cachedSettings = validated;
    console.log('💾 Settings saved to:', settingsPath);
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
}

/**
 * Update settings (partial merge)
 * @param {object} partialSettings - Partial settings to merge
 * @returns {object} Updated settings object
 */
function updateSettings(partialSettings) {
  const current = getSettings();
  const merged = deepMerge(current, partialSettings);
  const validated = validateSettings(merged);
  saveSettings(validated);
  return validated;
}

/**
 * Reset settings to defaults
 * @returns {object} Default settings
 */
function resetSettings() {
  cachedSettings = { ...DEFAULT_SETTINGS };
  saveSettings(DEFAULT_SETTINGS);
  return cachedSettings;
}

/**
 * Clear cached settings (force reload on next get)
 */
function clearCache() {
  cachedSettings = null;
}

module.exports = {
  loadSettings,
  getSettings,
  saveSettings,
  updateSettings,
  resetSettings,
  getSettingsPath,
  clearCache,
  validateSettings,
};
