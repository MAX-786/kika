/**
 * Kika Settings Renderer
 * Settings form UI with IPC communication
 */

// DOM Elements
const form = document.getElementById('settings-form');
const scaleSlider = document.getElementById('animation-scale');
const scaleValue = document.getElementById('scale-value');
const windowWidth = document.getElementById('window-width');
const windowHeight = document.getElementById('window-height');
const paddingBottom = document.getElementById('padding-bottom');
const hooksEnabled = document.getElementById('hooks-enabled');
const ignoreModifiers = document.getElementById('ignore-modifiers');
const clickThrough = document.getElementById('click-through');
const positionX = document.getElementById('position-x');
const positionY = document.getElementById('position-y');
const resetBtn = document.getElementById('reset-btn');
const resetPositionBtn = document.getElementById('reset-position-btn');

/**
 * Load current settings into form
 */
async function loadSettings() {
  try {
    const settings = await window.electronAPI.getSettings();
    
    // Animation
    scaleSlider.value = settings.animation?.scale || 1.5;
    scaleValue.textContent = `${scaleSlider.value}x`;
    
    // Window
    windowWidth.value = settings.window?.width || 600;
    windowHeight.value = settings.window?.height || 400;
    paddingBottom.value = settings.window?.paddingBottom || 20;
    
    // Input hooks
    hooksEnabled.checked = settings.inputHooks?.enabled !== false;
    ignoreModifiers.checked = settings.inputHooks?.ignoreModifierKeys !== false;
    
    // Behavior
    clickThrough.checked = settings.clickThroughEnabled !== false;
    
    // Position
    positionX.value = settings.position?.x || 0;
    positionY.value = settings.position?.y || 0;
    
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
    animation: {
      scale: parseFloat(scaleSlider.value),
      idleFps: 8,
      hitFps: 12,
    },
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
    scaleSlider.value = settings.animation?.scale || 1.5;
    scaleValue.textContent = `${scaleSlider.value}x`;
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
scaleSlider.addEventListener('input', () => {
  scaleValue.textContent = `${scaleSlider.value}x`;
});

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
    
    // Update scale slider to show 1.0
    scaleSlider.value = 1.0;
    scaleValue.textContent = '1.0x';
    
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

// Initialize
document.addEventListener('DOMContentLoaded', loadSettings);
