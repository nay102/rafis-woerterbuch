import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { EXAM_PROVIDERS, EXAM_LEVELS, EXAM_CATEGORIES, EXAM_MATERIALS, isValidMaterial, filterMaterials } from "../js/exam-zone-data.js";

test("all ten exam collections start empty without fake download links", () => {
  assert.deepEqual(EXAM_PROVIDERS.map(item => item.id), ["goethe", "telc"]);
  assert.deepEqual(EXAM_LEVELS, ["A1", "A2", "B1", "B2", "C1"]);
  assert.equal(EXAM_CATEGORIES.length, 8);
  assert.deepEqual(EXAM_MATERIALS, []);
});

test("catalogue filtering isolates provider, level, category and search terms", () => {
  const paper = { id: "sample", title: "B1 Model Paper", description: "Reading practice", provider: "goethe", level: "B1", category: "exam-papers", storagePath: "exam-zone/goethe/B1/paper.pdf" };
  const materials = [paper, { ...paper, id: "telc-sample", provider: "telc" }, { ...paper, id: "c1-sample", level: "C1" }];
  assert.equal(isValidMaterial(paper), true);
  assert.deepEqual(filterMaterials(materials, { provider: "goethe", level: "B1", query: "  MODEL reading " }), [paper]);
  assert.deepEqual(filterMaterials(materials, { provider: "goethe", level: "B1", category: "writing" }), []);
  for (const storagePath of ["https://example.com/book.pdf", "assets/book.pdf", "exam-zone/../private.pdf", "exam-zone/file.html"]) {
    assert.equal(isValidMaterial({ ...paper, storagePath }), false, storagePath);
  }
});
const root=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const guide=fs.readFileSync(new URL("../exam-zone/index.html",import.meta.url),"utf8");
test("Exam Zone uses the main site's complete header and footer",()=>{
  const normalize=html=>html.replaceAll(' data-no-translate lang="en"','').replaceAll('src="../assets/','src="assets/').replace(/\s+/g,' ').trim();
  for(const tag of ['header','footer']){
    const pattern=new RegExp(`<${tag} class="${tag}"[\\s\\S]*?<\\/${tag}>`);
    assert.equal(normalize(guide.match(pattern)[0]),normalize(root.match(pattern)[0]));
  }
  for(const id of ['desktopSidePanel','mobileSidePanel','panelDarkToggle','panelLoginBtn','desktopInstallBtn','panelInstallBtn','desktopPanelSprachCoachBtn','panelSprachCoachBtn','authModal','authForm','userInfoModal'])assert.ok(guide.includes(`id="${id}"`),id);
  const ids=[...guide.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length);
});
