/**
 * Kika Settings Renderer
 * Settings form UI with IPC communication
 */

// DOM Elements
const form = document.getElementById('settings-form');
const windowWidth = document.getElementById('window-width');
const windowHeight = document.getElementById('window-height');
const paddingBottom = document.getElementById('padding-bottom');
const hooksEnabled = document.getElementById('hooks-enabled');
const ignoreModifiers = document.getElementById('ignore-modifiers');
const clickThrough = document.getElementById('click-through');
const positionX = document.getElementById('position-x');
const positionY = document.getElementById('position-y');
const opacityInput = document.getElementById('opacity');
const opacityValue = document.getElementById('opacity-value');
const idleFpsInput = document.getElementById('idle-fps');
const idleFpsValue = document.getElementById('idle-fps-value');
const hitFpsInput = document.getElementById('hit-fps');
const hitFpsValue = document.getElementById('hit-fps-value');
const resetBtn = document.getElementById('reset-btn');
const resetPositionBtn = document.getElementById('reset-position-btn');
const visibleAllWorkspaces = document.getElementById('visible-all-workspaces');
const workspaceHint = document.getElementById('workspace-hint');
const overlayAboveFullscreen = document.getElementById('overlay-above-fullscreen');
const fullscreenHint = document.getElementById('fullscreen-hint');

/**
 * Load current settings into form
 */
async function loadSettings() {
  try {
    const settings = await window.electronAPI.getSettings();
    
    // Window
    windowWidth.value = settings.window?.width || 600;
    windowHeight.value = settings.window?.height || 400;
    paddingBottom.value = settings.window?.paddingBottom || 20;

    // Appearance
    const opacity = settings.opacity !== undefined ? settings.opacity : 1.0;
    opacityInput.value = opacity;
    opacityValue.textContent = Math.round(opacity * 100) + '%';
    
    // Animation
    if (settings.animation) {
        idleFpsInput.value = settings.animation.idleFps || 8;
        idleFpsValue.textContent = idleFpsInput.value;
        hitFpsInput.value = settings.animation.hitFps || 12;
        hitFpsValue.textContent = hitFpsInput.value;
    }

    // Input hooks
    hooksEnabled.checked = settings.inputHooks?.enabled !== false;
    ignoreModifiers.checked = settings.inputHooks?.ignoreModifierKeys !== false;
    
    // Behavior
    clickThrough.checked = settings.clickThroughEnabled !== false;
    
    // Position
    positionX.value = settings.position?.x || 0;
    positionY.value = settings.position?.y || 0;

    // Workspace visibility
    visibleAllWorkspaces.checked = settings.visibleOnAllWorkspaces !== false;
    
    // Overlay above fullscreen
    overlayAboveFullscreen.checked = settings.overlayAboveFullscreen ?? false;
    
    // Disable on Windows with appropriate messages
    if (navigator.platform.includes('Win')) {
      visibleAllWorkspaces.disabled = true;
      workspaceHint.style.display = 'block';
      
      overlayAboveFullscreen.disabled = true;
      fullscreenHint.textContent = 'Windows: overlays over exclusive fullscreen aren\'t reliable in Electron.';
    }
    
    console.log('📋 Settings loaded');
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

/**
 * Gather form values into settings object
 */
function getFormSettings() {
  return {
    window: {
      width: parseInt(windowWidth.value, 10),
      height: parseInt(windowHeight.value, 10),
      paddingBottom: parseInt(paddingBottom.value, 10),
    },
    inputHooks: {
      enabled: hooksEnabled.checked,
      ignoreModifierKeys: ignoreModifiers.checked,
    },
    clickThroughEnabled: clickThrough.checked,
    opacity: parseFloat(opacityInput.value),
    animation: {
      idleFps: parseInt(idleFpsInput.value, 10),
      hitFps: parseInt(hitFpsInput.value, 10),
    },
  };
}

/**
 * Save settings
 */
async function saveSettings() {
  try {
    const settings = getFormSettings();
    const success = await window.electronAPI.saveSettings(settings);
    
    if (success) {
      console.log('💾 Settings saved');
      // Show success feedback
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = '✓ Saved!';
      btn.disabled = true;
      
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 1500);
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettings() {
  try {
    const settings = await window.electronAPI.resetSettings();
    
    // Reload form with default values
    windowWidth.value = settings.window?.width || 600;
    windowHeight.value = settings.window?.height || 400;
    paddingBottom.value = settings.window?.paddingBottom || 20;
    hooksEnabled.checked = true;
    ignoreModifiers.checked = true;
    clickThrough.checked = settings.clickThroughEnabled !== false;
    
    console.log('🔄 Settings reset to defaults');
  } catch (error) {
    console.error('Failed to reset settings:', error);
  }
}

// Event listeners
form.addEventListener('submit', (e) => {
  e.preventDefault();
  saveSettings();
});

resetBtn.addEventListener('click', () => {
  resetSettings();
});

/**
 * Reset overlay position to bottom center with scale 1.0
 */
async function resetPosition() {
  try {
    const settings = await window.electronAPI.resetPosition();
    
    // Update position inputs
    positionX.value = settings?.position?.x || 0;
    positionY.value = settings?.position?.y || 0;
    
    // Show success feedback
    const originalText = resetPositionBtn.textContent;
    resetPositionBtn.textContent = '✓ Reset!';
    resetPositionBtn.disabled = true;
    
    setTimeout(() => {
      resetPositionBtn.textContent = originalText;
      resetPositionBtn.disabled = false;
    }, 1500);
    
    console.log('📍 Position reset to bottom center');
  } catch (error) {
    console.error('Failed to reset position:', error);
  }
}

resetPositionBtn.addEventListener('click', () => {
  resetPosition();
});

/**
 * Update position immediately when X/Y inputs change
 */
async function updatePositionLive() {
  try {
    const x = parseInt(positionX.value, 10) || 0;
    const y = parseInt(positionY.value, 10) || 0;
    
    await window.electronAPI.saveSettings({
      position: {
        mode: 'free',
        x,
        y,
      },
    });
    
    console.log(`📍 Position updated: (${x}, ${y})`);
  } catch (error) {
    console.error('Failed to update position:', error);
  }
}

// Live position update on input change
positionX.addEventListener('change', updatePositionLive);
positionY.addEventListener('change', updatePositionLive);

// Opacity value update
opacityInput.addEventListener('input', () => {
    opacityValue.textContent = Math.round(opacityInput.value * 100) + '%';
});

// Animation value updates
idleFpsInput.addEventListener('input', () => {
    idleFpsValue.textContent = idleFpsInput.value;
});

hitFpsInput.addEventListener('input', () => {
    hitFpsValue.textContent = hitFpsInput.value;
});

// Workspace visibility - apply immediately on change
visibleAllWorkspaces.addEventListener('change', async () => {
  try {
    await window.electronAPI.saveSettings({
      visibleOnAllWorkspaces: visibleAllWorkspaces.checked,
    });
    console.log(`🖥️ Workspace visibility: ${visibleAllWorkspaces.checked}`);
  } catch (error) {
    console.error('Failed to update workspace visibility:', error);
  }
});

// Overlay above fullscreen - apply immediately on change
overlayAboveFullscreen.addEventListener('change', async () => {
  try {
    await window.electronAPI.saveSettings({
      overlayAboveFullscreen: overlayAboveFullscreen.checked,
    });
    console.log(`🖥️ Overlay above fullscreen: ${overlayAboveFullscreen.checked}`);
  } catch (error) {
    console.error('Failed to update overlay above fullscreen:', error);
  }
});

// Listen for settings changes from main process (e.g., when overlay is dragged)
if (window.electronAPI?.onSettingsChanged) {
  window.electronAPI.onSettingsChanged((settings) => {
    console.log('📡 Settings changed externally:', settings);
    
    // Update position inputs to stay in sync
    if (settings.position) {
      positionX.value = settings.position.x || 0;
      positionY.value = settings.position.y || 0;
    }
    
    // Update click-through if changed
    if (settings.clickThroughEnabled !== undefined) {
      clickThrough.checked = settings.clickThroughEnabled !== false;
    }
    
    // Update workspace visibility if changed
    if (settings.visibleOnAllWorkspaces !== undefined) {
      visibleAllWorkspaces.checked = settings.visibleOnAllWorkspaces;
    }
    
    // Update overlay above fullscreen if changed
    if (settings.overlayAboveFullscreen !== undefined) {
      overlayAboveFullscreen.checked = settings.overlayAboveFullscreen;
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', loadSettings);
