# Getting Started

## Prerequisites

- **Node.js** 18+
- **npm** 9+
- **macOS** 10.15+ (for Accessibility permissions)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd kika

# Install dependencies
npm install
```

## Running in Development

```bash
npm run dev
```

This opens the overlay window with DevTools attached.

## macOS Accessibility Permissions

Kika uses global input hooks to detect keyboard/mouse events. On macOS, you must grant Accessibility permissions:

1. Go to **System Preferences → Security & Privacy → Privacy → Accessibility**
2. Click the lock icon to make changes
3. Add your terminal app (Terminal, iTerm, VS Code) or Kika.app
4. Enable the checkbox

Without these permissions, input hooks will not work.

## Verifying the Setup

Run the smoke test:

```bash
npm run test:smoke
```

Expected output shows checkmarks for:

- Global input hooks started
- Animations loaded
- State machine initialized

## Manual Verification Checklist

After running `npm run dev`:

- [ ] Overlay visible at bottom center of screen
- [ ] Background is transparent (desktop visible)
- [ ] Overlay stays on top when clicking other windows
- [ ] Cat sprite animates
- [ ] Typing in another app shows input count in DevTools console
