import { A1_LISTENING_PROGRESS_KEY, A1_LISTENING_SKILLS, A1_LISTENING_TASKS, validateA1ListeningBank } from "./a1-listening-data.js";

const shuffle = input => { const result = [...input]; for (let index = result.length - 1; index > 0; index--) { const target = Math.floor(Math.random() * (index + 1)); [result[index], result[target]] = [result[target], result[index]]; } return result; };
const create = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
const readProgress = () => { try { return JSON.parse(localStorage.getItem(A1_LISTENING_PROGRESS_KEY) || "null") || {}; } catch { return {}; } };

function withShuffledOptions(task) {
  const correct = task.options[task.answer], options = shuffle(task.options);
  return {...task, options, answer: options.indexOf(correct)};
}

export function createA1ListeningSession(previousIds = [], skills = null, limit = 12) {
  const previous = new Set(previousIds), selected = [];
  const activeSkills = skills?.length ? skills : Object.keys(A1_LISTENING_SKILLS);
  const quota = skills?.length ? Math.ceil(limit / activeSkills.length) : 2;
  activeSkills.forEach(skill => {
    const pool = A1_LISTENING_TASKS.filter(item => item.skill === skill);
    const fresh = shuffle(pool.filter(item => !previous.has(item.id)));
    const fallback = shuffle(pool.filter(item => previous.has(item.id)));
    selected.push(...[...fresh, ...fallback].slice(0, quota));
  });
  if (selected.length < limit) selected.push(...shuffle(A1_LISTENING_TASKS.filter(item => activeSkills.includes(item.skill) && !selected.some(chosen => chosen.id === item.id))).slice(0, limit - selected.length));
  return shuffle(selected.slice(0, limit)).map(withShuffledOptions);
}

export class GermanSpeech {
  constructor(onState) {
    this.onState = onState; this.voice = null; this.playToken = 0;
    this.refreshVoices();
    if ("speechSynthesis" in window) {
      if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", () => this.refreshVoices());
      else speechSynthesis.onvoiceschanged = () => this.refreshVoices();
    }
  }
  refreshVoices() {
    if (!("speechSynthesis" in window)) return null;
    const voices = speechSynthesis.getVoices();
    this.voice = voices.find(voice => voice.lang?.toLowerCase() === "de-de") || voices.find(voice => voice.lang?.toLowerCase().startsWith("de")) || null;
    return this.voice;
  }
  cancel() { this.playToken++; if ("speechSynthesis" in window) speechSynthesis.cancel(); this.onState?.("idle"); }
  play(task, rate = .94) {
    this.cancel(); if (!this.refreshVoices()) { this.onState?.("unavailable"); return false; }
    const token = ++this.playToken;
    const parts = task.speechParts?.length ? task.speechParts.map(part => part.text) : [task.speech];
    this.onState?.("playing");
    const speakPart = index => {
      if (token !== this.playToken) return;
      if (index >= parts.length) { this.onState?.("idle"); return; }
      const utterance = new SpeechSynthesisUtterance(parts[index]); utterance.lang = "de-DE"; utterance.voice = this.voice; utterance.rate = rate;
      utterance.onend = () => setTimeout(() => speakPart(index + 1), task.speechParts ? 260 : 0);
      utterance.onerror = () => { if (token === this.playToken) this.onState?.("error"); };
      speechSynthesis.speak(utterance);
    };
    speakPart(0); return true;
  }
}

export function updateListeningCard() {
  const card = document.querySelector("[data-a1-listening]"); if (!card) return;
  card.querySelector("[data-listening-count]")?.replaceChildren(document.createTextNode(`${A1_LISTENING_TASKS.length} Audio Tasks · 12 per Session`));
  const status = card.querySelector("[data-listening-status]"); if (!status) return;
  const progress = readProgress(); status.textContent = progress.sessionsCompleted ? `Best: ${progress.bestPercent || 0}%` : "Not Started";
}

export function initA1Listening(setSharedPage) {
  const $ = id => document.getElementById(id);
  const errors = validateA1ListeningBank();
  if (errors.length) { console.error("A1 listening bank validation failed.", errors); $("practiceForm").textContent = "Listening is temporarily unavailable because its local task data could not be validated."; $("submitPractice").hidden = true; return; }
  let progress = readProgress();
  const validTaskIds = new Set(A1_LISTENING_TASKS.map(task => task.id));
  progress.skillStats = Object.fromEntries(Object.entries(progress.skillStats || {}).filter(([skill]) => A1_LISTENING_SKILLS[skill]));
  progress.itemStats = Object.fromEntries(Object.entries(progress.itemStats || {}).filter(([id]) => validTaskIds.has(id)));
  progress.lastSessionIds = Array.isArray(progress.lastSessionIds) ? progress.lastSessionIds.filter(id => validTaskIds.has(id)) : [];
  let session = [], index = 0, selected = null, answered = false, played = 0, currentMode = "balanced", mistakes = [], results = [], audioState = "idle", resultSaved = false;
  const speech = new GermanSpeech(state => { audioState = state; updateAudioStatus(); });
  setSharedPage("A1 Listen & Choose", "Listen carefully and choose the correct answer. The German transcript appears only after you answer.");
  $("practiceType").textContent = "Listening"; $("questionCount").textContent = `${A1_LISTENING_TASKS.length} local audio tasks · 12 per session`; $("submitPractice").hidden = true;
  $("practiceResult").setAttribute("aria-live", "polite"); document.querySelector(".practice-sheet")?.classList.add("listening-sheet");
  const help = document.querySelector(".practice-help"); if (help) { help.querySelector("h2").textContent = "Listen before reading"; help.querySelector("p").textContent = "Play normal or slow German device speech, answer the task, then compare the revealed transcript with what you heard."; help.querySelector("small").textContent = "Audio uses your device/browser's installed German speech voice."; }

  const persist = () => { progress.lastActivity = new Date().toISOString(); localStorage.setItem(A1_LISTENING_PROGRESS_KEY, JSON.stringify(progress)); };
  function updateAudioStatus() {
    const output = document.querySelector(".listening-audio-status");
    if (!output) return;
    output.textContent = audioState === "playing" ? "Playing…" : audioState === "unavailable" ? "German speech is not available on this device/browser." : audioState === "error" ? "Playback could not be completed. Try again." : played ? `Played ${played} time${played === 1 ? "" : "s"}` : "Ready to play";
  }
  function play(rate, slow = false) {
    const task = session[index];
    if (speech.play(task, rate)) {
      played++; progress.replayCount = (progress.replayCount || 0) + (played > 1 ? 1 : 0); progress.slowPlaybackCount = (progress.slowPlaybackCount || 0) + (slow ? 1 : 0);
      const item = progress.itemStats[task.id] || {attempts: 0, correct: 0, replays: 0, slowPlays: 0};
      progress.itemStats[task.id] = {...item, replays: item.replays + (played > 1 ? 1 : 0), slowPlays: item.slowPlays + (slow ? 1 : 0)}; persist();
    }
    updateAudioStatus();
  }
  function statusFor(percent) {
    if (percent >= 80) return ["Strong Listening Round", "Excellent. You understood most of the A1 listening tasks."];
    if (percent >= 60) return ["Good Progress", "Good progress. Review the transcripts for the tasks you missed and practise your weaker listening areas."];
    return ["Keep Listening", "Replay the difficult audio, review the transcripts and focus on one weak listening area before trying another session."];
  }
  function renderStart() {
    const form = $("practiceForm"); form.replaceChildren();
    const start = create("section", "listening-start"); start.append(create("span", "listening-headphones", "🎧"), create("h2", "", "12 Listening Tasks"), create("p", "", "Listen carefully and choose the correct answer. The transcript appears after you answer."), create("small", "", "Audio uses your device/browser's German speech voice. Voice availability depends on your browser and operating system."));
    const button = create("button", "challenge-primary", "Start Listening"); button.type = "button"; button.addEventListener("click", () => startSession()); start.append(button); form.append(start);
    $("answeredCount").textContent = "0 of 12 completed"; $("progressFill").style.width = "0%";
  }
  function startSession(skills = null) {
    currentMode = skills?.length ? "weak" : "balanced"; session = createA1ListeningSession(progress.lastSessionIds || [], skills, skills?.length ? 8 : 12); index = 0; selected = null; answered = false; mistakes = []; results = []; played = 0; resultSaved = false;
    $("practiceResult").hidden = true; $("practiceForm").hidden = false; renderTask();
  }
  function renderTask() {
    speech.cancel(); const task = session[index], form = $("practiceForm"); form.replaceChildren();
    const header = create("div", "listening-task-header"); header.append(create("span", "listening-skill", A1_LISTENING_SKILLS[task.skill].title), create("strong", "", `Listening ${index + 1} of ${session.length}`));
    const track = create("div", "progress-track"); const fill = create("i"); fill.style.width = `${index / session.length * 100}%`; track.append(fill);
    const audio = create("section", `listening-audio${audioState === "playing" ? " is-playing" : ""}`); audio.append(create("span", "listening-headphones", "🎧"));
    const controls = create("div", "listening-audio-controls");
    const normal = create("button", "listen-normal", played ? "↻ Replay" : "▶ Play German"); normal.type = "button"; normal.setAttribute("aria-label", "Play German audio at normal speed"); normal.addEventListener("click", () => play(.94));
    const slow = create("button", "listen-slow", "🐢 Slow"); slow.type = "button"; slow.setAttribute("aria-label", "Play German audio slowly"); slow.addEventListener("click", () => play(.76, true)); controls.append(normal, slow);
    const audioStatus = create("p", "listening-audio-status"); audioStatus.setAttribute("aria-live", "polite"); audio.append(controls, audioStatus);
    const question = create("fieldset", "listening-question"); const legend = create("legend", "", task.promptEn); question.append(legend);
    const bnPrompt = create("p", "listening-prompt-bn", task.promptBn); bnPrompt.lang = "bn"; question.append(bnPrompt);
    const options = create("div", "listening-options"); task.options.forEach((option, optionIndex) => {
      const label = document.createElement("label"), input = document.createElement("input"); input.type = "radio"; input.name = "listening-answer"; input.value = String(optionIndex); input.checked = selected === optionIndex; input.disabled = answered;
      input.addEventListener("change", () => { selected = optionIndex; document.querySelector(".listening-submit").disabled = false; });
      label.append(input, create("span", "", option)); options.append(label);
    }); question.append(options);
    form.append(header, track, audio, question);
    if (!answered) {
      const submit = create("button", "listening-submit", "Submit Answer"); submit.type = "button"; submit.disabled = selected === null; submit.addEventListener("click", submitAnswer); form.append(submit);
    } else form.append(renderFeedback(task));
    updateAudioStatus();
    $("answeredCount").textContent = `${index} of ${session.length} completed`; $("progressFill").style.width = `${index / session.length * 100}%`;
  }
  function submitAnswer() {
    if (selected === null || answered) return;
    const task = session[index], correct = selected === task.answer; answered = true;
    const record = {task, selected, correct}; results.push(record); if (!correct) mistakes.push(record);
    const skill = progress.skillStats[task.skill] || {attempted: 0, correct: 0}; progress.skillStats[task.skill] = {attempted: skill.attempted + 1, correct: skill.correct + (correct ? 1 : 0)};
    const item = progress.itemStats[task.id] || {attempts: 0, correct: 0, replays: 0, slowPlays: 0}; progress.itemStats[task.id] = {...item, attempts: item.attempts + 1, correct: item.correct + (correct ? 1 : 0)};
    progress.tasksAttempted = (progress.tasksAttempted || 0) + 1; progress.correctAnswers = (progress.correctAnswers || 0) + (correct ? 1 : 0); persist(); renderTask();
  }
  function renderFeedback(task) {
    const correct = selected === task.answer, feedback = create("section", `listening-feedback ${correct ? "is-correct" : "is-wrong"}`);
    feedback.append(create("h2", "", correct ? "✓ Correct" : "✕ Not quite"));
    if (!correct) feedback.append(create("p", "", `Your answer: ${task.options[selected]}`), create("p", "listening-correct-answer", `Correct: ${task.options[task.answer]}`));
    const transcriptTitle = create("h3", "", "Transcript"), transcript = create("p", "listening-transcript", task.transcript); transcript.lang = "de";
    const explanation = create("p", "", task.explanationEn), bn = create("p", "listening-explanation-bn", task.explanationBn); bn.lang = "bn";
    const replay = create("button", "listen-normal", "▶ Play Again"); replay.type = "button"; replay.setAttribute("aria-label", "Play German audio again"); replay.addEventListener("click", () => play(.94));
    const slow = create("button", "listen-slow", "🐢 Slow"); slow.type = "button"; slow.addEventListener("click", () => play(.76, true));
    const next = create("button", "challenge-primary", index === session.length - 1 ? "View Results" : "Next Listening Task →"); next.type = "button"; next.addEventListener("click", () => { speech.cancel(); if (index === session.length - 1) showResults(); else { index++; selected = null; answered = false; played = 0; renderTask(); } });
    const controls = create("div", "listening-feedback-controls"); controls.append(replay, slow, next);
    feedback.append(transcriptTitle, transcript, create("h3", "", "Why"), explanation, create("h3", "", "বাংলা"), bn, controls); return feedback;
  }
  function breakdown() {
    return Object.keys(A1_LISTENING_SKILLS).map(skill => { const rows = results.filter(row => row.task.skill === skill); return {skill, total: rows.length, correct: rows.filter(row => row.correct).length}; }).filter(row => row.total);
  }
  function persistentWeakSkills() {
    return Object.entries(progress.skillStats).filter(([, stat]) => stat.attempted >= 4 && stat.correct / stat.attempted < .8).sort((a, b) => a[1].correct / a[1].attempted - b[1].correct / b[1].attempted).slice(0, 2).map(([skill]) => skill);
  }
  function showResults() {
    speech.cancel(); const score = results.filter(row => row.correct).length, percent = Math.round(score / results.length * 100), [status, message] = statusFor(percent);
    if (!resultSaved) { progress.sessionsCompleted = (progress.sessionsCompleted || 0) + 1; progress.bestPercent = Math.max(progress.bestPercent || 0, percent); progress.lastSessionIds = session.map(task => task.id); resultSaved = true; persist(); }
    $("practiceForm").hidden = true; const result = $("practiceResult"); result.hidden = false; result.replaceChildren(create("span", "", currentMode === "weak" ? "Weak Areas Practice Complete" : "Listening Session Complete"), create("strong", "", `${score}/${results.length}`), create("p", "listening-result-label", `${percent}% · ${status}`), create("p", "", message));
    const grid = create("div", "listening-breakdown"); breakdown().forEach(row => { const card = create("div", row.correct / row.total >= .8 ? "is-strong" : "needs-review"); card.append(create("strong", "", A1_LISTENING_SKILLS[row.skill].title), create("span", "", `${row.correct} / ${row.total}`)); grid.append(card); });
    const rows = breakdown(), strong = rows.filter(row => row.correct / row.total >= .8).map(row => A1_LISTENING_SKILLS[row.skill].title), review = rows.filter(row => row.correct / row.total < .8).map(row => A1_LISTENING_SKILLS[row.skill].title);
    const areas = create("div", "listening-areas"); areas.append(create("p", "", `Strong Listening Areas: ${strong.join(", ") || "Keep building"}`), create("p", "", `Needs More Practice: ${review.join(", ") || "None this round"}`));
    const actions = create("div", "listening-result-actions");
    const reviewButton = create("button", "", "Review Listening Mistakes"); reviewButton.type = "button"; reviewButton.disabled = !mistakes.length; reviewButton.addEventListener("click", showMistakes);
    const focusSkills = persistentWeakSkills().length ? persistentWeakSkills() : rows.filter(row => row.correct / row.total < .8).slice(0, 2).map(row => row.skill);
    const weakButton = create("button", "", "Practice Weak Areas"); weakButton.type = "button"; weakButton.disabled = !focusSkills.length; weakButton.addEventListener("click", () => startSession(focusSkills));
    const again = create("button", "", "New Listening Session"); again.type = "button"; again.addEventListener("click", () => startSession());
    const back = create("a", "challenge-back-link", "Back to Practice Center"); back.href = "../a1/#exercises"; actions.append(reviewButton, weakButton, again, back); result.append(grid, areas, actions); result.scrollIntoView({behavior: "smooth", block: "start"});
  }
  function showMistakes() {
    const result = $("practiceResult"); result.replaceChildren(create("span", "", "Review Listening Mistakes"), create("h2", "", `${mistakes.length} tasks to review`));
    const list = create("div", "listening-review-list"); mistakes.forEach(row => {
      const card = create("article", "listening-review-card"); card.append(create("h3", "", row.task.promptEn), create("p", "", `Your answer: ${row.task.options[row.selected]}`), create("p", "listening-correct-answer", `Correct: ${row.task.options[row.task.answer]}`));
      const transcript = create("p", "listening-transcript", row.task.transcript); transcript.lang = "de"; const bn = create("p", "listening-explanation-bn", row.task.explanationBn); bn.lang = "bn";
      const playButton = create("button", "listen-normal", "▶ Play audio"); playButton.type = "button"; playButton.setAttribute("aria-label", "Play German audio for this review item"); playButton.addEventListener("click", () => speech.play(row.task, .94));
      const slowButton = create("button", "listen-slow", "🐢 Slow"); slowButton.type = "button"; slowButton.addEventListener("click", () => speech.play(row.task, .76));
      const link = create("a", "challenge-topic-link", "Review related topic →"); link.href = `../library-topic/?level=A1&topic=${row.task.relatedTopic}`;
      card.append(playButton, slowButton, transcript, create("p", "", row.task.explanationEn), bn, link); list.append(card);
    });
    const back = create("button", "", "Back to Results"); back.type = "button"; back.addEventListener("click", showResults); result.append(list, back);
  }
  addEventListener("pagehide", () => speech.cancel(), {once: true});
  renderStart();
}
