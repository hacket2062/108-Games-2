import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {preview} from 'vite';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
await mkdir('.verification',{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:3008,strictPort:true},logLevel:'error'});
const browser=await chromium.launch({channel:'chrome',headless:true});
const reports=[];
try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});let releaseFont;
  const fontGate=new Promise(resolve=>releaseFont=resolve);
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname==='fonts.googleapis.com'){await fontGate;await route.abort();return;}
   return url.origin==='http://127.0.0.1:3008'?route.continue():route.abort();
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  // A stalled third-party font must not block application startup.
  await page.goto('http://127.0.0.1:3008',{waitUntil:'domcontentloaded'});
  await page.getByTestId('lobby-hub').waitFor({timeout:15000});releaseFont();
  for(let i=0;i<10;i++){await page.reload({waitUntil:'domcontentloaded'});await page.getByTestId('lobby-hub').waitFor({timeout:15000});}
  await page.screenshot({path:'.verification/startup-'+viewport.width+'.png'});
  assert.equal(await page.locator('#startup-status').count(),0);
  assert.deepEqual(errors,[]);reports.push({viewport,lobbyLoadedWithFontStalled:true,reloads:10,errors});await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.route('**/*',route=>{const url=new URL(route.request().url());return url.origin!=='http://127.0.0.1:3008'||url.pathname.startsWith('/assets/')&&url.pathname.endsWith('.js')?route.abort():route.continue();});
 const page=await context.newPage();await page.goto('http://127.0.0.1:3008',{waitUntil:'domcontentloaded'});
 await page.locator('#startup-retry').waitFor({state:'visible',timeout:18000});assert.match(await page.locator('#startup-message').innerText(),/存檔不會被清除/);
 await page.screenshot({path:'.verification/startup-resource-failure.png'});await context.close();
 reports.push({failedEntryModuleShowsRecovery:true});
 const broken=await browser.newContext({viewport:{width:390,height:844}});
 await broken.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:3008'?route.continue():route.abort());
 await broken.addInitScript(()=>{localStorage.setItem('zhiguang_108_local_accounts_v2','[null]');localStorage.setItem('startup-save-sentinel','keep-this');});
 const brokenPage=await broken.newPage();await brokenPage.goto('http://127.0.0.1:3008',{waitUntil:'domcontentloaded'});
 await brokenPage.getByRole('alert').waitFor();assert.match(await brokenPage.getByRole('alert').innerText(),/存檔仍保留/);
 assert.equal(await brokenPage.evaluate(()=>localStorage.getItem('startup-save-sentinel')),'keep-this');assert.equal(await brokenPage.evaluate(()=>localStorage.getItem('zhiguang_108_local_accounts_v2')),'[null]');
 await broken.close();reports.push({renderFailureShowsRecoveryWithoutDeletingData:true});
 await writeFile('.verification/startup-browser-results.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
