import { initLevelPage } from "./level-page.js";
import { initCourseInteractions } from "./level-interactions.js";
import { initAuthGate } from "./auth-gate.js";
import { updateLibrarySessionCards } from "./library-session.js";

initAuthGate();
initLevelPage();
initCourseInteractions();
updateLibrarySessionCards();
