import { getLibrarySession } from "./library-session-data.js";

export const A1_FLASHCARD_TOPICS = Object.freeze({
  greetings: "Greetings & Introductions",
  family: "Family",
  "food-drinks": "Food & Drinks",
  numbers: "Numbers",
  home: "Home",
  travel: "Travel",
  shopping: "Shopping",
  "school-work": "School & Work"
});

const articlePattern = /^(der|die|das)\s+(.+)$/i;
const slugify = value => String(value)
  .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .replace(/ß/g, "ss").replace(/[^a-zA-Z0-9]+/g, "-")
  .replace(/^-|-$/g, "").toLowerCase() || "item";

function vocabularyBlocks(session) {
  return (session?.lessons || []).flatMap(lesson => (lesson.blocks || [])
    .filter(block => block.type === "vocabularyCards" || block.type === "vocabulary"));
}

function normalizeItem(item, topic, blockTitle) {
  const source = Array.isArray(item)
    ? { german: item[0], english: item[1], bengali: item[2] }
    : item;
  const recordedGerman = String(source?.german || "").trim();
  const match = recordedGerman.match(articlePattern);
  const article = match ? match[1].toLowerCase() : "";
  const word = match ? match[2].trim() : recordedGerman;
  const english = String(source?.english || "").trim();
  const bengali = String(source?.bengali || "").trim();
  if (!recordedGerman || (!english && !bengali)) return null;
  const category = String(source?.category || blockTitle || topic).trim();
  const type = article ? "noun" : /[.!?]|\s/.test(recordedGerman) ? "phrase" : "word";
  return {
    id: `a1-${topic}-${slugify(recordedGerman)}`,
    level: "A1", topic, topicTitle: A1_FLASHCARD_TOPICS[topic], type,
    german: recordedGerman, word, article,
    plural: String(source?.plural || "").trim(),
    english, bengali,
    example: String(source?.example || "").trim(),
    category
  };
}

function buildBank() {
  const cards = [];
  Object.keys(A1_FLASHCARD_TOPICS).forEach(topic => {
    const session = getLibrarySession("A1", topic);
    const seen = new Set();
    vocabularyBlocks(session).forEach(block => (block.items || []).forEach(item => {
      const card = normalizeItem(item, topic, block.title);
      if (!card) return;
      const identity = `${card.german.toLocaleLowerCase("de-DE")}|${card.type}|${card.article}`;
      if (seen.has(identity)) return;
      seen.add(identity);
      let id = card.id;
      let suffix = 2;
      while (cards.some(existing => existing.id === id)) id = `${card.id}-${suffix++}`;
      cards.push(Object.freeze({...card, id}));
    }));
  });
  return cards;
}

export const A1_FLASHCARDS = Object.freeze(buildBank());
export const A1_FLASHCARD_PROGRESS_KEY = "rw_a1_flashcards_v1";

export function validateA1Flashcards(cards = A1_FLASHCARDS) {
  const errors = [], ids = new Set();
  cards.forEach((card, index) => {
    if (!card.id || ids.has(card.id)) errors.push(`Duplicate or missing ID at ${index}.`);
    ids.add(card.id);
    if (!A1_FLASHCARD_TOPICS[card.topic]) errors.push(`Invalid topic at ${card.id}.`);
    if (!card.german || (!card.english && !card.bengali)) errors.push(`Missing display content at ${card.id}.`);
    if (card.type === "noun" && !["der", "die", "das"].includes(card.article)) errors.push(`Invalid noun article at ${card.id}.`);
  });
  return errors;
}

export function getFlashcardCounts() {
  return Object.fromEntries(Object.keys(A1_FLASHCARD_TOPICS).map(topic => [topic, A1_FLASHCARDS.filter(card => card.topic === topic).length]));
}

export function readFlashcardProgress() {
  try { return JSON.parse(localStorage.getItem(A1_FLASHCARD_PROGRESS_KEY) || "null") || {}; }
  catch { return {}; }
}

export function updateFlashcardTrainerCard() {
  const card = document.querySelector("[data-a1-flashcards]");
  if (!card) return;
  const count = card.querySelector("[data-flashcard-count]");
  if (count) count.textContent = `${A1_FLASHCARDS.length} Cards · 20 per Session`;
  const status = card.querySelector("[data-flashcard-status]");
  if (!status) return;
  const progress = readFlashcardProgress();
  const validIds = new Set(A1_FLASHCARDS.map(item => item.id));
  const records = Object.entries(progress.cards || {}).filter(([id]) => validIds.has(id)).map(([, value]) => value);
  if (!progress.totalSessions) status.textContent = "Not Started";
  else {
    const mastered = records.filter(item => item.box >= 4).length;
    const due = records.filter(item => item.nextReview && new Date(item.nextReview).getTime() <= Date.now()).length;
    status.textContent = due ? `${due} Due` : `${mastered} Mastered`;
  }
}
