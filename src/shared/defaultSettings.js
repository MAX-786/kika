/**
 * Default settings and schema constants for Kika overlay
 */

/**
 * Position presets map to screen positions
 */
const POSITION_PRESETS = {
  bottomCenter: 'bottomCenter',
  bottomLeft: 'bottomLeft',
  bottomRight: 'bottomRight',
  topLeft: 'topLeft',
  topRight: 'topRight',
};

/**
 * Default settings object
 */
const DEFAULT_SETTINGS = {
  // Position settings
  position: {
    mode: 'preset', // 'preset' | 'free'
    preset: POSITION_PRESETS.bottomCenter,
    x: 0, // Used when mode is 'free'
    y: 0, // Used when mode is 'free'
  },

  // Window dimensions (internal)
  window: {
    width: 128,
    height: 128,
    paddingFromEdge: 20,
  },

  // Click-through behavior
  clickThroughEnabled: true,

  // Show overlay on all virtual desktops/workspaces (macOS Spaces, Linux workspaces)
  visibleOnAllWorkspaces: true,

  // Best-effort: stay above full-screen apps (macOS has reliable support)
  overlayAboveFullscreen: typeof process !== 'undefined' ? process.platform === 'darwin' : false,

  // Draggable when click-through is off
  draggableWhenNotClickThrough: true,

  // Lock overlay position (prevents dragging)
  locked: false,

  // Animation settings
  animation: {
    idleFps: 8,
    hitFps: 12,
  },

  // Input hook settings
  inputHooks: {
    enabled: true,
    ignoreModifierKeys: true,
  },

  // Character pack system
  // activeCharacterPackId: 'default' uses bundled assets, 'custom' uses user-uploaded
  activeCharacterPackId: 'default',

  // Character packs metadata
  // Custom pack stores filenames for each animation stored in <userData>/characters/custom/
  characterPacks: {
    custom: {
      idle: null,      // e.g. 'idle.png' when uploaded
      hitLeft: null,   // e.g. 'hitLeft.png'
      hitRight: null,  // e.g. 'hitRight.png'
      hitBoth: null,   // e.g. 'hitBoth.png'
    },
  },
};

/**
 * Settings schema keys for validation
 */
const SETTINGS_KEYS = {
  POSITION_MODE: 'position.mode',
  POSITION_PRESET: 'position.preset',
  POSITION_X: 'position.x',
  POSITION_Y: 'position.y',
  SIZE_SCALE: 'size.scale',
  CLICK_THROUGH_ENABLED: 'clickThroughEnabled',
  DRAGGABLE: 'draggableWhenNotClickThrough',
  LOCKED: 'locked',
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
  POSITION_PRESETS,
};
