import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {preview} from 'vite';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const external=process.env.RELEASE_TARGET_URL;
const server=external?null:await preview({preview:{host:'127.0.0.1',port:3008,strictPort:true},logLevel:'error'});
const origin=external||'http://127.0.0.1:3008';
const out='.verification/release-art';
await mkdir(out,{recursive:true});
const files=['hero-evolution','hero-motion','equipment-atlas','party-motion','chef-motion','world-avatars','allies-towers-enemies','zombie-motion','zombie-roster','boss-motion'].map(x=>x+'-v1.png');
const assetEvidence=[];
for(const file of files){
 const response=await fetch(origin+'/art/'+file,{signal:AbortSignal.timeout(30000)});
 assert.equal(response.status,200,file);
 const actual=Buffer.from(await response.arrayBuffer()),expected=await readFile('public/art/'+file);
 assert.ok(actual.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),file+' must be PNG');
 const hash=b=>createHash('sha256').update(b).digest('hex');
 assert.equal(hash(actual),hash(expected),file+' must match the reviewed new artwork');
 assetEvidence.push({file,bytes:actual.length,sha256:hash(actual)});
}
const browser=await chromium.launch({headless:true});
const reports=[];
try{
 for(const viewport of [{width:1894,height:823},{width:1440,height:1000},{width:390,height:844},{width:844,height:390}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await context.addInitScript(()=>{
   localStorage.setItem('release-save-sentinel','keep-this');
   window.__artDraws=[];
   window.__lobbyBackgroundEllipses=0;
   const ellipse=CanvasRenderingContext2D.prototype.ellipse;
   CanvasRenderingContext2D.prototype.ellipse=function(...args){
    if(this.canvas.getAttribute('data-testid')==='lobby-canvas')window.__lobbyBackgroundEllipses++;
    return ellipse.apply(this,args);
   };
   const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
    if(image instanceof HTMLImageElement && image.src.includes('/art/')&&!window.__artDraws.includes(image.src))window.__artDraws.push(image.src);
    return draw.call(this,image,...args);
   };
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.locator('[data-testid="lobby-hub"][data-art-version="motion-v1"]').waitFor();
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('zhiguang_108_save_v2_local_hero_01')));
  await page.getByRole('button',{name:'查看角色與武器',exact:true}).waitFor();
  await page.evaluate(async()=>{for(const url of ['/art/hero-motion-v1.png','/art/equipment-atlas-v1.png']){const image=new Image();image.src=url;await image.decode();}});
  assert.match(await page.locator('.hero-portrait-sprite').first().evaluate(e=>getComputedStyle(e).backgroundImage),/hero-motion-v1/);
  assert.equal(await page.evaluate(()=>window.__lobbyBackgroundEllipses),0,'No old guardian or pedestal may render behind the hero card');
  assert.equal(await page.locator('.release-character-card .hero-portrait').count(),1,'One hero showcase only');
  assert.equal(await page.getByTestId('guardian-mini').count(),1,'Guardian renders in its own interaction area');
  const heroBox=await page.locator('.release-character-card').boundingBox(),guardianBox=await page.getByTestId('guardian-mini').boundingBox();
  assert.ok(heroBox&&guardianBox);
  assert.ok(heroBox.x+heroBox.width<=guardianBox.x || guardianBox.x+guardianBox.width<=heroBox.x || heroBox.y+heroBox.height<=guardianBox.y || guardianBox.y+guardianBox.height<=heroBox.y,'Hero and guardian areas must not overlap');
  await page.screenshot({path:out+'/lobby-'+viewport.width+'.png',fullPage:true});
  for(let i=0;i<3;i++){await page.reload({waitUntil:'domcontentloaded'});await page.getByTestId('lobby-hub').waitFor();}
  await page.getByRole('button',{name:'查看角色與武器',exact:true}).click();
  await page.getByTestId('forge-screen').waitFor();
  await page.locator('.forge-hero-showcase .hero-portrait').waitFor();
  assert.match(await page.locator('.forge-main-weapon .atlas-art').evaluate(e=>getComputedStyle(e).backgroundImage),/equipment-atlas-v1/);
  await page.getByRole('button',{name:'三路線升階',exact:true}).click();
  assert.equal(await page.locator('[data-ascension-path]').count(),3);
  await page.screenshot({path:out+'/forge-'+viewport.width+'.png',fullPage:true});
  for(const [screen,text] of [['trial_tower','試煉之塔'],['bestiary','智光魔物圖鑑']]){
   await page.goto(origin+'/?screen='+screen,{waitUntil:'domcontentloaded'});
   await page.getByText(text,{exact:false}).first().waitFor({timeout:20000});
   assert.equal(await page.locator('[role="alert"]').count(),0,screen);
  }
  const worlds=[];
  for(const [world,atlas] of [['chinese','hero-motion'],['english','world-avatars'],['math','allies-towers-enemies'],['science','chef-motion']]){
   await page.goto(origin+'/?autostart=1&world='+world,{waitUntil:'domcontentloaded'});
   if(world==='math'){
    const tower=page.getByRole('button',{name:/海狸/}).first();
    if(await tower.count())await tower.click();
   }
   await page.waitForFunction(name=>window.__artDraws.some(url=>url.includes(name)),atlas,{timeout:30000});
   worlds.push({world,drawnAtlases:await page.evaluate(()=>window.__artDraws.map(x=>new URL(x).pathname))});
   await page.screenshot({path:out+'/'+world+'-'+viewport.width+'.png'});
  }
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('zhiguang_108_save_v2_local_hero_01')));
  assert.deepEqual(after.weapons,before.weapons,'existing weapon inventory preserved');
  assert.deepEqual(after.heroProgression,before.heroProgression,'existing class progression preserved');
  assert.equal(await page.evaluate(()=>localStorage.getItem('release-save-sentinel')),'keep-this');
  assert.deepEqual(errors,[]);
  reports.push({viewport,newLobbyArt:true,newForgeArt:true,noBackgroundGuardianOrPedestal:true,singleHeroShowcase:true,reloads:3,trialTowerPreserved:true,bestiaryPreserved:true,worlds,inventoryAndClassPreserved:true,errors});
  await context.close();
 }
 await writeFile(out+'/results.json',JSON.stringify({origin,assets:assetEvidence,reports},null,2));
 console.log(JSON.stringify({origin,assets:assetEvidence.map(x=>x.file),reports},null,2));
} finally {await browser.close();if(server)await new Promise(resolve=>server.httpServer.close(resolve));}
