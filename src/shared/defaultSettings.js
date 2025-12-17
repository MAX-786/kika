/**
 * Default settings and schema constants for Kika overlay
 */

const DEFAULT_SETTINGS = {
  // Window settings
  window: {
    width: 600,
    height: 400,
    paddingBottom: 20, // Distance from bottom of screen
  },

  // Animation settings
  animation: {
    scale: 1.5,
    idleFps: 8,
    hitFps: 12,
  },

  // Input hook settings
  inputHooks: {
    enabled: true,
    ignoreModifierKeys: true,
  },

  // Click-through behavior
  clickThrough: {
    enabled: true,
  },
};

/**
 * Settings schema keys for validation
 */
const SETTINGS_KEYS = {
  WINDOW_WIDTH: 'window.width',
  WINDOW_HEIGHT: 'window.height',
  WINDOW_PADDING_BOTTOM: 'window.paddingBottom',
  ANIMATION_SCALE: 'animation.scale',
  ANIMATION_IDLE_FPS: 'animation.idleFps',
  ANIMATION_HIT_FPS: 'animation.hitFps',
  INPUT_HOOKS_ENABLED: 'inputHooks.enabled',
  INPUT_HOOKS_IGNORE_MODIFIERS: 'inputHooks.ignoreModifierKeys',
  CLICK_THROUGH_ENABLED: 'clickThrough.enabled',
};

/**
 * Platform-specific click-through configuration
 */
const PLATFORM_CONFIG = {
  darwin: {
    supportsForward: true,
    windowLevel: 'floating',
  },
  win32: {
    supportsForward: false,
    windowLevel: 'screen-saver',
  },
  linux: {
    supportsForward: false,
    windowLevel: 'floating',
  },
};

module.exports = {
  DEFAULT_SETTINGS,
  SETTINGS_KEYS,
  PLATFORM_CONFIG,
};
