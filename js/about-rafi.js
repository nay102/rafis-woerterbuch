import "./app.js";
import { panelPageContent, ABOUT_RAFI_PAGE_COPY } from "./site-content.js";

const root = document.getElementById("aboutRafiPage");
let language = "en";
const expanded = new Set();
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[character]);
const assetUrl = path => new URL(`../${path}`, import.meta.url).href;
const getPage = () => language === "de" ? ABOUT_RAFI_PAGE_COPY.de : panelPageContent.owner;

function updateButton(button, index) {
  const page = getPage();
  const isExpanded = expanded.has(index);
  const label = isExpanded
    ? (language === "de" ? "Weniger anzeigen" : "Show less")
    : page.readMoreLabel;
  button.setAttribute("aria-expanded", String(isExpanded));
  button.setAttribute("aria-label", `${label}: ${page.cards[index].title}`);
  button.textContent = label;
}

// Translate in place so photos, expanded cards and keyboard focus survive.
function updateLanguage() {
  const page = getPage();
  root.lang = language;
  document.title = `${language === "de" ? "Über Rafi" : "About Rafi"} | Rafis Sprachwelt`;
  root.querySelector("h1").textContent = page.title;
  root.querySelector(".panel-page-description").textContent = page.description;
  root.querySelector(".panel-page-footer").textContent = page.footer;
  const toggle = document.getElementById("aboutRafiLanguageToggle");
  toggle.textContent = page.toggleLabel;
  toggle.lang = language === "en" ? "de" : "en";
  toggle.setAttribute("aria-label", language === "en" ? "Auf Deutsch lesen" : "Read in English");
  root.querySelectorAll(".panel-page-card").forEach((card, index) => {
    card.querySelector("h2").textContent = page.cards[index].title;
    card.querySelector("img").alt = page.cards[index].photo;
    card.querySelector(".panel-card-body").textContent = page.cards[index].body;
    updateButton(card.querySelector("button"), index);
  });
}

function render() {
  const page = language === "de" ? ABOUT_RAFI_PAGE_COPY.de : panelPageContent.owner;
  root.lang = language;
  root.innerHTML = `
    <div class="panel-page-wrap">
      <div class="panel-hero-image" role="img" aria-label="Md Rafikul Islam — Rafi" style="background-image:url('${escapeHtml(assetUrl(page.image))}'); --photo-position:${escapeHtml(page.imagePosition)}"></div>
      <div class="panel-page-content">
        <div class="panel-page-heading">
          <h1>${escapeHtml(page.title)}</h1>
          <button id="aboutRafiLanguageToggle" class="panel-language-toggle" type="button" lang="${language === "en" ? "de" : "en"}" aria-label="${language === "en" ? "Auf Deutsch lesen" : "Read in English"}">${escapeHtml(page.toggleLabel)}</button>
        </div>
        <p class="panel-page-description">${escapeHtml(page.description)}</p>
        <div class="panel-page-cards">
          ${page.cards.map((card, index) => `
            <article class="panel-page-card ${expanded.has(index) ? "is-expanded" : "is-collapsed"}">
              <img class="panel-page-photo" src="${escapeHtml(assetUrl(card.image))}" alt="${escapeHtml(card.photo)}" loading="lazy" style="--photo-position:${escapeHtml(card.imagePosition || "center")}">
              <h2>${escapeHtml(card.title)}</h2>
              <p class="panel-card-body" id="aboutRafiCard${index}">${escapeHtml(card.body)}</p>
              <button class="panel-card-read-more" type="button" data-panel-read-more="${index}" aria-controls="aboutRafiCard${index}" aria-expanded="${expanded.has(index)}">${expanded.has(index) ? (language === "de" ? "Weniger anzeigen" : "Show less") : escapeHtml(page.readMoreLabel)}</button>
            </article>`).join("")}
        </div>
        <footer class="panel-page-footer">${escapeHtml(page.footer)}</footer>
      </div>
    </div>`;
}

root.addEventListener("click", event => {
  if (event.target.closest("#aboutRafiLanguageToggle")) {
    language = language === "en" ? "de" : "en";
    updateLanguage();
    return;
  }
  const button = event.target.closest("[data-panel-read-more]");
  if (!button) return;
  const index = Number(button.dataset.panelReadMore);
  expanded.has(index) ? expanded.delete(index) : expanded.add(index);
  const isExpanded = expanded.has(index);
  button.closest("article").classList.toggle("is-expanded", isExpanded);
  button.closest("article").classList.toggle("is-collapsed", !isExpanded);
  updateButton(button, index);
  // A long collapsed story can otherwise leave its focused control offscreen.
  if (!isExpanded) {
    const bounds = button.getBoundingClientRect();
    if (bounds.top < 0 || bounds.bottom > window.innerHeight) {
      button.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }
});

render();
updateLanguage();
