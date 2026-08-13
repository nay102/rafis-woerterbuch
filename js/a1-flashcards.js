import {
  A1_FLASHCARDS,
  A1_FLASHCARD_PROGRESS_KEY,
  A1_FLASHCARD_TOPICS,
  getFlashcardCounts,
  readFlashcardProgress,
  validateA1Flashcards
} from "./a1-flashcard-data.js";
import { GermanSpeech } from "./a1-listening.js";

const SESSION_SIZE = 20;
const intervals = {1: 4 * 60 * 60 * 1000, 2: 24 * 60 * 60 * 1000, 3: 3 * 24 * 60 * 60 * 1000, 4: 7 * 24 * 60 * 60 * 1000};
const stateForBox = box => box <= 0 ? "new" : box === 1 ? "learning" : box >= 4 ? "mastered" : "review";
const shuffle = input => {
  const result = [...input];
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
};

const create = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function orderedByTopic(cards) {
  const groups = Object.keys(A1_FLASHCARD_TOPICS).map(topic => shuffle(cards.filter(card => card.topic === topic)));
  const ordered = [];
  while (groups.some(group => group.length)) groups.forEach(group => { if (group.length) ordered.push(group.shift()); });
  return ordered;
}

export function createA1FlashcardSession(bank, records, topic, limit = SESSION_SIZE) {
  const pool = bank.filter(card => topic === "all" || card.topic === topic);
  const now = Date.now();
  const priority = card => {
    const record = records[card.id];
    if (record?.nextReview && new Date(record.nextReview).getTime() <= now) return 0;
    if (record?.state === "learning") return 1;
    if (!record) return 2;
    if (record.state !== "mastered") return 3;
    return 4;
  };
  const selected = [];
  for (let rank = 0; rank <= 4 && selected.length < limit; rank++) {
    const candidates = pool.filter(card => priority(card) === rank && !selected.includes(card));
    selected.push(...(topic === "all" ? orderedByTopic(candidates) : shuffle(candidates)).slice(0, limit - selected.length));
  }
  return shuffle(selected);
}

export function initA1Flashcards(setSharedPage) {
  const $ = id => document.getElementById(id);
  const errors = validateA1Flashcards();
  if (errors.length) {
    console.error("A1 Flashcard data validation failed.", errors);
    $("practiceForm").textContent = "Flashcards are temporarily unavailable because their local vocabulary data could not be validated.";
    $("submitPractice").hidden = true;
    return;
  }

  let progress = readFlashcardProgress();
  const validIds = new Set(A1_FLASHCARDS.map(card => card.id));
  progress.cards = Object.fromEntries(Object.entries(progress.cards || {}).filter(([id]) => validIds.has(id)));
  progress.topicStats ||= {};
  let topic = "all";
  let mode = "german-meaning";
  let showBengali = progress.showBengali !== false;
  let session = [];
  let index = 0;
  let flipped = false;
  let sessionStats = null;
  let difficultIds = [];
  const germanSpeech = new GermanSpeech();

  setSharedPage("A1 Flashcard Trainer", "Think first, flip the card, then rate your recall to build a simple local review schedule.");
  $("questionCount").textContent = `${A1_FLASHCARDS.length} local cards · 20 per session`;
  $("practiceType").textContent = "Vocabulary";
  $("submitPractice").hidden = true;
  $("practiceResult").hidden = true;
  $("practiceResult").setAttribute("aria-live", "polite");
  document.querySelector(".practice-sheet")?.classList.add("flashcard-sheet");
  const help = document.querySelector(".practice-help");
  if (help) {
    help.querySelector("h2").textContent = "Think · Flip · Rate";
    help.querySelector("p").textContent = "After revealing the answer, choose Again, Hard or Good. Your private review schedule stays on this device.";
  }

  function persist() {
    progress.showBengali = showBengali;
    localStorage.setItem(A1_FLASHCARD_PROGRESS_KEY, JSON.stringify(progress));
  }

  function renderControls() {
    const controls = create("section", "flashcard-controls");
    const topicLabel = create("label", "", "Deck");
    const topicSelect = document.createElement("select"); topicSelect.setAttribute("aria-label", "Choose flashcard topic deck");
    const counts = getFlashcardCounts();
    [["all", `All A1 Vocabulary (${A1_FLASHCARDS.length})`], ...Object.entries(A1_FLASHCARD_TOPICS).map(([id, title]) => [id, `${title} (${counts[id]})`])].forEach(([value, label]) => {
      const option = create("option", "", label); option.value = value; option.selected = value === topic;
      option.disabled = mode === "article" && value !== "all" && !A1_FLASHCARDS.some(card => card.topic === value && card.type === "noun" && card.article);
      topicSelect.append(option);
    });
    topicSelect.addEventListener("change", () => { topic = topicSelect.value; startSession(); });
    topicLabel.append(topicSelect);
    const modeLabel = create("label", "", "Mode");
    const modeSelect = document.createElement("select"); modeSelect.setAttribute("aria-label", "Choose flashcard study mode");
    [["german-meaning", "German → Meaning"], ["meaning-german", "Meaning → German"], ["article", "Article Practice"], ["mixed", "Mixed Review"]].forEach(([value, label]) => {
      const option = create("option", "", label); option.value = value; option.selected = value === mode; modeSelect.append(option);
    });
    modeSelect.addEventListener("change", () => { mode = modeSelect.value; if (mode === "article" && topic !== "all" && !A1_FLASHCARDS.some(card => card.topic === topic && card.type === "noun" && card.article)) topic = "all"; startSession(); });
    modeLabel.append(modeSelect);
    const bengali = create("button", "flashcard-toggle", `বাংলা meanings: ${showBengali ? "On" : "Off"}`);
    bengali.type = "button"; bengali.setAttribute("aria-pressed", String(showBengali));
    bengali.addEventListener("click", () => { showBengali = !showBengali; persist(); renderActive(); });
    controls.append(topicLabel, modeLabel, bengali);
    return controls;
  }

  function taskFor(card) {
    if (mode !== "mixed") return mode;
    const available = ["german-meaning", "meaning-german"];
    if (card.type === "noun" && card.article) available.push("article");
    return available[Math.floor(Math.random() * available.length)];
  }

  function startSession(customCards = null, difficult = false) {
    const eligible = mode === "article" ? A1_FLASHCARDS.filter(card => card.type === "noun" && card.article) : A1_FLASHCARDS;
    const cards = customCards || createA1FlashcardSession(eligible, progress.cards, topic, SESSION_SIZE);
    session = cards.map(card => ({...card, task: taskFor(card), startedNew: !progress.cards[card.id]}));
    index = 0; flipped = false;
    sessionStats = {again: 0, hard: 0, good: 0, newCards: session.filter(card => card.startedNew).length, reviewCards: session.filter(card => !card.startedNew).length, difficult};
    difficultIds = [];
    $("practiceResult").hidden = true;
    $("practiceForm").hidden = false;
    renderActive();
  }

  function frontContent(card, task) {
    const box = create("div", "flashcard-front-content");
    const badge = create("span", "flashcard-task-badge", task === "article" ? "Article" : task === "meaning-german" ? "German" : "Meaning");
    box.append(badge);
    if (task === "meaning-german") {
      box.append(create("strong", "flashcard-main", card.english || card.bengali));
      if (showBengali && card.bengali && card.english) { const bn = create("span", "flashcard-bengali", card.bengali); bn.lang = "bn"; box.append(bn); }
      box.append(create("small", "", "What is this in German?"));
    } else if (task === "article") {
      const german = create("strong", "flashcard-main", `___ ${card.word}`); german.lang = "de"; box.append(german, create("small", "", "Which article belongs to this noun?"));
    } else {
      const german = create("strong", "flashcard-main", card.german); german.lang = "de"; box.append(german, create("small", "", "Do you remember the meaning?"));
    }
    return box;
  }

  function backContent(card) {
    const box = create("div", "flashcard-back-content");
    const german = create("strong", "flashcard-main", card.german); german.lang = "de"; box.append(german);
    if (card.article) box.append(create("span", `article-badge article-${card.article}`, card.article));
    if (card.english) box.append(create("p", "", `English: ${card.english}`));
    if (showBengali && card.bengali) { const bn = create("p", "flashcard-bengali", `বাংলা: ${card.bengali}`); bn.lang = "bn"; box.append(bn); }
    if (card.plural) { const plural = create("p", "", `Plural: ${card.plural}`); plural.lang = "de"; box.append(plural); }
    if (card.example) { const example = create("p", "flashcard-example", `Example: ${card.example}`); example.lang = "de"; box.append(example); }
    if ("speechSynthesis" in window) {
      const play = create("button", "flashcard-play", "🔊 Play German"); play.type = "button";
      play.addEventListener("click", event => { event.stopPropagation(); germanSpeech.play({speech: card.german}, .82); });
      box.append(play);
    }
    return box;
  }

  function flipCard() {
    if (flipped || !session[index]) return;
    flipped = true; renderActive();
    const live = document.querySelector(".flashcard-live"); if (live) live.textContent = "Answer revealed. Rate your recall: Again, Hard or Good.";
  }

  function rateCard(rating) {
    if (!flipped) return;
    const card = session[index], old = progress.cards[card.id] || {box: 0, againCount: 0, hardCount: 0, goodCount: 0};
    let box = old.box || 0;
    if (rating === "again") box = 1;
    else if (rating === "hard") box = Math.max(1, box);
    else box = Math.min(4, Math.max(1, box + 1));
    const now = new Date();
    progress.cards[card.id] = {
      box, state: stateForBox(box),
      againCount: (old.againCount || 0) + (rating === "again" ? 1 : 0),
      hardCount: (old.hardCount || 0) + (rating === "hard" ? 1 : 0),
      goodCount: (old.goodCount || 0) + (rating === "good" ? 1 : 0),
      lastReviewed: now.toISOString(), nextReview: new Date(now.getTime() + intervals[box]).toISOString()
    };
    const topicStats = progress.topicStats[card.topic] || {reviewed: 0, again: 0, hard: 0, good: 0};
    progress.topicStats[card.topic] = {...topicStats, reviewed: (topicStats.reviewed || 0) + 1, [rating]: (topicStats[rating] || 0) + 1};
    sessionStats[rating]++;
    if (rating === "again" || rating === "hard") difficultIds.push(card.id);
    progress.totalCardsReviewed = (progress.totalCardsReviewed || 0) + 1;
    progress.lastActivity = now.toISOString(); persist();
    index++; flipped = false;
    if (index >= session.length) completeSession(); else renderActive();
  }

  function renderActive() {
    if (!session.length) return completeSession();
    const card = session[index];
    const form = $("practiceForm"); form.replaceChildren(renderControls());
    const sessionHeader = create("div", "flashcard-session-header");
    sessionHeader.append(create("span", "", `${index + 1} / ${session.length}`), create("span", "", `Good ${sessionStats.good} · Hard ${sessionStats.hard} · Again ${sessionStats.again}`));
    const track = create("div", "progress-track"); const fill = create("i"); fill.style.width = `${index / session.length * 100}%`; track.append(fill);
    const surface = create("div", `flashcard-surface${flipped ? " is-flipped" : ""}`); surface.setAttribute("aria-label", flipped ? "Flashcard answer shown" : "Flip flashcard to reveal answer");
    surface.append(create("span", "flashcard-topic", card.topicTitle), flipped ? backContent(card) : frontContent(card, card.task));
    if (!flipped) {
      surface.setAttribute("role", "button"); surface.tabIndex = 0;
      surface.addEventListener("click", flipCard);
      surface.addEventListener("keydown", event => { if (event.key === "Enter" || event.code === "Space") { event.preventDefault(); flipCard(); } });
    }
    form.append(sessionHeader, track, surface);
    if (!flipped) {
      const flip = create("button", "flashcard-flip", "Flip Card"); flip.type = "button"; flip.addEventListener("click", flipCard); form.append(flip);
    } else {
      const ratings = create("div", "flashcard-ratings");
      [["again", "Again", "I did not remember it"], ["hard", "Hard", "I remembered it with difficulty"], ["good", "Good", "I remembered it confidently"]].forEach(([value, label, title]) => {
        const button = create("button", `rating-${value}`, label); button.type = "button"; button.title = title; button.setAttribute("aria-label", `${label}: ${title}`); button.addEventListener("click", () => rateCard(value)); ratings.append(button);
      });
      form.append(ratings);
    }
    const live = create("p", "flashcard-live"); live.setAttribute("aria-live", "polite"); form.append(live);
    $("answeredCount").textContent = `${index} of ${session.length} reviewed`;
    $("progressFill").style.width = `${index / session.length * 100}%`;
  }

  function vocabularyTotals() {
    const values = Object.values(progress.cards);
    return {new: A1_FLASHCARDS.length - values.length, learning: values.filter(record => record.state === "learning").length, review: values.filter(record => record.state === "review").length, mastered: values.filter(record => record.state === "mastered").length};
  }

  function weakTopic() {
    const ranked = Object.entries(progress.topicStats).filter(([, stat]) => stat.reviewed >= 5)
      .map(([id, stat]) => [id, ((stat.again || 0) * 2 + (stat.hard || 0)) / stat.reviewed])
      .sort((a, b) => b[1] - a[1]);
    return ranked[0]?.[1] >= .4 ? ranked[0][0] : "";
  }

  function completeSession() {
    progress.totalSessions = (progress.totalSessions || 0) + 1; persist();
    $("practiceForm").hidden = true;
    const result = $("practiceResult"); result.hidden = false; result.replaceChildren(create("span", "", "Session Complete"), create("strong", "", `${session.length} cards reviewed`));
    const summary = create("div", "flashcard-complete-grid");
    [["Good", sessionStats.good], ["Hard", sessionStats.hard], ["Again", sessionStats.again], ["New cards", sessionStats.newCards], ["Review cards", sessionStats.reviewCards]].forEach(([label, value]) => { const item = create("div"); item.append(create("strong", "", String(value)), create("span", "", label)); summary.append(item); });
    const totals = vocabularyTotals();
    const progressGrid = create("div", "flashcard-vocabulary-progress");
    progressGrid.append(create("h2", "", "Vocabulary Progress"));
    [["New", totals.new], ["Learning", totals.learning], ["Review", totals.review], ["Mastered", totals.mastered]].forEach(([label, value]) => progressGrid.append(create("p", "", `${label}: ${value}`)));
    const weak = weakTopic();
    if (weak) { const link = create("a", "challenge-topic-link", `Review ${A1_FLASHCARD_TOPICS[weak]} →`); link.href = `../library-topic/?level=A1&topic=${weak}`; progressGrid.append(link); }
    const actions = create("div", "flashcard-complete-actions");
    const difficultCards = [...new Set(difficultIds)].map(id => A1_FLASHCARDS.find(card => card.id === id)).filter(Boolean).slice(0, 10);
    const difficult = create("button", "", "Review Difficult Cards"); difficult.type = "button"; difficult.disabled = !difficultCards.length; difficult.addEventListener("click", () => startSession(difficultCards, true));
    const another = create("button", "", "Start Another Session"); another.type = "button"; another.addEventListener("click", () => startSession());
    const choose = create("button", "", "Choose Another Topic"); choose.type = "button"; choose.addEventListener("click", () => { topic = "all"; startSession(); });
    const back = create("a", "challenge-back-link", "Back to Practice Center"); back.href = "../a1/#exercises";
    actions.append(difficult, another, choose, back);
    const reset = create("button", "flashcard-reset", "Reset Flashcard Progress"); reset.type = "button";
    reset.addEventListener("click", () => { if (!confirm("Reset only your A1 Flashcard Trainer progress? Other learning progress will not be changed.")) return; localStorage.removeItem(A1_FLASHCARD_PROGRESS_KEY); progress = {cards: {}, topicStats: {}}; startSession(); });
    result.append(summary, progressGrid, actions, reset);
    result.scrollIntoView({behavior: "smooth", block: "start"});
  }

  document.addEventListener("keydown", event => {
    if (event.target instanceof Element && event.target.closest("button, a, input, select, textarea, [role='button']")) return;
    if (!$("practiceForm").hidden && (event.code === "Space" || event.key === "Enter") && !flipped) { event.preventDefault(); flipCard(); }
    else if (flipped && ["1", "2", "3"].includes(event.key)) rateCard({"1": "again", "2": "hard", "3": "good"}[event.key]);
  });
  addEventListener("pagehide", () => germanSpeech.cancel(), {once: true});
  startSession();
}
