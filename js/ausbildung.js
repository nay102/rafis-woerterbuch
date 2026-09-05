import {escapeHtml} from "./dictionary-format.js";
import {AUSBILDUNG_REVIEWED,AUSBILDUNG_SECTIONS,AUSBILDUNG_SOURCES,AUSBILDUNG_CHECKLIST} from "./ausbildung-data.js";

const e = escapeHtml;
const CHECKLIST_KEY = "rw_ausbildung_preparation_v1";
const sourceLink = key => {
  const source=AUSBILDUNG_SOURCES[key];
  return `<a href="${e(source.url)}" target="_blank" rel="noopener noreferrer">${e(source.title)} <span aria-hidden="true">↗</span></a>`;
};
function renderBlock(block) {
  if(block.type==="paragraph") return `<p>${e(block.text)}</p>`;
  if(block.type==="note") return `<aside class="aus-note"><h3>${e(block.title)}</h3><p${/[\u0980-\u09ff]/u.test(block.text)?' lang="bn"':""}>${e(block.text)}</p></aside>`;
  if(block.type==="list") return `<ul class="aus-list">${block.items.map(item=>`<li>${e(item)}</li>`).join("")}</ul>`;
  if(block.type==="steps") return `<ol class="aus-steps">${block.items.map(([title,text])=>`<li><h3>${e(title)}</h3><p>${e(text)}</p></li>`).join("")}</ol>`;
  if(block.type==="phrases") return `<dl class="aus-glossary">${block.items.map(([term,text])=>`<div><dt lang="de">${e(term)}</dt><dd>${e(text)}</dd></div>`).join("")}</dl>`;
  if(block.type==="faq") return `<div class="aus-faq">${block.items.map(([question,answer])=>`<details><summary>${e(question)}</summary><p>${e(answer)}</p></details>`).join("")}</div>`;
  if(block.type==="table") return `${block.headers.length>2?'<p class="aus-table-hint">Scroll the table sideways to compare every column.</p>':""}<div class="aus-table-scroll" tabindex="0" role="region" aria-label="${e(block.headers.join(" and "))} table; scroll horizontally if needed"><table><thead><tr>${block.headers.map(header=>`<th scope="col">${e(header)}</th>`).join("")}</tr></thead><tbody>${block.rows.map(row=>`<tr>${row.map((cell,index)=>index?`<td>${e(cell)}</td>`:`<th scope="row">${e(cell)}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  return "";
}
export function buildAusbildungPageHTML() {
  return `<article class="aus-page" aria-labelledby="aus-title">
    <header class="aus-hero" id="aus-top">
      <div><span class="aus-eyebrow">LEARN A PROFESSION · BUILD YOUR NEXT CHAPTER</span><h1 id="aus-title">Your guide to<br><span lang="de">Ausbildung.</span></h1><p>Understand the German training system, choose your path and prepare your application—with a dedicated guide for Bangladesh.</p>
      <div class="aus-hero-actions"><a href="#aus-bangladesh" class="aus-primary">Applying from Bangladesh <span aria-hidden="true">↗</span></a><a href="#aus-basics">Start with the basics</a></div>
      <p class="aus-reviewed">Official sources reviewed <time datetime="${AUSBILDUNG_REVIEWED}">5 September 2026</time> · Figures labelled 2026</p></div>
      <div class="aus-hero-aside" aria-label="Your preparation path"><span>YOUR PATH</span><ol><li>Choose your profession</li><li>Prepare your German</li><li>Apply & review the offer</li><li>Plan your visa & arrival</li></ol><p>A practical reference you can return to at every stage.</p></div>
    </header>
    <div class="aus-intro-note"><strong>Use this guide with the official checklist.</strong> Requirements depend on the occupation, provider, German state and individual visa case. This is a dated guide, not a live eligibility decision. Check linked official pages before applying or paying.</div>
    <div class="aus-layout">
      <nav class="aus-navigation" aria-label="Ausbildung guide contents"><h2>In this guide</h2><button class="aus-contents-toggle" type="button" aria-expanded="false" aria-controls="aus-contents">Browse guide topics <span aria-hidden="true">+</span></button><ol id="aus-contents">${AUSBILDUNG_SECTIONS.map(section=>`<li><a href="#aus-${section.id}">${e(section.label)}</a></li>`).join("")}<li><a href="#aus-checklist">My preparation checklist</a></li><li><a href="#aus-sources">Official resources</a></li></ol></nav>
      <div class="aus-reading">
        <div class="aus-tools"><label for="aus-search">Find a topic in this guide<input id="aus-search" type="search" placeholder="Try: Bangladesh, salary, B1, nursing…" autocomplete="off"></label><button type="button" id="aus-clear">Clear search</button><button type="button" id="aus-print">Print guide</button><p id="aus-search-status" role="status"></p></div>
        <p id="aus-no-results" hidden>No matching sections. Try another word or clear the search to browse the full guide.</p>
        ${AUSBILDUNG_SECTIONS.map((section,index)=>`<section class="aus-section" id="aus-${section.id}" aria-labelledby="aus-heading-${section.id}" data-aus-section><div class="aus-section-heading"><span>${String(index+1).padStart(2,"0")}</span><h2 id="aus-heading-${section.id}" tabindex="-1">${e(section.title)}</h2></div>${section.blocks.map(renderBlock).join("")}${section.sources.length?`<div class="aus-citations"><span>Official references</span>${section.sources.map(sourceLink).join("")}</div>`:""}<a class="aus-top-link" href="#aus-top">Back to top ↑</a></section>`).join("")}
        <section class="aus-section" id="aus-checklist" aria-labelledby="aus-checklist-title"><h2 id="aus-checklist-title" tabindex="-1">My preparation checklist</h2><p>Tick off your preparation milestones. This checklist stays in this browser and is not sent to an employer or embassy. It is not a visa document checklist.</p><div class="aus-checklist">${AUSBILDUNG_CHECKLIST.map(([id,label])=>`<label><input type="checkbox" data-aus-check="${id}"><span>${e(label)}</span></label>`).join("")}</div><p id="aus-check-status" role="status"></p></section>
        <section class="aus-section aus-resources" id="aus-sources" aria-labelledby="aus-sources-title"><h2 id="aus-sources-title" tabindex="-1">Official resources & verification</h2><p>Follow the page for your exact purpose. The live official page takes priority if its instructions change after this guide’s review date.</p><ul>${Object.keys(AUSBILDUNG_SOURCES).map(key=>`<li>${sourceLink(key)}</li>`).join("")}</ul><p>To find vacancies, begin with the Federal Employment Agency’s “Finding training” page above. To apply for the visa, follow the vocational-training portal link on the German Embassy Dhaka checklist.</p><p class="aus-editorial">Review date: 5 September 2026. The roadmap, shortlist questions, interview exercises and example timeline are practical editorial guidance. Official requirements and figures have references beside the relevant sections.</p></section>
      </div>
    </div>
  </article>`;
}

export function mountAusbildungPage(host) {
  host.innerHTML=buildAusbildungPageHTML();
  const root=host.querySelector(".aus-page"),search=root.querySelector("#aus-search"),sections=[...root.querySelectorAll("[data-aus-section]")];
  const navigation=root.querySelector(".aus-navigation"),contentsToggle=root.querySelector(".aus-contents-toggle");
  const setContentsOpen=open=>{
    navigation.classList.toggle("is-open",open);
    contentsToggle.setAttribute("aria-expanded",String(open));
    contentsToggle.querySelector("span").textContent=open?"−":"+";
  };
  contentsToggle.addEventListener("click",()=>setContentsOpen(contentsToggle.getAttribute("aria-expanded")!=="true"));
  const filter=()=>{
    const query=search.value.trim().toLocaleLowerCase();
    let visible=0;
    sections.forEach(section=>{section.hidden=Boolean(query)&&!section.textContent.toLocaleLowerCase().includes(query);if(!section.hidden)visible++;});
    root.querySelector("#aus-no-results").hidden=visible>0;
    root.querySelector("#aus-search-status").textContent=query?`${visible} of ${sections.length} sections match. Checklist and official resources remain below.`:"";
  };
  search.addEventListener("input",filter);
  host.addEventListener("auslanguagechange",filter);
  root.querySelector("#aus-clear").addEventListener("click",()=>{search.value="";filter();search.focus();});
  root.querySelector("#aus-print").addEventListener("click",()=>{
    search.value="";filter();
    const details=[...root.querySelectorAll("details")],states=details.map(item=>item.open);details.forEach(item=>item.open=true);
    document.body.classList.add("printing-ausbildung");
    const restore=()=>{document.body.classList.remove("printing-ausbildung");details.forEach((item,index)=>item.open=states[index]);};
    window.addEventListener("afterprint",restore,{once:true});
    try{window.print();}catch{restore();root.querySelector("#aus-search-status").textContent="Printing is unavailable in this browser. You can still read the complete guide here.";}
  });
  root.addEventListener("click",event=>{
    const link=event.target.closest('a[href^="#aus-"]');if(!link||!root.contains(link))return;
    const target=root.querySelector(link.getAttribute("href"));if(!target)return;
    event.preventDefault();search.value="";filter();
    setContentsOpen(false);
    history.replaceState(null,"",link.getAttribute("href"));
    const heading=target.querySelector("h2,h1")||target;heading.tabIndex=-1;heading.focus({preventScroll:true});target.scrollIntoView({behavior:"auto",block:"start"});
  });
  let saved=[];
  try{const parsed=JSON.parse(localStorage.getItem(CHECKLIST_KEY)||"[]");if(Array.isArray(parsed))saved=parsed;}catch{/* The checklist remains usable without storage. */}
  const checks=[...root.querySelectorAll("[data-aus-check]")];checks.forEach(input=>input.checked=saved.includes(input.dataset.ausCheck));
  const update=(persist=false)=>{
    const selected=checks.filter(input=>input.checked).map(input=>input.dataset.ausCheck);
    let message=`${selected.length} of ${checks.length} preparation milestones checked.`;
    if(persist)try{localStorage.setItem(CHECKLIST_KEY,JSON.stringify(selected));}catch{message+=" Browser storage is unavailable; these changes last only while this page is open.";}
    root.querySelector("#aus-check-status").textContent=message;
  };
  checks.forEach(input=>input.addEventListener("change",()=>update(true)));update();
}
