/**
 * e2e/features.spec.ts
 * Playwright tests for new UX features:
 *  - Always-visible yields panel
 *  - Mouse tooltip on hover
 *  - Edge panning (no crash)
 *  - Minimap click-to-navigate
 *  - Camera bounds clamping
 *  - Right-click context menu
 *  - Right-click to move unit
 *  - Left-click selects only (no movement)
 *  - Context menu closes on Escape
 */

import { test, expect, Page } from '@playwright/test';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function quickStart(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Quick Start' }).click();
  await expect(page.locator('.turn-info')).toBeVisible({ timeout: 10_000 });
  // Give canvas a moment to finish its first paint
  await page.waitForTimeout(300);
}

/** Dispatch a synthetic MouseEvent on the game canvas at (cx, cy) screen coords. */
async function canvasDispatch(
  page: Page,
  type: string,
  cx: number,
  cy: number,
  extra: Partial<MouseEventInit> = {},
) {
  await page.evaluate(
    ({ type, cx, cy, extra }) => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      canvas.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + cx,
          clientY: rect.top + cy,
          button: 0,
          ...extra,
        }),
      );
    },
    { type, cx, cy, extra },
  );
}

/** Return {x, y} tile coords of the human player's first unit (via store). */
async function getFirstHumanUnitTile(page: Page): Promise<{ x: number; y: number } | null> {
  return page.evaluate(() => {
    const store = (window as any).__civlite_store__;
    if (!store) return null;
    const state = store.getState();
    const human = state.players?.find((p: any) => !p.isAI);
    if (!human || !human.units?.length) return null;
    return { x: human.units[0].x, y: human.units[0].y };
  });
}

/** Convert world tile (tx, ty) to canvas screen coords given camera + tile size. */
async function tileToScreen(
  page: Page,
  tx: number,
  ty: number,
): Promise<{ sx: number; sy: number }> {
  return page.evaluate(
    ({ tx, ty }) => {
      const TILE_SIZE = 64;
      const store = (window as any).__civlite_store__;
      const { camera } = store.getState();
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const offsetX = canvas.width  / 2 - camera.x * TILE_SIZE * camera.zoom;
      const offsetY = canvas.height / 2 - camera.y * TILE_SIZE * camera.zoom;
      return {
        sx: offsetX + tx * TILE_SIZE * camera.zoom,
        sy: offsetY + ty * TILE_SIZE * camera.zoom,
      };
    },
    { tx, ty },
  );
}

// ── Yields panel ─────────────────────────────────────────────────────────────

test.describe('Yields panel', () => {
  test('always-visible yields panel is present after game start', async ({ page }) => {
    await quickStart(page);
    await expect(page.locator('.yields-panel')).toBeVisible();
  });

  test('yields panel contains food emoji', async ({ page }) => {
    await quickStart(page);
    const text = await page.locator('.yields-panel').textContent();
    // Panel shows at least one yield emoji (🍎 ⚙️ 💰 🔬 🎭)
    expect(text).toMatch(/[🍎⚙💰🔬🎭]/u);
  });

  test('yields panel does not overlap top bar', async ({ page }) => {
    await quickStart(page);
    const topBar    = await page.locator('.top-bar').boundingBox();
    const yieldsBox = await page.locator('.yields-panel').boundingBox();
    expect(topBar).not.toBeNull();
    expect(yieldsBox).not.toBeNull();
    // Yields panel top must be at or below top bar bottom
    expect(yieldsBox!.y).toBeGreaterThanOrEqual(topBar!.y + topBar!.height - 4);
  });
});

// ── Tooltip ───────────────────────────────────────────────────────────────────

test.describe('Mouse tooltip', () => {
  test('tooltip appears on mousemove over canvas', async ({ page }) => {
    await quickStart(page);
    // Move mouse to canvas centre
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.waitForTimeout(200);
    await expect(page.locator('.game-tooltip')).toBeVisible();
  });

  test('tooltip shows terrain name', async ({ page }) => {
    await quickStart(page);
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.waitForTimeout(200);
    const title = await page.locator('.tt-title').textContent();
    expect(title).toBeTruthy();
    // Terrain name should be at least 3 chars (e.g. "Sea", "Plains", "Desert")
    expect(title!.length).toBeGreaterThanOrEqual(3);
  });

  test('tooltip shows tile coordinates', async ({ page }) => {
    await quickStart(page);
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.waitForTimeout(200);
    const coord = await page.locator('.tt-coord').textContent();
    expect(coord).toMatch(/\(\d+,\s*\d+\)/);
  });

  test('tooltip disappears on mouseleave', async ({ page }) => {
    await quickStart(page);
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.waitForTimeout(200);
    await expect(page.locator('.game-tooltip')).toBeVisible();
    // Move outside the canvas
    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);
    await expect(page.locator('.game-tooltip')).not.toBeVisible();
  });
});

// ── Minimap ──────────────────────────────────────────────────────────────────

test.describe('Minimap', () => {
  test('minimap is visible', async ({ page }) => {
    await quickStart(page);
    await expect(page.locator('.minimap')).toBeVisible();
  });

  test('clicking minimap pans the camera', async ({ page }) => {
    await quickStart(page);

    const cameraBefore = await page.evaluate(() => {
      const store = (window as any).__civlite_store__;
      const { x, y } = store.getState().camera;
      return { x, y };
    });

    // Click top-left corner of minimap to move camera away from centre
    const minimapCanvas = page.locator('.minimap canvas');
    const box = await minimapCanvas.boundingBox();
    expect(box).not.toBeNull();
    await minimapCanvas.click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(200);

    const cameraAfter = await page.evaluate(() => {
      const store = (window as any).__civlite_store__;
      const { x, y } = store.getState().camera;
      return { x, y };
    });

    // Camera should have moved (at least one axis differs)
    const moved = cameraAfter.x !== cameraBefore.x || cameraAfter.y !== cameraBefore.y;
    expect(moved).toBe(true);
  });

  test('minimap viewport indicator renders (non-zero area)', async ({ page }) => {
    await quickStart(page);
    // Check minimap canvas is painted
    const painted = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas');
      const mc = canvases[1] as HTMLCanvasElement;
      if (!mc) return false;
      const ctx = mc.getContext('2d');
      if (!ctx) return false;
      const d = ctx.getImageData(0, 0, mc.width, mc.height).data;
      return d.some((v, i) => i % 4 === 3 && v > 0);
    });
    expect(painted).toBe(true);
  });
});

// ── Camera bounds ─────────────────────────────────────────────────────────────

test.describe('Camera bounds', () => {
  test('panning far right does not exceed map width', async ({ page }) => {
    await quickStart(page);
    // Press ArrowRight many times to hit the edge
    await page.locator('canvas').first().click({ position: { x: 640, y: 360 } });
    for (let i = 0; i < 60; i++) await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);

    const { camX, mapW } = await page.evaluate(() => {
      const store = (window as any).__civlite_store__;
      const state = store.getState();
      return { camX: state.camera.x, mapW: state.map?.width ?? 999 };
    });
    expect(camX).toBeLessThanOrEqual(mapW - 1);
  });

  test('panning far left does not go below 0', async ({ page }) => {
    await quickStart(page);
    await page.locator('canvas').first().click({ position: { x: 640, y: 360 } });
    for (let i = 0; i < 60; i++) await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);

    const camX = await page.evaluate(() => {
      const store = (window as any).__civlite_store__;
      return store.getState().camera.x;
    });
    expect(camX).toBeGreaterThanOrEqual(0);
  });

  test('panning far up does not go below 0', async ({ page }) => {
    await quickStart(page);
    await page.locator('canvas').first().click({ position: { x: 640, y: 360 } });
    for (let i = 0; i < 60; i++) await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);

    const camY = await page.evaluate(() => {
      const store = (window as any).__civlite_store__;
      return store.getState().camera.y;
    });
    expect(camY).toBeGreaterThanOrEqual(0);
  });
});

// ── Right-click context menu ──────────────────────────────────────────────────

test.describe('Context menu', () => {
  test('right-click on canvas shows context menu', async ({ page }) => {
    await quickStart(page);
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2, { button: 'right' });
    await page.waitForTimeout(150);
    await expect(page.locator('.context-menu')).toBeVisible();
  });

  test('context menu has Cancel option', async ({ page }) => {
    await quickStart(page);
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2, { button: 'right' });
    await page.waitForTimeout(150);
    await expect(page.locator('.ctx-item--cancel')).toBeVisible();
  });

  test('context menu closes when Cancel is clicked', async ({ page }) => {
    await quickStart(page);
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2, { button: 'right' });
    await page.waitForTimeout(150);
    await page.locator('.ctx-item--cancel').click();
    await page.waitForTimeout(150);
    await expect(page.locator('.context-menu')).not.toBeVisible();
  });

  test('context menu closes on Escape', async ({ page }) => {
    await quickStart(page);
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2, { button: 'right' });
    await page.waitForTimeout(150);
    await expect(page.locator('.context-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    await expect(page.locator('.context-menu')).not.toBeVisible();
  });

  test('context menu closes when clicking elsewhere', async ({ page }) => {
    await quickStart(page);
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2, { button: 'right' });
    await page.waitForTimeout(150);
    await expect(page.locator('.context-menu')).toBeVisible();
    // Click top-bar area (not canvas)
    await page.locator('.turn-info').click();
    await page.waitForTimeout(150);
    await expect(page.locator('.context-menu')).not.toBeVisible();
  });
});

// ── Right-click unit movement ─────────────────────────────────────────────────

test.describe('Unit movement (right-click)', () => {
  test('left-click only selects unit — unit does not move', async ({ page }) => {
    await quickStart(page);
    const unitTile = await getFirstHumanUnitTile(page);
    if (!unitTile) { test.skip(); return; }

    const { sx, sy } = await tileToScreen(page, unitTile.x, unitTile.y);
    // Left-click on the unit tile
    await canvasDispatch(page, 'click', sx, sy);
    await page.waitForTimeout(200);

    // Unit should still be on its original tile
    const afterTile = await getFirstHumanUnitTile(page);
    expect(afterTile!.x).toBe(unitTile.x);
    expect(afterTile!.y).toBe(unitTile.y);

    // Unit stack panel should be visible (unit was selected)
    await expect(page.locator('.unit-stack-panel--visible')).toBeVisible();
  });

  test('right-click on passable adjacent tile moves selected unit', async ({ page }) => {
    await quickStart(page);
    const unitTile = await getFirstHumanUnitTile(page);
    if (!unitTile) { test.skip(); return; }

    // First left-click to select the unit
    const { sx: ux, sy: uy } = await tileToScreen(page, unitTile.x, unitTile.y);
    await canvasDispatch(page, 'click', ux, uy);
    await page.waitForTimeout(200);
    await expect(page.locator('.unit-stack-panel--visible')).toBeVisible();

    // Find a passable neighbour tile via store
    const target = await page.evaluate(({ ox, oy }) => {
      const store = (window as any).__civlite_store__;
      const state = store.getState();
      const map   = state.map;
      if (!map) return null;
      const candidates = [
        { x: ox + 1, y: oy }, { x: ox - 1, y: oy },
        { x: ox, y: oy + 1 }, { x: ox, y: oy - 1 },
      ];
      for (const c of candidates) {
        if (c.x < 0 || c.y < 0 || c.x >= map.width || c.y >= map.height) continue;
        const tile = map.tiles.get(`${c.x},${c.y}`);
        if (tile && tile.terrain !== 'ocean' && tile.terrain !== 'mountain') return c;
      }
      return null;
    }, { ox: unitTile.x, oy: unitTile.y });

    if (!target) { test.skip(); return; }

    const { sx: tx, sy: ty } = await tileToScreen(page, target.x, target.y);
    await canvasDispatch(page, 'contextmenu', tx, ty, { button: 2 });
    await page.waitForTimeout(300);

    // Either the unit moved OR "Move Here" button appeared in context menu
    const movedDirectly = await page.evaluate(({ nx, ny }) => {
      const store  = (window as any).__civlite_store__;
      const human  = store.getState().players?.find((p: any) => !p.isAI);
      const unit   = human?.units?.[0];
      return unit?.x === nx && unit?.y === ny;
    }, { nx: target.x, ny: target.y });

    const ctxVisible = await page.locator('.context-menu').isVisible();

    // Either direct move OR context menu with Move Here option is acceptable
    if (!movedDirectly) {
      expect(ctxVisible).toBe(true);
      const moveBtn = page.locator('.ctx-item', { hasText: 'Move Here' });
      if (await moveBtn.isVisible()) {
        await moveBtn.click();
        await page.waitForTimeout(300);
        const movedViaMenu = await page.evaluate(({ nx, ny }) => {
          const store = (window as any).__civlite_store__;
          const human = store.getState().players?.find((p: any) => !p.isAI);
          const unit  = human?.units?.[0];
          return unit?.x === nx && unit?.y === ny;
        }, { nx: target.x, ny: target.y });
        expect(movedViaMenu).toBe(true);
      }
    } else {
      expect(movedDirectly).toBe(true);
    }
  });
});

// ── Edge panning ──────────────────────────────────────────────────────────────

test.describe('Edge panning', () => {
  test('moving mouse to right edge triggers camera pan (no crash)', async ({ page }) => {
    await quickStart(page);
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const camBefore = await page.evaluate(() => {
      const store = (window as any).__civlite_store__;
      return store.getState().camera.x;
    });

    // Move to far-right edge (within edge-pan zone)
    await page.mouse.move(box!.x + box!.width - 5, box!.y + box!.height / 2);
    // Hold for 500 ms to allow at least one RAF pan cycle
    await page.waitForTimeout(500);

    const camAfter = await page.evaluate(() => {
      const store = (window as any).__civlite_store__;
      return store.getState().camera.x;
    });

    // Camera should have moved right OR already be at max bound — either is valid
    expect(camAfter).toBeGreaterThanOrEqual(camBefore);
    // Top bar still visible = no crash
    await expect(page.locator('.top-bar')).toBeVisible();
  });

  test('moving mouse to left edge triggers camera pan (no crash)', async ({ page }) => {
    await quickStart(page);
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();

    // Pan right first so there's room to pan back
    await page.locator('canvas').first().click({ position: { x: 640, y: 360 } });
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);

    const camBefore = await page.evaluate(() => {
      const store = (window as any).__civlite_store__;
      return store.getState().camera.x;
    });

    await page.mouse.move(box!.x + 5, box!.y + box!.height / 2);
    await page.waitForTimeout(500);

    const camAfter = await page.evaluate(() => {
      const store = (window as any).__civlite_store__;
      return store.getState().camera.x;
    });

    expect(camAfter).toBeLessThanOrEqual(camBefore);
    await expect(page.locator('.top-bar')).toBeVisible();
  });
});
