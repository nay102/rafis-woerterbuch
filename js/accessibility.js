let started = false;
const focusable = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]';
export function initAccessibility() {
  if (started) return; started=true;
  const main=document.querySelector("main");
  if (main) {
    main.id ||= "mainContent";main.tabIndex=-1;
    const skip=document.createElement("a");skip.className="skip-link";skip.href=`#${main.id}`;skip.textContent="Skip to content";document.body.prepend(skip);
  }
  const logo=document.getElementById("logoHome");
  if (logo && !logo.matches("a,button")) {
    logo.tabIndex=0;logo.setAttribute("role","link");logo.setAttribute("aria-label","Home");
    logo.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();logo.click();}});
  }
  let active=null, previous=null;
  const visible=node=>Boolean(node.getClientRects().length) && !node.closest('[hidden],.hidden,[inert]');
  const refresh=()=>{
    for (const input of document.querySelectorAll('input[type="email"],input[type="password"]')) {
      if(!input.labels?.length && !input.hasAttribute("aria-label")) input.setAttribute("aria-label",input.type==="email"?"Email address":"Password");
    }
    for(const close of document.querySelectorAll('.close-btn:not(button):not(a)')){
      if(close.dataset.keyboardReady)continue;close.dataset.keyboardReady="true";close.tabIndex=0;close.setAttribute("role","button");close.setAttribute("aria-label","Close dialog");
      close.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();close.click();}});
    }
    const overlays=[...document.querySelectorAll(".modal-overlay")].filter(visible);
    const overlay=overlays.at(-1);
    const dialog=overlay?.querySelector('[role="dialog"],.modal-box') || null;
    if(dialog===active)return;
    if(!dialog){const restore=previous;active=null;previous=null;if(restore?.isConnected)restore.focus();return;}
    if(!active)previous=document.activeElement;active=dialog;
    dialog.setAttribute("role","dialog");dialog.setAttribute("aria-modal","true");
    if(!dialog.hasAttribute("aria-label")&&!dialog.hasAttribute("aria-labelledby"))dialog.setAttribute("aria-label",dialog.querySelector("h2")?.textContent||"Dialog");
    dialog.tabIndex=-1;( [...dialog.querySelectorAll(focusable)].find(visible) || dialog).focus();
  };
  new MutationObserver(refresh).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","hidden"]});
  document.addEventListener("keydown",event=>{
    if(!active || !visible(active))return;
    if(event.key==="Escape") { const close=active.querySelector(".close-btn");if(close){event.preventDefault();close.click();}return; }
    if(event.key!=="Tab")return;
    const items=[...active.querySelectorAll(focusable)].filter(visible);
    if(!items.length){event.preventDefault();active.focus();return;}
    const first=items[0],last=items.at(-1);
    if(event.shiftKey && (document.activeElement===first||!active.contains(document.activeElement))){event.preventDefault();last.focus();}
    else if(!event.shiftKey && (document.activeElement===last||!active.contains(document.activeElement))){event.preventDefault();first.focus();}
  });
  refresh();
}
