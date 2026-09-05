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
  const evaluate=async expression=>(await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
  await cdp('Page.enable');
  await cdp('Network.enable');
  await cdp('Network.setCacheDisabled',{cacheDisabled:true});
  await cdp('Network.setBypassServiceWorker',{bypass:true});
  await cdp('Page.navigate',{url:'http://127.0.0.1:4173/ausbildung/'});
  for(let i=0;i<60;i++){if(await evaluate('Boolean(document.querySelector(".aus-page"))'))break;await new Promise(r=>setTimeout(r,250));}
  await evaluate('document.fonts.ready.then(()=>true)');
  const results=[];
  for(const width of [320,390,768,1024,1440]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    for(const dark of [false,true]){
      await evaluate(`document.body.classList.toggle('dark',${dark});document.body.classList.toggle('dark-mode',${dark});window.scrollTo(0,0)`);
      await new Promise(r=>setTimeout(r,450));
      const state=await evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,sections:document.querySelectorAll('[data-aus-section]').length,themeVisible:document.getElementById('darkToggle').getBoundingClientRect().width>0,loginVisible:document.getElementById('loginBtn').getBoundingClientRect().width>0,overflow:[...document.querySelectorAll('.aus-page *,.header *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1&&!e.closest('.aus-table-scroll')}).map(e=>e.className).slice(0,10)})`);
      const screenshot=await cdp('Page.captureScreenshot',{format:'png'});
      const name=`${width}-${dark?'dark':'light'}.png`;fs.writeFileSync(path.join(output,name),Buffer.from(screenshot.data,'base64'));results.push({...state,dark,screenshot:name});
    }
  }
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:false});
  await evaluate("document.body.classList.remove('dark','dark-mode')");
  for(const id of await evaluate("[...document.querySelectorAll('.aus-section')].map(e=>e.id)")){
    await evaluate(`document.getElementById(${JSON.stringify(id)}).scrollIntoView({behavior:'instant',block:'start'})`);
    await new Promise(r=>setTimeout(r,100));
    const shot=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,id+'.png'),Buffer.from(shot.data,'base64'));
  }
  const interactions=await evaluate(`(()=>{const toggle=document.querySelector('.aus-contents-toggle');toggle.click();const menu=toggle.getAttribute('aria-expanded')==='true'&&getComputedStyle(document.getElementById('aus-contents')).display!=='none';const search=document.getElementById('aus-search');search.value='zzzz-no-topic';search.dispatchEvent(new Event('input'));const empty=!document.getElementById('aus-no-results').hidden;document.getElementById('aus-clear').click();const restored=[...document.querySelectorAll('[data-aus-section]')].every(e=>!e.hidden);const check=document.querySelector('[data-aus-check]');check.click();const saved=JSON.parse(localStorage.getItem('rw_ausbildung_preparation_v1')).includes(check.dataset.ausCheck);check.click();return {menu,empty,restored,saved}})()`);
  interactions.mobileHomeHidden=await evaluate("getComputedStyle(document.querySelector('.aus-home-link')).display==='none'");
  await evaluate("window.scrollTo({top:1500,behavior:'instant'})");
  await new Promise(r=>setTimeout(r,100));
  interactions.topButtonAppears=await evaluate("!document.getElementById('ausScrollTop').hidden");
  await evaluate("document.getElementById('ausScrollTop').click()");
  await new Promise(r=>setTimeout(r,1200));
  interactions.returnsToTop=await evaluate("window.scrollY===0&&document.getElementById('ausScrollTop').hidden");
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({results,interactions},null,2));
  console.log(JSON.stringify({results,interactions},null,2));
  await cdp('Browser.close');socket.close();server.close();
})().catch(error=>{console.error(error);browser?.kill();server.close();process.exitCode=1;});
