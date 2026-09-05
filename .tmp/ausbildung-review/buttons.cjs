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
  const results=[];
  for(const width of [320,768,1440]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    for(const [language,dark] of [['en',false],['bn',true],['de',false]]){
      await evaluate(`document.querySelector('[data-aus-language=${language}]').click();document.body.classList.toggle('dark',${dark});document.body.classList.toggle('dark-mode',${dark});window.scrollTo({top:0,behavior:'instant'})`);
      await new Promise(r=>setTimeout(r,700));
      const state=await evaluate(`({language:document.documentElement.lang,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,buttons:[...document.querySelectorAll('[data-aus-language]')].map(e=>({language:e.dataset.ausLanguage,selected:e.getAttribute('aria-pressed'),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,overflow:e.scrollWidth>e.clientWidth+1}))})`);
      const shot=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,`buttons-${width}-${language}.png`),Buffer.from(shot.data,'base64'));results.push(state);
    }
  }
  fs.writeFileSync(path.join(output,'buttons-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
  await cdp('Browser.close');socket.close();server.close();
})().catch(error=>{console.error(error);browser?.kill();server.close();process.exitCode=1;});
