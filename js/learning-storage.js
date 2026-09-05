// Account-scoped local progress. A null value is a reset tombstone, not missing data.
export const LEARNING_KEYS = ["rw_library_progress_v1", "rw_a1_grammar_challenge_v1", "rw_a1_flashcards_v1", "rw_a1_matching_v1", "rw_a1_listening_v1", "rw_a1_reading_v1", "rw_a1_sentence_builder_v1", "rw_a1_speaking_v1", "rw_a1_dialogues_v1", "rw_a1_mixed_mastery_v1", "rw_daily_plan_v1"];
const OWNER_KEY = "rw_learning_owner_v2";
const memory = new Map();
const disk = () => globalThis.localStorage;
function read(key) { if (memory.has(key)) return memory.get(key); try { return disk()?.getItem(key) ?? null; } catch { return null; } }
function write(key, value) { try { if (!disk()) throw new Error("Storage unavailable"); disk().setItem(key, value); memory.delete(key); } catch { memory.set(key,value); globalThis.dispatchEvent?.(new Event("learning-storage-full")); } }
export const learningOwner = () => read(OWNER_KEY) || "guest";
export function selectLearningOwner(uid) { write(OWNER_KEY, uid || "guest"); }
const recordKey = (key, owner) => `rw_progress_v2:${owner}:${key}`;
export function progressRecords(owner = learningOwner()) {
  const records = {};
  for (const key of LEARNING_KEYS) {
    try {
      const raw = read(recordKey(key, owner));
      if (raw) records[key] = JSON.parse(raw);
      else if (owner === "guest" && read(key)) records[key] = { value: read(key), updatedAt: 1 };
    } catch { /* Corrupt records must not prevent practice. */ }
  }
  return records;
}
export function mergeProgressRecords(local = {}, remote = {}) {
  const result = {};
  for (const key of LEARNING_KEYS) {
    const valid = record => record && Number.isFinite(record.updatedAt) && (record.value === null || typeof record.value === "string");
    const a = valid(local[key]) ? local[key] : null, b = valid(remote[key]) ? remote[key] : null;
    const chosen = a && (!b || a.updatedAt >= b.updatedAt) ? a : b;
    if (chosen) result[key] = chosen;
  }
  return result;
}
export function applyProgressRecords(records, owner = learningOwner()) {
  for (const [key, record] of Object.entries(mergeProgressRecords({}, records))) write(recordKey(key, owner), JSON.stringify(record));
  globalThis.dispatchEvent?.(new Event("learning-progress-updated"));
}
export const learningStorage = {
  getItem(key) { return progressRecords()[key]?.value ?? null; },
  setItem(key, value) {
    if (!LEARNING_KEYS.includes(key)) throw new Error(`Unknown learning key: ${key}`);
    const previous = progressRecords()[key];
    write(recordKey(key, learningOwner()), JSON.stringify({ value: String(value), updatedAt: Math.max(Date.now(), (previous?.updatedAt || 0) + 1) }));
    globalThis.dispatchEvent?.(new Event("learning-progress-changed"));
  },
  removeItem(key) {
    if (!LEARNING_KEYS.includes(key)) return;
    const previous = progressRecords()[key];
    write(recordKey(key, learningOwner()), JSON.stringify({ value: null, updatedAt: Math.max(Date.now(), (previous?.updatedAt || 0) + 1) }));
    globalThis.dispatchEvent?.(new Event("learning-progress-changed"));
  }
};
