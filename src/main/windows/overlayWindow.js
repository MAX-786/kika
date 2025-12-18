/**
 * Overlay window creation and management
 * Handles transparent, always-on-top overlay with click-through
 */

const { BrowserWindow, screen, Menu, app } = require('electron');
const path = require('node:path');
const { PLATFORM_CONFIG, DEFAULT_SETTINGS, POSITION_PRESETS } = require('../../shared/defaultSettings');

const isProd = app.isPackaged;
let overlayWindow = null;

// Base overlay dimensions (before scaling)
const BASE_WIDTH = 600;
const BASE_HEIGHT = 400;

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute overlay bounds based on settings and screen info
 * @param {object} settings - Settings object with position and size
 * @param {object} screenInfo - Screen info from screen.getPrimaryDisplay()
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
function computeOverlayBounds(settings, screenInfo) {
  const { width: screenWidth, height: screenHeight } = screenInfo.workAreaSize;
  const padding = settings.window?.paddingFromEdge ?? DEFAULT_SETTINGS.window.paddingFromEdge;

  // Get base dimensions from settings (or use defaults)
  const baseWidth = settings.window?.width ?? BASE_WIDTH;
  const baseHeight = settings.window?.height ?? BASE_HEIGHT;

  // Calculate scaled dimensions (clamp scale between 0.5 and 2.0)
  const scale = clamp(settings.size?.scale ?? 1.0, 0.5, 2.0);
  const width = Math.round(baseWidth * scale);
  const height = Math.round(baseHeight * scale);

  let x, y;

  if (settings.position?.mode === 'free') {
    // Free mode: use stored x/y coordinates
    x = settings.position?.x ?? 0;
    y = settings.position?.y ?? 0;
  } else {
    // Preset mode: calculate position based on preset
    const preset = settings.position?.preset ?? POSITION_PRESETS.bottomCenter;

    switch (preset) {
      case POSITION_PRESETS.bottomCenter:
        x = Math.round((screenWidth - width) / 2);
        y = screenHeight - height - padding;
        break;
      case POSITION_PRESETS.bottomLeft:
        x = padding;
        y = screenHeight - height - padding;
        break;
      case POSITION_PRESETS.bottomRight:
        x = screenWidth - width - padding;
        y = screenHeight - height - padding;
        break;
      case POSITION_PRESETS.topLeft:
        x = padding;
        y = padding;
        break;
      case POSITION_PRESETS.topRight:
        x = screenWidth - width - padding;
        y = padding;
        break;
      default:
        // Default to bottom center
        x = Math.round((screenWidth - width) / 2);
        y = screenHeight - height - padding;
    }
  }

  return { x, y, width, height };
}

/**
 * Apply bounds to the overlay window
 * @param {BrowserWindow} win - The window to apply bounds to
 * @param {{ x: number, y: number, width: number, height: number }} bounds - Bounds to apply
 */
function applyOverlayBounds(win, bounds) {
  if (!win || win.isDestroyed()) {
    return;
  }

  win.setPosition(bounds.x, bounds.y);
  win.setSize(bounds.width, bounds.height);
}

/**
 * Enables or disables click-through for the overlay window
 * @param {BrowserWindow} window - The window to configure
 * @param {boolean} clickThrough - Whether clicks should pass through
 */
function setClickThrough(window, clickThrough) {
  const platform = process.platform;
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.linux;

  if (clickThrough) {
    window.setIgnoreMouseEvents(true, { forward: config.supportsForward });
  } else {
    window.setIgnoreMouseEvents(false);
  }
}

/**
 * Creates the main overlay window with transparency and always-on-top behavior
 * @param {object} settings - Settings object for window configuration
 * @returns {BrowserWindow} The created overlay window
 */
function createOverlayWindow(settings = DEFAULT_SETTINGS) {
  const primaryDisplay = screen.getPrimaryDisplay();
  const bounds = computeOverlayBounds(settings, primaryDisplay);

  const platform = process.platform;
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.linux;

  overlayWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,

    // Frameless & transparent overlay settings
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    opacity: settings.opacity !== undefined ? settings.opacity : 1.0,

    // Always on top of other windows
    alwaysOnTop: true,

    // macOS-specific settings
    visibleOnAllWorkspaces: true,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,

    webPreferences: {
      preload: path.join(__dirname, '../../preload/overlay.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Disable menu bar in production
  if (isProd) {
    Menu.setApplicationMenu(null);
  }

  // Load the overlay HTML
  overlayWindow.loadFile(path.join(__dirname, '../../renderer/overlay/overlay.html'));

  // Open DevTools only in development
  if (!isProd) {
    overlayWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Set platform-appropriate window level
  overlayWindow.setAlwaysOnTop(true, config.windowLevel);

  // Enable click-through based on settings
  const clickThroughEnabled = settings.clickThroughEnabled ?? true;
  setClickThrough(overlayWindow, clickThroughEnabled);

  return overlayWindow;
}

/**
 * Get the current overlay window instance
 * @returns {BrowserWindow|null}
 */
function getOverlayWindow() {
  return overlayWindow;
}

/**
 * Reposition the overlay window based on current settings
 * @param {object} settings - Settings object
 */
function repositionOverlay(settings = DEFAULT_SETTINGS) {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const bounds = computeOverlayBounds(settings, primaryDisplay);
  applyOverlayBounds(overlayWindow, bounds);
}

/**
 * Enable click-through on overlay (clicks pass through to desktop)
 * Uses forward: true on macOS to still receive mouse events for hover detection
 */
function enableOverlayClickThrough() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }
  const platform = process.platform;
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.linux;
  overlayWindow.setIgnoreMouseEvents(true, { forward: config.supportsForward });
}

/**
 * Disable click-through on overlay (overlay captures clicks)
 */
function disableOverlayClickThrough() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }
  overlayWindow.setIgnoreMouseEvents(false);
}

/**
 * Set overlay opacity
 * @param {number} opacity - 0.0 to 1.0
 */
function setOverlayOpacity(opacity) {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }
  overlayWindow.setOpacity(opacity);
}

module.exports = {
  createOverlayWindow,
  getOverlayWindow,
  setClickThrough,
  repositionOverlay,
  enableOverlayClickThrough,
  disableOverlayClickThrough,
  computeOverlayBounds,
  applyOverlayBounds,
  setOverlayOpacity,
};
