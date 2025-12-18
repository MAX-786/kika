# Getting Started

## Prerequisites

- **Node.js** 18+
- **npm** 9+
- **macOS** 10.15+ (for Accessibility permissions)

## Installation

```bash
# Clone the repository
git clone https://github.com/MAX-786/kika.git
cd kika

# Install dependencies
npm install
```

## Running in Development

```bash
npm run dev
```

This opens the Kika overlay and the Settings window (or tray icon).

## macOS Accessibility Permissions

Kika uses global input hooks to detect keyboard/mouse events. On macOS, you must grant Accessibility permissions:

1. Go to **System Preferences → Security & Privacy → Privacy → Accessibility**
2. Click the lock icon to make changes
3. Add your terminal app (Terminal, iTerm, VS Code) or Kika.app (if built)
4. Enable the checkbox

Without these permissions, Kika cannot detect your typing.

## Verifying the Setup

Run the smoke test:

```bash
npm run test:smoke
```

## Manual Verification Checklist

After running `npm run dev`:

- [ ] Kika overlay visible at bottom center of screen
- [ ] Background is transparent
- [ ] Overlay stays on top when clicking other windows
- [ ] Kika animates when typing
- [ ] Settings window opens via tray or shortcut
