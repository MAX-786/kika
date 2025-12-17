// ============================================
// ANIMATION CONFIGURATION
// ============================================
const ANIMATION_CONFIG = {
  idle: {
    src: './assets/cat_idle.png',
    frameCount: 4,
    fps: 8,
    loop: true,
  },
  hit: {
    src: './assets/cat_hit.png',
    frameCount: 4,
    fps: 12,
    loop: false, // Play once, then return to idle
  },
  // ----------------------------------------
  // HOW TO ADD MORE STATES:
  // ----------------------------------------
  // sleep: {
  //   src: './assets/cat_sleep.png',
  //   frameCount: 6,
  //   fps: 4,
  //   loop: true,
  // },
  // criticalHit: {
  //   src: './assets/cat_critical.png',
  //   frameCount: 8,
  //   fps: 16,
  //   loop: false,
  // },
};

const SPRITE_SCALE = 1.5;

// ============================================
// ANIMATION CLASS
// Holds data for a single animation: image, frames, timing
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

  /**
   * Load the sprite sheet image
   * @returns {Promise<void>}
   */
  async load() {
    return new Promise((resolve, reject) => {
      this.image = new Image();

      this.image.onload = () => {
        this.frameWidth = this.image.width / this.frameCount;
        this.frameHeight = this.image.height;
        this.isLoaded = true;
        console.log(`� Loaded animation '${this.name}': ${this.frameCount} frames @ ${this.fps} FPS`);
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
// Manages state transitions and animation playback
// ============================================
class AnimationStateMachine {
  constructor(canvas, animations) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.animations = animations; // Map<string, Animation>
    this.scale = SPRITE_SCALE;

    this.currentState = null;
    this.currentAnimation = null;
    this.frameIndex = 0;
    this.lastFrameTime = 0;
    this.pendingState = null; // State to transition to after current animation ends
  }

  /**
   * Set the current animation state
   * @param {string} name - Name of the state (e.g., 'idle', 'hit')
   * @param {object} options - Options for state transition
   * @param {boolean} options.force - Force immediate transition even if non-looping
   * @param {string} options.onComplete - State to transition to when this animation completes
   */
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

    // If already in this state and not forcing, ignore
    if (this.currentState === name && !options.force) {
      return;
    }

    console.log(`🔄 State transition: ${this.currentState || 'none'} → ${name}`);

    this.currentState = name;
    this.currentAnimation = animation;
    this.frameIndex = 0;
    this.lastFrameTime = performance.now();
    this.pendingState = options.onComplete || null;

    // Resize canvas for this animation
    this.canvas.width = animation.frameWidth * this.scale;
    this.canvas.height = animation.frameHeight * this.scale;
  }

  /**
   * Update the animation based on elapsed time
   * @param {number} timestamp - Current timestamp from requestAnimationFrame
   */
  update(timestamp) {
    if (!this.currentAnimation || !this.currentAnimation.isLoaded) {
      return;
    }

    const elapsed = timestamp - this.lastFrameTime;

    if (elapsed >= this.currentAnimation.frameDuration) {
      const nextFrame = this.frameIndex + 1;

      if (nextFrame >= this.currentAnimation.frameCount) {
        // Animation finished
        if (this.currentAnimation.loop) {
          // Loop back to start
          this.frameIndex = 0;
        } else if (this.pendingState) {
          // Transition to pending state (e.g., back to idle)
          this.setState(this.pendingState);
          return;
        } else {
          // Stay on last frame
          this.frameIndex = this.currentAnimation.frameCount - 1;
        }
      } else {
        this.frameIndex = nextFrame;
      }

      this.lastFrameTime = timestamp;
    }
  }

  /**
   * Draw the current frame to the canvas
   */
  draw() {
    if (!this.currentAnimation || !this.currentAnimation.isLoaded) {
      return;
    }

    const anim = this.currentAnimation;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate source rectangle
    const srcX = this.frameIndex * anim.frameWidth;
    const srcY = 0;

    // Draw scaled frame
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

  /**
   * Main animation loop
   */
  tick(timestamp = 0) {
    this.update(timestamp);
    this.draw();
    requestAnimationFrame((ts) => this.tick(ts));
  }

  /**
   * Start the animation loop
   */
  start() {
    console.log('🎬 Animation state machine started');
    this.tick();
  }

  /**
   * Trigger a one-shot animation, then return to idle
   * @param {string} stateName - Name of the one-shot state
   */
  triggerOneShot(stateName) {
    this.setState(stateName, { onComplete: 'idle' });
  }
}

// ============================================
// LOADER - Preload all animation assets
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
    // Load all animations
    console.log('⏳ Loading animations...');
    const animations = await loadAnimations(ANIMATION_CONFIG);

    // Create state machine
    const stateMachine = new AnimationStateMachine(canvas, animations);

    // Start with idle state
    stateMachine.setState('idle');
    stateMachine.start();

    console.log('🥁 Kika animation state machine initialized');

    // Listen for global input events
    if (window.electronAPI?.onInputEvent) {
      window.electronAPI.onInputEvent((data) => {
        console.log(`🎹 Input #${data.count}: ${data.type}`);

        // Trigger hit animation on any input
        stateMachine.triggerOneShot('hit');
      });
      console.log('📡 Listening for global input events');
    }
  } catch (error) {
    console.error('Failed to initialize animations:', error);

    // Fallback error display
    canvas.width = 300;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '14px system-ui';
    ctx.fillText(`Load failed: ${error.message}`, 10, 30);
  }
});
