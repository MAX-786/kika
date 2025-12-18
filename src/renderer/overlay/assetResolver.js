/**
 * Asset Resolver for Overlay Animation Loading
 * Resolves animation assets via IPC, supporting default and custom packs
 * with granular fallback for missing custom assets
 */

/**
 * Map of animation keys to internal config names
 */
const ANIMATION_KEY_MAP = {
  idle: 'idle',
  left: 'hitLeft',
  right: 'hitRight',
  both: 'hitBoth',
};

/**
 * Load animation assets from the active character pack
 * @returns {Promise<{idle: string, left: string, right: string, both: string}>}
 * Each value is a data URL that can be used as img.src
 */
async function loadAnimationAssets() {
  const assets = {};

  for (const [stateName, animationKey] of Object.entries(ANIMATION_KEY_MAP)) {
    try {
      const result = await window.electronAPI.getAnimationAsset(animationKey);
      if (result.ok) {
        assets[stateName] = result.dataUrl;
      } else {
        console.error(`Failed to load ${animationKey}:`, result.error);
        assets[stateName] = null;
      }
    } catch (error) {
      console.error(`Error loading ${animationKey}:`, error);
      assets[stateName] = null;
    }
  }

  return assets;
}

/**
 * Check if the active pack has changed
 * @param {object} oldSettings - Previous settings
 * @param {object} newSettings - New settings
 * @returns {boolean}
 */
function hasPackChanged(oldSettings, newSettings) {
  if (!oldSettings || !newSettings) {
    return true;
  }
  return oldSettings.activeCharacterPackId !== newSettings.activeCharacterPackId;
}

// Export for use in overlay.js
// Note: Using window object since this is a browser context
window.assetResolver = {
  loadAnimationAssets,
  hasPackChanged,
  ANIMATION_KEY_MAP,
};
