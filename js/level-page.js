const SETTINGS_KEY = "rw_app_settings_v1";
const AUTH_CACHE_EMAIL_KEY = "rw_cached_email";
let authApiPromise = null;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSettings() {
  try {
    return { theme: "system", ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) };
  } catch {
    return { theme: "system" };
  }
}

function saveTheme(theme) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...getSettings(), theme }));
  applyTheme();
}

function applyTheme() {
  const theme = getSettings().theme;
  const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && systemDark);
  document.body.classList.toggle("dark", isDark);

  const panelThemeToggle = document.getElementById("panelDarkToggle");
  if (panelThemeToggle) {
    panelThemeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
    panelThemeToggle.setAttribute(
      "aria-label",
      isDark ? "Switch to Light Mode" : "Switch to Dark Mode"
    );
  }
}

function setLoginButton(email = "") {
  const loginBtn = document.getElementById("loginBtn");
  const panelLoginBtn = document.getElementById("panelLoginBtn");
  if (!loginBtn) return;

  if (email) {
    loginBtn.innerHTML = '<span class="profile-avatar-icon" aria-hidden="true"></span>';
    loginBtn.classList.add("profile-btn");
    loginBtn.setAttribute("aria-label", "Open user profile");
    loginBtn.title = email;
    if (panelLoginBtn) panelLoginBtn.textContent = "Profile";
    return;
  }

  loginBtn.textContent = "Login";
  loginBtn.classList.remove("profile-btn");
  loginBtn.removeAttribute("title");
  loginBtn.setAttribute("aria-label", "Login");
  if (panelLoginBtn) panelLoginBtn.textContent = "Login";
}

function loadAuthApi() {
  if (!authApiPromise) {
    authApiPromise = import("./auth.js").catch(() => null);
  }
  return authApiPromise;
}

async function logoutSafely() {
  const authApi = await loadAuthApi();
  if (authApi?.logout) {
    await authApi.logout();
  }
  localStorage.removeItem(AUTH_CACHE_EMAIL_KEY);
}

function ensureProfileModal() {
  let modal = document.getElementById("userInfoModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "userInfoModal";
  modal.className = "hidden modal-overlay";
  modal.innerHTML = `
    <div class="modal-box user-modal-box">
      <span id="closeUserInfo" class="close-btn">✖</span>
      <h2>👤 User Profile</h2>
      <div id="userInfoContent" class="user-info-content"></div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector("#closeUserInfo")?.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.classList.add("hidden");
  });
  return modal;
}

function openProfile(user, homeUrl) {
  const modal = ensureProfileModal();
  const content = modal.querySelector("#userInfoContent");
  const email = user?.email || localStorage.getItem(AUTH_CACHE_EMAIL_KEY) || "";
  const displayName = email ? email.split("@")[0] : "User";
  const safeEmail = escapeHtml(email);
  const safeDisplayName = escapeHtml(displayName);

  content.innerHTML = `
    <div class="user-card-head">
      <div class="user-avatar-large">👤</div>
      <div>
        <h3>${safeDisplayName}</h3>
        <p>${safeEmail || "Signed in"}</p>
      </div>
    </div>
    <div class="user-info-row"><strong>Status:</strong> Logged in</div>
    <div class="user-info-row"><strong>Email:</strong> ${safeEmail || "-"}</div>
    <div class="user-action-row">
      <button id="courseSettingsBtn" type="button" class="user-action-btn">Open Settings</button>
      <button id="courseLogoutBtn" type="button" class="danger-btn">Logout</button>
    </div>
  `;

  content.querySelector("#courseSettingsBtn")?.addEventListener("click", () => {
    window.location.href = `${homeUrl}?page=settings`;
  });
  content.querySelector("#courseLogoutBtn")?.addEventListener("click", async () => {
    await logoutSafely();
    localStorage.removeItem(AUTH_CACHE_EMAIL_KEY);
    setLoginButton("");
    modal.classList.add("hidden");
  });
  modal.classList.remove("hidden");
}

export function initLevelPage() {
  const homeUrl = "../index.html";
  const desktopBtn = document.getElementById("desktopMenuBtn");
  const mobileBtn = document.getElementById("mobileMenuBtn");
  const desktopPanel = document.getElementById("desktopSidePanel");
  const mobilePanel = document.getElementById("mobileSidePanel");
  const darkToggle = document.getElementById("darkToggle");
  let currentUser = null;

  function syncSidePanelState() {
    const isOpen = Boolean(
      desktopPanel?.classList.contains("active") ||
      mobilePanel?.classList.contains("active")
    );
    document.body.classList.toggle("level-side-panel-open", isOpen);
  }

  function closePanels() {
    desktopPanel?.classList.remove("active");
    mobilePanel?.classList.remove("active");
    desktopBtn?.classList.remove("is-active");
    mobileBtn?.classList.remove("is-active");
    desktopBtn?.setAttribute("aria-expanded", "false");
    mobileBtn?.setAttribute("aria-expanded", "false");
    syncSidePanelState();
  }

  function openMainPage(page) {
    if (!page || page === "home") {
      window.location.href = homeUrl;
      return;
    }
    if (page === "logout") {
      logoutSafely().finally(() => {
        localStorage.removeItem(AUTH_CACHE_EMAIL_KEY);
        window.location.href = homeUrl;
      });
      return;
    }
    window.location.href = `${homeUrl}?page=${encodeURIComponent(page)}`;
  }

  applyTheme();
  setLoginButton(localStorage.getItem(AUTH_CACHE_EMAIL_KEY) || "");
  loadAuthApi().then((authApi) => {
    authApi?.listenAuth?.((user) => {
      currentUser = user || null;
      if (user?.email) {
        localStorage.setItem(AUTH_CACHE_EMAIL_KEY, user.email);
        setLoginButton(user.email);
        return;
      }
      setLoginButton(localStorage.getItem(AUTH_CACHE_EMAIL_KEY) || "");
    });
  });

  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", applyTheme);
  document.getElementById("logoHome")?.addEventListener("click", () => openMainPage("home"));
  document.getElementById("titleHome")?.classList.add("clickable-title");
  darkToggle?.addEventListener("click", () => {
    saveTheme(document.body.classList.contains("dark") ? "light" : "dark");
  });
  document.getElementById("panelDarkToggle")?.addEventListener("click", () => darkToggle?.click());

  document.getElementById("loginBtn")?.addEventListener("click", () => {
    if (currentUser || localStorage.getItem(AUTH_CACHE_EMAIL_KEY)) {
      openProfile(currentUser, homeUrl);
      return;
    }
    window.location.href = homeUrl;
  });
  document.getElementById("panelLoginBtn")?.addEventListener("click", () => {
    closePanels();
    document.getElementById("loginBtn")?.click();
  });

  desktopBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    mobilePanel?.classList.remove("active");
    desktopPanel?.classList.toggle("active");
    desktopBtn.classList.toggle("is-active", desktopPanel?.classList.contains("active"));
    desktopBtn.setAttribute("aria-expanded", String(desktopPanel?.classList.contains("active")));
    syncSidePanelState();
  });
  mobileBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    desktopPanel?.classList.remove("active");
    mobilePanel?.classList.toggle("active");
    mobileBtn.classList.toggle("is-active", mobilePanel?.classList.contains("active"));
    mobileBtn.setAttribute("aria-expanded", String(mobilePanel?.classList.contains("active")));
    syncSidePanelState();
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".desktop-side-panel, .mobile-side-panel, .desktop-menu-btn, .mobile-menu-btn")) {
      closePanels();
    }
  });
  document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      closePanels();
      openMainPage(button.dataset.page);
    });
  });
  document.querySelectorAll("[data-footer-page]").forEach(button => {
    button.addEventListener("click", () => openMainPage(button.dataset.footerPage));
  });
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}
