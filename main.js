const { app, BrowserWindow, screen, Menu } = require('electron');
const path = require('node:path');

// Determine if we're in production mode
const isProd = app.isPackaged;

/**
 * Platform-specific click-through configuration
 * Structured for easy extension to Windows/Linux
 */
const platformConfig = {
  darwin: {
    // macOS supports the 'forward' option which allows selective click-through
    // When forward: true, mouse events are forwarded to the window for hit-testing
    // This enables making only transparent areas click-through later
    supportsForward: true,
    windowLevel: 'floating',
  },
  win32: {
    // Windows requires WS_EX_TRANSPARENT extended style for click-through
    // Electron handles this via setIgnoreMouseEvents, but no 'forward' option
    supportsForward: false,
    windowLevel: 'screen-saver', // Higher level needed on Windows
  },
  linux: {
    // Linux (X11) click-through support varies by compositor
    // Wayland has limited support for click-through windows
    supportsForward: false,
    windowLevel: 'floating',
  },
};

/**
 * Enables click-through for the overlay window
 * @param {BrowserWindow} window - The window to configure
 * @param {boolean} clickThrough - Whether clicks should pass through
 */
function setClickThrough(window, clickThrough) {
  const platform = process.platform;
  const config = platformConfig[platform] || platformConfig.linux;

  if (clickThrough) {
    // Enable click-through
    // On macOS with forward: true, we can later use mouse tracking
    // to selectively enable clicking on specific elements
    window.setIgnoreMouseEvents(true, { forward: config.supportsForward });
  } else {
    // Disable click-through - window captures all clicks
    window.setIgnoreMouseEvents(false);
  }
}

/**
 * Creates the main overlay window with transparency and always-on-top behavior
 */
function createOverlayWindow() {
  // Get primary display dimensions for positioning
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Window dimensions
  const windowWidth = 600;
  const windowHeight = 400;

  // Calculate position for bottom center
  const x = Math.round((screenWidth - windowWidth) / 2);
  const y = screenHeight - windowHeight - 20; // 20px padding from bottom

  const platform = process.platform;
  const config = platformConfig[platform] || platformConfig.linux;

  const mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x,
    y,

    // Frameless & transparent overlay settings
    frame: false,
    transparent: true,
    backgroundColor: '#00000000', // Fully transparent (ARGB)

    // Always on top of other windows
    alwaysOnTop: true,

    // macOS-specific: Makes the window float above fullscreen apps
    // and prevents it from creating a new desktop space
    visibleOnAllWorkspaces: true,
    fullscreenable: false,

    // Skip showing in taskbar/dock (optional but common for overlays)
    skipTaskbar: true,

    // Disable shadow for cleaner click-through behavior
    hasShadow: false,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Disable menu bar in production
  if (isProd) {
    Menu.setApplicationMenu(null);
  }

  // Load the HTML file
  mainWindow.loadFile('index.html');

  // Open DevTools only in development
  if (!isProd) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Set platform-appropriate window level
  mainWindow.setAlwaysOnTop(true, config.windowLevel);

  // Enable full click-through for now
  // Later, this can be toggled based on mouse position over interactive elements
  setClickThrough(mainWindow, true);

  return mainWindow;
}

// Wait for app to be ready before creating windows
app.whenReady().then(() => {
  createOverlayWindow();

  // macOS: Re-create window when dock icon is clicked and no windows exist
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createOverlayWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
