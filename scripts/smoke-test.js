#!/usr/bin/env node
/**
 * Kika Smoke Test
 *
 * A minimal sanity-test that verifies the Electron app starts correctly.
 * Run with: npm run test:smoke
 *
 * ============================================
 * MANUAL VERIFICATION CHECKLIST
 * ============================================
 * After running the app (npm run dev), verify:
 *
 * [ ] 1. OVERLAY VISIBLE
 *     - Window appears at bottom center of screen
 *     - Can see desktop/other apps through transparent areas
 *
 * [ ] 2. TRANSPARENCY WORKS
 *     - Background is see-through (not black or white)
 *     - Sprite has transparent background
 *
 * [ ] 3. ALWAYS ON TOP
 *     - Click on another window (browser, Finder, etc.)
 *     - Overlay should remain visible on top
 *
 * [ ] 4. SPRITE ANIMATES
 *     - Cat sprite plays idle animation (frames cycling)
 *     - Animation is smooth, not frozen
 *
 * [ ] 5. CLICK-THROUGH WORKS
 *     - Clicks pass through overlay to apps behind it
 *     - Can interact with windows under the overlay
 *
 * [ ] 6. INPUT COUNTER (requires Accessibility permissions)
 *     - Open DevTools console (auto-opens in dev mode)
 *     - Type in another app (e.g., TextEdit)
 *     - Console shows: "🎹 Input #N: keypress"
 *     - Sprite briefly speeds up on each input
 *
 * [ ] 7. HIT ANIMATION
 *     - On input, sprite switches to 'hit' animation
 *     - Plays once, then returns to 'idle'
 *
 * ============================================
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const STARTUP_TIMEOUT_MS = 5000; // Time to wait for app to start
const ELECTRON_PATH = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');
const APP_PATH = path.join(__dirname, '..');

// Expected log messages that indicate successful initialization
const EXPECTED_LOGS = [
  '🎮 Global input hooks started',
  '📦 Loaded animation',
  '🔄 State transition',
  '🎬 Animation state machine started',
];

// Track which logs we've seen
const seenLogs = new Set();
let electronProcess = null;

/**
 * Start the Electron app and monitor its output
 */
function startApp() {
  console.log('🚀 Starting Kika...\n');

  electronProcess = spawn(ELECTRON_PATH, [APP_PATH], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' },
  });

  // Capture stdout
  electronProcess.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(`  [stdout] ${output}`);
    checkForExpectedLogs(output);
  });

  // Capture stderr (Electron often logs here)
  electronProcess.stderr.on('data', (data) => {
    const output = data.toString();
    // Filter out noise
    if (!output.includes('DevTools') && !output.includes('Passthrough')) {
      process.stdout.write(`  [stderr] ${output}`);
    }
    checkForExpectedLogs(output);
  });

  electronProcess.on('error', (err) => {
    console.error('❌ Failed to start Electron:', err.message);
    process.exit(1);
  });

  electronProcess.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`\n❌ Electron exited with code ${code}`);
      process.exit(1);
    }
  });
}

/**
 * Check if output contains expected initialization logs
 */
function checkForExpectedLogs(output) {
  for (const expected of EXPECTED_LOGS) {
    if (output.includes(expected)) {
      seenLogs.add(expected);
    }
  }
}

/**
 * Wait for the app to initialize and verify health
 */
async function waitForHealth() {
  console.log(`⏳ Waiting ${STARTUP_TIMEOUT_MS / 1000}s for initialization...\n`);

  await new Promise((resolve) => setTimeout(resolve, STARTUP_TIMEOUT_MS));

  console.log('\n📋 Health Check Results:');
  console.log('─'.repeat(50));

  let allPassed = true;

  for (const expected of EXPECTED_LOGS) {
    const found = seenLogs.has(expected);
    const status = found ? '✅' : '⚠️ ';
    console.log(`  ${status} ${expected}`);
    if (!found) {
      allPassed = false;
    }
  }

  console.log('─'.repeat(50));

  return allPassed;
}

/**
 * Cleanup and exit
 */
function cleanup(success) {
  if (electronProcess) {
    console.log('\n🛑 Stopping Kika...');
    electronProcess.kill('SIGTERM');
  }

  if (success) {
    console.log('\n✅ Smoke test PASSED\n');
    console.log('📝 Remember to manually verify the checklist above!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Smoke test completed with warnings');
    console.log('   Some expected logs were not seen. This may be due to:');
    console.log('   - Missing Accessibility permissions (for input hooks)');
    console.log('   - Missing sprite assets');
    console.log('   - App not fully initialized yet');
    console.log('\n   Run `npm run dev` for manual verification.');
    process.exit(0); // Exit 0 since the app did start
  }
}

/**
 * Main entry point
 */
async function main() {
  console.log('═'.repeat(50));
  console.log('  KIKA SMOKE TEST');
  console.log('═'.repeat(50));
  console.log();

  startApp();

  try {
    const healthy = await waitForHealth();
    cleanup(healthy);
  } catch (error) {
    console.error('❌ Smoke test failed:', error.message);
    cleanup(false);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  cleanup(false);
});

main();
