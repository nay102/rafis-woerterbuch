export const DICTIONARY_CATEGORIES = [
  "Verben", "Adjektiven", "Adverbien", "Nomen", "Nomen-Verb Verbindung",
  "Redewendungen", "Sprichwörter", "Feste Wendungen", "Slang",
  "Schimpfwörter", "Best YT Kanäle", "Filme & Serien"
];

const isBlank = value => value == null || String(value).trim() === "";
const hasContent = value => Array.isArray(value) ? value.some(item => !isBlank(item)) : !isBlank(value);

export function validateDictionary(words) {
  const issues = [];
  const add = (word, severity, field, code, message) => issues.push({
    severity, field, code, message, id: word?.id ?? "", word: word?.word || "(unnamed)",
    category: word?.category || "Uncategorized"
  });
  const ids = new Map();
  const identities = new Map();
  const required = ["word", "type", "category", "meaning", "englisch", "bangla", "examples"];

  words.forEach((word, index) => {
    const row = index + 1;
    required.forEach(field => {
      if (!hasContent(word[field])) add(word, "error", field, "missing-field", `Row ${row}: “${field}” is missing or empty.`);
    });
    if (isBlank(word.id)) add(word, "error", "id", "missing-id", `Row ${row}: ID is missing.`);
    if (!DICTIONARY_CATEGORIES.includes(word.category)) add(word, "error", "category", "invalid-category", `Unknown category: ${word.category || "(empty)"}.`);
    if (!isBlank(word.level) && !/^(A1|A2|B1|B2|C1|C2)$/i.test(String(word.level))) {
      add(word, "warning", "level", "invalid-level", `Unexpected CEFR level: ${word.level}.`);
    }
    if (word.id != null) {
      const key = String(word.id);
      if (ids.has(key)) add(word, "error", "id", "duplicate-id", `Duplicate ID; first used on row ${ids.get(key)}.`);
      else ids.set(key, row);
    }
    const identity = `${String(word.category).toLowerCase()}|${String(word.word).trim().toLowerCase()}`;
    if (identities.has(identity)) add(word, "warning", "word", "duplicate-word", `Duplicate word in this category; first used on row ${identities.get(identity)}.`);
    else identities.set(identity, row);
    if (word.examples != null && !Array.isArray(word.examples)) add(word, "error", "examples", "invalid-array", "Examples must be an array.");
    if (["Verben", "Adjektiven", "Adverbien"].includes(word.category) && word["easy examples"] != null && !Array.isArray(word["easy examples"])) {
      add(word, "warning", "easy examples", "invalid-easy-examples", "Easy examples must be an array when supplied.");
    }
    if (word.category === "Verben" && (!word.conjugation || typeof word.conjugation !== "object")) {
      add(word, "error", "conjugation", "missing-conjugation", "Verb has no usable conjugation data.");
    }
    if (word.category === "Nomen" && isBlank(word.article)) add(word, "warning", "article", "missing-article", "Noun article is missing.");
  });

  const counts = { error: 0, warning: 0, info: 0 };
  issues.forEach(issue => { counts[issue.severity] += 1; });
  const targetEasy = words.filter(word => ["Verben", "Adjektiven", "Adverbien"].includes(word.category));
  const easyReady = targetEasy.filter(word => hasContent(word["easy examples"])).length;
  const categoryStats = DICTIONARY_CATEGORIES.map(category => ({
    category, words: words.filter(word => word.category === category).length,
    issues: issues.filter(issue => issue.category === category).length
  }));

  return {
    issues,
    counts,
    categoryStats,
    totalWords: words.length,
    validWords: words.filter(word => !issues.some(issue => issue.id === word.id && issue.severity === "error")).length,
    easyExamples: { ready: easyReady, total: targetEasy.length }
  };
}
