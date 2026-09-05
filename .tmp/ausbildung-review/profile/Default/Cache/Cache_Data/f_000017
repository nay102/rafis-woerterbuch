import {
  getRafiTutorContext, getRafiTutorWordDetails, getRafiTutorArticleNouns,
  getRafiTutorVocabulary, getRafiTutorConjugationQuestions
  , markRafiTutorWordLearned, openNextRafiTutorWord,
  recordRafiTutorReviewResult, openExistingRafiReview
} from "./ui.js";
import { TUTOR_GRAMMAR_TOPICS } from "./tutor-grammar.js";
import { CASE_EXERCISES, COMMON_MISTAKE_RULES } from "./tutor-exercises.js";
import { SENTENCE_TEMPLATES } from "./tutor-sentences.js";

const GRAMMAR_LANGUAGE_KEY = "rw_tutor_grammar_language_v1";
const ARTICLE_PROGRESS_KEY = "rw_tutor_article_progress_v1";
const TUTOR_PERFORMANCE_KEY = "rw_tutor_performance_v1";

let lastFocusedElement = null;

function createTutorPanel() {
  const panel = document.createElement("aside");
  panel.id = "rafiTutorPanel";
  panel.className = "rafi-tutor-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "rafiTutorTitle");
  panel.setAttribute("aria-describedby", "rafiTutorSubtitle rafiTutorSource");
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `
    <div class="rafi-tutor-head">
      <div class="rafi-tutor-heading">
        <h2 id="rafiTutorTitle">SprachCoach</h2>
        <p id="rafiTutorSubtitle">Dein persönlicher Deutsch-Lerncoach</p>
        <small id="rafiTutorSource">Powered by Rafi's Wörterbuch learning data</small>
      </div>
      <div class="rafi-tutor-head-actions">
        <button id="rafiTutorNew" type="button">New</button>
        <button id="rafiTutorClose" type="button" aria-label="Close SprachCoach">Close</button>
      </div>
    </div>
    <div class="rafi-tutor-body"></div>`;
  document.body.appendChild(panel);
  return panel;
}

function getFocusable(panel) {
  return [...panel.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
}

function appendField(host, label, values) {
  const list = (Array.isArray(values) ? values : [values]).filter(Boolean);
  if (!list.length) return;
  const section = document.createElement("section");
  section.className = "rafi-tutor-result-section";
  const heading = document.createElement("h4");
  heading.textContent = label;
  section.appendChild(heading);
  list.forEach(value => {
    const paragraph = document.createElement("p");
    paragraph.textContent = value;
    section.appendChild(paragraph);
  });
  host.appendChild(section);
}

function getCurrentWordContext() {
  const context = getRafiTutorContext();
  return context.view === "word" && context.word?.id ? context : null;
}

function renderWordExplanation(panel) {
  const context = getCurrentWordContext();
  const body = panel.querySelector(".rafi-tutor-body");
  if (!body) return;
  body.replaceChildren();
  const result = document.createElement("div");
  result.className = "rafi-tutor-result";
  const back = document.createElement("button");
  back.type = "button";
  back.className = "rafi-tutor-result-back";
  back.textContent = "← SprachCoach home";
  result.appendChild(back);

  if (!context) {
    const heading = document.createElement("h3");
    heading.textContent = "Open a dictionary word first";
    const text = document.createElement("p");
    text.textContent = "Choose a word in Rafi's Wörterbuch, then open SprachCoach and select Explain a Word.";
    result.append(heading, text);
    body.appendChild(result);
    back.addEventListener("click", () => panel.dispatchEvent(new CustomEvent("rafi:tutorhome")));
    return;
  }

  const details = getRafiTutorWordDetails(context.word.id);
  if (!details) return;
  const heading = document.createElement("h3");
  heading.textContent = details.article ? `${details.article} ${details.word}` : details.word;
  result.appendChild(heading);
  appendField(result, "Category", details.category);
  appendField(result, "CEFR level", details.level);

  const category = String(details.category || "").toLowerCase();
  if (category === "verben") {
    appendField(result, "Infinitive", details.word);
    appendField(result, "English", details.meaningEn);
    appendField(result, "বাংলা", details.meaningBn);
    appendField(result, "Partizip II", details.partizipII);
    appendField(result, "Präteritum", details.praeteritum);
    appendField(result, "Auxiliary", details.auxiliary);
    appendField(result, "Verb type", details.separability);
  } else {
    appendField(result, "Article", details.article);
    appendField(result, "English", details.meaningEn);
    appendField(result, "বাংলা", details.meaningBn);
    appendField(result, "Plural", details.plural);
    appendField(result, "Comparison", details.comparison);
  }
  appendField(result, "Examples", details.examples);
  body.appendChild(result);
  back.addEventListener("click", () => panel.dispatchEvent(new CustomEvent("rafi:tutorhome")));
  back.focus();
}

function renderWordExamples(panel) {
  const context = getCurrentWordContext();
  const body = panel.querySelector(".rafi-tutor-body");
  if (!body) return;
  body.replaceChildren();
  const result = document.createElement("div");
  result.className = "rafi-tutor-result";
  const back = makeButton("← Back to word tools", "rafi-tutor-result-back");
  result.appendChild(back);

  const details = context
    ? getRafiTutorWordDetails(context.word.id)
    : null;
  const heading = document.createElement("h3");
  heading.textContent = details
    ? `Examples with ${details.article ? `${details.article} ${details.word}` : details.word}`
    : "Open a dictionary word first";
  result.appendChild(heading);

  if (!details) {
    const text = document.createElement("p");
    text.textContent = "Choose a word with recorded examples first.";
    result.appendChild(text);
  } else if (!details.examples?.length) {
    const text = document.createElement("p");
    text.textContent = "No recorded examples are available for this word yet.";
    result.appendChild(text);
  } else {
    appendField(result, "Examples", details.examples);
    appendField(result, "English", details.meaningEn);
    appendField(result, "বাংলা", details.meaningBn);
  }

  if (details) {
    const actions = document.createElement("div");
    actions.className = "rafi-quiz-end-actions";
    const test = makeButton("🎯 Test this word", "rafi-tutor-primary");
    test.addEventListener("click", () => renderContextWordTest(panel));
    actions.appendChild(test);
    result.appendChild(actions);
  }

  body.appendChild(result);
  back.addEventListener("click", () => panel.dispatchEvent(new CustomEvent("rafi:tutorhome")));
  back.focus();
}

function hasContextualConjugation(details) {
  return details?.isVerb === true && Boolean(
    details?.praesensForms?.length ||
    details?.praeteritumForms?.length ||
    details?.perfektForms?.length ||
    details?.partizipII
  );
}

function renderContextualConjugation(panel) {
  const context = getCurrentWordContext();
  const body = panel.querySelector(".rafi-tutor-body");
  if (!body) return;
  body.replaceChildren();
  const result = document.createElement("div");
  result.className = "rafi-tutor-result";
  const back = makeButton("← Back to word tools", "rafi-tutor-result-back");
  result.appendChild(back);
  const details = context
    ? getRafiTutorWordDetails(context.word.id)
    : null;

  const heading = document.createElement("h3");
  heading.textContent = details ? `Conjugation: ${details.word}` : "Verb conjugation";
  result.appendChild(heading);

  if (!details?.isVerb) {
    renderTutorDashboard(panel);
    return;
  }

  if (!hasContextualConjugation(details)) {
    const text = document.createElement("p");
    text.textContent = "No reliable conjugation data is available for this word.";
    result.appendChild(text);
  } else {
    appendField(result, "Präsens", details.praesensForms);
    appendField(result, "Präteritum", details.praeteritumForms);
    appendField(result, "Perfekt", details.perfektForms);
    appendField(result, "Partizip II", details.partizipII);
    appendField(result, "Auxiliary", details.auxiliary);

    const questions = getRafiTutorConjugationQuestions().filter(
      item => item.wordId === details.id
    );
    if (questions.length) {
      const practice = makeButton("🎯 Practice this verb", "rafi-tutor-primary");
      practice.addEventListener("click", () => renderConjugationTrainer(panel, details.id));
      result.appendChild(practice);
    }
  }

  body.appendChild(result);
  back.addEventListener("click", () => panel.dispatchEvent(new CustomEvent("rafi:tutorhome")));
  back.focus();
}

function renderNounArticleAndPlural(panel) {
  const context = getCurrentWordContext();
  const body = panel.querySelector(".rafi-tutor-body");
  if (!body) return;
  body.replaceChildren();
  const result = document.createElement("div");
  result.className = "rafi-tutor-result";
  const back = makeButton("← Back to word tools", "rafi-tutor-result-back");
  result.appendChild(back);
  const details = context ? getRafiTutorWordDetails(context.word.id) : null;
  const heading = document.createElement("h3");
  heading.textContent = details
    ? (details.article ? `${details.article} ${details.word}` : details.word)
    : "Article & Plural";
  result.appendChild(heading);

  if (!details?.isNoun) {
    renderTutorDashboard(panel);
    return;
  }

  if (!details.article && !details.plural) {
    const text = document.createElement("p");
    text.textContent = "No reliable article or plural data is available for this word.";
    result.appendChild(text);
  } else {
    appendField(result, "Article", details.article);
    appendField(result, "Plural", details.plural);
    appendField(result, "English", details.meaningEn);
    appendField(result, "বাংলা", details.meaningBn);
  }

  body.appendChild(result);
  back.addEventListener("click", () => panel.dispatchEvent(new CustomEvent("rafi:tutorhome")));
  back.focus();
}

function makeButton(label, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  return button;
}

function readTutorPerformance() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TUTOR_PERFORMANCE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch { return {}; }
}

function recordTutorPerformance(wordId, correct) {
  if (!wordId) return;
  const all = readTutorPerformance();
  const current = all[wordId] || { correct: 0, mistakes: 0, lastReviewed: 0 };
  current.correct = Number(current.correct || 0) + (correct ? 1 : 0);
  current.mistakes = Number(current.mistakes || 0) + (correct ? 0 : 1);
  current.lastReviewed = Date.now();
  current.lastResult = correct ? "correct" : "wrong";
  all[wordId] = current;
  localStorage.setItem(TUTOR_PERFORMANCE_KEY, JSON.stringify(all));
  const streak = correct ? Number(localStorage.getItem("rw_tutor_current_streak_v1") || 0) + 1 : 0;
  localStorage.setItem("rw_tutor_current_streak_v1", String(streak));
  recordRafiTutorReviewResult(wordId, correct);
}

function getTutorReviewStats() {
  const all = readTutorPerformance();
  const today = new Date().toISOString().slice(0, 10);
  const records = Object.entries(all).map(([id, value]) => ({ id, ...value }));
  const weak = records.filter(item => Number(item.mistakes || 0) > Number(item.correct || 0));
  const ready = records.filter(item => {
    const age = Date.now() - Number(item.lastReviewed || 0);
    return item.lastResult === "wrong" || age >= 3 * 86400000;
  });
  const reviewedToday = records.filter(item => item.lastReviewed && new Date(item.lastReviewed).toISOString().slice(0, 10) === today).length;
  const attempts = records.reduce((sum, item) => sum + Number(item.correct || 0) + Number(item.mistakes || 0), 0);
  const correct = records.reduce((sum, item) => sum + Number(item.correct || 0), 0);
  const streak = Number(localStorage.getItem("rw_tutor_current_streak_v1") || 0);
  return { records, weak, ready, reviewedToday, attempts, correct, accuracy: attempts ? Math.round(correct / attempts * 100) : null, streak };
}

function renderGrammarLibrary(panel) {
  const body = panel.querySelector(".rafi-tutor-body");
  body.replaceChildren();
  const view = document.createElement("div");
  view.className = "rafi-tutor-tool";
  const back = makeButton("← SprachCoach home", "rafi-tutor-result-back");
  const title = document.createElement("h3");
  title.textContent = "Grammar Library";
  const controls = document.createElement("div");
  controls.className = "rafi-tutor-tool-controls";
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search grammar topics";
  search.setAttribute("aria-label", "Search grammar topics");
  const level = document.createElement("select");
  level.setAttribute("aria-label", "Filter grammar level");
  ["All", "A1", "A2", "B1", "B2"].forEach(value => level.add(new Option(value, value)));
  controls.append(search, level);
  const language = document.createElement("div");
  language.className = "rafi-tutor-segmented";
  language.setAttribute("aria-label", "Explanation language");
  const languages = [["bn", "বাংলা"], ["en", "English"], ["de", "Deutsch"]];
  let selectedLanguage = localStorage.getItem(GRAMMAR_LANGUAGE_KEY) || "en";
  let activeTopic = null;
  const list = document.createElement("div");
  list.className = "rafi-tutor-topic-list";

  const drawList = () => {
    activeTopic = null;
    list.replaceChildren();
    const query = search.value.trim().toLowerCase();
    const matches = TUTOR_GRAMMAR_TOPICS.filter(item =>
      (!query || `${item.title} ${item.id}`.toLowerCase().includes(query)) &&
      (level.value === "All" || item.level.includes(level.value))
    );
    matches.forEach(item => {
      const button = makeButton("", "rafi-tutor-topic-card");
      const name = document.createElement("strong");
      name.textContent = item.title;
      const badge = document.createElement("span");
      badge.textContent = item.level;
      button.append(name, badge);
      button.addEventListener("click", () => drawTopic(item));
      list.appendChild(button);
    });
    if (!matches.length) {
      const empty = document.createElement("p");
      empty.textContent = "No grammar topics match these filters.";
      list.appendChild(empty);
    }
  };

  const drawTopic = item => {
    activeTopic = item;
    list.replaceChildren();
    const topicTitle = document.createElement("h3");
    topicTitle.textContent = item.title;
    const rule = selectedLanguage === "bn" ? item.shortRuleBn : selectedLanguage === "de" ? item.simpleGermanRule : item.shortRuleEn;
    appendField(list, selectedLanguage === "bn" ? "নিয়ম" : selectedLanguage === "de" ? "Regel" : "Rule", rule);
    appendField(list, "Examples", item.examples);
    appendField(list, "Common mistake", item.commonMistakes);
    const practice = makeButton("Practice This Topic", "rafi-tutor-primary");
    practice.addEventListener("click", () => {
      appendField(list, "Practice", item.practice);
      practice.disabled = true;
      practice.textContent = "Practice shown below";
    });
    const topics = makeButton("← All topics", "rafi-tutor-result-back");
    topics.addEventListener("click", drawList);
    list.prepend(topicTitle);
    list.append(practice, topics);
  };

  languages.forEach(([code, label]) => {
    const button = makeButton(label);
    button.setAttribute("aria-pressed", String(code === selectedLanguage));
    button.addEventListener("click", () => {
      selectedLanguage = code;
      localStorage.setItem(GRAMMAR_LANGUAGE_KEY, code);
      [...language.children].forEach((child, index) => child.setAttribute("aria-pressed", String(languages[index][0] === code)));
      if (activeTopic) drawTopic(activeTopic);
    });
    language.appendChild(button);
  });
  back.addEventListener("click", () => panel.dispatchEvent(new CustomEvent("rafi:tutorhome")));
  search.addEventListener("input", drawList);
  level.addEventListener("change", drawList);
  view.append(back, title, language, controls, list);
  body.appendChild(view);
  drawList();
  search.focus();
}

function readArticleProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ARTICLE_PROGRESS_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch { return {}; }
}

function renderArticleTrainer(panel) {
  const body = panel.querySelector(".rafi-tutor-body");
  body.replaceChildren();
  const view = document.createElement("div");
  view.className = "rafi-tutor-tool";
  const back = makeButton("← SprachCoach home", "rafi-tutor-result-back");
  const title = document.createElement("h3");
  title.textContent = "Article Trainer";
  const controls = document.createElement("div");
  controls.className = "rafi-tutor-tool-controls";
  const mode = document.createElement("select");
  mode.setAttribute("aria-label", "Article trainer mode");
  [["all", "All"], ["der", "der"], ["die", "die"], ["das", "das"], ["weak", "My Weak Words"]].forEach(([value, label]) => mode.add(new Option(label, value)));
  const level = document.createElement("select");
  level.setAttribute("aria-label", "Article trainer level");
  ["All", "A1", "A2", "B1", "B2"].forEach(value => level.add(new Option(value, value)));
  controls.append(mode, level);
  const game = document.createElement("div");
  game.className = "rafi-article-game";
  let pool = [], used = new Set(), lastId = "", current = null, answered = false;
  let question = 0, correct = 0, wrong = 0, streak = 0;

  const rebuildPool = () => {
    const progress = readArticleProgress();
    pool = getRafiTutorArticleNouns().filter(noun =>
      (mode.value === "all" || mode.value === "weak" || noun.article === mode.value) &&
      (mode.value !== "weak" || Number(progress[noun.id] || 0) > 0) &&
      (level.value === "All" || noun.level === level.value)
    );
  };
  const draw = () => {
    game.replaceChildren();
    if (question >= 10) {
      const done = document.createElement("h4");
      done.textContent = "Session complete";
      const score = document.createElement("p");
      score.textContent = `Score: ${correct}/10 · Correct: ${correct} · Wrong: ${wrong}`;
      const restart = makeButton("Restart", "rafi-tutor-primary");
      restart.addEventListener("click", start);
      game.append(done, score, restart);
      return;
    }
    rebuildPool();
    let choices = pool.filter(noun => noun.id !== lastId && !used.has(noun.id));
    if (!choices.length) { used.clear(); choices = pool.filter(noun => noun.id !== lastId); }
    if (!choices.length) {
      const empty = document.createElement("p");
      empty.textContent = mode.value === "weak" ? "No weak words recorded yet. Wrong answers will appear here." : "No reliable nouns match this filter.";
      game.appendChild(empty);
      return;
    }
    current = choices[Math.floor(Math.random() * choices.length)];
    used.add(current.id); lastId = current.id; answered = false;
    const stats = document.createElement("p");
    stats.className = "rafi-article-stats";
    stats.textContent = `Question ${question + 1}/10 · ✓ ${correct} · ✗ ${wrong} · Streak ${streak}`;
    const prompt = document.createElement("h4");
    prompt.textContent = `Choose the correct article: ___ ${current.word}`;
    const options = document.createElement("div");
    options.className = "rafi-article-options";
    const feedback = document.createElement("p");
    feedback.setAttribute("role", "status");
    ["der", "die", "das"].forEach(article => {
      const button = makeButton(article);
      button.addEventListener("click", () => {
        if (answered) return;
        answered = true; question += 1;
        const progress = readArticleProgress();
        if (article === current.article) {
          correct += 1; streak += 1;
          progress[current.id] = Math.max(0, Number(progress[current.id] || 0) - 1);
          feedback.textContent = `✅ Correct: ${current.article} ${current.word}`;
        } else {
          wrong += 1; streak = 0;
          progress[current.id] = Number(progress[current.id] || 0) + 1;
          feedback.textContent = `❌ Incorrect. Correct answer: ${current.article} ${current.word}`;
        }
        recordTutorPerformance(current.id, article === current.article);
        localStorage.setItem(ARTICLE_PROGRESS_KEY, JSON.stringify(progress));
        [...options.children].forEach(child => child.disabled = true);
        const next = makeButton(question >= 10 ? "See results" : "Next question", "rafi-tutor-primary");
        next.addEventListener("click", draw);
        game.appendChild(next);
        next.focus();
      });
      options.appendChild(button);
    });
    game.append(stats, prompt, options, feedback);
  };
  const start = () => { question = correct = wrong = streak = 0; used.clear(); lastId = ""; draw(); };
  mode.addEventListener("change", start);
  level.addEventListener("change", start);
  back.addEventListener("click", () => panel.dispatchEvent(new CustomEvent("rafi:tutorhome")));
  view.append(back, title, controls, game);
  body.appendChild(view);
  start();
}

function shuffle(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function primaryMeaning(values) {
  return String(values?.[0] || "").replace(/[“”"]/g, "").trim();
}

function renderVocabularyQuiz(panel) {
  const body = panel.querySelector(".rafi-tutor-body");
  body.replaceChildren();
  const view = document.createElement("div");
  view.className = "rafi-tutor-tool";
  const back = makeButton("← SprachCoach home", "rafi-tutor-result-back");
  const title = document.createElement("h3");
  title.textContent = "Vocabulary Quiz";
  const mode = document.createElement("select");
  mode.setAttribute("aria-label", "Vocabulary quiz mode");
  [
    ["de-en", "German → English"], ["de-bn", "German → Bengali"],
    ["en-de", "English → German"], ["bn-de", "Bengali → German"]
  ].forEach(([value, label]) => mode.add(new Option(label, value)));
  const game = document.createElement("div");
  game.className = "rafi-article-game";
  const vocabulary = getRafiTutorVocabulary();
  let number = 0, correct = 0, wrong = 0, current = null, lastId = "";
  let mistakes = [];

  const germanLabel = item => item.article ? `${item.article} ${item.word}` : item.word;
  const source = item => mode.value === "de-en" || mode.value === "de-bn" ? germanLabel(item) : primaryMeaning(mode.value === "en-de" ? item.meaningEn : item.meaningBn);
  const answer = item => mode.value === "de-en" ? primaryMeaning(item.meaningEn) : mode.value === "de-bn" ? primaryMeaning(item.meaningBn) : germanLabel(item);
  const eligible = () => vocabulary.filter(item => source(item) && answer(item));

  const distractors = item => {
    const candidates = eligible().filter(other => other.id !== item.id && answer(other).toLocaleLowerCase() !== answer(item).toLocaleLowerCase());
    candidates.sort((a, b) => {
      const aScore = (a.category === item.category ? 2 : 0) + (a.level && a.level === item.level ? 1 : 0);
      const bScore = (b.category === item.category ? 2 : 0) + (b.level && b.level === item.level ? 1 : 0);
      return bScore - aScore || Math.random() - 0.5;
    });
    const unique = [];
    const seen = new Set([answer(item).toLocaleLowerCase()]);
    candidates.forEach(candidate => {
      const value = answer(candidate);
      const key = value.toLocaleLowerCase();
      if (unique.length < 3 && value && !seen.has(key)) { seen.add(key); unique.push(value); }
    });
    return unique;
  };

  const draw = () => {
    game.replaceChildren();
    if (number >= 10) {
      const score = document.createElement("h4");
      score.textContent = `${correct} / 10`;
      const accuracy = document.createElement("p");
      accuracy.textContent = `${Math.round((correct / 10) * 100)}% accuracy`;
      const actions = document.createElement("div");
      actions.className = "rafi-quiz-end-actions";
      const review = makeButton("Review mistakes", "rafi-tutor-primary");
      review.disabled = mistakes.length === 0;
      review.addEventListener("click", () => {
        game.replaceChildren();
        mistakes.forEach(item => appendField(game, item.question, [`Your answer: ${item.chosen}`, `Correct: ${item.correct}`]));
        const again = makeButton("Try again", "rafi-tutor-primary");
        again.addEventListener("click", start);
        game.appendChild(again);
      });
      const again = makeButton("Try again", "rafi-tutor-primary");
      again.addEventListener("click", start);
      const continueButton = makeButton("Continue learning", "rafi-tutor-result-back");
      continueButton.addEventListener("click", () => panel.dispatchEvent(new CustomEvent("rafi:tutorhome")));
      actions.append(review, again, continueButton);
      game.append(score, accuracy, actions);
      return;
    }
    const choices = eligible().filter(item => item.id !== lastId);
    current = choices[Math.floor(Math.random() * choices.length)];
    lastId = current.id;
    const wrongOptions = distractors(current);
    if (wrongOptions.length < 3) { number = 10; draw(); return; }
    const stats = document.createElement("p");
    stats.className = "rafi-article-stats";
    const accuracy = number ? Math.round((correct / number) * 100) : 0;
    stats.textContent = `Question ${number + 1}/10 · Score ${correct} · Correct ${correct} · Wrong ${wrong} · Accuracy ${accuracy}%`;
    const prompt = document.createElement("h4");
    const direction = mode.value === "de-en" || mode.value === "de-bn" ? `What does “${source(current)}” mean?` : `Choose the German for “${source(current)}”`;
    prompt.textContent = direction;
    const options = document.createElement("div");
    options.className = "rafi-vocab-options";
    const feedback = document.createElement("p");
    feedback.setAttribute("role", "status");
    shuffle([answer(current), ...wrongOptions]).forEach(value => {
      const button = makeButton(value);
      button.addEventListener("click", () => {
        [...options.children].forEach(child => child.disabled = true);
        number += 1;
        const isCorrect = value === answer(current);
        recordTutorPerformance(current.id, isCorrect);
        if (isCorrect) { correct += 1; feedback.textContent = `✅ Correct: ${answer(current)}`; }
        else { wrong += 1; feedback.textContent = `❌ Incorrect. Correct: ${answer(current)}`; mistakes.push({ question: direction, chosen: value, correct: answer(current) }); }
        const next = makeButton(number >= 10 ? "See results" : "Next question", "rafi-tutor-primary");
        next.addEventListener("click", draw); game.appendChild(next); next.focus();
      }, { once: true });
      options.appendChild(button);
    });
    game.append(stats, prompt, options, feedback);
  };
  const start = () => { number = correct = wrong = 0; lastId = ""; mistakes = []; draw(); };
  mode.addEventListener("change", start);
  back.addEventListener("click", () => panel.dispatchEvent(new CustomEvent("rafi:tutorhome")));
  view.append(back, title, mode, game); body.appendChild(view); start();
}

function normalizeGermanAnswer(value) {
  return String(value || "").normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("de-DE");
}

function renderConjugationTrainer(panel, wordId = "") {
  const body = panel.querySelector(".rafi-tutor-body");
  body.replaceChildren();
  const view = document.createElement("div"); view.className = "rafi-tutor-tool";
  const back = makeButton("← SprachCoach home", "rafi-tutor-result-back");
  const title = document.createElement("h3"); title.textContent = wordId ? "Practice this verb" : "Verb Conjugation Trainer";
  const mode = document.createElement("select"); mode.setAttribute("aria-label", "Conjugation tense");
  const questions = getRafiTutorConjugationQuestions().filter(item => !wordId || item.wordId === wordId);
  [["praesens", "Präsens"], ["perfekt", "Perfekt"], ["praeteritum", "Präteritum"]].forEach(([value, label]) => {
    const option = new Option(label, value); option.disabled = !questions.some(item => item.mode === value); mode.add(option);
  });
  const firstAvailableMode = [...mode.options].find(option => !option.disabled);
  if (firstAvailableMode) mode.value = firstAvailableMode.value;
  const game = document.createElement("div"); game.className = "rafi-article-game";
  let number = 0, correct = 0, wrong = 0, lastKey = "";
  const draw = () => {
    game.replaceChildren();
    if (number >= 10) {
      const score = document.createElement("h4"); score.textContent = `${correct} / 10`;
      const accuracy = document.createElement("p"); accuracy.textContent = `${Math.round(correct * 10)}% accuracy`;
      const again = makeButton("Try again", "rafi-tutor-primary"); again.addEventListener("click", start);
      game.append(score, accuracy, again); return;
    }
    const pool = questions.filter(item => item.mode === mode.value && `${item.wordId}:${item.person}` !== lastKey);
    const current = pool[Math.floor(Math.random() * pool.length)];
    if (!current) { const empty = document.createElement("p"); empty.textContent = "No reliable forms are available for this mode."; game.appendChild(empty); return; }
    lastKey = `${current.wordId}:${current.person}`;
    const stats = document.createElement("p"); stats.className = "rafi-article-stats";
    stats.textContent = `Question ${number + 1}/10 · Correct ${correct} · Wrong ${wrong}`;
    const verb = document.createElement("h4"); verb.textContent = `${current.verb} · ${current.modeLabel}`;
    const prompt = document.createElement("p"); prompt.textContent = `${current.person} _____`;
    const toolbar = document.createElement("div"); toolbar.className = "rafi-german-toolbar";
    const input = document.createElement("input"); input.type = "text"; input.autocomplete = "off"; input.spellcheck = false; input.setAttribute("aria-label", `Conjugate ${current.verb} for ${current.person}`);
    ["ä", "ö", "ü", "ß"].forEach(character => { const button = makeButton(character); button.addEventListener("click", () => { const startAt = input.selectionStart ?? input.value.length; input.setRangeText(character, startAt, input.selectionEnd ?? startAt, "end"); input.focus(); }); toolbar.appendChild(button); });
    const submit = makeButton("Check answer", "rafi-tutor-primary");
    const feedback = document.createElement("p"); feedback.setAttribute("role", "status");
    const check = () => {
      if (!input.value.trim()) return;
      input.disabled = submit.disabled = true; number += 1;
      const isCorrect = normalizeGermanAnswer(input.value) === normalizeGermanAnswer(current.answer);
      recordTutorPerformance(current.wordId, isCorrect);
      if (isCorrect) { correct += 1; feedback.textContent = `✅ Correct: ${current.person} ${current.answer}`; }
      else { wrong += 1; feedback.textContent = `❌ Incorrect. Correct: ${current.person} ${current.answer}`; }
      const next = makeButton(number >= 10 ? "See results" : "Next question", "rafi-tutor-primary"); next.addEventListener("click", draw); game.appendChild(next); next.focus();
    };
    submit.addEventListener("click", check); input.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); check(); } });
    game.append(stats, verb, prompt, toolbar, input, submit, feedback); input.focus();
  };
  const start = () => { number = correct = wrong = 0; lastKey = ""; draw(); };
  mode.addEventListener("change", start); back.addEventListener("click", () => panel.dispatchEvent(new CustomEvent("rafi:tutorhome")));
  view.append(back, title, mode, game); body.appendChild(view); start();
}

function renderCaseTrainer(panel) {
  const body = panel.querySelector(".rafi-tutor-body"); body.replaceChildren();
  const view = document.createElement("div"); view.className = "rafi-tutor-tool";
  const back = makeButton("← Practice tools", "rafi-tutor-result-back");
  const title = document.createElement("h3"); title.textContent = "Akkusativ / Dativ Trainer";
  const mode = document.createElement("select"); mode.setAttribute("aria-label", "Case exercise group");
  [["akkusativ", "Akkusativ"], ["dativ", "Dativ"], ["mixed", "Mixed"], ["prepositions", "Prepositions"]].forEach(([value, label]) => mode.add(new Option(label, value)));
  const game = document.createElement("div"); game.className = "rafi-article-game";
  let number = 0, correct = 0, wrong = 0, lastSentence = "";
  const poolForMode = () => mode.value === "mixed" ? CASE_EXERCISES.filter(item => item.topic !== "prepositions") : CASE_EXERCISES.filter(item => item.topic === mode.value);
  const draw = () => {
    game.replaceChildren();
    if (number >= 10) {
      const score = document.createElement("h4"); score.textContent = `${correct} / 10`;
      const accuracy = document.createElement("p"); accuracy.textContent = `${correct * 10}% accuracy`;
      const restart = makeButton("Try again", "rafi-tutor-primary"); restart.addEventListener("click", start);
      game.append(score, accuracy, restart); return;
    }
    const pool = poolForMode().filter(item => item.sentence !== lastSentence);
    const current = pool[Math.floor(Math.random() * pool.length)];
    if (!current) {
      const empty = document.createElement("p");
      empty.textContent = "No exercises are available for this group yet.";
      game.appendChild(empty);
      return;
    }
    lastSentence = current.sentence;
    const stats = document.createElement("p"); stats.className = "rafi-article-stats"; stats.textContent = `Question ${number + 1}/10 · Correct ${correct} · Wrong ${wrong}`;
    const sentence = document.createElement("h4"); sentence.textContent = current.sentence;
    const choices = document.createElement("div"); choices.className = "rafi-case-options";
    const feedback = document.createElement("div"); feedback.setAttribute("role", "status");
    current.options.forEach(value => {
      const button = makeButton(value);
      button.addEventListener("click", () => {
        [...choices.children].forEach(child => child.disabled = true); number += 1;
        const result = document.createElement("p");
        if (value === current.answer) { correct += 1; result.textContent = `✅ Correct: ${current.answer}`; }
        else { wrong += 1; result.textContent = `❌ Incorrect. Correct: ${current.answer}`; }
        const en = document.createElement("p"); en.textContent = current.explanationEn;
        const bn = document.createElement("p"); bn.textContent = current.explanationBn;
        feedback.append(result, en, bn);
        const next = makeButton(number >= 10 ? "See results" : "Next question", "rafi-tutor-primary"); next.addEventListener("click", draw); game.appendChild(next); next.focus();
      }, { once: true });
      choices.appendChild(button);
    });
    game.append(stats, sentence, choices, feedback);
  };
  const start = () => { number = correct = wrong = 0; lastSentence = ""; draw(); };
  mode.addEventListener("change", start); back.addEventListener("click", () => renderPracticeChooser(panel));
  view.append(back, title, mode, game); body.appendChild(view); start();
}

function renderMistakeChecker(panel) {
  const body = panel.querySelector(".rafi-tutor-body"); body.replaceChildren();
  const view = document.createElement("div"); view.className = "rafi-tutor-tool";
  const back = makeButton("← Practice tools", "rafi-tutor-result-back");
  const title = document.createElement("h3"); title.textContent = "Common Mistake Checker";
  const description = document.createElement("p"); description.textContent = "Checks selected common A1–B1 patterns only. It does not perform complete grammar correction.";
  const input = document.createElement("textarea"); input.rows = 4; input.placeholder = "Example: weil ich bin müde"; input.setAttribute("aria-label", "German sentence to check");
  const examplesLabel = document.createElement("p"); examplesLabel.className = "rafi-article-stats"; examplesLabel.textContent = "Try a supported example:";
  const examples = document.createElement("div"); examples.className = "rafi-quiz-end-actions";
  ["ich habe gegangen", "mit den Mann", "ich kann zu kommen", "weil ich bin müde"].forEach(sentence => {
    const button = makeButton(sentence, "rafi-tutor-result-back");
    button.addEventListener("click", () => { input.value = sentence; check.click(); });
    examples.appendChild(button);
  });
  const check = makeButton("Check sentence", "rafi-tutor-primary");
  const results = document.createElement("div"); results.className = "rafi-mistake-results"; results.setAttribute("aria-live", "polite");
  const runCheck = () => {
    results.replaceChildren();
    const sentence = input.value
      .normalize("NFC")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\s+([,.!?;:])/g, "$1");
    if (!sentence) { const message = document.createElement("p"); message.textContent = "Enter one short sentence first."; results.appendChild(message); return; }
    const matches = COMMON_MISTAKE_RULES.filter(rule => {
      rule.regex.lastIndex = 0;
      return rule.regex.test(sentence);
    });
    if (!matches.length) {
      const message = document.createElement("p"); message.textContent = "No known rule-based issues found. This does not mean the sentence is fully grammatically correct."; results.appendChild(message); return;
    }
    matches.forEach(rule => {
      const card = document.createElement("section"); card.className = "rafi-tutor-result-section";
      const heading = document.createElement("h4"); heading.textContent = `Possible issue found · ${rule.topic} · ${rule.level}`;
      const original = document.createElement("p"); original.textContent = `❌ ${sentence}`;
      const suggestion = document.createElement("p"); suggestion.textContent = `✅ ${rule.suggestion(sentence)}`;
      const why = document.createElement("p"); why.textContent = `Why: ${rule.explanationEn}`;
      const whyBn = document.createElement("p"); whyBn.textContent = rule.explanationBn;
      card.append(heading, original, suggestion, why, whyBn); results.appendChild(card);
    });
  };
  check.addEventListener("click", runCheck);
  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      runCheck();
    }
  });
  back.addEventListener("click", () => renderPracticeChooser(panel));
  view.append(back, title, description, input, examplesLabel, examples, check, results); body.appendChild(view); input.focus();
}

function renderPracticeChooser(panel) {
  const body = panel.querySelector(".rafi-tutor-body"); body.replaceChildren();
  const view = document.createElement("div"); view.className = "rafi-tutor-tool";
  const back = makeButton("← SprachCoach home", "rafi-tutor-result-back");
  const title = document.createElement("h3"); title.textContent = "Practice Tools";
  const description = document.createElement("p"); description.textContent = "Choose a structured local exercise.";
  const tools = document.createElement("div"); tools.className = "rafi-practice-tools";
  const cases = makeButton("Akkusativ / Dativ Trainer", "rafi-tutor-topic-card"); cases.addEventListener("click", () => renderCaseTrainer(panel));
  const checker = makeButton("Common Mistake Checker", "rafi-tutor-topic-card"); checker.addEventListener("click", () => renderMistakeChecker(panel));
  const builder = makeButton("Sentence Builder", "rafi-tutor-topic-card"); builder.addEventListener("click", () => renderSentenceBuilder(panel));
  tools.append(cases, checker, builder); back.addEventListener("click", () => panel.dispatchEvent(new CustomEvent("rafi:tutorhome")));
  view.append(back, title, description, tools); body.appendChild(view); cases.focus();
}

function renderSentenceBuilder(panel) {
  const body = panel.querySelector(".rafi-tutor-body"); body.replaceChildren();
  const view = document.createElement("div"); view.className = "rafi-tutor-tool";
  const back = makeButton("← Practice tools", "rafi-tutor-result-back");
  const title = document.createElement("h3"); title.textContent = "Sentence Builder";
  const description = document.createElement("p"); description.textContent = "Choose from authored beginner templates. Every option is a complete verified sentence.";
  const category = document.createElement("select"); category.setAttribute("aria-label", "Sentence category");
  [...new Set(SENTENCE_TEMPLATES.map(item => item.category))].forEach(value => category.add(new Option(value, value)));
  const templateSelect = document.createElement("select"); templateSelect.setAttribute("aria-label", "Sentence template");
  const choiceSelect = document.createElement("select"); choiceSelect.setAttribute("aria-label", "Sentence choice");
  const output = document.createElement("div"); output.className = "rafi-sentence-output";
  const drawOutput = () => {
    output.replaceChildren();
    const templateItem = SENTENCE_TEMPLATES.find(item => item.id === templateSelect.value);
    const selected = templateItem?.groups.flat().find(item => item.de === choiceSelect.value);
    if (!selected) return;
    appendField(output, "German sentence", selected.de);
    appendField(output, "English", selected.en);
    appendField(output, "বাংলা", selected.bn);
    appendField(output, "Grammar pattern", templateItem.grammar);
  };
  const fillChoices = () => {
    choiceSelect.replaceChildren();
    const templateItem = SENTENCE_TEMPLATES.find(item => item.id === templateSelect.value);
    templateItem?.groups.flat().forEach(item => choiceSelect.add(new Option(item.label, item.de)));
    drawOutput();
  };
  const fillTemplates = () => {
    templateSelect.replaceChildren();
    SENTENCE_TEMPLATES.filter(item => item.category === category.value).forEach(item => templateSelect.add(new Option(item.title, item.id)));
    fillChoices();
  };
  category.addEventListener("change", fillTemplates); templateSelect.addEventListener("change", fillChoices); choiceSelect.addEventListener("change", drawOutput);
  back.addEventListener("click", () => renderPracticeChooser(panel));
  view.append(back, title, description, category, templateSelect, choiceSelect, output); body.appendChild(view); fillTemplates(); category.focus();
}

function renderContextWordTest(panel) {
  const context = getCurrentWordContext();
  const body = panel.querySelector(".rafi-tutor-body"); body.replaceChildren();
  if (!context) {
    renderTutorDashboard(panel);
    return;
  }
  const details = getRafiTutorWordDetails(context.word.id);
  if (!details) return;
  const vocabulary = getRafiTutorVocabulary();
  const currentVocabulary = vocabulary.find(item => item.id === details.id);
  const questions = [];
  const addChoiceQuestion = (prompt, correctAnswer, wrongValues) => {
    const choices = [...new Set(wrongValues.filter(Boolean).filter(value => value.toLocaleLowerCase() !== correctAnswer.toLocaleLowerCase()))].slice(0, 3);
    if (correctAnswer && choices.length >= 2) questions.push({ prompt, answer: correctAnswer, options: shuffle([correctAnswer, ...choices]) });
  };
  const peers = vocabulary.filter(item => item.id !== details.id && item.category === details.category);
  if (currentVocabulary?.meaningEn?.length) addChoiceQuestion("What does this word mean?", primaryMeaning(currentVocabulary.meaningEn), peers.map(item => primaryMeaning(item.meaningEn)));
  if (details.article) addChoiceQuestion("Which article belongs to this noun?", details.article, ["der", "die", "das"]);
  if (details.plural) addChoiceQuestion("What is the recorded plural?", details.plural, getRafiTutorArticleNouns().filter(item => item.id !== details.id).map(item => item.word));
  if (details.ichPresent) addChoiceQuestion("Choose the ich-form.", details.ichPresent, getRafiTutorConjugationQuestions().filter(item => item.mode === "praesens" && item.person === "ich" && item.wordId !== details.id).map(item => item.answer));
  if (details.erPresent) addChoiceQuestion("Choose the er/sie/es-form.", details.erPresent, getRafiTutorConjugationQuestions().filter(item => item.mode === "praesens" && item.person === "er/sie/es" && item.wordId !== details.id).map(item => item.answer));
  if (details.partizipII) addChoiceQuestion("Choose Partizip II.", details.partizipII, getRafiTutorConjugationQuestions().filter(item => item.mode === "perfekt" && item.wordId !== details.id).map(item => item.answer.split(" ").at(-1)));
  if (details.examples?.length) {
    const otherExamples = peers.flatMap(item => getRafiTutorWordDetails(item.id)?.examples || []);
    addChoiceQuestion("Which recorded example belongs to this word?", details.examples[0], otherExamples);
  }
  const selectedQuestions = questions.slice(0, 5);
  const view = document.createElement("div"); view.className = "rafi-tutor-tool";
  const back = makeButton("← SprachCoach home", "rafi-tutor-result-back");
  const title = document.createElement("h3"); title.textContent = `Test: ${details.word}`;
  const game = document.createElement("div"); game.className = "rafi-article-game";
  let index = 0, correct = 0;
  const draw = () => {
    game.replaceChildren();
    if (!selectedQuestions.length) { const empty = document.createElement("p"); empty.textContent = "This word does not have enough recorded metadata for a reliable local test."; game.appendChild(empty); return; }
    if (index >= selectedQuestions.length) {
      const heading = document.createElement("h4"); heading.textContent = "Word Mastery";
      const score = document.createElement("p"); score.textContent = `${correct} / ${selectedQuestions.length}`;
      const actions = document.createElement("div"); actions.className = "rafi-quiz-end-actions";
      const review = makeButton("Review again", "rafi-tutor-primary"); review.addEventListener("click", () => { index = correct = 0; draw(); });
      const learned = makeButton("Mark learned", "rafi-tutor-primary"); learned.addEventListener("click", async () => { const result = await markRafiTutorWordLearned(details.id); learned.textContent = result.message; learned.disabled = result.ok; });
      const nextWord = makeButton("Next word", "rafi-tutor-result-back"); nextWord.addEventListener("click", () => { if (openNextRafiTutorWord(details.id)) { panel.dispatchEvent(new CustomEvent("rafi:tutorhome")); } });
      actions.append(review, learned, nextWord); game.append(heading, score, actions); return;
    }
    const question = selectedQuestions[index];
    const stats = document.createElement("p"); stats.className = "rafi-article-stats"; stats.textContent = `Question ${index + 1}/${selectedQuestions.length}`;
    const prompt = document.createElement("h4"); prompt.textContent = question.prompt;
    const options = document.createElement("div"); options.className = "rafi-vocab-options";
    const feedback = document.createElement("p"); feedback.setAttribute("role", "status");
    question.options.forEach(value => { const button = makeButton(value); button.addEventListener("click", () => { [...options.children].forEach(child => child.disabled = true); const isCorrect = value === question.answer; recordTutorPerformance(details.id, isCorrect); if (isCorrect) { correct += 1; feedback.textContent = "✅ Correct"; } else feedback.textContent = `❌ Correct answer: ${question.answer}`; const next = makeButton(index + 1 >= selectedQuestions.length ? "See mastery" : "Next question", "rafi-tutor-primary"); next.addEventListener("click", () => { index += 1; draw(); }); game.appendChild(next); next.focus(); }, { once: true }); options.appendChild(button); });
    game.append(stats, prompt, options, feedback);
  };
  back.addEventListener("click", () => panel.dispatchEvent(new CustomEvent("rafi:tutorhome")));
  view.append(back, title, game); body.appendChild(view); draw();
}

function renderSmartReview(panel, weakOnly = false) {
  const stats = getTutorReviewStats();
  const ids = (weakOnly ? stats.weak : stats.ready).map(item => item.id);
  const words = getRafiTutorVocabulary().filter(item => ids.includes(item.id) && item.meaningEn?.length);
  const body = panel.querySelector(".rafi-tutor-body"); body.replaceChildren();
  const view = document.createElement("div"); view.className = "rafi-tutor-tool";
  const back = makeButton("← SprachCoach home", "rafi-tutor-result-back");
  const title = document.createElement("h3"); title.textContent = weakOnly ? "Review Weak Words" : "Today's Review";
  const game = document.createElement("div"); game.className = "rafi-article-game";
  let index = 0, correct = 0;
  const queue = shuffle(words).slice(0, 12);
  const draw = () => {
    game.replaceChildren();
    const word = queue[index];
    if (!word) {
      const heading = document.createElement("h4"); heading.textContent = index ? "Review complete" : "No words are ready yet";
      const score = document.createElement("p"); score.textContent = index ? `${correct} / ${index}` : "Complete word tests and quizzes to build your local review list.";
      const existing = makeButton("Open Review Words", "rafi-tutor-primary"); existing.addEventListener("click", () => openExistingRafiReview());
      game.append(heading, score, existing); return;
    }
    const prompt = document.createElement("h4"); prompt.textContent = word.article ? `${word.article} ${word.word}` : word.word;
    const reveal = makeButton("Show meaning", "rafi-tutor-primary");
    reveal.addEventListener("click", () => {
      reveal.remove(); appendField(game, "English", word.meaningEn); appendField(game, "বাংলা", word.meaningBn);
      const actions = document.createElement("div"); actions.className = "rafi-quiz-end-actions";
      [["I remembered", true], ["Review again", false]].forEach(([label, result]) => { const button = makeButton(label, result ? "rafi-tutor-primary" : "rafi-tutor-result-back"); button.addEventListener("click", () => { recordTutorPerformance(word.id, result); if (result) correct += 1; index += 1; draw(); }); actions.appendChild(button); });
      game.appendChild(actions);
    });
    game.append(prompt, reveal);
  };
  back.addEventListener("click", () => panel.dispatchEvent(new CustomEvent("rafi:tutorhome")));
  view.append(back, title, game); body.appendChild(view); draw();
}

function renderTutorDashboard(panel) {
  const body = panel.querySelector(".rafi-tutor-body"); body.replaceChildren();
  const context = getRafiTutorContext();
  const stats = getTutorReviewStats();
  const dashboard = document.createElement("div"); dashboard.className = "rafi-tutor-dashboard";
  const intro = document.createElement("div"); intro.className = "rafi-tutor-dashboard-intro";
  const title = document.createElement("h3"); title.textContent = "SprachCoach";
  const text = document.createElement("p"); text.textContent = "Practice German with your Rafi's Wörterbuch learning data.";
  intro.append(title, text); dashboard.appendChild(intro);
  if (context.view === "word" && context.word?.id) {
    const details = getRafiTutorWordDetails(context.word.id);
    const current = document.createElement("section"); current.className = "rafi-dashboard-context";
    const label = document.createElement("small"); label.textContent = "Currently studying";
    const word = document.createElement("h4"); word.textContent = context.word.word;
    const actions = document.createElement("div"); actions.className = "rafi-dashboard-actions";
    const contextActions = [
      ["Explain", () => renderWordExplanation(panel)],
      ["Examples", () => renderWordExamples(panel)],
      ["Test Me", () => renderContextWordTest(panel)]
    ];
    if (details?.isVerb) {
      contextActions.splice(1, 0, ["Conjugate", () => renderContextualConjugation(panel)]);
    } else if (details?.isNoun && (details.article || details.plural)) {
      contextActions.splice(1, 0, ["Article & Plural", () => renderNounArticleAndPlural(panel)]);
    }
    contextActions.forEach(([name, handler]) => { const button = makeButton(name); button.addEventListener("click", handler); actions.appendChild(button); });
    current.append(label, word, actions); dashboard.appendChild(current);
  }
  const review = document.createElement("section"); review.className = "rafi-dashboard-review";
  const reviewTitle = document.createElement("h4"); reviewTitle.textContent = "Today's Review";
  const ready = document.createElement("p"); ready.textContent = `${stats.ready.length} words ready`;
  const reviewActions = document.createElement("div"); reviewActions.className = "rafi-dashboard-actions";
  const start = makeButton("Start Review"); start.addEventListener("click", () => renderSmartReview(panel, false));
  const weak = makeButton("Review Weak Words"); weak.addEventListener("click", () => renderSmartReview(panel, true));
  reviewActions.append(start, weak); review.append(reviewTitle, ready, reviewActions); dashboard.appendChild(review);
  const tools = document.createElement("div"); tools.className = "rafi-dashboard-tools";
  const toolItems = [
    ["Weak Words", () => renderSmartReview(panel, true)], ["Vocabulary Quiz", () => renderVocabularyQuiz(panel)],
    ["Grammar Practice", () => renderGrammarLibrary(panel)], ["Article Trainer", () => renderArticleTrainer(panel)],
    ["Cases", () => renderCaseTrainer(panel)], ["Conjugation", () => renderConjugationTrainer(panel)],
    ["Sentence Builder", () => renderSentenceBuilder(panel)], ["Common Mistake Checker", () => renderMistakeChecker(panel)]
  ];
  toolItems.forEach(([name, handler]) => { const button = makeButton(name); button.addEventListener("click", handler); tools.appendChild(button); });
  dashboard.appendChild(tools);
  const progress = document.createElement("section"); progress.className = "rafi-dashboard-progress";
  const progressTitle = document.createElement("h4"); progressTitle.textContent = "Progress"; progress.appendChild(progressTitle);
  [["Words reviewed today", stats.reviewedToday], ["Quiz accuracy", stats.accuracy === null ? null : `${stats.accuracy}%`], ["Current practice streak", stats.streak || null], ["Weak words", stats.weak.length]].forEach(([label, value]) => { if (value === null) return; const item = document.createElement("p"); item.textContent = `${label}: ${value}`; progress.appendChild(item); });
  dashboard.appendChild(progress); body.appendChild(dashboard);
}

export function initRafiTutor() {
  const launcher = document.getElementById("rafiTutorBtn");
  if (!launcher) return;
  const panelLaunchers = [...document.querySelectorAll(".sprachcoach-panel-btn")];
  const launchers = [launcher, ...panelLaunchers];
  const panel = document.getElementById("rafiTutorPanel") || createTutorPanel();
  const closeButton = panel.querySelector("#rafiTutorClose");
  const newButton = panel.querySelector("#rafiTutorNew");
  const syncHeaderHeight = () => {
    const headerHeight = document.querySelector(".header")?.getBoundingClientRect().height;
    if (headerHeight) document.documentElement.style.setProperty("--rafi-tutor-header-height", `${headerHeight}px`);
  };

  const open = source => {
    syncHeaderHeight();
    showTutorHome();
    lastFocusedElement = source || document.activeElement;
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    launchers.forEach(button => button.setAttribute("aria-expanded", "true"));
    document.body.classList.add("rafi-tutor-open");
    closeButton?.focus();
  };

  const close = () => {
    if (!panel.classList.contains("is-open")) return;
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    launchers.forEach(button => button.setAttribute("aria-expanded", "false"));
    document.body.classList.remove("rafi-tutor-open");
    (lastFocusedElement instanceof HTMLElement ? lastFocusedElement : launcher).focus();
  };

  launchers.forEach(button => {
    button.addEventListener("click", () => panel.classList.contains("is-open") ? close() : open(button));
  });
  closeButton?.addEventListener("click", close);
  const showTutorHome = () => {
    renderTutorDashboard(panel);
  };
  panel.addEventListener("rafi:tutorhome", showTutorHome);
  window.addEventListener("rafi:tutorcontextchange", () => {
    if (panel.classList.contains("is-open")) showTutorHome();
  });
  newButton?.addEventListener("click", () => {
    showTutorHome();
    panel.querySelector(".rafi-dashboard-tools button")?.focus();
  });
  window.addEventListener("resize", syncHeaderHeight, { passive: true });

  panel.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = getFocusable(panel);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
