/**
 * Import character PNG file for custom character pack
 * Handles dialog selection, validation, and file copy
 */

const fs = require('node:fs');
const path = require('node:path');
const { dialog, nativeImage } = require('electron');
const { getCustomCharacterDir, ANIMATION_FILENAMES, VALID_ANIMATION_KEYS } = require('./characterPaths');
const { updateSettings, getSettings } = require('../../shared/settingsStore');

/**
 * Import a PNG file for a specific animation
 * @param {string} animationKey - One of: idle, hitLeft, hitRight, hitBoth
 * @returns {Promise<{ok: boolean, filePath?: string, storedAs?: string, error?: string}>}
 */
async function importCharacterPng(animationKey) {
  // Validate animation key
  if (!VALID_ANIMATION_KEYS.includes(animationKey)) {
    return {
      ok: false,
      error: `Invalid animation key: ${animationKey}. Must be one of: ${VALID_ANIMATION_KEYS.join(', ')}`,
    };
  }

  try {
    // Show native file picker
    const result = await dialog.showOpenDialog({
      title: `Select PNG for ${animationKey} animation`,
      filters: [{ name: 'PNG Images', extensions: ['png'] }],
      properties: ['openFile'],
    });

    // User cancelled
    if (result.canceled || !result.filePaths.length) {
      return { ok: false, error: 'Selection cancelled' };
    }

    const selectedPath = result.filePaths[0];

    // Validate file extension
    if (!selectedPath.toLowerCase().endsWith('.png')) {
      return { ok: false, error: 'File must be a PNG image' };
    }

    // Validate file exists and is readable
    if (!fs.existsSync(selectedPath)) {
      return { ok: false, error: 'Selected file does not exist' };
    }

    // Validate it's a valid image
    const image = nativeImage.createFromPath(selectedPath);
    if (image.isEmpty()) {
      return { ok: false, error: 'Invalid or corrupted PNG file' };
    }

    // Ensure custom character directory exists
    const customDir = getCustomCharacterDir();
    fs.mkdirSync(customDir, { recursive: true });

    // Copy file with fixed filename
    const targetFilename = ANIMATION_FILENAMES[animationKey];
    const targetPath = path.join(customDir, targetFilename);
    fs.copyFileSync(selectedPath, targetPath);

    console.log(`📁 Copied ${animationKey} asset: ${selectedPath} → ${targetPath}`);

    // Update settings to record the uploaded file
    const currentSettings = getSettings();
    updateSettings({
      characterPacks: {
        ...currentSettings.characterPacks,
        custom: {
          ...currentSettings.characterPacks?.custom,
          [animationKey]: targetFilename,
        },
      },
    });

    return {
      ok: true,
      filePath: selectedPath,
      storedAs: targetFilename,
    };
  } catch (error) {
    console.error(`Failed to import ${animationKey} PNG:`, error);
    return {
      ok: false,
      error: error.message || 'Unknown error during import',
    };
  }
}

module.exports = { importCharacterPng };
