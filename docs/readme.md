# Kika 🐾

> A playful, interactive desktop overlay character that reacts to your keyboard and mouse input.

![Kika Demo](https://via.placeholder.com/800x450?text=Kika+Demo+Placeholder)

## Features

- 🐱 **Interactive Companion**: A bongo-cat style overlay that taps along with your typing.
- ⌨️ **Input Tracking**: Monitors global keyboard and mouse usage in real-time.
- ⚙️ **Customizable**:
  - **Positioning**: Drag and drop anywhere or use the "Bottom Center" preset.
  - **Appearance**: Adjust scale and opacity to fit your setup.
  - **Behavior**: "Click-through" mode lets you keep Kika on screen without blocking clicks.
- 🔓 **Open Source**: Built with Electron, ready to be hacked on.

## Quick Start

Download the latest release for your platform or build it yourself:

1.  **Clone the repo**

    ```bash
    git clone https://github.com/mohammad/kika.git
    cd kika
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Run in development**
    ```bash
    npm run dev
    ```

> **Note for macOS Users**: Kika requires **Accessibility Permissions** to detect global input. You will be prompted to grant these permissions on first launch.

## Documentation

- [Getting Started](./getting-started.md) - Installation and setup guide.
- [Building & Distribution](./building.md) - How to package the app for macOS, Windows, and Linux.
- [Architecture](./architecture.md) - Technical overview of the codebase.
- [Settings & Configuration](./settings.md) - Detailed guide on available settings.
- [Animation System](./animation-system.md) - How the sprite animations work.
- [Input Hooks](./input-hooks.md) - Details on `uiohook-napi` integration.
