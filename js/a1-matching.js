import { A1_FLASHCARDS, A1_FLASHCARD_TOPICS } from "./a1-flashcard-data.js";

export const A1_MATCHING_PROGRESS_KEY = "rw_a1_matching_v1";
const PAIRS_PER_ROUND = 8;
const STANDARD_ROUNDS = 3;
const shuffle = input => {
  const result = [...input];
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
};
const normalized = value => String(value || "").trim().toLocaleLowerCase();
const create = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

export function getA1MatchableCards(language = "english", topic = "all") {
  return A1_FLASHCARDS.filter(card => (topic === "all" || card.topic === topic) && card.german && card[language]);
}

function balancedCandidates(cards) {
  const groups = Object.keys(A1_FLASHCARD_TOPICS).map(topic => shuffle(cards.filter(card => card.topic === topic)));
  const ordered = [];
  while (groups.some(group => group.length)) groups.forEach(group => { if (group.length) ordered.push(group.shift()); });
  return ordered;
}

export function createA1MatchingRound({language = "english", topic = "all", excludedIds = [], itemStats = {}, preferredIds = [], limit = PAIRS_PER_ROUND} = {}) {
  const excluded = new Set(excludedIds), preferred = new Set(preferredIds);
  const pool = getA1MatchableCards(language, topic);
  const difficulty = card => {
    const stat = itemStats[card.id] || {};
    return (stat.wrongAttempts || 0) * 3 + (stat.hints || 0) * 2 + (stat.assisted || 0) * 4;
  };
  const arrange = cards => topic === "all" ? balancedCandidates(cards) : shuffle(cards);
  const tiers = [
    arrange(pool.filter(card => preferred.has(card.id) && !excluded.has(card.id)).sort((a, b) => difficulty(b) - difficulty(a))),
    arrange(pool.filter(card => !preferred.has(card.id) && !excluded.has(card.id)).sort((a, b) => difficulty(b) - difficulty(a))),
    arrange(pool.filter(card => excluded.has(card.id)).sort((a, b) => difficulty(b) - difficulty(a)))
  ];
  const selected = [], germanSeen = new Set(), meaningSeen = new Set();
  for (const card of tiers.flat()) {
    const germanKey = normalized(card.german), meaningKey = normalized(card[language]);
    if (!germanKey || !meaningKey || selected.some(item => item.id === card.id) || germanSeen.has(germanKey) || meaningSeen.has(meaningKey)) continue;
    germanSeen.add(germanKey); meaningSeen.add(meaningKey); selected.push(card);
    if (selected.length === limit) break;
  }
  const left = shuffle(selected);
  let right = shuffle(selected.map(card => ({id: card.id, meaning: card[language]})));
  if (right.length > 1 && right.every((item, index) => item.id === left[index]?.id)) right = [...right.slice(1), right[0]];
  return {left, right, language};
}

export function validateA1MatchingPool() {
  const errors = [], ids = new Set();
  A1_FLASHCARDS.forEach(card => {
    if (!card.id || ids.has(card.id)) errors.push(`Duplicate or missing ID: ${card.id || "unknown"}`);
    ids.add(card.id);
    if (!A1_FLASHCARD_TOPICS[card.topic] || !card.german || (!card.english && !card.bengali)) errors.push(`Invalid matchable card: ${card.id}`);
    if (Object.values(card).some(value => value === undefined || value === null || String(value) === "[object Object]")) errors.push(`Invalid visible value: ${card.id}`);
  });
  return errors;
}

function readProgress() {
  try { return JSON.parse(localStorage.getItem(A1_MATCHING_PROGRESS_KEY) || "null") || {}; }
  catch { return {}; }
}

export function updateMatchingCard() {
  const card = document.querySelector("[data-a1-matching]");
  if (!card) return;
  const count = card.querySelector("[data-matching-count]");
  if (count) count.textContent = `${A1_FLASHCARDS.length} Vocabulary Items`;
  const status = card.querySelector("[data-matching-status]");
  if (!status) return;
  const progress = readProgress();
  const difficult = Object.values(progress.itemStats || {}).filter(stat => (stat.wrongAttempts || 0) + (stat.hints || 0) + (stat.assisted || 0) > 0).length;
  status.textContent = progress.sessionsCompleted ? (difficult ? `${difficult} Difficult Words` : `${progress.sessionsCompleted} Sessions Completed`) : "Not Started";
}

export function initA1Matching(setSharedPage) {
  const $ = id => document.getElementById(id);
  const validationErrors = validateA1MatchingPool();
  if (validationErrors.length) {
    console.error("A1 matching data validation failed.", validationErrors);
    $("practiceForm").textContent = "Matching is temporarily unavailable because its local vocabulary data could not be validated.";
    $("submitPractice").hidden = true;
    return;
  }
  let progress = readProgress();
  const validIds = new Set(A1_FLASHCARDS.map(card => card.id));
  progress.itemStats = Object.fromEntries(Object.entries(progress.itemStats || {}).filter(([id]) => validIds.has(id)));
  progress.topicStats ||= {};
  let topic = "all", language = "english", roundNumber = 1, targetRounds = STANDARD_ROUNDS;
  let usedIds = [], currentRound, selectedGerman = "", selectedMeaning = "", matched = new Set();
  let failedById = {}, hintLevelById = {}, assisted = new Set();
  let roundStats, sessionStats, difficultThisSession = new Set();

  setSharedPage("A1 Match the Words", "Select one German item and its matching meaning. Correct pairs lock; incorrect attempts remain available for another try.");
  $("practiceType").textContent = "Vocabulary";
  $("questionCount").textContent = `${A1_FLASHCARDS.length} local vocabulary items · 8 pairs × 3 rounds`;
  $("submitPractice").hidden = true;
  $("practiceResult").setAttribute("aria-live", "polite");
  document.querySelector(".practice-sheet")?.classList.add("matching-sheet");
  const help = document.querySelector(".practice-help");
  if (help) { help.querySelector("h2").textContent = "Select two matching tiles"; help.querySelector("p").textContent = "Choose a German item, then choose its meaning. Use Hint when needed; after repeated difficulty, Show Match becomes available."; }

  const persist = () => {
    progress.lastActivity = new Date().toISOString();
    localStorage.setItem(A1_MATCHING_PROGRESS_KEY, JSON.stringify(progress));
  };
  const meaningFor = id => currentRound.right.find(item => item.id === id)?.meaning || "";
  const cardFor = id => A1_FLASHCARDS.find(card => card.id === id);

  function renderControls() {
    const controls = create("section", "matching-controls");
    const deckLabel = create("label", "", "Deck");
    const deck = document.createElement("select"); deck.setAttribute("aria-label", "Choose matching topic deck");
    [["all", "All A1 Vocabulary"], ...Object.entries(A1_FLASHCARD_TOPICS)].forEach(([value, label]) => { const option = create("option", "", label); option.value = value; option.selected = topic === value; deck.append(option); });
    deck.addEventListener("change", () => { topic = deck.value; startSession(); }); deckLabel.append(deck);
    const languageLabel = create("label", "", "Language");
    const languageSelect = document.createElement("select"); languageSelect.setAttribute("aria-label", "Choose matching language");
    [["english", "German ↔ English"], ["bengali", "German ↔ বাংলা"]].forEach(([value, label]) => { const option = create("option", "", label); option.value = value; option.selected = language === value; languageSelect.append(option); });
    languageSelect.addEventListener("change", () => { language = languageSelect.value; startSession(); }); languageLabel.append(languageSelect);
    controls.append(deckLabel, languageLabel); return controls;
  }

  function updateTopProgress() {
    const count = matched.size;
    $("answeredCount").textContent = `Round ${roundNumber} of ${targetRounds} · ${count} of ${currentRound.left.length} matched`;
    $("progressFill").style.width = `${currentRound.left.length ? count / currentRound.left.length * 100 : 0}%`;
  }

  function updateStat(id, changes) {
    const old = progress.itemStats[id] || {attempts: 0, successfulMatches: 0, wrongAttempts: 0, hints: 0, assisted: 0};
    progress.itemStats[id] = Object.fromEntries(Object.entries({...old, ...changes}).filter(([, value]) => value !== undefined));
  }

  function recordTopic(card, kind) {
    const old = progress.topicStats[card.topic] || {attempts: 0, independent: 0, wrongAttempts: 0, hints: 0, assisted: 0};
    const next = {...old};
    if (kind === "attempt") next.attempts = (old.attempts || 0) + 1;
    else next[kind] = (old[kind] || 0) + 1;
    progress.topicStats[card.topic] = next;
  }

  function selectTile(side, id) {
    if (matched.has(id)) return;
    if (side === "german") selectedGerman = selectedGerman === id ? "" : id;
    else selectedMeaning = selectedMeaning === id ? "" : id;
    if (selectedGerman && selectedMeaning) checkSelection(); else renderRound();
  }

  function checkSelection() {
    const germanId = selectedGerman, meaningId = selectedMeaning;
    if (germanId === meaningId) {
      completeMatch(germanId, false);
      return;
    }
    roundStats.wrong++; sessionStats.wrong++;
    [germanId, meaningId].forEach(id => {
      const old = progress.itemStats[id] || {};
      updateStat(id, {wrongAttempts: (old.wrongAttempts || 0) + 1});
      const card = cardFor(id); if (card) recordTopic(card, "wrongAttempts");
      difficultThisSession.add(id);
    });
    failedById[germanId] = (failedById[germanId] || 0) + 1;
    const wrongGerman = germanId, wrongMeaning = meaningId;
    selectedGerman = ""; selectedMeaning = ""; persist(); renderRound();
    document.querySelector(`[data-german-id="${CSS.escape(wrongGerman)}"]`)?.classList.add("is-incorrect");
    document.querySelector(`[data-meaning-id="${CSS.escape(wrongMeaning)}"]`)?.classList.add("is-incorrect");
    announce("Not a match. Try again.");
  }

  function completeMatch(id, wasAssisted) {
    const card = cardFor(id), old = progress.itemStats[id] || {};
    matched.add(id); selectedGerman = ""; selectedMeaning = "";
    if (wasAssisted) { assisted.add(id); roundStats.assisted++; sessionStats.assisted++; updateStat(id, {attempts: (old.attempts || 0) + 1, assisted: (old.assisted || 0) + 1, lastPractised: new Date().toISOString()}); recordTopic(card, "assisted"); difficultThisSession.add(id); }
    else { roundStats.independent++; sessionStats.independent++; updateStat(id, {attempts: (old.attempts || 0) + 1, successfulMatches: (old.successfulMatches || 0) + 1, lastPractised: new Date().toISOString()}); recordTopic(card, "independent"); }
    recordTopic(card, "attempt"); progress.pairsPractised = (progress.pairsPractised || 0) + 1; persist(); renderRound();
    announce(`${wasAssisted ? "Match shown" : "Correct match"}. ${card.german} equals ${card[language]}. ${matched.size} of ${currentRound.left.length} pairs matched.`);
    if (matched.size === currentRound.left.length) setTimeout(showRoundSummary, 250);
  }

  function useHint() {
    if (!selectedGerman) { announce("Select a German item before using a hint."); return; }
    const id = selectedGerman, card = cardFor(id), level = (hintLevelById[id] || 0) + 1;
    hintLevelById[id] = level; roundStats.hints++; sessionStats.hints++; difficultThisSession.add(id);
    const old = progress.itemStats[id] || {}; updateStat(id, {hints: (old.hints || 0) + 1}); recordTopic(card, "hints"); persist();
    const hint = level === 1 ? `Topic: ${card.topicTitle}` : `Meaning starts: ${String(card[language]).split(/\s+/).map(word => `${word.charAt(0)}…`).join(" ")}`;
    renderRound(); const output = document.querySelector(".matching-hint-output"); if (output) output.textContent = hint; announce(hint);
  }

  function showSelectedMatch() {
    if (!selectedGerman || (failedById[selectedGerman] || 0) < 2) return;
    completeMatch(selectedGerman, true);
  }

  function announce(message) {
    const live = document.querySelector(".matching-live"); if (live) live.textContent = message;
  }

  function renderRound() {
    const form = $("practiceForm"); form.replaceChildren(renderControls());
    if (!currentRound.left.length) {
      const empty = create("section", "matching-empty");
      empty.append(create("h2", "", "Not enough matching items are available for this deck."), create("p", "", language === "bengali" ? "Switch to English or choose another topic." : "Choose another topic."));
      const english = create("button", "challenge-primary", "Switch to English"); english.type = "button"; english.addEventListener("click", () => { language = "english"; startSession(); }); empty.append(english); form.append(empty); return;
    }
    const header = create("div", "matching-round-header");
    header.append(create("strong", "", `Round ${roundNumber} of ${targetRounds}`), create("span", "", `${matched.size} / ${currentRound.left.length} matches`), create("span", "", `Mistakes ${roundStats.wrong} · Hints ${roundStats.hints}`));
    const track = create("div", "progress-track"); const fill = create("i"); fill.style.width = `${matched.size / currentRound.left.length * 100}%`; track.append(fill);
    const board = create("div", "matching-board");
    const left = create("section", "matching-column"); left.append(create("h2", "", "German"));
    currentRound.left.forEach(card => {
      const button = create("button", `matching-tile german-tile${selectedGerman === card.id ? " is-selected" : ""}${matched.has(card.id) ? " is-matched" : ""}`, `${matched.has(card.id) ? "✓ " : ""}${card.german}`);
      button.type = "button"; button.dataset.germanId = card.id; button.disabled = matched.has(card.id); button.lang = "de"; button.setAttribute("aria-label", `German item: ${card.german}${matched.has(card.id) ? ", matched" : ""}`); button.addEventListener("click", () => selectTile("german", card.id)); left.append(button);
    });
    const right = create("section", "matching-column"); right.append(create("h2", "", language === "bengali" ? "বাংলা meaning" : "English meaning"));
    currentRound.right.forEach(item => {
      const button = create("button", `matching-tile meaning-tile${selectedMeaning === item.id ? " is-selected" : ""}${matched.has(item.id) ? " is-matched" : ""}`, `${matched.has(item.id) ? "✓ " : ""}${item.meaning}`);
      button.type = "button"; button.dataset.meaningId = item.id; button.disabled = matched.has(item.id); if (language === "bengali") button.lang = "bn"; button.setAttribute("aria-label", `Meaning option: ${item.meaning}${matched.has(item.id) ? ", matched" : ""}`); button.addEventListener("click", () => selectTile("meaning", item.id)); right.append(button);
    });
    board.append(left, right);
    const tools = create("div", "matching-tools");
    const hint = create("button", "challenge-secondary", "Hint"); hint.type = "button"; hint.addEventListener("click", useHint);
    const show = create("button", "challenge-secondary", "Show Match"); show.type = "button"; show.disabled = !selectedGerman || (failedById[selectedGerman] || 0) < 2; show.addEventListener("click", showSelectedMatch);
    tools.append(hint, show, create("span", "matching-hint-output", selectedGerman && hintLevelById[selectedGerman] ? (hintLevelById[selectedGerman] === 1 ? `Topic: ${cardFor(selectedGerman).topicTitle}` : `Meaning starts: ${String(cardFor(selectedGerman)[language]).split(/\s+/).map(word => `${word.charAt(0)}…`).join(" ")}`) : ""));
    const live = create("p", "matching-live"); live.setAttribute("aria-live", "polite");
    form.append(header, track, board, tools, live); updateTopProgress();
  }

  function beginRound() {
    const preferred = Object.entries(progress.itemStats).filter(([, stat]) => (stat.wrongAttempts || 0) + (stat.hints || 0) + (stat.assisted || 0) > 0).map(([id]) => id);
    currentRound = createA1MatchingRound({language, topic, excludedIds: usedIds, itemStats: progress.itemStats, preferredIds: preferred});
    usedIds.push(...currentRound.left.map(card => card.id)); matched = new Set(); selectedGerman = ""; selectedMeaning = ""; failedById = {}; hintLevelById = {}; assisted = new Set();
    roundStats = {independent: 0, assisted: 0, wrong: 0, hints: 0}; renderRound();
  }

  function startSession(customIds = null) {
    roundNumber = 1; targetRounds = customIds ? 1 : STANDARD_ROUNDS; usedIds = customIds ? [] : [...(progress.lastSessionIds || [])];
    sessionStats = {independent: 0, assisted: 0, wrong: 0, hints: 0, topics: new Set(), difficult: Boolean(customIds)}; difficultThisSession = new Set();
    if (customIds) {
      const preferred = customIds.filter(id => validIds.has(id));
      currentRound = createA1MatchingRound({language, topic: "all", itemStats: progress.itemStats, preferredIds: preferred, limit: Math.min(8, preferred.length)});
      currentRound.left = currentRound.left.filter(card => preferred.includes(card.id)); currentRound.right = currentRound.right.filter(item => currentRound.left.some(card => card.id === item.id));
      usedIds = currentRound.left.map(card => card.id); matched = new Set(); selectedGerman = ""; selectedMeaning = ""; failedById = {}; hintLevelById = {}; assisted = new Set(); roundStats = {independent: 0, assisted: 0, wrong: 0, hints: 0};
      $("practiceResult").hidden = true; $("practiceForm").hidden = false; renderRound(); return;
    }
    $("practiceResult").hidden = true; $("practiceForm").hidden = false; beginRound();
  }

  function showRoundSummary() {
    progress.roundsCompleted = (progress.roundsCompleted || 0) + 1; persist();
    currentRound.left.forEach(card => sessionStats.topics.add(card.topic));
    const form = $("practiceForm"); form.replaceChildren();
    const summary = create("section", "matching-round-summary"); summary.append(create("span", "", `Round ${roundNumber} Complete`), create("strong", "", `${currentRound.left.length} pairs matched`), create("p", "", `Independent: ${roundStats.independent} · Assisted: ${roundStats.assisted} · Mistakes: ${roundStats.wrong} · Hints: ${roundStats.hints}`));
    const next = create("button", "challenge-primary", roundNumber < targetRounds ? "Next Round →" : "View Session Summary"); next.type = "button";
    next.addEventListener("click", () => { if (roundNumber < targetRounds) { roundNumber++; beginRound(); } else showSessionSummary(); }); summary.append(next); form.append(summary);
  }

  function weakTopics() {
    return Object.entries(progress.topicStats).filter(([, stat]) => stat.attempts >= 5).map(([id, stat]) => ({id, signal: ((stat.wrongAttempts || 0) * 2 + (stat.hints || 0) + (stat.assisted || 0) * 2) / stat.attempts})).sort((a, b) => b.signal - a.signal);
  }

  function showSessionSummary() {
    progress.sessionsCompleted = (progress.sessionsCompleted || 0) + 1;
    progress.independentMatches = (progress.independentMatches || 0) + sessionStats.independent;
    progress.assistedMatches = (progress.assistedMatches || 0) + sessionStats.assisted;
    progress.wrongAttempts = (progress.wrongAttempts || 0) + sessionStats.wrong;
    progress.hintsUsed = (progress.hintsUsed || 0) + sessionStats.hints;
    progress.lastSessionIds = usedIds.slice(-24); persist();
    $("practiceForm").hidden = true;
    const result = $("practiceResult"); result.hidden = false; result.replaceChildren(create("span", "", "Matching Session Complete"), create("strong", "", `${sessionStats.independent + sessionStats.assisted} pairs completed`));
    const stats = create("div", "matching-summary-grid");
    [["Independent", sessionStats.independent], ["Assisted", sessionStats.assisted], ["Wrong attempts", sessionStats.wrong], ["Hints used", sessionStats.hints], ["Topics practised", sessionStats.topics.size]].forEach(([label, value]) => { const item = create("div"); item.append(create("strong", "", String(value)), create("span", "", label)); stats.append(item); });
    const topics = weakTopics(), area = create("div", "matching-topic-summary");
    const needs = topics.filter(item => item.signal >= .5).slice(0, 3).map(item => A1_FLASHCARD_TOPICS[item.id]);
    const strong = topics.filter(item => item.signal < .5).slice(-3).map(item => A1_FLASHCARD_TOPICS[item.id]);
    area.append(create("p", "", `Strong Topics: ${strong.join(", ") || "Keep practising to build history"}`), create("p", "", `Needs More Practice: ${needs.join(", ") || "No persistent weak topic yet"}`));
    const actions = create("div", "matching-summary-actions");
    const difficultIds = [...difficultThisSession].slice(0, 8);
    const difficult = create("button", "", "Practice Difficult Words"); difficult.type = "button"; difficult.disabled = !difficultIds.length; difficult.addEventListener("click", () => startSession(difficultIds));
    const again = create("button", "", "New Matching Session"); again.type = "button"; again.addEventListener("click", () => startSession());
    const choose = create("button", "", "Choose Topic"); choose.type = "button"; choose.addEventListener("click", () => { topic = "all"; startSession(); setTimeout(() => document.querySelector(".matching-controls select")?.focus(), 0); });
    const back = create("a", "challenge-back-link", "Back to Practice Center"); back.href = "../a1/#exercises";
    actions.append(difficult, again, choose, back); result.append(stats, area, actions); result.scrollIntoView({behavior: "smooth", block: "start"});
  }

  startSession();
}
