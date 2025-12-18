# Animation System

## Overview

The animation system uses a state machine pattern with declarative configuration.

## Configuration

Animations are defined in `ANIMATION_CONFIG` at the top of `renderer.js`:

```javascript
const ANIMATION_CONFIG = {
  idle: {
    src: './assets/kika_idle.png',
    frameCount: 4,
    fps: 8,
    loop: true,
  },
  hit: {
    src: './assets/kika_hit.png',
    frameCount: 4,
    fps: 12,
    loop: false,
  },
};
```

### Configuration Options

| Property     | Type    | Description                                  |
| ------------ | ------- | -------------------------------------------- |
| `src`        | string  | Path to sprite sheet (horizontal layout)     |
| `frameCount` | number  | Number of frames in the sheet                |
| `fps`        | number  | Frames per second                            |
| `loop`       | boolean | `true` = loops forever, `false` = plays once |

## Adding New States

1. Add sprite sheet to `assets/` folder
2. Add configuration entry:
   ```javascript
   sleep: {
     src: './assets/kika_sleep.png',
     frameCount: 6,
     fps: 4,
     loop: true,
   },
   ```
3. Trigger from code:
   ```javascript
   stateMachine.setState('sleep');
   ```

## State Machine API

### setState(name, options)

Switch to a named state immediately.

```javascript
stateMachine.setState('idle');
stateMachine.setState('hit', { onComplete: 'idle' });
```

### triggerOneShot(stateName)

Play animation once, then return to `idle`.

```javascript
stateMachine.triggerOneShot('hit');
```

## Sprite Sheet Format

- Frames arranged **horizontally** in a single row
- All frames same size
- PNG with transparency recommended
- Example: 4-frame sheet at 128x128 per frame = 512x128 total
