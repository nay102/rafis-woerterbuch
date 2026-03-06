/* =========================================================
   ui.js - CLEAN PROFESSIONAL VERSION
========================================================= */

import { getAllWords, loadWords } from "./words.js";
import {
  signup,
  login,
  listenAuth,
  logout,
  ensureUserProfile,
  touchUserLastLogin,
  getUserProfile,
  changePasswordWithConfirmation,
  deleteAccountWithPassword,
  saveUserAppSettings,
  saveUserFavorites,
  saveUserProfilePatch,
  saveUserWordNote,
  submitWordSuggestion,
  submitWordReport
} from "./auth.js";

/* =========================================================
   GLOBAL STATE
========================================================= */

let currentCategory = null;
let activeSectionMemory = {};
let currentView = "home";
let openedFromHomeSearch = false;
let openedFromCategory = false;
let detachCategorySearchOutsideClose = null;
let currentUser = null;
const userProfileCache = new Map();
let currentAppSettings = null;
const favoriteWordIds = new Set();
const learnedWordIds = new Set();
const customListWordIds = {
  myVerbs: new Set(),
  examPrep: new Set()
};
let wordNotesMap = {};
let searchHistoryItems = [];
let progressStats = {
  wordsOpened: 0,
  daysActive: 0,
  streak: 0,
  lastActiveDate: ""
};
let lastContext = {
  category: "",
  section: null
};
let openedFromFavorites = false;

const APP_SETTINGS_KEY = "rw_app_settings_v1";
const LOCAL_FAVORITES_KEY_PREFIX = "rw_local_favorites_v1_";
const LOCAL_LEARNING_KEY_PREFIX = "rw_local_learning_v1_";
const DEFAULT_APP_SETTINGS = Object.freeze({
  theme: "system",
  textSize: "normal",
  reducedMotion: false,
  cloudSync: true
});
const MAX_SEARCH_HISTORY = 40;

/* =========================================================
   URL ROUTING HELPERS (GitHub Pages Safe)
========================================================= */

function getBasePath() {
  const { hostname, pathname } = window.location;

  // GitHub Pages project site: /<repo>/
  if (hostname.endsWith("github.io")) {
    const parts = pathname.split("/").filter(Boolean);
    return parts.length ? `/${parts[0]}/` : "/";
  }

  // Local/custom host root
  return "/";
}

function buildRouteUrl(params) {
  const base = getBasePath();
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

function setSingleRouteParam(key, value) {
  const params = new URLSearchParams();
  params.set(key, value);
  history.pushState(null, "", buildRouteUrl(params));
}

function setHomeRoute() {
  history.pushState(null, "", buildRouteUrl(new URLSearchParams()));
}

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

function getStoredSettings() {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_APP_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_APP_SETTINGS, ...(parsed || {}) };
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

function saveStoredSettings(settings) {
  localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
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

  body.classList.remove("text-compact", "text-large");
  if (currentAppSettings.textSize === "compact") body.classList.add("text-compact");
  if (currentAppSettings.textSize === "large") body.classList.add("text-large");

  body.classList.toggle("reduce-motion", Boolean(currentAppSettings.reducedMotion));

  if (persist) saveStoredSettings(currentAppSettings);
}

async function persistSettingsIfNeeded() {
  if (!currentUser || !currentAppSettings?.cloudSync) return;
  try {
    await saveUserAppSettings(currentUser, currentAppSettings);
  } catch {
    // Keep local settings active even if cloud sync fails.
  }
}

function getFavoriteWords() {
  const allWords = getAllWords();
  return allWords.filter(w => favoriteWordIds.has(w.id));
}

async function persistFavoritesIfLoggedIn() {
  saveFavoritesToLocal();
  if (!currentUser || !currentAppSettings?.cloudSync) return;
  try {
    await saveUserFavorites(currentUser, Array.from(favoriteWordIds));
  } catch {
    showToast("Could not sync favorites to cloud.", "error");
  }
}

/* =========================================================
   ACCOUNT-BOUND LEARNING STATE HELPERS
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
  if (!currentUser || !currentAppSettings?.cloudSync) return;
  try {
    await saveUserProfilePatch(currentUser, {
      learnedWords: Array.from(learnedWordIds),
      customLists: {
        myVerbs: Array.from(customListWordIds.myVerbs),
        examPrep: Array.from(customListWordIds.examPrep)
      },
      searchHistory: searchHistoryItems,
      progressStats,
      lastContext
    });
  } catch {
    // Silent failure; local state remains.
  }
}

async function persistSingleNoteIfLoggedIn(wordId, text) {
  saveLearningStateToLocal();
  if (!currentUser || !currentAppSettings?.cloudSync) return;
  try {
    await saveUserWordNote(currentUser, wordId, text);
  } catch {
    showToast("Could not save note to cloud.", "error");
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

function getWordSerial(word, sourceWords) {
  const index = sourceWords.findIndex(w => w.id === word.id);
  return index >= 0 ? index + 1 : "-";
}

function buildDuplicateResultHTML(matches, sourceWords) {
  const items = matches.map((w, idx) => {
    const serial = getWordSerial(w, sourceWords);
    return `${idx + 1}. #${serial} - ${w.word}`;
  });

  return `Found ${matches.length} times:<br>${items.join("<br>")}`;
}

function findExactWordMatches(sourceWords, wordText) {
  return sourceWords.filter(
    w => w.word.toLowerCase() === wordText.toLowerCase()
  );
}

function isLikelyGermanWordQuery(queryText) {
  const clean = String(queryText || "").trim().toLowerCase();
  if (!clean) return false;
  // Letters, spaces and hyphen only (includes German umlauts/Eszett).
  if (!/^[a-zäöüß\s-]+$/i.test(clean)) return false;
  const compact = clean.replace(/[\s-]/g, "");
  if (compact.length < 3 || compact.length > 32) return false;
  // Block only full repeated-letter noise: aaa, bbbb, etc.
  if (/^(.)\1+$/.test(compact)) return false;

  return true;
}

function buildMissingWordPromptHTML(queryText, notFoundText = "Not added yet.") {
  const escapedWord = escapeHtml(String(queryText || "").trim());
  return `
    ${escapeHtml(notFoundText)}<br>
    <button type="button" class="submit-word-hint-btn" data-missing-word="${escapedWord}">
      Please Submit this word in Settings
    </button>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMeaningText(word) {
  const meaningText =
    typeof word?.meaning === "string" && word.meaning.trim()
      ? word.meaning
      : "No meaning added.";
  const escapedMeaning = escapeHtml(meaningText);
  const isVerb =
    String(word?.category || "").toLowerCase() === "verben" ||
    String(word?.type || "").toLowerCase() === "verb";

  if (!isVerb) return escapedMeaning;

  // Auto-bold grammar summary + conjugation line for verb entries.
  return escapedMeaning.replace(
    /(Es ist ein [^\n]*?Verb:\n[^\n]+)/gi,
    "<strong>$1</strong>"
  );
}

function shouldShowSynonym(word) {
  const category = String(word?.category || "").toLowerCase();
  return (
    category === "verben" ||
    category === "adjektiven" ||
    category === "adverbien"
  );
}

function getSynonymText(word) {
  if (Array.isArray(word?.synonym) && word.synonym.length) {
    return escapeHtml(word.synonym.join(", "));
  }

  if (typeof word?.synonym === "string" && word.synonym.trim()) {
    return escapeHtml(word.synonym.trim());
  }

  return "Kein deutsches Synonym gefunden.";
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

/* =========================================================
   SIDE PANEL CONTENT DATA
========================================================= */

const panelPageContent = {
  owner: {
    title: "👑 Owner",
    image: "https://picsum.photos/seed/owner/1200/500",
    description:
      "This section introduces the creator and mission behind Rafi's Wörterbuch.",
    cards: [
      "Personal language-learning journey and why this platform was built.",
      "Goals: practical German for real life, study, and migration.",
      "Future roadmap and community contribution plans."
    ]
  },
  ausbildung: {
    title: "📚 Ausbildung",
    image: "https://picsum.photos/seed/ausbildung/1200/500",
    description:
      "Guidance for Ausbildung paths, German requirements, and practical preparation.",
    cards: [
      "Required German level and interview vocabulary.",
      "Common Ausbildung domains and starter phrases.",
      "Preparation checklist for documents and communication."
    ]
  },
  about: {
    title: "🇩🇪 Germany",
    image: "https://picsum.photos/seed/germany/1200/500",
    description:
      "Useful orientation notes about life, culture, and practical language in Germany.",
    cards: [
      "Daily conversation language patterns and polite forms.",
      "Bureaucracy-related terms for official appointments.",
      "Integration tips and common social communication styles."
    ]
  },
  option4: {
    title: "🧠 Practice Lab",
    image: "https://picsum.photos/seed/option4/1200/500",
    description: "Focused drills and revision practice for faster vocabulary retention.",
    cards: [
      "Topic-based quick practice sets for daily training.",
      "Short grammar and vocabulary drills with real context.",
      "Designed for frequent updates without changing page flow."
    ]
  },
  option5: {
    title: "📝 Exam Zone",
    image: "https://picsum.photos/seed/option5/1200/500",
    description: "Exam-oriented preparation area for structured learning sessions.",
    cards: [
      "Mock tasks and targeted exam vocabulary review.",
      "Pattern-based sentence practice for written and oral tests.",
      "Smart section for pre-exam confidence building."
    ]
  },
  option6: {
    title: "🚀 Pro Tools",
    image: "https://picsum.photos/seed/option6/1200/500",
    description: "Advanced learning toolkit for power users and serious revision.",
    cards: [
      "Scenario-driven learning blocks for applied German.",
      "High-value word packs grouped by practical situations.",
      "Built for deep practice and higher consistency."
    ]
  },
  settings: {
    title: "⚙ Settings",
    image: "https://picsum.photos/seed/settings/1200/500",
    description: "Personalization and preference controls for your learning experience.",
    cards: [
      "Theme preference and display tuning options.",
      "Search behavior and accessibility-oriented controls.",
      "Account-linked personalization placeholders."
    ]
  }
};

/* =========================================================
   INIT
========================================================= */

export async function initUI() {

  await loadWords();
  restoreGitHubFallbackRoute();

  generateCategories();

  // 🔥 Show Home + Hero on first load
  showSection("homePage");

  // Update word counter
  updateWordCounter();

  applyAppSettings(getStoredSettings(), { persist: false });
  setupDarkMode();
  setupAuthModal();
  setupUserInfoModal();
  handleAuthState();
  handleRouting();
  setupLogoNavigation();
  setupHomeSearch();

  window.addEventListener("popstate", handleRouting);
}
/* =========================================================
   WORD COUNTER (HERO)
========================================================= */

function updateWordCounter() {

  const counter = document.getElementById("wordCount");

  if (!counter) return;

  const words = getAllWords();

  counter.textContent = `Total Words: ${words.length}`;

}

/* =========================================================
   CATEGORY LIST
========================================================= */

const categories = [
  "Verben",
  "Adjektiven",
  "Adverbien",
  "Nomen",
  "Nomen-Verb Verbindung",
  "Redewendungen",
  "Schimpfwörter / Slang",
  "Best YT Kanäle",
  "Filme & Serien",
  "Adverbiale Wendung"
];

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
      openCategoryPage(cat);
    });

    nav.appendChild(btn);
  });
}

/* =========================================================
   ROUTING
========================================================= */

function handleRouting() {

  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const wordName = params.get("word");
  const page = params.get("page");

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

  if (page && panelPageContent[page] && page !== "settings") {
    renderPanelPage(page);
    return;
  }

  if (page === "settings") {
    renderSettingsPage();
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
   SECTION SWITCH (SMOOTH)
========================================================= */

function showSection(id) {

  const sections = ["homePage", "categoryPage", "wordDetailPage"];

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

  active.style.display = "block";
  setTimeout(() => active.classList.add("active"), 10);

  // ✅ If Home Page → Show Hero
  if (id === "homePage") {
    if (hero) hero.style.display = "block";
  }
}

/* =========================================================
   OPEN CATEGORY
========================================================= */

function openCategoryPage(categoryName) {

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
  categoryPage.appendChild(topBar);

/* =========================================================
   CATEGORY SEARCH (PRO VERSION)
========================================================= */
/* ================= CATEGORY SEARCH WRAPPER ================= */

const searchWrapper = document.createElement("div");
searchWrapper.style.position = "relative";
searchWrapper.style.maxWidth = "750px";
searchWrapper.style.margin = "30px auto";

const searchInput = document.createElement("input");
searchInput.placeholder = "Search inside this category...";
searchInput.className = "category-search";

const suggestionBox = document.createElement("div");
suggestionBox.className = "suggestions-box";
const categorySearchMessage = document.createElement("div");
categorySearchMessage.className = "search-message";
categorySearchMessage.style.marginTop = "10px";
categorySearchMessage.style.textAlign = "left";
categorySearchMessage.style.fontSize = "14px";

searchWrapper.appendChild(searchInput);
searchWrapper.appendChild(suggestionBox);
searchWrapper.appendChild(categorySearchMessage);

categoryPage.appendChild(searchWrapper);

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
   CATEGORY SEARCH → OPEN WORD DIRECTLY (NO LIST)
========================================================= */

  /* ================= GET CATEGORY WORDS ================= */

  const words = getAllWords().filter(
    w => (w.category || "").trim() === categoryName.trim()
  );
  /* =========================================================
   CATEGORY SUGGESTIONS (PRO VERSION)
========================================================= */

let selectedIndex = -1;

searchInput.addEventListener("input", debounce(function () {

  const query = searchInput.value.trim().toLowerCase();
  categorySearchMessage.textContent = "";

  suggestionBox.innerHTML = "";
  selectedIndex = -1;

  if (!query) {
    suggestionBox.classList.remove("active");
    return;
  }

  if (/\d/.test(query)) {
    categorySearchMessage.textContent = "Numbers are not allowed. Type a word.";
    suggestionBox.classList.remove("active");
    return;
  }

  const exactMatches = words.filter(
    w => w.word.toLowerCase() === query
  );

  if (exactMatches.length > 1) {
    categorySearchMessage.innerHTML = buildDuplicateResultHTML(exactMatches, words);
  }

  const matches = words
    .filter(w => w.word.toLowerCase().startsWith(query))
    .slice(0, 4);

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

  matches.forEach(word => {

    const item = document.createElement("div");
    item.className = "suggestion-item";

    // Highlight typed letters
    const regex = new RegExp(`^(${query})`, "i");
    item.innerHTML = word.word.replace(regex, "<mark>$1</mark>");

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
  items.forEach(i => i.classList.remove("active"));
  items[selectedIndex].classList.add("active");
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
  "Nomen"
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
    button.textContent = `Section ${sectionIndex + 1} (${start}–${end})`;

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

    if (savedSection !== undefined && savedSection === sectionIndex) {
  activeSectionIndex = sectionIndex;
  renderSection(sectionIndex);
}

    sectionContainer.appendChild(button);
  }

}

/* =========================================================
   WORD DETAIL (CLEAN VERSION)
========================================================= */

function openWordDetail(wordId) {

  const allWords = getAllWords();

  console.log("DEBUG: Word ID Requested →", wordId);
  console.log("DEBUG: Available Words →", allWords);

  const word = allWords.find(w => w.id === wordId);

  if (!word) {

    console.error("❌ Word NOT FOUND in database!");

    const detailPage = document.getElementById("wordDetailPage");
    detailPage.innerHTML = "<h2>Word not found ❌</h2>";

    return;
  }

  showSection("wordDetailPage");

  const detailPage = document.getElementById("wordDetailPage");
  detailPage.innerHTML = "";

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
  } else if (openedFromCategory && !openedFromHomeSearch) {

  backBtn.textContent = "← Back to Category";

  backBtn.onclick = () => {

    setSingleRouteParam("category", currentCategory);

    openCategoryPage(currentCategory);

  };

} else {

  backBtn.textContent = "🏠 Home";

  backBtn.onclick = () => {

    setHomeRoute();
    showSection("homePage");

  };

}

  topBar.appendChild(backBtn);

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

  topBar.appendChild(favoriteBtn);

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
  topBar.appendChild(learnedBtn);

  detailPage.appendChild(topBar);

  /* ================= WORD CARD ================= */

  const card = document.createElement("div");
  card.className = "detail-card";

  card.innerHTML = `
  <h1 class="detail-title">
    ${word.article ? word.article + " " : ""}${word.word}
  </h1>

  <div class="detail-section">
    <h3>Meaning</h3>
    <p>${formatMeaningText(word)}</p>
  </div>

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
    <h3>Examples</h3>
    <p>${word.examples?.join("<br><br>") || "-"}</p>
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
    await persistSingleNoteIfLoggedIn(word.id, noteText);
    showToast("Note saved.", "success");
  });

  clearNoteBtn?.addEventListener("click", async () => {
    if (noteInput) noteInput.value = "";
    delete wordNotesMap[word.id];
    await persistSingleNoteIfLoggedIn(word.id, "");
    showToast("Note removed.", "success");
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
    const reason = window.prompt(
      "Report issue for this word (meaning/synonym issue):"
    );
    if (!reason || !reason.trim()) return;
    try {
      await submitWordReport(currentUser, {
        wordId: word.id,
        word: word.word,
        reason: reason.trim()
      });
      showToast("Report submitted. Thanks!", "success");
    } catch (error) {
      showToast(error?.message || "Could not submit report.", "error");
    }
  });

}

/* =========================================================
   SHARED PAGE/PANEL HELPERS
========================================================= */

function goHomeWithoutRefresh() {
  openedFromFavorites = false;
  openedFromCategory = false;
  openedFromHomeSearch = false;
  setHomeRoute();
  currentView = "home";
  showSection("homePage");
}

function renderPanelPage(pageKey) {
  const page = panelPageContent[pageKey];
  const desktopPage = document.getElementById("desktopPage");
  if (!desktopPage || !page) return;

  currentView = "custom";

  ["homePage", "categoryPage", "wordDetailPage"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const hero = document.getElementById("heroSection");
  if (hero) hero.style.display = "none";

  desktopPage.style.display = "block";
  desktopPage.innerHTML = `
    <div class="panel-page-wrap">
      <div class="panel-hero-image" style="background-image:url('${page.image}')"></div>
      <div class="panel-page-content">
        <h1>${page.title}</h1>
        <p class="panel-page-description">${page.description}</p>
        <div class="panel-page-cards">
          ${page.cards.map((card, idx) => `<article class="panel-page-card"><h3>Section ${idx + 1}</h3><p>${card}</p></article>`).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderFavoritesPage() {
  const desktopPage = document.getElementById("desktopPage");
  if (!desktopPage) return;

  currentView = "custom";
  ["homePage", "categoryPage", "wordDetailPage"].forEach(id => {
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
  ["homePage", "categoryPage", "wordDetailPage"].forEach(id => {
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

  saveBtn?.addEventListener("click", async () => {
    const next = {
      ...(currentAppSettings || DEFAULT_APP_SETTINGS),
      theme: themeSelect?.value || "system",
      textSize: textSizeSelect?.value || "normal",
      reducedMotion: Boolean(motionToggle?.checked),
      cloudSync: currentUser ? Boolean(cloudToggle?.checked) : false
    };
    applyAppSettings(next, { persist: true });
    await persistSettingsIfNeeded();
    showToast("Settings saved successfully ✨", "success");
  });

  resetBtn?.addEventListener("click", async () => {
    const next = { ...DEFAULT_APP_SETTINGS, cloudSync: Boolean(currentUser) };
    applyAppSettings(next, { persist: true });
    await persistSettingsIfNeeded();
    renderSettingsPage();
    showToast("Settings reset to default.", "success");
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
    const text = suggestionInput?.value.trim() || "";
    if (!text) {
      showToast("Write a suggestion first.", "error");
      return;
    }
    try {
      await submitWordSuggestion(currentUser, { word: "General", message: text });
      suggestionInput.value = "";
      showToast("Suggestion sent. Thank you!", "success");
    } catch (error) {
      showToast(error?.message || "Could not send suggestion.", "error");
    }
  });

  sendGenericReportBtn?.addEventListener("click", async () => {
    const text = reportInput?.value.trim() || "";
    if (!text) {
      showToast("Write a report first.", "error");
      return;
    }
    try {
      await submitWordReport(currentUser, {
        wordId: "general",
        word: "general",
        reason: text
      });
      reportInput.value = "";
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
  const modal = document.getElementById("userInfoModal");
  const content = document.getElementById("userInfoContent");
  if (!modal || !content || !user) return;

  // Show modal immediately for responsive UX, then hydrate profile details.
  modal.classList.remove("hidden");

  const renderProfileContent = (profileData) => {
    const displayName =
      profileData?.displayName || (user.email ? user.email.split("@")[0] : "User");
    const storedPassword = profileData?.plainPassword || "";

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
    <div class="user-info-row password-row">
      <strong>Password:</strong>
      <div class="password-preview-wrap">
        <input id="passwordPreviewField" type="password" value="" readonly />
        <button id="togglePasswordPreview" type="button">👁 Show</button>
      </div>
      <small>Stored for this demo profile panel only.</small>
    </div>
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

  const toggleBtn = document.getElementById("togglePasswordPreview");
  const passwordField = document.getElementById("passwordPreviewField");
  if (passwordField) {
    passwordField.value = storedPassword || "Not available";
  }
  toggleBtn?.addEventListener("click", () => {
    if (!passwordField) return;
    if (!storedPassword) {
      showToast("Password not available yet. Re-login once.", "error");
      return;
    }
    const isHidden = passwordField.type === "password";
    passwordField.type = isHidden ? "text" : "password";
    toggleBtn.textContent = isHidden ? "🙈 Hide" : "👁 Show";
  });

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
      userProfileCache.set(user.uid, {
        ...(profileData || {}),
        plainPassword: newPassword
      });
      renderProfileContent({
        ...(profileData || {}),
        plainPassword: newPassword
      });
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
    userProfileCache.set(user.uid, profile || null);
    renderProfileContent(profile || null);
  } catch {
    // Keep currently rendered content if profile fetch fails.
  }
}

/* =========================================================
   AUTH MODAL
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
  const authSubmitBtn = document.getElementById("authSubmitBtn");
  const switchText = document.getElementById("switchText");
  const switchBtn = document.getElementById("switchModeBtn");

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

  /* ================= FORM SUBMIT ================= */
  form?.addEventListener("submit", async (e) => {

    e.preventDefault();

    errorBox.textContent = "";

    try {

      if (isLoginMode) {

        await login(emailInput.value, passwordInput.value);
        modal.classList.add("hidden");
        form.reset();
        showToast("Welcome back! You are logged in 🎉", "success");

      } else {

        await signup(emailInput.value, passwordInput.value);
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

    }

  });

  /* ================= SWITCH UI TEXT ================= */
  function setAuthMode(loginMode) {

    isLoginMode = loginMode;

    if (loginMode) {

      authTitle.textContent = "Login";
      authSubmitBtn.textContent = "Login";

      switchText.textContent = "Don't have an account?";
      switchBtn.textContent = "Sign Up";

    } else {

      authTitle.textContent = "Sign Up";
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

/* =========================================================
   AUTH STATE
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
  } else {
    setHeaderAsLoginButton(loginBtn);
    if (panelLoginBtn) panelLoginBtn.textContent = "Login";
  }

  listenAuth(async (user) => {
    currentUser = user || null;

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
      // Fast local hydrate so favorites/notes/lists work instantly after refresh.
      hydrateFavoritesFromLocal(user);
      hydrateLearningStateFromLocal(user);
      const preCloudSignature = buildAccountDataSignature();
      const params = new URLSearchParams(window.location.search);
      if (params.get("word") || params.get("category") || params.get("page")) {
        handleRouting();
      }

      try {
        await ensureUserProfile(user);
        const profile = await getUserProfile(user);
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
            cloudSync: true
          };
          applyAppSettings(mergedProfileSettings, { persist: true });
          persistSettingsIfNeeded();
        } else {
          // New/legacy profile without saved settings: keep cloud sync enabled for logged-in users.
          const nextSettings = {
            ...(currentAppSettings || getStoredSettings()),
            cloudSync: true
          };
          applyAppSettings(nextSettings, { persist: true });
          persistSettingsIfNeeded();
        }
        const postCloudSignature = buildAccountDataSignature();
        const routeNeedsAccountRefresh =
          params.get("page") === "settings" ||
          params.get("page") === "favorites" ||
          Boolean(params.get("word"));
        // Rebuild only when cloud data differs from local fallback for smoother UX.
        if (routeNeedsAccountRefresh && postCloudSignature !== preCloudSignature) {
          handleRouting();
        }
      } catch {
        // Keep auth flow working even if profile storage fails.
      }
    } else {
      localStorage.removeItem(AUTH_CACHE_EMAIL_KEY);
      favoriteWordIds.clear();
      learnedWordIds.clear();
      customListWordIds.myVerbs.clear();
      customListWordIds.examPrep.clear();
      wordNotesMap = {};
      searchHistoryItems = [];
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
    }
  });
}

/* =========================================================
   DARK MODE
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
    window.location.href = window.location.pathname;
  });

}
/* =========================================================
   HOME SEARCH (CONTROLLED VERSION)
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

    // ❌ If contains number
    if (/\d/.test(query)) {
      messageBox.textContent = "Numbers are not allowed, type a word";
      return;
    }

    const words = getAllWords();

    // Find exact matches
    const matches = words.filter(
      w => w.word.toLowerCase() === query.toLowerCase()
    );

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
    if (e.key === "Enter") {
      performSearch();
    }
  });

  // suggestions

  let selectedIndex = -1;

input.addEventListener("input", debounce(function () {

  const query = input.value.trim().toLowerCase();
  messageBox.textContent = "";

  suggestionBox.innerHTML = "";
  selectedIndex = -1;

  if (!query) {
    suggestionBox.classList.remove("active");
    return;
  }

  if (/\d/.test(query)) {
    messageBox.textContent = "Numbers are not allowed, type a word";
    suggestionBox.classList.remove("active");
    return;
  }

  const words = getAllWords();
  const exactMatches = words.filter(w => w.word.toLowerCase() === query);

  if (exactMatches.length > 1) {
    messageBox.innerHTML = buildDuplicateResultHTML(exactMatches, words);
  }

  const matches = words
    .filter(w => w.word.toLowerCase().startsWith(query))
    .slice(0, 4);

  if (matches.length === 0) {
    suggestionBox.classList.remove("active");
    return;
  }

  matches.forEach((word, index) => {

    const item = document.createElement("div");
    item.className = "suggestion-item";

    // Highlight typed letters
    const regex = new RegExp(`^(${query})`, "i");
    item.innerHTML = word.word.replace(regex, "<mark>$1</mark>");

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
  }

});

function updateActive(items) {
  items.forEach(i => i.classList.remove("active"));
  items[selectedIndex].classList.add("active");
}

}
// panel buttons
const mobileBtn = document.getElementById("mobileMenuBtn");
const panel = document.getElementById("mobileSidePanel");
const closePanel = document.getElementById("closePanel");

mobileBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  panel?.classList.add("active");
});

closePanel?.addEventListener("click", () => {
  panel?.classList.remove("active");
});
/* =========================================================
   DESKTOP/MOBILE PANEL LOGIC
========================================================= */

const desktopBtn = document.getElementById("desktopMenuBtn");
const desktopPanel = document.getElementById("desktopSidePanel");
const desktopClose = document.getElementById("desktopClosePanel");

desktopBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  desktopPanel?.classList.toggle("active");
});

desktopClose?.addEventListener("click", () => {
  desktopPanel?.classList.remove("active");
});

function closeAllPanels() {
  desktopPanel?.classList.remove("active");
  panel?.classList.remove("active");
}

async function handleSidePanelAction(page) {
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
  }

  if (
    panel?.classList.contains("active") &&
    !panel.contains(target) &&
    !mobileBtn?.contains(target)
  ) {
    panel.classList.remove("active");
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
