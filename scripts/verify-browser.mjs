import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const baseURL = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:3000';
const output = '.verification';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 320, height: 740 }, { width: 844, height: 390 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    // Isolated local accounts only; prevent calls to production Firebase or any external service.
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url());
      return url.origin === new URL(baseURL).origin ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(baseURL);
    await page.getByTestId('lobby-hub').waitFor();
    assert.equal(await page.locator('.world-postcard').count(), 4);
    await page.locator('.adventure-launch').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/lobby-${viewport.width}.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Page overflow');
    const overflow = await page.locator('[data-testid="lobby-hub"] main').evaluate((el) => el.scrollWidth > el.clientWidth);
    assert.equal(overflow, false, 'Lobby content overflow');
    for (const subject of ['chinese', 'english', 'math', 'science']) {
      await page.locator(`.world-postcard-${subject}`).click();
      await page.getByTestId('stage-select-screen').waitFor();
      await page.getByRole('button', { name: '返回廣場' }).click();
      await page.getByTestId('lobby-hub').waitFor();
    }
    await page.getByRole('button', { name: '出發冒險' }).click();
    await page.getByRole('dialog', { name: '墨劍小隊，出發！' }).waitFor();
    assert.equal(await page.getByTestId('ink-rpg-engine').count(), 0, 'Reading the guide must not start combat');
    assert.equal(await page.evaluate(() => document.body.dataset.state), 'menu');
    await page.screenshot({ path: `${output}/intro-${viewport.width}.png` });
    await page.getByRole('button', { name: '我準備好了，出發！' }).click();
    await page.getByTestId('ink-rpg-engine').waitFor();
    await page.getByRole('button', { name: '暫停遊戲' }).click();
    await page.getByRole('dialog', { name: '暫停選單' }).waitFor();
    await page.getByText('忘記怎麼玩？查看操作', { exact: true }).click();
    assert.equal(await page.getByRole('dialog').locator('.world-instructions').isVisible(), true);
    await page.screenshot({ path: `${output}/paused-${viewport.width}.png` });
    await page.getByRole('button', { name: '繼續冒險' }).click();
    await page.getByRole('dialog', { name: '暫停選單' }).waitFor({ state: 'detached' });
    await page.getByRole('button', { name: '暫停遊戲' }).click();
    const firstRun = await page.getByTestId('ink-rpg-engine').elementHandle();
    await page.getByRole('button', { name: '重新挑戰' }).click();
    await page.getByRole('dialog', { name: '暫停選單' }).waitFor({ state: 'detached' });
    assert.equal(await firstRun.evaluate((el) => el.isConnected), false, 'Restart must replace the old run');
    await page.getByRole('button', { name: '暫停遊戲' }).click();
    await page.getByRole('button', { name: '返回章節地圖' }).click();
    await page.getByTestId('stage-select-screen').waitFor();
    await page.getByRole('button', { name: '返回廣場' }).click();
    // Exercise each lazy engine from the real world-map launch flow.
    const engines = { english: 'galaxy-shooter-engine', math: 'math-td-engine', science: 'science-cooking-engine' };
    for (const [subject, testId] of Object.entries(engines)) {
      await page.locator(`.world-postcard-${subject}`).click();
      await page.getByTestId('stage-select-screen').waitFor();
      await page.locator('[data-start="true"]').click();
      await page.locator('.adventure-intro').waitFor();
      assert.equal(await page.getByTestId(testId).count(), 0);
      await page.getByRole('button', { name: '我準備好了，出發！' }).click();
      await page.getByTestId(testId).waitFor();
      await page.getByRole('button', { name: '暫停遊戲' }).click();
      await page.getByRole('dialog', { name: '暫停選單' }).waitFor();
      const oldRun = await page.getByTestId(testId).elementHandle();
      await page.getByRole('button', { name: '重新挑戰' }).click();
      await page.getByRole('dialog', { name: '暫停選單' }).waitFor({ state: 'detached' });
      assert.equal(await oldRun.evaluate((el) => el.isConnected), false);
      await page.getByRole('button', { name: '暫停遊戲' }).click();
      await page.getByRole('button', { name: '返回章節地圖' }).click();
      await page.getByTestId('stage-select-screen').waitFor();
      await page.getByRole('button', { name: '返回廣場' }).click();
    }
    // Practice can enter an otherwise locked boss; adventure must still reject it.
    await page.getByRole('button', { name: '練習', exact: true }).first().click();
    await page.locator('.world-postcard-science').click();
    await page.getByTestId('stage-select-screen').waitFor();
    await page.getByRole('button', { name: /第三章/ }).click();
    await page.locator('[data-start="true"]').click();
    await page.getByTestId('science-cooking-engine').waitFor();
    await page.getByRole('button', { name: '暫停遊戲' }).click();
    await page.getByRole('button', { name: '返回章節地圖' }).click();
    await page.getByRole('button', { name: '返回廣場' }).click();
    await page.getByRole('button', { name: '計時', exact: true }).click();
    await page.locator('.world-postcard-science').click();
    await page.getByRole('button', { name: /第三章/ }).click();
    assert.equal(await page.locator('[data-start="true"]').isDisabled(), true);
    await page.getByRole('button', { name: '返回廣場' }).click();
    // Changing grade in one local student must not leak to another student.
    await page.getByRole('button', { name: '6年級', exact: true }).click();
    await page.getByRole('button', { name: '開啟帳號與切換選單' }).click();
    await page.getByRole('button', { name: '星際小飛俠', exact: false }).click();
    await page.getByTestId('lobby-hub').waitFor();
    assert.match(await page.locator('.world-postcard-chinese').innerText(), /4年級/);
    await page.getByRole('button', { name: '開啟帳號與切換選單' }).click();
    await page.getByRole('button', { name: '智光小勇者', exact: false }).click();
    await page.getByTestId('lobby-hub').waitFor();
    assert.match(await page.locator('.world-postcard-chinese').innerText(), /6年級/);
    assert.deepEqual(errors, [], 'Uncaught browser errors');
    results.push({ viewport, worldMaps: 4, enginesLaunched: 4, preflightWithoutCombat: true, pauseHelp: true, practiceLockedBoss: true, adventureLocksPreserved: true, quickStart: true, pauseResumeRestartExit: true, localAccountIsolation: true, horizontalOverflow: false, uncaughtErrors: errors });
    await context.close();
  }
  await writeFile(`${output}/browser-results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
