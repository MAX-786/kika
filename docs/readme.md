# Kika Documentation

Developer documentation for Kika - an Electron overlay application.

## Documentation Index

| Document                                   | Description                               |
| ------------------------------------------ | ----------------------------------------- |
| [getting-started.md](getting-started.md)   | Setup, installation, and first run        |
| [architecture.md](architecture.md)         | Project structure and code organization   |
| [animation-system.md](animation-system.md) | Sprite animation state machine            |
| [input-hooks.md](input-hooks.md)           | Global keyboard/mouse event handling      |
| [building.md](building.md)                 | Cross-platform packaging and distribution |

## Quick Reference

```bash
# Development
npm run dev          # Start app in development mode
npm run lint         # Run ESLint
npm run format       # Format code with Prettier

# Testing
npm run test:smoke   # Run smoke test

# Building
npm run build:mac    # Build for macOS
npm run build:win    # Build for Windows
npm run build:linux  # Build for Linux
```
