# Building & Distribution

## Build Commands

| Command               | Target        | Output                        |
| --------------------- | ------------- | ----------------------------- |
| `npm run build:mac`   | macOS         | `.dmg`, `.zip` (x64 + arm64)  |
| `npm run build:win`   | Windows       | `.exe` installer + portable   |
| `npm run build:linux` | Linux         | `.AppImage`, `.deb`           |
| `npm run build:all`   | All platforms | All of the above (macOS only) |

## Output Location

All build artifacts are written to `dist/`.

## Build Resources

The `build/` directory contains resources used during packaging:

```
build/
├── entitlements.mac.plist   # macOS permissions
├── icon.icns                # macOS icon (add manually)
├── icon.ico                 # Windows icon (add manually)
└── icons/                   # Linux icons (add manually)
    ├── 16x16.png
    ├── 32x32.png
    ├── 128x128.png
    └── 256x256.png
```

## Adding Icons

Icons are not included by default. To add them:

1. Create a 1024x1024 source image
2. Generate icons using tools like:
   - [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder)
   - Online converters
3. Place files in `build/` directory

## Cross-Platform Building

### From macOS

macOS can build for all platforms:

```bash
# Install Wine for Windows builds (optional)
brew install --cask wine-stable

# Build all
npm run build:all
```

### From Windows

Windows can only build Windows targets.

### From Linux

Linux can build Linux and Windows (with Wine) targets.

## Configuration

Build settings are in `package.json` under the `build` key. Key options:

| Setting               | Purpose                       |
| --------------------- | ----------------------------- |
| `appId`               | Unique app identifier         |
| `productName`         | Display name                  |
| `mac.hardenedRuntime` | Required for notarization     |
| `mac.entitlements`    | Permissions for Accessibility |
| `files`               | Files to include in build     |
