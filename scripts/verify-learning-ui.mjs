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
import {MistakeNotebookModal} from '/src/components/MistakeNotebookModal.tsx';
import {createInitialPlayerSave} from '/src/core/playerSave.ts';
import {resolveWrongRecordOnce} from '/src/core/saveIntegrity.ts';
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
function ReviewFlow(){
 const [save,setSave]=React.useState(()=>{const value=createInitialPlayerSave();const base={subject:'math',grade:4,correctAnswer:'5',explanation:'2 加 3 等於 5。',knowledgeTag:'加法',wrongCount:1,lastWrongAt:100,revengeOptions:['4','5','6']};
 value.wrongRecords=[{...base,questionId:'old',prompt:'以前的數學題'}, {...base,questionId:'recent',prompt:'這一局：2 加 3 等於多少？'}, {...base,subject:'english',questionId:'english-old',prompt:'以前的英文題'}];return value;});
 const [open,setOpen]=React.useState(false);
 const focus=React.useMemo(()=>({subject:'math',questionIds:['recent']}),[]);
 const recent=save.wrongRecords.filter(r=>r.questionId==='recent');
 return React.createElement(React.Fragment,null,React.createElement('output',{id:'review-save',hidden:true},JSON.stringify(save)),
 !open&&React.createElement(BattleEndModal,{result:{subject:'math',victory:false,score:0,stars:0,correctCount:0,totalAttempts:1,maxCombo:0,clearSeconds:10,coinsEarned:0,xpEarned:0,crystalsEarned:0,knowledgeTags:[],progressSummary:'受控整合測試'},
 runMistakes:recent,wrongRecordCount:save.wrongRecords.length,onRetry:()=>{},onReturnLobby:()=>{},onReviewMistakes:()=>setOpen(true)}),
 React.createElement(MistakeNotebookModal,{open,save,reviewFocus:focus,onClose:()=>setOpen(false),onClearMistake:id=>setSave(prev=>resolveWrongRecordOnce(prev,id))}));
}
window.showReviewFixture=()=>root.render(React.createElement(ReviewFlow));
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
  await page.evaluate(()=>window.showReviewFixture());
  await page.getByRole('region',{name:'本局錯題速覽'}).waitFor();
  await page.getByText('這一局：2 加 3 等於多少？',{exact:true}).click();
  assert.equal(await page.getByText('參考答案：5',{exact:true}).isVisible(),true);
  await page.getByRole('button',{name:'複習本局錯題（1 題）'}).click();
  await page.getByRole('dialog',{name:'智光錯題本與複習挑戰'}).waitFor();
  assert.equal(await page.locator('[data-review-question]').count(),1);
  assert.equal(await page.getByRole('article',{name:'這一局：2 加 3 等於多少？'}).count(),1);
  await page.screenshot({path:'.verification/recent-review-390.png'});
  const reviewBefore=JSON.parse(await page.locator('#review-save').textContent());
  await page.getByRole('button',{name:'自己試一次',exact:true}).click();
  await page.getByRole('button',{name:'5',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'5',exact:true}).isDisabled(),true);
  const reviewAfter=JSON.parse(await page.locator('#review-save').textContent());
  assert.equal(reviewAfter.coins,reviewBefore.coins+25);
  assert.deepEqual(reviewAfter.wrongRecords.map(r=>r.questionId),['old','english-old']);
  await page.getByRole('button',{name:'返回錯題清單'}).click();
  await page.getByText('本局沒有待複習的錯題了！',{exact:true}).waitFor();
  await page.getByRole('button',{name:'查看其他待複習題'}).click();
  assert.equal(await page.getByRole('article',{name:'以前的數學題'}).count(),1);
  await page.getByRole('button',{name:'全部科目',exact:true}).click();
  assert.equal(await page.locator('[data-review-question]').count(),2);
  assert.deepEqual(errors,[]);
  const report={noAttemptsNot100Percent:true,actualAccuracy:true,reviewAction:true,practiceAction:true,practiceCampaignAndChestPreserved:true,recentRunInlineExplanation:true,recentRunNotebookFilter:true,historicalMistakesPreserved:true,reviewRewardsOnce:true,uncaughtErrors:errors};
  await writeFile('.verification/learning-ui-results.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} finally { await browser.close(); await server.close(); }
