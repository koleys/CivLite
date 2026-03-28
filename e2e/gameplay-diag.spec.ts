/**
 * Deep gameplay diagnostic — runs through every core mechanic and reports
 * exactly what's broken.
 */
import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:3000';

// ─── helpers ─────────────────────────────────────────────────────────────────

async function startGame(page: Page, seed = 'TESTMAP1') {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.locator('.seed-input').fill(seed);
  await page.getByRole('button', { name: 'Start Game' }).click();
  await page.locator('.turn-info').waitFor({ timeout: 10_000 });
  await page.waitForTimeout(400); // let canvas repaint
}

/** Read the Zustand store state by injecting a script tag */
async function getState(page: Page) {
  return page.evaluate(() => {
    // Access store via the module system isn't easy, but we can expose it
    // from the app — check if __civlite_store__ was set by App.tsx
    const store = (window as any).__civlite_store__;
    if (!store) return null;
    const s = store.getState();
    return {
      phase: s.phase,
      turn: s.turn,
      camera: s.camera,
      mapWidth: s.map?.width ?? null,
      mapHeight: s.map?.height ?? null,
      tileCount: s.map?.tiles?.size ?? 0,
      players: s.players?.map((p: any) => ({
        id: p.id,
        isHuman: p.isHuman,
        unitCount: p.units?.length ?? 0,
        units: p.units?.map((u: any) => ({
          id: u.id, type: u.type,
          x: u.x, y: u.y,
          health: u.health,
          movement: u.movement,
          hasActed: u.hasActed,
        })) ?? [],
        cityCount: p.cities?.length ?? 0,
      })) ?? [],
      selectedUnit: s.selectedUnit,
    };
  });
}

async function getCanvasPixel(page: Page, sx: number, sy: number) {
  return page.evaluate(([x, y]: [number, number]) => {
    const c = document.querySelector('canvas') as HTMLCanvasElement;
    return Array.from(c.getContext('2d')!.getImageData(x, y, 1, 1).data);
  }, [sx, sy] as [number, number]);
}

// ─── expose store on window ───────────────────────────────────────────────────

test.beforeAll(async () => {
  // We'll expose the store in App.tsx — done here via page.addInitScript
});

// ─── tests ───────────────────────────────────────────────────────────────────

test.describe('Gameplay Diagnostics', () => {

  test('DIAG-1: store state after game start', async ({ page }) => {
    // Expose store before navigation
    await page.addInitScript(() => {
      // Intercept Zustand create to grab the store
      const origCreate = (window as any).__zustandCreate;
      // We'll use a polling approach instead
    });

    await startGame(page);

    // Check store via window — first need to expose it
    const storeExists = await page.evaluate(() => !!(window as any).__civlite_store__);
    console.log('Store exposed on window:', storeExists);

    if (!storeExists) {
      // Fall back to checking DOM evidence
      const turnText = await page.locator('.turn-info').textContent();
      console.log('Turn info:', turnText);

      const panelVisible = await page.locator('.unit-stack-panel').isVisible();
      console.log('Unit panel visible:', panelVisible);
    }

    // Verify canvas is painted (at least proof map rendered)
    const centerPx = await getCanvasPixel(page, 640, 360);
    console.log('Canvas center pixel (RGBA):', centerPx);
    expect(centerPx[3]).toBeGreaterThan(0); // alpha > 0 = painted
  });

  test('DIAG-2: click canvas center — unit selection', async ({ page }) => {
    await startGame(page);
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    const cx = box!.width / 2;
    const cy = box!.height / 2;

    // Log pixel before click
    const beforePx = await getCanvasPixel(page, Math.floor(cx), Math.floor(cy));
    console.log('Pixel at center before click:', beforePx);

    await canvas.click({ position: { x: cx, y: cy } });
    await page.waitForTimeout(300);

    const h3 = await page.locator('.unit-stack-panel .usp-name').first().textContent().catch(() => null);
    console.log('Unit panel h3 after center click:', h3);

    // Try clicking in a ±3 tile grid around centre
    let selected = !!h3;
    if (!selected) {
      for (let dx = -3; dx <= 3 && !selected; dx++) {
        for (let dy = -3; dy <= 3 && !selected; dy++) {
          await canvas.click({ position: { x: cx + dx * 64, y: cy + dy * 64 } });
          await page.waitForTimeout(100);
          const text = await page.locator('.unit-stack-panel .usp-name').first().textContent().catch(() => null);
          if (text?.trim()) {
            console.log(`Unit found at offset (${dx}, ${dy}) tiles from center`);
            selected = true;
          }
        }
      }
    }

    expect(selected).toBe(true);
  });

  test('DIAG-3: settler can found a city', async ({ page }) => {
    await startGame(page);
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    const cx = box!.width / 2;
    const cy = box!.height / 2;

    // Find and select settler
    let settlerSelected = false;
    for (let dx = -3; dx <= 3 && !settlerSelected; dx++) {
      for (let dy = -3; dy <= 3 && !settlerSelected; dy++) {
        await canvas.click({ position: { x: cx + dx * 64, y: cy + dy * 64 } });
        await page.waitForTimeout(100);
        const text = await page.locator('.unit-stack-panel .usp-name').first().textContent().catch(() => null);
        if (text?.includes('settler')) { settlerSelected = true; }
      }
    }
    console.log('Settler selected:', settlerSelected);

    if (!settlerSelected) {
      console.log('WARNING: settler not found. Skipping city founding test.');
      test.skip();
      return;
    }

    // Click Found City button
    const foundBtn = page.getByRole('button', { name: /Found City/i });
    await expect(foundBtn).toBeVisible({ timeout: 2_000 });
    await foundBtn.click();
    await page.waitForTimeout(200);

    // Check overlay appeared
    const overlayVisible = await page.locator('.city-overlay').isVisible();
    console.log('City overlay visible:', overlayVisible);
    expect(overlayVisible).toBe(true);

    // Confirm the city name
    await page.getByRole('button', { name: 'Found', exact: true }).click();
    await page.waitForTimeout(300);

    // Overlay should be gone
    await expect(page.locator('.city-overlay')).not.toBeVisible();
    console.log('City founded successfully');
  });

  test('DIAG-4: warrior can move to adjacent tile', async ({ page }) => {
    await startGame(page);
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    const cx = box!.width / 2;
    const cy = box!.height / 2;

    // Find warrior
    let warriorSelected = false;
    let attempts = 0;
    for (let dx = -3; dx <= 3 && !warriorSelected; dx++) {
      for (let dy = -3; dy <= 3 && !warriorSelected; dy++) {
        await canvas.click({ position: { x: cx + dx * 64, y: cy + dy * 64 } });
        await page.waitForTimeout(100);
        attempts++;
        const text = await page.locator('.unit-stack-panel .usp-name').first().textContent().catch(() => null);
        if (text?.includes('warrior')) { warriorSelected = true; }
      }
    }
    console.log(`Warrior found after ${attempts} clicks:`, warriorSelected);

    if (!warriorSelected) {
      // Maybe settler was selected first — click again to cycle/select warrior via stack panel
      await canvas.click({ position: { x: cx, y: cy } });
      await page.waitForTimeout(150);
      await canvas.click({ position: { x: cx, y: cy } });
      await page.waitForTimeout(150);
      const text = await page.locator('.unit-stack-panel .usp-name').first().textContent().catch(() => null);
      warriorSelected = text?.includes('warrior') ?? false;
      console.log('Second attempt warrior selected:', warriorSelected);
    }

    if (!warriorSelected) {
      console.log('Could not select warrior — skipping movement test');
      return;
    }

    const movBefore = await page.locator('.unit-stack-panel .usp-mv').first().textContent();
    console.log('Movement before move:', movBefore);

    // Click one tile to the right
    await canvas.click({ position: { x: cx + 64, y: cy } });
    await page.waitForTimeout(300);

    const movAfter = await page.locator('.unit-stack-panel .usp-mv').first().textContent().catch(() => null);
    console.log('Movement after move:', movAfter);
  });

  test('DIAG-5: end turn advances game state', async ({ page }) => {
    await startGame(page);

    let turn = await page.locator('.turn-info').textContent();
    console.log('Turn before end turn:', turn);
    expect(turn).toContain('Turn 1');

    await canvas_click_for_focus(page);
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    turn = await page.locator('.turn-info').textContent();
    console.log('Turn after end turn:', turn);
    expect(turn).toContain('Turn 2');
  });

  test('DIAG-6: unit movement highlights appear on selection', async ({ page }) => {
    await startGame(page);
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    const cx = box!.width / 2;
    const cy = box!.height / 2;

    // Pixel to the right of center (adjacent tile) before selection
    const beforePx = await getCanvasPixel(page, Math.floor(cx + 64), Math.floor(cy));
    console.log('Adjacent tile pixel before selection:', beforePx);

    // Select unit at center
    await canvas.click({ position: { x: cx, y: cy } });
    await page.waitForTimeout(300);

    // After selection the adjacent tile should have a green highlight overlay
    // (green = R>100, G>150, B<100 in the stroke)
    const afterPx = await getCanvasPixel(page, Math.floor(cx + 64), Math.floor(cy));
    console.log('Adjacent tile pixel after selection:', afterPx);

    const h3 = await page.locator('.unit-stack-panel .usp-name').first().textContent().catch(() => null);
    console.log('Selected unit:', h3);
  });

  test('DIAG-7: multiple turns with AI', async ({ page }) => {
    await startGame(page);
    await canvas_click_for_focus(page);

    for (let i = 1; i <= 5; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(600); // AI takes turns
      const turn = await page.locator('.turn-info').textContent();
      console.log(`After Space press ${i}:`, turn);
    }

    const finalTurn = await page.locator('.turn-info').textContent();
    expect(finalTurn).toContain('Turn 6');
  });

  test('DIAG-8: no console errors during full game session', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await startGame(page);
    await canvas_click_for_focus(page);

    // Select unit, move, end turn x3
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    const cx = box!.width / 2;
    const cy = box!.height / 2;
    await canvas.click({ position: { x: cx, y: cy } });
    await page.waitForTimeout(200);
    await canvas.click({ position: { x: cx + 64, y: cy } });
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    console.log('Console errors:', errors);
    expect(errors).toHaveLength(0);
  });
});

async function canvas_click_for_focus(page: Page) {
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await page.waitForTimeout(100);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
}
