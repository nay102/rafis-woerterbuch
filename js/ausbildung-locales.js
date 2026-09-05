import {AUSBILDUNG_SECTIONS, AUSBILDUNG_SOURCES, AUSBILDUNG_CHECKLIST} from "./ausbildung-data.js";
import {BN_SECTIONS, BN_SOURCES, BN_CHECKLIST} from "./ausbildung-bn.js";
import {DE_SECTIONS, DE_SOURCES, DE_CHECKLIST} from "./ausbildung-de.js";
import {UI_COPY} from "./ausbildung-ui-copy.js";

// Keep each section's translated strings in reading order. German learning
// phrases stay in German; their explanations are translated.
export function sectionStrings(section) {
  const strings = [section.title, section.label];
  for (const block of section.blocks) {
    if (block.title) strings.push(block.title);
    if (block.text) strings.push(block.text);
    if (block.headers) strings.push(...block.headers, ...block.rows.flat());
    if (block.items) strings.push(...(block.type === "phrases" ? block.items.map(item => item[1]) : block.items.flat()));
  }
  return strings;
}

export const LOCALES = {
  bn: {sections: BN_SECTIONS, sources: BN_SOURCES, checklist: BN_CHECKLIST},
  de: {sections: DE_SECTIONS, sources: DE_SOURCES, checklist: DE_CHECKLIST}
};

export function buildTranslationMap(language) {
  const locale = LOCALES[language];
  const map = new Map();
  if (!locale) return map;
  for (const section of AUSBILDUNG_SECTIONS) {
    const original = sectionStrings(section), translated = locale.sections[section.id];
    if (original.length !== translated?.length) throw new Error(`Incomplete ${language} translation: ${section.id}`);
    original.forEach((text, index) => map.set(text, translated[index]));
  }
  Object.values(AUSBILDUNG_SOURCES).forEach((source, index) => map.set(source.title, locale.sources[index]));
  AUSBILDUNG_CHECKLIST.forEach(([, text], index) => map.set(text, locale.checklist[index]));
  for (const [text, bangla, german] of UI_COPY) map.set(text, language === "bn" ? bangla : german);
  return map;
}
