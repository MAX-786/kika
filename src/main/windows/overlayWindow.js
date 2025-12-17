/**
 * Overlay window creation and management
 * Handles transparent, always-on-top overlay with click-through
 */

const { BrowserWindow, screen, Menu, app } = require('electron');
const path = require('node:path');
const { PLATFORM_CONFIG, DEFAULT_SETTINGS } = require('../../shared/defaultSettings');

const isProd = app.isPackaged;
let overlayWindow = null;

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
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const windowWidth = settings.window?.width || DEFAULT_SETTINGS.window.width;
  const windowHeight = settings.window?.height || DEFAULT_SETTINGS.window.height;
  const paddingBottom = settings.window?.paddingBottom || DEFAULT_SETTINGS.window.paddingBottom;

  // Calculate position for bottom center
  const x = Math.round((screenWidth - windowWidth) / 2);
  const y = screenHeight - windowHeight - paddingBottom;

  const platform = process.platform;
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.linux;

  overlayWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x,
    y,

    // Frameless & transparent overlay settings
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',

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
  const clickThroughEnabled = settings.clickThrough?.enabled ?? true;
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
 * Reposition the overlay window to bottom center
 * @param {object} settings - Settings object
 */
function repositionOverlay(settings = DEFAULT_SETTINGS) {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const windowWidth = settings.window?.width || DEFAULT_SETTINGS.window.width;
  const windowHeight = settings.window?.height || DEFAULT_SETTINGS.window.height;
  const paddingBottom = settings.window?.paddingBottom || DEFAULT_SETTINGS.window.paddingBottom;

  const x = Math.round((screenWidth - windowWidth) / 2);
  const y = screenHeight - windowHeight - paddingBottom;

  overlayWindow.setPosition(x, y);
  overlayWindow.setSize(windowWidth, windowHeight);
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

module.exports = {
  createOverlayWindow,
  getOverlayWindow,
  setClickThrough,
  repositionOverlay,
  enableOverlayClickThrough,
  disableOverlayClickThrough,
};
