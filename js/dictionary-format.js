export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getWordSerial(word, sourceWords) {
  const index = sourceWords.findIndex(w => w.id === word.id);
  return index >= 0 ? index + 1 : "-";
}

export function findExactWordMatches(sourceWords, wordText) {
  return sourceWords.filter(
    w => w.word.toLowerCase() === wordText.toLowerCase()
  );
}

export function isLikelyGermanWordQuery(queryText) {
  const clean = String(queryText || "").trim().toLowerCase();
  if (!clean) return false;
  // Letters, spaces and hyphen only (includes German umlauts/Eszett).
  if (!/^[a-zäöüß\s-]+$/i.test(clean)) return false;
  const compact = clean.replace(/[\s-]/g, "");
  if (compact.length < 3 || compact.length > 32) return false;
  // Block only full repeated-letter noise: aaa, bbbb, etc.
  if (/^(.)\1+$/.test(compact)) return false;

  return true;
}

export function formatMeaningText(word) {
  const meaningText =
    typeof word?.meaning === "string" && word.meaning.trim()
      ? word.meaning
      : "No meaning added.";
  // const escapedMeaning = escapeHtml(meaningText);
    let escapedMeaning = escapeHtml(meaningText);

  // Allow only <b> tags
  escapedMeaning = escapedMeaning
    .replace(/&lt;b&gt;/gi, "<b>")
    .replace(/&lt;\/b&gt;/gi, "</b>");
  // Allow links to YT Channels
    const link = word?.link || word?.youtubeLink;
  if (link) {
    escapedMeaning += `<br><br><a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Open YouTube Channel</a>`;
  }
  // YT channel links

  const isVerb =
    String(word?.category || "").toLowerCase() === "verben" ||
    String(word?.type || "").toLowerCase() === "verb";

  if (!isVerb) return escapedMeaning;

  // Auto-bold grammar summary + conjugation line for verb entries.
  return escapedMeaning.replace(
    /(Es ist ein [^\n]*?Verb:\n[^\n]+)/gi,
    "<strong>$1</strong>"
  );
}

export function shouldShowSynonym(word) {
  const category = String(word?.category || "").toLowerCase();
  return (
    category === "verben" ||
    category === "adjektiven" ||
    category === "adverbien" ||
    category === "nomen"
  );
}

export function isVerbWord(word) {
  const category = String(word?.category || "").toLowerCase();
  const type = String(word?.type || "").toLowerCase();
  return category === "verben" || type === "verb";
}

export function formatExamples(word) {
  const examples = Array.isArray(word?.examples) ? word.examples : [];
  const examplesHtml = examples.join("<br><br>") || "-";

  // Tense labels in square brackets are highlighted only in the Verben category.
  if (String(word?.category || "").toLowerCase() !== "verben") return examplesHtml;

  return examplesHtml.replace(
    /\[([^\]\r\n<>]+)\]/g,
    '<span class="verb-example-tense">[$1]</span>'
  );
}

export function getEasyExamples(word) {
  const category = String(word?.category || "").toLowerCase();
  if (!["verben", "adjektiven", "adverbien"].includes(category)) return [];

  const easyExamples = Array.isArray(word?.["easy examples"])
    ? word["easy examples"]
    : [];
  return easyExamples.map(example =>
    String(example).replace(
      /\[([^\]\r\n<>]+)\]/g,
      '<span class="verb-example-tense">[$1]</span>'
    )
  );
}

export function formatEasyExamples(word) {
  return getEasyExamples(word).join("<br><br>") || "-";
}

export function getConjugationStatusText(word) {
  const status = String(word?.conjugation_status || "").toLowerCase();
  if (!status) return "Unknown";
  if (status === "needs decision") return "Needs decision (add irregular entry)";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getSynonymText(word) {
  if (Array.isArray(word?.synonym) && word.synonym.length) {
    return escapeHtml(word.synonym.join(", "));
  }

  if (typeof word?.synonym === "string" && word.synonym.trim()) {
    return escapeHtml(word.synonym.trim());
  }

  return "Kein deutsches Synonym gefunden.";
}

export function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
