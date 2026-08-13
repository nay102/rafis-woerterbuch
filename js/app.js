import { initUI } from "./ui.js";
import { initRafiTutor } from "./rafi-tutor.js";

let deferredInstallPrompt = null;

// Capture Chrome's one-time install event as early as possible. Waiting for the
// rest of the app to initialize can miss this event on slower mobile devices.
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  setInstallButtonsVisible(true);
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  setInstallButtonsVisible(false);
});

// Keep users inside the working offline app instead of opening a browser error
// for destinations that inherently require an internet connection.
document.addEventListener("click", event => {
  if (navigator.onLine) return;
  const externalLink = event.target.closest?.('a[href^="http://"], a[href^="https://"]');
  if (!externalLink) return;
  event.preventDefault();
  window.alert("This external link needs an internet connection. The rest of the app remains available offline.");
});

function getBasePath() {
  const { hostname, pathname } = window.location;
  if (hostname.endsWith("github.io")) {
    const parts = pathname.split("/").filter(Boolean);
    return parts.length ? `/${parts[0]}/` : "/";
  }
  return "/";
}

function isStandaloneMode() {
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true
  );
}

function setInstallButtonsVisible(visible) {
  const desktopInstallBtn = document.getElementById("desktopInstallBtn");
  const panelInstallBtn = document.getElementById("panelInstallBtn");
  const show = visible && !isStandaloneMode();
  [desktopInstallBtn, panelInstallBtn].forEach(btn => {
    if (!btn) return;
    btn.classList.toggle("hidden", !show);
  });
}

async function triggerInstallPrompt() {
  if (!deferredInstallPrompt) {
    setInstallButtonsVisible(false);
    return;
  }
  const promptEvent = deferredInstallPrompt;
  deferredInstallPrompt = null;
  setInstallButtonsVisible(false);
  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice?.outcome === "accepted") return;
    // A dismissed prompt cannot be reused. Chrome may provide a new event on a
    // future visit, at which point the early listener will show the button again.
  } catch {
    // Keep the unavailable control hidden if Chrome withdraws the prompt.
  }
}

function setupInstallPromptUI() {
  const desktopInstallBtn = document.getElementById("desktopInstallBtn");
  const panelInstallBtn = document.getElementById("panelInstallBtn");

  // Only show the control after Chrome confirms this page is installable.
  setInstallButtonsVisible(Boolean(deferredInstallPrompt));

  desktopInstallBtn?.addEventListener("click", triggerInstallPrompt);
  panelInstallBtn?.addEventListener("click", triggerInstallPrompt);
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const swUrl = `${getBasePath()}sw.js`;
    const registration = await navigator.serviceWorker.register(swUrl);
    setupSwUpdatePrompt(registration);
  } catch (error) {
    console.error("Service worker registration failed:", error);
  }
}

function createUpdateBanner() {
  const existing = document.getElementById("swUpdateBanner");
  if (existing) return existing;

  const banner = document.createElement("div");
  banner.id = "swUpdateBanner";
  banner.style.position = "fixed";
  banner.style.left = "50%";
  banner.style.bottom = "16px";
  banner.style.transform = "translateX(-50%)";
  banner.style.zIndex = "12000";
  banner.style.background = "#0f172a";
  banner.style.color = "#ffffff";
  banner.style.padding = "10px 12px";
  banner.style.borderRadius = "10px";
  banner.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
  banner.style.display = "none";
  banner.style.alignItems = "center";
  banner.style.gap = "10px";
  banner.style.fontSize = "13px";
  banner.style.maxWidth = "min(92vw, 420px)";
  banner.innerHTML = `
    <span>A new version is available.</span>
    <button id="swUpdateReloadBtn" type="button" style="
      border:none;
      background:#2563eb;
      color:#fff;
      border-radius:8px;
      padding:6px 10px;
      font-weight:600;
      cursor:pointer;
    ">Refresh</button>
  `;
  document.body.appendChild(banner);
  return banner;
}

function showUpdatePrompt(worker) {
  const banner = createUpdateBanner();
  const refreshBtn = document.getElementById("swUpdateReloadBtn");
  if (!banner || !refreshBtn) return;
  banner.style.display = "flex";
  refreshBtn.onclick = () => {
    worker.postMessage({ type: "SKIP_WAITING" });
  };
}

function setupSwUpdatePrompt(registration) {
  if (!registration) return;

  if (registration.waiting) {
    showUpdatePrompt(registration.waiting);
  }

  registration.addEventListener("updatefound", () => {
    const newWorker = registration.installing;
    if (!newWorker) return;
    newWorker.addEventListener("statechange", () => {
      if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
        showUpdatePrompt(newWorker);
      }
    });
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initUI();
    initRafiTutor();
    setupInstallPromptUI();
    await registerServiceWorker();
  } catch (error) {
    console.error("App init error:", error);
  }
});
