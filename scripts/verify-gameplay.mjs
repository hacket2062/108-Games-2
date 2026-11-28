import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createServer} from 'vite';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
await mkdir('.verification',{recursive:true});
await writeFile('.verification/gameplay.html',`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module">
import React from 'react';import {createRoot} from 'react-dom/client';import App from '/src/App.tsx';import {ALL_QUESTIONS} from '/src/data/questionBank.ts';import {createInitialPlayerSave} from '/src/core/playerSave.ts';import '/src/index.css';
window.questions=ALL_QUESTIONS;
if(!localStorage.getItem('zhiguang_108_save_v2_local_hero_01')){const save=createInitialPlayerSave();save.muted=true;localStorage.setItem('zhiguang_108_save_v2_local_hero_01',JSON.stringify(save));}
localStorage.setItem('zhiguang_tutorial_v1:local:local_hero_01',JSON.stringify(Object.fromEntries(['chinese','english','math','science'].map(s=>[s,'completed']))));
window.frames=0;window.zombieXs=[];const clear=CanvasRenderingContext2D.prototype.fillRect;CanvasRenderingContext2D.prototype.fillRect=function(...args){window.frames++;return clear.apply(this,args);};const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(source,...args){if(source.src?.includes('zombie-motion')){window.zombieXs.push(this.getTransform().e);if(window.zombieXs.length>500)window.zombieXs.shift();}return draw.call(this,source,...args);};
window.labels={};const text=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(label,x,y,...args){if(/^[a-z]+$/i.test(label)){const p=new DOMPoint(x,y).matrixTransform(this.getTransform());window.labels[label]={x:p.x,y:p.y};}return text.call(this,label,x,y,...args);};
createRoot(document.getElementById('root')).render(React.createElement(App));
</script></body></html>`);
const server=await createServer({server:{host:'127.0.0.1',port:3006,strictPort:true},logLevel:'error'});await server.listen();
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});await context.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:3006'?r.continue():r.abort());const page=await context.newPage(),errors=[];page.on('pageerror',e=>{errors.push(e.stack||e.message);console.error(e.stack||e.message);});
  await page.goto('http://127.0.0.1:3006/.verification/gameplay.html?autostart=1&world=math');await page.getByTestId('math-td-engine').waitFor();await page.clock.install();
  const solve=async correct=>{await page.getByRole('button',{name:/算數採能機/}).click();const panel=page.getByTestId('math-question-panel');await panel.waitFor();const answer=await panel.evaluate((el,correct)=>{const q=window.questions.find(q=>q.subject==='math'&&el.textContent.includes(q.prompt));if(!q)throw Error('Question not found');return q.payload.options[correct?q.payload.correctIndex:(q.payload.correctIndex+1)%q.payload.options.length];},correct);await panel.getByRole('button',{name:answer,exact:true}).click();await panel.waitFor({state:'detached'});};
  await solve(true);await page.getByRole('button',{name:'開始第一波',exact:true}).click();for(let i=0;i<60&&/場上 0/.test(await page.getByTestId('math-wave-state').textContent());i++)await page.clock.runFor(500);assert.doesNotMatch(await page.getByTestId('math-wave-state').textContent(),/場上 0/);
  for(const correct of [true,false,true,false]){
   await solve(correct);
   if(!correct){await page.getByRole('button',{name:'繼續防守',exact:true}).click();}
   const before=await page.evaluate(()=>{window.zombieXs=[];return window.frames;});await page.clock.runFor(1500);
   for(let i=0;i<24&&await page.evaluate(()=>window.zombieXs.length<4);i++)await page.clock.runFor(500);
   const state=await page.evaluate(()=>({frames:window.frames,xs:window.zombieXs}));assert.ok(state.frames>before+5,'Canvas loop must survive an answer');assert.ok(new Set(state.xs.map(x=>x.toFixed(2))).size>1,'Zombies must resume moving or the next enemy must spawn after answer / dismissed explanation');
  }
  await page.getByRole('button',{name:'暫停遊戲',exact:true}).click();await page.getByRole('button',{name:'重新挑戰',exact:true}).click();assert.match(await page.getByTestId('math-wave-state').textContent(),/準備中.*場上 0/);await page.getByRole('button',{name:'暫停遊戲',exact:true}).click();await page.getByRole('button',{name:'返回章節地圖',exact:true}).click();await page.getByTestId('stage-select-screen').waitFor();assert.deepEqual(errors,[]);
  await page.goto('http://127.0.0.1:3006/.verification/gameplay.html?autostart=1&world=science');await page.getByTestId('science-cooking-engine').waitFor();await page.clock.install();
  const dish=await page.evaluate(()=>window.questions.find(q=>q.subject==='science'&&q.grade===4&&document.body.textContent.includes(q.payload.orderRequirement)&&document.body.textContent.includes(q.payload.dishName)));
  assert.ok(dish,'Find the actual displayed order');
  const wrong=dish.payload.ingredients.find(i=>!i.isCorrect);if(wrong){await page.getByRole('button',{name:new RegExp(wrong.name+' 點擊投入')}).click();await page.getByRole('button',{name:'看懂了，繼續遊戲',exact:true}).click();}
  for(const ing of dish.payload.ingredients.filter(i=>i.isCorrect).slice(0,dish.payload.neededCount))await page.getByRole('button',{name:new RegExp(ing.name+' 點擊投入')}).click();
  const lock=page.getByRole('button',{name:'鎖定火候翻炒！（或按空白鍵）',exact:true});assert.equal(await lock.isEnabled(),true);
  const bounds={freeze:[3,28],simmer:[39,63],boil:[73,95]}[dish.payload.targetTempZone];
  for(let i=0;i<120;i++){const n=parseFloat(await page.getByTestId('cooking-temperature-needle').evaluate(e=>e.style.left));if(n>=bounds[0]&&n<=bounds[1])break;await page.clock.runFor(50);}
  await page.getByRole('button',{name:'暫停遊戲',exact:true}).click();await page.getByRole('dialog',{name:'暫停選單'}).waitFor();
  await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true})));await page.clock.runFor(100);await page.getByRole('button',{name:'繼續冒險',exact:true}).click();assert.equal(await lock.isEnabled(),true,'Space while paused must not finish the temperature step');
  await lock.click();assert.equal(await lock.isDisabled(),true,'Temperature step must still complete after resume');
  const phNames={acid:/酸性/,neutral:/中性/,alkali:/鹼性/};await page.getByRole('button',{name:phNames[dish.payload.targetPh]}).click();
  const serve=page.getByRole('button',{name:'搖鈴出餐！',exact:true});await serve.evaluate(e=>{e.click();e.click();});await page.clock.runFor(1500);
  assert.ok(await page.getByRole('button',{name:/點擊投入檢驗/}).count()>0||await page.getByRole('button',{name:/再戰|再挑戰|再試/}).count()>0,'Serving must advance to another order or settlement');
  await page.goto('http://127.0.0.1:3006/.verification/gameplay.html?autostart=1&world=english');await page.getByTestId('galaxy-shooter-engine').waitFor();await page.clock.install();await page.clock.runFor(1500);
  const labels=await page.evaluate(()=>Object.values(window.labels).filter(p=>p.y>0));assert.ok(labels.length>=4,'Answer drone labels must render');assert.ok(labels.every(p=>p.x>=0&&p.x<=viewport.width),'All answer drones must be inside the canvas');
  if(viewport.width>=1000){
   await page.goto('http://127.0.0.1:3006/.verification/gameplay.html?autostart=1&world=chinese');await page.getByTestId('ink-rpg-engine').waitFor();await page.clock.install();await page.getByRole('button',{name:'自動尋路迎戰魔物',exact:true}).click();
   const slash=page.getByRole('button',{name:/墨痕斬・普攻/});for(let i=0;i<90&&!await slash.isVisible();i++)await page.clock.runFor(500);await slash.waitFor();
   for(const correct of [false,true]){
    for(let i=0;i<60&&await slash.isDisabled();i++)await page.clock.runFor(250);await slash.click();await page.getByRole('button',{name:'朗讀題目',exact:true}).waitFor();
    const answer=await page.evaluate(correct=>{const q=window.questions.find(q=>q.subject==='chinese'&&q.payload.mode==='slash'&&document.body.textContent.includes(q.prompt));return q.payload.options[correct?q.payload.correctIndex:(q.payload.correctIndex+1)%q.payload.options.length];},correct);await page.getByRole('button',{name:answer,exact:true}).click();if(!correct)await page.getByRole('button',{name:'看懂了，繼續遊戲',exact:true}).click();await page.clock.runFor(900);assert.equal(await page.getByRole('button',{name:'朗讀題目',exact:true}).count(),0);
   }
  }
  assert.deepEqual(errors,[]);
  results.push({viewport,mathCorrectAndWrongResume:true,restartAndExit:true,scienceWrongAndCorrectSteps:true,sciencePauseBlocksSpace:true,scienceServingAdvances:true,englishTargetsInsideViewport:true,chineseCorrectAndWrong:viewport.width>=1000,errors});await context.close();
 }
 console.log(JSON.stringify(results,null,2));await writeFile('.verification/gameplay-results.json',JSON.stringify(results,null,2));
}finally{await browser.close();await server.close();}
