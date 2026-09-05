import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {buildAusbildungPageHTML} from "../js/ausbildung.js";
import {AUSBILDUNG_SECTIONS,AUSBILDUNG_SOURCES,AUSBILDUNG_CHECKLIST,AUSBILDUNG_REVIEWED} from "../js/ausbildung-data.js";

test("every contents link resolves to a unique rendered section",()=>{
  const html=buildAusbildungPageHTML();
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]),`Missing target ${match[1]}`);
  assert.equal(AUSBILDUNG_SECTIONS.length,20);
});

test("visa guidance retains the review date, route distinctions and primary sources",()=>{
  const html=buildAusbildungPageHTML();
  assert.equal(AUSBILDUNG_REVIEWED,"2026-09-05");
  for(const text of ["€1,048","€822","€959","€1,091","2026","§38","under 35","A2","B1"])assert.ok(html.includes(text),text);
  const official=["make-it-in-germany.com","dhaka.diplo.de","bibb.de","arbeitsagentur.de","web.arbeitsagentur.de","gesetze-im-internet.de"];
  for(const source of Object.values(AUSBILDUNG_SOURCES)){const url=new URL(source.url);assert.equal(url.protocol,"https:");assert.ok(official.includes(url.hostname.replace(/^www\./,"")));}
  for(const section of AUSBILDUNG_SECTIONS)for(const key of section.sources)assert.ok(AUSBILDUNG_SOURCES[key],key);
});

test("the standalone guide is linked from navigation and included in the offline cache",()=>{
  const read=file=>fs.readFileSync(new URL(file,import.meta.url),"utf8");
  const ui=read("../js/ui.js"),index=read("../index.html"),sw=read("../sw.js");
  const page=read("../ausbildung/index.html"),entry=read("../js/ausbildung-page.js");
  assert.ok(ui.includes('new URL("../ausbildung/", import.meta.url)'));
  assert.ok(ui.includes('window.location.replace(destination.href)'));
  assert.ok(!ui.includes('mountAusbildungPage'));
  assert.ok(!index.includes('href="css/ausbildung.css"'));
  assert.ok(page.includes('href="../css/ausbildung.css"'));
  assert.ok(page.includes('src="../js/ausbildung-page.js"'));
  assert.ok(entry.includes('initLevelPage()'));
  assert.ok(entry.includes('mountAusbildungPage(document.getElementById("ausbildungGuide"))'));
  for(const file of ["ausbildung/","ausbildung/index.html","js/ausbildung-page.js","js/ausbildung.js","js/ausbildung-data.js","css/ausbildung.css"])assert.ok(sw.includes(`toAbsolute("${file}")`));
  assert.equal(new Set(AUSBILDUNG_CHECKLIST.map(([id])=>id)).size,AUSBILDUNG_CHECKLIST.length);
});
