import test from "node:test";
import assert from "node:assert/strict";
import {AUSBILDUNG_SECTIONS, AUSBILDUNG_SOURCES, AUSBILDUNG_CHECKLIST} from "../js/ausbildung-data.js";
import {sectionStrings, LOCALES, buildTranslationMap} from "../js/ausbildung-locales.js";
import {translateGuideText} from "../js/ausbildung-language.js";
import {buildAusbildungPageHTML} from "../js/ausbildung.js";

for (const language of ["bn", "de"]) {
  test(`${language}: every section, table, source and checklist item has a translation`, () => {
    const locale = LOCALES[language];
    assert.deepEqual(Object.keys(locale.sections), AUSBILDUNG_SECTIONS.map(section => section.id));
    for (const section of AUSBILDUNG_SECTIONS) {
      assert.equal(locale.sections[section.id].length, sectionStrings(section).length, section.id);
      assert.ok(locale.sections[section.id].every(text => typeof text === "string" && text.trim()));
    }
    assert.equal(locale.sources.length, Object.keys(AUSBILDUNG_SOURCES).length);
    assert.equal(locale.checklist.length, AUSBILDUNG_CHECKLIST.length);
    const map = buildTranslationMap(language);
    const decode = value => value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
    const germanPhrases = AUSBILDUNG_SECTIONS.flatMap(section => section.blocks.filter(block => block.type === "phrases").flatMap(block => block.items.map(([term]) => term)));
    for (const match of buildAusbildungPageHTML().matchAll(/>([^<>]+)</g)) {
      const text = decode(match[1]).trim();
      if (!text || /^[\d\s+↑↗]+$/.test(text) || germanPhrases.includes(text)) continue;
      assert.ok(map.has(text), `Untranslated ${language} text: ${text}`);
    }
  });
}

test("dynamic search/checklist messages are translated, including storage failures", () => {
  for (const language of ["bn", "de"]) {
    for (const text of ["3 of 20 sections match. Checklist and official resources remain below.", "2 of 9 preparation milestones checked.", "2 of 9 preparation milestones checked. Browser storage is unavailable; these changes last only while this page is open.", "Route and Learning and payment and What to check table; scroll horizontally if needed"]) {
      assert.notEqual(translateGuideText(text, language), text);
      assert.equal(translateGuideText(text, "en"), text);
    }
  }
});

test("translations keep financial amounts and legal distinctions", () => {
  const bn = JSON.stringify(LOCALES.bn.sections), de = JSON.stringify(LOCALES.de.sections);
  for (const value of ["€1,048", "€822", "€959", "€1,091", "€75", "28,000", "§38", "B1", "B2"]) assert.ok(bn.includes(value), value);
  for (const value of ["1.048 €", "822 €", "959 €", "1.091 €", "75 €", "28.000", "§38", "unter 35", "B1", "B2"]) assert.ok(de.includes(value), value);
});
