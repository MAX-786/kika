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
const resetBtn = document.getElementById('reset-btn');

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
    clickThrough.checked = settings.clickThrough?.enabled !== false;
    
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
    clickThrough: {
      enabled: clickThrough.checked,
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
    scaleSlider.value = settings.animation?.scale || 1.5;
    scaleValue.textContent = `${scaleSlider.value}x`;
    windowWidth.value = settings.window?.width || 600;
    windowHeight.value = settings.window?.height || 400;
    paddingBottom.value = settings.window?.paddingBottom || 20;
    hooksEnabled.checked = true;
    ignoreModifiers.checked = true;
    clickThrough.checked = true;
    
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

// Initialize
document.addEventListener('DOMContentLoaded', loadSettings);
