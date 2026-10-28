// Client compatibility with the proposed Firestore schema. Never store credentials.
export const ACCOUNT_LIMITS = Object.freeze({word:256, submission:10000, progress:500000, entries:10000, history:40});
const fail = message => { const error = new Error(message); error.code = "account/validation"; throw error; };
// Match the deployed Rules engine's string-size units (including surrogate
// pairs), rather than counting Unicode code points differently from Rules.
export const textLength = value => value.length;
function text(value, maximum, label, required = false) {
  if (typeof value !== "string" || (required && !value.trim()) || textLength(value) > maximum) {
    fail(`${label} must be ${required ? "nonempty and " : ""}at most ${maximum.toLocaleString("en-US")} characters. Your text has not been shortened.`);
  }
}
export function validateSubmission(kind, payload) {
  text(payload?.word, ACCOUNT_LIMITS.word, "Word", true);
  if (kind === "report") text(payload?.wordId, ACCOUNT_LIMITS.word, "Word ID", true);
  text(kind === "report" ? payload?.reason : payload?.message, ACCOUNT_LIMITS.submission,
    kind === "report" ? "Report" : "Suggestion", true);
}
export function validateProgress(records) {
  const keys = ["rw_library_progress_v1", "rw_a1_grammar_challenge_v1", "rw_a1_flashcards_v1", "rw_a1_matching_v1", "rw_a1_listening_v1", "rw_a1_reading_v1", "rw_a1_sentence_builder_v1", "rw_a1_speaking_v1", "rw_a1_dialogues_v1", "rw_a1_mixed_mastery_v1", "rw_daily_plan_v1"];
  if (!records || typeof records !== "object" || Array.isArray(records) || Object.keys(records).some(key => !keys.includes(key))) {
    fail("Learning progress contains an unsupported activity. It has not been changed; contact support before syncing.");
  }
  for (const record of Object.values(records)) {
    if (!record || Object.keys(record).some(key => !["value", "updatedAt"].includes(key))
      || !Number.isFinite(record.updatedAt) || record.updatedAt < 0 || record.updatedAt > Number.MAX_SAFE_INTEGER
      || (record.value !== null && typeof record.value !== "string")) {
      fail("Some learning progress has an unsupported format. It has been kept locally; contact support before syncing it.");
    }
    if (record.value !== null && textLength(record.value) > ACCOUNT_LIMITS.progress) {
      fail("Learning progress exceeds the cloud limit of 500,000 characters per activity. It remains on this device; nothing was truncated. Contact support before syncing this activity.");
    }
  }
}
export function validateProfilePatch(patch) {
  for (const key of ["favorites", "learnedWords", "searchHistory"]) if (key in patch) {
    const maximum = key === "searchHistory" ? ACCOUNT_LIMITS.history : ACCOUNT_LIMITS.entries;
    if (!Array.isArray(patch[key]) || patch[key].length > maximum) fail(`${key} exceeds the supported cloud format or limit. Your local data is retained.`);
  }
  for (const key of ["notes", "reviewSchedule"]) if (key in patch) {
    if (!patch[key] || typeof patch[key] !== "object" || Array.isArray(patch[key])
      || Object.keys(patch[key]).length > ACCOUNT_LIMITS.entries) fail(`${key} exceeds the cloud map limit. Your local data is retained.`);
  }
  if (patch.customLists) {
    if (Object.keys(patch.customLists).some(key => !["myVerbs", "examPrep"].includes(key))) fail("Custom lists contain an unsupported field. Your local data is retained.");
    for (const value of Object.values(patch.customLists)) if (!Array.isArray(value) || value.length > ACCOUNT_LIMITS.entries) fail("A custom list exceeds the cloud limit. Your local data is retained.");
  }
  if (patch.appSettings) {
    const value = patch.appSettings;
    if (Object.keys(value).some(key => !["theme", "textSize", "reducedMotion", "cloudSync"].includes(key))
      || ("theme" in value && !["system", "light", "dark"].includes(value.theme))
      || ("textSize" in value && !["compact", "normal", "large"].includes(value.textSize))
      || ["reducedMotion", "cloudSync"].some(key => key in value && typeof value[key] !== "boolean")) fail("Settings contain an unsupported field or value. Your local settings are retained.");
  }
  if (patch.progressStats) {
    const value = patch.progressStats;
    if (Object.keys(value).some(key => !["wordsOpened", "daysActive", "streak", "lastActiveDate"].includes(key))
      || ["wordsOpened", "daysActive", "streak"].some(key => key in value && (!Number.isInteger(value[key]) || value[key] < 0))) fail("Progress statistics have an unsupported value. Your local data is retained.");
    if ("lastActiveDate" in value) text(value.lastActiveDate, 10, "Activity date");
  }
  if (patch.lastContext) {
    const value = patch.lastContext;
    if (Object.keys(value).some(key => !["category", "section"].includes(key))
      || (value.section != null && (!Number.isInteger(value.section) || value.section < 0))) fail("The saved learning location has an unsupported value. Your local data is retained.");
    if ("category" in value) text(value.category, 128, "Category");
  }
}

const retained = new Map();
const prefix = "rw_pending_account_v1:";
const allowed = new Set(["favorites", "appSettings", "learnedWords", "customLists", "searchHistory", "reviewSchedule", "progressStats", "lastContext", "notes"]);
function store(uid, value) {
  const encoded = JSON.stringify(value);
  retained.set(uid, value);
  try { globalThis.localStorage.setItem(prefix + uid, encoded); return true; }
  catch { globalThis.dispatchEvent?.(new Event("account-storage-unavailable")); return false; }
}
export function pendingAccount(uid) {
  if (retained.has(uid)) return retained.get(uid);
  try { return JSON.parse(globalThis.localStorage?.getItem(prefix + uid) || "{}"); } catch { return {}; }
}
export function retainAccountPatch(uid, patch) {
  const safe = Object.fromEntries(Object.entries(patch).filter(([key]) => allowed.has(key)));
  const pending = pendingAccount(uid);
  const next = {...pending, ...safe};
  if (safe.notes) next.notes = {...pending.notes, ...safe.notes};
  return store(uid, next);
}
export function acknowledgeAccountPatch(uid, patch) {
  const next = {...pendingAccount(uid)};
  for (const [key, value] of Object.entries(patch)) {
    if (key === "notes") {
      next.notes = {...next.notes};
      for (const [id, note] of Object.entries(value)) if (next.notes[id] === note) delete next.notes[id];
      if (!Object.keys(next.notes).length) delete next.notes;
    } else if (JSON.stringify(next[key]) === JSON.stringify(value)) delete next[key];
  }
  store(uid, next);
}
export function withPendingAccount(uid, profile = {}) {
  const pending = pendingAccount(uid), result = {...profile, ...pending};
  result.notes = {...profile.notes, ...pending.notes};
  for (const [id, value] of Object.entries(pending.notes || {})) if (!String(value).trim()) delete result.notes[id];
  return result;
}
export function retainSubmissionDraft(uid, kind, payload) {
  const safe = {word:payload.word || "", ...(kind === "report"
    ? {wordId:payload.wordId || "", reason:payload.reason || ""} : {message:payload.message || ""})};
  return store(`${uid}:draft:${kind}${kind === "report" ? ":" + (payload.wordId || "general") : ""}`, safe);
}
export const submissionDraft = (uid, kind, wordId = "general") => pendingAccount(`${uid}:draft:${kind}${kind === "report" ? ":" + wordId : ""}`);
export function clearSubmissionDraft(uid, kind, payload) {
  const draft = submissionDraft(uid, kind, payload.wordId);
  const field = kind === "report" ? "reason" : "message";
  if (draft[field] === payload[field] && draft.word === payload.word) store(`${uid}:draft:${kind}${kind === "report" ? ":" + (payload.wordId || "general") : ""}`, {});
}
export function accountSaveError(error, label = "Changes") {
  if (error?.code === "account/session-changed") return "The account changed before saving. Reopen the original account to sync its retained changes.";
  if (error?.code === "account/validation") return error.message;
  if (error?.code === "permission-denied") return `${label} could not be saved to the cloud because access or data validation was rejected. Local changes are retained; reconnect and retry, or contact support.`;
  return `${label} could not be saved to the cloud. Local changes are retained; check your connection and retry.`;
}
