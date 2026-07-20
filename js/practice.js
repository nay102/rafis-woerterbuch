import { initLevelPage } from "./level-page.js";
import { initAuthGate } from "./auth-gate.js";
import { PRACTICE_TYPES, getQuestions } from "./practice-data.js";

const params = new URLSearchParams(location.search);
const rawLevel = (params.get("level") || "A1").toUpperCase();
const level = ["A1","A2","B1","B2"].includes(rawLevel) ? rawLevel : "A1";
const rawType = params.get("type") || "grammar";
const type = PRACTICE_TYPES[rawType] ? rawType : "grammar";
const config = PRACTICE_TYPES[type];
const questions = getQuestions(level, type);
let submitted = false;

const $ = id => document.getElementById(id);
function render() {
  document.title = `${config.title} | Rafis Sprachwelt ${level}`;
  $("practiceBranding").textContent = `Rafis Sprachwelt - ${level}`;
  $("practiceLevel").textContent = `${level} Practice`;
  $("practiceType").textContent = config.label;
  $("practiceTitle").textContent = config.title;
  $("practiceInstruction").textContent = config.instruction;
  $("practiceBack").href = `${level.toLowerCase()}.html#exercises`;
  $("questionCount").textContent = `${questions.length} Questions`;
  $("practiceForm").innerHTML = questions.map((item, questionIndex) => `
    <fieldset class="practice-question" data-question="${questionIndex}">
      <legend><span>${questionIndex + 1}</span>${item.prompt}</legend>
      ${config.audio ? `<button class="listen-button" type="button" data-speech="${item.speech.replaceAll('"','&quot;')}"><i class="fa-solid fa-volume-high"></i> Play sentence</button>` : ""}
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
    card.querySelectorAll("input").forEach(input => input.disabled = true);
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
initAuthGate();
initLevelPage();
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
