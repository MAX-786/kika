# Input Hooks

## Overview

Kika uses `uiohook-napi` to capture global keyboard and mouse events, even when the app is not focused.

## How It Works

1. **Main process** initializes hooks on app ready
2. **uiohook-napi** registers system-level event listeners
3. Events are counted and forwarded to renderer via IPC
4. **Renderer** reacts to events (e.g., triggers hit animation)

## Platform Support

| Platform        | Keyboard | Mouse | Notes                              |
| --------------- | -------- | ----- | ---------------------------------- |
| macOS           | ✅       | ✅    | Requires Accessibility permissions |
| Windows         | ✅       | ✅    | Works out of the box               |
| Linux (X11)     | ✅       | ✅    | May vary by compositor             |
| Linux (Wayland) | ⚠️       | ⚠️    | Limited support                    |

## macOS Permissions

Global input hooks require Accessibility permissions on macOS:

1. Open **System Preferences → Security & Privacy → Privacy**
2. Select **Accessibility** in the left panel
3. Add and enable your terminal or `Kika.app`

Without permissions, the app may crash or hooks won't capture events.

## Code Reference

### Main Process (main.js)

```javascript
// Initialize hooks
uIOhook.on('keydown', (event) => {
  notifyRenderer('keypress');
});

uIOhook.on('mousedown', () => {
  notifyRenderer('click');
});

uIOhook.start();
```

### Preload (preload.js)

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  onInputEvent: (callback) => {
    ipcRenderer.on('input-event', (_event, data) => {
      callback(data);
    });
  },
});
```

### Renderer (renderer.js)

```javascript
window.electronAPI.onInputEvent((data) => {
  console.log(`Input #${data.count}: ${data.type}`);
  stateMachine.triggerOneShot('hit');
});
```

## Event Data Structure

```javascript
{
  type: 'keypress' | 'click',
  count: number,      // Total input count
  timestamp: number   // Date.now()
}
```
