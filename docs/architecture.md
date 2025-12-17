# Architecture

## Project Structure

```
kika/
├── main.js          # Electron main process
├── preload.js       # Context bridge for IPC
├── renderer.js      # Animation state machine
├── index.html       # HTML entry point
├── styles.css       # Overlay styling
├── assets/          # Sprite sheets
├── scripts/         # Utility scripts
├── build/           # Build resources (icons, entitlements)
└── docs/            # Documentation
```

## Process Model

```
┌─────────────────┐      IPC       ┌─────────────────┐
│  Main Process   │ ─────────────► │ Renderer Process│
│    (main.js)    │                │  (renderer.js)  │
│                 │                │                 │
│ - Window mgmt   │                │ - Animation     │
│ - Input hooks   │                │ - Canvas        │
│ - System APIs   │                │ - UI logic      │
└─────────────────┘                └─────────────────┘
        │
        │ preload.js (context bridge)
        ▼
   electronAPI exposed to renderer
```

## Key Files

### main.js

- Creates frameless, transparent BrowserWindow
- Configures always-on-top and click-through behavior
- Initializes global input hooks via `uiohook-napi`
- Sends input events to renderer via IPC

### preload.js

- Exposes `electronAPI` to renderer via context bridge
- Provides `onInputEvent` callback for receiving input events

### renderer.js

- `Animation` class: Holds sprite sheet data (image, frameCount, fps)
- `AnimationStateMachine` class: Manages state transitions and playback
- Listens for input events and triggers animations

## Data Flow

1. User types/clicks anywhere on system
2. `uiohook-napi` captures the event in main process
3. Main process increments counter and sends IPC message
4. Preload bridge forwards event to renderer
5. Renderer triggers animation state change
