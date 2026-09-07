import { EXAM_PROVIDERS, EXAM_LEVELS, EXAM_CATEGORIES, EXAM_MATERIALS, filterMaterials } from "./exam-zone-data.js";

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function mountExamLibrary(root, { subscribe, download, materials = EXAM_MATERIALS, openLogin }) {
  let user = null;
  let generation = 0;
  let resolved = false;
  let unsubscribe;
  const state = { provider: "goethe", level: "A1", category: "all", query: "" };
  const objectUrls = new Set();
  const revokeDownloads = () => { objectUrls.forEach(url => URL.revokeObjectURL(url)); objectUrls.clear(); };

  function showGate(message = "Log in to explore your exam library.", retry = false) {
    root.innerHTML = `<section class="exam-gate" aria-labelledby="examGateTitle">
      <div class="exam-gate-icon" aria-hidden="true"><i class="fa-solid fa-lock"></i></div>
      <span class="exam-eyebrow">YOUR NEXT CHAPTER</span>
      <h1 id="examGateTitle">Your exam preparation.<br><span>All in one place.</span></h1>
      <p>Goethe &amp; telc · A1 to C1</p>
      <p class="exam-gate-message" role="status">${escapeHtml(message)}</p>
      <button class="exam-primary" type="button" data-exam-action="${retry ? "retry" : "login"}">${retry ? "Try again" : "Log in to Exam Zone"}<span aria-hidden="true"> ↗</span></button>
      <p class="exam-gate-note">New here? Choose Sign Up in the login window to create your account.</p>
      <a class="exam-home" href="../">Back to the dictionary</a>
    </section>`;
  }

  function showLibrary() {
    root.innerHTML = `<section class="exam-hero" aria-labelledby="examTitle">
      <div><span class="exam-eyebrow">THE EXAM PREPARATION LIBRARY</span><h1 id="examTitle">Prepare with purpose.</h1>
      <p>Your Goethe and telc study materials, organised from A1 to C1. Choose your exam, find your level, and build your next study session.</p>
      <div class="exam-hero-tags"><span><i class="fa-solid fa-lock" aria-hidden="true"></i> Members’ library</span><span>5 levels</span><span>2 exam providers</span></div></div>
      <div class="exam-hero-art" aria-hidden="true"><span>A1 → C1</span><i class="fa-solid fa-book-open"></i><small>LEARN · PRACTISE · PROGRESS</small></div>
    </section>
    <section class="exam-library" aria-label="Exam materials">
      <div class="exam-provider-row"><div><span class="exam-step">01 / EXAM PROVIDER</span><h2>Choose your exam</h2></div>
      <div class="exam-provider-buttons" role="group" aria-label="Exam provider">${EXAM_PROVIDERS.map(provider => `<button type="button" data-provider="${provider.id}" aria-pressed="${provider.id === state.provider}"><strong>${provider.name}</strong><span>${provider.description}</span></button>`).join("")}</div></div>
      <div class="exam-level-row"><span class="exam-step">02 / YOUR LEVEL</span><div class="exam-levels" role="group" aria-label="Language level">${EXAM_LEVELS.map(level => `<button type="button" data-level="${level}" aria-pressed="${level === state.level}">${level}</button>`).join("")}</div></div>
      <div class="exam-filters"><label class="exam-search"><span>Search this collection</span><input id="examSearch" type="search" placeholder="Search titles, topics or editions" value="${escapeHtml(state.query)}" maxlength="150"></label>
      <label class="exam-category-filter"><span>Material type</span><select id="examCategory"><option value="all">All materials</option>${EXAM_CATEGORIES.map(category => `<option value="${category.id}" ${state.category === category.id ? "selected" : ""}>${category.title}</option>`).join("")}</select></label></div>
      <div class="exam-results-heading"><h2 id="examCollectionTitle"></h2><p id="examResultCount" role="status" aria-live="polite" aria-atomic="true"></p></div>
      <p id="examDownloadStatus" class="exam-download-status" role="status" aria-live="polite"></p>
      <div id="examCollections"></div>
      <p class="exam-library-note">An independent learning library by Rafis Sprachwelt. Exam names identify the collection; they do not imply affiliation or endorsement.</p>
    </section>`;
    updateResults();
  }

  function updateResults() {
    if (!user) return;
    const provider = EXAM_PROVIDERS.find(item => item.id === state.provider);
    const selected = filterMaterials(materials, state);
    const collection = filterMaterials(materials, { ...state, category: "all", query: "" });
    root.querySelector("#examCollectionTitle").textContent = `${provider.name} · ${state.level}`;
    root.querySelector("#examResultCount").textContent = `${selected.length} ${selected.length === 1 ? "material" : "materials"}${state.query || state.category !== "all" ? " found" : " available"}`;
    root.querySelectorAll("[data-provider]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.provider === state.provider)));
    root.querySelectorAll("[data-level]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.level === state.level)));
    const categories = EXAM_CATEGORIES.filter(category => state.category === "all" || category.id === state.category);
    const filtering = Boolean(state.query.trim() || state.category !== "all");
    root.querySelector("#examCollections").innerHTML = `${collection.length ? "" : `<div class="exam-coming"><i class="fa-solid fa-layer-group" aria-hidden="true"></i><div><strong>This collection is taking shape.</strong><p>Materials for ${provider.name} ${state.level} haven’t been added yet. The sections below are ready for new PDFs, books and study resources.</p></div></div>`}
      ${filtering && !selected.length ? `<div class="exam-empty"><h3>No matching materials yet</h3><p>Try a different search, level or material type.</p><button type="button" class="exam-secondary" data-exam-action="reset">Clear filters</button></div>` : `<div class="exam-category-grid">${categories.filter(category => !state.query.trim() || selected.some(item => item.category === category.id)).map(category => {
        const items = selected.filter(item => item.category === category.id);
        return `<section class="exam-category-card" aria-labelledby="category-${category.id}"><div class="exam-card-top"><span class="exam-category-icon"><i class="fa-solid fa-${category.icon}" aria-hidden="true"></i></span><span class="exam-count">${items.length ? `${items.length} available` : "Coming soon"}</span></div><h3 id="category-${category.id}">${category.title}</h3><p>${category.description}</p>
          ${items.length ? `<ul class="exam-material-list">${items.map(item => `<li><div><strong>${escapeHtml(item.title)}</strong>${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}<span>${escapeHtml(item.storagePath.split(".").pop().toUpperCase())}${item.edition ? ` · ${escapeHtml(item.edition)}` : ""}</span></div><button type="button" class="exam-secondary" data-download="${escapeHtml(item.id)}" aria-label="Download ${escapeHtml(item.title)}">Download <span aria-hidden="true">↓</span></button></li>`).join("")}</ul>` : `<span class="exam-awaiting">No materials added yet</span>`}</section>`;
      }).join("")}</div>`}`;
  }

  async function onClick(event) {
    const button = event.target.closest("button");
    if (!button || !root.contains(button)) return;
    if (button.dataset.examAction === "login") { openLogin(); return; }
    if (button.dataset.examAction === "retry") { location.reload(); return; }
    if (!user) return;
    if (button.dataset.provider) { state.provider = button.dataset.provider; updateResults(); }
    if (button.dataset.level) { state.level = button.dataset.level; updateResults(); }
    if (button.dataset.examAction === "reset") {
      state.query = ""; state.category = "all";
      root.querySelector("#examSearch").value = ""; root.querySelector("#examCategory").value = "all";
      updateResults();
    }
    if (!button.dataset.download) return;
    const item = filterMaterials(materials, state).find(entry => entry.id === button.dataset.download);
    if (!item) return;
    const requestGeneration = generation;
    const uid = user.uid;
    button.disabled = true;
    const status = root.querySelector("#examDownloadStatus");
    status.textContent = `Preparing ${item.title}…`;
    try {
      const blob = await download(item, user);
      if (!user || user.uid !== uid || generation !== requestGeneration) return;
      const url = URL.createObjectURL(blob);
      objectUrls.add(url);
      const link = document.createElement("a");
      link.href = url; link.download = item.storagePath.split("/").pop();
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => { URL.revokeObjectURL(url); objectUrls.delete(url); }, 60000);
      status.textContent = "Your download is ready. Check your browser’s downloads.";
    } catch {
      if (user && generation === requestGeneration) status.textContent = "This file couldn’t be downloaded. Check your connection and try again. If it continues, the material may not be available yet.";
    } finally { button.disabled = false; }
  }

  function onFilter(event) {
    if (!user) return;
    if (event.target.id === "examSearch") { state.query = event.target.value; updateResults(); }
    if (event.target.id === "examCategory") { state.category = event.target.value; updateResults(); }
  }

  root.addEventListener("click", onClick);
  root.addEventListener("input", onFilter);
  root.addEventListener("change", onFilter);
  const timeout = setTimeout(() => { if (!resolved) showGate("We couldn’t confirm your login. Check your connection and try again.", true); }, 12000);
  try {
    unsubscribe = subscribe(nextUser => {
      resolved = true; clearTimeout(timeout); generation++; revokeDownloads();
      user = nextUser?.emailVerified ? nextUser : null;
      user ? showLibrary() : showGate();
    });
  } catch {
    clearTimeout(timeout);
    showGate("Login is temporarily unavailable. Please try again.", true);
  }
  return () => {
    generation++; user = null; clearTimeout(timeout); unsubscribe?.(); revokeDownloads();
    root.removeEventListener("click", onClick); root.removeEventListener("input", onFilter); root.removeEventListener("change", onFilter);
    root.replaceChildren();
  };
}
