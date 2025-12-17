# Kika Build Resources

This directory contains build resources for electron-builder.

## Required Files

For production builds, you need to add icon files:

### macOS

- `icon.icns` - macOS app icon (1024x1024, includes all sizes)

### Windows

- `icon.ico` - Windows icon (256x256, includes multiple sizes)

### Linux

- `icons/` folder with PNG icons at various sizes:
  - `16x16.png`
  - `32x32.png`
  - `48x48.png`
  - `64x64.png`
  - `128x128.png`
  - `256x256.png`
  - `512x512.png`

## Generating Icons

You can use tools like:

- [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder)
- [iconutil](https://developer.apple.com/library/archive/documentation/GraphicsAnimation/Conceptual/HighResolutionOSX/Optimizing/Optimizing.html) (macOS)
- Online converters

## Entitlements

The `entitlements.mac.plist` file is required for:

- Hardened runtime on macOS
- Accessibility permissions for global input hooks
