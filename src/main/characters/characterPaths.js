/**
 * Character pack path utilities
 *
 * Folder Layout (userData):
 *   <userData>/characters/custom/
 *     idle.png      - Idle animation sprite sheet
 *     hitLeft.png   - Left hit animation
 *     hitRight.png  - Right hit animation
 *     hitBoth.png   - Both hands hit animation
 *
 * Fixed filenames prevent collisions and simplify management.
 */

const path = require('node:path');
const { app } = require('electron');

/**
 * Fixed filenames for custom character animations
 * Maps animation key to on-disk filename
 */
const ANIMATION_FILENAMES = {
  idle: 'idle.png',
  hitLeft: 'hitLeft.png',
  hitRight: 'hitRight.png',
  hitBoth: 'hitBoth.png',
};

/**
 * Valid animation keys
 */
const VALID_ANIMATION_KEYS = Object.keys(ANIMATION_FILENAMES);

/**
 * Get the absolute path to custom character directory
 * @returns {string} Path to <userData>/characters/custom/
 */
function getCustomCharacterDir() {
  return path.join(app.getPath('userData'), 'characters', 'custom');
}

/**
 * Get the absolute path for a custom animation asset
 * @param {string} animationKey - One of: idle, hitLeft, hitRight, hitBoth
 * @returns {string} Absolute path to the custom asset file
 */
function getCustomAssetPath(animationKey) {
  if (!ANIMATION_FILENAMES[animationKey]) {
    throw new Error(`Invalid animation key: ${animationKey}`);
  }
  return path.join(getCustomCharacterDir(), ANIMATION_FILENAMES[animationKey]);
}

/**
 * Get the absolute path for a bundled default asset
 * Works correctly in both development and packaged builds
 * @param {string} animationKey - One of: idle, hitLeft, hitRight, hitBoth
 * @returns {string} Absolute path to the bundled asset file
 */
function getBundledAssetPath(animationKey) {
  if (!ANIMATION_FILENAMES[animationKey]) {
    throw new Error(`Invalid animation key: ${animationKey}`);
  }

  // In packaged builds, assets are in resources/assets/default/
  // In dev, they're in assets/default/ relative to project root
  const basePath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'default')
    : path.join(__dirname, '..', '..', '..', 'assets', 'default');

  return path.join(basePath, ANIMATION_FILENAMES[animationKey]);
}

module.exports = {
  getCustomCharacterDir,
  getCustomAssetPath,
  getBundledAssetPath,
  ANIMATION_FILENAMES,
  VALID_ANIMATION_KEYS,
};
