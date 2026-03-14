const fs = require('fs');
const path = require('path');

const WORDS_PATH = path.join(__dirname, 'js', 'words.json');
const NEW_WORDS_PATH = path.join(__dirname, 'new_words.json');

const ADVERB_LIST = new Set([
  'leider','gestern','heute','morgen','dort','hier','da','oft','sehr','nicht','nie','immer','schon','bald','gern','fast','auch','nur','noch','vielleicht'
]);

function normalizeWord(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function isVerb(raw) {
  const text = normalizeWord(raw);
  if (text.startsWith('sich ')) return true;
  return text.endsWith('en') || text.endsWith('ern');
}

function isNoun(raw) {
  const text = normalizeWord(raw);
  return text.startsWith('der ') || text.startsWith('die ') || text.startsWith('das ');
}

function detectCategory(raw) {
  const text = normalizeWord(raw);
  if (isVerb(text)) return { type: 'Verb', category: 'Verben', prefix: 'verb' };
  if (isNoun(text)) return { type: 'Nomen', category: 'Nomen', prefix: 'noun' };
  if (ADVERB_LIST.has(text)) return { type: 'Adverb', category: 'Adverbien', prefix: 'adv' };
  return { type: 'Adjektiv', category: 'Adjektive', prefix: 'adj' };
}

function getNextIds(entries) {
  const max = { verb: 0, noun: 0, adj: 0, adv: 0 };
  const rx = /^(verb|noun|adj|adv)(\d+)$/i;
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const id = String(entry.id || '').trim();
    const match = id.match(rx);
    if (!match) continue;
    const prefix = match[1].toLowerCase();
    const num = Number(match[2]);
    if (!Number.isNaN(num) && num > max[prefix]) max[prefix] = num;
  }
  return max;
}

function buildExample(word, meta) {
  if (meta.type === 'Verb') {
    if (normalizeWord(word).startsWith('sich ')) {
      const base = word.replace(/^sich\s+/i, '').trim();
      return `Ich ${base} mich.`;
    }
    return `Ich ${word} heute.`;
  }
  if (meta.type === 'Nomen') return `Ich sehe ${word}.`;
  if (meta.type === 'Adjektiv') return `Das ist ${word}.`;
  return `Er kommt ${word}.`;
}

function buildEntry(word, meta, nextIds) {
  const id = `${meta.prefix}${++nextIds[meta.prefix]}`;
  const entry = {
    id,
    word,
    type: meta.type,
    category: meta.category,
    englisch: ['TODO'],
    bangla: ['TODO'],
    meaning: `Definition for ${word}.`,
    examples: [buildExample(word, meta)]
  };

  if (meta.type === 'Verb' || meta.type === 'Adjektiv' || meta.type === 'Adverb') {
    entry.synonym = ['TODO'];
  }

  return entry;
}

function main() {
  if (!fs.existsSync(WORDS_PATH)) throw new Error(`Missing ${WORDS_PATH}`);
  if (!fs.existsSync(NEW_WORDS_PATH)) throw new Error(`Missing ${NEW_WORDS_PATH}`);

  const wordsData = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf8'));
  const newWords = JSON.parse(fs.readFileSync(NEW_WORDS_PATH, 'utf8'));

  if (!Array.isArray(wordsData)) throw new Error('words.json must be an array');
  if (!Array.isArray(newWords)) throw new Error('new_words.json must be an array');

  const seen = new Set();
  const cleaned = [];

  // Keep meta rows, drop duplicates by normalized word.
  for (const entry of wordsData) {
    if (!entry || typeof entry !== 'object') continue;
    if (entry._meta === true || (typeof entry.id === 'string' && entry.id.startsWith('__'))) {
      cleaned.push(entry);
      continue;
    }
    const key = normalizeWord(entry.word);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(entry);
  }

  const nextIds = getNextIds(cleaned);
  const appended = [];

  for (const raw of newWords) {
    const word = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!word) continue;
    const key = normalizeWord(word);
    if (seen.has(key)) continue;

    const meta = detectCategory(word);
    const entry = buildEntry(word, meta, nextIds);
    cleaned.push(entry);
    appended.push(entry);
    seen.add(key);
  }

  fs.writeFileSync(WORDS_PATH, JSON.stringify(cleaned, null, 2));
  console.log(`Added ${appended.length} new entries.`);
}

main();
