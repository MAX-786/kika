// ============================================
// SPRITE ANIMATION CONFIGURATION
// Change these constants to adjust the animation
// ============================================
const SPRITE_CONFIG = {
  src: './assets/cat_idle.png', // Path to sprite sheet
  frameCount: 4, // Number of frames in the sprite sheet (horizontal)
  fps: 8, // Animation speed in frames per second (normal)
  fpsExcited: 24, // Animation speed when input detected (excited)
  scale: 1.5, // Scale multiplier for the sprite
  excitedDuration: 200, // How long to stay excited (ms)
};

// ============================================
// SPRITE ANIMATOR CLASS
// ============================================
class SpriteAnimator {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;

    this.spriteSheet = null;
    this.frameWidth = 0;
    this.frameHeight = 0;
    this.currentFrame = 0;
    this.lastFrameTime = 0;
    this.frameDuration = 1000 / config.fps; // ms per frame
    this.baseFrameDuration = 1000 / config.fps;
    this.excitedFrameDuration = 1000 / config.fpsExcited;

    this.isLoaded = false;
    this.excitedTimeout = null;
  }

  /**
   * Load the sprite sheet image
   * @returns {Promise<void>}
   */
  async load() {
    return new Promise((resolve, reject) => {
      this.spriteSheet = new Image();

      this.spriteSheet.onload = () => {
        // Calculate frame dimensions (horizontal sprite sheet)
        this.frameWidth = this.spriteSheet.width / this.config.frameCount;
        this.frameHeight = this.spriteSheet.height;

        // Set canvas size based on single frame + scale
        this.canvas.width = this.frameWidth * this.config.scale;
        this.canvas.height = this.frameHeight * this.config.scale;

        this.isLoaded = true;
        console.log(
          `🐱 Sprite loaded: ${this.frameWidth}x${this.frameHeight} per frame, ${this.config.frameCount} frames`
        );
        resolve();
      };

      this.spriteSheet.onerror = () => {
        reject(new Error(`Failed to load sprite: ${this.config.src}`));
      };

      this.spriteSheet.src = this.config.src;
    });
  }

  /**
   * Temporarily speed up animation when input is detected
   */
  triggerExcited() {
    // Switch to excited (faster) speed
    this.frameDuration = this.excitedFrameDuration;

    // Clear any existing timeout
    if (this.excitedTimeout) {
      clearTimeout(this.excitedTimeout);
    }

    // Reset to normal speed after duration
    this.excitedTimeout = setTimeout(() => {
      this.frameDuration = this.baseFrameDuration;
      this.excitedTimeout = null;
    }, this.config.excitedDuration);
  }

  /**
   * Draw the current frame to the canvas
   */
  drawFrame() {
    if (!this.isLoaded) {
      return;
    }

    // Clear canvas (important for transparency)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate source rectangle for current frame
    const srcX = this.currentFrame * this.frameWidth;
    const srcY = 0;

    // Draw the current frame, scaled
    this.ctx.drawImage(
      this.spriteSheet,
      srcX,
      srcY,
      this.frameWidth,
      this.frameHeight, // Source rectangle
      0,
      0,
      this.canvas.width,
      this.canvas.height // Destination rectangle (scaled)
    );
  }

  /**
   * Update animation frame based on elapsed time
   * @param {number} timestamp - Current timestamp from requestAnimationFrame
   */
  update(timestamp) {
    if (!this.isLoaded) {
      return;
    }

    // Check if enough time has passed for next frame
    const elapsed = timestamp - this.lastFrameTime;

    if (elapsed >= this.frameDuration) {
      // Advance to next frame (loop back to 0)
      this.currentFrame = (this.currentFrame + 1) % this.config.frameCount;
      this.lastFrameTime = timestamp;
    }
  }

  /**
   * Main animation loop using requestAnimationFrame
   */
  animate(timestamp = 0) {
    this.update(timestamp);
    this.drawFrame();

    // Continue the loop
    requestAnimationFrame((ts) => this.animate(ts));
  }

  /**
   * Start the animation
   */
  start() {
    if (!this.isLoaded) {
      console.error('Cannot start animation: sprite not loaded');
      return;
    }

    console.log(`🎬 Starting animation at ${this.config.fps} FPS`);
    this.animate();
  }
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

  // Create and initialize the sprite animator
  const animator = new SpriteAnimator(canvas, SPRITE_CONFIG);

  try {
    await animator.load();
    animator.start();
    console.log('🥁 Kika sprite overlay initialized');

    // Listen for global input events from main process
    if (window.electronAPI?.onInputEvent) {
      window.electronAPI.onInputEvent((data) => {
        console.log(`🎹 Input #${data.count}: ${data.type}`);

        // Trigger excited animation
        animator.triggerExcited();
      });
      console.log('📡 Listening for global input events');
    }
  } catch (error) {
    console.error('Failed to initialize sprite animation:', error);

    // Fallback: show error on canvas
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '14px system-ui';
    ctx.fillText('Sprite load failed', 10, 30);
  }
});
