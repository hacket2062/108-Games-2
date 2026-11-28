import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {build,preview} from 'vite';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
await build({build:{ssr:'src/data/questionBank.ts',outDir:'.verification/mobile-bank'},logLevel:'error'});
const bank=await import(pathToFileURL(resolve('.verification/mobile-bank/questionBank.js')).href);
const external=process.env.RELEASE_TARGET_URL;
const server=external?null:await preview({preview:{host:'127.0.0.1',port:3018,strictPort:true},logLevel:'error'});
const origin=external||'http://127.0.0.1:3018',out='.verification/mobile-layout';await mkdir(out,{recursive:true});
const reports=[];
const within=async(locator,viewport,name)=>{const b=await locator.boundingBox();assert.ok(b&&b.x>=-1&&b.y>=-1&&b.x+b.width<=viewport.width+1&&b.y+b.height<=viewport.height+1,name+' outside visible phone viewport '+JSON.stringify(b));return b;};
const screenshot=async(page,label)=>{const bytes=await page.screenshot({path:out+'/'+label+'.jpg',type:'jpeg',quality:65});if(label.includes('390'))console.log('MOBILE_VISUAL_'+label.replaceAll('-','_')+':'+bytes.toString('base64'));};
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch({headless:true});
  try{for(const viewport of [{width:390,height:640},{width:375,height:568},{width:844,height:390}]){
   const context=await browser.newContext({viewport,deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
   await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
   await context.addInitScript(()=>{
    window.__mobileArt={};window.__mobileText={};
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(image,...a){
     if(image instanceof HTMLImageElement&&image.src.includes('/art/')&&a.length===8){
      const m=this.getTransform(),id=this.canvas.dataset.testid||'',ratio=this.canvas.width/this.canvas.clientWidth;
      const [sx,sy,sw,sh,x,y,w,h]=a,key=image.src+':'+sx+':'+sy+':'+Math.round(m.e)+':'+Math.round(m.f);
      if(Object.keys(window.__mobileArt).length<800||window.__mobileArt[key])window.__mobileArt[key]={id,url:new URL(image.src).pathname,sw,sh,w,h,scaleX:Math.hypot(m.a,m.b),scaleY:Math.hypot(m.c,m.d),left:(m.a*x+m.c*y+m.e)/ratio,top:(m.b*x+m.d*y+m.f)/ratio,width:w*Math.hypot(m.a,m.b)/ratio,height:h*Math.hypot(m.c,m.d)/ratio};
     }return draw.call(this,image,...a);
    };
    const fill=CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){const m=this.getTransform(),ratio=this.canvas.width/this.canvas.clientWidth;if(this.canvas.dataset.testid==='galaxy-shooter-canvas')window.__mobileText[String(text)]={x:(m.a*x+m.c*y+m.e)/ratio,y:(m.b*x+m.d*y+m.f)/ratio};return fill.call(this,text,x,y,...rest);};
   });
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin,{waitUntil:'domcontentloaded'});await page.getByTestId('lobby-hub').waitFor();
   await page.evaluate(()=>{const key='zhiguang_108_save_v2_local_hero_01',s=JSON.parse(localStorage.getItem(key));Object.assign(s,{grade:1,playMode:'practice',selectedGuardian:'griffin',playerCount:4});localStorage.setItem(key,JSON.stringify(s));});
   const worlds=[];
   for(const world of ['math','english','science','chinese']){
    await page.goto(origin+'/?autostart=1&world='+world,{waitUntil:'domcontentloaded'});
    const root=page.locator('.game-screen'),canvas=root.locator('.game-stage canvas');await canvas.waitFor();
    await page.waitForFunction(()=>Object.keys(window.__mobileArt).length>0);
    await within(root,viewport,'game root');
    assert.ok(await page.locator('.game-hud').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'HUD must fit without clipped scores or stage label');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal page overflow');
    if(world==='math'){
     const grid=await canvas.evaluate(e=>Object.fromEntries(['gridLeft','gridTop','cellWidth','cellHeight'].map(k=>[k,Number(e.dataset[k])])));
     for(const row of [0,2,4]){
      await canvas.click({position:{x:grid.gridLeft+grid.cellWidth*2.5,y:grid.gridTop+grid.cellHeight*(row+.5)}});
      const menu=page.getByTestId('math-td-radial-wheel');await menu.waitFor();
      await within(menu,viewport,'tower build menu');
      const mb=await menu.boundingBox(),cb=await canvas.boundingBox();assert.ok(mb.y>=cb.y-1&&mb.y+mb.height<=cb.y+cb.height+1,'Tower menu fits inside lawn');
      await menu.getByRole('button',{name:/海狸/}).click();
     }
     await page.waitForTimeout(500);
     const towers=await page.evaluate(()=>Object.values(window.__mobileArt).filter(x=>x.id==='math-td-canvas'&&x.url.includes('allies-towers-enemies')));
     assert.ok(towers.length>=2,'Actual towers were rendered');
     for(const t of towers){assert.ok(t.width<=grid.cellWidth*.9+1&&t.height<=grid.cellHeight*.9+1,'Tower must fit one tile '+JSON.stringify(t));assert.ok(t.left>=grid.gridLeft-1&&t.top>=grid.gridTop-1,'Tower may not spill over lawn header/castle');}
     await screenshot(page,engine+'-math-'+viewport.width);
     await page.getByRole('button',{name:/採能超頻/}).click();
     const solver=page.getByTestId('math-td-inline-solver');await solver.waitFor();await within(solver,viewport,'Math prompt and options');
     await screenshot(page,engine+'-math-answer-'+viewport.width);
    }else if(world==='science'){
     const options=page.getByTestId('science-ingredient-option');await options.first().waitFor();
     for(let i=0;i<await options.count();i++)await within(options.nth(i),viewport,'Science choice '+i);
     await screenshot(page,engine+'-science-'+viewport.width);
     const prompt=await page.locator('.science-order-requirement').textContent(),q=bank.SCIENCE_QUESTIONS.find(q=>q.grade===1&&q.payload.orderRequirement===prompt);assert.ok(q);
     const wrong=q.payload.ingredients.find(i=>!i.isCorrect).name;
     await options.filter({has:page.getByText(wrong,{exact:true})}).click();
     await page.getByTestId('answer-explanation').waitFor();await page.waitForFunction(()=>document.body.dataset.state==='reading');
     await within(page.getByRole('button',{name:'關閉解析提示'}),viewport,'Feedback continue button');
     const fb=await page.getByTestId('answer-explanation').boundingBox(),main=await page.locator('.game-layout').boundingBox();assert.ok(fb.y>=main.y+main.height-1,'Feedback occupies its own space instead of covering options');
     assert.ok(await page.locator('.game-layout').evaluate(e=>e.inert),'Answer controls are inert while reading');
     await page.waitForTimeout(200);const frozen=await canvas.evaluate(e=>e.toDataURL());await page.waitForTimeout(600);assert.equal(await canvas.evaluate(e=>e.toDataURL()),frozen,'Science animation/timer combat freezes while feedback is read');
     await screenshot(page,engine+'-science-feedback-'+viewport.width);
     await page.getByRole('button',{name:'關閉解析提示'}).click();await page.waitForFunction(()=>document.body.dataset.state==='playing');
     const correct=q.payload.ingredients.find(i=>i.isCorrect).name;await options.filter({has:page.getByText(correct,{exact:true})}).click();
     await within(page.getByRole('button',{name:'確認答案！',exact:true}),viewport,'Life observation confirmation');
    }else if(world==='english'){
     await within(page.getByTestId('manual-fire-button'),viewport,'Touch fire control');
     await screenshot(page,engine+'-english-'+viewport.width);
     const prompt=await page.locator('.game-controls').textContent(),q=bank.ENGLISH_QUESTIONS.find(q=>q.grade===1&&q.type==='listen'&&prompt.includes(q.prompt));assert.ok(q,'Real early English prompt is present');
     const wrong=q.payload.choices.find(x=>x!==q.answer);await page.waitForFunction(t=>Boolean(window.__mobileText[t]),wrong);
     for(let attempt=0;attempt<6&&!await page.getByTestId('answer-explanation').count();attempt++){
      const pos=await page.evaluate(t=>window.__mobileText[t],wrong);await canvas.click({position:pos});await page.waitForTimeout(400);
     }
     await page.getByTestId('answer-explanation').waitFor();await page.waitForFunction(()=>document.body.dataset.state==='reading');
     await within(page.getByRole('button',{name:'關閉解析提示'}),viewport,'English feedback continue');
     await page.waitForTimeout(200);const frozen=await canvas.evaluate(e=>e.toDataURL());await page.waitForTimeout(600);assert.equal(await canvas.evaluate(e=>e.toDataURL()),frozen,'English bullets/ship/enemies freeze during reading');
     await screenshot(page,engine+'-english-feedback-'+viewport.width);
     await page.getByRole('button',{name:'關閉解析提示'}).click();
    }else await screenshot(page,engine+'-chinese-'+viewport.width);
    const arts=await page.evaluate(()=>Object.values(window.__mobileArt));
    assert.ok(arts.length>0);
    for(const art of arts){assert.ok(Math.abs(art.w/art.h-art.sw/art.sh)<.002,'Source aspect preserved '+JSON.stringify(art));assert.ok(Math.abs(art.scaleX-art.scaleY)<.002,'Uniform actor transform '+JSON.stringify(art));}
    worlds.push({world,artSamples:arts.length,aspectPreserved:true});
   }
   assert.deepEqual(errors,[]);reports.push({engine,viewport,worlds,errors});await context.close();
  }}finally{await browser.close();}
 }
 await writeFile(out+'/results.json',JSON.stringify({origin,reports},null,2));console.log(JSON.stringify({origin,reports},null,2));
}finally{if(server)await new Promise(r=>server.httpServer.close(r));}
