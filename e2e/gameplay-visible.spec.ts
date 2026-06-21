// Playwright E2E test — runs in HEADED mode so you can watch
// Usage: npx playwright test e2e/gameplay-visible.spec.ts --headed

import { test, expect } from '@playwright/test';

test.describe('CivLite Gameplay — Visual Test', () => {

  test('Launch game, start new game, explore map, open panels', async ({ page }) => {
    // ── Step 1: Navigate to the game ───────────────────────────────
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Take screenshot of main menu
    await page.screenshot({ path: 'docs/screenshots/01_main_menu.png' });
    console.log('✓ Screenshot: Main Menu');

    // ── Step 2: Click "New Game" ───────────────────────────────────
    const newGameBtn = page.locator('button').filter({ hasText: /New Game/i });
    await expect(newGameBtn).toBeVisible({ timeout: 10000 });
    await newGameBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'docs/screenshots/02_game_setup.png' });
    console.log('✓ Screenshot: Game Setup');

    // ── Step 3: Configure and start game ───────────────────────────
    // Select "Tiny" map for fast test
    const mapSizeDropdown = page.locator('select').first();
    if (await mapSizeDropdown.isVisible()) {
      await mapSizeDropdown.selectOption('tiny');
    }

    const startBtn = page.locator('button').filter({ hasText: /Start Game/i });
    await expect(startBtn).toBeVisible({ timeout: 5000 });
    await startBtn.click();

    // Wait for game to load (loading screen may appear)
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'docs/screenshots/03_game_loaded.png' });
    console.log('✓ Screenshot: Game Loaded');

    // ── Step 4: Verify the game canvas is visible ──────────────────
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
    console.log('✓ Canvas is visible');

    // Verify top bar shows turn info
    const topBar = page.locator('.top-bar');
    if (await topBar.isVisible()) {
      const turnText = await topBar.textContent();
      console.log(`✓ Top bar text: ${turnText?.substring(0, 80)}`);
    }

    // ── Step 5: Click on the map to interact ───────────────────────
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      // Click center of the map
      await page.mouse.click(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'docs/screenshots/04_tile_clicked.png' });
      console.log('✓ Screenshot: Tile clicked');
    }

    // ── Step 6: Try to select a unit by clicking around ────────────
    // Click various spots on the canvas to try to find a unit
    if (canvasBox) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const cx = canvasBox.x + canvasBox.width * (0.2 + attempt * 0.15);
        const cy = canvasBox.y + canvasBox.height * 0.5;
        await page.mouse.click(cx, cy);
        await page.waitForTimeout(300);

        // Check if a unit panel appeared
        const unitPanel = page.locator('[class*="unit-panel"], [class*="UnitPanel"]');
        if (await unitPanel.isVisible().catch(() => false)) {
          await page.screenshot({ path: 'docs/screenshots/05_unit_selected.png' });
          console.log(`✓ Screenshot: Unit selected (attempt ${attempt + 1})`);
          break;
        }
      }
    }

    await page.screenshot({ path: 'docs/screenshots/06_after_clicks.png' });
    console.log('✓ Screenshot: After exploration clicks');

    // ── Step 7: Open Tech Tree ─────────────────────────────────────
    // Look for a tech tree button or hotkey
    await page.keyboard.press('t');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'docs/screenshots/07_tech_tree.png' });
    console.log('✓ Screenshot: Tech tree (after T key)');

    // Close tech tree if open
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // ── Step 8: Open Government Panel ──────────────────────────────
    await page.keyboard.press('g');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'docs/screenshots/08_government.png' });
    console.log('✓ Screenshot: Government panel (after G key)');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // ── Step 9: Open Religion Panel ────────────────────────────────
    await page.keyboard.press('p');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'docs/screenshots/09_religion.png' });
    console.log('✓ Screenshot: Religion panel (after P key)');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // ── Step 10: End Turn ──────────────────────────────────────────
    const endTurnBtn = page.locator('button').filter({ hasText: /End Turn/i });
    if (await endTurnBtn.isVisible().catch(() => false)) {
      await endTurnBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'docs/screenshots/10_after_end_turn.png' });
      console.log('✓ Screenshot: After End Turn');
    } else {
      // Try finding any prominent button at bottom
      const buttons = page.locator('button');
      const count = await buttons.count();
      console.log(`Found ${count} buttons on page`);
      for (let i = 0; i < count; i++) {
        const text = await buttons.nth(i).textContent();
        if (text?.toLowerCase().includes('end')) {
          await buttons.nth(i).click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'docs/screenshots/10_after_end_turn.png' });
          console.log(`✓ Screenshot: After End Turn (button: ${text})`);
          break;
        }
      }
    }

    // ── Step 11: End a few more turns ──────────────────────────────
    for (let turn = 0; turn < 3; turn++) {
      // Try clicking end turn button
      const btn = page.locator('button').filter({ hasText: /End Turn/i });
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(1500);
      }
    }
    await page.screenshot({ path: 'docs/screenshots/11_after_multiple_turns.png' });
    console.log('✓ Screenshot: After multiple turns');

    // ── Step 12: Try to found a city with settler ──────────────────
    // Click around the starting area to find and use the settler
    if (canvasBox) {
      await page.mouse.click(canvasBox.x + canvasBox.width * 0.25, canvasBox.y + canvasBox.height * 0.5);
      await page.waitForTimeout(500);

      // Look for a "Found City" button
      const foundCityBtn = page.locator('button').filter({ hasText: /Found City/i });
      if (await foundCityBtn.isVisible().catch(() => false)) {
        await foundCityBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'docs/screenshots/12_city_founded.png' });
        console.log('✓ Screenshot: City founded');
      }
    }

    // ── Final screenshot ───────────────────────────────────────────
    await page.screenshot({ path: 'docs/screenshots/13_final_state.png' });
    console.log('✓ Screenshot: Final game state');
    console.log('\n🎮 Visual test complete! Check docs/screenshots/ for all screenshots.');
  });
});
