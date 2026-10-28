import {sitePhotos, panelPageContent, CATEGORY_EXPLANATIONS, GERMANY_PAGE_COPY, BANGLADESH_PAGE_COPY} from "./site-content.js";

import {DEFAULT_APP_SETTINGS} from "./account-settings.js";
import {initLearningSync} from "./learning-sync.js";
import {retainAccountPatch, acknowledgeAccountPatch, pendingAccount, withPendingAccount,
  retainSubmissionDraft, submissionDraft, clearSubmissionDraft, accountSaveError, validateSubmission} from "./account-data.js";
import {initAccessibility} from "./accessibility.js";
import {getStoredSettings, saveStoredSettings} from "./account-settings.js";
import {escapeHtml, getWordSerial, findExactWordMatches, isLikelyGermanWordQuery, formatMeaningText, shouldShowSynonym, isVerbWord, formatExamples, getEasyExamples, formatEasyExamples, getConjugationStatusText, getSynonymText, normalizeText} from "./dictionary-format.js";
import {getBasePath, buildRouteUrl, setSingleRouteParam, setHomeRoute} from "./ui-routing.js";
/* =========================================================
   UI CONTROLLER

   This module connects the word database and authentication
   services to the page. Its responsibilities are grouped in
   this order:

   1. Shared application state and browser storage
   2. Learning progress, search, and formatting helpers
   3. Static content used by categories and information pages
   4. Routing and page rendering
   5. Word details and conjugation
   6. Account, settings, authentication, and theme controls
   7. Header, search, and side-panel interactions
   8. Application initialization
========================================================= */

import { getAllWords, loadWords } from "./words.js";
import { validateDictionary } from "./data-quality.js";
import {
  signup,
  login,
  listenAuth,
  logout,
  ensureUserProfile,
  touchUserLastLogin,
  getUserProfile,
  resetPasswordByEmail,
  changePasswordWithConfirmation,
  deleteAccountWithPassword,
  saveUserAppSettings,
  saveUserFavorites,
  saveUserProfilePatch,
  saveUserWordNote,
  submitWordSuggestion,
  submitWordReport
} from "./auth-client.js";

/* =========================================================
   GLOBAL STATE

   Values in this section describe the current UI session, so
   every renderer and event handler reads the same information.
========================================================= */

// Category currently displayed on the category page.
let currentCategory = null;
const standalonePage = document.body.dataset.standalonePage;
function openMainSite(page = "", word = "") {
  if (page === "option5" || page === "exam-zone") { window.location.href = new URL("../exam-zone/", import.meta.url).href; return; }
  if (page === "owner") { window.location.href = new URL("../about-rafi/", import.meta.url).href; return; }
  const url = new URL("../", import.meta.url);
  if (page && page !== "home") url.searchParams.set("page", page);
  if (word) url.searchParams.set("word", word);
  window.location.href = url.href;
}
// Remembers the expanded word-list section for each category.
let activeSectionMemory = {};
// Identifies the main view currently shown to the visitor.
let currentView = "home";
// Minimal, public-safe state used by the local Rafi Tutor integration.
let rafiTutorContext = { view: "home" };

function setRafiTutorContext(context) {
  rafiTutorContext = context;
  window.dispatchEvent(new CustomEvent("rafi:tutorcontextchange"));
}
// Navigation-source flags determine the correct Back button destination.
let openedFromHomeSearch = false;
let openedFromCategory = false;
// Cleanup callback for the category search's outside-click listener.
let detachCategorySearchOutsideClose = null;
// Signed-in user and already fetched profile data.
let currentUser = null;
let authStateResolved = false;
let accountViewGeneration = 0;
const ADMIN_EMAIL = "nayeemislam3378@gmail.com";
const userProfileCache = new Map();
// Active appearance, accessibility, and synchronization preferences.
let currentAppSettings = null;
// Fast lookup collections for favorite and learned word IDs.
const favoriteWordIds = new Set();
const learnedWordIds = new Set();
// User-created study lists grouped by internal list key.
const customListWordIds = {
  myVerbs: new Set(),
  examPrep: new Set()
};
// Notes and recently searched terms for the current account.
let wordNotesMap = {};
let searchHistoryItems = [];
let reviewSchedule = {};
let practiceOrigin = { type: "panel" };
// Learning counters displayed on progress and account screens.
let progressStats = {
  wordsOpened: 0,
  daysActive: 0,
  streak: 0,
  lastActiveDate: ""
};
// Last category location used when returning from a word page.
let lastContext = {
  category: "",
  section: null
};
// Additional navigation and warning-modal state.
let openedFromFavorites = false;
let schimpfWarningOpen = false;
// Selected languages for multilingual information pages.
let germanyPageLanguage = "en";
let bangladeshPageLanguage = "en";


// Browser-storage keys and default application preferences.
const LOCAL_FAVORITES_KEY_PREFIX = "rw_local_favorites_v1_";
const LOCAL_LEARNING_KEY_PREFIX = "rw_local_learning_v1_";
// Prevents saved search history from growing without limit.
const MAX_SEARCH_HISTORY = 40;

/* =========================================================
   ROUTING, STORAGE, AND APPLICATION SETTINGS

   Route helpers support local hosting and GitHub Pages. Storage
   helpers provide local fallback data and signed-in cloud sync.
========================================================= */


function restoreGitHubFallbackRoute() {
  const params = new URLSearchParams(window.location.search);
  const fallbackPath = params.get("__gh_path");

  if (!fallbackPath) return;

  params.delete("__gh_path");

  // Map legacy path routes to query routes if no explicit query route exists.
  if (!params.has("word") && !params.has("category") && !params.has("page")) {
    const cleanPath = fallbackPath.replace(/^\/+|\/+$/g, "");
    if (cleanPath && panelPageContent[cleanPath]) {
      params.set("page", cleanPath);
    }
  }

  history.replaceState(null, "", buildRouteUrl(params));
}


function getStorageUserId(user = currentUser) {
  if (user?.uid) return user.uid;
  const cachedEmail = localStorage.getItem(AUTH_CACHE_EMAIL_KEY) || "";
  return cachedEmail ? `email_${cachedEmail.toLowerCase()}` : "guest";
}

function getLocalFavoritesKey(user = currentUser) {
  return `${LOCAL_FAVORITES_KEY_PREFIX}${getStorageUserId(user)}`;
}

function getLocalLearningKey(user = currentUser) {
  return `${LOCAL_LEARNING_KEY_PREFIX}${getStorageUserId(user)}`;
}

function saveFavoritesToLocal(user = currentUser) {
  try {
    localStorage.setItem(
      getLocalFavoritesKey(user),
      JSON.stringify(Array.from(favoriteWordIds))
    );
  } catch {
    // Ignore local cache errors.
  }
}

function hydrateFavoritesFromLocal(user = currentUser) {
  try {
    const raw = localStorage.getItem(getLocalFavoritesKey(user));
    if (!raw) return;
    const list = JSON.parse(raw);
    favoriteWordIds.clear();
    (Array.isArray(list) ? list : []).forEach(id => {
      if (typeof id === "string" && id) favoriteWordIds.add(id);
    });
  } catch {
    // Ignore local cache errors.
  }
}

function saveLearningStateToLocal(user = currentUser) {
  try {
    localStorage.setItem(
      getLocalLearningKey(user),
      JSON.stringify({
        learnedWords: Array.from(learnedWordIds),
        customLists: {
          myVerbs: Array.from(customListWordIds.myVerbs),
          examPrep: Array.from(customListWordIds.examPrep)
        },
        notes: wordNotesMap,
        searchHistory: searchHistoryItems,
        reviewSchedule,
        progressStats,
        lastContext
      })
    );
  } catch {
    // Ignore local cache errors.
  }
}

function hydrateLearningStateFromLocal(user = currentUser) {
  try {
    const raw = localStorage.getItem(getLocalLearningKey(user));
    if (!raw) return;
    const localData = JSON.parse(raw) || {};
    hydrateAccountLearningState(localData);
  } catch {
    // Ignore local cache errors.
  }
}

function buildAccountDataSignature() {
  const notesEntries = Object.entries(wordNotesMap || {}).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  return JSON.stringify({
    favorites: Array.from(favoriteWordIds).sort(),
    learned: Array.from(learnedWordIds).sort(),
    myVerbs: Array.from(customListWordIds.myVerbs).sort(),
    examPrep: Array.from(customListWordIds.examPrep).sort(),
    notes: notesEntries,
    history: (searchHistoryItems || [])
      .map(item => String(item?.q || "").toLowerCase())
      .slice(0, MAX_SEARCH_HISTORY),
    reviews: reviewSchedule,
    progress: progressStats,
    context: lastContext
  });
}

function applyAppSettings(settings, { persist = true } = {}) {
  currentAppSettings = { ...DEFAULT_APP_SETTINGS, ...(settings || {}) };

  const body = document.body;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const shouldUseDark =
    currentAppSettings.theme === "dark" ||
    (currentAppSettings.theme === "system" && prefersDark);
  body.classList.toggle("dark", shouldUseDark);
  body.classList.toggle("dark-mode", shouldUseDark);

  const panelThemeToggle = document.getElementById("panelDarkToggle");
  if (panelThemeToggle) {
    panelThemeToggle.textContent = shouldUseDark ? "☀️ Light Mode" : "🌙 Dark Mode";
    panelThemeToggle.setAttribute(
      "aria-label",
      shouldUseDark ? "Switch to Light Mode" : "Switch to Dark Mode"
    );
  }

  body.classList.remove("text-compact", "text-large");
  if (currentAppSettings.textSize === "compact") body.classList.add("text-compact");
  if (currentAppSettings.textSize === "large") body.classList.add("text-large");

  body.classList.toggle("reduce-motion", Boolean(currentAppSettings.reducedMotion));

  if (persist) saveStoredSettings(currentAppSettings);
}

async function persistSettingsIfNeeded() {
  if (!currentUser) return true;
  const user = currentUser, patch = {appSettings:{...currentAppSettings}};
  retainAccountPatch(user.uid, patch);
  try {
    await saveUserAppSettings(user, patch.appSettings);
    acknowledgeAccountPatch(user.uid, patch);
    return currentUser?.uid === user.uid;
  } catch (error) {
    if (currentUser?.uid === user.uid) showToast(accountSaveError(error, "Settings"), "error");
    return false;
  }
}

function getFavoriteWords() {
  const allWords = getAllWords();
  return allWords.filter(w => favoriteWordIds.has(w.id));
}

async function persistFavoritesIfLoggedIn() {
  saveFavoritesToLocal();
  if (!currentUser) return false;
  const user = currentUser, patch = {favorites:Array.from(favoriteWordIds)};
  retainAccountPatch(user.uid, patch);
  if (!currentAppSettings?.cloudSync) return false;
  try {
    await saveUserFavorites(user, patch.favorites);
    acknowledgeAccountPatch(user.uid, patch);
    return currentUser?.uid === user.uid;
  } catch (error) {
    if (currentUser?.uid === user.uid) showToast(accountSaveError(error, "Favorites"), "error");
    return false;
  }
}

/* =========================================================
   ACCOUNT-BOUND LEARNING STATE HELPERS

   Updates history, notes, lists, progress counters, and cloud data.
========================================================= */
function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDayDiff(previousDayKey, currentDayKey) {
  if (!previousDayKey || !currentDayKey) return 0;
  const a = new Date(`${previousDayKey}T00:00:00`);
  const b = new Date(`${currentDayKey}T00:00:00`);
  return Math.round((b - a) / 86400000);
}

function addSearchHistoryItem(queryText) {
  const clean = String(queryText || "").trim();
  if (!clean) return;

  const now = Date.now();
  searchHistoryItems = searchHistoryItems.filter(
    item => String(item?.q || "").toLowerCase() !== clean.toLowerCase()
  );
  searchHistoryItems.unshift({ q: clean, t: now });
  if (searchHistoryItems.length > MAX_SEARCH_HISTORY) {
    searchHistoryItems = searchHistoryItems.slice(0, MAX_SEARCH_HISTORY);
  }
}

async function persistLearningStateIfLoggedIn() {
  saveLearningStateToLocal();
  if (!currentUser) return false;
  const user = currentUser;
  const patch = {
      learnedWords: Array.from(learnedWordIds),
      customLists: {
        myVerbs: Array.from(customListWordIds.myVerbs),
        examPrep: Array.from(customListWordIds.examPrep)
      },
      searchHistory: searchHistoryItems,
      reviewSchedule,
      progressStats,
      lastContext
    };
  retainAccountPatch(user.uid, patch);
  if (!currentAppSettings?.cloudSync) return false;
  try {
    await saveUserProfilePatch(user, patch);
    acknowledgeAccountPatch(user.uid, patch);
    return currentUser?.uid === user.uid;
  } catch (error) {
    if (currentUser?.uid === user.uid) showToast(accountSaveError(error, "Learning data"), "error");
    return false;
  }
}

async function persistSingleNoteIfLoggedIn(wordId, text) {
  saveLearningStateToLocal();
  if (!currentUser) return false;
  const user = currentUser, patch = {notes:{[wordId]:text}};
  retainAccountPatch(user.uid, patch);
  if (!currentAppSettings?.cloudSync) { showToast("Note retained on this device; cloud sync is off.", "success"); return false; }
  try {
    await saveUserWordNote(user, wordId, text);
    acknowledgeAccountPatch(user.uid, patch);
    return currentUser?.uid === user.uid;
  } catch (error) {
    if (currentUser?.uid === user.uid) showToast(accountSaveError(error, "Note"), "error");
    return false;
  }
}

async function retryPendingAccount(user, generation = accountViewGeneration) {
  const active = () => generation === accountViewGeneration && currentUser?.uid === user.uid;
  if (!active()) return;
  const pending = JSON.parse(JSON.stringify(pendingAccount(user.uid)));
  try {
    if (pending.appSettings) {
      await saveUserAppSettings(user, pending.appSettings);
      acknowledgeAccountPatch(user.uid, {appSettings:pending.appSettings});
    }
    if (!active() || currentAppSettings?.cloudSync === false) return;
    if (pending.favorites) {
      await saveUserFavorites(user, pending.favorites);
      acknowledgeAccountPatch(user.uid, {favorites:pending.favorites});
    }
    if (!active() || currentAppSettings?.cloudSync === false) return;
    const {appSettings, favorites, notes, ...learning} = pending;
    if (Object.keys(learning).length) {
      await saveUserProfilePatch(user, learning);
      acknowledgeAccountPatch(user.uid, learning);
    }
    for (const [id, value] of Object.entries(notes || {})) {
      if (!active() || currentAppSettings?.cloudSync === false) return;
      await saveUserWordNote(user, id, value);
      acknowledgeAccountPatch(user.uid, {notes:{[id]:value}});
    }
  } catch (error) {
    if (active()) showToast(accountSaveError(error, "Pending account changes"), "error");
  }
}

function hydrateAccountLearningState(profile) {
  learnedWordIds.clear();
  (profile?.learnedWords || []).forEach(id => {
    if (typeof id === "string" && id) learnedWordIds.add(id);
  });

  customListWordIds.myVerbs.clear();
  (profile?.customLists?.myVerbs || []).forEach(id => {
    if (typeof id === "string" && id) customListWordIds.myVerbs.add(id);
  });
  customListWordIds.examPrep.clear();
  (profile?.customLists?.examPrep || []).forEach(id => {
    if (typeof id === "string" && id) customListWordIds.examPrep.add(id);
  });

  wordNotesMap = profile?.notes || {};
  searchHistoryItems = Array.isArray(profile?.searchHistory)
    ? profile.searchHistory.slice(0, MAX_SEARCH_HISTORY)
    : [];
  reviewSchedule =
    profile?.reviewSchedule && typeof profile.reviewSchedule === "object"
      ? profile.reviewSchedule
      : {};
  progressStats = {
    wordsOpened: Number(profile?.progressStats?.wordsOpened || 0),
    daysActive: Number(profile?.progressStats?.daysActive || 0),
    streak: Number(profile?.progressStats?.streak || 0),
    lastActiveDate: String(profile?.progressStats?.lastActiveDate || "")
  };
  lastContext = {
    category: String(profile?.lastContext?.category || ""),
    section:
      typeof profile?.lastContext?.section === "number"
        ? profile.lastContext.section
        : null
  };

  if (lastContext.category) {
    activeSectionMemory[lastContext.category] = lastContext.section;
  }
}

function updateProgressStatsForWordOpen() {
  const today = getTodayKey();
  const previousDay = progressStats.lastActiveDate || "";
  const delta = getDayDiff(previousDay, today);

  if (!previousDay) {
    progressStats.daysActive = 1;
    progressStats.streak = 1;
  } else if (delta > 0) {
    progressStats.daysActive += 1;
    progressStats.streak = delta === 1 ? progressStats.streak + 1 : 1;
  }

  progressStats.wordsOpened += 1;
  progressStats.lastActiveDate = today;
}

// DEBOUNCE FUNCTION (Performance)
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}


function buildDuplicateResultHTML(matches, sourceWords) {
  const items = matches.map((w, idx) => {
    const serial = getWordSerial(w, sourceWords);
    return `${idx + 1}. #${serial} - ${w.word}`;
  });

  return `Found ${matches.length} times:<br>${items.join("<br>")}`;
}


function buildMissingWordPromptHTML(queryText, notFoundText = "Not added yet.") {
  const escapedWord = escapeHtml(String(queryText || "").trim());
  return `
    ${escapeHtml(notFoundText)}<br>
    <button type="button" class="submit-word-hint-btn" data-missing-word="${escapedWord}">
      Click here to Submit this new word
    </button>
  `;
}


function normalizePanelPageKey(pageKey) {
  return pageKey === "option4" ? "sprachwelt" : pageKey === "exam-zone" ? "option5" : pageKey;
}

function formatPanelDescription(pageKey, description) {
  if (pageKey !== "sprachwelt") {
    return escapeHtml(description);
  }

  const lines = String(description || "").split("\n");
  return lines
    .map((line, index) => {
      const escapedLine = escapeHtml(line);
      return index === 0 || index === lines.length - 1
        ? `<strong>${escapedLine}</strong>`
        : escapedLine;
    })
    .join("<br>");
}

function buildPhotoStyle(item = {}) {
  const styleRules = [];
  if (item.imageRatio) styleRules.push(`--photo-ratio: ${escapeHtml(item.imageRatio)}`);
  if (item.imageHeight) styleRules.push(`--photo-height: ${escapeHtml(item.imageHeight)}`);
  if (item.imagePosition) styleRules.push(`--photo-position: ${escapeHtml(item.imagePosition)}`);
  return styleRules.length ? ` style="${styleRules.join("; ")}"` : "";
}


function renderDataQualityPage() {
  if (!isAdminUser()) {
    if (authStateResolved) {
      setHomeRoute();
      showSection("homePage");
      showToast("Administrator access is required.", "error");
    }
    return;
  }
  const host = document.getElementById("desktopPage");
  if (!host) return;
  const report = validateDictionary(getAllWords());
  showSection("desktopPage");
  host.style.display = "block";
  host.className = "quality-page";
  host.innerHTML = `
    <div class="quality-shell">
      <div class="quality-heading">
        <div>
          <p class="quality-eyebrow">Dictionary maintenance</p>
          <h1 tabindex="-1">Data Quality Dashboard</h1>
          <p>Live checks for missing, malformed, and duplicate dictionary content.</p>
        </div>
        <button type="button" class="quality-export-btn" id="qualityExport">Export JSON report</button>
      </div>
      <div class="quality-kpis" aria-label="Validation summary">
        <article><strong>${report.totalWords}</strong><span>Total words</span></article>
        <article><strong>${report.validWords}</strong><span>Without errors</span></article>
        <article class="quality-error"><strong>${report.counts.error}</strong><span>Errors</span></article>
        <article class="quality-warning"><strong>${report.counts.warning}</strong><span>Warnings</span></article>
      </div>
      <div class="quality-note">
        <strong>Easy examples:</strong> ${report.easyExamples.ready} of ${report.easyExamples.total} ready.
        Empty entries are intentionally tracked only and are not validation errors.
      </div>
      <div class="quality-controls">
        <label>Severity
          <select id="qualitySeverity">
            <option value="">All</option><option value="error">Errors</option><option value="warning">Warnings</option>
          </select>
        </label>
        <label>Category
          <select id="qualityCategory">
            <option value="">All categories</option>
            ${report.categoryStats.map(item => `<option value="${escapeHtml(item.category)}">${escapeHtml(item.category)} (${item.issues})</option>`).join("")}
          </select>
        </label>
        <label class="quality-query">Find issue
          <input id="qualityQuery" type="search" placeholder="Word, field, or message">
        </label>
      </div>
      <p id="qualityResultCount" class="quality-result-count" role="status"></p>
      <div id="qualityIssues" class="quality-issues"></div>
    </div>`;

  const severity = host.querySelector("#qualitySeverity");
  const category = host.querySelector("#qualityCategory");
  const query = host.querySelector("#qualityQuery");
  const list = host.querySelector("#qualityIssues");
  const count = host.querySelector("#qualityResultCount");
  const draw = () => {
    const needle = query.value.trim().toLowerCase();
    const filtered = report.issues.filter(issue =>
      (!severity.value || issue.severity === severity.value) &&
      (!category.value || issue.category === category.value) &&
      (!needle || `${issue.word} ${issue.field} ${issue.message}`.toLowerCase().includes(needle))
    );
    count.textContent = `${filtered.length} issue${filtered.length === 1 ? "" : "s"} shown`;
    list.innerHTML = filtered.length ? filtered.map(issue => `
      <button type="button" class="quality-issue quality-${issue.severity}" data-word-id="${escapeHtml(issue.id)}">
        <span class="quality-badge">${escapeHtml(issue.severity)}</span>
        <span><strong>${escapeHtml(issue.word)}</strong><small>${escapeHtml(issue.category)} · ${escapeHtml(issue.field)}</small></span>
        <span class="quality-message">${escapeHtml(issue.message)}</span>
      </button>`).join("") : `<div class="quality-empty">No issues match these filters.</div>`;
  };
  [severity, category, query].forEach(control => control.addEventListener("input", draw));
  list.addEventListener("click", event => {
    const button = event.target.closest("[data-word-id]");
    if (!button?.dataset.wordId) return;
    const word = getAllWords().find(item => String(item.id) === button.dataset.wordId);
    if (word) openWordDetail(word.id);
  });
  host.querySelector("#qualityExport").addEventListener("click", () => {
    if (!isAdminUser()) {
      showToast("Administrator access is required.", "error");
      return;
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dictionary-quality-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  });
  draw();
  host.querySelector("h1")?.focus();
}

function speakGerman(text) {
  const clean = String(text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return;
  if (!("speechSynthesis" in window)) {
    showToast("Audio pronunciation is not supported by this browser.", "error");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = "de-DE";
  utterance.rate = 0.86;
  const germanVoice = window.speechSynthesis
    .getVoices()
    .find(voice => String(voice.lang || "").toLowerCase().startsWith("de"));
  if (germanVoice) utterance.voice = germanVoice;
  window.speechSynthesis.speak(utterance);
}

function showLearningToolPage(className, html) {
  const page = document.getElementById("desktopPage");
  if (!page) return null;
  showSection("desktopPage");
  page.style.display = "block";
  page.className = className;
  page.innerHTML = html;
  window.scrollTo({ top: 0, behavior: "smooth" });
  return page;
}

const PRACTICE_ROUND_SIZE = 10;

function getPracticeRoundMessage(score) {
  if (score === PRACTICE_ROUND_SIZE) {
    return {
      title: "Outstanding work!",
      text: "A perfect round. Your focus and recall are excellent—keep that momentum going.",
      icon: "🏆"
    };
  }
  if (score >= 8) {
    return {
      title: "Excellent progress!",
      text: "You are very close to mastery. One more round will make these words even stronger.",
      icon: "🌟"
    };
  }
  if (score >= 5) {
    return {
      title: "Good work—keep building!",
      text: "Every answer strengthens your memory. Review the difficult ones and try another fresh round.",
      icon: "💪"
    };
  }
  return {
    title: "Keep going—you are learning!",
    text: "Mistakes are part of progress, not failure. Take another round and you will recognize more each time.",
    icon: "🌱"
  };
}

function buildPracticeRoundCompleteMarkup(score, roundNumber) {
  const message = getPracticeRoundMessage(score);
  return `
    <div class="practice-round-complete">
      <span class="practice-complete-icon" aria-hidden="true">${message.icon}</span>
      <span class="practice-level">Round ${roundNumber} complete</span>
      <h2>${escapeHtml(message.title)}</h2>
      <p class="practice-final-score">${score} out of ${PRACTICE_ROUND_SIZE} correct</p>
      <p>${escapeHtml(message.text)}</p>
      <button type="button" id="newPracticeRoundBtn" class="settings-primary">Start a New 10-Word Round</button>
    </div>`;
}

function buildConjugationQuestion(excludedWordIds = new Set()) {
  const people = [
    ["ich", "ich"], ["du", "du"], ["er_sie_es", "er/sie/es"],
    ["wir", "wir"], ["ihr", "ihr"], ["sie_formal", "Sie"]
  ];
  const tenses = [
    ["praesens", "Präsens"], ["praeteritum", "Präteritum"]
  ];
  const verbs = getAllWords().filter(word =>
    isVerbWord(word) &&
    word.conjugation &&
    !excludedWordIds.has(String(word.id))
  );
  if (!verbs.length) return null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const word = verbs[Math.floor(Math.random() * verbs.length)];
    const [tenseKey, tenseLabel] = tenses[Math.floor(Math.random() * tenses.length)];
    const [personKey, personLabel] = people[Math.floor(Math.random() * people.length)];
    const indicative = getConjugationNode(word.conjugation, "indikativ");
    const tense = getConjugationNode(indicative, tenseKey);
    const answer = getConjugationPersonValue(tense, personKey);
    if (answer && answer !== "-") return { word, tenseLabel, personLabel, answer };
  }
  return null;
}

function renderConjugationPracticePage() {
  if (!currentUser) {
    if (authStateResolved) {
      promptLoginForRestrictedCategory("Login to use Conjugation Practice.");
    }
    return;
  }
  const usedWordIds = new Set();
  let roundNumber = 1;
  let score = 0;
  let answered = 0;
  const getNextQuestion = () => {
    let nextQuestion = buildConjugationQuestion(usedWordIds);
    if (!nextQuestion) {
      usedWordIds.clear();
      nextQuestion = buildConjugationQuestion(usedWordIds);
    }
    if (nextQuestion) usedWordIds.add(String(nextQuestion.word.id));
    return nextQuestion;
  };
  let question = getNextQuestion();
  const page = showLearningToolPage("learning-tool-page", `
    <div class="learning-tool-shell">
      <div class="learning-tool-head">
        <button class="back-btn" id="practiceBackBtn"></button>
        <div><p class="quality-eyebrow">Active recall</p><h1>Conjugation Practice</h1>
        <p>Type the correct verb form without looking at the table.</p></div>
        <strong id="practiceScore" class="practice-score">0 / ${PRACTICE_ROUND_SIZE}</strong>
      </div>
      <section class="practice-card" id="practiceCard"></section>
    </div>`);
  if (!page) return;
  const backButton = page.querySelector("#practiceBackBtn");
  if (practiceOrigin.type === "word") {
    backButton.textContent = "← Back to Word";
    backButton.addEventListener("click", () => {
      const word = getAllWords().find(item => String(item.id) === String(practiceOrigin.wordId));
      if (!word) return goHomeWithoutRefresh();
      setSingleRouteParam("word", word.word);
      openWordDetail(word.id);
    });
  } else if (practiceOrigin.type === "category") {
    backButton.textContent = "← Back to Category";
    backButton.addEventListener("click", () => {
      setSingleRouteParam("category", practiceOrigin.category);
      openCategoryPage(practiceOrigin.category, { requireEntryWarning: false });
    });
  } else {
    backButton.textContent = "🏠 Home";
    backButton.addEventListener("click", goHomeWithoutRefresh);
  }
  const card = page.querySelector("#practiceCard");
  const scoreNode = page.querySelector("#practiceScore");

  const showRoundComplete = () => {
    scoreNode.textContent = `${score} / ${PRACTICE_ROUND_SIZE}`;
    card.innerHTML = buildPracticeRoundCompleteMarkup(score, roundNumber);
    card.querySelector("#newPracticeRoundBtn").addEventListener("click", () => {
      roundNumber += 1;
      score = 0;
      answered = 0;
      scoreNode.textContent = `0 / ${PRACTICE_ROUND_SIZE}`;
      question = getNextQuestion();
      draw();
    });
  };

  const draw = () => {
    if (!question) {
      card.innerHTML = `<p>No conjugation questions are available.</p>`;
      return;
    }
    card.innerHTML = `
      <span class="practice-level">${escapeHtml(question.word.level || "German")}</span>
      <p class="practice-question-count">Question ${answered + 1} of ${PRACTICE_ROUND_SIZE} · Round ${roundNumber}</p>
      <h2>${escapeHtml(question.word.word)}</h2>
      <p>Complete: <strong>${escapeHtml(question.personLabel)} ______</strong></p>
      <p class="practice-tense">${escapeHtml(question.tenseLabel)}</p>
      <form id="practiceForm">
        <label for="practiceAnswer">Your answer</label>
        <input id="practiceAnswer" autocomplete="off" spellcheck="false" required>
        <button class="settings-primary" type="submit">Check answer</button>
      </form>
      <div id="practiceFeedback" class="practice-feedback" role="status" aria-live="polite"></div>`;
    const form = card.querySelector("#practiceForm");
    const input = card.querySelector("#practiceAnswer");
    input.focus();
    form.addEventListener("submit", event => {
      event.preventDefault();
      const supplied = input.value.trim().toLocaleLowerCase("de");
      const expected = question.answer.trim().toLocaleLowerCase("de");
      const correct = supplied === expected;
      answered += 1;
      if (correct) score += 1;
      scoreNode.textContent = `${score} / ${PRACTICE_ROUND_SIZE}`;
      input.disabled = true;
      form.querySelector("button").disabled = true;
      const feedback = card.querySelector("#practiceFeedback");
      feedback.className = `practice-feedback ${correct ? "is-correct" : "is-wrong"}`;
      feedback.innerHTML = correct
        ? `Correct! <strong>${escapeHtml(question.personLabel)} ${escapeHtml(question.answer)}</strong>`
        : `Correct answer: <strong>${escapeHtml(question.personLabel)} ${escapeHtml(question.answer)}</strong>`;
      feedback.insertAdjacentHTML("beforeend", `
        <div class="practice-feedback-actions">
          <button type="button" id="practiceListenBtn">🔊 Listen</button>
          <button type="button" id="nextPracticeBtn" class="settings-primary">${answered === PRACTICE_ROUND_SIZE ? "View Round Results" : "Next question"}</button>
        </div>`);
      feedback.querySelector("#practiceListenBtn").addEventListener("click", () =>
        speakGerman(`${question.personLabel} ${question.answer}`)
      );
      feedback.querySelector("#nextPracticeBtn").addEventListener("click", () => {
        if (answered === PRACTICE_ROUND_SIZE) {
          showRoundComplete();
        } else {
          question = getNextQuestion();
          draw();
        }
      });
    });
  };
  draw();
}

function buildCategoryPracticeQuestion(categoryName, excludedWordIds = new Set()) {
  const words = getAllWords().filter(word =>
    word.category === categoryName &&
    word.word &&
    !excludedWordIds.has(String(word.id)) &&
    (Array.isArray(word.englisch) ? word.englisch.length : word.englisch)
  );
  if (!words.length) return null;
  const word = words[Math.floor(Math.random() * words.length)];
  const translations = Array.isArray(word.englisch) ? word.englisch : [word.englisch];
  return {
    word,
    prompt: translations.filter(Boolean).join(" · ")
  };
}

function renderCategoryPracticePage(categoryName = practiceOrigin.category) {
  if (!currentUser) {
    if (authStateResolved) {
      promptLoginForRestrictedCategory("Login to use Category Practice.");
    }
    return;
  }
  if (!categoryName) return goHomeWithoutRefresh();

  practiceOrigin = { type: "category", category: categoryName };
  const usedWordIds = new Set();
  let roundNumber = 1;
  let score = 0;
  let answered = 0;
  const getNextQuestion = () => {
    let nextQuestion = buildCategoryPracticeQuestion(categoryName, usedWordIds);
    if (!nextQuestion) {
      usedWordIds.clear();
      nextQuestion = buildCategoryPracticeQuestion(categoryName, usedWordIds);
    }
    if (nextQuestion) usedWordIds.add(String(nextQuestion.word.id));
    return nextQuestion;
  };
  let question = getNextQuestion();
  const page = showLearningToolPage("learning-tool-page", `
    <div class="learning-tool-shell">
      <div class="learning-tool-head">
        <button class="back-btn" id="practiceBackBtn">← Back to Category</button>
        <div><p class="quality-eyebrow">Active recall</p><h1>${escapeHtml(categoryName)} Practice</h1>
        <p>Read the English meaning and type the matching German word or expression.</p></div>
        <strong id="practiceScore" class="practice-score">0 / ${PRACTICE_ROUND_SIZE}</strong>
      </div>
      <section class="practice-card" id="practiceCard"></section>
    </div>`);
  if (!page) return;

  page.querySelector("#practiceBackBtn").addEventListener("click", () => {
    setSingleRouteParam("category", categoryName);
    openCategoryPage(categoryName, { requireEntryWarning: false });
  });
  const card = page.querySelector("#practiceCard");
  const scoreNode = page.querySelector("#practiceScore");

  const showRoundComplete = () => {
    scoreNode.textContent = `${score} / ${PRACTICE_ROUND_SIZE}`;
    card.innerHTML = buildPracticeRoundCompleteMarkup(score, roundNumber);
    card.querySelector("#newPracticeRoundBtn").addEventListener("click", () => {
      roundNumber += 1;
      score = 0;
      answered = 0;
      scoreNode.textContent = `0 / ${PRACTICE_ROUND_SIZE}`;
      question = getNextQuestion();
      draw();
    });
  };

  const draw = () => {
    if (!question) {
      card.innerHTML = `<p>No practice questions are available for this category.</p>`;
      return;
    }
    card.innerHTML = `
      <span class="practice-level">${escapeHtml(question.word.level || categoryName)}</span>
      <p class="practice-question-count">Question ${answered + 1} of ${PRACTICE_ROUND_SIZE} · Round ${roundNumber}</p>
      <h2>${escapeHtml(question.prompt)}</h2>
      <p>What is the German word or expression?</p>
      <form id="practiceForm">
        <label for="practiceAnswer">Your answer</label>
        <input id="practiceAnswer" autocomplete="off" spellcheck="false" required>
        <button class="settings-primary" type="submit">Check answer</button>
      </form>
      <div id="practiceFeedback" class="practice-feedback" role="status" aria-live="polite"></div>`;
    const form = card.querySelector("#practiceForm");
    const input = card.querySelector("#practiceAnswer");
    input.focus();
    form.addEventListener("submit", event => {
      event.preventDefault();
      const normalize = value => String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("de");
      const correct = normalize(input.value) === normalize(question.word.word);
      answered += 1;
      if (correct) score += 1;
      scoreNode.textContent = `${score} / ${PRACTICE_ROUND_SIZE}`;
      input.disabled = true;
      form.querySelector("button").disabled = true;
      const feedback = card.querySelector("#practiceFeedback");
      feedback.className = `practice-feedback ${correct ? "is-correct" : "is-wrong"}`;
      feedback.innerHTML = correct
        ? `Correct! <strong>${escapeHtml(question.word.word)}</strong>`
        : `Correct answer: <strong>${escapeHtml(question.word.word)}</strong>`;
      feedback.insertAdjacentHTML("beforeend", `
        <div class="practice-feedback-actions">
          <button type="button" id="practiceListenBtn">🔊 Listen</button>
          <button type="button" id="nextPracticeBtn" class="settings-primary">${answered === PRACTICE_ROUND_SIZE ? "View Round Results" : "Next question"}</button>
        </div>`);
      feedback.querySelector("#practiceListenBtn").addEventListener("click", () =>
        speakGerman(question.word.word)
      );
      feedback.querySelector("#nextPracticeBtn").addEventListener("click", () => {
        if (answered === PRACTICE_ROUND_SIZE) {
          showRoundComplete();
        } else {
          question = getNextQuestion();
          draw();
        }
      });
    });
  };
  draw();
}

function getReviewWords() {
  return Object.entries(reviewSchedule)
    .sort((a, b) => Number(a[1]?.due || 0) - Number(b[1]?.due || 0))
    .map(([id]) => getAllWords().find(word => String(word.id) === id))
    .filter(Boolean);
}

function scheduleReview(wordId, rating) {
  const current = reviewSchedule[wordId] || { repetitions: 0, interval: 0 };
  let repetitions = Number(current.repetitions || 0);
  let interval = Number(current.interval || 0);
  if (rating === "again") {
    repetitions = 0;
    interval = 0;
  } else if (rating === "hard") {
    interval = 1;
  } else if (rating === "good") {
    repetitions += 1;
    interval = [1, 3, 7, 14, 30][Math.min(repetitions - 1, 4)];
  } else {
    repetitions += 1;
    interval = Math.max(4, Math.round((interval || 2) * 2.5));
  }
  const delay = rating === "again" ? 10 * 60 * 1000 : interval * 86400000;
  reviewSchedule[wordId] = { repetitions, interval, due: Date.now() + delay, lastRating: rating };
  persistLearningStateIfLoggedIn();
}

function renderReviewPage() {
  if (!currentUser) {
    if (authStateResolved) {
      promptLoginForRestrictedCategory("Login to review your saved words.");
    }
    return;
  }
  let queue = getReviewWords();
  let index = 0;
  let revealed = false;
  const page = showLearningToolPage("learning-tool-page", `
    <div class="learning-tool-shell">
      <div class="learning-tool-head">
        <button class="back-btn" id="reviewHomeBtn">🏠 Home</button>
        <div><p class="quality-eyebrow">Memory schedule</p><h1>Spaced Repetition</h1>
        <p>Review difficult words more often and familiar words less often.</p></div>
        <strong id="reviewCount" class="practice-score"></strong>
      </div>
      <section class="practice-card review-card" id="reviewCard"></section>
    </div>`);
  if (!page) return;
  page.querySelector("#reviewHomeBtn").addEventListener("click", goHomeWithoutRefresh);
  const card = page.querySelector("#reviewCard");
  const count = page.querySelector("#reviewCount");
  const draw = () => {
    const word = queue[index];
    count.textContent = `${Math.min(index + 1, queue.length)} / ${queue.length}`;
    if (!word) {
      count.textContent = "0 words";
      card.innerHTML = `
        <div class="review-empty"><h2>You are caught up!</h2>
        <p>Add words from their detail pages to build your personal review queue.</p></div>`;
      return;
    }
    const toList = value => Array.isArray(value) ? value : value ? [value] : [];
    const translations = [...toList(word.englisch), ...toList(word.bangla)].join(" · ");
    const dueAt = Number(reviewSchedule[word.id]?.due || 0);
    const dueText = dueAt <= Date.now()
      ? "Due now"
      : `Next review: ${new Date(dueAt).toLocaleDateString()}`;
    card.innerHTML = `
      ${queue.length > 1 ? `<button type="button" class="review-nav-btn review-prev" aria-label="Previous review word">‹</button>
      <button type="button" class="review-nav-btn review-next" aria-label="Next review word">›</button>` : ""}
      <span class="practice-level">${escapeHtml(word.category || "")}${word.level ? ` · ${escapeHtml(word.level)}` : ""}</span>
      <button type="button" class="audio-pronounce-btn" id="reviewListenBtn">🔊 Listen</button>
      <h2>${escapeHtml(word.article ? `${word.article} ${word.word}` : word.word)}</h2>
      <p class="review-due-label">${escapeHtml(dueText)}</p>
      <div id="reviewAnswer" class="review-answer ${revealed ? "is-visible" : ""}">
        <p>${escapeHtml(translations || word.meaning || "-")}</p>
      </div>
      ${revealed ? `<div class="review-ratings" aria-label="How well did you remember?">
        <button data-rating="again">Again<small>10 min</small></button>
        <button data-rating="hard">Hard<small>1 day</small></button>
        <button data-rating="good">Good<small>scheduled</small></button>
        <button data-rating="easy">Easy<small>longer</small></button>
      </div>` : `<button id="revealReviewBtn" class="settings-primary">Show meaning</button>`}`;
    card.querySelector("#reviewListenBtn").addEventListener("click", () => speakGerman(word.word));
    const move = direction => {
      index = (index + direction + queue.length) % queue.length;
      revealed = false;
      draw();
    };
    card.querySelector(".review-prev")?.addEventListener("click", () => move(-1));
    card.querySelector(".review-next")?.addEventListener("click", () => move(1));
    card.querySelector("#revealReviewBtn")?.addEventListener("click", () => {
      revealed = true;
      draw();
    });
    card.querySelectorAll("[data-rating]").forEach(button => button.addEventListener("click", () => {
      scheduleReview(word.id, button.dataset.rating);
      index = queue.length > 1 ? (index + 1) % queue.length : 0;
      revealed = false;
      draw();
    }));
  };
  draw();
}


function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `app-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 250);
  }, 2200);
}

function promptLoginForRestrictedCategory(message) {
  showToast(message, "error");
  const loginBtn = document.getElementById("loginBtn");
  if (!currentUser && loginBtn) {
    loginBtn.click();
  }
}

function showSchimpfWarningModal({ onConfirm, onCancel } = {}) {
  const modal = document.getElementById("schimpfWarningModal");
  const confirmBtn = document.getElementById("confirmSchimpfWarning");
  const cancelBtn = document.getElementById("cancelSchimpfWarning");
  const closeBtn = document.getElementById("closeSchimpfWarning");
  if (!modal || !confirmBtn || !cancelBtn || !closeBtn) {
    onConfirm?.();
    return;
  }
  if (schimpfWarningOpen) return;
  schimpfWarningOpen = true;

  const cleanup = () => {
    document.removeEventListener("keydown", handleEsc);
    modal.classList.add("hidden");
    schimpfWarningOpen = false;
  };

  const confirm = () => {
    cleanup();
    onConfirm?.();
  };

  const cancel = () => {
    cleanup();
    onCancel?.();
  };

  const handleEsc = e => {
    if (e.key === "Escape") cancel();
  };

  modal.classList.remove("hidden");
  confirmBtn.addEventListener("click", confirm, { once: true });
  cancelBtn.addEventListener("click", cancel, { once: true });
  closeBtn.addEventListener("click", cancel, { once: true });
  modal.addEventListener(
    "click",
    e => {
      if (e.target === modal) cancel();
    },
    { once: true }
  );
  document.addEventListener("keydown", handleEsc);
}

/* =========================================================
   STATIC PAGE CONTENT AND MEDIA

   Text and image paths live here so renderers focus on markup.
========================================================= */


/* =========================================================
   HOME WORD COUNTER AND DATA QUALITY CHECK

   Updates the hero total and reports duplicate database entries.
========================================================= */

function updateWordCounter() {

  const counter = document.getElementById("wordCount");

  if (!counter) return;

  const words = getAllWords();

  counter.textContent = `Total Words: ${words.length}`;

}


function reportDuplicateWords() {
  const words = getAllWords();
  const byKey = new Map();
  const duplicates = [];

  words.forEach(entry => {
    const word = normalizeText(entry?.word);
    const category = normalizeText(entry?.category);
    if (!word) return;
    const key = `${word}__${category}`;
    const existing = byKey.get(key);
    if (existing) {
      duplicates.push({ word: entry.word, category: entry.category, id: entry.id });
      return;
    }
    byKey.set(key, entry);
  });

  if (duplicates.length === 0) return;

  console.warn("[duplicates] Found duplicate words:", duplicates);

  const importMessage = document.getElementById("importMessage");
  if (!importMessage) return;

  const total = duplicates.length;
  const sample = duplicates.slice(0, 6);
  const list = sample
    .map(d => `${escapeHtml(d.word || "-")} (${escapeHtml(d.category || "-")})`)
    .join(", ");
  const suffix = total > sample.length ? `, +${total - sample.length} more` : "";

  importMessage.innerHTML = `
    <div class="search-message" style="margin-top:10px;">
      Duplicate entries detected (${total}). Check and remove duplicates in words.json.
      <div style="margin-top:6px; font-size:13px; opacity:0.9;">${list}${suffix}</div>
    </div>
  `;
}

/* =========================================================
   CATEGORY DEFINITIONS AND INFORMATION-PAGE CONTENT

   Defines category labels, explanations, and translated page copy.
========================================================= */

const categories = [
  "Verben",
  "Adjektiven",
  "Adverbien",
  "Nomen",
  "Nomen-Verb Verbindung",
  "Redewendungen",
  "Sprichwörter",
  "Feste Wendungen",
  "Slang",
  "Schimpfwörter",
  "Best YT Kanäle",
  "Filme & Serien"
];

const CATEGORY_SEARCH_LABELS = {
  Verben: "verbs",
  Adjektiven: "adjectives",
  Adverbien: "adverbs",
  Nomen: "nouns",
  "Nomen-Verb Verbindung": "noun-verb combinations",
  Redewendungen: "idioms",
  "Sprichwörter": "proverbs",
  "Feste Wendungen": "fixed expressions",
  Slang: "slang",
  "Schimpfwörter": "swear words",
  "Best YT Kanäle": "YouTube channels",
  "Filme & Serien": "movies and series"
};

const CATEGORY_SECTION_LABELS = {
  Verben: "Verb",
  Adjektiven: "Adjektiv",
  Adverbien: "Adverb",
  Nomen: "Nomen",
  "Nomen-Verb Verbindung": "Nomen-Verb Verbindung",
  Redewendungen: "Redewendung",
  "Sprichwörter": "Sprichwort",
  "Feste Wendungen": "Feste Wendung",
  Slang: "Slang",
  "Schimpfwörter": "Schimpfwort",
  "Best YT Kanäle": "YouTube Kanal",
  "Filme & Serien": "Film & Serie"
};

function getCategorySearchPlaceholder(categoryName) {
  const label = CATEGORY_SEARCH_LABELS[categoryName] || categoryName;
  return `Search ${label}`;
}

function getCategorySectionLabel(categoryName) {
  return CATEGORY_SECTION_LABELS[categoryName] || categoryName;
}

function getDetailCategoryLabel(categoryName) {
  const compactLabels = {
    "Nomen-Verb Verbindung": "N-V Verbindung",
    "Best YT Kanäle": "YT Kanal"
  };

  return compactLabels[categoryName] || getCategorySectionLabel(categoryName);
}


function buildGermanyPageHTML(page) {
  return `
    <section class="germany-hero" style="background-image: linear-gradient(90deg, rgba(10, 14, 25, 0.18), rgba(10, 14, 25, 0)), url('${escapeHtml(page.heroImage)}')">
      <div class="germany-hero-copy">
        <span>${escapeHtml(page.eyebrow)}</span>
        <h1>${escapeHtml(page.title)}</h1>
        <p>${escapeHtml(page.subtitle)}</p>
      </div>
      <button id="germanyLanguageToggle" class="germany-lang-toggle" type="button">${escapeHtml(page.toggleLabel)}</button>
    </section>

    <section class="germany-stats">
      ${page.stats
        .map(
          stat => `
            <article class="germany-stat">
              <strong>${escapeHtml(stat.value)}</strong>
              <span>${escapeHtml(stat.label)}</span>
            </article>
          `
        )
        .join("")}
    </section>

    <section class="germany-block germany-states-block">
      <div class="germany-section-head">
        <h2>${escapeHtml(page.statesTitle)}</h2>
        <p>${escapeHtml(page.statesIntro)}</p>
      </div>
      <div class="germany-state-grid">
        ${page.states.map((state, idx) => `<span><b>${String(idx + 1).padStart(2, "0")}</b><em>${escapeHtml(state)}</em></span>`).join("")}
      </div>
    </section>

    <section class="germany-feature-grid">
      ${page.sections
        .map(
          section => `
            <article class="germany-feature">
              <img class="${escapeHtml(section.imageClass || "")}" src="${escapeHtml(section.image)}" alt="${escapeHtml(section.title)}" loading="lazy"${buildPhotoStyle(section)}>
              <div>
                <h2>${escapeHtml(section.title)}</h2>
                <p>${escapeHtml(section.body)}</p>
              </div>
            </article>
          `
        )
        .join("")}
    </section>

    <section class="germany-block germany-company-block">
      <div class="germany-section-head">
        <h2>${escapeHtml(page.companiesTitle)}</h2>
      </div>
      <div class="germany-company-list">
        ${page.companies.map(item => `<p>${escapeHtml(item)}</p>`).join("")}
      </div>
    </section>

    <p class="germany-note">${escapeHtml(page.note)}</p>
  `;
}

function wireGermanyLanguageToggle() {
  document.getElementById("germanyLanguageToggle")?.addEventListener("click", () => {
    const germanyPage = document.querySelector(".germany-page");
    if (!germanyPage || germanyPage.classList.contains("is-switching")) return;

    germanyPage.classList.add("is-switching");
    window.setTimeout(() => {
      germanyPageLanguage = germanyPageLanguage === "en" ? "de" : "en";
      const nextPage = GERMANY_PAGE_COPY[germanyPageLanguage] || GERMANY_PAGE_COPY.en;
      germanyPage.innerHTML = buildGermanyPageHTML(nextPage);
      germanyPage.classList.remove("is-switching");
      germanyPage.classList.add("has-switched");
      window.setTimeout(() => germanyPage.classList.remove("has-switched"), 260);
      wireGermanyLanguageToggle();
    }, 180);
  });
}

function renderGermanyPage() {
  const desktopPage = document.getElementById("desktopPage");
  if (!desktopPage) return;

  const page = GERMANY_PAGE_COPY[germanyPageLanguage] || GERMANY_PAGE_COPY.en;

  currentView = "custom";
  setRafiTutorContext({ view: "home" });
  ["homePage", "categoryPage", "wordDetailPage", "conjugationPage"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const hero = document.getElementById("heroSection");
  if (hero) hero.style.display = "none";

  desktopPage.style.display = "block";
  desktopPage.innerHTML = `
    <div class="germany-page">${buildGermanyPageHTML(page)}</div>
  `;

  wireGermanyLanguageToggle();
}

function buildBangladeshPageHTML(page) {
  return `
    <section class="bangladesh-hero" style="background-image: radial-gradient(circle at 18% 22%, rgba(255, 206, 46, 0.18), transparent 25%), radial-gradient(circle at 82% 26%, rgba(255, 255, 255, 0.12), transparent 20%), linear-gradient(145deg, rgba(10, 95, 69, 0.84) 0%, rgba(6, 74, 56, 0.88) 48%, rgba(4, 47, 36, 0.92) 100%), url('${escapeHtml(page.heroImage)}')">
      <div class="bangladesh-hero-copy">
        <button id="bangladeshLanguageToggle" class="bangladesh-lang-toggle germany-lang-toggle" type="button">${escapeHtml(page.toggleLabel)}</button>
        <h1>${escapeHtml(page.title)}</h1>
        <p>${escapeHtml(page.subtitle)}</p>
      </div>
      <div class="bangladesh-hero-side">
        <div class="bangladesh-flag-panel" aria-hidden="true">
          <div class="bangladesh-flag-art">
            <div class="bangladesh-flag-circle"></div>
          </div>
        </div>
      </div>
    </section>

    <section class="bangladesh-stats">
      ${page.stats
        .map(
          stat => `
            <article class="bangladesh-stat">
              <strong>${escapeHtml(stat.value)}</strong>
              <span>${escapeHtml(stat.label)}</span>
            </article>
          `
        )
        .join("")}
    </section>

    <section class="bangladesh-block bangladesh-divisions-block">
      <div class="bangladesh-section-head">
        <h2>${escapeHtml(page.divisionsTitle)}</h2>
        <p>${escapeHtml(page.divisionsIntro)}</p>
      </div>
      <div class="bangladesh-division-grid">
        ${page.divisions
          .map(
            (division, idx) =>
              `<span><b>${String(idx + 1).padStart(2, "0")}</b><em>${escapeHtml(division)}</em></span>`
          )
          .join("")}
      </div>
    </section>

    <section class="bangladesh-feature-grid">
      ${page.sections
        .map(
          section => `
            <article class="bangladesh-feature">
              <img class="${escapeHtml(section.imageClass || "")}" src="${escapeHtml(section.image)}" alt="${escapeHtml(section.title)}" loading="lazy"${buildPhotoStyle(section)}>
              <div>
                <h2>${escapeHtml(section.title)}</h2>
                <p>${escapeHtml(section.body)}</p>
              </div>
            </article>
          `
        )
        .join("")}
    </section>

    <section class="bangladesh-block bangladesh-snapshot-block">
      <div class="bangladesh-section-head">
        <h2>${escapeHtml(page.snapshotTitle)}</h2>
      </div>
      <div class="bangladesh-snapshot-list">
        ${page.snapshot.map(item => `<p>${escapeHtml(item)}</p>`).join("")}
      </div>
    </section>

    <p class="bangladesh-note">${escapeHtml(page.note)}</p>
  `;
}

function renderBangladeshPage() {
  const desktopPage = document.getElementById("desktopPage");
  if (!desktopPage) return;

  const page = BANGLADESH_PAGE_COPY[bangladeshPageLanguage] || BANGLADESH_PAGE_COPY.en;

  currentView = "custom";
  setRafiTutorContext({ view: "home" });
  ["homePage", "categoryPage", "wordDetailPage", "conjugationPage"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const hero = document.getElementById("heroSection");
  if (hero) hero.style.display = "none";

  desktopPage.style.display = "block";
  desktopPage.innerHTML = `
    <div class="bangladesh-page">${buildBangladeshPageHTML(page)}</div>
  `;

  wireBangladeshLanguageToggle();
}

function wireBangladeshLanguageToggle() {
  document.getElementById("bangladeshLanguageToggle")?.addEventListener("click", () => {
    const bangladeshPage = document.querySelector(".bangladesh-page");
    if (!bangladeshPage || bangladeshPage.classList.contains("is-switching")) return;

    bangladeshPage.classList.add("is-switching");
    window.setTimeout(() => {
      bangladeshPageLanguage = bangladeshPageLanguage === "en" ? "de" : "en";
      const nextPage = BANGLADESH_PAGE_COPY[bangladeshPageLanguage] || BANGLADESH_PAGE_COPY.en;
      bangladeshPage.innerHTML = buildBangladeshPageHTML(nextPage);
      bangladeshPage.classList.remove("is-switching");
      bangladeshPage.classList.add("has-switched");
      window.setTimeout(() => bangladeshPage.classList.remove("has-switched"), 260);
      wireBangladeshLanguageToggle();
    }, 180);
  });
}

const CATEGORY_EXPLAIN_TITLES = {
  Verben: "Was sind Verben?",
  Adjektiven: "Was sind Adjektive?",
  Adverbien: "Was sind Adverbien?",
  Nomen: "Was sind Nomen?",
  "Nomen-Verb Verbindung": "Was sind Nomen-Verb-Verbindungen?",
  Redewendungen: "Was sind Redewendungen?",
  "Sprichwörter": "Was sind Sprichwörter?",
  "Feste Wendungen": "Was sind feste Wendungen?",
  Slang: "Was ist Slang?",
  "Schimpfwörter": "Was sind Schimpfwörter?",
  "Best YT Kanäle": "Was sind die besten YouTube-Kanäle?",
  "Filme & Serien": "Was sind Filme & Serien zum Deutschlernen?"
};

const CONJUGATION_EXPLANATION = {
  de: "Die Konjugation zeigt, wie ein Verb je nach Person, Zeit und Modus verändert wird. So lernst du die korrekte Form im echten Satzgebrauch.",
  en: "Conjugation shows how a verb changes by person, tense, and mood. It helps you use the correct form in real sentences.",
  bn: "Konjugation দেখায় একটি verb ব্যক্তি, কাল এবং ধরন অনুযায়ী কীভাবে বদলায়। এতে বাস্তব বাক্যে সঠিক verb form ব্যবহার করা সহজ হয়।"
};

function generateCategories() {
  const nav = document.getElementById("categoryNav");
  if (!nav) return;

  nav.innerHTML = "";

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.className = "category-btn";

    btn.addEventListener("click", () => {
      setSingleRouteParam("category", cat);
      openCategoryPage(cat, { requireEntryWarning: true });
    });

    nav.appendChild(btn);
  });
}

function setupHomeSprachweltCta() {
  document.getElementById("sprachweltHomeCta")?.addEventListener("click", () => {
    setSingleRouteParam("page", "sprachwelt");
    renderPanelPage("sprachwelt");
  });
}

function setupFooterNavigation() {
  document.querySelectorAll("[data-footer-page]").forEach(btn => {
    btn.addEventListener("click", () => {
      const page = normalizePanelPageKey(btn.dataset.footerPage);
      if (!page) return;
      if (standalonePage || page === "owner" || page === "option5") { openMainSite(page); return; }

      setSingleRouteParam("page", page);
      renderPanelPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

/* =========================================================
   ROUTE RESOLUTION

   Opens the word, category, information page, settings, or home
   view requested by the browser's current query string.
========================================================= */

function handleRouting() {

  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const wordName = params.get("word");
  const conjugationWord = params.get("conjugation");
  const page = params.get("page");

  if (conjugationWord) {
    const word = getAllWords().find(w => w.word === conjugationWord);
    if (word) {
      openConjugationPage(word.id);
      return;
    }
  }

  if (wordName) {

    const word = getAllWords().find(w => w.word === wordName);

    if (word) {

      openWordDetail(word.id);
      return;
    }
  }

  if (category) {

    openCategoryPage(category);
    return;
  }

  const normalizedPage = normalizePanelPageKey(page);

  if (normalizedPage && (panelPageContent[normalizedPage] || ["owner", "option5"].includes(normalizedPage)) && normalizedPage !== "settings") {
    if (normalizedPage !== page) {
      setSingleRouteParam("page", normalizedPage);
    }
    renderPanelPage(normalizedPage);
    return;
  }

  if (page === "settings") {
    renderSettingsPage();
    return;
  }

  if (page === "conjugation-practice") {
    renderConjugationPracticePage();
    return;
  }

  if (page === "category-practice") {
    const practiceCategory = params.get("practice-category");
    practiceOrigin = { type: "category", category: practiceCategory };
    renderCategoryPracticePage(practiceCategory);
    return;
  }

  if (page === "review") {
    renderReviewPage();
    return;
  }

  if (page === "quality") {
    renderDataQualityPage();
    return;
  }

  if (page === "favorites") {
    renderFavoritesPage();
    return;
  }

  // ✅ Default = Home
  showSection("homePage");

}

/* =========================================================
   MAIN VIEW SWITCHING

   Shows one primary page section and coordinates hero visibility.
========================================================= */

function showSection(id) {

  updateFooterBrand(false);

  const sections = ["homePage", "categoryPage", "wordDetailPage", "conjugationPage"];

  sections.forEach(sec => {
    const el = document.getElementById(sec);
    if (!el) return;
    el.style.display = "none";
    el.classList.remove("active");
  });
  // 🔥 Always hide custom page
  const desktopPage = document.getElementById("desktopPage");
  if (desktopPage) desktopPage.style.display = "none";

  // Hide hero by default
  const hero = document.getElementById("heroSection");
  if (hero) hero.style.display = "none";

  const active = document.getElementById(id);
  if (!active) return;

  if (id === "homePage") {
    setRafiTutorContext({ view: "home" });
  } else if (id === "categoryPage" && currentCategory) {
    setRafiTutorContext({ view: "category", category: currentCategory });
  } else if (id !== "wordDetailPage") {
    setRafiTutorContext({ view: "home" });
  }

  active.style.display = "block";
  setTimeout(() => active.classList.add("active"), 10);

  // ✅ If Home Page → Show Hero
  if (id === "homePage") {
    if (hero) hero.style.display = "block";
  }
}

/* =========================================================
   CATEGORY PAGE RENDERING

   Builds the selected category and restores its previous section.
========================================================= */

function openCategoryPage(categoryName, options = {}) {
  const needsEntryWarning =
    categoryName === "Schimpfwörter" && Boolean(options.requireEntryWarning);
  if (needsEntryWarning) {
    showSchimpfWarningModal({
      onConfirm: () =>
        openCategoryPage(categoryName, { ...options, requireEntryWarning: false }),
      onCancel: () => {
        setHomeRoute();
        showSection("homePage");
      }
    });
    return;
  }

  const requiresLogin =
    categoryName === "Schimpfwörter" && !currentUser;
  if (requiresLogin) {
    promptLoginForRestrictedCategory(
      "Login required to view Schimpfwörter."
    );
    return;
  }

  currentCategory = categoryName;
  openedFromFavorites = false;
  if (currentUser) {
    lastContext.category = categoryName;
    if (activeSectionMemory[categoryName] !== undefined) {
      lastContext.section = activeSectionMemory[categoryName];
    }
    persistLearningStateIfLoggedIn();
  }

  const categoryPage = document.getElementById("categoryPage");
  categoryPage.innerHTML = "";
  categoryPage.dataset.category = categoryName;

  showSection("categoryPage");

  /* ================= TOP BAR ================= */

  const topBar = document.createElement("div");
  topBar.className = "category-topbar";

  const backBtn = document.createElement("button");
  backBtn.textContent = "🏠 Home";
  backBtn.className = "back-btn";
  backBtn.onclick = () => {
    setHomeRoute();
    showSection("homePage");
  };

  const title = document.createElement("h1");
  title.textContent = categoryName;

  topBar.appendChild(backBtn);
  topBar.appendChild(title);
  const practiceCategoryLabels = {
    Verben: "✍️ Practice Verbs",
    Adjektiven: "✍️ Practice Adjectives",
    Adverbien: "✍️ Practice Adverbs",
    "Nomen-Verb Verbindung": "✍️ Practice Nomen-Verb-Verbindungen",
    Redewendungen: "✍️ Practice Redewendungen"
  };
  if (practiceCategoryLabels[categoryName]) {
    const categoryPracticeBtn = document.createElement("button");
    categoryPracticeBtn.type = "button";
    categoryPracticeBtn.className = "conjugation-open-btn category-practice-btn";
    categoryPracticeBtn.textContent = practiceCategoryLabels[categoryName];
    categoryPracticeBtn.addEventListener("click", () => {
      if (!currentUser) {
        promptLoginForRestrictedCategory(`Login to practice ${categoryName}.`);
        return;
      }
      practiceOrigin = { type: "category", category: categoryName };
      if (categoryName === "Verben") {
        setSingleRouteParam("page", "conjugation-practice");
        renderConjugationPracticePage();
      } else {
        const params = new URLSearchParams();
        params.set("page", "category-practice");
        params.set("practice-category", categoryName);
        history.pushState(null, "", buildRouteUrl(params));
        renderCategoryPracticePage(categoryName);
      }
    });
    topBar.appendChild(categoryPracticeBtn);
  }
  categoryPage.appendChild(topBar);

/* =========================================================
   CATEGORY SEARCH INTERFACE

   Creates a search field whose suggestions stay within the open
   category.
========================================================= */
/* Search controls inserted into the category page. */

const searchWrapper = document.createElement("div");
searchWrapper.style.position = "relative";
searchWrapper.style.maxWidth = "750px";
searchWrapper.style.margin = "30px auto";

const searchInput = document.createElement("input");
searchInput.placeholder = getCategorySearchPlaceholder(categoryName);
searchInput.className = "category-search";
searchInput.setAttribute("aria-label", `Search within ${categoryName}`);
searchInput.setAttribute("aria-autocomplete", "list");
searchInput.setAttribute("aria-expanded", "false");

const suggestionBox = document.createElement("div");
suggestionBox.className = "suggestions-box";
suggestionBox.id = `category-suggestions-${categoryName.replace(/\W+/g, "-")}`;
suggestionBox.setAttribute("role", "listbox");
searchInput.setAttribute("aria-controls", suggestionBox.id);
const categorySearchMessage = document.createElement("div");
categorySearchMessage.className = "search-message";
categorySearchMessage.setAttribute("role", "status");
categorySearchMessage.setAttribute("aria-live", "polite");
categorySearchMessage.style.marginTop = "10px";
categorySearchMessage.style.textAlign = "left";
categorySearchMessage.style.fontSize = "14px";

searchWrapper.appendChild(searchInput);
searchWrapper.appendChild(suggestionBox);
searchWrapper.appendChild(categorySearchMessage);

categoryPage.appendChild(searchWrapper);

  const categoryExplain = CATEGORY_EXPLANATIONS[categoryName];
  if (categoryExplain) {
    const explainTitle = CATEGORY_EXPLAIN_TITLES[categoryName] || `Was ist ${categoryName}?`;
    const explainer = document.createElement("section");
    explainer.className = "category-explainer";
    explainer.innerHTML = `
    <button id="toggleExplainBtn" type="button" class="category-explain-btn category-explain-question">
      ${escapeHtml(explainTitle)}
    </button>
    <div id="explainPanel" class="category-explain-panel collapsed" aria-hidden="true">
      <h4>Deutsch</h4>
      <p class="category-explainer-de">${escapeHtml(categoryExplain.de)}</p>
      <h4>English</h4>
      <p>${escapeHtml(categoryExplain.en)}</p>
      <h4>Bangla</h4>
      <p>${escapeHtml(categoryExplain.bn)}</p>
    </div>
    `;
    categoryPage.appendChild(explainer);

  const wireExplainToggle = (btnId, panelId) => {
    const btn = explainer.querySelector(`#${btnId}`);
    const panel = explainer.querySelector(`#${panelId}`);
    if (!btn || !panel) return;
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", () => {
      const willOpen = panel.classList.contains("collapsed");
      panel.classList.toggle("collapsed", !willOpen);
      panel.classList.toggle("open", willOpen);
      panel.setAttribute("aria-hidden", willOpen ? "false" : "true");
      btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
      btn.classList.toggle("active", willOpen);
    });
  };

  wireExplainToggle("toggleExplainBtn", "explainPanel");
}

categorySearchMessage.addEventListener("click", (e) => {
  const submitBtn = e.target.closest(".submit-word-hint-btn");
  if (!submitBtn) return;
  const missingWord = submitBtn.getAttribute("data-missing-word") || "";
  setSingleRouteParam("page", "settings");
  renderSettingsPage();
  setTimeout(() => {
    const suggestionInput = document.getElementById("suggestionInput");
    if (!suggestionInput) return;
    if (!suggestionInput.value.trim() && missingWord) {
      suggestionInput.value = `${missingWord} - `;
    }
    suggestionInput.focus();
    const end = suggestionInput.value.length;
    suggestionInput.setSelectionRange(end, end);
  }, 0);
});

// Ensure old outside-click listener from previous category page is removed.
if (detachCategorySearchOutsideClose) {
  detachCategorySearchOutsideClose();
  detachCategorySearchOutsideClose = null;
}

const handleCategorySearchOutside = (e) => {
  if (!searchWrapper.contains(e.target)) {
    suggestionBox.classList.remove("active");
  }
};

document.addEventListener("click", handleCategorySearchOutside);
document.addEventListener("touchstart", handleCategorySearchOutside, { passive: true });

detachCategorySearchOutsideClose = () => {
  document.removeEventListener("click", handleCategorySearchOutside);
  document.removeEventListener("touchstart", handleCategorySearchOutside);
};

/* =========================================================
   CATEGORY SEARCH RESULTS AND KEYBOARD CONTROL

   Filters words, renders suggestions, and supports keyboard input.
========================================================= */

  /* ================= GET CATEGORY WORDS ================= */

  const words = getAllWords().filter(
    w => (w.category || "").trim() === categoryName.trim()
  );
  /* =========================================================
   CATEGORY SUGGESTION RENDERING
========================================================= */

let selectedIndex = -1;

searchInput.addEventListener("input", debounce(function () {

  const query = searchInput.value.trim();
  categorySearchMessage.textContent = "";

  suggestionBox.innerHTML = "";
  selectedIndex = -1;

  if (!query) {
    suggestionBox.classList.remove("active");
    return;
  }

  const exactMatches = findExactWordMatches(words, query);

  if (exactMatches.length > 1) {
    categorySearchMessage.innerHTML = buildDuplicateResultHTML(exactMatches, words);
  }

  const normalizedQuery = query.toLocaleLowerCase("de");
  const matches = words
    .filter(word => String(word.word || "").toLocaleLowerCase("de").startsWith(normalizedQuery))
    .slice(0, 8);

  if (matches.length === 0) {
    if (exactMatches.length === 0) {
      if (isLikelyGermanWordQuery(query)) {
        addSearchHistoryItem(query);
        persistLearningStateIfLoggedIn();
        categorySearchMessage.innerHTML = buildMissingWordPromptHTML(
          query,
          "No word found in this category."
        );
      } else {
        categorySearchMessage.textContent =
          "No word found in this category. Please type a valid German word.";
      }
    }
    suggestionBox.classList.remove("active");
    return;
  }

  matches.forEach((word, resultIndex) => {

    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.id = `category-suggestion-${resultIndex}`;
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", "false");

    item.innerHTML = `<strong>${escapeHtml(word.word)}</strong>${word.level ? `<small>${escapeHtml(word.level)}</small>` : ""}`;

item.addEventListener("click", function (e) {

  e.stopPropagation();
  e.preventDefault();

  const duplicateMatches = findExactWordMatches(words, word.word);
  if (duplicateMatches.length > 1) {
    categorySearchMessage.innerHTML = buildDuplicateResultHTML(duplicateMatches, words);
    suggestionBox.classList.remove("active");
    return;
  }

  setSingleRouteParam("word", word.word);
  addSearchHistoryItem(word.word);
  persistLearningStateIfLoggedIn();

  openedFromCategory = true;
  openedFromHomeSearch = false;
  openedFromFavorites = false;

  openWordDetail(word.id);

  suggestionBox.classList.remove("active");
});

    suggestionBox.appendChild(item);
  });

  suggestionBox.classList.add("active");
  searchInput.setAttribute("aria-expanded", "true");

}, 250));

searchInput.addEventListener("focus", () => {
  if (suggestionBox.children.length > 0) {
    suggestionBox.classList.add("active");
  }
});

searchInput.addEventListener("click", () => {
  if (suggestionBox.children.length > 0) {
    suggestionBox.classList.add("active");
  }
});

/* ================= KEYBOARD NAVIGATION ================= */

searchInput.addEventListener("keydown", function (e) {

  const items = suggestionBox.querySelectorAll(".suggestion-item");

  if (!items.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex++;
    if (selectedIndex >= items.length) selectedIndex = 0;
    updateActive(items);
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex--;
    if (selectedIndex < 0) selectedIndex = items.length - 1;
    updateActive(items);
  }

  if (e.key === "Enter" && selectedIndex >= 0) {
    e.preventDefault();
    items[selectedIndex].click();
  }

  if (e.key === "Escape") {
    suggestionBox.classList.remove("active");
  }

});

function updateActive(items) {
  items.forEach(i => {
    i.classList.remove("active");
    i.setAttribute("aria-selected", "false");
  });
  items[selectedIndex].classList.add("active");
  items[selectedIndex].setAttribute("aria-selected", "true");
  searchInput.setAttribute("aria-activedescendant", items[selectedIndex].id);
}

  /* =========================================================
   EMPTY CATEGORY CHECK
========================================================= */

if (words.length === 0) {

  const emptyMessage = document.createElement("div");

  emptyMessage.className = "empty-category";

  emptyMessage.innerHTML = `
    📦 <h2>No words added yet in this category</h2>
    <p>Add words using JSON import to see them here.</p>
  `;

  categoryPage.appendChild(emptyMessage);

  return;

}

  // Sort alphabetically
  words.sort((a, b) => a.word.localeCompare(b.word));
  const savedSection = activeSectionMemory[categoryName];

  /* ================= SECTION SYSTEM ================= */

  const sectionSize = 100;
  const sectionCount = Math.ceil(words.length / sectionSize);
  const initialSectionIndex =
    Number.isInteger(savedSection) && savedSection >= 0 && savedSection < sectionCount
      ? savedSection
      : 0;
  let activeSectionIndex = null;

  const sectionContainer = document.createElement("div");
  sectionContainer.className = "section-buttons";
  categoryPage.appendChild(sectionContainer);

  const wordDisplay = document.createElement("div");
  wordDisplay.className = "section-word-display";
  categoryPage.appendChild(wordDisplay);

  // 🔥 Render Section Function (INSIDE scope)
  function renderSection(sectionIndex) {

    wordDisplay.innerHTML = "";

    const startIndex = sectionIndex * sectionSize;
    const endIndex = startIndex + sectionSize;

    const sectionWords = words.slice(startIndex, endIndex);

const columnWrapper = document.createElement("div");
// Categories that should use 4 columns
const fourColumnCategories = [
  "Verben",
  "Adjektiven",
  "Adverbien",
  "Nomen",
  "Slang",
  "Schimpfwörter"
];

const isFourColumn = fourColumnCategories.includes(currentCategory);

columnWrapper.className = isFourColumn
  ? "four-column-wrapper"
  : "two-column-wrapper";

const totalColumns = isFourColumn ? 4 : 2;
const itemsPerColumn = Math.ceil(sectionWords.length / totalColumns);

// Create columns
for (let col = 0; col < totalColumns; col++) {

  const column = document.createElement("div");

  for (let row = 0; row < itemsPerColumn; row++) {

    const index = col * itemsPerColumn + row;

    if (index >= sectionWords.length) break;

    const word = sectionWords[index];

    const item = document.createElement("div");
    item.className = "vertical-word-item";

    item.innerHTML = `
      <span class="word-number">${startIndex + index + 1}.</span>
      <span class="word-text">${word.word}</span>
    `;

    item.onclick = () => {

      openedFromCategory = true;
      openedFromHomeSearch = false;

      setSingleRouteParam("word", word.word);
      openWordDetail(word.id);
    };

    column.appendChild(item);
  }

  columnWrapper.appendChild(column);
}

wordDisplay.appendChild(columnWrapper);
}

  // 🔥 Create Section Buttons
  for (let i = 0; i < words.length; i += sectionSize) {

    const sectionIndex = i / sectionSize;

    const start = i + 1;
    const end = Math.min(i + sectionSize, words.length);

    const button = document.createElement("button");
    button.className = "section-btn";
    button.textContent = `${getCategorySectionLabel(categoryName)} (${start}-${end})`;

    button.onclick = () => {

      if (activeSectionIndex === sectionIndex) {
        wordDisplay.innerHTML = "";
        activeSectionIndex = null;
        if (currentUser) {
          lastContext = { category: currentCategory || "", section: null };
          persistLearningStateIfLoggedIn();
        }
        return;
      }

      activeSectionIndex = sectionIndex;
      activeSectionMemory[currentCategory] = sectionIndex;
      if (currentUser) {
        lastContext = { category: currentCategory || "", section: sectionIndex };
        persistLearningStateIfLoggedIn();
      }
      renderSection(sectionIndex);
    };

    sectionContainer.appendChild(button);
  }

  activeSectionIndex = initialSectionIndex;
  renderSection(initialSectionIndex);

}

const CONJUGATION_PERSON_KEYS = ["ich", "du", "er_sie_es", "wir", "ihr", "sie_formal"];
const CONJUGATION_PERSON_LABELS = {
  ich: "ich",
  du: "du",
  er_sie_es: "er/sie/es",
  wir: "wir",
  ihr: "ihr",
  sie_formal: "Sie"
};

const CONJUGATION_SCHEMA = [
  {
    key: "indikativ",
    label: "Indikativ",
    type: "persons",
    tenses: [
      { key: "praesens", label: "Präsens" },
      { key: "praeteritum", label: "Präteritum" },
      { key: "perfekt", label: "Perfekt" },
      { key: "plusquamperfekt", label: "Plusquamperfekt" },
      { key: "futur_i", label: "Futur I" },
      { key: "futur_ii", label: "Futur II" }
    ]
  },
  {
    key: "konjunktiv_i",
    label: "Konjunktiv I",
    type: "persons",
    tenses: [
      { key: "praesens", label: "Präsens" },
      { key: "perfekt", label: "Perfekt" },
      { key: "futur_i", label: "Futur I" }
    ]
  },
  {
    key: "konjunktiv_ii",
    label: "Konjunktiv II",
    type: "persons",
    tenses: [
      { key: "praeteritum", label: "Präteritum" },
      { key: "plusquamperfekt", label: "Plusquamperfekt" },
      { key: "futur_i", label: "Futur I" },
      { key: "futur_ii", label: "Futur II" }
    ]
  },
  {
    key: "imperativ",
    label: "Imperativ Präsens",
    type: "forms",
    tenses: [{ key: "praesens", label: "Präsens" }]
  },
  {
    key: "partizip",
    label: "Partizip",
    type: "simple",
    tenses: [
      { key: "partizip_i", label: "Partizip I" },
      { key: "partizip_ii", label: "Partizip II" }
    ]
  },
  {
    key: "infinitiv",
    label: "Infinitiv",
    type: "simple",
    tenses: [{ key: "praesens", label: "Präsens" }]
  }
];

function setConjugationNode(base, key, value) {
  if (!base || typeof base !== "object") return key;
  const targetKey = normalizeConjugationKey(key);
  const existingKey = Object.keys(base).find(
    entryKey => normalizeConjugationKey(entryKey) === targetKey
  );
  if (existingKey) {
    base[existingKey] = value;
    return existingKey;
  }
  base[key] = value;
  return key;
}

function createDefaultConjugationShape(verbWord) {
  const defaultShape = {};
  CONJUGATION_SCHEMA.forEach(mood => {
    const moodNode = {};
    mood.tenses.forEach(tense => {
      if (mood.type === "persons") {
        const personNode = {};
        CONJUGATION_PERSON_KEYS.forEach(person => {
          personNode[person] = "-";
        });
        moodNode[tense.key] = personNode;
      } else if (mood.type === "forms") {
        moodNode[tense.key] = {
          du: "-",
          ihr: "-",
          sie_formal: "-"
        };
      } else {
        moodNode[tense.key] =
          mood.key === "infinitiv" && tense.key === "praesens"
            ? String(verbWord || "").trim() || "-"
            : "-";
      }
    });
    defaultShape[mood.key] = moodNode;
  });
  return defaultShape;
}

function mergeConjugationWithTemplate(rawConjugation, templateConjugation) {
  const merged = JSON.parse(JSON.stringify(templateConjugation || {}));
  if (!rawConjugation || typeof rawConjugation !== "object") return merged;

  Object.entries(rawConjugation).forEach(([moodKey, moodValue]) => {
    if (!moodValue || typeof moodValue !== "object" || Array.isArray(moodValue)) {
      setConjugationNode(merged, moodKey, moodValue);
      return;
    }

    const currentMoodNode = getConjugationNode(merged, moodKey);
    const safeMoodNode =
      currentMoodNode && typeof currentMoodNode === "object" && !Array.isArray(currentMoodNode)
        ? currentMoodNode
        : {};
    const targetMoodKey = setConjugationNode(merged, moodKey, safeMoodNode);
    const targetMoodNode = merged[targetMoodKey];

    Object.entries(moodValue).forEach(([tenseKey, tenseValue]) => {
      if (!tenseValue || typeof tenseValue !== "object" || Array.isArray(tenseValue)) {
        setConjugationNode(targetMoodNode, tenseKey, tenseValue);
        return;
      }

      const currentTenseNode = getConjugationNode(targetMoodNode, tenseKey);
      const safeTenseNode =
        currentTenseNode &&
        typeof currentTenseNode === "object" &&
        !Array.isArray(currentTenseNode)
          ? currentTenseNode
          : {};
      const targetTenseKey = setConjugationNode(targetMoodNode, tenseKey, safeTenseNode);
      const targetTenseNode = targetMoodNode[targetTenseKey];

      Object.entries(tenseValue).forEach(([personKey, personValue]) => {
        setConjugationNode(targetTenseNode, personKey, personValue);
      });
    });
  });

  return merged;
}

function normalizeConjugationKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function getConjugationNode(base, key) {
  if (!base || typeof base !== "object") return null;
  const targetKey = normalizeConjugationKey(key);
  for (const entryKey of Object.keys(base)) {
    if (normalizeConjugationKey(entryKey) === targetKey) {
      return base[entryKey];
    }
  }
  return null;
}

function getConjugationPersonValue(tenseData, personKey) {
  if (!tenseData || typeof tenseData !== "object") return "-";
  const aliases = {
    ich: ["ich"],
    du: ["du"],
    er_sie_es: ["er_sie_es", "er/sie/es", "ersiees", "er_sie_es_"],
    wir: ["wir"],
    ihr: ["ihr"],
    sie_formal: ["sie_formal", "sie", "sie_formell", "Sie"]
  };
  const keys = aliases[personKey] || [personKey];
  for (const alias of keys) {
    const match = getConjugationNode(tenseData, alias);
    if (typeof match === "string" && match.trim()) return match.trim();
  }
  return "-";
}

function renderConjugationPersons(tenseData) {
  const rows = CONJUGATION_PERSON_KEYS.map(key => {
    const label = CONJUGATION_PERSON_LABELS[key];
    const value = getConjugationPersonValue(tenseData, key);
    return `<li><span>${label}</span><strong>${escapeHtml(value)}</strong></li>`;
  }).join("");
  return `<ul class="conjugation-person-list">${rows}</ul>`;
}

function renderConjugationSimpleField(data, key, label) {
  const value = getConjugationNode(data, key);
  return `
    <li>
      <span>${label}</span>
      <strong>${escapeHtml(typeof value === "string" && value.trim() ? value : "-")}</strong>
    </li>
  `;
}

function renderConjugationForms(tenseData) {
  if (!tenseData || typeof tenseData !== "object") {
    return `<p class="conjugation-empty">No form available.</p>`;
  }
  const orderedKeys = ["du", "ihr", "sie_formal"];
  const formLabelMap = { du: "du", ihr: "ihr", sie_formal: "Sie" };
  const rows = orderedKeys.map(key => {
    const value = getConjugationPersonValue(tenseData, key);
    return `<li><span>${formLabelMap[key]}</span><strong>${escapeHtml(value)}</strong></li>`;
  });
  return `<ul class="conjugation-person-list">${rows.join("")}</ul>`;
}

function renderConjugationCard(moodData, tense, moodType) {
  const tenseData = getConjugationNode(moodData, tense.key);
  let body = `<p class="conjugation-empty">No data available.</p>`;

  if (moodType === "persons") {
    body = renderConjugationPersons(tenseData);
  } else if (moodType === "forms") {
    body = renderConjugationForms(tenseData);
  } else if (moodType === "simple") {
    body = `
      <ul class="conjugation-person-list">
        ${renderConjugationSimpleField(moodData, tense.key, tense.label)}
      </ul>
    `;
  }

  return `
    <article class="conjugation-tense-card">
      <h3>${tense.label}</h3>
      ${body}
    </article>
  `;
}

function openConjugationPage(wordId) {
  const word = getAllWords().find(w => w.id === wordId);
  if (!word) return;

  const isVerb =
    String(word.category || "").toLowerCase() === "verben" ||
    String(word.type || "").toLowerCase() === "verb";
  if (!isVerb) {
    showToast("Conjugation is available only for verbs.", "error");
    return;
  }

  showSection("conjugationPage");
  const page = document.getElementById("conjugationPage");
  if (!page) return;
  page.innerHTML = "";
  page.className = "conjugation-page";

  const topBar = document.createElement("div");
  topBar.className = "conjugation-topbar";
  const backBtn = document.createElement("button");
  backBtn.className = "back-btn";
  backBtn.textContent = "← Back";
  backBtn.onclick = () => {
    setSingleRouteParam("word", word.word);
    openWordDetail(word.id);
  };
  const title = document.createElement("h1");
  title.textContent = `${word.word} – Konjugation`;
  topBar.appendChild(backBtn);
  topBar.appendChild(title);
  page.appendChild(topBar);

  const explainer = document.createElement("section");
  explainer.className = "category-explainer conjugation-explainer";
  explainer.innerHTML = `
    <button id="toggleConjExplainBtn" type="button" class="category-explain-btn category-explain-question">
      Was ist Konjugation?
    </button>
    <div id="conjExplainPanel" class="category-explain-panel collapsed" aria-hidden="true">
      <h4>Deutsch</h4>
      <p class="category-explainer-de">${escapeHtml(CONJUGATION_EXPLANATION.de)}</p>
      <h4>English</h4>
      <p>${escapeHtml(CONJUGATION_EXPLANATION.en)}</p>
      <h4>Bangla</h4>
      <p>${escapeHtml(CONJUGATION_EXPLANATION.bn)}</p>
    </div>
  `;
  page.appendChild(explainer);

  const wireConjugationExplainToggle = (btnId, panelId) => {
    const btn = explainer.querySelector(`#${btnId}`);
    const panel = explainer.querySelector(`#${panelId}`);
    if (!btn || !panel) return;
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", () => {
      const willOpen = panel.classList.contains("collapsed");
      panel.classList.toggle("collapsed", !willOpen);
      panel.classList.toggle("open", willOpen);
      panel.setAttribute("aria-hidden", willOpen ? "false" : "true");
      btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
      btn.classList.toggle("active", willOpen);
    });
  };

  wireConjugationExplainToggle("toggleConjExplainBtn", "conjExplainPanel");

  const content = document.createElement("div");
  content.className = "conjugation-content";
  const conjugation = mergeConjugationWithTemplate(
    word.conjugation,
    createDefaultConjugationShape(word.word)
  );

  CONJUGATION_SCHEMA.forEach(mood => {
    const moodData = getConjugationNode(conjugation, mood.key) || {};
    const moodSection = document.createElement("section");
    moodSection.className = "conjugation-mood";
    moodSection.innerHTML = `
      <h2>${mood.label}</h2>
      <div class="conjugation-grid">
        ${mood.tenses.map(tense => renderConjugationCard(moodData, tense, mood.type)).join("")}
      </div>
    `;
    content.appendChild(moodSection);
  });

  page.appendChild(content);
}

/* =========================================================
   WORD DETAIL PAGE

   Renders word data and connects notes, favorites, pronunciation,
   sharing, reports, conjugation, and context-aware navigation.
========================================================= */

function openWordDetail(wordId, options = {}) {

  const allWords = getAllWords();

  const word = allWords.find(w => w.id === wordId);
  if (standalonePage) { openMainSite("", word?.word || ""); return; }

  if (!word) {

    console.error("❌ Word NOT FOUND in database!");

    const detailPage = document.getElementById("wordDetailPage");
    detailPage.innerHTML = "<h2>Word not found ❌</h2>";

    return;
  }

  const needsWordWarning =
    word.category === "Schimpfwörter" && !options.skipWordWarning;
  if (needsWordWarning) {
    showSchimpfWarningModal({
      onConfirm: () => openWordDetail(wordId, { ...options, skipWordWarning: true }),
      onCancel: () => {
        if (openedFromCategory && currentCategory) {
          setSingleRouteParam("category", currentCategory);
          openCategoryPage(currentCategory, { requireEntryWarning: false });
          return;
        }
        setHomeRoute();
        showSection("homePage");
      }
    });
    return;
  }

  const requiresLogin =
    word.category === "Schimpfwörter" && !currentUser;
  if (requiresLogin) {
    promptLoginForRestrictedCategory(
      "Login required to view Schimpfwörter."
    );
    return;
  }

  const tutorWord = {
    id: word.id,
    word: word.word,
    category: word.category
  };
  if (word.article) tutorWord.article = word.article;
  if (word.plural) tutorWord.plural = word.plural;
  if (Array.isArray(word.englisch) && word.englisch.length) {
    tutorWord.meaningEn = word.englisch.join(", ");
  }
  if (Array.isArray(word.bangla) && word.bangla.length) {
    tutorWord.meaningBn = word.bangla.join(", ");
  }
  setRafiTutorContext({ view: "word", word: tutorWord });

  showSection("wordDetailPage");

  const detailPage = document.getElementById("wordDetailPage");
  detailPage.innerHTML = "";
  const isVerbEntry =
    String(word.category || "").toLowerCase() === "verben" ||
    String(word.type || "").toLowerCase() === "verb";

  /* ================= TOP BAR ================= */

  const topBar = document.createElement("div");
  topBar.className = "detail-topbar";

  const backBtn = document.createElement("button");
  backBtn.className = "back-btn";

  /* ================= BUTTON LOGIC ================= */

  if (openedFromFavorites) {
    backBtn.textContent = "← Back to Favorites";
    backBtn.onclick = () => {
      setSingleRouteParam("page", "favorites");
      renderFavoritesPage();
    };
  } else if (!openedFromHomeSearch && (openedFromCategory || word.category)) {

  backBtn.textContent = "← Back to Category";

  backBtn.onclick = () => {

    const targetCategory = currentCategory || word.category;
    setSingleRouteParam("category", targetCategory);

    openCategoryPage(targetCategory, { requireEntryWarning: false });

  };

} else {

  backBtn.textContent = "🏠 Home";

  backBtn.onclick = () => {

    setHomeRoute();
    showSection("homePage");

  };

}

  topBar.appendChild(backBtn);
  const topActions = document.createElement("div");
  topActions.className = "detail-top-actions";
  topBar.appendChild(topActions);

  const favoriteBtn = document.createElement("button");
  favoriteBtn.className = "favorite-btn";
  const syncFavoriteButton = () => {
    const active = favoriteWordIds.has(word.id);
    favoriteBtn.textContent = active ? "⭐ Favorited" : "☆ Add to Favorites";
    favoriteBtn.classList.toggle("active", active);
  };
  syncFavoriteButton();

  favoriteBtn.onclick = async () => {
    if (!currentUser) {
      showToast("Login to save favorites to your account.", "error");
      return;
    }

    if (favoriteWordIds.has(word.id)) {
      favoriteWordIds.delete(word.id);
      showToast("Removed from favorites.", "success");
    } else {
      favoriteWordIds.add(word.id);
      showToast("Added to favorites ⭐", "success");
    }

    syncFavoriteButton();
    await persistFavoritesIfLoggedIn();
  };

  topActions.appendChild(favoriteBtn);

  // Logged-in learning controls: learned tracker + custom lists + notes.
  const learnedBtn = document.createElement("button");
  learnedBtn.className = "favorite-btn learned-btn";
  const syncLearnedButton = () => {
    const learned = learnedWordIds.has(word.id);
    learnedBtn.textContent = learned ? "✅ Learned" : "☑ Mark Learned";
    learnedBtn.classList.toggle("active", learned);
  };
  syncLearnedButton();

  learnedBtn.onclick = async () => {
    if (!currentUser) {
      showToast("Login to track learned words.", "error");
      return;
    }
    if (learnedWordIds.has(word.id)) {
      learnedWordIds.delete(word.id);
      showToast("Removed from learned words.", "success");
    } else {
      learnedWordIds.add(word.id);
      showToast("Marked as learned ✅", "success");
    }
    syncLearnedButton();
    await persistLearningStateIfLoggedIn();
  };
  topActions.appendChild(learnedBtn);

  const audioBtn = document.createElement("button");
  audioBtn.className = "audio-pronounce-btn";
  audioBtn.type = "button";
  audioBtn.textContent = "🔊 Pronounce";
  audioBtn.setAttribute("aria-label", `Hear the German pronunciation of ${word.word}`);
  audioBtn.addEventListener("click", () => speakGerman(word.word));

  const reviewBtn = document.createElement("button");
  reviewBtn.className = "favorite-btn review-add-btn";
  reviewBtn.type = "button";
  const syncReviewButton = () => {
    const added = Boolean(reviewSchedule[word.id]);
    reviewBtn.textContent = added ? "🧠 In Review" : "＋ Add to Review";
    reviewBtn.classList.toggle("active", added);
  };
  syncReviewButton();
  reviewBtn.addEventListener("click", async () => {
    if (!currentUser) {
      promptLoginForRestrictedCategory("Login to add words to Spaced Repetition.");
      return;
    }
    if (reviewSchedule[word.id]) {
      delete reviewSchedule[word.id];
      showToast("Removed from spaced repetition.", "success");
    } else {
      reviewSchedule[word.id] = { repetitions: 0, interval: 0, due: Date.now() };
      showToast("Added to today’s review queue.", "success");
    }
    syncReviewButton();
    await persistLearningStateIfLoggedIn();
  });
  topActions.appendChild(reviewBtn);
  topActions.appendChild(audioBtn);

  if (isVerbEntry) {
    const conjugationBtn = document.createElement("button");
    conjugationBtn.className = "conjugation-open-btn";
    conjugationBtn.textContent = "See the Conjugation";
    conjugationBtn.addEventListener("click", () => {
      setSingleRouteParam("conjugation", word.word);
      openConjugationPage(word.id);
    });
    topActions.appendChild(conjugationBtn);

    const practiceBtn = document.createElement("button");
    practiceBtn.className = "conjugation-open-btn practice-open-btn";
    practiceBtn.textContent = "Practice Conjugation";
    practiceBtn.addEventListener("click", () => {
      if (!currentUser) {
        promptLoginForRestrictedCategory("Login to use Conjugation Practice.");
        return;
      }
      practiceOrigin = { type: "word", wordId: word.id };
      setSingleRouteParam("page", "conjugation-practice");
      renderConjugationPracticePage();
    });
    topActions.appendChild(practiceBtn);
  }

  detailPage.appendChild(topBar);

  /* ================= WORD CARD ================= */

  const card = document.createElement("div");
  card.className = "detail-card";
  const homeSearchCategorySuffix =
    openedFromHomeSearch && word.category
      ? ` <span class="detail-category-label">(${escapeHtml(getDetailCategoryLabel(word.category))})</span>`
      : "";
  const detailLevelLabel =
    ["Verben", "Nomen", "Adjektiven", "Adverbien"].includes(word.category) && word.level
      ? `<p class="detail-level">(Niveau ${escapeHtml(word.level)})</p>`
      : "";
  const hasEasyExamples =
    ["Verben", "Adjektiven", "Adverbien"].includes(word.category) &&
    getEasyExamples(word).length > 0;

  card.innerHTML = `
  <h1 class="detail-title${detailLevelLabel ? " has-level" : ""}">
    ${word.article ? word.article + " " : ""}${word.word}${homeSearchCategorySuffix}
  </h1>
  ${detailLevelLabel}

  <div class="detail-section">
    <h3>Meaning</h3>
    <p>${formatMeaningText(word)}</p>
  </div>

  ${
    isVerbWord(word) && String(word.category || "").toLowerCase() !== "verben"
      ? `
        <div class="detail-section">
          <h3>Conjugation Status</h3>
          <p>${getConjugationStatusText(word)}</p>
        </div>
      `
      : ""
  }

  ${
    shouldShowSynonym(word)
      ? `
        <div class="detail-section">
          <h3>Synonym</h3>
          <p>${getSynonymText(word)}</p>
        </div>
      `
      : ""
  }

  ${
    word.category === "Nomen" && word.plural
      ? `
        <div class="detail-section">
          <h3>Plural Form</h3>
          <p>${word.plural}</p>
        </div>
      `
      : ""
  }

  <div class="detail-section">
    <h3>English</h3>
    <p>${word.englisch?.join(", ") || "-"}</p>
  </div>

  <div class="detail-section">
    <h3>Bangla</h3>
    <p>${word.bangla?.join(", ") || "-"}</p>
  </div>

  <div class="detail-section">
    ${
      hasEasyExamples
        ? `<div class="detail-section-heading">
             <h3>Examples</h3>
             <button
               id="easyExamplesToggle"
               class="easy-examples-toggle"
               type="button"
               aria-pressed="false"
               aria-controls="wordExamples"
             >Easy Examples</button>
           </div>`
        : "<h3>Examples</h3>"
    }
    <p${hasEasyExamples ? ' id="wordExamples" class="word-examples-content"' : ""}>${formatExamples(word)}</p>
  </div>

  <div class="detail-section">
    <h3>Personal Notes</h3>
    <textarea id="wordNoteInput" class="word-note-input" placeholder="${
      currentUser ? "Write your private note for this word..." : "Login to add personal notes."
    }" ${currentUser ? "" : "disabled"}>${escapeHtml(wordNotesMap[word.id] || "")}</textarea>
    <div class="word-note-actions">
      <button id="saveWordNoteBtn" class="settings-primary" ${currentUser ? "" : "disabled"}>Save Note</button>
      <button id="clearWordNoteBtn" class="settings-secondary" ${currentUser ? "" : "disabled"}>Clear Note</button>
    </div>
  </div>

  <div class="detail-section">
    <h3>Custom Lists</h3>
    <div class="word-list-actions">
      <button id="toggleMyVerbsBtn" class="settings-cta"></button>
      <button id="toggleExamPrepBtn" class="settings-secondary"></button>
    </div>
  </div>

  <div class="detail-section">
    <h3>Quality</h3>
    <button id="reportWordBtn" class="danger-btn" ${currentUser ? "" : "disabled"}>
      Report wrong meaning/synonym
    </button>
  </div>
`;

  detailPage.appendChild(card);

  if (hasEasyExamples) {
    const easyExamplesToggle = document.getElementById("easyExamplesToggle");
    const examplesContent = document.getElementById("wordExamples");
    const defaultExamplesHtml = formatExamples(word);
    const easyExamplesHtml = formatEasyExamples(word);
    let showingEasyExamples = false;
    let examplesAnimating = false;

    easyExamplesToggle?.addEventListener("click", () => {
      if (!examplesContent || examplesAnimating) return;

      examplesAnimating = true;
      const startHeight = examplesContent.getBoundingClientRect().height;
      examplesContent.style.height = `${startHeight}px`;
      examplesContent.classList.add("is-changing");

      window.setTimeout(() => {
        showingEasyExamples = !showingEasyExamples;
        examplesContent.innerHTML = showingEasyExamples
          ? easyExamplesHtml
          : defaultExamplesHtml;
        easyExamplesToggle.classList.toggle("active", showingEasyExamples);
        easyExamplesToggle.setAttribute("aria-pressed", String(showingEasyExamples));

        const endHeight = examplesContent.scrollHeight;
        examplesContent.style.height = `${endHeight}px`;
        examplesContent.classList.remove("is-changing");

        window.setTimeout(() => {
          examplesContent.style.height = "auto";
          examplesAnimating = false;
        }, 360);
      }, 180);
    });
  }

  if (currentUser) {
    updateProgressStatsForWordOpen();
    persistLearningStateIfLoggedIn();
  }

  const noteInput = document.getElementById("wordNoteInput");
  const saveNoteBtn = document.getElementById("saveWordNoteBtn");
  const clearNoteBtn = document.getElementById("clearWordNoteBtn");

  saveNoteBtn?.addEventListener("click", async () => {
    const noteText = noteInput?.value || "";
    wordNotesMap[word.id] = noteText;
    if (await persistSingleNoteIfLoggedIn(word.id, noteText)) showToast("Note saved.", "success");
  });

  clearNoteBtn?.addEventListener("click", async () => {
    if (noteInput) noteInput.value = "";
    delete wordNotesMap[word.id];
    if (await persistSingleNoteIfLoggedIn(word.id, "")) showToast("Note removed.", "success");
  });

  const myVerbsBtn = document.getElementById("toggleMyVerbsBtn");
  const examPrepBtn = document.getElementById("toggleExamPrepBtn");
  const syncListButtons = () => {
    const inMyVerbs = customListWordIds.myVerbs.has(word.id);
    const inExamPrep = customListWordIds.examPrep.has(word.id);
    if (myVerbsBtn) {
      myVerbsBtn.textContent = inMyVerbs ? "✓ Remove from My Verbs" : "+ Add to My Verbs";
      myVerbsBtn.classList.toggle("active", inMyVerbs);
    }
    if (examPrepBtn) {
      examPrepBtn.textContent = inExamPrep
        ? "✓ Remove from Exam Prep"
        : "+ Add to Exam Prep";
      examPrepBtn.classList.toggle("active", inExamPrep);
    }
  };
  syncListButtons();

  myVerbsBtn?.addEventListener("click", async () => {
    if (!currentUser) {
      showToast("Login to use My Verbs list.", "error");
      return;
    }
    if (customListWordIds.myVerbs.has(word.id)) {
      customListWordIds.myVerbs.delete(word.id);
      showToast("Removed from My Verbs.", "success");
    } else {
      customListWordIds.myVerbs.add(word.id);
      showToast("Added to My Verbs.", "success");
    }
    syncListButtons();
    await persistLearningStateIfLoggedIn();
  });

  examPrepBtn?.addEventListener("click", async () => {
    if (!currentUser) {
      showToast("Login to use Exam Prep list.", "error");
      return;
    }
    if (customListWordIds.examPrep.has(word.id)) {
      customListWordIds.examPrep.delete(word.id);
      showToast("Removed from Exam Prep.", "success");
    } else {
      customListWordIds.examPrep.add(word.id);
      showToast("Added to Exam Prep.", "success");
    }
    syncListButtons();
    await persistLearningStateIfLoggedIn();
  });

  const reportWordBtn = document.getElementById("reportWordBtn");
  reportWordBtn?.addEventListener("click", async () => {
    const user = currentUser;
    const reason = window.prompt(
      "Report issue for this word (meaning/synonym issue):",
      user ? submissionDraft(user.uid, "report", word.id).reason || "" : ""
    );
    if (!reason || !reason.trim()) return;
    const payload = {wordId:word.id, word:word.word, reason:reason.trim()};
    if (user) retainSubmissionDraft(user.uid, "report", payload);
    try {
      await submitWordReport(user, payload);
      clearSubmissionDraft(user.uid, "report", payload);
      if (currentUser?.uid !== user.uid) return;
      showToast("Report submitted. Thanks!", "success");
    } catch (error) {
      showToast(error?.message || "Could not submit report.", "error");
    }
  });

}

/* =========================================================
   SHARED PAGE/PANEL HELPERS

   Shared navigation and rendering for information pages, favorites,
   settings, and expandable cards.
========================================================= */

function goHomeWithoutRefresh() {
  if (standalonePage) { openMainSite(); return; }
  openedFromFavorites = false;
  openedFromCategory = false;
  openedFromHomeSearch = false;
  setHomeRoute();
  currentView = "home";
  showSection("homePage");
}

function buildPanelPageHeading(page) {
  return page.title ? '<div class="panel-page-heading"><h1>' + escapeHtml(page.title) + '</h1></div>' : '';
}

function renderPanelPage(pageKey) {
  pageKey = normalizePanelPageKey(pageKey);
  if (pageKey === "option5") {
    window.location.replace(new URL("../exam-zone/", import.meta.url).href);
    return;
  }
  if (pageKey === "ausbildung" || pageKey === "owner") {
    const destination = new URL(pageKey === "owner" ? "../about-rafi/" : "../ausbildung/", import.meta.url);
    destination.hash = window.location.hash;
    window.location.replace(destination.href);
    return;
  }
  updateFooterBrand(pageKey === "sprachwelt");

  if (pageKey === "about") {
    renderGermanyPage();
    return;
  }

  if (pageKey === "bangladesh") {
    renderBangladeshPage();
    return;
  }

  const page = panelPageContent[pageKey];
  const desktopPage = document.getElementById("desktopPage");
  if (!desktopPage || !page) return;

  currentView = "custom";
  setRafiTutorContext({ view: "home" });

  ["homePage", "categoryPage", "wordDetailPage", "conjugationPage"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const hero = document.getElementById("heroSection");
  if (hero) hero.style.display = "none";



  const isSprachweltHero = pageKey === "sprachwelt";
  const heroClassName = isSprachweltHero ? "panel-hero-image panel-hero-image--sprachwelt" : "panel-hero-image";
  const cardGridClassName = isSprachweltHero ? "panel-page-cards panel-page-cards--sprachwelt" : "panel-page-cards";

  const cards = page.cards
    .map((card, idx) => {
      const title = typeof card === "string" ? `Section ${idx + 1}` : card.title || `Section ${idx + 1}`;
      const body = typeof card === "string" ? card : card.body || "";
      const photo = typeof card === "string" ? "" : card.photo || "";
      const image = typeof card === "string" ? "" : card.image || "";
      const imageClass = typeof card === "string" ? "" : card.imageClass || "";
      const href = typeof card === "string" ? "" : card.href || "";
      const photoStyle = typeof card === "string" ? "" : buildPhotoStyle(card);
      const isSprachweltCard = pageKey === "sprachwelt";
      const sprachweltClass = isSprachweltCard ? "panel-page-card--sprachwelt" : "";
      const linkClass = href ? "panel-page-card-link" : "";
      const cardTag = href ? "a" : "article";
      const hrefAttr = href ? ` href="${escapeHtml(href)}"` : "";
      const cardBody = isSprachweltCard || !body
        ? ""
        : `<p class="panel-card-body">${escapeHtml(body)}</p>`;
      const readMoreButton = isSprachweltCard
        ? ""
        : `
          <button class="panel-card-read-more" type="button" data-panel-read-more aria-expanded="false">
            ${escapeHtml(page.readMoreLabel || "Read more")}
          </button>
        `;
      const levelAction = isSprachweltCard && href
        ? `<span class="panel-level-action">Open level <span aria-hidden="true">→</span></span>`
        : "";

      return `
        <${cardTag} class="panel-page-card is-collapsed ${sprachweltClass} ${linkClass}"${hrefAttr}>
          ${
            image
              ? `<img class="panel-page-photo ${escapeHtml(imageClass)}" src="${escapeHtml(image)}" alt="${escapeHtml(photo || title)}" loading="lazy"${photoStyle}>`
              : photo
                ? `<div class="panel-photo-placeholder">${escapeHtml(photo)}</div>`
                : ""
          }
          <h3>${escapeHtml(title)}</h3>
          ${cardBody}
          ${readMoreButton}
          ${levelAction}
        </${cardTag}>
      `;
    })
    .join("");

  desktopPage.style.display = "block";
  desktopPage.innerHTML = `
    <div class="panel-page-wrap">
      ${
        page.image
          ? `<div class="${heroClassName}" style="background-image:url('${escapeHtml(page.image)}'); --photo-position: ${escapeHtml(page.imagePosition || "center")}"></div>`
          : ""
      }
      <div class="panel-page-content">
        ${buildPanelPageHeading(page)}
        <p class="panel-page-description">${formatPanelDescription(pageKey, page.description)}</p>
        <div class="${cardGridClassName}">
          ${cards}
        </div>
        ${page.footer ? `<footer class="panel-page-footer">${escapeHtml(page.footer)}</footer>` : ""}
      </div>
    </div>
  `;

  wirePanelCardReadMore(desktopPage);

}

function wirePanelCardReadMore(container) {
  container.querySelectorAll("[data-panel-read-more]").forEach(button => {
    button.addEventListener("click", () => {
      const card = button.closest(".panel-page-card");
      if (!card) return;

      const isExpanded = card.classList.toggle("is-expanded");
      card.classList.toggle("is-collapsed", !isExpanded);
      button.textContent = isExpanded ? "Show less" : "Read more";
      button.setAttribute("aria-expanded", String(isExpanded));
    });
  });
}

function renderFavoritesPage() {
  updateFooterBrand(false);
  const desktopPage = document.getElementById("desktopPage");
  if (!desktopPage) return;

  currentView = "custom";
  ["homePage", "categoryPage", "wordDetailPage", "conjugationPage"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  const hero = document.getElementById("heroSection");
  if (hero) hero.style.display = "none";

  const favoriteWords = getFavoriteWords();
  const rows = favoriteWords
    .map(
      w => `
        <button class="settings-word-item" data-word-id="${w.id}">
          <span>${w.word}</span>
          <small>${w.category || "-"}</small>
        </button>
      `
    )
    .join("");

  desktopPage.style.display = "block";
  desktopPage.innerHTML = `
    <div class="settings-wrap">
      <div class="settings-head premium-glow">
        <h1>⭐ My Favorites</h1>
        <p>${currentUser ? "Your saved words. Tap any word to open details." : "Login required to use favorites."}</p>
      </div>
      ${
        !currentUser
          ? `<div class="settings-card locked">
              <h3>Login Required</h3>
              <p>Sign in to save and view your favorite words across sessions.</p>
             </div>`
          : favoriteWords.length === 0
            ? `<div class="settings-card"><h3>No favorites yet</h3><p>Open any word and tap <strong>Add to Favorites</strong>.</p></div>`
            : `<div class="settings-card settings-word-grid">${rows}</div>`
      }
    </div>
  `;

  desktopPage.querySelectorAll(".settings-word-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const wordId = btn.getAttribute("data-word-id");
      if (!wordId) return;
      openedFromFavorites = true;
      openedFromCategory = false;
      openedFromHomeSearch = false;
      openWordDetail(wordId);
      const selected = getAllWords().find(w => w.id === wordId);
      if (selected) {
        setSingleRouteParam("word", selected.word);
      }
    });
  });
}

function renderSettingsPage() {
  updateFooterBrand(false);
  // Settings hub: appearance, syncing, progress tracking, lists, and community feedback.
  const desktopPage = document.getElementById("desktopPage");
  if (!desktopPage) return;

  const settings = currentAppSettings || getStoredSettings();
  const allWords = getAllWords();
  const learnedCount = learnedWordIds.size;
  const myVerbsCount = customListWordIds.myVerbs.size;
  const examPrepCount = customListWordIds.examPrep.size;
  const historyRows = searchHistoryItems
    .slice(0, 12)
    .map(
      item =>
        `<button class="settings-history-item" data-search-word="${escapeHtml(item.q)}">${escapeHtml(item.q)}</button>`
    )
    .join("");

  currentView = "custom";
  ["homePage", "categoryPage", "wordDetailPage", "conjugationPage"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  const hero = document.getElementById("heroSection");
  if (hero) hero.style.display = "none";

  desktopPage.style.display = "block";
  desktopPage.innerHTML = `
    <div class="settings-wrap">
      <div class="settings-head premium-glow">
        <h1>⚙ Settings</h1>
        <p>Personalize appearance, reading comfort, and account sync behavior.</p>
      </div>

      <div class="settings-grid">
        <section class="settings-card">
          <h3>Appearance</h3>
          <label>Theme
            <select id="settingsThemeSelect">
              <option value="system" ${settings.theme === "system" ? "selected" : ""}>System</option>
              <option value="light" ${settings.theme === "light" ? "selected" : ""}>Light</option>
              <option value="dark" ${settings.theme === "dark" ? "selected" : ""}>Dark</option>
            </select>
          </label>
          <label>Text Size
            <select id="settingsTextSizeSelect">
              <option value="compact" ${settings.textSize === "compact" ? "selected" : ""}>Compact</option>
              <option value="normal" ${settings.textSize === "normal" ? "selected" : ""}>Normal</option>
              <option value="large" ${settings.textSize === "large" ? "selected" : ""}>Large</option>
            </select>
          </label>
          <label class="settings-toggle">
            <input id="settingsMotionToggle" type="checkbox" ${settings.reducedMotion ? "checked" : ""}/>
            Reduce motion
          </label>
        </section>

        <section class="settings-card">
          <h3>Account & Sync</h3>
          <p class="settings-status ${currentUser ? "ok" : "warn"}">
            ${currentUser ? `Logged in as ${escapeHtml(currentUser.email || "user")}` : "Guest mode: settings are local only"}
          </p>
          <p class="settings-help">
            Cloud sync stores your settings, favorites, learned words, notes, and history in your Firebase profile.
          </p>
          <label class="settings-toggle">
            <input id="settingsCloudToggle" type="checkbox" ${settings.cloudSync ? "checked" : ""} ${currentUser ? "" : "disabled"}/>
            Cloud sync (settings + favorites + learning data)
          </label>
          <button id="openFavoritesBtn" class="settings-cta" ${currentUser ? "" : "disabled"}>
            Open My Favorites (${favoriteWordIds.size})
          </button>
        </section>

        <section class="settings-card">
          <h3>Learning Progress</h3>
          <p class="settings-help">Track your real activity over days.</p>
          <div class="settings-kpi-grid">
            <div class="kpi-item"><strong>${learnedCount}</strong><span>Learned</span></div>
            <div class="kpi-item"><strong>${progressStats.wordsOpened}</strong><span>Word Opens</span></div>
            <div class="kpi-item"><strong>${progressStats.daysActive}</strong><span>Days Active</span></div>
            <div class="kpi-item"><strong>${progressStats.streak}</strong><span>Streak</span></div>
          </div>
          <button id="openLearnedWordsBtn" class="settings-secondary" ${currentUser ? "" : "disabled"}>View Learned Words</button>
        </section>

        <section class="settings-card">
          <h3>Custom Lists</h3>
          <p class="settings-help">Personal list organization for faster revision.</p>
          <div class="settings-list-actions">
            <button id="openMyVerbsBtn" class="settings-secondary" ${currentUser ? "" : "disabled"}>My Verbs (${myVerbsCount})</button>
            <button id="openExamPrepBtn" class="settings-secondary" ${currentUser ? "" : "disabled"}>Exam Prep (${examPrepCount})</button>
          </div>
        </section>

        <section class="settings-card">
          <h3>Search History</h3>
          <p class="settings-help">Recent searches across sessions.</p>
          <div class="settings-history-wrap">
            ${historyRows || '<span class="settings-empty">No search history yet.</span>'}
          </div>
          <button id="clearSearchHistoryBtn" class="settings-secondary" ${currentUser ? "" : "disabled"}>Clear History</button>
        </section>

        <section class="settings-card">
          <h3>Community</h3>
          <label>Submit word suggestion
            <textarea id="suggestionInput" class="settings-textarea" placeholder="Suggest a new word with short meaning..." ${currentUser ? "" : "disabled"}></textarea>
          </label>
          <button id="sendSuggestionBtn" class="settings-primary" ${currentUser ? "" : "disabled"}>Submit Suggestion</button>

          <label>Report wrong meaning/synonym
            <textarea id="reportInput" class="settings-textarea" placeholder="Write your report..." ${currentUser ? "" : "disabled"}></textarea>
          </label>
          <button id="sendGenericReportBtn" class="danger-btn" ${currentUser ? "" : "disabled"}>Submit Report</button>
        </section>
      </div>

      <div class="settings-actions">
        <button id="saveSettingsBtn" class="settings-primary">Save Settings</button>
        <button id="resetSettingsBtn" class="settings-secondary">Reset to Default</button>
      </div>
    </div>
  `;

  const themeSelect = document.getElementById("settingsThemeSelect");
  const textSizeSelect = document.getElementById("settingsTextSizeSelect");
  const motionToggle = document.getElementById("settingsMotionToggle");
  const cloudToggle = document.getElementById("settingsCloudToggle");
  const saveBtn = document.getElementById("saveSettingsBtn");
  const resetBtn = document.getElementById("resetSettingsBtn");
  const openFavoritesBtn = document.getElementById("openFavoritesBtn");
  const openMyVerbsBtn = document.getElementById("openMyVerbsBtn");
  const openExamPrepBtn = document.getElementById("openExamPrepBtn");
  const openLearnedWordsBtn = document.getElementById("openLearnedWordsBtn");
  const clearSearchHistoryBtn = document.getElementById("clearSearchHistoryBtn");
  const suggestionInput = document.getElementById("suggestionInput");
  const sendSuggestionBtn = document.getElementById("sendSuggestionBtn");
  const reportInput = document.getElementById("reportInput");
  const sendGenericReportBtn = document.getElementById("sendGenericReportBtn");
  if (currentUser) {
    const draftOwner = currentUser.uid;
    suggestionInput.value = submissionDraft(currentUser.uid, "suggestion").message || "";
    reportInput.value = submissionDraft(currentUser.uid, "report").reason || "";
    // Validate without maxlength: pasted/legacy content must never be clipped.
    for (const [input, kind] of [[suggestionInput,"suggestion"], [reportInput,"report"]]) {
      input?.addEventListener("input", () => {
        if (currentUser?.uid !== draftOwner) return;
        const payload = kind === "report" ? {word:"general",wordId:"general",reason:input.value} : {word:"General",message:input.value};
        retainSubmissionDraft(draftOwner, kind, payload);
        try { validateSubmission(kind, payload); input.setCustomValidity(""); }
        catch (error) { input.setCustomValidity(error.message); }
      });
    }
  }

  saveBtn?.addEventListener("click", async () => {
    const next = {
      ...(currentAppSettings || DEFAULT_APP_SETTINGS),
      theme: themeSelect?.value || "system",
      textSize: textSizeSelect?.value || "normal",
      reducedMotion: Boolean(motionToggle?.checked),
      cloudSync: currentUser ? Boolean(cloudToggle?.checked) : false
    };
    applyAppSettings(next, { persist: true });
    if (await persistSettingsIfNeeded()) showToast("Settings saved successfully ✨", "success");
  });

  resetBtn?.addEventListener("click", async () => {
    const next = { ...DEFAULT_APP_SETTINGS, cloudSync: Boolean(currentUser) };
    applyAppSettings(next, { persist: true });
    const saved = await persistSettingsIfNeeded();
    renderSettingsPage();
    if (saved) showToast("Settings reset to default.", "success");
  });

  openFavoritesBtn?.addEventListener("click", () => {
    if (!currentUser) return;
    setSingleRouteParam("page", "favorites");
    renderFavoritesPage();
  });

  const openCustomList = (listKey, title) => {
    const ids = Array.from(customListWordIds[listKey] || []);
    const words = ids
      .map(id => allWords.find(w => w.id === id))
      .filter(Boolean);
    const rows = words
      .map(
        w => `
          <button class="settings-word-item" data-word-id="${w.id}">
            <span>${escapeHtml(w.word)}</span>
            <small>${escapeHtml(w.category || "-")}</small>
          </button>
        `
      )
      .join("");
    desktopPage.innerHTML = `
      <div class="settings-wrap">
        <div class="settings-head premium-glow">
          <h1>${escapeHtml(title)}</h1>
          <p>${words.length} words in this list.</p>
        </div>
        <div class="settings-card settings-word-grid">
          ${rows || `<span class="settings-empty">No words in this list yet.</span>`}
        </div>
        <div class="settings-actions">
          <button id="backToSettingsBtn" class="settings-secondary">← Back to Settings</button>
        </div>
      </div>
    `;
    desktopPage.querySelectorAll(".settings-word-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const wordId = btn.getAttribute("data-word-id");
        const selected = allWords.find(w => w.id === wordId);
        if (!selected) return;
        openedFromFavorites = false;
        openedFromCategory = false;
        openedFromHomeSearch = false;
        setSingleRouteParam("word", selected.word);
        openWordDetail(selected.id);
      });
    });
    document
      .getElementById("backToSettingsBtn")
      ?.addEventListener("click", renderSettingsPage);
  };

  openMyVerbsBtn?.addEventListener("click", () => openCustomList("myVerbs", "📘 My Verbs"));
  openExamPrepBtn?.addEventListener("click", () => openCustomList("examPrep", "🎯 Exam Prep"));
  openLearnedWordsBtn?.addEventListener("click", () => {
    const ids = Array.from(learnedWordIds);
    const words = ids.map(id => allWords.find(w => w.id === id)).filter(Boolean);
    const rows = words
      .map(
        w => `
          <button class="settings-word-item" data-word-id="${w.id}">
            <span>${escapeHtml(w.word)}</span>
            <small>${escapeHtml(w.category || "-")}</small>
          </button>
        `
      )
      .join("");
    desktopPage.innerHTML = `
      <div class="settings-wrap">
        <div class="settings-head premium-glow">
          <h1>✅ Learned Words</h1>
          <p>${words.length} words marked as learned.</p>
        </div>
        <div class="settings-card settings-word-grid">
          ${rows || `<span class="settings-empty">No learned words yet.</span>`}
        </div>
        <div class="settings-actions">
          <button id="backToSettingsBtn" class="settings-secondary">← Back to Settings</button>
        </div>
      </div>
    `;
    desktopPage.querySelectorAll(".settings-word-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const wordId = btn.getAttribute("data-word-id");
        const selected = allWords.find(w => w.id === wordId);
        if (!selected) return;
        openedFromFavorites = false;
        openedFromCategory = false;
        openedFromHomeSearch = false;
        setSingleRouteParam("word", selected.word);
        openWordDetail(selected.id);
      });
    });
    document
      .getElementById("backToSettingsBtn")
      ?.addEventListener("click", renderSettingsPage);
  });

  clearSearchHistoryBtn?.addEventListener("click", async () => {
    searchHistoryItems = [];
    await persistLearningStateIfLoggedIn();
    renderSettingsPage();
    showToast("Search history cleared.", "success");
  });

  desktopPage.querySelectorAll(".settings-history-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const q = btn.getAttribute("data-search-word");
      if (!q) return;
      const word = allWords.find(w => w.word.toLowerCase() === q.toLowerCase());
      if (!word) return;
      openedFromHomeSearch = true;
      openedFromCategory = false;
      openedFromFavorites = false;
      setSingleRouteParam("word", word.word);
      openWordDetail(word.id);
    });
  });

  sendSuggestionBtn?.addEventListener("click", async () => {
    const user = currentUser;
    const text = suggestionInput?.value.trim() || "";
    if (!text) {
      showToast("Write a suggestion first.", "error");
      return;
    }
    try {
      const payload = {word:"General",message:text};
      retainSubmissionDraft(user.uid, "suggestion", payload);
      await submitWordSuggestion(user, payload);
      clearSubmissionDraft(user.uid, "suggestion", payload);
      if (currentUser?.uid !== user.uid) return;
      if (suggestionInput.value.trim() === text) suggestionInput.value = "";
      showToast("Suggestion sent. Thank you!", "success");
    } catch (error) {
      showToast(error?.message || "Could not send suggestion.", "error");
    }
  });

  sendGenericReportBtn?.addEventListener("click", async () => {
    const user = currentUser;
    const text = reportInput?.value.trim() || "";
    if (!text) {
      showToast("Write a report first.", "error");
      return;
    }
    try {
      const payload = {
        wordId: "general",
        word: "general",
        reason: text
      };
      retainSubmissionDraft(user.uid, "report", payload);
      await submitWordReport(user, payload);
      clearSubmissionDraft(user.uid, "report", payload);
      if (currentUser?.uid !== user.uid) return;
      if (reportInput.value.trim() === text) reportInput.value = "";
      showToast("Report submitted. Thank you!", "success");
    } catch (error) {
      showToast(error?.message || "Could not submit report.", "error");
    }
  });
}

function formatTimestamp(value) {
  if (!value) return "-";
  if (value.toDate) {
    return value.toDate().toLocaleString();
  }
  return String(value);
}

async function openUserInfoPanel(user) {
  const generation = accountViewGeneration;
  const modal = document.getElementById("userInfoModal");
  const content = document.getElementById("userInfoContent");
  if (!modal || !content || !user || currentUser?.uid !== user.uid) return;

  // Show modal immediately for responsive UX, then hydrate profile details.
  modal.classList.remove("hidden");

  const renderProfileContent = (profileData) => {
    if (generation !== accountViewGeneration || currentUser?.uid !== user.uid) return;
    const displayName =
      profileData?.displayName || (user.email ? user.email.split("@")[0] : "User");

    content.innerHTML = `
    <div class="user-card-head">
      <div class="user-avatar-large">👤</div>
      <div>
        <h3>${displayName}</h3>
        <p>${user.email || "-"}</p>
      </div>
    </div>
    <div class="user-info-row"><strong>UID:</strong> ${user.uid || "-"}</div>
    <div class="user-info-row">
      <strong>Email Verified:</strong> ✅ Verified
    </div>
    <div class="user-info-row"><strong>Created:</strong> ${formatTimestamp(profileData?.createdAt)}</div>
    <div class="user-info-row"><strong>Last Login:</strong> ${formatTimestamp(profileData?.lastLoginAt)}</div>
    <div class="user-info-row user-action-row">
      <button id="toggleChangePasswordPanel" type="button" class="compact-toggle-btn">Change Password</button>
      <div id="changePasswordPanel" class="user-action-grid hidden">
        <input id="currentPasswordInput" type="password" placeholder="Current password" />
        <input id="newPasswordInput" type="password" placeholder="New password (min 6)" />
        <input id="confirmPasswordInput" type="password" placeholder="Confirm new password" />
        <button id="changePasswordBtn" type="button" class="user-action-btn">Update Password</button>
      </div>
    </div>
    <div class="user-info-row user-action-row danger">
      <button id="toggleDeleteAccountPanel" type="button" class="compact-toggle-btn danger-btn">Delete Account</button>
      <div id="deleteAccountPanel" class="user-action-grid hidden">
        <input id="deletePasswordInput" type="password" placeholder="Enter password to confirm" />
        <button id="deleteAccountBtn" type="button" class="user-action-btn danger-btn">Delete Account</button>
      </div>
      <small>This action is permanent.</small>
    </div>
  `;

  const toggleChangePanelBtn = document.getElementById("toggleChangePasswordPanel");
  const changePanel = document.getElementById("changePasswordPanel");
  toggleChangePanelBtn?.addEventListener("click", () => {
    changePanel?.classList.toggle("hidden");
  });

  const changeBtn = document.getElementById("changePasswordBtn");
  const currentPasswordInput = document.getElementById("currentPasswordInput");
  const newPasswordInput = document.getElementById("newPasswordInput");
  const confirmPasswordInput = document.getElementById("confirmPasswordInput");

  changeBtn?.addEventListener("click", async () => {
    const currentPassword = currentPasswordInput?.value.trim() || "";
    const newPassword = newPasswordInput?.value.trim() || "";
    const confirmPassword = confirmPasswordInput?.value.trim() || "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Fill all password fields first.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New password and confirm password do not match.", "error");
      return;
    }

    try {
      await changePasswordWithConfirmation(user, currentPassword, newPassword);
      showToast("Password updated successfully ✅", "success");
      userProfileCache.set(user.uid, { ...(profileData || {}) });
      renderProfileContent({ ...(profileData || {}) });
    } catch (error) {
      const msg =
        error?.code === "auth/invalid-credential"
          ? "Current password is incorrect."
          : error?.message || "Password update failed.";
      showToast(msg, "error");
    }
  });

  const deleteBtn = document.getElementById("deleteAccountBtn");
  const deletePasswordInput = document.getElementById("deletePasswordInput");
  const toggleDeletePanelBtn = document.getElementById("toggleDeleteAccountPanel");
  const deletePanel = document.getElementById("deleteAccountPanel");
  toggleDeletePanelBtn?.addEventListener("click", () => {
    deletePanel?.classList.toggle("hidden");
  });
  deleteBtn?.addEventListener("click", async () => {
    const confirmPassword = deletePasswordInput?.value.trim() || "";
    if (!confirmPassword) {
      showToast("Enter password to confirm account deletion.", "error");
      return;
    }

    const ok = window.confirm(
      "Are you sure you want to permanently delete this account?"
    );
    if (!ok) return;

    try {
      await deleteAccountWithPassword(user, confirmPassword);
      modal.classList.add("hidden");
      showToast("Account deleted successfully.", "success");
      goHomeWithoutRefresh();
    } catch (error) {
      const msg =
        error?.code === "auth/invalid-credential"
          ? "Password does not match. Account not deleted."
          : error?.message || "Account deletion failed.";
      showToast(msg, "error");
    }
  });
  };

  renderProfileContent(userProfileCache.get(user.uid) || null);

  try {
    await ensureUserProfile(user);
    touchUserLastLogin(user).catch(() => {
      // Non-blocking analytics update.
    });
    const profile = await getUserProfile(user);
    if (generation !== accountViewGeneration || currentUser?.uid !== user.uid) return;
    userProfileCache.set(user.uid, profile || null);
    renderProfileContent(profile || null);
  } catch (error) {
    if (generation === accountViewGeneration && currentUser?.uid === user.uid) showToast(accountSaveError(error, "Profile"), "error");
  }
}

/* =========================================================
   AUTH MODAL

   Connects login, signup, and password reset controls to auth.js.
========================================================= */

function setupAuthModal() {

  const loginBtn = document.getElementById("loginBtn");
  const modal = document.getElementById("authModal");
  const closeBtn = document.getElementById("closeAuth");
  const form = document.getElementById("authForm");
  const emailInput = document.getElementById("authEmail");
  const passwordInput = document.getElementById("authPassword");
  const errorBox = document.getElementById("authError");

  const authTitle = document.getElementById("authTitle");
  const authSubtitle = document.getElementById("authSubtitle");
  const authSubmitBtn = document.getElementById("authSubmitBtn");
  const switchText = document.getElementById("switchText");
  const switchBtn = document.getElementById("switchModeBtn");
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");

  let isLoginMode = true;

  /* ================= OPEN MODAL ================= */
  loginBtn?.addEventListener("click", () => {
    if (currentUser) return;

    modal.classList.remove("hidden");

    setAuthMode(true); // always open in login mode

  });

  /* ================= CLOSE MODAL ================= */
  closeBtn?.addEventListener("click", () => {

    modal.classList.add("hidden");
    form.reset();
    errorBox.textContent = "";

  });

  /* ================= SWITCH MODE ================= */
  switchBtn?.addEventListener("click", () => {

    isLoginMode = !isLoginMode;

    setAuthMode(isLoginMode);

  });

  forgotPasswordBtn?.addEventListener("click", async () => {
    errorBox.textContent = "";
    forgotPasswordBtn.disabled = true;

    try {
      await resetPasswordByEmail(emailInput.value);
      errorBox.textContent =
        "Password reset email sent. Check your inbox or spam folder, then follow the link to set a new password.";
      errorBox.style.color = "#16a34a";
      showToast("Password reset email sent.", "success");
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.style.color = "#ff4d4d";
    } finally {
      forgotPasswordBtn.disabled = false;
    }
  });

  /* ================= FORM SUBMIT ================= */
  form?.addEventListener("submit", async (e) => {

    e.preventDefault();

    errorBox.textContent = "";
    errorBox.style.color = "";
    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = isLoginMode ? "Logging in…" : "Creating account…";

    try {

      if (isLoginMode) {

        await login(emailInput.value.trim(), passwordInput.value);
        modal.classList.add("hidden");
        form.reset();
        showToast("Welcome back! You are logged in 🎉", "success");

      } else {

        await signup(emailInput.value.trim(), passwordInput.value);
        modal.classList.add("hidden");
        form.reset();
        showToast(
          "Account created ✅ Verification email sent. Check inbox or spam folder.",
          "success"
        );

      }

    } catch (error) {

      errorBox.textContent = error.message;
      errorBox.style.color = "#ff4d4d";

    } finally {
      authSubmitBtn.disabled = false;
      authSubmitBtn.textContent = isLoginMode ? "Login" : "Sign Up";
    }

  });

  /* ================= SWITCH UI TEXT ================= */
  function setAuthMode(loginMode) {

    isLoginMode = loginMode;
    errorBox.textContent = "";
    errorBox.style.color = "";
    passwordInput.autocomplete = loginMode ? "current-password" : "new-password";

    if (loginMode) {

      authTitle.textContent = "Welcome back";
      authSubtitle.textContent = "Log in to continue learning German";
      authSubmitBtn.textContent = "Login";

      switchText.textContent = "Don't have an account?";
      switchBtn.textContent = "Sign Up";

    } else {

      authTitle.textContent = "Sign up for free";
      authSubtitle.textContent =
        "Save and view vocabulary, check personal notes, and more...";
      authSubmitBtn.textContent = "Sign Up";

      switchText.textContent = "Already have an account?";
      switchBtn.textContent = "Login";

    }

  }

}

function setupUserInfoModal() {
  const modal = document.getElementById("userInfoModal");
  const closeBtn = document.getElementById("closeUserInfo");
  const modalBox = modal?.querySelector(".user-modal-box");

  closeBtn?.addEventListener("click", () => {
    modal?.classList.add("hidden");
  });

  // Close only when click/touch happens outside the profile box.
  const closeUserModalOutside = (e) => {
    if (!modal || modal.classList.contains("hidden")) return;
    if (!modalBox) return;
    if (!modalBox.contains(e.target)) {
      modal.classList.add("hidden");
    }
  };

  modal?.addEventListener("click", closeUserModalOutside);
  modal?.addEventListener("touchstart", closeUserModalOutside, {
    passive: true
  });
}

const AUTH_CACHE_EMAIL_KEY = "rw_cached_email";
function setHeaderAsProfileButton(loginBtn, email = "") {
  const safeEmail = email || "";
  loginBtn.innerHTML = '<span class="profile-avatar-icon" aria-hidden="true"></span>';
  loginBtn.classList.add("profile-btn");
  loginBtn.setAttribute("aria-label", "Open user profile");
  if (safeEmail) {
    loginBtn.title = safeEmail;
  }
}

function setHeaderAsLoginButton(loginBtn) {
  loginBtn.textContent = "Login";
  loginBtn.classList.remove("profile-btn");
  loginBtn.removeAttribute("title");
  loginBtn.onclick = null;
}

function syncPanelLogoutVisibility(isLoggedIn) {
  document.querySelectorAll('[data-page="logout"]').forEach(btn => {
    btn.style.display = isLoggedIn ? "" : "none";
  });
}

function isAdminUser(user = currentUser) {
  return Boolean(
    user?.email &&
    String(user.email).trim().toLowerCase() === ADMIN_EMAIL
  );
}

function syncAdminAccessUI() {
  const canAccess = isAdminUser();
  document.querySelectorAll('[data-page="quality"]').forEach(button => {
    button.hidden = !canAccess;
    button.classList.toggle("hidden", !canAccess);
    button.setAttribute("aria-hidden", String(!canAccess));
  });
}

/* =========================================================
   AUTH STATE

   Refreshes account data and guest/signed-in controls after changes.
========================================================= */

function handleAuthState() {
  const loginBtn = document.getElementById("loginBtn");
  const panelLoginBtn = document.getElementById("panelLoginBtn");
  if (!loginBtn) return;

  // Prevent profile button flicker after refresh by using cached state instantly.
  const cachedEmail = localStorage.getItem(AUTH_CACHE_EMAIL_KEY);
  if (cachedEmail) {
    setHeaderAsProfileButton(loginBtn, cachedEmail);
    if (panelLoginBtn) panelLoginBtn.textContent = "👤 Profile";
    syncPanelLogoutVisibility(true);
  } else {
    setHeaderAsLoginButton(loginBtn);
    if (panelLoginBtn) panelLoginBtn.textContent = "Login";
    syncPanelLogoutVisibility(false);
  }
  syncAdminAccessUI();

  listenAuth(async (user) => {
    const generation = ++accountViewGeneration;
    if (currentUser?.uid !== user?.uid) {
      const hadAccount = Boolean(currentUser);
      favoriteWordIds.clear();
      hydrateAccountLearningState({});
      userProfileCache.clear();
      const modal = document.getElementById("userInfoModal");
      modal?.classList.add("hidden");
      document.getElementById("userInfoContent")?.replaceChildren();
      // Clear the previous account's private view before another profile loads.
      // Routing as a guest keeps old account controls disabled during that wait.
      if (hadAccount) { currentUser = null; handleRouting(); }
    }
    currentUser = user || null;
    authStateResolved = true;
    syncAdminAccessUI();

    if (user) {
      // Apply logged-in UI immediately to avoid delayed access after refresh.
      localStorage.setItem(AUTH_CACHE_EMAIL_KEY, user.email || "");
      setHeaderAsProfileButton(loginBtn, user.email || "");
      loginBtn.onclick = async (e) => {
        e.stopPropagation();
        await openUserInfoPanel(user);
      };
      if (panelLoginBtn) {
        panelLoginBtn.textContent = "👤 Profile";
      }
      syncPanelLogoutVisibility(true);
      // Fast local hydrate so favorites/notes/lists work instantly after refresh.
      hydrateFavoritesFromLocal(user);
      hydrateLearningStateFromLocal(user);
      const params = new URLSearchParams(window.location.search);

      try {
        await ensureUserProfile(user);
        const cloudProfile = await getUserProfile(user);
        if (generation !== accountViewGeneration || currentUser?.uid !== user.uid) return;
        const profile = withPendingAccount(user.uid, cloudProfile || {});
        touchUserLastLogin(user).catch(() => {
          // Non-blocking analytics update.
        });
        userProfileCache.set(user.uid, profile || null);

        favoriteWordIds.clear();
        (profile?.favorites || []).forEach(id => {
          if (typeof id === "string" && id) favoriteWordIds.add(id);
        });
        hydrateAccountLearningState(profile || {});
        saveFavoritesToLocal(user);
        saveLearningStateToLocal(user);

        if (profile?.appSettings) {
          const mergedProfileSettings = {
            ...DEFAULT_APP_SETTINGS,
            ...profile.appSettings,
            cloudSync: profile.appSettings.cloudSync !== false
          };
          applyAppSettings(mergedProfileSettings, { persist: true });
        } else {
          // New/legacy profile without saved settings: keep cloud sync enabled for logged-in users.
          const nextSettings = {
            ...(currentAppSettings || getStoredSettings()),
            cloudSync: true
          };
          applyAppSettings(nextSettings, { persist: true });
        }
        const routeNeedsAccountRefresh =
          params.get("page") === "settings" ||
          params.get("page") === "favorites" ||
          Boolean(params.get("word")) ||
          Boolean(params.get("conjugation"));
        // Rebuild only when cloud data differs from local fallback for smoother UX.
        if (routeNeedsAccountRefresh || params.get("category")) {
          handleRouting();
        }
        await retryPendingAccount(user, generation);
      } catch (error) {
        if (generation === accountViewGeneration && currentUser?.uid === user.uid) showToast(accountSaveError(error, "Profile initialization"), "error");
      }
    } else {
      localStorage.removeItem(AUTH_CACHE_EMAIL_KEY);
      favoriteWordIds.clear();
      learnedWordIds.clear();
      customListWordIds.myVerbs.clear();
      customListWordIds.examPrep.clear();
      wordNotesMap = {};
      searchHistoryItems = [];
      reviewSchedule = {};
      progressStats = {
        wordsOpened: 0,
        daysActive: 0,
        streak: 0,
        lastActiveDate: ""
      };
      setHeaderAsLoginButton(loginBtn);
      if (panelLoginBtn) {
        panelLoginBtn.textContent = "Login";
      }
      syncPanelLogoutVisibility(false);
      const signedOutPage = new URLSearchParams(window.location.search).get("page");
      if (signedOutPage === "quality") {
        goHomeWithoutRefresh();
      } else if (["settings", "favorites", "conjugation-practice", "category-practice", "review"].includes(signedOutPage)
        || new URLSearchParams(location.search).has("word")) {
        handleRouting();
      }
    }
  });
}

window.addEventListener("online", () => { if (currentUser) retryPendingAccount(currentUser); });
window.addEventListener("account-storage-unavailable", () => {
  showToast("Browser storage is unavailable or full. Unsynchronized changes are held only on this page; keep it open and free storage before leaving.", "error");
});

/* =========================================================
   DARK MODE

   Changes the saved theme; applyAppSettings updates the page itself.
========================================================= */

function setupDarkMode() {
  const toggle = document.getElementById("darkToggle");
  toggle?.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
    applyAppSettings(
      {
        ...(currentAppSettings || getStoredSettings()),
        theme: nextTheme
      },
      { persist: true }
    );
    persistSettingsIfNeeded();
  });
}

/* =========================================================
   LOGO NAVIGATION (GO HOME WITHOUT RELOAD)
========================================================= */

function setupLogoNavigation() {

  const titleHome = document.getElementById("titleHome");
  if (!titleHome) return;

  titleHome.classList.add("clickable-title");

  // Refresh the page and return to home path only when title is clicked.
  titleHome.addEventListener("click", (e) => {
    e.stopPropagation();
    if (standalonePage) openMainSite();
    else window.location.href = window.location.pathname;
  });

}
/* =========================================================
   HOME SEARCH

   Handles exact matches, suggestions, duplicates, missing words,
   and keyboard navigation.
========================================================= */

function setupHomeSearch() {

  const input = document.getElementById("searchInput");
  const suggestionBox = document.getElementById("homeSuggestions");
  const messageBox = document.getElementById("searchMessage");

if (!input) return;

  messageBox?.addEventListener("click", (e) => {
    const submitBtn = e.target.closest(".submit-word-hint-btn");
    if (!submitBtn) return;
    const missingWord = submitBtn.getAttribute("data-missing-word") || "";
    setSingleRouteParam("page", "settings");
    renderSettingsPage();
    setTimeout(() => {
      const suggestionInput = document.getElementById("suggestionInput");
      if (!suggestionInput) return;
      if (!suggestionInput.value.trim() && missingWord) {
        suggestionInput.value = `${missingWord} - `;
      }
      suggestionInput.focus();
      const end = suggestionInput.value.length;
      suggestionInput.setSelectionRange(end, end);
    }, 0);
  });

  // Close suggestions when clicking/touching outside home search area.
  const closeHomeSuggestionsOutside = (e) => {
    if (input.contains(e.target) || suggestionBox.contains(e.target)) return;
    suggestionBox.classList.remove("active");
  };

  document.addEventListener("click", closeHomeSuggestionsOutside);
  document.addEventListener("touchstart", closeHomeSuggestionsOutside, { passive: true });

  // 🔎 Main search function
  function performSearch() {

    const query = input.value.trim();

    messageBox.textContent = ""; // Clear old message

    // ❌ If empty
    if (query === "") return;

    const words = getAllWords();

    const matches = findExactWordMatches(words, query);

    // ❌ Not found
    if (matches.length === 0) {
      if (isLikelyGermanWordQuery(query)) {
        addSearchHistoryItem(query);
        persistLearningStateIfLoggedIn();
        messageBox.innerHTML = buildMissingWordPromptHTML(query, "Not added yet.");
      } else {
        messageBox.textContent =
          "Not added yet. Please type a valid German word.";
      }
      return;
    }

    // ✅ If multiple matches
    if (matches.length > 1) {
      messageBox.innerHTML = buildDuplicateResultHTML(matches, words);
      return;
    }

    // ✅ If exactly 1 match → open detail

    const word = matches[0];

    setSingleRouteParam("word", word.word);
    addSearchHistoryItem(word.word);
    persistLearningStateIfLoggedIn();

    openedFromHomeSearch = true;
    openedFromCategory = false; // 🔥 Important
    openedFromFavorites = false;
    openWordDetail(word.id);

    // Hide hero manually
    const hero = document.getElementById("heroSection");
    if (hero) hero.style.display = "none";
  }

  // ⌨ ENTER key
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && selectedIndex < 0) {
      performSearch();
    }
  });

  // suggestions

  let selectedIndex = -1;

input.addEventListener("input", debounce(function () {

  const query = input.value.trim();
  messageBox.textContent = "";

  suggestionBox.innerHTML = "";
  selectedIndex = -1;

    if (!query) {
      suggestionBox.classList.remove("active");
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      return;
  }

  const words = getAllWords();
  const exactMatches = findExactWordMatches(words, query);

  if (exactMatches.length > 1) {
    messageBox.innerHTML = buildDuplicateResultHTML(exactMatches, words);
  }

  const normalizedQuery = query.toLocaleLowerCase("de");
  const matches = words
    .filter(word => String(word.word || "").toLocaleLowerCase("de").startsWith(normalizedQuery))
    .slice(0, 8);

  if (matches.length === 0) {
    suggestionBox.classList.remove("active");
    input.setAttribute("aria-expanded", "false");
    return;
  }

  matches.forEach((word, index) => {

    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.id = `home-suggestion-${index}`;
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", "false");

    const metadata = [word.category, word.level].filter(Boolean).map(escapeHtml).join(" · ");
    item.innerHTML = `<strong>${escapeHtml(word.word)}</strong>${metadata ? `<small>${metadata}</small>` : ""}`;

    item.addEventListener("click", function (e) {

  e.stopPropagation();   // 🚀 prevents click going to categories
  e.preventDefault();

  const duplicateMatches = findExactWordMatches(words, word.word);
  if (duplicateMatches.length > 1) {
    messageBox.innerHTML = buildDuplicateResultHTML(duplicateMatches, words);
    suggestionBox.classList.remove("active");
    return;
  }

  setSingleRouteParam("word", word.word);
  addSearchHistoryItem(word.word);
  persistLearningStateIfLoggedIn();

  openedFromHomeSearch = true;
  openedFromCategory = false;
  openedFromFavorites = false;

  openWordDetail(word.id);

  suggestionBox.classList.remove("active");
});

    suggestionBox.appendChild(item);
  });
  suggestionBox.classList.add("active");
  input.setAttribute("aria-expanded", "true");

}, 250));

input.addEventListener("focus", () => {
  if (suggestionBox.children.length > 0) {
    suggestionBox.classList.add("active");
  }
});

input.addEventListener("click", () => {
  if (suggestionBox.children.length > 0) {
    suggestionBox.classList.add("active");
  }
});

input.addEventListener("keydown", function (e) {

  const items = suggestionBox.querySelectorAll(".suggestion-item");

  if (!items.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex++;
    if (selectedIndex >= items.length) selectedIndex = 0;
    updateActive(items);
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex--;
    if (selectedIndex < 0) selectedIndex = items.length - 1;
    updateActive(items);
  }

  if (e.key === "Enter" && selectedIndex >= 0) {
    e.preventDefault();
    items[selectedIndex].click();
  }

  if (e.key === "Escape") {
    suggestionBox.classList.remove("active");
    input.setAttribute("aria-expanded", "false");
  }

});

function updateActive(items) {
  items.forEach(i => {
    i.classList.remove("active");
    i.setAttribute("aria-selected", "false");
  });
  items[selectedIndex].classList.add("active");
  items[selectedIndex].setAttribute("aria-selected", "true");
  input.setAttribute("aria-activedescendant", items[selectedIndex].id);
}

}

function updateFooterBrand(isSprachweltPage) {
  const footerBrand = document.getElementById("footerBrandName");
  if (!footerBrand) return;

  footerBrand.textContent = isSprachweltPage
    ? "Rafis Wörterbuch · Rafis Sprachwelt"
    : "Rafis Wörterbuch";
}

/* =========================================================
   DESKTOP/MOBILE PANEL LOGIC

   Keeps panels mutually exclusive and synchronizes accessibility
   labels, open state, outside clicks, and responsive header offset.
========================================================= */

const mobileBtn = document.getElementById("mobileMenuBtn");
const panel = document.getElementById("mobileSidePanel");
const desktopBtn = document.getElementById("desktopMenuBtn");
const desktopPanel = document.getElementById("desktopSidePanel");

function syncPanelButtonState() {
  const desktopOpen = desktopPanel?.classList.contains("active");
  const mobileOpen = panel?.classList.contains("active");

  desktopBtn?.classList.toggle("is-active", Boolean(desktopOpen));
  mobileBtn?.classList.toggle("is-active", Boolean(mobileOpen));
  desktopBtn?.setAttribute("aria-expanded", String(Boolean(desktopOpen)));
  mobileBtn?.setAttribute("aria-expanded", String(Boolean(mobileOpen)));
  desktopPanel?.setAttribute("aria-hidden", String(!desktopOpen));
  panel?.setAttribute("aria-hidden", String(!mobileOpen));
  desktopBtn?.setAttribute(
    "aria-label",
    desktopOpen ? "Close desktop menu" : "Open desktop menu"
  );
  mobileBtn?.setAttribute(
    "aria-label",
    mobileOpen ? "Close mobile menu" : "Open mobile menu"
  );
}

function updateHeaderOffset() {
  const header = document.querySelector(".header");
  const height = header?.getBoundingClientRect().height || 78;
  document.documentElement.style.setProperty("--header-offset", `${Math.ceil(height)}px`);
}

function closeAllPanels() {
  desktopPanel?.classList.remove("active");
  panel?.classList.remove("active");
  syncPanelButtonState();
}

function toggleDesktopPanel() {
  const shouldOpen = !desktopPanel?.classList.contains("active");
  panel?.classList.remove("active");
  desktopPanel?.classList.toggle("active", shouldOpen);
  syncPanelButtonState();
}

function toggleMobilePanel() {
  const shouldOpen = !panel?.classList.contains("active");
  desktopPanel?.classList.remove("active");
  panel?.classList.toggle("active", shouldOpen);
  syncPanelButtonState();
}

updateHeaderOffset();
syncPanelButtonState();

window.addEventListener("resize", updateHeaderOffset);

mobileBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  updateHeaderOffset();
  toggleMobilePanel();
});

desktopBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  updateHeaderOffset();
  toggleDesktopPanel();
});

async function handleSidePanelAction(page) {
  if (page === "option5" || page === "exam-zone") { openMainSite(page); return; }
  if (page === "owner") { openMainSite(page); return; }
  if (standalonePage && page && page !== "logout" && page !== "ausbildung") { openMainSite(page); return; }
  if (page === "ausbildung") {
    window.location.href = new URL("../ausbildung/", import.meta.url).href;
    return;
  }
  if (!page) return;

  if (page === "home") {
    goHomeWithoutRefresh();
    return;
  }

  if (page === "logout") {
    if (currentUser) {
      await logout();
      showToast("Logged out successfully 👋", "success");
    }
    goHomeWithoutRefresh();
    return;
  }

  if (page === "settings") {
    setSingleRouteParam("page", "settings");
    renderSettingsPage();
    return;
  }

  if (page === "favorites") {
    setSingleRouteParam("page", "favorites");
    renderFavoritesPage();
    return;
  }

  if (page === "review") {
    if (!currentUser) {
      promptLoginForRestrictedCategory("Login to review your saved words.");
      return;
    }
    setSingleRouteParam("page", "review");
    renderReviewPage();
    return;
  }

  if (page === "quality") {
    if (!isAdminUser()) {
      showToast("Administrator access is required.", "error");
      return;
    }
    setSingleRouteParam("page", "quality");
    renderDataQualityPage();
    return;
  }

  if (panelPageContent[page]) {
    setSingleRouteParam("page", page);
  }
  renderPanelPage(page);
}

desktopPanel?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const page = btn.dataset.page;
  closeAllPanels();
  await handleSidePanelAction(page);
});

panel?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const page = btn.dataset.page;
  closeAllPanels();
  await handleSidePanelAction(page);
});
const panelDark = document.getElementById("panelDarkToggle");
const panelLogin = document.getElementById("panelLoginBtn");

const mainDark = document.getElementById("darkToggle");
const mainLogin = document.getElementById("loginBtn");

panelDark?.addEventListener("click", () => {
  mainDark?.click();
});

panelLogin?.addEventListener("click", () => {
  if (currentUser) {
    openUserInfoPanel(currentUser);
  } else {
    mainLogin?.click();
  }
  closeAllPanels();
});

function closePanelsOnOutsideClick(e) {
  const target = e.target;

  if (
    desktopPanel?.classList.contains("active") &&
    !desktopPanel.contains(target) &&
    !desktopBtn?.contains(target)
  ) {
    desktopPanel.classList.remove("active");
    syncPanelButtonState();
  }

  if (
    panel?.classList.contains("active") &&
    !panel.contains(target) &&
    !mobileBtn?.contains(target)
  ) {
    panel.classList.remove("active");
    syncPanelButtonState();
  }
}

document.addEventListener("click", closePanelsOnOutsideClick);
document.addEventListener("touchstart", closePanelsOnOutsideClick, { passive: true });
window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");

  if (window.scrollY > 20) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

/* =========================================================
   APPLICATION INITIALIZATION

   Public entry point called by app.js after the DOM is ready. Data
   loads first, followed by the initial view and event listeners.
========================================================= */

export async function initUI() {
  if (standalonePage) {
    applyAppSettings(getStoredSettings(), { persist: false });
    setupDarkMode();
    setupAuthModal();
    setupUserInfoModal();
    handleAuthState();
    setupLogoNavigation();
    document.getElementById("logoHome")?.addEventListener("click", () => openMainSite());
    setupFooterNavigation();
    try { await loadWords(); } catch (error) { console.error("Unable to load SprachCoach vocabulary.", error); }
    return;
  }
  try {
    await loadWords();
  } catch (error) {
    console.error("Failed to load words/irregulars JSON.", error);
  }

  restoreGitHubFallbackRoute();
  generateCategories();
  showSection("homePage");
  updateWordCounter();
  reportDuplicateWords();

  applyAppSettings(getStoredSettings(), { persist: false });
  setupDarkMode();
  setupAuthModal();
  setupUserInfoModal();
  handleAuthState();
  handleRouting();
  setupLogoNavigation();
  setupHomeSearch();
  setupHomeSprachweltCta();
  setupFooterNavigation();

  window.addEventListener("popstate", handleRouting);
}

export function getRafiTutorContext() {
  if (rafiTutorContext.view === "word") {
    return { view: "word", word: { ...rafiTutorContext.word } };
  }
  return { ...rafiTutorContext };
}

function getTutorConjugationValue(base, path) {
  let node = base;
  for (const key of path) {
    if (!node || typeof node !== "object") return "";
    const actualKey = Object.keys(node).find(item => item.toLowerCase() === key.toLowerCase());
    node = actualKey ? node[actualKey] : undefined;
  }
  return typeof node === "string" && node !== "-" ? node.trim() : "";
}

function cleanTutorText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getRafiTutorWordDetails(wordId) {
  const word = getAllWords().find(item => item.id === wordId);
  if (!word) return null;

  const details = {
    id: word.id,
    word: word.word,
    category: word.category
  };
  if (word.article) details.article = word.article;
  if (word.plural) details.plural = word.plural;
  if (word.level) details.level = word.level;
  if (Array.isArray(word.englisch) && word.englisch.length) details.meaningEn = [...word.englisch];
  if (Array.isArray(word.bangla) && word.bangla.length) details.meaningBn = [...word.bangla];
  if (Array.isArray(word.examples) && word.examples.length) {
    details.examples = word.examples.map(cleanTutorText).filter(Boolean);
  }

  const category = String(word.category || "").toLowerCase();
  const type = String(word.type || "").toLowerCase();
  if (category === "nomen" || type === "noun") {
    details.isNoun = true;
  }
  if (category === "verben" || type === "verb") {
    details.isVerb = true;
    const people = [
      ["ich", "ich"], ["du", "du"], ["er_sie_es", "er/sie/es"],
      ["wir", "wir"], ["ihr", "ihr"], ["sie_formal", "Sie"]
    ];
    const collectTenseForms = mode => {
      const tense = getConjugationNode(
        getConjugationNode(word.conjugation, "indikativ"),
        mode
      );
      return people
        .map(([personKey, personLabel]) => {
          const value = getConjugationPersonValue(tense, personKey);
          if (!value || value === "-") return "";
          const escapedLabel = personLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return new RegExp(`^${escapedLabel}\\s+`, "i").test(value)
            ? value
            : `${personLabel} ${value}`;
        })
        .filter(Boolean);
    };
    const partizipII = getTutorConjugationValue(word.conjugation, ["partizip", "partizip_ii"]);
    const praeteritum = getTutorConjugationValue(word.conjugation, ["indikativ", "praeteritum", "ich"]);
    const perfekt = getTutorConjugationValue(word.conjugation, ["indikativ", "perfekt", "ich"]);
    const ichPresent = getTutorConjugationValue(word.conjugation, ["indikativ", "praesens", "ich"]);
    const erPresent = getTutorConjugationValue(word.conjugation, ["indikativ", "praesens", "er_sie_es"]);
    if (partizipII) details.partizipII = partizipII;
    if (praeteritum) details.praeteritum = praeteritum.replace(/^ich\s+/i, "");
    if (/^ich\s+habe\b/i.test(perfekt)) details.auxiliary = "haben";
    if (/^ich\s+bin\b/i.test(perfekt)) details.auxiliary = "sein";
    if (ichPresent) details.ichPresent = ichPresent.replace(/^ich\s+/i, "");
    if (erPresent) details.erPresent = erPresent.replace(/^(er|sie|es|er\/sie\/es)\s+/i, "");

    const praesensForms = collectTenseForms("praesens");
    const praeteritumForms = collectTenseForms("praeteritum");
    const perfektForms = collectTenseForms("perfekt");
    if (praesensForms.length) details.praesensForms = praesensForms;
    if (praeteritumForms.length) details.praeteritumForms = praeteritumForms;
    if (perfektForms.length) details.perfektForms = perfektForms;

    const meaning = cleanTutorText(word.meaning);
    const verbKind = meaning.match(/\b(nicht trennbares|untrennbares|trennbares)\b/i)?.[1];
    if (verbKind) details.separability = /nicht|untrennbar/i.test(verbKind) ? "inseparable" : "separable";
  }

  if (["adjektiven", "adverbien"].includes(category)) {
    const comparison = cleanTutorText(word.meaning).match(/([^.!?]*→[^.!?]*→[^.!?]*)/)?.[1]?.trim();
    if (comparison) details.comparison = comparison;
  }

  return details;
}

export function getRafiTutorArticleNouns() {
  return getAllWords()
    .filter(word =>
      String(word.category || "").toLowerCase() === "nomen" &&
      ["der", "die", "das"].includes(String(word.article || "").toLowerCase())
    )
    .map(word => {
      const noun = { id: word.id, word: word.word, article: word.article.toLowerCase() };
      if (word.level) noun.level = word.level;
      return noun;
    });
}

export function getRafiTutorVocabulary() {
  return getAllWords()
    .filter(word =>
      Array.isArray(word.englisch) && word.englisch.some(Boolean) &&
      Array.isArray(word.bangla) && word.bangla.some(Boolean)
    )
    .map(word => {
      const item = {
        id: word.id,
        word: word.word,
        category: word.category,
        meaningEn: word.englisch.map(cleanTutorText).filter(Boolean),
        meaningBn: word.bangla.map(cleanTutorText).filter(Boolean)
      };
      if (word.article) item.article = word.article;
      if (word.level) item.level = word.level;
      return item;
    });
}

export function getRafiTutorConjugationQuestions() {
  const people = [
    ["ich", "ich"], ["du", "du"], ["er_sie_es", "er/sie/es"],
    ["wir", "wir"], ["ihr", "ihr"], ["sie_formal", "Sie"]
  ];
  const modes = [["praesens", "Präsens"], ["perfekt", "Perfekt"], ["praeteritum", "Präteritum"]];
  const questions = [];
  getAllWords().forEach(word => {
    if (!isVerbWord(word) || !word.conjugation) return;
    modes.forEach(([mode, modeLabel]) => {
      const tense = getConjugationNode(getConjugationNode(word.conjugation, "indikativ"), mode);
      people.forEach(([personKey, personLabel]) => {
        const raw = getConjugationPersonValue(tense, personKey);
        if (!raw || raw === "-") return;
        const answer = raw.replace(new RegExp(`^${personLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "").trim();
        if (!answer || answer === "-") return;
        questions.push({ wordId: word.id, verb: word.word, mode, modeLabel, person: personLabel, answer });
      });
    });
  });
  return questions;
}

export async function markRafiTutorWordLearned(wordId) {
  const word = getAllWords().find(item => item.id === wordId);
  if (!word) return { ok: false, message: "Word not found." };
  if (!currentUser) {
    showToast("Login to track learned words.", "error");
    return { ok: false, message: "Login is required to mark words as learned." };
  }
  learnedWordIds.add(wordId);
  await persistLearningStateIfLoggedIn();
  showToast("Marked as learned ✅", "success");
  return { ok: true, message: "Marked as learned." };
}

export function openNextRafiTutorWord(wordId) {
  const words = getAllWords();
  const currentIndex = words.findIndex(item => item.id === wordId);
  if (currentIndex < 0 || words.length < 2) return null;
  for (let offset = 1; offset < words.length; offset += 1) {
    const candidate = words[(currentIndex + offset) % words.length];
    if (candidate.category === words[currentIndex].category && candidate.id !== wordId) {
      setSingleRouteParam("word", candidate.word);
      openWordDetail(candidate.id);
      return candidate.id;
    }
  }
  return null;
}

export function recordRafiTutorReviewResult(wordId, correct) {
  if (!currentUser || !getAllWords().some(item => item.id === wordId)) return false;
  scheduleReview(wordId, correct ? "good" : "again");
  return true;
}

export function openExistingRafiReview() {
  if (standalonePage) { openMainSite("review"); return true; }
  if (!currentUser) {
    promptLoginForRestrictedCategory("Login to review your saved words.");
    return false;
  }
  setSingleRouteParam("page", "review");
  renderReviewPage();
  return true;
}

initLearningSync();
initAccessibility();
