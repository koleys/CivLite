/**
 * End-to-end play-through: starts a tiny game, exercises every major system,
 * captures screenshots and records all defects found.
 */
import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SHOT_DIR = path.join(process.cwd(), 'test-results', 'playthrough');
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

const errors: string[] = [];
const warnings: string[] = [];

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: false });
}

async function startTinyGame(page: Page, seed = 'PLAYTST1') {
  await page.goto('/');
  await page.getByRole('button', { name: 'New Game' }).click();
  await expect(page.locator('.panel-title')).toHaveText('New Game');
  // Pick Tiny map
  await page.locator('.option-select').first().selectOption('tiny');
  await page.locator('.seed-input').fill(seed);
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.locator('.turn-info')).toBeVisible({ timeout: 12_000 });
  // Wait for canvas to render
  await page.waitForTimeout(800);
}

async function getStoreState(page: Page) {
  return page.evaluate(() => {
    const store = (window as any).__civlite_store__?.getState?.();
    if (!store) return null;
    const { phase, turn, players, cityStates, selectedUnitId, camera, cheatMode } = store;
    const humanUnits = players?.find((p: any) => p.id === 0)?.units?.length ?? 0;
    const humanCities = players?.find((p: any) => p.id === 0)?.cities?.length ?? 0;
    return { phase, turn, players: players?.length, units: humanUnits, cities: humanCities, cityStates: cityStates?.length, selectedUnitId, camera, cheatMode };
  });
}

async function endTurn(page: Page, expectTurn: number, timeout = 15_000) {
  await page.locator('canvas').first().click({ position: { x: 640, y: 360 } });
  await page.keyboard.press('Space');
  await expect(page.locator('.turn-info')).toContainText(`Turn ${expectTurn}`, { timeout });
  await page.waitForTimeout(300);
}

// ── TESTS ─────────────────────────────────────────────────────────────────────

test.describe('Play-through: Tiny Map', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
      if (msg.type() === 'warning') warnings.push(msg.text());
    });
    page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));
  });

  test('01 – Main menu renders correctly', async ({ page }) => {
    await page.goto('/');
    await shot(page, '01-main-menu');

    await expect(page.locator('h1')).toHaveText('CivLite');
    await expect(page.getByRole('button', { name: 'Quick Start' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'New Game' })).toBeEnabled();
    await expect(page.getByRole('button', { name: '📖 Tutorial' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Settings' })).toBeEnabled();
    console.log('✅ Main menu OK');
  });

  test('02 – Settings panel: all tabs + OpenRouter key field', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Settings' }).click();
    await shot(page, '02-settings-general');

    // Settings panel has an "🤖 AI Opponent" section with an AI Mode selector
    const aiSection = page.locator('.settings-section-title', { hasText: /AI Opponent/i });
    const aiMode    = page.locator('.option-select', { has: page.locator('option[value="openrouter"]') });

    if (await aiSection.isVisible()) {
      console.log('✅ AI Opponent section found in settings');
      // Switch to OpenRouter mode to reveal the API key input
      if (await aiMode.isVisible()) {
        await aiMode.selectOption('openrouter');
        await page.waitForTimeout(200);
        await shot(page, '02b-settings-ai-openrouter');
        const keyInput = page.locator('input[type="password"]');
        const keyVisible = await keyInput.isVisible();
        console.log(keyVisible ? '✅ OpenRouter API key field visible' : '❌ DEFECT: OpenRouter key input not visible after selecting OpenRouter mode');
      }
    } else {
      console.log('❌ DEFECT: No AI Opponent section in settings');
    }

    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('03 – Tutorial mode launches and shows overlay', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '📖 Tutorial' }).click();
    await expect(page.locator('.tutorial-card')).toBeVisible({ timeout: 12_000 });
    await shot(page, '03-tutorial-step1');

    // Check step 1 content
    const title = await page.locator('.tutorial-title').textContent();
    console.log(`Tutorial step 1 title: "${title}"`);

    // Test Next button
    await page.getByRole('button', { name: 'Next →' }).click();
    await shot(page, '03b-tutorial-step2');
    const title2 = await page.locator('.tutorial-title').textContent();
    console.log(`Tutorial step 2 title: "${title2}"`);

    // Test Back button
    const backBtn = page.getByRole('button', { name: '← Back' });
    if (await backBtn.isVisible()) {
      await backBtn.click();
      const titleBack = await page.locator('.tutorial-title').textContent();
      console.log(`After Back: "${titleBack}" (should match step 1: "${title}")`);
      if (titleBack !== title) console.log('❌ DEFECT: Back button did not return to step 1');
      else console.log('✅ Back button works');
    } else {
      console.log('❌ DEFECT: Back button not visible on step 2');
    }

    // Skip tutorial
    await page.getByRole('button', { name: 'Skip Tutorial' }).click();
    await expect(page.locator('.tutorial-card')).not.toBeVisible({ timeout: 5_000 });
    console.log('✅ Tutorial skip works');
  });

  test('04 – New game starts, canvas renders', async ({ page }) => {
    await startTinyGame(page);
    await shot(page, '04-game-start');

    const state = await getStoreState(page);
    console.log('Game state:', JSON.stringify(state));

    expect(state?.phase).toBe('playing');
    expect(state?.turn).toBe(1);
    expect(state?.units).toBeGreaterThan(0);
    expect(state?.cityStates).toBeGreaterThan(0);

    // Check top bar elements
    await expect(page.locator('.turn-info')).toContainText('Turn 1');
    await expect(page.locator('.seed-display')).toBeVisible();

    // Check minimap
    await expect(page.locator('.minimap')).toBeVisible();

    console.log(`✅ Game started: ${state?.units} units, ${state?.cityStates} city states`);
  });

  test('05 – Canvas has painted pixels (no black screen)', async ({ page }) => {
    await startTinyGame(page);

    const result = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      const w = canvas.width, h = canvas.height;
      let nonBlack = 0, total = 0;
      for (let sx = 0.05; sx <= 0.95; sx += 0.1) {
        for (let sy = 0.05; sy <= 0.95; sy += 0.1) {
          const px = ctx.getImageData(Math.floor(w * sx), Math.floor(h * sy), 1, 1).data;
          total++;
          if (px[0] > 5 || px[1] > 5 || px[2] > 5) nonBlack++;
        }
      }
      return { total, nonBlack, pct: Math.round(nonBlack / total * 100) };
    });
    console.log(`Canvas: ${result.nonBlack}/${result.total} non-black pixels (${result.pct}%)`);
    if (result.pct < 80) {
      console.log(`❌ DEFECT: ${100 - result.pct}% of canvas is black — camera bounds or render issue`);
    } else {
      console.log('✅ Canvas rendering OK');
    }
    expect(result.pct).toBeGreaterThan(70);
  });

  test('06 – Unit selection shows panel', async ({ page }) => {
    await startTinyGame(page);

    // Click canvas center where spawn units should be
    const { width, height } = await page.evaluate(() => {
      const c = document.querySelector('canvas') as HTMLCanvasElement;
      return { width: c.width, height: c.height };
    });
    await page.locator('canvas').first().click({ position: { x: width / 2, y: height / 2 } });
    await page.waitForTimeout(300);
    await shot(page, '06-unit-selected');

    const panel = page.locator('.unit-stack-panel--visible');
    const panelVisible = await panel.isVisible();
    if (!panelVisible) {
      console.log('❌ DEFECT: Unit stack panel did not appear after clicking spawn area');
      // Try nearby tiles
      for (const [dx, dy] of [[0,64],[0,-64],[64,0],[-64,0],[64,64]]) {
        await page.locator('canvas').first().click({ position: { x: width/2+dx, y: height/2+dy } });
        await page.waitForTimeout(200);
        if (await panel.isVisible()) {
          console.log(`  Found unit at offset (${dx},${dy})`);
          break;
        }
      }
    } else {
      const unitName = await page.locator('.usp-name').first().textContent();
      console.log(`✅ Unit panel visible, first unit: "${unitName}"`);
    }
  });

  test('07 – End turn advances counter', async ({ page }) => {
    await startTinyGame(page);
    await endTurn(page, 2);
    await shot(page, '07-turn2');
    console.log('✅ End turn works: Turn 2');

    await endTurn(page, 3);
    await endTurn(page, 4);
    await endTurn(page, 5);
    await shot(page, '07b-turn5');
    console.log('✅ 5 turns completed');
  });

  test('08 – Resource bar shows values', async ({ page }) => {
    await startTinyGame(page);
    await shot(page, '08-resource-bar');

    // Check for resource displays
    const topBar = await page.locator('.top-bar').textContent();
    console.log(`Top bar content: "${topBar?.replace(/\s+/g, ' ').trim()}"`);

    const hasGold = topBar?.includes('💰') || topBar?.includes('Gold');
    const hasScience = topBar?.includes('🔬') || topBar?.includes('Science');
    if (!hasGold) console.log('❌ DEFECT: Gold not shown in top bar');
    else console.log('✅ Gold visible in top bar');
    if (!hasScience) console.log('❌ DEFECT: Science not shown in top bar');
    else console.log('✅ Science visible in top bar');
  });

  test('09 – Cheat panel opens with Ctrl+D', async ({ page }) => {
    await startTinyGame(page);
    await page.locator('canvas').first().click({ position: { x: 640, y: 360 } });
    await page.keyboard.press('Control+d');
    await page.waitForTimeout(300);
    await shot(page, '09-cheat-panel');

    const cheatPanel = page.locator('.cheat-panel');
    if (await cheatPanel.isVisible()) {
      console.log('✅ Cheat panel opens with Ctrl+D');

      // Test adding gold
      const addGoldBtn = page.getByRole('button', { name: /\+500.*Gold|Gold.*\+500/i }).first();
      if (await addGoldBtn.isVisible()) {
        await addGoldBtn.click();
        await page.waitForTimeout(200);
        console.log('✅ Add gold button works');
      } else {
        console.log('❌ DEFECT: +Gold button not found in cheat panel');
      }

      // Test reveal map
      const revealBtn = page.getByRole('button', { name: /Reveal/i });
      if (await revealBtn.isVisible()) {
        await revealBtn.click();
        await page.waitForTimeout(300);
        await shot(page, '09b-map-revealed');
        console.log('✅ Reveal map works');
      }

      // Close cheat panel
      await page.keyboard.press('Control+d');
      await page.waitForTimeout(200);
      if (!await cheatPanel.isVisible()) console.log('✅ Cheat panel closes with Ctrl+D again');
    } else {
      console.log('❌ DEFECT: Cheat panel did not open with Ctrl+D');
      // Try clicking the toolbar button
      const cheatBtn = page.locator('.cheat-toggle-btn');
      if (await cheatBtn.isVisible()) {
        await cheatBtn.click();
        await page.waitForTimeout(300);
        if (await cheatPanel.isVisible()) console.log('✅ Cheat panel opens via toolbar button');
        else console.log('❌ DEFECT: Cheat panel unresponsive');
      }
    }
  });

  test('10 – City states visible on map', async ({ page }) => {
    await startTinyGame(page);

    const state = await getStoreState(page);
    const csCount = state?.cityStates ?? 0;
    console.log(`City states in store: ${csCount}`);

    if (csCount === 0) {
      console.log('❌ DEFECT: No city states spawned');
    } else {
      console.log(`✅ ${csCount} city states spawned`);
    }

    // Reveal map to see all city states
    await page.locator('canvas').first().click({ position: { x: 640, y: 360 } });
    await page.keyboard.press('Control+d');
    await page.waitForTimeout(200);
    const revealBtn = page.getByRole('button', { name: /Reveal/i });
    if (await revealBtn.isVisible()) await revealBtn.click();
    await page.keyboard.press('Control+d');
    await page.waitForTimeout(300);
    await shot(page, '10-city-states-revealed');
  });

  test('11 – Minimap syncs with camera pan', async ({ page }) => {
    await startTinyGame(page);

    // Get minimap viewport box initial position
    const getVpPos = () => page.evaluate(() => {
      const vp = document.querySelector('.minimap-vp') as HTMLElement;
      if (!vp) return null;
      return { left: vp.style.left, top: vp.style.top };
    });

    const before = await getVpPos();
    await shot(page, '11-minimap-before');

    // Pan camera right
    await page.locator('canvas').first().click({ position: { x: 640, y: 360 } });
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);

    const after = await getVpPos();
    await shot(page, '11-minimap-after-pan');

    if (!before || !after) {
      console.log('❌ DEFECT: .minimap-vp element not found — minimap CSS overlay missing');
    } else if (before.left === after.left && before.top === after.top) {
      console.log('❌ DEFECT: Minimap viewport box did not move when camera panned');
    } else {
      console.log(`✅ Minimap vp moved: ${before.left} → ${after.left}`);
    }
  });

  test('12 – Map stays within bounds (no black edges)', async ({ page }) => {
    await startTinyGame(page);

    // Pan hard to top-left corner
    await page.locator('canvas').first().click({ position: { x: 640, y: 360 } });
    for (let i = 0; i < 40; i++) await page.keyboard.press('ArrowLeft');
    for (let i = 0; i < 40; i++) await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);
    await shot(page, '12-edge-topleft');

    // Check top-left corner pixels
    const tlBlack = await page.evaluate(() => {
      const c = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = c.getContext('2d')!;
      const px = ctx.getImageData(10, 10, 1, 1).data;
      return px[0] < 5 && px[1] < 5 && px[2] < 5;
    });
    if (tlBlack) console.log('❌ DEFECT: Top-left corner is black after panning to edge');
    else console.log('✅ Top-left corner rendered after pan to edge');

    // Pan hard to bottom-right corner
    for (let i = 0; i < 80; i++) await page.keyboard.press('ArrowRight');
    for (let i = 0; i < 80; i++) await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
    await shot(page, '12-edge-bottomright');

    const brBlack = await page.evaluate(() => {
      const c = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = c.getContext('2d')!;
      const px = ctx.getImageData(c.width - 10, c.height - 10, 1, 1).data;
      return px[0] < 5 && px[1] < 5 && px[2] < 5;
    });
    if (brBlack) console.log('❌ DEFECT: Bottom-right corner is black after panning to edge');
    else console.log('✅ Bottom-right corner rendered after pan to edge');
  });

  test('13 – Research panel opens', async ({ page }) => {
    await startTinyGame(page);
    await shot(page, '13-before-research');

    // Look for research button in top bar
    const researchBtn = page.locator('button', { hasText: /Research|Tech|🔬/i }).first();
    if (await researchBtn.isVisible()) {
      await researchBtn.click();
      await page.waitForTimeout(300);
      await shot(page, '13-research-panel');

      const panel = page.locator('.tech-tree, .research-panel, [class*="tech"]');
      if (await panel.first().isVisible()) {
        console.log('✅ Research panel opens');
      } else {
        console.log('❌ DEFECT: Research panel button clicked but no panel appeared');
      }
    } else {
      // Check for 'R' key shortcut
      await page.locator('canvas').first().click({ position: { x: 640, y: 360 } });
      await page.keyboard.press('r');
      await page.waitForTimeout(300);
      await shot(page, '13b-research-keypress');
      const panel = page.locator('.tech-tree, .research-panel, [class*="tech"]');
      if (await panel.first().isVisible()) {
        console.log('✅ Research panel opens with R key');
      } else {
        console.log('❌ DEFECT: No research panel accessible from main game view');
      }
    }
  });

  test('14 – Found a city (settler workflow)', async ({ page }) => {
    await startTinyGame(page, 'SETTLER1');
    // Use cheat to reveal map so we can find the settler
    await page.locator('canvas').first().click({ position: { x: 640, y: 360 } });
    await page.keyboard.press('Control+d');
    await page.waitForTimeout(200);
    const cheatOpen = await page.locator('.cheat-panel').isVisible();
    if (cheatOpen) {
      await page.getByRole('button', { name: /Reveal/i }).click();
      await page.keyboard.press('Control+d');
    }

    // Try to find and click the settler
    const state = await page.evaluate(() => {
      const store = (window as any).__civlite_store__?.getState?.();
      if (!store) return null;
      const settler = store.units?.find((u: any) => u.type === 'settler' && u.owner === 0);
      const cam = store.camera;
      const canvasEl = document.querySelector('canvas') as HTMLCanvasElement;
      if (!settler || !cam || !canvasEl) return null;
      const TILE = 64;
      const screenX = (settler.x - cam.x) * TILE * cam.zoom + canvasEl.width / 2;
      const screenY = (settler.y - cam.y) * TILE * cam.zoom + canvasEl.height / 2;
      return { screenX: Math.round(screenX), screenY: Math.round(screenY), x: settler.x, y: settler.y };
    });

    if (!state) {
      console.log('❌ DEFECT: Could not locate settler via store');
      return;
    }

    console.log(`Settler at tile (${state.x},${state.y}), screen (${state.screenX},${state.screenY})`);
    await page.locator('canvas').first().click({ position: { x: state.screenX, y: state.screenY } });
    await page.waitForTimeout(300);
    await shot(page, '14-settler-selected');

    const panel = page.locator('.unit-stack-panel--visible');
    if (await panel.isVisible()) {
      const unitName = await page.locator('.usp-name').first().textContent();
      console.log(`Selected unit: ${unitName}`);

      // Click the "Found City" button in unit panel
      const foundBtn = page.getByRole('button', { name: /Found City|🏙/i });
      if (await foundBtn.isVisible()) {
        await foundBtn.click();
        await page.waitForTimeout(300);
        await shot(page, '14b-city-found-overlay');

        const overlay = page.locator('.city-overlay');
        if (await overlay.isVisible()) {
          // Type city name
          await page.locator('.city-name-input').fill('TestCity');
          await page.getByRole('button', { name: /Found|Confirm|✓/i }).click();
          await page.waitForTimeout(500);
          await shot(page, '14c-city-founded');
          const newState = await getStoreState(page);
          if ((newState?.cities ?? 0) > 0) {
            console.log(`✅ City founded! Total cities: ${newState?.cities}`);
          } else {
            console.log('❌ DEFECT: City founding dialog completed but no city in state');
          }
        } else {
          // Maybe it auto-founded on the same tile
          const newState = await getStoreState(page);
          if ((newState?.cities ?? 0) > 0) {
            console.log('✅ City founded (no dialog needed for current tile)');
          } else {
            console.log('❌ DEFECT: Found City clicked but no overlay and no city created');
          }
        }
      } else {
        console.log('❌ DEFECT: Found City button not visible in settler panel');
      }
    } else {
      console.log('❌ DEFECT: No unit panel after clicking settler');
    }
  });

  test('15 – Production queue (after city founded)', async ({ page }) => {
    await startTinyGame(page, 'PRODTEST');
    // Use cheat to spawn a city
    await page.locator('canvas').first().click({ position: { x: 640, y: 360 } });
    await page.keyboard.press('Control+d');
    await page.waitForTimeout(200);
    if (await page.locator('.cheat-panel').isVisible()) {
      const addGold = page.getByRole('button', { name: /\+500.*Gold|💰.*\+/i });
      if (await addGold.isVisible()) await addGold.click();
      await page.keyboard.press('Control+d');
    }

    // Try to find a city and open it
    const cityPos = await page.evaluate(() => {
      const store = (window as any).__civlite_store__?.getState?.();
      if (!store) return null;
      const city = store.cities?.find((c: any) => c.owner === 0);
      if (!city) return null;
      const cam = store.camera;
      const canvasEl = document.querySelector('canvas') as HTMLCanvasElement;
      const TILE = 64;
      const screenX = (city.x - cam.x) * TILE * cam.zoom + canvasEl.width / 2;
      const screenY = (city.y - cam.y) * TILE * cam.zoom + canvasEl.height / 2;
      return { screenX: Math.round(screenX), screenY: Math.round(screenY) };
    });

    if (!cityPos) {
      console.log('ℹ No player city yet — skipping production queue test');
      return;
    }

    await page.locator('canvas').first().dblclick({ position: { x: cityPos.screenX, y: cityPos.screenY } });
    await page.waitForTimeout(400);
    await shot(page, '15-city-panel');

    const cityPanel = page.locator('.city-panel, .city-view, [class*="city"]').first();
    if (await cityPanel.isVisible()) {
      console.log('✅ City panel opens on double-click');
    } else {
      console.log('❌ DEFECT: City panel did not open on double-click of city tile');
    }
  });

  test('16 – AI thinking indicator appears during turn end', async ({ page }) => {
    await startTinyGame(page);
    await page.locator('canvas').first().click({ position: { x: 640, y: 360 } });

    // Press space and immediately check for AI indicator
    await page.keyboard.press('Space');
    // The AI indicator might be very brief — check within 2 seconds
    const appeared = await page.locator('.ai-thinking-indicator').isVisible().catch(() => false);
    if (appeared) {
      console.log('✅ AI thinking indicator appears');
    } else {
      console.log('ℹ AI thinking indicator not captured (may be too fast)');
    }

    await expect(page.locator('.turn-info')).toContainText('Turn 2', { timeout: 15_000 });
    console.log('✅ Turn advances after AI');
  });

  test('17 – Console errors check after 5 turns', async ({ page }) => {
    const gameErrors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') gameErrors.push(msg.text()); });
    page.on('pageerror', err => gameErrors.push(err.message));

    await startTinyGame(page);
    for (let i = 2; i <= 6; i++) {
      await page.locator('canvas').first().click({ position: { x: 640, y: 360 } });
      await page.keyboard.press('Space');
      await expect(page.locator('.turn-info')).toContainText(`Turn ${i}`, { timeout: 15_000 });
      await page.waitForTimeout(200);
    }

    await shot(page, '17-turn6');
    if (gameErrors.length > 0) {
      console.log(`❌ DEFECT: Console errors found during gameplay:\n  ${gameErrors.join('\n  ')}`);
    } else {
      console.log('✅ No console errors over 6 turns');
    }
    // Don't hard-fail on console errors — just log them
  });

  test('18 – Zoom in/out stays within map bounds', async ({ page }) => {
    await startTinyGame(page);
    await page.locator('canvas').first().click({ position: { x: 640, y: 360 } });

    // Zoom in a lot
    for (let i = 0; i < 8; i++) await page.keyboard.press('+');
    await page.waitForTimeout(200);
    await shot(page, '18-zoomed-in');

    // Zoom out a lot
    for (let i = 0; i < 15; i++) await page.keyboard.press('-');
    await page.waitForTimeout(200);
    await shot(page, '18-zoomed-out');

    // Check no black corners after extreme zoom
    const blackCorners = await page.evaluate(() => {
      const c = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = c.getContext('2d')!;
      const corners = [
        ctx.getImageData(5, 5, 1, 1).data,
        ctx.getImageData(c.width - 5, 5, 1, 1).data,
        ctx.getImageData(5, c.height - 5, 1, 1).data,
        ctx.getImageData(c.width - 5, c.height - 5, 1, 1).data,
      ];
      return corners.filter(px => px[0] < 5 && px[1] < 5 && px[2] < 5).length;
    });

    if (blackCorners > 0) {
      console.log(`❌ DEFECT: ${blackCorners} black corners after extreme zoom-out`);
    } else {
      console.log('✅ No black corners after zoom-out');
    }
  });

  test('19 – Unit SVG icons render (not triangles)', async ({ page }) => {
    await startTinyGame(page);

    // Check that units are rendering as circles (SVG/emoji in arc path)
    // We sample colors around the unit spawn area looking for blue (human unit badge color #2980b9)
    const hasUnitColors = await page.evaluate(() => {
      const c = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = c.getContext('2d')!;
      const cx = c.width / 2, cy = c.height / 2;
      // Sample in a 96x96 region around center
      let found = false;
      for (let dx = -48; dx <= 48; dx += 8) {
        for (let dy = -48; dy <= 48; dy += 8) {
          const px = ctx.getImageData(cx + dx, cy + dy, 1, 1).data;
          // Blue badge (#2980b9 = 41,128,185) or selected gold (#f1c40f = 241,196,15)
          const isBlue = px[2] > 140 && px[0] < 100 && px[1] > 80;
          const isGold = px[0] > 200 && px[1] > 160 && px[2] < 50;
          if (isBlue || isGold) { found = true; break; }
        }
        if (found) break;
      }
      return found;
    });

    if (!hasUnitColors) {
      console.log('❌ DEFECT: Unit badge colors (blue/gold circles) not detected — units may be rendering as wrong shape');
    } else {
      console.log('✅ Unit circular badges detected in canvas');
    }
    await shot(page, '19-unit-icons');
  });

  test('20 – Right-click context menu', async ({ page }) => {
    await startTinyGame(page);
    const { width, height } = await page.evaluate(() => {
      const c = document.querySelector('canvas') as HTMLCanvasElement;
      return { width: c.width, height: c.height };
    });
    await page.locator('canvas').first().click({ button: 'right', position: { x: width / 2 + 64, y: height / 2 } });
    await page.waitForTimeout(200);
    await shot(page, '20-context-menu');

    const menu = page.locator('.context-menu');
    if (await menu.isVisible()) {
      console.log('✅ Right-click context menu appears');
      const items = await page.locator('.ctx-item').allTextContents();
      console.log(`  Items: ${items.join(', ')}`);
      // Close by pressing Escape
      await page.keyboard.press('Escape');
    } else {
      console.log('❌ DEFECT: Right-click context menu did not appear');
    }
  });

});
