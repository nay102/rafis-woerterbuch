import { initLevelPage } from "./level-page.js";
import { initCourseInteractions } from "./level-interactions.js";
import { initAuthGate } from "./auth-gate.js";
import { updateLibrarySessionCards } from "./library-session.js";
import { updateGrammarChallengeCard } from "./a1-grammar-challenge-data.js";
import { updateFlashcardTrainerCard } from "./a1-flashcard-data.js";
import { updateMatchingCard } from "./a1-matching.js";
import { updateListeningCard } from "./a1-listening.js";
import { updateReadingCard } from "./a1-reading.js";
import { updateBuilderCard } from "./a1-builder.js";
import { updateSpeakingCard } from "./a1-speaking.js";
import { updateDialogueCard } from "./a1-dialogues.js";
import { getA1ProgressSummary } from "./a1-progress.js";

initAuthGate();
initLevelPage();
initCourseInteractions();
updateLibrarySessionCards();
updateGrammarChallengeCard();
updateFlashcardTrainerCard();
updateMatchingCard();
updateListeningCard();
updateReadingCard();
updateBuilderCard();
updateSpeakingCard();
updateDialogueCard();

function updateA1ProgressEntry() {
  const entry = document.querySelector("[data-a1-progress-entry]");
  if (!entry) return;
  const summary = getA1ProgressSummary();
  entry.querySelector("[data-a1-journey]").textContent = `${summary.journey}% Journey`;
  entry.querySelector("[data-a1-library-progress]").textContent = `${summary.library.completed} / 16 Library topics`;
  entry.querySelector("[data-a1-practice-progress]").textContent = `${summary.practice.started} / 8 Practice activities`;
  entry.querySelector("h2").textContent = summary.journey ? "Continue Your A1 Journey" : "Start Your A1 Journey";
}

updateA1ProgressEntry();
addEventListener("pageshow", updateA1ProgressEntry);
