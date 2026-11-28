import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const origin='https://108-games-2.hacket2062.workers.dev';
const out='.verification/production-startup';
await mkdir(out,{recursive:true});
const html=await fetch(origin,{signal:AbortSignal.timeout(30000)});
assert.equal(html.status,200);
assert.match(await html.text(),/id="startup-status"/,'Production must contain the startup hotfix');
const startup=await fetch(origin+'/startup.js',{signal:AbortSignal.timeout(30000)});
assert.equal(startup.status,200);
assert.match(await startup.text(),/showRecovery/,'Startup JS must be served as JavaScript');
const browser=await chromium.launch({headless:true});
const reports=[];
try {
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});
  // The lobby runs in local mode. Do not contact Firebase or other third parties.
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  await context.addInitScript(()=>localStorage.setItem('startup-save-sentinel','keep-this'));
  const page=await context.newPage(); const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:45000});
  await page.getByTestId('lobby-hub').waitFor({timeout:30000});
  for(let i=0;i<3;i++) {
   await page.reload({waitUntil:'domcontentloaded'});
   await page.getByTestId('lobby-hub').waitFor({timeout:30000});
  }
  assert.equal(await page.locator('#startup-status').count(),0);
  assert.equal(await page.evaluate(()=>localStorage.getItem('startup-save-sentinel')),'keep-this');
  assert.deepEqual(errors,[]);
  await page.screenshot({path:out+'/lobby-'+viewport.width+'.png',fullPage:true});
  reports.push({viewport,lobbyLoaded:true,reloads:3,errors,storagePreserved:true});
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.route('**/*',route=>{
  const url=new URL(route.request().url());
  return url.origin!==origin || url.pathname.startsWith('/assets/')&&url.pathname.endsWith('.js') ? route.abort() : route.continue();
 });
 const page=await context.newPage();
 await page.goto(origin,{waitUntil:'domcontentloaded'});
 await page.locator('#startup-retry').waitFor({state:'visible',timeout:20000});
 assert.match(await page.locator('#startup-message').innerText(),/存檔不會被清除/);
 await page.screenshot({path:out+'/resource-recovery.png'});
 reports.push({failedEntryModuleShowsRecovery:true});
 await context.close();
 const broken=await browser.newContext({viewport:{width:390,height:844}});
 await broken.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 await broken.addInitScript(()=>{
  localStorage.setItem('zhiguang_108_local_accounts_v2','[null]');
  localStorage.setItem('startup-save-sentinel','keep-this');
 });
 const brokenPage=await broken.newPage();
 await brokenPage.goto(origin,{waitUntil:'domcontentloaded'});
 await brokenPage.getByRole('alert').waitFor({timeout:30000});
 assert.match(await brokenPage.getByRole('alert').innerText(),/存檔仍保留/);
 assert.equal(await brokenPage.evaluate(()=>localStorage.getItem('startup-save-sentinel')),'keep-this');
 assert.equal(await brokenPage.evaluate(()=>localStorage.getItem('zhiguang_108_local_accounts_v2')),'[null]');
 await brokenPage.screenshot({path:out+'/render-recovery.png'});
 reports.push({renderFailureShowsRecoveryWithoutDeletingData:true});
 await broken.close();
 await writeFile(out+'/results.json',JSON.stringify(reports,null,2));
 console.log(JSON.stringify({origin,reports},null,2));
} finally { await browser.close(); }
