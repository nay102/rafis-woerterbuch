import { initLevelPage } from "./level-page.js";
import { initAuthGate } from "./auth-gate.js";
import { PRACTICE_TYPES, getQuestions } from "./practice-data.js";
import {
  A1_GRAMMAR_PROGRESS_KEY,
  A1_GRAMMAR_SKILLS,
  createBalancedGrammarRound,
  createWeakGrammarRound,
  readGrammarProgress,
  validateA1GrammarBank
} from "./a1-grammar-challenge-data.js";
import { initA1Flashcards } from "./a1-flashcards.js";
import { initA1Matching } from "./a1-matching.js";
import { initA1Listening } from "./a1-listening.js";
import { initA1Reading } from "./a1-reading.js";
import { initA1Builder } from "./a1-builder.js";
import { initA1Speaking } from "./a1-speaking.js";
import { initA1Dialogues } from "./a1-dialogues.js";

const params = new URLSearchParams(location.search);
const rawLevel = (params.get("level") || "A1").toUpperCase();
const level = ["A1", "A2", "B1", "B2"].includes(rawLevel) ? rawLevel : "A1";
const rawType = params.get("type") || "grammar";
const type = PRACTICE_TYPES[rawType] ? rawType : "grammar";
const config = PRACTICE_TYPES[type];
const isA1Grammar = level === "A1" && type === "grammar";
const isA1Flashcards = level === "A1" && type === "flashcards";
const isA1Matching = level === "A1" && type === "matching";
const isA1Listening = level === "A1" && type === "listening";
const isA1Reading = level === "A1" && type === "reading";
const isA1Builder = level === "A1" && type === "writing";
const isA1Speaking = level === "A1" && type === "speaking";
const isA1Dialogues = level === "A1" && type === "communication";
const $ = id => document.getElementById(id);

function setSharedPage(title = config.title, instruction = config.instruction) {
  document.title = `${title} | Rafis Sprachwelt ${level}`;
  $("practiceBranding").textContent = `Rafis Sprachwelt - ${level}`;
  $("practiceLevel").textContent = `${level} Practice`;
  $("practiceType").textContent = config.label;
  $("practiceTitle").textContent = title;
  $("practiceInstruction").textContent = instruction;
  $("practiceBack").href = `../${level.toLowerCase()}/#exercises`;
}

function initLegacyPractice() {
  const questions = getQuestions(level, type);
  let submitted = false;
  function render() {
    setSharedPage();
    $("questionCount").textContent = `${questions.length} Questions`;
    $("practiceForm").innerHTML = questions.map((item, questionIndex) => `
      <fieldset class="practice-question" data-question="${questionIndex}">
        <legend><span>${questionIndex + 1}</span>${item.prompt}</legend>
        ${config.audio ? `<button class="listen-button" type="button" data-speech="${item.speech.replaceAll('"', "&quot;")}"><i class="fa-solid fa-volume-high"></i> Play sentence</button>` : ""}
        <div class="answer-options">${item.options.map((option, optionIndex) => `
          <label><input type="radio" name="question-${questionIndex}" value="${optionIndex}"><span>${option}</span></label>`).join("")}</div>
        <p class="answer-feedback" aria-live="polite"></p>
      </fieldset>`).join("");
  }
  function updateProgress() {
    const answered = questions.filter((_, index) => document.querySelector(`input[name="question-${index}"]:checked`)).length;
    $("answeredCount").textContent = `${answered} of ${questions.length} answered`;
    $("progressFill").style.width = `${answered / questions.length * 100}%`;
  }
  function checkAnswers(event) {
    event.preventDefault();
    let score = 0;
    questions.forEach((item, index) => {
      const card = document.querySelector(`[data-question="${index}"]`);
      const selected = card.querySelector("input:checked");
      const correct = Number(selected?.value) === item.answer;
      if (correct) score++;
      card.classList.toggle("is-correct", correct);
      card.classList.toggle("is-wrong", !correct);
      card.querySelector(".answer-feedback").textContent = correct ? `Correct — ${item.note}` : `Correct answer: ${item.options[item.answer]}. ${item.note}`;
      card.querySelectorAll("input").forEach(input => { input.disabled = true; });
    });
    submitted = true;
    const percent = Math.round(score / questions.length * 100);
    $("resultScore").textContent = `${score}/${questions.length}`;
    $("resultMessage").textContent = percent >= 75 ? "Excellent work. You are ready to continue." : percent >= 50 ? "Good progress. Review the explanations and try once more." : "Keep practising. Review each explanation before trying again.";
    $("practiceResult").hidden = false;
    $("submitPractice").hidden = true;
    $("practiceResult").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function resetPractice() {
    submitted = false;
    $("practiceResult").hidden = true;
    $("submitPractice").hidden = false;
    render(); updateProgress();
    scrollTo({ top: 0, behavior: "smooth" });
  }
  render();
  $("practiceForm").addEventListener("change", () => { if (!submitted) updateProgress(); });
  $("practiceForm").addEventListener("submit", checkAnswers);
  $("retryPractice").addEventListener("click", resetPractice);
  document.addEventListener("click", event => {
    const button = event.target.closest(".listen-button");
    if (!button || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(button.dataset.speech);
    utterance.lang = "de-DE"; utterance.rate = .82;
    speechSynthesis.speak(utterance);
  });
  updateProgress();
}

function initGrammarChallenge() {
  const validationErrors = validateA1GrammarBank();
  if (validationErrors.length) {
    console.error("A1 Grammar Challenge data validation failed.", validationErrors);
    $("practiceForm").textContent = "This challenge is temporarily unavailable because its local question data could not be validated.";
    $("submitPractice").hidden = true;
    return;
  }

  let progress = readGrammarProgress();
  let round = createBalancedGrammarRound(progress.lastRoundIds || []);
  let answers = Array(round.length).fill(null);
  let current = 0;
  let submitted = false;
  let forceSubmit = false;
  let roundKind = "balanced";

  setSharedPage("A1 Grammar Challenge", "Complete a balanced 20-question A1 grammar round. Your choices are saved while you move between questions.");
  $("questionCount").textContent = "120-question bank · 20 per round";
  $("submitPractice").textContent = "Submit Challenge";
  $("practiceResult").setAttribute("aria-live", "polite");
  const help = document.querySelector(".practice-help");
  if (help) help.querySelector("p").textContent = "Work through one question at a time. You can go back, keep your answers, review unanswered items, and study every mistake after submitting.";

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function updateProgressBar() {
    const count = answers.filter(value => value !== null).length;
    $("answeredCount").textContent = `${count} of ${round.length} answered · Question ${current + 1} of ${round.length}`;
    $("progressFill").style.width = `${count / round.length * 100}%`;
  }

  function renderQuestion() {
    const question = round[current];
    const form = $("practiceForm");
    form.replaceChildren();
    const fieldset = make("fieldset", "practice-question grammar-challenge-question");
    fieldset.dataset.question = String(current);
    const meta = make("div", "challenge-question-meta");
    meta.append(make("span", "challenge-skill", A1_GRAMMAR_SKILLS[question.skill].title), make("span", "challenge-difficulty", question.difficulty));
    const legend = document.createElement("legend");
    legend.lang = "de";
    legend.append(make("span", "", String(current + 1)), document.createTextNode(question.prompt));
    const options = make("div", "answer-options challenge-options");
    question.options.forEach((option, index) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio"; input.name = "grammar-answer"; input.value = String(index);
      input.checked = answers[current] === index;
      input.addEventListener("change", () => {
        answers[current] = index;
        forceSubmit = false;
        document.querySelector(".challenge-warning")?.remove();
        updateProgressBar();
      });
      const optionText = make("span", "", option);
      optionText.lang = "de";
      label.append(input, optionText); options.append(label);
    });
    const navigation = make("div", "challenge-navigation");
    const previous = make("button", "challenge-secondary", "← Previous");
    previous.type = "button"; previous.disabled = current === 0;
    previous.addEventListener("click", () => { current--; renderQuestion(); });
    const next = make("button", "challenge-primary", current === round.length - 1 ? "Finish round" : "Next →");
    next.type = current === round.length - 1 ? "submit" : "button";
    if (next.type === "button") next.addEventListener("click", () => { current++; renderQuestion(); });
    navigation.append(previous, make("span", "challenge-position", `${current + 1} / ${round.length}`), next);
    fieldset.append(meta, legend, options);
    form.append(fieldset, navigation);
    updateProgressBar();
    fieldset.querySelector("input:checked, input")?.focus({ preventScroll: true });
  }

  function saveResult(score, percent) {
    const skillStats = {...(progress.skillStats || {})};
    round.forEach((question, index) => {
      const old = skillStats[question.skill] || { attempts: 0, correct: 0, wrong: 0 };
      const correct = answers[index] === question.answer;
      skillStats[question.skill] = {...old, attempts: old.attempts + 1, correct: old.correct + (correct ? 1 : 0), wrong: old.wrong + (correct ? 0 : 1)};
    });
    const weakSkills = Object.entries(skillStats)
      .filter(([, stats]) => stats.attempts >= 4)
      .sort((a, b) => (a[1].correct / a[1].attempts) - (b[1].correct / b[1].attempts))
      .slice(0, 3).map(([skill]) => skill);
    progress = {
      ...progress,
      attempts: (progress.attempts || 0) + 1,
      bestScore: roundKind === "balanced" ? Math.max(progress.bestScore || 0, score) : (progress.bestScore || 0),
      bestPercent: Math.max(progress.bestPercent || 0, percent),
      lastScore: score,
      lastPercent: percent,
      totalAnswered: (progress.totalAnswered || 0) + round.length,
      totalCorrect: (progress.totalCorrect || 0) + score,
      lastRoundIds: round.map(question => question.id),
      skillStats,
      weakSkills,
      lastActivity: new Date().toISOString()
    };
    localStorage.setItem(A1_GRAMMAR_PROGRESS_KEY, JSON.stringify(progress));
  }

  function resultStatus(percent) {
    if (percent >= 80) return {status: "Strong Round", message: "Excellent. Your A1 grammar foundation is strong. Review any mistakes and continue practising for consistency."};
    if (percent >= 60) return {status: "Good Progress", message: "Good progress. Review your weaker grammar areas and try another balanced round."};
    return {status: "Keep Practising", message: "Review the explanations and focus on your weaker topics before trying another round."};
  }

  function showMistakes(mistakes) {
    const result = $("practiceResult");
    result.replaceChildren(make("span", "", "Review mistakes"), make("h2", "", mistakes.length ? `${mistakes.length} answers to review` : "No mistakes this round"));
    const list = make("div", "challenge-review-list");
    mistakes.forEach(({question, selected}) => {
      const card = make("article", "challenge-review-card");
      card.append(make("h3", "", question.prompt));
      if (selected !== null) card.append(make("p", "review-selected", `Your answer: ${question.options[selected]}`));
      else card.append(make("p", "review-selected", "Your answer: Unanswered"));
      card.append(make("p", "review-correct", `Correct: ${question.options[question.answer]}`));
      const en = make("p", "", question.explanationEn); en.lang = "en";
      const bn = make("p", "review-bn", question.explanationBn); bn.lang = "bn";
      card.append(en, bn, make("small", "", `Rule: ${question.rule}`));
      const link = make("a", "challenge-topic-link", `Review ${A1_GRAMMAR_SKILLS[question.skill].title} →`);
      link.href = `../library-topic/?level=A1&topic=${encodeURIComponent(question.relatedTopic)}`;
      card.append(link); list.append(card);
    });
    result.append(list);
    const back = make("button", "", "Back to results"); back.type = "button"; back.addEventListener("click", () => showResults());
    result.append(back);
  }

  let lastResult = null;
  function showResults() {
    if (!lastResult) return;
    const {score, percent, mistakes, breakdown} = lastResult;
    const result = $("practiceResult");
    const outcome = resultStatus(percent);
    result.replaceChildren(make("span", "", roundKind === "weak" ? "Weak Areas Practice" : "A1 Grammar Challenge"), make("strong", "", `${score}/${round.length}`), make("p", "challenge-percentage", `${percent}% · ${outcome.status}`), make("p", "", outcome.message));
    const grid = make("div", "challenge-breakdown");
    breakdown.forEach(item => {
      const card = make("div", item.percent >= 80 ? "is-strong" : "needs-review");
      card.append(make("strong", "", A1_GRAMMAR_SKILLS[item.skill].title), make("span", "", `${item.correct}/${item.total} · ${item.percent}%`), make("small", "", item.percent >= 80 ? "Strong" : "Review"));
      grid.append(card);
    });
    const areaSummary = make("div", "challenge-area-summary");
    const strongAreas = breakdown.filter(item => item.percent >= 80).map(item => A1_GRAMMAR_SKILLS[item.skill].title);
    const reviewAreas = breakdown.filter(item => item.percent < 80).map(item => A1_GRAMMAR_SKILLS[item.skill].title);
    areaSummary.append(make("p", "", `Strong Areas: ${strongAreas.join(", ") || "Keep building"}`), make("p", "", `Review Areas: ${reviewAreas.join(", ") || "None this round"}`));
    const actions = make("div", "challenge-result-actions");
    const review = make("button", "", "Review Mistakes"); review.type = "button"; review.disabled = !mistakes.length; review.addEventListener("click", () => showMistakes(mistakes));
    const weak = make("button", "", "Practice Weak Areas"); weak.type = "button"; weak.addEventListener("click", () => startRound(createWeakGrammarRound(progress.weakSkills), "Weak Areas Practice", "weak"));
    const again = make("button", "", "New Balanced Round"); again.type = "button"; again.addEventListener("click", () => startRound(createBalancedGrammarRound(progress.lastRoundIds), "A1 Grammar Challenge", "balanced"));
    const back = make("a", "challenge-back-link", "Back to Practice Center"); back.href = "../a1/#exercises";
    actions.append(review, weak, again, back); result.append(grid, areaSummary, actions);
  }

  function submitChallenge(event) {
    event.preventDefault();
    if (submitted) return;
    const unanswered = answers.reduce((items, answer, index) => answer === null ? [...items, index] : items, []);
    if (unanswered.length && !forceSubmit) {
      document.querySelector(".challenge-warning")?.remove();
      const warning = make("div", "challenge-warning"); warning.setAttribute("role", "alert");
      warning.append(make("p", "", `You still have ${unanswered.length} unanswered question${unanswered.length === 1 ? "" : "s"}.`));
      const review = make("button", "challenge-secondary", "Review Unanswered"); review.type = "button"; review.addEventListener("click", () => { warning.remove(); current = unanswered[0]; renderQuestion(); });
      const submitAnyway = make("button", "challenge-primary", "Submit Anyway"); submitAnyway.type = "button"; submitAnyway.addEventListener("click", () => { forceSubmit = true; $("practiceForm").requestSubmit(); });
      warning.append(review, submitAnyway); $("submitPractice").before(warning); return;
    }
    submitted = true;
    const mistakes = [];
    const breakdown = Object.keys(A1_GRAMMAR_SKILLS).map(skill => ({skill, correct: 0, total: 0, percent: 0}));
    let score = 0;
    round.forEach((question, index) => {
      const row = breakdown.find(item => item.skill === question.skill); row.total++;
      if (answers[index] === question.answer) { score++; row.correct++; }
      else mistakes.push({question, selected: answers[index]});
    });
    breakdown.forEach(item => { item.percent = item.total ? Math.round(item.correct / item.total * 100) : 0; });
    const percent = Math.round(score / round.length * 100);
    lastResult = {score, percent, mistakes, breakdown: breakdown.filter(item => item.total)};
    saveResult(score, percent);
    $("practiceForm").hidden = true; $("submitPractice").hidden = true;
    $("practiceResult").hidden = false; showResults();
    $("practiceResult").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function startRound(nextRound, title, kind) {
    round = nextRound; answers = Array(round.length).fill(null); current = 0; submitted = false; forceSubmit = false; lastResult = null;
    roundKind = kind;
    $("practiceTitle").textContent = title;
    $("practiceForm").hidden = false; $("practiceResult").hidden = true; $("submitPractice").hidden = false;
    renderQuestion(); scrollTo({top: 0, behavior: "smooth"});
  }

  $("practiceForm").addEventListener("submit", submitChallenge);
  $("submitPractice").addEventListener("click", event => {
    event.preventDefault(); $("practiceForm").requestSubmit();
  });
  renderQuestion();
}

initAuthGate();
initLevelPage();
if (isA1Grammar) initGrammarChallenge();
else if (isA1Flashcards) initA1Flashcards(setSharedPage);
else if (isA1Matching) initA1Matching(setSharedPage);
else if (isA1Listening) initA1Listening(setSharedPage);
else if (isA1Reading) initA1Reading(setSharedPage);
else if (isA1Builder) initA1Builder(setSharedPage);
else if (isA1Speaking) initA1Speaking(setSharedPage);
else if (isA1Dialogues) initA1Dialogues(setSharedPage);
else initLegacyPractice();
