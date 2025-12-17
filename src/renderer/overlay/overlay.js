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

    this.canvas.width = animation.frameWidth * this.scale;
    this.canvas.height = animation.frameHeight * this.scale;
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
