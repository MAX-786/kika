/**
 * Kika Overlay Renderer
 * Animation system with sprite state machine and IPC event handling
 */

// ============================================
// ANIMATION CONFIGURATION
// ============================================
const ANIMATION_CONFIG = {
  idle: {
    src: '../../../assets/cat_idle.png',
    frameCount: 4,
    fps: 8,
    loop: true,
  },
  hit: {
    src: '../../../assets/cat_hit.png',
    frameCount: 4,
    fps: 12,
    loop: false, // Play once, then return to idle
  },
};

const SPRITE_SCALE = 1.5;

// ============================================
// ANIMATION CLASS
// ============================================
class Animation {
  constructor(name, config) {
    this.name = name;
    this.src = config.src;
    this.frameCount = config.frameCount;
    this.fps = config.fps;
    this.loop = config.loop;
    this.frameDuration = 1000 / config.fps;

    this.image = null;
    this.frameWidth = 0;
    this.frameHeight = 0;
    this.isLoaded = false;
  }

  async load() {
    return new Promise((resolve, reject) => {
      this.image = new Image();

      this.image.onload = () => {
        this.frameWidth = this.image.width / this.frameCount;
        this.frameHeight = this.image.height;
        this.isLoaded = true;
        console.log(`🎞 Loaded animation '${this.name}': ${this.frameCount} frames @ ${this.fps} FPS`);
        resolve();
      };

      this.image.onerror = () => {
        reject(new Error(`Failed to load animation: ${this.src}`));
      };

      this.image.src = this.src;
    });
  }
}

// ============================================
// ANIMATION STATE MACHINE
// ============================================
class AnimationStateMachine {
  constructor(canvas, animations) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.animations = animations;
    this.scale = SPRITE_SCALE;

    this.currentState = null;
    this.currentAnimation = null;
    this.frameIndex = 0;
    this.lastFrameTime = 0;
    this.pendingState = null;
  }

  setState(name, options = {}) {
    const animation = this.animations.get(name);

    if (!animation) {
      console.error(`Animation state '${name}' not found`);
      return;
    }

    if (!animation.isLoaded) {
      console.error(`Animation '${name}' not loaded yet`);
      return;
    }

    if (this.currentState === name && !options.force) {
      return;
    }

    console.log(`🔄 State transition: ${this.currentState || 'none'} → ${name}`);

    this.currentState = name;
    this.currentAnimation = animation;
    this.frameIndex = 0;
    this.lastFrameTime = performance.now();
    this.pendingState = options.onComplete || null;
    // Canvas size is controlled by settings (window.width/height), not animation frames
  }

  update(timestamp) {
    if (!this.currentAnimation || !this.currentAnimation.isLoaded) {
      return;
    }

    const elapsed = timestamp - this.lastFrameTime;

    if (elapsed >= this.currentAnimation.frameDuration) {
      const nextFrame = this.frameIndex + 1;

      if (nextFrame >= this.currentAnimation.frameCount) {
        if (this.currentAnimation.loop) {
          this.frameIndex = 0;
        } else if (this.pendingState) {
          this.setState(this.pendingState);
          return;
        } else {
          this.frameIndex = this.currentAnimation.frameCount - 1;
        }
      } else {
        this.frameIndex = nextFrame;
      }

      this.lastFrameTime = timestamp;
    }
  }

  draw() {
    if (!this.currentAnimation || !this.currentAnimation.isLoaded) {
      return;
    }

    const anim = this.currentAnimation;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const srcX = this.frameIndex * anim.frameWidth;
    const srcY = 0;

    this.ctx.drawImage(
      anim.image,
      srcX,
      srcY,
      anim.frameWidth,
      anim.frameHeight,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
  }

  tick(timestamp = 0) {
    this.update(timestamp);
    this.draw();
    requestAnimationFrame((ts) => this.tick(ts));
  }

  start() {
    console.log('🎬 Animation state machine started');
    this.tick();
  }

  triggerOneShot(stateName) {
    this.setState(stateName, { onComplete: 'idle' });
  }
}

// ============================================
// LOADER
// ============================================
async function loadAnimations(config) {
  const animations = new Map();

  const loadPromises = Object.entries(config).map(async ([name, animConfig]) => {
    const animation = new Animation(name, animConfig);
    await animation.load();
    animations.set(name, animation);
  });

  await Promise.all(loadPromises);
  return animations;
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('cat-sprite');

  if (!canvas) {
    console.error('Canvas element #cat-sprite not found');
    return;
  }

  try {
    console.log('⏳ Loading animations...');
    const animations = await loadAnimations(ANIMATION_CONFIG);

    const stateMachine = new AnimationStateMachine(canvas, animations);

    stateMachine.setState('idle');
    stateMachine.start();

    console.log('🥁 Kika animation state machine initialized');

    // Listen for global input events
    if (window.electronAPI?.onInputEvent) {
      window.electronAPI.onInputEvent((data) => {
        console.log(`🎹 Input #${data.count}: ${data.type}`);
        stateMachine.triggerOneShot('hit');
      });
      console.log('📡 Listening for global input events');
    }

    // ============================================
    // SETTINGS INITIALIZATION
    // Load settings on startup and listen for changes
    // ============================================
    await initSettings(stateMachine);

    console.log('⌨️ Use Cmd+Option+K to open settings');
  } catch (error) {
    console.error('Failed to initialize animations:', error);

    canvas.width = 300;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '14px system-ui';
    ctx.fillText(`Load failed: ${error.message}`, 10, 30);
  }
});

// ============================================
// SETTINGS SYSTEM
// ============================================
let currentSettings = null;

/**
 * Initialize settings - load current and listen for changes
 */
async function initSettings(stateMachine) {
  if (!window.electronAPI?.getSettings) {
    console.warn('Settings API not available');
    return;
  }

  // Load initial settings
  try {
    currentSettings = await window.electronAPI.getSettings();
    console.log('⚙️ Settings loaded:', currentSettings);
    applySettings(currentSettings, stateMachine);
  } catch (error) {
    console.error('Failed to load settings:', error);
  }

  // Listen for settings changes from main process
  if (window.electronAPI?.onSettingsChanged) {
    window.electronAPI.onSettingsChanged((settings) => {
      console.log('⚙️ Settings changed:', settings);
      currentSettings = settings;
      applySettings(settings, stateMachine);
    });
    console.log('📡 Listening for settings changes');
  }
}

/**
 * Apply settings to the overlay
 */
function applySettings(settings, stateMachine) {
  if (!settings) {
    return;
  }

  // Apply canvas size based on window dimensions
  // Sprite will stretch/squeeze to fill the canvas
  if (settings.window && stateMachine) {
    const width = settings.window.width || 600;
    const height = settings.window.height || 400;
    
    stateMachine.canvas.width = width;
    stateMachine.canvas.height = height;
    
    console.log(`📐 Canvas sized to: ${width}x${height}`);
  }

  // Apply drag behavior
  applyDragBehavior(settings);

  // Log applied settings
  console.log(`🖱️ Click-through: ${settings.clickThroughEnabled}`);
}

/**
 * Apply drag behavior based on settings
 * Drag is enabled when click-through is disabled
 */
let isDragListenerAttached = false;

function applyDragBehavior(settings) {
  const clickThrough = settings.clickThroughEnabled !== false;

  // Drag is enabled when click-through is disabled
  const shouldEnableDrag = !clickThrough;

  // Apply drag class to body
  if (shouldEnableDrag) {
    document.body.classList.add('drag-enabled');
    console.log('↔️ Drag enabled (click-through off)');

    // Attach drag end listener if not already attached
    if (!isDragListenerAttached) {
      document.addEventListener('mouseup', handleDragEnd);
      isDragListenerAttached = true;
    }
  } else {
    document.body.classList.remove('drag-enabled');
    console.log('↔️ Drag disabled (click-through on)');

    // Remove drag end listener
    if (isDragListenerAttached) {
      document.removeEventListener('mouseup', handleDragEnd);
      isDragListenerAttached = false;
    }
  }
}

/**
 * Handle drag end - notify main process to save position
 */
function handleDragEnd() {
  // Small delay to ensure window position is updated
  setTimeout(() => {
    if (window.electronAPI?.notifyDragEnd) {
      window.electronAPI.notifyDragEnd();
      console.log('📍 Notified main process of drag end');
    }
  }, 50);
}
