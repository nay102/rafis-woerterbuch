import {buildTranslationMap} from "./ausbildung-locales.js";

const languages = new Set(["en", "bn", "de"]);
const maps = {en: new Map(), bn: buildTranslationMap("bn"), de: buildTranslationMap("de")};

export function translateGuideText(text, language = "en") {
  if (language === "en") return text;
  const key = text.trim(), map = maps[language];
  if (!map) return text;
  let translated = map.get(key);
  const number = value => new Intl.NumberFormat(language).format(Number(value));
  if (translated === undefined) {
    let match = key.match(/^(\d+) of (\d+) sections match\. Checklist and official resources remain below\.$/);
    if (match) translated = language === "bn"
      ? `${number(match[2])}টি অংশের মধ্যে ${number(match[1])}টি মিলেছে। প্রস্তুতির তালিকা ও সরকারি উৎস নিচে আছে।`
      : `${number(match[1])} von ${number(match[2])} Abschnitten passen. Checkliste und offizielle Quellen stehen weiterhin unten.`;
    match = key.match(/^(\d+) of (\d+) preparation milestones checked\.(.*)$/);
    if (match) {
      translated = language === "bn"
        ? `প্রস্তুতির ${number(match[2])}টি কাজের মধ্যে ${number(match[1])}টিতে টিক দেওয়া হয়েছে।`
        : `${number(match[1])} von ${number(match[2])} Vorbereitungsschritten abgehakt.`;
      if (match[3]) translated += language === "bn"
        ? " ব্রাউজারে সংরক্ষণ করা যাচ্ছে না; পাতা খোলা থাকা পর্যন্ত পরিবর্তন থাকবে।"
        : " Der Browserspeicher ist nicht verfügbar; die Änderungen bleiben nur erhalten, solange diese Seite geöffnet ist.";
    }
    const suffix = " table; scroll horizontally if needed";
    if (key.endsWith(suffix)) translated = key.slice(0, -suffix.length).split(" and ").map(part => map.get(part) || part).join(language === "bn" ? " ও " : " und ") + (language === "bn" ? " ছক; প্রয়োজনে পাশে স্ক্রল করুন" : ": Tabelle; bei Bedarf seitlich scrollen");
  }
  return translated === undefined ? text : text.replace(key, () => translated);
}

export function initAusbildungLanguage() {
  let language = "en";
  const originals = new WeakMap(), attributeOriginals = new WeakMap();
  const buttons = [...document.querySelectorAll("[data-aus-language]")];
  const guide = document.getElementById("ausbildungGuide");
  const originalTitle = document.title;
  const observer = new MutationObserver(() => translateDOM());
  const observe = () => observer.observe(document.body, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "placeholder", "title"]});
  const excluded = element => element.closest("script,style,noscript,[data-no-translate]");
  const translateRecord = (records, key, current) => {
    let record = records.get(key);
    if (!record || current !== record.rendered) record = {original: current, rendered: current};
    record.rendered = translateGuideText(record.original, language);
    records.set(key, record);
    return record.rendered;
  };
  function translateDOM() {
    observer.disconnect();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.textContent.trim() || excluded(node.parentElement)) continue;
      const next = translateRecord(originals, node, node.textContent);
      if (node.textContent !== next) node.textContent = next;
    }
    for (const element of document.querySelectorAll("[aria-label],[placeholder],[title]")) {
      if (excluded(element)) continue;
      let records = attributeOriginals.get(element);
      if (!records) attributeOriginals.set(element, records = new Map());
      for (const attribute of ["aria-label", "placeholder", "title"]) {
        if (!element.hasAttribute(attribute)) continue;
        const current = element.getAttribute(attribute), next = translateRecord(records, attribute, current);
        if (current !== next) element.setAttribute(attribute, next);
      }
    }
    document.documentElement.lang = language;
    guide.lang = language;
    document.getElementById("aus-title").querySelector("span").lang = language === "bn" ? "bn" : "de";
    for (const paragraph of guide.querySelectorAll(".aus-note p[lang]")) paragraph.lang = language === "en" ? "bn" : language;
    document.title = translateGuideText(originalTitle, language);
    for (const button of buttons) button.setAttribute("aria-pressed", String(button.dataset.ausLanguage === language));
    observe();
  }
  let transition;
  for (const button of buttons) button.addEventListener("click", () => {
    const selected = button.dataset.ausLanguage;
    if (language === selected || !languages.has(selected)) return;
    language = selected;
    // Text changes in place: controls, search, focus, open answers and checks
    // retain their existing DOM nodes and event handlers.
    const apply = () => { translateDOM(); guide.dispatchEvent(new Event("auslanguagechange")); };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    transition?.skipTransition?.();
    if (document.startViewTransition && !reducedMotion) {
      transition = document.startViewTransition(apply);
      transition.finished.catch(() => {});
    } else {
      apply();
      if (!reducedMotion) guide.animate?.([{opacity: .8}, {opacity: 1}], {duration: 180, easing: "ease-out"});
    }
  });
  translateDOM();
}
