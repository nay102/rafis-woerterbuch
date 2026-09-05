const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const root = process.cwd();
const output = path.join(root, '.tmp/ausbildung-review');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server = http.createServer((req,res)=>{
  let relative = decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '');
  let file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);});
});
let browser;
(async()=>{
  await new Promise(resolve=>server.listen(4173,'127.0.0.1',resolve));
  browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port=9229',`--user-data-dir=${path.join(output,'profile')}`,'--no-first-run','--no-default-browser-check','about:blank'],{windowsHide:true,stdio:'ignore'});
  let targets;
  for(let i=0;i<40;i++){try{targets=await(await fetch('http://127.0.0.1:9229/json')).json();break;}catch{await new Promise(r=>setTimeout(r,250));}}
  if(!targets)throw Error('Local Chrome debugging endpoint unavailable');
  const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>socket.addEventListener('open',r,{once:true}));
  let next=0;const pending=new Map();
  socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){const {resolve,reject}=pending.get(m.id);pending.delete(m.id);m.error?reject(Error(m.error.message)):resolve(m.result);}});
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const result=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
  await cdp('Page.enable');
  await cdp('Network.enable');
  await cdp('Network.setCacheDisabled',{cacheDisabled:true});
  await cdp('Network.setBypassServiceWorker',{bypass:true});
  await cdp('Page.navigate',{url:'http://127.0.0.1:4173/ausbildung/'});
  for(let i=0;i<60;i++){if(await evaluate('Boolean(document.querySelector(".aus-page"))'))break;await new Promise(r=>setTimeout(r,250));}
  await evaluate('document.fonts.ready.then(()=>true)');
  const results=[], checks={};
  await evaluate("document.querySelector('[data-aus-language=en]').click()");
  await new Promise(r=>setTimeout(r,350));
  await evaluate(`window.savedCheck=document.querySelector('[data-aus-check]');window.savedSearch=document.getElementById('aus-search');window.savedFaq=document.querySelector('.aus-faq details');savedCheck.checked=true;savedCheck.dispatchEvent(new Event('change'));savedFaq.open=true;window.savedLinks=[...document.querySelectorAll('.aus-page a')].map(a=>a.getAttribute('href'));window.translationNodes=[];var walker=document.createTreeWalker(document.getElementById('ausbildungGuide'),NodeFilter.SHOW_TEXT);var n;while(n=walker.nextNode()){if(n.textContent.trim())translationNodes.push([n,n.textContent]);}`);
  for(const language of ['bn','de','en']) {
    await evaluate(`document.querySelector('[data-aus-language=${language}]').click()`);
    await new Promise(r=>setTimeout(r,350));
    checks[language]=await evaluate(`(async()=>{const {translateGuideText}=await import('/js/ausbildung-language.js');return {language:document.documentElement.lang,checked:savedCheck===document.querySelector('[data-aus-check]')&&savedCheck.checked,faq:savedFaq===document.querySelector('.aus-faq details')&&savedFaq.open,search:savedSearch===document.getElementById('aus-search'),links:JSON.stringify(savedLinks)===JSON.stringify([...document.querySelectorAll('.aus-page a')].map(a=>a.getAttribute('href'))),translationMismatches:translationNodes.filter(([node,original])=>node.isConnected&&node.textContent!==translateGuideText(original,'${language}')).map(([node,original])=>({original,current:node.textContent})).slice(0,10),checkStatus:document.getElementById('aus-check-status').textContent};})()`);
    for(const width of [320,390,768,1440]){
      await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
      for(const dark of [false,true]){
        await evaluate(`document.body.classList.toggle('dark',${dark});document.body.classList.toggle('dark-mode',${dark});window.scrollTo({top:0,behavior:'instant'})`);
        await new Promise(r=>setTimeout(r,650));
        const state=await evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('.aus-page *,.aus-language-bar *,.header *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1&&!e.closest('.aus-table-scroll')}).map(e=>({tag:e.tagName,text:e.textContent.slice(0,80),class:e.className})).slice(0,10)})`);
        const screenshot=await cdp('Page.captureScreenshot',{format:'png'});
        const file=`language-${language}-${width}-${dark?'dark':'light'}.png`;fs.writeFileSync(path.join(output,file),Buffer.from(screenshot.data,'base64'));results.push({language,dark,...state});
      }
    }
    if(language!=='en'){
      await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:false});
      await evaluate("document.body.classList.remove('dark','dark-mode')");
      for(const id of ['aus-bangladesh','aus-routes','aus-checklist','aus-faq']){
        await evaluate(`document.getElementById('${id}').scrollIntoView({behavior:'instant',block:'start'})`);
        await new Promise(r=>setTimeout(r,100));
        const shot=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,`${language}-${id}.png`),Buffer.from(shot.data,'base64'));
      }
    }
  }
  // Keep a real search and open controls through a language change.
  await evaluate("savedSearch.value='B1';savedSearch.dispatchEvent(new Event('input'));document.querySelector('[data-aus-language=bn]').click()");
  await new Promise(r=>setTimeout(r,350));
  checks.searchRetained=await evaluate("savedSearch.value==='B1'&&document.getElementById('aus-no-results').hidden&&document.getElementById('aus-search-status').textContent.includes('\u0985\u0982\u09b6')");
  await cdp('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  await evaluate("document.querySelector('[data-aus-language=de]').click()");
  await new Promise(r=>setTimeout(r,350));
  checks.offlineSwitch=await evaluate("document.documentElement.lang==='de'&&document.getElementById('aus-heading-basics').textContent==='Was eine Ausbildung eigentlich ist'");
  await cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  await cdp('Page.reload',{ignoreCache:true});
  for(let i=0;i<60;i++){if(await evaluate("Boolean(document.querySelector('.aus-page'))&&document.documentElement.lang==='de'"))break;await new Promise(r=>setTimeout(r,100));}
  checks.remembered=await evaluate("document.documentElement.lang==='de'&&document.querySelector('[data-aus-check]').checked");
  await evaluate("document.querySelector('[data-aus-language=bn]').click();document.querySelector('[data-aus-language=de]').click();document.querySelector('[data-aus-language=bn]').click()");
  await new Promise(r=>setTimeout(r,500));
  checks.rapidSwitch=await evaluate("document.documentElement.lang==='bn'&&document.querySelector('[data-aus-language=bn]').getAttribute('aria-pressed')==='true'");
  checks.translatedPrint=await evaluate("window.print=()=>{window.printState=document.body.classList.contains('printing-ausbildung')&&[...document.querySelectorAll('.aus-faq details')].every(d=>d.open)&&document.documentElement.lang==='bn'};document.getElementById('aus-print').click();window.dispatchEvent(new Event('afterprint'));window.printState&&!document.body.classList.contains('printing-ausbildung')");
  await evaluate("document.querySelector('[data-aus-language=en]').click();document.querySelector('[data-aus-check]').click()");
  await new Promise(r=>setTimeout(r,250));
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  checks.reducedMotion=await evaluate("document.querySelector('[data-aus-language=bn]').click();document.documentElement.lang==='bn'");
  await evaluate("document.querySelector('[data-aus-language=en]').click()");
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  checks.fallback=await evaluate("document.startViewTransition=undefined;document.querySelector('[data-aus-language=de]').click();document.documentElement.lang==='de'");
  checks.storageUnavailable=await evaluate("Storage.prototype.setItem=function(){throw new Error('Storage disabled for check')};document.querySelector('[data-aus-language=bn]').click();document.documentElement.lang==='bn'");
  fs.writeFileSync(path.join(output,'language-results.json'),JSON.stringify({results,checks},null,2));
  console.log(JSON.stringify({results,checks},null,2));
  await cdp('Browser.close');socket.close();server.close();
})().catch(error=>{console.error(error);browser?.kill();server.close();process.exitCode=1;});
