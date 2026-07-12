import "./firebase.js";
import { initUI } from "./ui.js";

let deferredInstallPrompt = null;

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
    window.alert(
      "Install prompt is not available right now.\n\nDesktop (Chrome/Edge): use browser menu -> Install app.\nAndroid Chrome: menu -> Add to Home screen."
    );
    return;
  }
  const promptEvent = deferredInstallPrompt;
  deferredInstallPrompt = null;
  promptEvent.prompt();
  try {
    const choice = await promptEvent.userChoice;
    if (choice?.outcome !== "accepted") {
      // User dismissed. Wait for browser to offer again.
    }
  } finally {
    // Keep button visible for consistent UX; browser can re-offer later.
    setInstallButtonsVisible(true);
  }
}

function setupInstallPromptUI() {
  const desktopInstallBtn = document.getElementById("desktopInstallBtn");
  const panelInstallBtn = document.getElementById("panelInstallBtn");

  // Keep install button consistently visible when app is not installed.
  setInstallButtonsVisible(true);

  desktopInstallBtn?.addEventListener("click", triggerInstallPrompt);
  panelInstallBtn?.addEventListener("click", triggerInstallPrompt);

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    setInstallButtonsVisible(true);
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    setInstallButtonsVisible(false);
  });
}

function showAppWelcomeMessage() {
  if (!isStandaloneMode()) return;
  const shownKey = "rw_app_welcome_shown";
  if (sessionStorage.getItem(shownKey) === "1") return;
  sessionStorage.setItem(shownKey, "1");

  const welcome = document.createElement("div");
  welcome.id = "appWelcomeToast";
  welcome.textContent = "Willkommen bei Rafi's Wörterbuch 👋";
  welcome.style.position = "fixed";
  welcome.style.left = "50%";
  welcome.style.top = "16px";
  welcome.style.transform = "translateX(-50%) translateY(-10px)";
  welcome.style.zIndex = "12050";
  welcome.style.background = "linear-gradient(135deg, #0f172a, #1d4ed8)";
  welcome.style.color = "#ffffff";
  welcome.style.padding = "10px 14px";
  welcome.style.borderRadius = "12px";
  welcome.style.fontSize = "13px";
  welcome.style.fontWeight = "600";
  welcome.style.boxShadow = "0 10px 24px rgba(0,0,0,0.28)";
  welcome.style.opacity = "0";
  welcome.style.transition = "opacity 0.28s ease, transform 0.28s ease";
  document.body.appendChild(welcome);

  requestAnimationFrame(() => {
    welcome.style.opacity = "1";
    welcome.style.transform = "translateX(-50%) translateY(0)";
  });

  setTimeout(() => {
    welcome.style.opacity = "0";
    welcome.style.transform = "translateX(-50%) translateY(-8px)";
    setTimeout(() => welcome.remove(), 300);
  }, 2000);
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const swUrl = `${getBasePath()}sw.js`;
    const registration = await navigator.serviceWorker.register(swUrl);
    console.log("Service worker registered");
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
    setupInstallPromptUI();
    showAppWelcomeMessage();
    await registerServiceWorker();
    console.log("App initialized successfully");
  } catch (error) {
    console.error("App init error:", error);
  }
});
