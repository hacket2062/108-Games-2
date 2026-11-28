import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {mkdir,writeFile} from 'node:fs/promises';import {createServer} from 'vite';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');await mkdir('.verification',{recursive:true});
await writeFile('.verification/motion.html',`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#0b1728;color:#e9edf7"><div id="root" style="width:100vw;height:100vh"></div><script type="module">
import React from 'react';import {createRoot} from 'react-dom/client';import {InkRpgEngine} from '/src/engines/InkRpgEngine.tsx';
import {drawMotionFrame} from '/src/canvas/spriteArt.ts';import {createInitialPlayerSave} from '/src/core/playerSave.ts';import {computeSaveCombatStats} from '/src/core/combatMath.ts';
import '/src/index.css';
window.motionCalls=[];const original=CanvasRenderingContext2D.prototype.drawImage;
CanvasRenderingContext2D.prototype.drawImage=function(source,...args){if(source.src?.includes('-motion-v1.png')){window.motionCalls.push({url:source.src,sx:args[0],sy:args[1]});if(window.motionCalls.length>1000)window.motionCalls.shift();}return original.call(this,source,...args);};
const root=createRoot(document.getElementById('root')),save=createInitialPlayerSave();save.muted=true;
const props={grade:4,semester:'upper',playMode:'practice',guardianId:'qilin',playerStats:computeSaveCombatStats(save),appearance:{weapon:save.weapons[0],equipment:save.equipment},onAnswerResult:()=>{},onFinish:()=>{},onExit:()=>{},onRestart:()=>{}};
window.showEngine=()=>root.render(React.createElement(InkRpgEngine,props));
window.showGallery=async()=>{
 document.documentElement.style.overflow='auto';document.documentElement.style.height='auto';document.body.style.overflow='visible';document.body.style.height='auto';
 root.unmount();const target=document.getElementById('root');target.style.height='auto';target.innerHTML='<h1 style="padding:16px;font-size:24px">逐格肢體動作與六大首領</h1>';
 const sheets=[['hero-motion-v1.png',6,4,'角色：待機／兩步態／蓄力／斬擊／受擊'],['boss-motion-v1.png',4,6,'三章一般王與極品王：待機／步態／攻擊'],['zombie-motion-v1.png',4,5,'五種殭屍：步行與攻擊'],['party-motion-v1.png',6,2,'隊友：步行／施法／受擊'],['chef-motion-v1.png',6,4,'三種主廚×四進階：備料／翻鍋']];
 window.galleryFrames=[];
 for(const [name,cols,rows,title] of sheets){const h=document.createElement('h2');h.textContent=title;h.style.cssText='padding:14px;font-size:20px;color:#f8dc9b';target.append(h);const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat('+cols+',minmax(0,1fr));gap:8px;padding:12px';target.append(grid);
  for(let row=0;row<rows;row++)for(let frame=0;frame<cols;frame++){const canvas=document.createElement('canvas');canvas.width=200;canvas.height=220;canvas.style.cssText='width:100%;background:#1a2d45;border-radius:12px';canvas.dataset.sheet=name;canvas.dataset.row=row;canvas.dataset.frame=frame;grid.append(canvas);const ctx=canvas.getContext('2d');drawMotionFrame(ctx,'/art/'+name,row,frame,cols,rows,0,0,200,220);window.galleryFrames.push({canvas,ctx,name,row,frame,cols,rows});}
 }
 await new Promise(resolve=>setTimeout(resolve,500));for(const p of window.galleryFrames){p.ctx.clearRect(0,0,200,220);if(!drawMotionFrame(p.ctx,'/art/'+p.name,p.row,p.frame,p.cols,p.rows,0,0,200,220))throw Error('Unloaded '+p.name);}window.galleryReady=true;
};window.ready=true;
</script></body></html>`);
const server=await createServer({server:{host:'127.0.0.1',port:3005,strictPort:true},logLevel:'error'});await server.listen();const browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});await context.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:3005'?r.continue():r.abort());const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:3005/.verification/motion.html');await page.waitForFunction(()=>window.ready);await page.evaluate(()=>window.showEngine());await page.getByTestId('ink-rpg-engine').waitFor();
 await page.waitForFunction(()=>window.motionCalls.some(c=>c.url.includes('hero-motion')));
 await page.evaluate(()=>window.motionCalls=[]);await page.keyboard.down('d');
 await page.waitForFunction(()=>new Set(window.motionCalls.filter(c=>c.url.includes('hero-motion')).map(c=>c.sx)).size>=3);
 await page.keyboard.up('d');await page.evaluate(()=>window.motionCalls=[]);
 await page.waitForFunction(()=>window.motionCalls.filter(c=>c.url.includes('hero-motion')).length>=15);
 const stopped=await page.evaluate(()=>window.motionCalls.filter(c=>c.url.includes('hero-motion')).slice(-8).map(c=>c.sx));assert.equal(new Set(stopped).size,1,'Stopping movement must return to idle');
 await page.getByRole('button',{name:'暫停遊戲',exact:true}).click();await page.getByRole('dialog',{name:'暫停選單'}).waitFor();await page.evaluate(()=>window.motionCalls=[]);await page.waitForFunction(()=>window.motionCalls.filter(c=>c.url.includes('hero-motion')).length>=10);
 assert.equal(await page.evaluate(()=>new Set(window.motionCalls.filter(c=>c.url.includes('hero-motion')).map(c=>c.sx+':'+c.sy)).size),1);
 await page.evaluate(()=>window.showGallery());await page.waitForFunction(()=>window.galleryReady);
 assert.equal(await page.locator('canvas').count(),104);
 // Distinct source poses must produce distinct pixels, not only a translated copy.
 const unique=await page.evaluate(()=>{const group={};for(const p of window.galleryFrames){const key=p.name+':'+p.row;(group[key]??=[]).push(p.canvas.toDataURL());}return Object.fromEntries(Object.entries(group).map(([k,v])=>[k,new Set(v).size]));});
 assert.ok(Object.entries(unique).every(([k,n])=>n===(k.startsWith('hero')||k.startsWith('party')||k.startsWith('chef')?6:4)));
 for(const sheet of ['hero','boss','zombie','party','chef'])await page.locator('canvas[data-sheet="'+sheet+'-motion-v1.png"]').first().locator('..').screenshot({path:'.verification/'+sheet+'-poses.png'});
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({actualEngineWalkChangesThreeFrames:true,actualEngineStopsToIdle:true,pauseFreezesLimbPose:true,distinctRenderedPoseCells:104,allRowsHaveDistinctPixels:true,uncaughtErrors:errors}));
}finally{await browser.close();await server.close();}
