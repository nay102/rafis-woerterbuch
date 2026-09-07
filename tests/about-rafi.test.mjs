import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const root=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const guide=fs.readFileSync(new URL("../about-rafi/index.html",import.meta.url),"utf8");
test("About Rafi uses the main site's complete header and footer",()=>{
  const normalize=html=>html.replaceAll(' data-no-translate lang="en"','').replaceAll('src="../assets/','src="assets/').replace(/\s+/g,' ').trim();
  for(const tag of ['header','footer']){
    const pattern=new RegExp(`<${tag} class="${tag}"[\\s\\S]*?<\\/${tag}>`);
    assert.equal(normalize(guide.match(pattern)[0]),normalize(root.match(pattern)[0]));
  }
  for(const id of ['desktopSidePanel','mobileSidePanel','panelDarkToggle','panelLoginBtn','desktopInstallBtn','panelInstallBtn','desktopPanelSprachCoachBtn','panelSprachCoachBtn','authModal','authForm','userInfoModal'])assert.ok(guide.includes(`id="${id}"`),id);
  const ids=[...guide.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length);
});
