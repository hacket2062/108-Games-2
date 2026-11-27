import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
await mkdir('.verification', { recursive: true });
// Test-only entry; never bundled into the game or deployed. Uses real components/providers.
await writeFile('.verification/learning-ui.html', `<!doctype html><html lang="zh-Hant"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Learning UI verification fixture</title></head><body><div id="fixture"></div><script type="module">
import React from 'react';
import {createRoot} from 'react-dom/client';
import {BattleEndModal} from '/src/components/BattleEndModal.tsx';
import {AuthProvider, useAuth} from '/src/auth/AuthContext.tsx';
import {GameStateProvider, useGameState} from '/src/core/GameStateContext.tsx';
import '/src/index.css';
const root=createRoot(document.getElementById('fixture'));
window.actions=[];
window.showResult=(result)=>root.render(React.createElement(BattleEndModal,{result,
 onRetry:()=>window.actions.push('retry'), onReturnLobby:()=>window.actions.push('map'),
 onReviewMistakes:()=>window.actions.push('review'), onTryPractice:()=>window.actions.push('practice'),wrongRecordCount:2}));
function Probe(){const {save,applyWorldResult,saveNotice}=useGameState();const {authLoading}=useAuth();
 return React.createElement('div',null,React.createElement('p',{id:'notice'},saveNotice),
 React.createElement('pre',{id:'save'},JSON.stringify(save)),
 React.createElement('button',{disabled:authLoading,onClick:()=>applyWorldResult(window.probeResult)},'Apply practice result'));}
window.showProbe=()=>root.render(React.createElement(AuthProvider,null,React.createElement(GameStateProvider,null,React.createElement(Probe))));
window.fixtureReady=true;
</script></body></html>`);
const server = await createServer({ server: { host: '127.0.0.1', port: 3002, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
await context.route('**/*', (route) => new URL(route.request().url()).origin === 'http://127.0.0.1:3002' ? route.continue() : route.abort());
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const result = { subject:'math',stageKey:'math_g4_c3_s10',victory:false,score:0,stars:0,correctCount:0,totalAttempts:0,maxCombo:0,clearSeconds:0,coinsEarned:0,xpEarned:0,crystalsEarned:0,knowledgeTags:[],progressSummary:'測試用結算' };
try {
  await page.goto('http://127.0.0.1:3002/.verification/learning-ui.html');
  await page.waitForFunction(() => window.fixtureReady);
  await page.evaluate((value) => window.showResult(value), result);
  await page.getByRole('dialog').waitFor();
  assert.equal(await page.getByText('尚未作答', { exact:true }).count(), 1);
  assert.equal(await page.getByText('100%', { exact:true }).count(), 0);
  await page.getByRole('button', {name:/打開我的錯題本/}).click();
  await page.getByRole('button', {name:'先用練習模式熟悉這一關'}).click();
  assert.deepEqual(await page.evaluate(() => window.actions), ['review','practice']);
  await page.evaluate((value) => window.showResult(value), {...result,playMode:'practice',correctCount:2,totalAttempts:3});
  await page.getByText('67%', {exact:true}).waitFor();
  assert.equal(await page.getByRole('button', {name:'先用練習模式熟悉這一關'}).count(), 0);
  await page.screenshot({path:'.verification/learning-result-390.png'});
  await page.evaluate(() => window.showProbe());
  await page.waitForFunction(() => document.getElementById('notice')?.textContent?.includes('本機模式'));
  const before=JSON.parse(await page.locator('#save').textContent());
  await page.evaluate((value) => { window.probeResult=value; }, {...result,playMode:'practice',victory:true,stars:3,score:10,coinsEarned:5});
  await page.getByRole('button', {name:'Apply practice result'}).click();
  await page.waitForFunction((coins) => JSON.parse(document.getElementById('save').textContent).coins===coins+5,before.coins);
  const after=JSON.parse(await page.locator('#save').textContent());
  assert.deepEqual(after.stageProgress,before.stageProgress,'Practice cannot write campaign stars/clears/chest flags');
  assert.deepEqual(after.weapons,before.weapons,'Practice boss cannot grant the campaign chest weapon');
  assert.equal(after.crystals,before.crystals,'Practice boss cannot grant campaign chest crystals');
  assert.deepEqual(after.dailyQuests,before.dailyQuests,'Practice cannot complete the adventure Boss quest');
  assert.match(after.trajectory[0].note,/【練習】/);
  assert.deepEqual(errors,[]);
  const report={noAttemptsNot100Percent:true,actualAccuracy:true,reviewAction:true,practiceAction:true,practiceCampaignAndChestPreserved:true,uncaughtErrors:errors};
  await writeFile('.verification/learning-ui-results.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} finally { await browser.close(); await server.close(); }
