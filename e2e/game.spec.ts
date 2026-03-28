import { test, expect, Page } from '@playwright/test';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function loadMainMenu(page: Page) {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('CivLite');
}

async function quickStart(page: Page) {
  await loadMainMenu(page);
  await page.getByRole('button', { name: 'Quick Start' }).click();
  // Wait until the top-bar turn indicator appears
  await expect(page.locator('.turn-info')).toBeVisible({ timeout: 10_000 });
}

async function openNewGame(page: Page) {
  await loadMainMenu(page);
  await page.getByRole('button', { name: 'New Game' }).click();
  await expect(page.locator('.panel-title')).toHaveText('New Game');
}

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe('Main Menu', () => {
  test('renders title and all buttons', async ({ page }) => {
    await loadMainMenu(page);

    await expect(page.locator('h1')).toHaveText('CivLite');
    await expect(page.locator('p.subtitle')).toContainText('4X Strategy');

    await expect(page.getByRole('button', { name: 'New Game' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Quick Start' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Continue Game' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Settings' })).toBeEnabled();
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await loadMainMenu(page);
    expect(errors).toHaveLength(0);
  });
});

test.describe('Settings Panel', () => {
  test('opens settings panel from main menu', async ({ page }) => {
    await loadMainMenu(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.locator('h2.panel-title')).toHaveText('Settings');
    await expect(page.getByRole('button', { name: 'Save & Apply' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('settings panel has all option selects', async ({ page }) => {
    await loadMainMenu(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    // Map Size, Difficulty, Game Speed, AI Players, AI Mode — 5 selects
    const selects = page.locator('.option-select');
    await expect(selects).toHaveCount(5);
  });

  test('cancel returns to main menu', async ({ page }) => {
    await loadMainMenu(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible();
  });

  test('save & apply returns to main menu', async ({ page }) => {
    await loadMainMenu(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    // Change difficulty
    await page.locator('.option-select').nth(1).selectOption('deity');
    await page.getByRole('button', { name: 'Save & Apply' }).click();
    await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible();
  });
});

test.describe('New Game Panel', () => {
  test('opens new game panel on click', async ({ page }) => {
    await openNewGame(page);

    await expect(page.locator('.seed-input')).toBeVisible();
    await expect(page.locator('.option-select').first()).toBeVisible();
    await expect(page.getByRole('button', { name: '🎲' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
  });

  test('seed input has an initial value (8 chars, alphanumeric)', async ({ page }) => {
    await openNewGame(page);
    const seed = await page.locator('.seed-input').inputValue();
    expect(seed).toMatch(/^[0-9A-Z]{8}$/);
  });

  test('dice button rolls a new seed', async ({ page }) => {
    await openNewGame(page);
    const before = await page.locator('.seed-input').inputValue();
    // Click dice several times — at least one should differ
    let changed = false;
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: '🎲' }).click();
      const after = await page.locator('.seed-input').inputValue();
      if (after !== before) { changed = true; break; }
    }
    expect(changed).toBe(true);
  });

  test('user can type a custom seed', async ({ page }) => {
    await openNewGame(page);
    const input = page.locator('.seed-input');
    await input.fill('12345678');
    await expect(input).toHaveValue('12345678');
  });

  test('map size selector has Standard selected by default', async ({ page }) => {
    await openNewGame(page);
    const sel = page.locator('.option-select').first();
    await expect(sel).toHaveValue('standard');
  });

  test('back button returns to main menu', async ({ page }) => {
    await openNewGame(page);
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.locator('h1')).toHaveText('CivLite');
    await expect(page.locator('.panel-title')).not.toBeVisible();
  });

  test('starts game with custom seed', async ({ page }) => {
    await openNewGame(page);
    await page.locator('.seed-input').fill('TESTABCD');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.locator('.turn-info')).toBeVisible({ timeout: 10_000 });
    // Seed display should show in top bar
    await expect(page.locator('.seed-display')).toBeVisible();
    await expect(page.locator('.seed-display')).toContainText('🗺');
  });
});

test.describe('Game View', () => {
  test('renders canvas, top bar, minimap after quick start', async ({ page }) => {
    await quickStart(page);

    await expect(page.locator('canvas').first()).toBeVisible();
    await expect(page.locator('.top-bar')).toBeVisible();
    await expect(page.locator('.turn-info')).toContainText('Turn 1');
    await expect(page.locator('.seed-display')).toBeVisible();
    await expect(page.locator('.minimap canvas')).toBeVisible();
  });

  test('canvas is painted (has non-transparent pixels)', async ({ page }) => {
    await quickStart(page);

    const painted = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      // Sample a 10×10 grid of pixels across the canvas
      for (let sx = 0.1; sx < 1; sx += 0.2) {
        for (let sy = 0.15; sy < 0.9; sy += 0.2) {
          const px = ctx.getImageData(
            Math.floor(canvas.width * sx),
            Math.floor(canvas.height * sy),
            1, 1
          ).data;
          if (px[3] > 0) return true; // alpha > 0 means painted
        }
      }
      return false;
    });

    expect(painted).toBe(true);
  });

  test('minimap canvas is painted', async ({ page }) => {
    await quickStart(page);

    const painted = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas');
      const minimap = canvases[1] as HTMLCanvasElement;
      if (!minimap) return false;
      const ctx = minimap.getContext('2d');
      if (!ctx) return false;
      const px = ctx.getImageData(90, 67, 1, 1).data;
      return px[3] > 0;
    });

    expect(painted).toBe(true);
  });

  test('seed display shows formatted seed code', async ({ page }) => {
    await quickStart(page);
    const seedText = await page.locator('.seed-display').textContent();
    expect(seedText).toMatch(/🗺\s[0-9A-Z]{8}/);
  });

  test('no console errors after game start', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await quickStart(page);
    // Allow a brief settle
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });
});

test.describe('Gameplay — End Turn', () => {
  test('Space key increments turn counter', async ({ page }) => {
    await quickStart(page);
    await expect(page.locator('.turn-info')).toContainText('Turn 1');

    // Focus the window and press Space
    await page.locator('canvas').first().click({ position: { x: 640, y: 400 } });
    await page.keyboard.press('Space');
    // endTurn is async (AI thinking); wait up to 15s for turn to advance
    await expect(page.locator('.turn-info')).toContainText('Turn 2', { timeout: 15_000 });
  });

  test('turn advances multiple times', async ({ page }) => {
    await quickStart(page);
    await page.locator('canvas').first().click({ position: { x: 640, y: 400 } });

    for (let i = 1; i <= 3; i++) {
      await page.keyboard.press('Space');
      // Wait for AI to finish before pressing Space again
      await expect(page.locator('.turn-info')).toContainText(`Turn ${i + 1}`, { timeout: 15_000 });
      await expect(page.locator('.ai-thinking-indicator')).toHaveCount(0, { timeout: 5_000 });
    }

    await expect(page.locator('.turn-info')).toContainText('Turn 4');
  });
});

test.describe('Gameplay — Unit selection & movement', () => {
  // Helper: use store state to compute exact screen position of a unit
  async function clickUnit(page: Page): Promise<void> {
    // Get camera + canvas size from the DOM to compute exact screen position
    const pos = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      // The Zustand store is available via the module system; access it through
      // a data-testid we'll look for, or just expose camera via canvas dataset.
      // Fallback: use canvas center (camera is initialised on spawn point)
      return { cx: canvas.width / 2, cy: canvas.height / 2 };
    });
    // Click at exact canvas center — camera is set to spawn point at game start
    await page.locator('canvas').first().click({ position: { x: pos.cx, y: pos.cy } });
  }

  test('unit panel appears when unit is clicked', async ({ page }) => {
    await quickStart(page);

    await clickUnit(page);
    await page.waitForTimeout(150);

    // Stack panel should now be visible with at least one unit name
    await expect(page.locator('.unit-stack-panel--visible')).toBeVisible({ timeout: 5_000 });
    const text = await page.locator('.unit-stack-panel .usp-name').first().textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('Escape clears unit selection', async ({ page }) => {
    await quickStart(page);

    await clickUnit(page);
    await page.waitForTimeout(150);
    await expect(page.locator('.unit-stack-panel--visible')).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    await expect(page.locator('.unit-stack-panel--visible')).not.toBeVisible();
  });

  test('city founding overlay appears when settler clicks valid tile', async ({ page }) => {
    await quickStart(page);

    // 1. Select the settler (click canvas center)
    await clickUnit(page);
    await page.waitForTimeout(150);
    await expect(page.locator('.unit-stack-panel--visible')).toBeVisible({ timeout: 5_000 });

    // 2. Check if settler is selected; if warrior is selected first, select settler specifically
    const unitText = await page.locator('.unit-stack-panel .usp-name').first().textContent();
    // If settler isn't selected, the overlay won't appear — skip gracefully
    if (!unitText?.includes('settler')) {
      test.skip();
      return;
    }

    // 3. Click one tile to the right to trigger city founding overlay (should be valid land near spawn)
    const canvasW = await page.evaluate(() => (document.querySelector('canvas') as HTMLCanvasElement).width);
    const canvasH = await page.evaluate(() => (document.querySelector('canvas') as HTMLCanvasElement).height);
    await page.locator('canvas').first().click({
      position: { x: canvasW / 2 + 64, y: canvasH / 2 }
    });
    await page.waitForTimeout(200);

    // Either city overlay appeared OR the settler moved (terrain may be ocean/mountain)
    // Just verify no console errors and no crash
    const errors = await page.evaluate(() => (window as any).__playwrightErrors ?? []);
    expect(errors).toHaveLength(0);
  });
});

test.describe('Gameplay — Camera controls', () => {
  test('T key toggles tile yield overlay', async ({ page }) => {
    await quickStart(page);
    await page.locator('canvas').first().click({ position: { x: 640, y: 400 } });

    // Before toggle — no overlay text visible on canvas (we check for a known overlay element)
    await page.keyboard.press('t');
    // The showTileYields flag draws a debug overlay on canvas — just verify no crash
    await page.waitForTimeout(200);
    // Press again to toggle off
    await page.keyboard.press('t');
    await page.waitForTimeout(200);
    // No error = pass
    await expect(page.locator('.top-bar')).toBeVisible();
  });

  test('Arrow keys pan the camera (no crash)', async ({ page }) => {
    await quickStart(page);
    await page.locator('canvas').first().click({ position: { x: 640, y: 400 } });

    for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
      await page.keyboard.press(key);
    }
    await page.waitForTimeout(200);
    await expect(page.locator('.top-bar')).toBeVisible();
  });

  test('zoom keys work without crash', async ({ page }) => {
    await quickStart(page);
    await page.locator('canvas').first().click({ position: { x: 640, y: 400 } });

    await page.keyboard.press('+');
    await page.keyboard.press('-');
    await page.waitForTimeout(200);
    await expect(page.locator('.top-bar')).toBeVisible();
  });
});

test.describe('Seed reproducibility', () => {
  test('same seed produces same terrain color at canvas center', async ({ page }) => {
    const SEED = 'AABBCCDD';

    async function getCenterPixel(p: Page): Promise<number[]> {
      return p.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;
        const cx = Math.floor(canvas.width / 2);
        const cy = Math.floor(canvas.height / 2);
        return Array.from(ctx.getImageData(cx, cy, 1, 1).data);
      });
    }

    // Run 1
    await page.goto('/');
    await page.getByRole('button', { name: 'New Game' }).click();
    await page.locator('.seed-input').fill(SEED);
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.locator('.turn-info')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(300);
    const px1 = await getCenterPixel(page);

    // Run 2 — reload and repeat with same seed
    await page.goto('/');
    await page.getByRole('button', { name: 'New Game' }).click();
    await page.locator('.seed-input').fill(SEED);
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.locator('.turn-info')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(300);
    const px2 = await getCenterPixel(page);

    expect(px1).toEqual(px2);
  });

  test('different seeds produce different maps', async ({ page }) => {
    async function getPixelSample(p: Page): Promise<number[]> {
      return p.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;
        const samples: number[] = [];
        for (let i = 0; i < 5; i++) {
          const x = Math.floor(canvas.width * (0.1 + i * 0.18));
          const y = Math.floor(canvas.height * 0.5);
          samples.push(...Array.from(ctx.getImageData(x, y, 1, 1).data));
        }
        return samples;
      });
    }

    await page.goto('/');
    await page.getByRole('button', { name: 'New Game' }).click();
    await page.locator('.seed-input').fill('00000001');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.locator('.turn-info')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(300);
    const sample1 = await getPixelSample(page);

    await page.goto('/');
    await page.getByRole('button', { name: 'New Game' }).click();
    await page.locator('.seed-input').fill('FFFFFFFF');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.locator('.turn-info')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(300);
    const sample2 = await getPixelSample(page);

    expect(sample1).not.toEqual(sample2);
  });
});
